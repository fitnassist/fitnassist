import { prisma } from '../lib/prisma';
import type { Prisma, Visibility } from '@fitnassist/database';

export const traineeRepository = {
  async findByUserId(userId: string) {
    return prisma.traineeProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
  },

  async findByHandle(handle: string) {
    return prisma.traineeProfile.findUnique({
      where: { handle },
      include: { user: true },
    });
  },

  async findByHandleOrUserId(identifier: string) {
    // Try handle first, then userId
    const byHandle = await prisma.traineeProfile.findUnique({
      where: { handle: identifier },
      include: { user: true },
    });
    if (byHandle) return byHandle;

    return prisma.traineeProfile.findUnique({
      where: { userId: identifier },
      include: { user: true },
    });
  },

  async isHandleAvailable(handle: string, excludeUserId?: string) {
    const existing = await prisma.traineeProfile.findUnique({
      where: { handle },
      select: { userId: true },
    });
    if (!existing) return true;
    if (excludeUserId && existing.userId === excludeUserId) return true;
    return false;
  },

  async create(userId: string, data: Prisma.TraineeProfileCreateWithoutUserInput) {
    return prisma.traineeProfile.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
      },
      include: { user: true },
    });
  },

  async update(id: string, data: Prisma.TraineeProfileUpdateInput) {
    return prisma.traineeProfile.update({
      where: { id },
      data,
      include: { user: true },
    });
  },

  async updatePrivacySettings(
    userId: string,
    settings: Record<string, Visibility>,
  ) {
    return prisma.traineeProfile.update({
      where: { userId },
      data: settings,
      include: { user: true },
    });
  },

  async delete(id: string) {
    return prisma.traineeProfile.delete({
      where: { id },
    });
  },
};
