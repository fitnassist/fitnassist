import { prisma } from '../lib/prisma';

export const pushSubscriptionRepository = {
  async create(data: {
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }) {
    return prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      update: {
        userId: data.userId,
        p256dh: data.p256dh,
        auth: data.auth,
      },
      create: data,
    });
  },

  async findByUserId(userId: string) {
    return prisma.pushSubscription.findMany({
      where: { userId },
    });
  },

  async deleteByEndpoint(endpoint: string) {
    return prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });
  },
};
