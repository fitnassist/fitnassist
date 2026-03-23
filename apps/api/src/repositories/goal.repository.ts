import { prisma } from '../lib/prisma';
import type { GoalStatus, GoalType, DiaryEntryType } from '@fitnassist/database';

export const goalRepository = {
  async create(data: {
    userId: string;
    createdById: string;
    name: string;
    description?: string;
    type: GoalType;
    targetValue?: number;
    targetUnit?: string;
    currentValue?: number;
    entryType?: DiaryEntryType;
    entryField?: string;
    frequencyPerWeek?: number;
    habitEntryType?: DiaryEntryType;
    deadline?: Date;
  }) {
    return prisma.goal.create({ data });
  },

  async findByUserId(userId: string, status?: GoalStatus) {
    return prisma.goal.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  },

  async findById(id: string) {
    return prisma.goal.findUnique({ where: { id } });
  },

  async update(id: string, data: {
    name?: string;
    description?: string | null;
    targetValue?: number;
    currentValue?: number;
    frequencyPerWeek?: number;
    deadline?: Date | null;
    status?: GoalStatus;
    completedAt?: Date | null;
  }) {
    return prisma.goal.update({
      where: { id },
      data,
    });
  },

  async findActiveTargetGoals(userId: string, entryType: DiaryEntryType) {
    return prisma.goal.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        type: 'TARGET',
        entryType,
      },
    });
  },

  async findActiveHabitGoals(userId: string, habitEntryType: DiaryEntryType) {
    return prisma.goal.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        type: 'HABIT',
        habitEntryType,
      },
    });
  },

  async findRecentCompletedByUserIds(userIds: string[], limit: number) {
    return prisma.goal.findMany({
      where: {
        userId: { in: userIds },
        status: 'COMPLETED',
        completedAt: { not: null },
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });
  },

  async getWeeklyHabitProgress(userId: string, habitEntryType: DiaryEntryType, weekStart: Date) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const count = await prisma.diaryEntry.count({
      where: {
        userId,
        type: habitEntryType,
        date: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
    });

    return count;
  },
};
