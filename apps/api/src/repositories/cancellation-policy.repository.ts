import { prisma } from '../lib/prisma';

export const cancellationPolicyRepository = {
  findByTrainerId: (trainerId: string) => {
    return prisma.cancellationPolicy.findUnique({
      where: { trainerId },
    });
  },

  upsert: (trainerId: string, data: {
    fullRefundHours: number;
    partialRefundHours: number;
    partialRefundPercent: number;
  }) => {
    return prisma.cancellationPolicy.upsert({
      where: { trainerId },
      create: { trainerId, ...data },
      update: data,
    });
  },
};
