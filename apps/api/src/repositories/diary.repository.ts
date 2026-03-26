import { prisma } from '../lib/prisma';
import type { DiaryEntryType, MoodLevel, ActivityType } from '@fitnassist/database';

const DIARY_ENTRY_INCLUDE = {
  weightEntry: true,
  waterEntry: true,
  measurementEntry: true,
  moodEntry: true,
  sleepEntry: true,
  foodEntries: {
    orderBy: { createdAt: 'asc' as const },
  },
  workoutLogEntry: {
    include: { workoutPlan: { select: { id: true, name: true } } },
  },
  stepsEntry: true,
  activityEntry: true,
  progressPhotos: {
    orderBy: { sortOrder: 'asc' as const },
  },
  comments: {
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

export const diaryRepository = {
  async findEntriesByDate(userId: string, date: Date) {
    return prisma.diaryEntry.findMany({
      where: { userId, date },
      include: DIARY_ENTRY_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  },

  async findEntriesByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    type?: DiaryEntryType
  ) {
    return prisma.diaryEntry.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
        ...(type && { type }),
      },
      include: DIARY_ENTRY_INCLUDE,
      orderBy: { date: 'asc' },
    });
  },

  async findById(id: string) {
    return prisma.diaryEntry.findUnique({
      where: { id },
      include: DIARY_ENTRY_INCLUDE,
    });
  },

  async findByUserAndDateAndType(userId: string, date: Date, type: DiaryEntryType) {
    return prisma.diaryEntry.findFirst({
      where: { userId, date, type },
      include: DIARY_ENTRY_INCLUDE,
    });
  },

  async deleteEntry(id: string) {
    return prisma.diaryEntry.delete({ where: { id } });
  },

  async getLatestWeight(userId: string): Promise<number | null> {
    const entry = await prisma.diaryEntry.findFirst({
      where: { userId, type: 'WEIGHT' },
      orderBy: { date: 'desc' },
      include: { weightEntry: true },
    });
    return entry?.weightEntry?.weightKg ?? null;
  },

  // ---- Weight ----
  async upsertWeight(userId: string, date: Date, weightKg: number) {
    const existing = await prisma.diaryEntry.findFirst({
      where: { userId, date, type: 'WEIGHT' },
    });

    if (existing) {
      return prisma.diaryEntry.update({
        where: { id: existing.id },
        data: {
          weightEntry: {
            update: { weightKg },
          },
        },
        include: DIARY_ENTRY_INCLUDE,
      });
    }

    return prisma.diaryEntry.create({
      data: {
        userId,
        date,
        type: 'WEIGHT',
        weightEntry: {
          create: { weightKg },
        },
      },
      include: DIARY_ENTRY_INCLUDE,
    });
  },

  // ---- Water ----
  async upsertWater(userId: string, date: Date, totalMl: number) {
    const existing = await prisma.diaryEntry.findFirst({
      where: { userId, date, type: 'WATER' },
    });

    if (existing) {
      return prisma.diaryEntry.update({
        where: { id: existing.id },
        data: {
          waterEntry: {
            update: { totalMl },
          },
        },
        include: DIARY_ENTRY_INCLUDE,
      });
    }

    return prisma.diaryEntry.create({
      data: {
        userId,
        date,
        type: 'WATER',
        waterEntry: {
          create: { totalMl },
        },
      },
      include: DIARY_ENTRY_INCLUDE,
    });
  },

  // ---- Measurements ----
  async upsertMeasurements(
    userId: string,
    date: Date,
    measurements: {
      chestCm?: number | null;
      waistCm?: number | null;
      hipsCm?: number | null;
      bicepCm?: number | null;
      thighCm?: number | null;
      calfCm?: number | null;
      neckCm?: number | null;
    }
  ) {
    const existing = await prisma.diaryEntry.findFirst({
      where: { userId, date, type: 'MEASUREMENT' },
    });

    if (existing) {
      return prisma.diaryEntry.update({
        where: { id: existing.id },
        data: {
          measurementEntry: {
            update: measurements,
          },
        },
        include: DIARY_ENTRY_INCLUDE,
      });
    }

    return prisma.diaryEntry.create({
      data: {
        userId,
        date,
        type: 'MEASUREMENT',
        measurementEntry: {
          create: measurements,
        },
      },
      include: DIARY_ENTRY_INCLUDE,
    });
  },

  // ---- Mood ----
  async upsertMood(userId: string, date: Date, level: MoodLevel, notes?: string) {
    const existing = await prisma.diaryEntry.findFirst({
      where: { userId, date, type: 'MOOD' },
    });

    if (existing) {
      return prisma.diaryEntry.update({
        where: { id: existing.id },
        data: {
          moodEntry: {
            update: { level, notes },
          },
        },
        include: DIARY_ENTRY_INCLUDE,
      });
    }

    return prisma.diaryEntry.create({
      data: {
        userId,
        date,
        type: 'MOOD',
        moodEntry: {
          create: { level, notes },
        },
      },
      include: DIARY_ENTRY_INCLUDE,
    });
  },

  // ---- Food ----
  async getOrCreateFoodDiaryEntry(userId: string, date: Date) {
    const existing = await prisma.diaryEntry.findFirst({
      where: { userId, date, type: 'FOOD' },
    });
    if (existing) return existing;
    return prisma.diaryEntry.create({
      data: { userId, date, type: 'FOOD' },
    });
  },

  async createFoodEntries(diaryEntryId: string, items: Array<{
    name: string;
    mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
    calories: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
    fibreG?: number;
    servingSize?: number;
    servingUnit?: string;
    externalId?: string;
    thumbnailUrl?: string;
  }>) {
    return prisma.foodEntry.createMany({
      data: items.map(item => ({
        diaryEntryId,
        ...item,
      })),
    });
  },

  async findFoodEntriesByDiaryEntry(diaryEntryId: string) {
    return prisma.foodEntry.findMany({
      where: { diaryEntryId },
      orderBy: { createdAt: 'asc' },
    });
  },

  async findFoodEntryById(id: string) {
    return prisma.foodEntry.findUnique({
      where: { id },
      include: { diaryEntry: true },
    });
  },

  async updateFoodEntry(id: string, data: {
    servingSize?: number;
    calories?: number;
    proteinG?: number | null;
    carbsG?: number | null;
    fatG?: number | null;
  }) {
    return prisma.foodEntry.update({
      where: { id },
      data,
    });
  },

  async deleteFoodEntry(id: string) {
    return prisma.foodEntry.delete({ where: { id } });
  },

  async getDailyNutrition(userId: string, date: Date) {
    const foodEntry = await prisma.diaryEntry.findFirst({
      where: { userId, date, type: 'FOOD' },
      include: { foodEntries: true },
    });

    if (!foodEntry || foodEntry.foodEntries.length === 0) {
      return { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, totalFibre: 0, byMeal: {} };
    }

    const byMeal: Record<string, { calories: number; protein: number; carbs: number; fat: number; items: number }> = {};
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFibre = 0;

    for (const entry of foodEntry.foodEntries) {
      totalCalories += entry.calories;
      totalProtein += entry.proteinG ?? 0;
      totalCarbs += entry.carbsG ?? 0;
      totalFat += entry.fatG ?? 0;
      totalFibre += entry.fibreG ?? 0;

      if (!byMeal[entry.mealType]) {
        byMeal[entry.mealType] = { calories: 0, protein: 0, carbs: 0, fat: 0, items: 0 };
      }
      const meal = byMeal[entry.mealType]!;
      meal.calories += entry.calories;
      meal.protein += entry.proteinG ?? 0;
      meal.carbs += entry.carbsG ?? 0;
      meal.fat += entry.fatG ?? 0;
      meal.items += 1;
    }

    return { totalCalories, totalProtein, totalCarbs, totalFat, totalFibre, byMeal };
  },

  // ---- Workout Log ----
  async createWorkoutLog(userId: string, date: Date, data: {
    workoutPlanId?: string;
    workoutPlanName?: string;
    durationMinutes: number;
    caloriesBurned?: number;
    notes?: string;
  }) {
    return prisma.diaryEntry.create({
      data: {
        userId,
        date,
        type: 'WORKOUT_LOG',
        workoutLogEntry: {
          create: data,
        },
      },
      include: DIARY_ENTRY_INCLUDE,
    });
  },

  // ---- Activity ----
  async createActivity(userId: string, date: Date, data: {
    activityType: ActivityType;
    activityName?: string;
    distanceKm?: number;
    durationSeconds: number;
    avgPaceSecPerKm?: number;
    elevationGainM?: number;
    caloriesBurned?: number;
    notes?: string;
  }) {
    return prisma.diaryEntry.create({
      data: {
        userId,
        date,
        type: 'ACTIVITY',
        activityEntry: {
          create: data,
        },
      },
      include: DIARY_ENTRY_INCLUDE,
    });
  },

  // ---- Steps ----
  async upsertSteps(userId: string, date: Date, totalSteps: number) {
    const existing = await prisma.diaryEntry.findFirst({
      where: { userId, date, type: 'STEPS' },
    });

    if (existing) {
      return prisma.diaryEntry.update({
        where: { id: existing.id },
        data: {
          stepsEntry: {
            update: { totalSteps },
          },
        },
        include: DIARY_ENTRY_INCLUDE,
      });
    }

    return prisma.diaryEntry.create({
      data: {
        userId,
        date,
        type: 'STEPS',
        stepsEntry: {
          create: { totalSteps },
        },
      },
      include: DIARY_ENTRY_INCLUDE,
    });
  },

  async getDailyCaloriesBurned(userId: string, date: Date) {
    const result = await prisma.workoutLogEntry.aggregate({
      where: {
        diaryEntry: { userId, date, type: 'WORKOUT_LOG' },
        caloriesBurned: { not: null },
      },
      _sum: { caloriesBurned: true },
    });
    return result._sum.caloriesBurned ?? 0;
  },

  // ---- Progress Photos ----
  async getOrCreateProgressPhotoDiaryEntry(userId: string, date: Date) {
    const existing = await prisma.diaryEntry.findFirst({
      where: { userId, date, type: 'PROGRESS_PHOTO' },
    });
    if (existing) return existing;
    return prisma.diaryEntry.create({
      data: { userId, date, type: 'PROGRESS_PHOTO' },
    });
  },

  async createProgressPhotos(diaryEntryId: string, photos: Array<{
    imageUrl: string;
    category?: string;
    notes?: string;
    sortOrder?: number;
  }>) {
    return prisma.progressPhoto.createMany({
      data: photos.map(photo => ({
        diaryEntryId,
        ...photo,
      })),
    });
  },

  async findProgressPhotoById(id: string) {
    return prisma.progressPhoto.findUnique({
      where: { id },
      include: { diaryEntry: { select: { userId: true } } },
    });
  },

  async deleteProgressPhoto(id: string) {
    return prisma.progressPhoto.delete({
      where: { id },
    });
  },

  async getProgressPhotos(userId: string, startDate?: Date, endDate?: Date) {
    return prisma.diaryEntry.findMany({
      where: {
        userId,
        type: 'PROGRESS_PHOTO',
        ...(startDate && endDate ? { date: { gte: startDate, lte: endDate } } : {}),
      },
      include: {
        progressPhotos: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { date: 'desc' },
    });
  },

  // ---- Comments ----
  async createComment(diaryEntryId: string, userId: string, content: string) {
    return prisma.diaryComment.create({
      data: { diaryEntryId, userId, content },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
  },

  async findCommentsByDiaryEntry(diaryEntryId: string) {
    return prisma.diaryComment.findMany({
      where: { diaryEntryId },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: 'asc' },
    });
  },

  async findCommentById(id: string) {
    return prisma.diaryComment.findUnique({
      where: { id },
      include: { diaryEntry: true },
    });
  },

  async deleteComment(id: string) {
    return prisma.diaryComment.delete({ where: { id } });
  },

  // ---- Activity Feed ----
  async findRecentClientActivity(clientUserIds: string[], limit: number) {
    return prisma.diaryEntry.findMany({
      where: {
        userId: { in: clientUserIds },
        date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      include: {
        ...DIARY_ENTRY_INCLUDE,
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  // ---- Sleep ----
  async upsertSleep(userId: string, date: Date, hoursSlept: number, quality: number) {
    const existing = await prisma.diaryEntry.findFirst({
      where: { userId, date, type: 'SLEEP' },
    });

    if (existing) {
      return prisma.diaryEntry.update({
        where: { id: existing.id },
        data: {
          sleepEntry: {
            update: { hoursSlept, quality },
          },
        },
        include: DIARY_ENTRY_INCLUDE,
      });
    }

    return prisma.diaryEntry.create({
      data: {
        userId,
        date,
        type: 'SLEEP',
        sleepEntry: {
          create: { hoursSlept, quality },
        },
      },
      include: DIARY_ENTRY_INCLUDE,
    });
  },

  // ---- Public profile queries ----

  async findRecentByUserId(userId: string, limit: number) {
    return prisma.diaryEntry.findMany({
      where: { userId },
      include: DIARY_ENTRY_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async findProgressPhotosByUserId(userId: string, limit: number) {
    return prisma.diaryEntry.findMany({
      where: { userId, type: 'PROGRESS_PHOTO' },
      include: {
        progressPhotos: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { date: 'desc' },
      take: limit,
    });
  },

  async findWeightHistory(userId: string, limit: number) {
    return prisma.diaryEntry.findMany({
      where: { userId, type: 'WEIGHT' },
      include: { weightEntry: true },
      orderBy: { date: 'desc' },
      take: limit,
    });
  },
};
