import { TRPCError } from '@trpc/server';
import { diaryRepository } from '../repositories/diary.repository';
import { clientRosterRepository } from '../repositories/client-roster.repository';
import { trainerRepository } from '../repositories/trainer.repository';
import { foodSearch } from '../lib/foodSearch';
import { goalService } from './goal.service';
import { personalBestService } from './personal-best.service';
import { badgeService } from './badge.service';
import { inAppNotificationService } from './in-app-notification.service';
import { sseManager } from '../lib/sse';
import { prisma } from '../lib/prisma';
import type { DiaryEntryType, MoodLevel, MealType, ActivityType, ActivitySource } from '@fitnassist/database';
import type { SseDiaryEntryEvent, SseDiaryCommentEvent } from '@fitnassist/types';

/**
 * Resolves the target userId for diary operations.
 * If clientRosterId is provided, verifies the caller is the trainer and returns the trainee's userId.
 * Otherwise, returns the caller's own userId.
 */
const resolveUserId = async (callerId: string, clientRosterId?: string): Promise<string> => {
  if (!clientRosterId) return callerId;

  const client = await clientRosterRepository.findById(clientRosterId);
  if (!client) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
  }

  const trainer = await trainerRepository.findByUserId(callerId);
  if (!trainer || client.trainerId !== trainer.id) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this client' });
  }

  // Get trainee userId from the connection
  const senderId = client.connection?.senderId;
  if (!senderId) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Client user not found' });
  }

  return senderId;
};

/**
 * Verifies caller can view diary entries for the given userId.
 * Either they are the user, or they are the user's trainer.
 */
const verifyReadAccess = async (callerId: string, targetUserId: string): Promise<void> => {
  if (callerId === targetUserId) return;

  // Check if caller is a trainer with this user as a client
  const trainer = await trainerRepository.findByUserId(callerId);
  if (!trainer) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this data' });
  }

  const roster = await clientRosterRepository.findByTrainerAndTraineeUserId(trainer.id, targetUserId);
  if (!roster) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this data' });
  }
};

const parseDate = (dateStr: string): Date => new Date(dateStr + 'T00:00:00.000Z');

/**
 * Gets trainer info for a given trainee, including roster IDs for links.
 */
const getTrainerRosters = async (traineeUserId: string) => {
  const rosters = await clientRosterRepository.findByTraineeUserId(traineeUserId);
  return rosters.map(r => ({
    trainerUserId: r.trainer.userId,
    clientRosterId: r.id,
  }));
};

/**
 * Gets trainer userIds for a given trainee.
 */
const getTrainerUserIds = async (traineeUserId: string): Promise<string[]> => {
  const rosters = await getTrainerRosters(traineeUserId);
  return rosters.map(r => r.trainerUserId);
};

const ENTRY_TYPE_LABELS: Record<string, string> = {
  WEIGHT: 'weight',
  WATER: 'water intake',
  MEASUREMENT: 'measurements',
  MOOD: 'mood',
  SLEEP: 'sleep',
  FOOD: 'food',
  WORKOUT_LOG: 'a workout',
  PROGRESS_PHOTO: 'progress photos',
  STEPS: 'steps',
  ACTIVITY: 'an activity',
};

/**
 * Broadcasts a diary entry SSE event to the trainee's trainer(s).
 * Also sends an in-app notification for each entry.
 */
const broadcastDiaryEntry = async (userId: string, entryType: string, date: string) => {
  const [trainerRosters, user] = await Promise.all([
    getTrainerRosters(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);

  if (trainerRosters.length === 0 || !user) return;

  const trainerUserIds = trainerRosters.map(r => r.trainerUserId);

  const event: SseDiaryEntryEvent = {
    type: 'diary_entry',
    userId,
    userName: user.name,
    entryType,
    date,
  };

  sseManager.broadcastToUsers(trainerUserIds, 'message', event);

  // In-app notification to trainer(s)
  const label = ENTRY_TYPE_LABELS[entryType] ?? entryType.toLowerCase();
  for (const roster of trainerRosters) {
    inAppNotificationService.notify({
      userId: roster.trainerUserId,
      type: 'DIARY_ENTRY',
      title: `${user.name} logged ${label}`,
      link: `/dashboard/clients/${roster.clientRosterId}?tab=progress`,
    }).catch(console.error);
  }
};

/**
 * Broadcasts a diary comment SSE event.
 * If trainer comments -> notify trainee. If trainee comments -> notify trainer.
 */
const broadcastDiaryComment = async (commenterId: string, diaryEntryId: string, entryOwnerId: string, date: string) => {
  const commenter = await prisma.user.findUnique({ where: { id: commenterId }, select: { name: true } });
  if (!commenter) return;

  const event: SseDiaryCommentEvent = {
    type: 'diary_comment',
    userId: commenterId,
    userName: commenter.name,
    diaryEntryId,
    date,
  };

  if (commenterId === entryOwnerId) {
    // Trainee commented on own entry -> notify trainer(s)
    const trainerUserIds = await getTrainerUserIds(entryOwnerId);
    sseManager.broadcastToUsers(trainerUserIds, 'message', event);
  } else {
    // Trainer commented -> notify entry owner
    sseManager.broadcastToUser(entryOwnerId, 'message', event);
  }
};

export const diaryService = {
  async logWeight(callerId: string, data: { clientRosterId?: string; date: string; weightKg: number; source?: ActivitySource }) {
    const userId = await resolveUserId(callerId, data.clientRosterId);
    const result = await diaryRepository.upsertWeight(userId, parseDate(data.date), data.weightKg, data.source);
    goalService.checkAutoProgress(userId, 'WEIGHT', data.weightKg).catch(() => {});
    personalBestService.checkWeightPB(userId, data.weightKg, parseDate(data.date)).catch(() => {});
    broadcastDiaryEntry(userId, 'WEIGHT', data.date).catch(() => {});
    badgeService.checkAndAwardBadges(userId, 'DIARY_ENTRY').catch(() => {});
    return result;
  },

  async logWater(callerId: string, data: { clientRosterId?: string; date: string; totalMl: number; source?: ActivitySource }) {
    const userId = await resolveUserId(callerId, data.clientRosterId);
    const result = await diaryRepository.upsertWater(userId, parseDate(data.date), data.totalMl, data.source);
    broadcastDiaryEntry(userId, 'WATER', data.date).catch(() => {});
    badgeService.checkAndAwardBadges(userId, 'DIARY_ENTRY').catch(() => {});
    return result;
  },

  async logMeasurements(callerId: string, data: {
    clientRosterId?: string;
    date: string;
    chestCm?: number | null;
    waistCm?: number | null;
    hipsCm?: number | null;
    bicepCm?: number | null;
    thighCm?: number | null;
    calfCm?: number | null;
    neckCm?: number | null;
  }) {
    const userId = await resolveUserId(callerId, data.clientRosterId);
    const { clientRosterId: _, date, ...measurements } = data;
    const result = await diaryRepository.upsertMeasurements(userId, parseDate(date), measurements);
    broadcastDiaryEntry(userId, 'MEASUREMENT', date).catch(() => {});
    badgeService.checkAndAwardBadges(userId, 'DIARY_ENTRY').catch(() => {});
    return result;
  },

  async logMood(callerId: string, data: { clientRosterId?: string; date: string; level: MoodLevel; notes?: string }) {
    const userId = await resolveUserId(callerId, data.clientRosterId);
    const result = await diaryRepository.upsertMood(userId, parseDate(data.date), data.level, data.notes);
    broadcastDiaryEntry(userId, 'MOOD', data.date).catch(() => {});
    badgeService.checkAndAwardBadges(userId, 'DIARY_ENTRY').catch(() => {});
    return result;
  },

  async logSleep(callerId: string, data: { clientRosterId?: string; date: string; hoursSlept: number; quality: number; source?: ActivitySource }) {
    const userId = await resolveUserId(callerId, data.clientRosterId);
    const result = await diaryRepository.upsertSleep(userId, parseDate(data.date), data.hoursSlept, data.quality, data.source);
    broadcastDiaryEntry(userId, 'SLEEP', data.date).catch(() => {});
    badgeService.checkAndAwardBadges(userId, 'DIARY_ENTRY').catch(() => {});
    return result;
  },

  // ---- Workout Log ----
  async logWorkout(callerId: string, data: {
    clientRosterId?: string;
    date: string;
    workoutPlanId?: string;
    workoutPlanName?: string;
    durationMinutes: number;
    caloriesBurned?: number;
    notes?: string;
  }) {
    const userId = await resolveUserId(callerId, data.clientRosterId);
    const { clientRosterId: _, date, ...workoutData } = data;
    const result = await diaryRepository.createWorkoutLog(userId, parseDate(date), workoutData);
    goalService.checkAutoProgress(userId, 'WORKOUT_LOG').catch(() => {});
    personalBestService.checkWorkoutPB(userId, data.durationMinutes, parseDate(date)).catch(() => {});
    broadcastDiaryEntry(userId, 'WORKOUT_LOG', date).catch(() => {});
    badgeService.checkAndAwardBadges(userId, 'DIARY_ENTRY').catch(() => {});
    return result;
  },

  // ---- Steps ----
  async logSteps(callerId: string, data: { clientRosterId?: string; date: string; totalSteps: number; source?: ActivitySource }) {
    const userId = await resolveUserId(callerId, data.clientRosterId);
    const result = await diaryRepository.upsertSteps(userId, parseDate(data.date), data.totalSteps, data.source);
    goalService.checkAutoProgress(userId, 'STEPS').catch(() => {});
    personalBestService.checkStepsPB(userId, data.totalSteps, parseDate(data.date)).catch(() => {});
    broadcastDiaryEntry(userId, 'STEPS', data.date).catch(() => {});
    badgeService.checkAndAwardBadges(userId, 'DIARY_ENTRY').catch(() => {});
    return result;
  },

  // ---- Activity ----
  async logActivity(callerId: string, data: {
    clientRosterId?: string;
    date: string;
    activityType: ActivityType;
    activityName?: string;
    distanceKm?: number;
    durationSeconds: number;
    elevationGainM?: number;
    caloriesBurned?: number;
    notes?: string;
    source?: ActivitySource;
    externalId?: string;
    routePolyline?: string;
    startLatitude?: number;
    startLongitude?: number;
    endLatitude?: number;
    endLongitude?: number;
    avgHeartRate?: number;
    maxHeartRate?: number;
  }) {
    const userId = await resolveUserId(callerId, data.clientRosterId);
    const { clientRosterId: _, date, ...activityData } = data;

    // Calculate average pace if distance is provided
    const avgPaceSecPerKm = activityData.distanceKm && activityData.distanceKm > 0
      ? Math.round(activityData.durationSeconds / activityData.distanceKm)
      : undefined;

    const result = await diaryRepository.createActivity(userId, parseDate(date), {
      ...activityData,
      avgPaceSecPerKm,
    });

    goalService.checkAutoProgress(userId, 'ACTIVITY').catch(() => {});
    personalBestService.checkActivityPBs(
      userId,
      data.activityType,
      data.distanceKm,
      data.durationSeconds,
      result.id,
      parseDate(date),
    ).catch(() => {});
    broadcastDiaryEntry(userId, 'ACTIVITY', date).catch(() => {});
    badgeService.checkAndAwardBadges(userId, 'DIARY_ENTRY').catch(() => {});
    return result;
  },

  // ---- Personal Bests ----
  async getPersonalBests(callerId: string, userId?: string) {
    const targetUserId = userId || callerId;
    await verifyReadAccess(callerId, targetUserId);
    return personalBestService.getPersonalBests(targetUserId);
  },

  // ---- Progress Photos ----
  async logProgressPhotos(callerId: string, data: {
    clientRosterId?: string;
    date: string;
    photos: Array<{
      imageUrl: string;
      category?: string;
      notes?: string;
      sortOrder?: number;
    }>;
  }) {
    const userId = await resolveUserId(callerId, data.clientRosterId);
    const diaryEntry = await diaryRepository.getOrCreateProgressPhotoDiaryEntry(userId, parseDate(data.date));
    await diaryRepository.createProgressPhotos(diaryEntry.id, data.photos);
    broadcastDiaryEntry(userId, 'PROGRESS_PHOTO', data.date).catch(() => {});
    badgeService.checkAndAwardBadges(userId, 'DIARY_ENTRY').catch(() => {});
    return diaryRepository.findById(diaryEntry.id);
  },

  async deleteProgressPhoto(callerId: string, photoId: string) {
    const photo = await diaryRepository.findProgressPhotoById(photoId);
    if (!photo) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Photo not found' });
    }
    if (photo.diaryEntry.userId !== callerId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your photo' });
    }
    return diaryRepository.deleteProgressPhoto(photoId);
  },

  async getProgressPhotos(callerId: string, data: { userId?: string; startDate?: string; endDate?: string }) {
    const targetUserId = data.userId || callerId;
    await verifyReadAccess(callerId, targetUserId);
    return diaryRepository.getProgressPhotos(
      targetUserId,
      data.startDate ? parseDate(data.startDate) : undefined,
      data.endDate ? parseDate(data.endDate) : undefined,
    );
  },

  // ---- Comments ----
  async addComment(callerId: string, diaryEntryId: string, content: string) {
    const entry = await diaryRepository.findById(diaryEntryId);
    if (!entry) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Diary entry not found' });
    }
    // Verify caller is the entry owner or their trainer
    await verifyReadAccess(callerId, entry.userId);
    const comment = await diaryRepository.createComment(diaryEntryId, callerId, content);
    const dateStr = entry.date instanceof Date
      ? entry.date.toISOString().slice(0, 10)
      : String(entry.date).slice(0, 10);
    broadcastDiaryComment(callerId, diaryEntryId, entry.userId, dateStr).catch(() => {});

    // In-app notification (fire and forget) — don't notify yourself
    if (callerId !== entry.userId) {
      const commenter = await prisma.user.findUnique({ where: { id: callerId }, select: { name: true } });
      inAppNotificationService.notify({
        userId: entry.userId,
        type: 'DIARY_COMMENT',
        title: `${commenter?.name ?? 'Someone'} commented on your diary`,
        link: '/dashboard/diary',
      }).catch(console.error);
    } else {
      // Trainee commented on own diary -> notify their trainers
      const trainerRosters = await getTrainerRosters(entry.userId);
      const commenter = await prisma.user.findUnique({ where: { id: callerId }, select: { name: true } });
      for (const roster of trainerRosters) {
        inAppNotificationService.notify({
          userId: roster.trainerUserId,
          type: 'DIARY_COMMENT',
          title: `${commenter?.name ?? 'A client'} commented on their diary`,
          link: `/dashboard/clients/${roster.clientRosterId}?tab=progress`,
        }).catch(console.error);
      }
    }

    return comment;
  },

  async getComments(callerId: string, diaryEntryId: string) {
    const entry = await diaryRepository.findById(diaryEntryId);
    if (!entry) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Diary entry not found' });
    }
    await verifyReadAccess(callerId, entry.userId);
    return diaryRepository.findCommentsByDiaryEntry(diaryEntryId);
  },

  async deleteComment(callerId: string, commentId: string) {
    const comment = await diaryRepository.findCommentById(commentId);
    if (!comment) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Comment not found' });
    }
    if (comment.userId !== callerId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only delete your own comments' });
    }
    return diaryRepository.deleteComment(commentId);
  },

  async getRecentClientActivity(callerId: string, limit: number) {
    const trainer = await trainerRepository.findByUserId(callerId);
    if (!trainer) {
      return [];
    }

    // Get all active client userIds
    const { clients } = await clientRosterRepository.findByTrainerId({
      trainerId: trainer.id,
      status: 'ACTIVE',
      page: 1,
      limit: 100,
    });

    // Build userId -> clientRosterId map
    const userToRoster = new Map<string, string>();
    const clientUserIds: string[] = [];
    for (const client of clients) {
      const userId = client.connection?.senderId;
      if (userId) {
        clientUserIds.push(userId);
        userToRoster.set(userId, client.id);
      }
    }

    if (clientUserIds.length === 0) return [];

    const entries = await diaryRepository.findRecentClientActivity(clientUserIds, limit);
    return entries.map(entry => ({
      ...entry,
      clientRosterId: userToRoster.get(entry.userId) ?? null,
    }));
  },

  async getEntries(callerId: string, data: { userId?: string; date: string }) {
    const targetUserId = data.userId || callerId;
    await verifyReadAccess(callerId, targetUserId);
    return diaryRepository.findEntriesByDate(targetUserId, parseDate(data.date));
  },

  async getRange(callerId: string, data: {
    userId?: string;
    startDate: string;
    endDate: string;
    type?: DiaryEntryType;
  }) {
    const targetUserId = data.userId || callerId;
    await verifyReadAccess(callerId, targetUserId);
    return diaryRepository.findEntriesByDateRange(
      targetUserId,
      parseDate(data.startDate),
      parseDate(data.endDate),
      data.type
    );
  },

  // ---- Food ----
  async searchFood(query: string) {
    return foodSearch.search(query);
  },

  async getFoodNutrients(query: string) {
    // Open Food Facts search returns nutrition data inline, so we re-use search
    const results = await foodSearch.search(query);
    return results.products.slice(0, 5);
  },

  async logFood(callerId: string, data: {
    clientRosterId?: string;
    date: string;
    items: Array<{
      name: string;
      mealType: MealType;
      calories: number;
      proteinG?: number;
      carbsG?: number;
      fatG?: number;
      fibreG?: number;
      servingSize?: number;
      servingUnit?: string;
      externalId?: string;
      thumbnailUrl?: string;
    }>;
  }) {
    const userId = await resolveUserId(callerId, data.clientRosterId);
    const diaryEntry = await diaryRepository.getOrCreateFoodDiaryEntry(userId, parseDate(data.date));
    await diaryRepository.createFoodEntries(diaryEntry.id, data.items);
    broadcastDiaryEntry(userId, 'FOOD', data.date).catch(() => {});
    badgeService.checkAndAwardBadges(userId, 'DIARY_ENTRY').catch(() => {});
    return diaryRepository.findById(diaryEntry.id);
  },

  async updateFoodEntry(callerId: string, data: {
    id: string;
    servingSize?: number;
    calories?: number;
    proteinG?: number | null;
    carbsG?: number | null;
    fatG?: number | null;
  }) {
    const entry = await diaryRepository.findFoodEntryById(data.id);
    if (!entry) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Food entry not found' });
    }
    if (entry.diaryEntry.userId !== callerId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only edit your own food entries' });
    }
    const { id, ...updateData } = data;
    return diaryRepository.updateFoodEntry(id, updateData);
  },

  async deleteFoodEntry(callerId: string, id: string) {
    const entry = await diaryRepository.findFoodEntryById(id);
    if (!entry) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Food entry not found' });
    }
    if (entry.diaryEntry.userId !== callerId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only delete your own food entries' });
    }
    return diaryRepository.deleteFoodEntry(id);
  },

  async getDailyNutrition(callerId: string, data: { userId?: string; date: string }) {
    const targetUserId = data.userId || callerId;
    await verifyReadAccess(callerId, targetUserId);
    const nutrition = await diaryRepository.getDailyNutrition(targetUserId, parseDate(data.date));
    const caloriesBurned = await diaryRepository.getDailyCaloriesBurned(targetUserId, parseDate(data.date));
    return { ...nutrition, caloriesBurned };
  },

  async deleteEntry(callerId: string, entryId: string) {
    const entry = await diaryRepository.findById(entryId);
    if (!entry) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Diary entry not found' });
    }
    if (entry.userId !== callerId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only delete your own diary entries' });
    }
    return diaryRepository.deleteEntry(entryId);
  },
};
