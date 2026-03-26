import { personalBestRepository } from '../repositories/personal-best.repository';
import { badgeService } from './badge.service';
import { sseManager } from '../lib/sse';
import { inAppNotificationService } from './in-app-notification.service';
import { prisma } from '../lib/prisma';
import type { PersonalBestCategory, ActivityType } from '@fitnassist/database';

// Standard race distances in km (with ±50m tolerance)
const STANDARD_DISTANCES: Array<{ km: number; label: string; tolerance: number }> = [
  { km: 5, label: '5K', tolerance: 0.05 },
  { km: 10, label: '10K', tolerance: 0.05 },
  { km: 21.0975, label: 'Half Marathon', tolerance: 0.05 },
  { km: 42.195, label: 'Marathon', tolerance: 0.05 },
];

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  RUN: 'Run',
  WALK: 'Walk',
  CYCLE: 'Cycle',
  SWIM: 'Swim',
  HIKE: 'Hike',
  OTHER: 'Activity',
};

/**
 * Broadcasts a personal best SSE event and sends in-app notification.
 */
const broadcastPB = async (userId: string, label: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  if (!user) return;

  const event = {
    type: 'personal_best' as const,
    userId,
    userName: user.name,
    label,
  };

  // Notify the user themselves
  sseManager.broadcastToUser(userId, 'message', event);

  // Notify their trainers
  const rosters = await prisma.clientRoster.findMany({
    where: {
      connection: { senderId: userId, type: 'CONNECTION_REQUEST', status: 'ACCEPTED' },
      status: { in: ['ACTIVE', 'ON_HOLD'] },
    },
    include: { trainer: { select: { userId: true } } },
  });

  const trainerUserIds = rosters.map(r => r.trainer.userId);
  if (trainerUserIds.length > 0) {
    sseManager.broadcastToUsers(trainerUserIds, 'message', event);
  }

  // In-app notification to user
  inAppNotificationService.notify({
    userId,
    type: 'GOAL_COMPLETED',
    title: `New personal best: ${label}!`,
    link: '/dashboard/diary',
  }).catch(console.error);
};

/**
 * Attempts to upsert a PB if the new value beats the existing one.
 * Returns true if a new PB was set.
 */
const tryUpsertPB = async (params: {
  userId: string;
  category: PersonalBestCategory;
  activityType?: ActivityType | null;
  distanceKm?: number | null;
  value: number;
  unit: string;
  label: string;
  achievedAt: Date;
  diaryEntryId?: string;
  isBetter: (newVal: number, oldVal: number) => boolean;
}): Promise<boolean> => {
  const existing = await personalBestRepository.findByKey(
    params.userId,
    params.category,
    params.activityType,
    params.distanceKm,
  );

  if (existing && !params.isBetter(params.value, existing.value)) {
    return false;
  }

  await personalBestRepository.upsertPB({
    userId: params.userId,
    category: params.category,
    activityType: params.activityType,
    distanceKm: params.distanceKm,
    value: params.value,
    unit: params.unit,
    label: params.label,
    achievedAt: params.achievedAt,
    diaryEntryId: params.diaryEntryId,
    previousValue: existing?.value ?? null,
    previousDate: existing?.achievedAt ?? null,
  });

  broadcastPB(params.userId, params.label).catch(() => {});
  badgeService.checkAndAwardBadges(params.userId, 'PERSONAL_BEST').catch(() => {});
  return true;
};

export const personalBestService = {
  async getPersonalBests(userId: string) {
    return personalBestRepository.findByUser(userId);
  },

  /**
   * Check for personal bests after an activity is logged.
   */
  async checkActivityPBs(userId: string, activityType: ActivityType, distanceKm: number | undefined, durationSeconds: number, diaryEntryId: string, date: Date) {
    const typeLabel = ACTIVITY_TYPE_LABELS[activityType] ?? activityType;

    // 1. FASTEST_DISTANCE — check standard race distances
    if (distanceKm != null && durationSeconds > 0) {
      for (const std of STANDARD_DISTANCES) {
        if (Math.abs(distanceKm - std.km) <= std.tolerance) {
          await tryUpsertPB({
            userId,
            category: 'FASTEST_DISTANCE',
            activityType,
            distanceKm: std.km,
            value: durationSeconds,
            unit: 'seconds',
            label: `Fastest ${std.label} ${typeLabel}`,
            achievedAt: date,
            diaryEntryId,
            isBetter: (newVal, oldVal) => newVal < oldVal,
          });
        }
      }
    }

    // 2. LONGEST_DISTANCE per activity type
    if (distanceKm != null && distanceKm > 0) {
      await tryUpsertPB({
        userId,
        category: 'LONGEST_DISTANCE',
        activityType,
        distanceKm: null,
        value: distanceKm,
        unit: 'km',
        label: `Longest ${typeLabel}`,
        achievedAt: date,
        diaryEntryId,
        isBetter: (newVal, oldVal) => newVal > oldVal,
      });
    }

    // 3. LONGEST_DURATION per activity type
    if (durationSeconds > 0) {
      await tryUpsertPB({
        userId,
        category: 'LONGEST_DURATION',
        activityType,
        distanceKm: null,
        value: durationSeconds,
        unit: 'seconds',
        label: `Longest ${typeLabel}`,
        achievedAt: date,
        diaryEntryId,
        isBetter: (newVal, oldVal) => newVal > oldVal,
      });
    }
  },

  /**
   * Check for heaviest weight PB.
   */
  async checkWeightPB(userId: string, weightKg: number, date: Date) {
    await tryUpsertPB({
      userId,
      category: 'HEAVIEST_WEIGHT',
      value: weightKg,
      unit: 'kg',
      label: 'Heaviest Weight',
      achievedAt: date,
      isBetter: (newVal, oldVal) => newVal > oldVal,
    });
  },

  /**
   * Check for most steps PB.
   */
  async checkStepsPB(userId: string, totalSteps: number, date: Date) {
    await tryUpsertPB({
      userId,
      category: 'MOST_STEPS',
      value: totalSteps,
      unit: 'steps',
      label: 'Most Steps',
      achievedAt: date,
      isBetter: (newVal, oldVal) => newVal > oldVal,
    });
  },

  /**
   * Check for longest workout duration PB.
   */
  async checkWorkoutPB(userId: string, durationMinutes: number, date: Date) {
    await tryUpsertPB({
      userId,
      category: 'LONGEST_DURATION',
      activityType: null,
      distanceKm: null,
      value: durationMinutes * 60,
      unit: 'seconds',
      label: 'Longest Workout',
      achievedAt: date,
      isBetter: (newVal, oldVal) => newVal > oldVal,
    });
  },
};
