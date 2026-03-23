import { prisma } from '../lib/prisma';
import type { Prisma } from '@fitnassist/database';

export const traineeRepository = {
  async findByUserId(userId: string) {
    return prisma.traineeProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
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

  async delete(id: string) {
    return prisma.traineeProfile.delete({
      where: { id },
    });
  },
};
