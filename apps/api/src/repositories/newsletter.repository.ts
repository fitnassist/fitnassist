import { prisma } from '../lib/prisma';

export const newsletterRepository = {
  async subscribe(email: string) {
    return prisma.newsletterSubscription.upsert({
      where: { email },
      update: {},
      create: { email },
    });
  },

  async unsubscribe(email: string) {
    return prisma.newsletterSubscription.delete({
      where: { email },
    }).catch(() => null);
  },

  async isSubscribed(email: string) {
    const subscription = await prisma.newsletterSubscription.findUnique({
      where: { email },
    });
    return !!subscription;
  },

  async getAll() {
    return prisma.newsletterSubscription.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  async getCount() {
    return prisma.newsletterSubscription.count();
  },
};
