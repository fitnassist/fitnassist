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
};
