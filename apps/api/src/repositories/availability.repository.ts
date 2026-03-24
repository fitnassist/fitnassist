import { prisma } from '../lib/prisma';
import type { DayOfWeek } from '@fitnassist/database';

export const availabilityRepository = {
  findByTrainerId: (trainerId: string) => {
    return prisma.availability.findMany({
      where: { trainerId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  },

  findByTrainerAndDay: (trainerId: string, dayOfWeek: DayOfWeek) => {
    return prisma.availability.findMany({
      where: { trainerId, dayOfWeek },
      orderBy: { startTime: 'asc' },
    });
  },

  create: (data: {
    trainerId: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    sessionDurationMin?: number;
  }) => {
    return prisma.availability.create({ data });
  },

  update: (id: string, data: {
    startTime?: string;
    endTime?: string;
    sessionDurationMin?: number;
  }) => {
    return prisma.availability.update({ where: { id }, data });
  },

  delete: (id: string) => {
    return prisma.availability.delete({ where: { id } });
  },

  deleteByTrainerAndDay: (trainerId: string, dayOfWeek: DayOfWeek) => {
    return prisma.availability.deleteMany({
      where: { trainerId, dayOfWeek },
    });
  },

  // Bulk replace availability for a trainer (used by weekly schedule builder)
  replaceAll: async (trainerId: string, slots: {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    sessionDurationMin: number;
  }[]) => {
    return prisma.$transaction([
      prisma.availability.deleteMany({ where: { trainerId } }),
      prisma.availability.createMany({
        data: slots.map((slot) => ({ ...slot, trainerId })),
      }),
    ]);
  },

  // Overrides
  findOverridesByTrainerAndDateRange: (trainerId: string, startDate: Date, endDate: Date) => {
    return prisma.availabilityOverride.findMany({
      where: {
        trainerId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });
  },

  findOverrideByTrainerAndDate: (trainerId: string, date: Date) => {
    return prisma.availabilityOverride.findFirst({
      where: { trainerId, date },
    });
  },

  createOverride: (data: {
    trainerId: string;
    date: Date;
    isBlocked?: boolean;
    startTime?: string;
    endTime?: string;
    reason?: string;
  }) => {
    return prisma.availabilityOverride.create({ data });
  },

  deleteOverride: (id: string) => {
    return prisma.availabilityOverride.delete({ where: { id } });
  },
};
