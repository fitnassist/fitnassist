import { prisma } from '../lib/prisma';

export const conversationPreferenceRepository = {
  async upsertArchive(connectionId: string, userId: string, isArchived: boolean) {
    return prisma.conversationPreference.upsert({
      where: { connectionId_userId: { connectionId, userId } },
      create: { connectionId, userId, isArchived },
      update: { isArchived },
    });
  },

  async upsertDelete(connectionId: string, userId: string) {
    return prisma.conversationPreference.upsert({
      where: { connectionId_userId: { connectionId, userId } },
      create: { connectionId, userId, deletedAt: new Date() },
      update: { deletedAt: new Date() },
    });
  },

  async findByUser(userId: string) {
    return prisma.conversationPreference.findMany({
      where: { userId },
    });
  },

  async findByConnectionAndUser(connectionId: string, userId: string) {
    return prisma.conversationPreference.findUnique({
      where: { connectionId_userId: { connectionId, userId } },
    });
  },
};
