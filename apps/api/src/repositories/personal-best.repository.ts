import { prisma } from '../lib/prisma';
import type { PersonalBestCategory, ActivityType } from '@fitnassist/database';

export const personalBestRepository = {
  async findByUser(userId: string) {
    return prisma.personalBest.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async findRecent(userId: string, limit: number) {
    return prisma.personalBest.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  },

  async findByKey(userId: string, category: PersonalBestCategory, activityType?: ActivityType | null, distanceKm?: number | null) {
    return prisma.personalBest.findFirst({
      where: {
        userId,
        category,
        activityType: activityType ?? null,
        distanceKm: distanceKm ?? null,
      },
    });
  },

  async upsertPB(data: {
    userId: string;
    category: PersonalBestCategory;
    activityType?: ActivityType | null;
    distanceKm?: number | null;
    value: number;
    unit: string;
    label: string;
    achievedAt: Date;
    diaryEntryId?: string | null;
    previousValue?: number | null;
    previousDate?: Date | null;
  }) {
    const existing = await prisma.personalBest.findFirst({
      where: {
        userId: data.userId,
        category: data.category,
        activityType: data.activityType ?? null,
        distanceKm: data.distanceKm ?? null,
      },
    });

    if (existing) {
      return prisma.personalBest.update({
        where: { id: existing.id },
        data: {
          value: data.value,
          label: data.label,
          achievedAt: data.achievedAt,
          diaryEntryId: data.diaryEntryId,
          previousValue: data.previousValue,
          previousDate: data.previousDate,
        },
      });
    }

    return prisma.personalBest.create({
      data: {
        userId: data.userId,
        category: data.category,
        activityType: data.activityType,
        distanceKm: data.distanceKm,
        value: data.value,
        unit: data.unit,
        label: data.label,
        achievedAt: data.achievedAt,
        diaryEntryId: data.diaryEntryId,
        previousValue: data.previousValue,
        previousDate: data.previousDate,
      },
    });
  },
};
