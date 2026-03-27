import { prisma } from '../lib/prisma';

export const sessionPriceRepository = {
  findByTrainerId: (trainerId: string) => {
    return prisma.sessionPrice.findUnique({
      where: { trainerId },
    });
  },

  upsert: (trainerId: string, amount: number, currency: string = 'gbp') => {
    return prisma.sessionPrice.upsert({
      where: { trainerId },
      create: { trainerId, amount, currency },
      update: { amount, currency },
    });
  },
};
