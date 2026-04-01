import { prisma } from '../lib/prisma';

export const expoPushTokenRepository = {
  async upsert(data: { userId: string; token: string; platform?: string }) {
    return prisma.expoPushToken.upsert({
      where: { token: data.token },
      update: {
        userId: data.userId,
        platform: data.platform,
      },
      create: data,
    });
  },

  async findByUserId(userId: string) {
    return prisma.expoPushToken.findMany({
      where: { userId },
    });
  },

  async deleteByToken(token: string) {
    return prisma.expoPushToken.deleteMany({
      where: { token },
    });
  },
};
