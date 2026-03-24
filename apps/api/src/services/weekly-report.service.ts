import { prisma } from '../lib/prisma';
import { sendEmail } from '../lib/email';
import { emailTemplates } from '../lib/email-templates';
import { diaryRepository } from '../repositories/diary.repository';
import { goalRepository } from '../repositories/goal.repository';

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const weeklyReportService = {
  async sendWeeklyReports() {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - 1); // Yesterday (Sunday)
    weekEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6); // 7 days back (Monday)
    weekStart.setHours(0, 0, 0, 0);

    // Find all trainers with weekly report enabled
    const trainers = await prisma.user.findMany({
      where: {
        role: 'TRAINER',
        emailNotifyWeeklyReport: true,
      },
      include: {
        trainerProfile: {
          include: {
            clientRoster: {
              where: {
                status: { in: ['ACTIVE', 'ONBOARDING'] },
              },
              include: {
                connection: {
                  select: {
                    name: true,
                    senderId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    let sentCount = 0;

    for (const trainer of trainers) {
      const profile = trainer.trainerProfile;
      if (!profile || profile.clientRoster.length === 0) continue;

      const clientSummaries: Array<{
        name: string;
        diaryEntries: number;
        weightEntries: number;
        foodEntries: number;
        exerciseEntries: number;
        goalsCompleted: number;
        totalGoals: number;
      }> = [];

      for (const rosterEntry of profile.clientRoster) {
        const clientUserId = rosterEntry.connection.senderId;
        if (!clientUserId) continue;

        // Get diary entries for the week
        const entries = await diaryRepository.findEntriesByDateRange(
          clientUserId,
          weekStart,
          weekEnd,
        );

        const weightEntries = entries.filter((e) => e.type === 'WEIGHT').length;
        const foodEntries = entries.filter((e) => e.type === 'FOOD').length;
        const exerciseEntries = entries.filter((e) => e.type === 'WORKOUT_LOG').length;

        // Get goals data
        const completedGoals = await goalRepository.findCompletedInRange(
          clientUserId,
          weekStart,
          weekEnd,
        );
        const activeGoalCount = await goalRepository.countActiveGoals(clientUserId);

        clientSummaries.push({
          name: rosterEntry.connection.name,
          diaryEntries: entries.length,
          weightEntries,
          foodEntries,
          exerciseEntries,
          goalsCompleted: completedGoals.length,
          totalGoals: activeGoalCount + completedGoals.length,
        });
      }

      // Skip if no clients had any activity at all
      const hasAnyActivity = clientSummaries.some((c) => c.diaryEntries > 0 || c.goalsCompleted > 0);
      if (!hasAnyActivity && clientSummaries.length === 0) continue;

      const html = emailTemplates.weeklyReport({
        trainerName: trainer.name,
        weekStart: formatDate(weekStart),
        weekEnd: formatDate(weekEnd),
        clients: clientSummaries,
      });

      const subject = `Weekly Client Report — ${formatDate(weekStart)} – ${formatDate(weekEnd)}`;

      await sendEmail({
        to: trainer.email,
        subject,
        html,
      });

      sentCount++;
    }

    return { sentCount };
  },

  async sendClientWeeklyReports() {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - 1); // Yesterday (Sunday)
    weekEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6); // 7 days back (Monday)
    weekStart.setHours(0, 0, 0, 0);

    // Previous week for weight comparison
    const prevWeekEnd = new Date(weekStart);
    prevWeekEnd.setMilliseconds(prevWeekEnd.getMilliseconds() - 1);
    const prevWeekStart = new Date(prevWeekEnd);
    prevWeekStart.setDate(prevWeekStart.getDate() - 6);
    prevWeekStart.setHours(0, 0, 0, 0);

    // Find all trainees with weekly report enabled
    const trainees = await prisma.user.findMany({
      where: {
        role: 'TRAINEE',
        emailNotifyWeeklyReport: true,
      },
    });

    let sentCount = 0;

    for (const trainee of trainees) {
      // Get diary entries for the week
      const entries = await diaryRepository.findEntriesByDateRange(
        trainee.id,
        weekStart,
        weekEnd,
      );

      // Get goals data
      const completedGoals = await goalRepository.findCompletedInRange(
        trainee.id,
        weekStart,
        weekEnd,
      );
      const activeGoalCount = await goalRepository.countActiveGoals(trainee.id);

      // Skip trainees with zero diary entries AND zero goals completed
      if (entries.length === 0 && completedGoals.length === 0) continue;

      // Count entries by type
      const foodEntries = entries.filter((e) => e.type === 'FOOD').length;
      const workoutEntries = entries.filter((e) => e.type === 'WORKOUT_LOG').length;
      const waterEntries = entries.filter((e) => e.type === 'WATER').length;
      const stepsEntries = entries.filter((e) => e.type === 'STEPS').length;
      const sleepEntries = entries.filter((e) => e.type === 'SLEEP').length;

      // Weight comparison
      const thisWeekWeightEntries = entries
        .filter((e) => e.type === 'WEIGHT' && e.weightEntry)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      let weightChange: { current: number; previous: number; unit: string } | null = null;

      const latestWeightEntry = thisWeekWeightEntries[0];
      if (latestWeightEntry && latestWeightEntry.weightEntry) {
        const currentWeight = Number(latestWeightEntry.weightEntry.weightKg);

        // Get previous week weight entries
        const prevWeekEntries = await diaryRepository.findEntriesByDateRange(
          trainee.id,
          prevWeekStart,
          prevWeekEnd,
          'WEIGHT',
        );
        const prevWeightEntry = prevWeekEntries
          .filter((e) => e.weightEntry)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        const previousWeight = prevWeightEntry?.weightEntry
          ? Number(prevWeightEntry.weightEntry.weightKg)
          : currentWeight;

        weightChange = {
          current: currentWeight,
          previous: previousWeight,
          unit: 'kg',
        };
      }

      // Calculate streak: consecutive days with at least one entry, backwards from weekEnd
      const streakLookbackStart = new Date(weekEnd);
      streakLookbackStart.setDate(streakLookbackStart.getDate() - 13); // 14 days total
      streakLookbackStart.setHours(0, 0, 0, 0);

      const streakEntries = await diaryRepository.findEntriesByDateRange(
        trainee.id,
        streakLookbackStart,
        weekEnd,
      );

      const daysWithEntries = new Set<string>();
      for (const entry of streakEntries) {
        const dateStr = new Date(entry.date).toISOString().split('T')[0] ?? '';
        daysWithEntries.add(dateStr);
      }

      let streak = 0;
      const checkDate = new Date(weekEnd);
      checkDate.setHours(0, 0, 0, 0);
      while (daysWithEntries.has(checkDate.toISOString().split('T')[0] ?? '')) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }

      const html = emailTemplates.clientWeeklyProgress({
        clientName: trainee.name,
        weekStart: formatDate(weekStart),
        weekEnd: formatDate(weekEnd),
        weightChange,
        diaryStats: {
          totalEntries: entries.length,
          foodEntries,
          workoutEntries,
          waterEntries,
          stepsEntries,
          sleepEntries,
        },
        goalsCompleted: completedGoals.length,
        activeGoals: activeGoalCount,
        streak,
      });

      const subject = `Your Weekly Progress — ${formatDate(weekStart)} – ${formatDate(weekEnd)}`;

      await sendEmail({
        to: trainee.email,
        subject,
        html,
      });

      sentCount++;
    }

    return { sentCount };
  },
};
