import type { Visibility } from '@fitnassist/database';
import { prisma } from '../lib/prisma';

type LeaderboardType = 'STEPS' | 'WORKOUTS' | 'STREAKS' | 'GOALS' | 'ACTIVITY_DURATION';
type LeaderboardPeriod = 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';
type LeaderboardScope = 'GLOBAL' | 'FRIENDS';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  handle: string | null;
  avatarUrl: string | null;
  value: number;
  isCurrentUser: boolean;
}

const FRIEND_VISIBLE_LEVELS: Visibility[] = ['PT_AND_FRIENDS', 'EVERYONE'];

const getPeriodStart = (period: LeaderboardPeriod): Date | undefined => {
  if (period === 'ALL_TIME') return undefined;

  const now = new Date();
  if (period === 'WEEKLY') {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1; // Monday start
    const start = new Date(now);
    start.setDate(now.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  // MONTHLY
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const getFriendIds = async (userId: string): Promise<string[]> => {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });

  return friendships.map((f) =>
    f.requesterId === userId ? f.addresseeId : f.requesterId
  );
};

const getBlockedUserIds = async (userId: string): Promise<Set<string>> => {
  const blocked = await prisma.friendship.findMany({
    where: {
      status: 'BLOCKED',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });
  const ids = new Set<string>();
  for (const b of blocked) {
    ids.add(b.requesterId === userId ? b.addresseeId : b.requesterId);
  }
  return ids;
};

const getEligibleUserIds = async (
  scope: LeaderboardScope,
  userId: string
): Promise<string[] | null> => {
  const blockedIds = await getBlockedUserIds(userId);

  if (scope === 'FRIENDS') {
    const friendIds = await getFriendIds(userId);
    const safeFriendIds = friendIds.filter((id) => !blockedIds.has(id));
    // Include friends with stats visible to friends + the current user
    const friendProfiles = await prisma.traineeProfile.findMany({
      where: {
        userId: { in: safeFriendIds },
        privacyStats: { in: FRIEND_VISIBLE_LEVELS },
      },
      select: { userId: true },
    });
    return [...friendProfiles.map((p) => p.userId), userId];
  }

  // GLOBAL: users who opted in
  const optedIn = await prisma.traineeProfile.findMany({
    where: { leaderboardOptIn: true },
    select: { userId: true },
  });
  const ids = optedIn.map((p) => p.userId).filter((id) => !blockedIds.has(id));
  // Always include the requesting user if they're opted in
  if (!ids.includes(userId)) {
    const userProfile = await prisma.traineeProfile.findUnique({
      where: { userId },
      select: { leaderboardOptIn: true },
    });
    if (userProfile?.leaderboardOptIn) ids.push(userId);
  }
  return ids.length > 0 ? ids : null;
};

const getStepsRankings = async (
  userIds: string[],
  periodStart?: Date
): Promise<Map<string, number>> => {
  const where = {
    userId: { in: userIds },
    type: 'STEPS' as const,
    ...(periodStart ? { date: { gte: periodStart } } : {}),
  };

  const entries = await prisma.diaryEntry.findMany({
    where,
    include: { stepsEntry: { select: { totalSteps: true } } },
  });

  const totals = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.stepsEntry) continue;
    const current = totals.get(entry.userId) ?? 0;
    totals.set(entry.userId, current + entry.stepsEntry.totalSteps);
  }
  return totals;
};

const getWorkoutsRankings = async (
  userIds: string[],
  periodStart?: Date
): Promise<Map<string, number>> => {
  const where = {
    userId: { in: userIds },
    type: 'WORKOUT_LOG' as const,
    ...(periodStart ? { date: { gte: periodStart } } : {}),
  };

  const counts = await prisma.diaryEntry.groupBy({
    by: ['userId'],
    where,
    _count: { id: true },
  });

  const totals = new Map<string, number>();
  for (const row of counts) {
    totals.set(row.userId, row._count.id);
  }
  return totals;
};

const getActivityDurationRankings = async (
  userIds: string[],
  periodStart?: Date
): Promise<Map<string, number>> => {
  const where = {
    userId: { in: userIds },
    type: 'ACTIVITY' as const,
    ...(periodStart ? { date: { gte: periodStart } } : {}),
  };

  const entries = await prisma.diaryEntry.findMany({
    where,
    include: { activityEntry: { select: { durationSeconds: true } } },
  });

  const totals = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.activityEntry) continue;
    const current = totals.get(entry.userId) ?? 0;
    const minutes = Math.round(entry.activityEntry.durationSeconds / 60);
    totals.set(entry.userId, current + minutes);
  }
  return totals;
};

const getGoalsRankings = async (
  userIds: string[],
  periodStart?: Date
): Promise<Map<string, number>> => {
  const where = {
    userId: { in: userIds },
    status: 'COMPLETED' as const,
    ...(periodStart ? { completedAt: { gte: periodStart } } : {}),
  };

  const counts = await prisma.goal.groupBy({
    by: ['userId'],
    where,
    _count: { id: true },
  });

  const totals = new Map<string, number>();
  for (const row of counts) {
    totals.set(row.userId, row._count.id);
  }
  return totals;
};

const getStreaksRankings = async (
  userIds: string[]
): Promise<Map<string, number>> => {
  // For each user, calculate their current consecutive diary day streak
  const totals = new Map<string, number>();

  for (const userId of userIds) {
    const entries = await prisma.diaryEntry.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: 'desc' },
      distinct: ['date'],
      take: 365, // Look back up to a year
    });

    if (entries.length === 0) continue;

    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDate = new Date(entries[0]!.date);
    firstDate.setHours(0, 0, 0, 0);

    // If last entry isn't today or yesterday, no active streak
    const diffFromToday = Math.floor((today.getTime() - firstDate.getTime()) / 86400000);
    if (diffFromToday > 1) continue;

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

    totals.set(userId, streak);
  }

  return totals;
};

const getUserProfiles = async (userIds: string[]) => {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      traineeProfile: {
        select: { handle: true, avatarUrl: true },
      },
    },
  });

  return new Map(users.map((u) => [u.id, {
    name: u.name,
    handle: u.traineeProfile?.handle ?? null,
    avatarUrl: u.traineeProfile?.avatarUrl ?? null,
  }]));
};

export const leaderboardService = {
  async getLeaderboard(
    type: LeaderboardType,
    period: LeaderboardPeriod,
    scope: LeaderboardScope,
    userId: string,
    limit = 50
  ): Promise<{ entries: LeaderboardEntry[]; userRank: LeaderboardEntry | null }> {
    const eligibleIds = await getEligibleUserIds(scope, userId);
    if (!eligibleIds || eligibleIds.length === 0) {
      return { entries: [], userRank: null };
    }

    const periodStart = getPeriodStart(period);

    let rankings: Map<string, number>;
    switch (type) {
      case 'STEPS':
        rankings = await getStepsRankings(eligibleIds, periodStart);
        break;
      case 'WORKOUTS':
        rankings = await getWorkoutsRankings(eligibleIds, periodStart);
        break;
      case 'ACTIVITY_DURATION':
        rankings = await getActivityDurationRankings(eligibleIds, periodStart);
        break;
      case 'GOALS':
        rankings = await getGoalsRankings(eligibleIds, periodStart);
        break;
      case 'STREAKS':
        rankings = await getStreaksRankings(eligibleIds);
        break;
    }

    // Sort by value desc
    const sorted = Array.from(rankings.entries())
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1]);

    const topIds = sorted.slice(0, limit).map(([id]) => id);
    // Ensure we also fetch the current user's profile
    if (!topIds.includes(userId) && rankings.has(userId)) {
      topIds.push(userId);
    }

    const profiles = await getUserProfiles(topIds);

    const entries: LeaderboardEntry[] = sorted.slice(0, limit).map(([id, value], idx) => {
      const profile = profiles.get(id);
      return {
        rank: idx + 1,
        userId: id,
        name: profile?.name ?? 'Unknown',
        handle: profile?.handle ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
        value,
        isCurrentUser: id === userId,
      };
    });

    // Find user's rank
    let userRank: LeaderboardEntry | null = null;
    const userIdx = sorted.findIndex(([id]) => id === userId);
    if (userIdx !== -1) {
      const profile = profiles.get(userId);
      userRank = {
        rank: userIdx + 1,
        userId,
        name: profile?.name ?? 'Unknown',
        handle: profile?.handle ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
        value: sorted[userIdx]![1],
        isCurrentUser: true,
      };
    }

    return { entries, userRank };
  },

  async getOptInStatus(userId: string): Promise<boolean> {
    const profile = await prisma.traineeProfile.findUnique({
      where: { userId },
      select: { leaderboardOptIn: true },
    });
    return profile?.leaderboardOptIn ?? false;
  },

  async setOptInStatus(userId: string, optedIn: boolean) {
    await prisma.traineeProfile.update({
      where: { userId },
      data: { leaderboardOptIn: optedIn },
    });
    return { success: true };
  },
};
