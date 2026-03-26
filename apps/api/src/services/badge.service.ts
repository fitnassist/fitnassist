import { ALL_BADGES, BADGE_MAP } from '@fitnassist/schemas';
import type { BadgeTrigger } from '@fitnassist/schemas';
import { prisma } from '../lib/prisma';
import { sseManager } from '../lib/sse';
import { inAppNotificationService } from './in-app-notification.service';
import { clientRosterRepository } from '../repositories/client-roster.repository';

// ============================================================================
// CRITERIA CHECKERS
// Each returns a Set of badge IDs the user qualifies for
// ============================================================================

const checkDiaryEntryCriteria = async (userId: string): Promise<Set<string>> => {
  const earned = new Set<string>();

  // Total entry count
  const totalEntries = await prisma.diaryEntry.count({ where: { userId } });
  if (totalEntries >= 10) earned.add('entries_10');
  if (totalEntries >= 50) earned.add('entries_50');
  if (totalEntries >= 100) earned.add('entries_100');
  if (totalEntries >= 500) earned.add('entries_500');
  if (totalEntries >= 1000) earned.add('entries_1000');

  // Diary streak
  const streak = await calculateCurrentStreak(userId);
  if (streak >= 3) earned.add('streak_3');
  if (streak >= 7) earned.add('streak_7');
  if (streak >= 14) earned.add('streak_14');
  if (streak >= 30) earned.add('streak_30');
  if (streak >= 60) earned.add('streak_60');
  if (streak >= 90) earned.add('streak_90');
  if (streak >= 365) earned.add('streak_365');

  // Early bird — entries created before 8am
  const earlyEntries = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM diary_entries
    WHERE "userId" = ${userId} AND EXTRACT(HOUR FROM "createdAt") < 8
  `;
  const earlyCount = Number(earlyEntries[0]?.count ?? 0);
  if (earlyCount >= 1) earned.add('early_bird_1');
  if (earlyCount >= 30) earned.add('early_bird_30');

  // Diary type variety
  const typeCounts = await prisma.diaryEntry.groupBy({
    by: ['type'],
    where: { userId },
    _count: { id: true },
  });
  const typesUsed = typeCounts.length;
  if (typesUsed >= 3) earned.add('diary_types_3');
  if (typesUsed >= 5) earned.add('diary_types_5');
  if (typesUsed >= 10) earned.add('diary_types_all');

  // Workout count
  const workoutCount = await prisma.diaryEntry.count({
    where: { userId, type: 'WORKOUT_LOG' },
  });
  if (workoutCount >= 1) earned.add('workout_1');
  if (workoutCount >= 10) earned.add('workout_10');
  if (workoutCount >= 25) earned.add('workout_25');
  if (workoutCount >= 50) earned.add('workout_50');
  if (workoutCount >= 100) earned.add('workout_100');
  if (workoutCount >= 250) earned.add('workout_250');

  // Steps — cumulative total
  const stepsResult = await prisma.stepsEntry.aggregate({
    where: { diaryEntry: { userId } },
    _sum: { totalSteps: true },
  });
  const totalSteps = stepsResult._sum.totalSteps ?? 0;
  if (totalSteps >= 100000) earned.add('steps_100k');
  if (totalSteps >= 500000) earned.add('steps_500k');
  if (totalSteps >= 1000000) earned.add('steps_1m');

  // Steps — single day max
  const maxSteps = await prisma.stepsEntry.aggregate({
    where: { diaryEntry: { userId } },
    _max: { totalSteps: true },
  });
  const maxDaySteps = maxSteps._max.totalSteps ?? 0;
  if (maxDaySteps >= 10000) earned.add('steps_10k_day');
  if (maxDaySteps >= 20000) earned.add('steps_20k_day');

  // Activity distance — cumulative
  const distResult = await prisma.activityEntry.aggregate({
    where: { diaryEntry: { userId } },
    _sum: { distanceKm: true },
  });
  const totalDist = distResult._sum.distanceKm ?? 0;
  if (totalDist >= 10) earned.add('distance_10k');
  if (totalDist >= 42.2) earned.add('distance_42k');
  if (totalDist >= 100) earned.add('distance_100k');
  if (totalDist >= 500) earned.add('distance_500k');
  if (totalDist >= 1000) earned.add('distance_1000k');

  // Activity type variety
  const activityTypes = await prisma.activityEntry.findMany({
    where: { diaryEntry: { userId } },
    select: { activityType: true },
    distinct: ['activityType'],
  });
  if (activityTypes.length >= 3) earned.add('activity_types_3');
  if (activityTypes.length >= 6) earned.add('activity_types_all'); // All ActivityType values

  // Food entries
  const foodCount = await prisma.diaryEntry.count({
    where: { userId, type: 'FOOD' },
  });
  if (foodCount >= 1) earned.add('food_1');
  if (foodCount >= 50) earned.add('food_50');
  if (foodCount >= 100) earned.add('food_100');
  if (foodCount >= 500) earned.add('food_500');

  // Water entries
  const waterCount = await prisma.diaryEntry.count({
    where: { userId, type: 'WATER' },
  });
  if (waterCount >= 1) earned.add('water_1');

  // Water — single day max
  const maxWater = await prisma.waterEntry.aggregate({
    where: { diaryEntry: { userId } },
    _max: { totalMl: true },
  });
  const maxDayWater = maxWater._max.totalMl ?? 0;
  if (maxDayWater >= 2000) earned.add('water_2l_day');
  if (maxDayWater >= 3000) earned.add('water_3l_day');

  // Water streak
  const waterStreak = await calculateTypeStreak(userId, 'WATER');
  if (waterStreak >= 7) earned.add('water_streak_7');
  if (waterStreak >= 30) earned.add('water_streak_30');

  // Weight entries
  const weightCount = await prisma.diaryEntry.count({
    where: { userId, type: 'WEIGHT' },
  });
  if (weightCount >= 1) earned.add('weight_1');
  const weightStreak = await calculateTypeStreak(userId, 'WEIGHT');
  if (weightStreak >= 7) earned.add('weight_streak_7');

  // Sleep entries
  const sleepCount = await prisma.diaryEntry.count({
    where: { userId, type: 'SLEEP' },
  });
  if (sleepCount >= 1) earned.add('sleep_1');
  if (sleepCount >= 30) earned.add('sleep_30');

  // Sleep 8+ hours
  const goodSleep = await prisma.sleepEntry.count({
    where: { diaryEntry: { userId }, hoursSlept: { gte: 8 } },
  });
  if (goodSleep >= 1) earned.add('sleep_8h');

  // Mood entries
  const moodCount = await prisma.diaryEntry.count({
    where: { userId, type: 'MOOD' },
  });
  if (moodCount >= 1) earned.add('mood_1');

  const greatMoods = await prisma.moodEntry.count({
    where: { diaryEntry: { userId }, level: 'GREAT' },
  });
  if (greatMoods >= 7) earned.add('mood_great_7');

  const moodStreak = await calculateTypeStreak(userId, 'MOOD');
  if (moodStreak >= 30) earned.add('mood_streak_30');

  // Measurement entries
  const measurementCount = await prisma.diaryEntry.count({
    where: { userId, type: 'MEASUREMENT' },
  });
  if (measurementCount >= 1) earned.add('measurement_1');

  // Progress photos
  const photoCount = await prisma.progressPhoto.count({
    where: { diaryEntry: { userId } },
  });
  if (photoCount >= 1) earned.add('progress_photo_1');
  if (photoCount >= 10) earned.add('progress_photo_10');
  if (photoCount >= 50) earned.add('progress_photo_50');

  // Weekend warrior — 4 consecutive weekends with activity entries
  const weekendStreak = await calculateWeekendStreak(userId);
  if (weekendStreak >= 4) earned.add('weekend_warrior_4');

  return earned;
};

const checkGoalCriteria = async (userId: string): Promise<Set<string>> => {
  const earned = new Set<string>();

  const completedGoals = await prisma.goal.count({
    where: { userId, status: 'COMPLETED' },
  });
  if (completedGoals >= 1) earned.add('goal_completed_1');
  if (completedGoals >= 3) earned.add('goal_completed_3');
  if (completedGoals >= 5) earned.add('goal_completed_5');
  if (completedGoals >= 10) earned.add('goal_completed_10');
  if (completedGoals >= 25) earned.add('goal_completed_25');
  if (completedGoals >= 50) earned.add('goal_completed_50');

  return earned;
};

const checkPersonalBestCriteria = async (userId: string): Promise<Set<string>> => {
  const earned = new Set<string>();

  const pbCount = await prisma.personalBest.count({ where: { userId } });
  if (pbCount >= 1) earned.add('pb_1');
  if (pbCount >= 5) earned.add('pb_5');
  if (pbCount >= 10) earned.add('pb_10');
  if (pbCount >= 25) earned.add('pb_25');

  return earned;
};

const checkFriendshipCriteria = async (userId: string): Promise<Set<string>> => {
  const earned = new Set<string>();

  const friendCount = await prisma.friendship.count({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
  });
  if (friendCount >= 1) earned.add('friend_1');
  if (friendCount >= 5) earned.add('friend_5');
  if (friendCount >= 10) earned.add('friend_10');
  if (friendCount >= 25) earned.add('friend_25');

  return earned;
};

const checkFollowCriteria = async (userId: string): Promise<Set<string>> => {
  const earned = new Set<string>();

  const followCount = await prisma.follow.count({
    where: { followerId: userId },
  });
  if (followCount >= 1) earned.add('follow_1');
  if (followCount >= 5) earned.add('follow_5');

  return earned;
};

const checkPostCriteria = async (userId: string): Promise<Set<string>> => {
  const earned = new Set<string>();

  const postCount = await prisma.post.count({ where: { userId } });
  if (postCount >= 1) earned.add('post_1');
  if (postCount >= 10) earned.add('post_10');
  if (postCount >= 50) earned.add('post_50');

  return earned;
};

const checkLikeReceivedCriteria = async (userId: string): Promise<Set<string>> => {
  const earned = new Set<string>();

  const postLikes = await prisma.postLike.count({
    where: { post: { userId } },
  });
  const diaryLikes = await prisma.diaryEntryLike.count({
    where: { diaryEntry: { userId } },
  });
  const totalLikes = postLikes + diaryLikes;

  if (totalLikes >= 1) earned.add('likes_received_1');
  if (totalLikes >= 10) earned.add('likes_received_10');
  if (totalLikes >= 50) earned.add('likes_received_50');
  if (totalLikes >= 100) earned.add('likes_received_100');

  return earned;
};

const checkAccountCriteria = async (userId: string): Promise<Set<string>> => {
  const earned = new Set<string>();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });
  if (!user) return earned;

  const daysSinceJoin = Math.floor(
    (Date.now() - user.createdAt.getTime()) / 86400000
  );
  if (daysSinceJoin >= 7) earned.add('account_7_days');
  if (daysSinceJoin >= 30) earned.add('account_30_days');
  if (daysSinceJoin >= 90) earned.add('account_90_days');
  if (daysSinceJoin >= 365) earned.add('account_365_days');

  return earned;
};

// ============================================================================
// STREAK HELPERS
// ============================================================================

const calculateCurrentStreak = async (userId: string): Promise<number> => {
  const entries = await prisma.diaryEntry.findMany({
    where: { userId },
    select: { date: true },
    orderBy: { date: 'desc' },
    distinct: ['date'],
    take: 400,
  });

  if (entries.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDate = new Date(entries[0]!.date);
  firstDate.setHours(0, 0, 0, 0);

  const diffFromToday = Math.floor((today.getTime() - firstDate.getTime()) / 86400000);
  if (diffFromToday > 1) return 0;

  let streak = 1;
  for (let i = 1; i < entries.length; i++) {
    const curr = new Date(entries[i]!.date);
    const prev = new Date(entries[i - 1]!.date);
    curr.setHours(0, 0, 0, 0);
    prev.setHours(0, 0, 0, 0);

    const diff = Math.floor((prev.getTime() - curr.getTime()) / 86400000);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

const calculateTypeStreak = async (userId: string, type: string): Promise<number> => {
  const entries = await prisma.diaryEntry.findMany({
    where: { userId, type: type as never },
    select: { date: true },
    orderBy: { date: 'desc' },
    distinct: ['date'],
    take: 400,
  });

  if (entries.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDate = new Date(entries[0]!.date);
  firstDate.setHours(0, 0, 0, 0);

  const diffFromToday = Math.floor((today.getTime() - firstDate.getTime()) / 86400000);
  if (diffFromToday > 1) return 0;

  let streak = 1;
  for (let i = 1; i < entries.length; i++) {
    const curr = new Date(entries[i]!.date);
    const prev = new Date(entries[i - 1]!.date);
    curr.setHours(0, 0, 0, 0);
    prev.setHours(0, 0, 0, 0);

    const diff = Math.floor((prev.getTime() - curr.getTime()) / 86400000);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

const calculateWeekendStreak = async (userId: string): Promise<number> => {
  // Get activity entries on weekends, ordered by date desc
  const entries = await prisma.diaryEntry.findMany({
    where: {
      userId,
      type: { in: ['WORKOUT_LOG', 'ACTIVITY', 'STEPS'] },
    },
    select: { date: true },
    orderBy: { date: 'desc' },
  });

  if (entries.length === 0) return 0;

  // Get unique weekend dates (Sat or Sun)
  const weekendDates = new Set<string>();
  for (const entry of entries) {
    const d = new Date(entry.date);
    const day = d.getDay();
    if (day === 0 || day === 6) {
      // Normalize to the Saturday of that weekend
      const sat = new Date(d);
      if (day === 0) sat.setDate(sat.getDate() - 1);
      weekendDates.add(sat.toISOString().slice(0, 10));
    }
  }

  if (weekendDates.size === 0) return 0;

  // Sort weekends desc and count consecutive
  const sorted = Array.from(weekendDates).sort().reverse();
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const curr = new Date(sorted[i]!);
    const prev = new Date(sorted[i - 1]!);
    const diff = Math.floor((prev.getTime() - curr.getTime()) / 86400000);
    if (diff === 7) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

// ============================================================================
// TRIGGER → CHECKER MAPPING
// ============================================================================

const TRIGGER_CHECKERS: Record<BadgeTrigger, (userId: string) => Promise<Set<string>>> = {
  DIARY_ENTRY: checkDiaryEntryCriteria,
  GOAL_COMPLETED: checkGoalCriteria,
  PERSONAL_BEST: checkPersonalBestCriteria,
  FRIENDSHIP: checkFriendshipCriteria,
  POST: checkPostCriteria,
  LIKE_RECEIVED: checkLikeReceivedCriteria,
  FOLLOW: checkFollowCriteria,
  ACCOUNT: checkAccountCriteria,
};

// ============================================================================
// PUBLIC SERVICE
// ============================================================================

export const badgeService = {
  async checkAndAwardBadges(userId: string, trigger: BadgeTrigger): Promise<string[]> {
    // Get badges relevant to this trigger
    const relevantBadgeIds = ALL_BADGES
      .filter((b) => b.triggers.includes(trigger))
      .map((b) => b.id);

    if (relevantBadgeIds.length === 0) return [];

    // Get already earned badges
    const existingBadges = await prisma.userBadge.findMany({
      where: { userId, badgeId: { in: relevantBadgeIds } },
      select: { badgeId: true },
    });
    const alreadyEarned = new Set(existingBadges.map((b) => b.badgeId));

    // Run the checker for this trigger
    const checker = TRIGGER_CHECKERS[trigger];
    const qualifiedBadgeIds = await checker(userId);

    // Also always check account age badges
    if (trigger !== 'ACCOUNT') {
      const accountBadges = await checkAccountCriteria(userId);
      accountBadges.forEach((id) => qualifiedBadgeIds.add(id));
    }

    // Find newly earned badges
    const newBadgeIds = Array.from(qualifiedBadgeIds).filter(
      (id) => !alreadyEarned.has(id) && relevantBadgeIds.includes(id)
    );

    // Also check account badges that are new
    const accountBadgeIds = ALL_BADGES
      .filter((b) => b.triggers.includes('ACCOUNT'))
      .map((b) => b.id);
    const existingAccountBadges = await prisma.userBadge.findMany({
      where: { userId, badgeId: { in: accountBadgeIds } },
      select: { badgeId: true },
    });
    const alreadyEarnedAccount = new Set(existingAccountBadges.map((b) => b.badgeId));
    const qualifiedAccountIds = await checkAccountCriteria(userId);
    const newAccountBadgeIds = Array.from(qualifiedAccountIds).filter(
      (id) => !alreadyEarnedAccount.has(id)
    );

    const allNewBadgeIds = [...new Set([...newBadgeIds, ...newAccountBadgeIds])];

    if (allNewBadgeIds.length === 0) return [];

    // Award badges
    await prisma.userBadge.createMany({
      data: allNewBadgeIds.map((badgeId) => ({ userId, badgeId })),
      skipDuplicates: true,
    });

    // Notify for each new badge
    for (const badgeId of allNewBadgeIds) {
      const badge = BADGE_MAP.get(badgeId);
      if (!badge) continue;

      sseManager.broadcastToUser(userId, 'message', {
        type: 'badge_earned',
        badgeId,
        badgeName: badge.name,
      });

      inAppNotificationService.notify({
        userId,
        type: 'BADGE_EARNED',
        title: `Badge earned: ${badge.name}`,
        body: badge.description,
        link: '/dashboard/achievements',
      }).catch(console.error);
    }

    // Notify trainer(s) that their client earned badge(s)
    if (allNewBadgeIds.length > 0) {
      clientRosterRepository.findByTraineeUserId(userId).then(async (rosters) => {
        if (rosters.length === 0) return;
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        const badgeNames = allNewBadgeIds
          .map((id) => BADGE_MAP.get(id)?.name)
          .filter(Boolean)
          .join(', ');
        for (const roster of rosters) {
          inAppNotificationService.notify({
            userId: roster.trainer.userId,
            type: 'BADGE_EARNED',
            title: `${user?.name ?? 'A client'} earned: ${badgeNames}`,
            link: `/dashboard/clients/${roster.id}?tab=progress`,
          }).catch(console.error);
        }
      }).catch(console.error);
    }

    return allNewBadgeIds;
  },

  async getUserBadges(userId: string) {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
    });

    return userBadges.map((ub) => ({
      badgeId: ub.badgeId,
      earnedAt: ub.earnedAt,
      definition: BADGE_MAP.get(ub.badgeId) ?? null,
    }));
  },

  async getShowcaseBadgeIds(userId: string): Promise<string[]> {
    const profile = await prisma.traineeProfile.findUnique({
      where: { userId },
      select: { showcaseBadgeIds: true },
    });
    return profile?.showcaseBadgeIds ?? [];
  },

  async getShowcaseBadges(userId: string) {
    const profile = await prisma.traineeProfile.findUnique({
      where: { userId },
      select: { showcaseBadgeIds: true },
    });

    const ids = profile?.showcaseBadgeIds ?? [];
    return ids
      .map((id) => BADGE_MAP.get(id))
      .filter((b): b is NonNullable<typeof b> => b !== undefined);
  },

  async setShowcaseBadges(userId: string, badgeIds: string[]) {
    // Verify user has earned all these badges
    if (badgeIds.length > 5) {
      throw new Error('Maximum 5 showcase badges');
    }

    const earned = await prisma.userBadge.findMany({
      where: { userId, badgeId: { in: badgeIds } },
      select: { badgeId: true },
    });
    const earnedIds = new Set(earned.map((b) => b.badgeId));
    const validIds = badgeIds.filter((id) => earnedIds.has(id));

    await prisma.traineeProfile.update({
      where: { userId },
      data: { showcaseBadgeIds: validIds },
    });

    return validIds;
  },

  async getAllBadgeDefinitions() {
    return ALL_BADGES;
  },
};
