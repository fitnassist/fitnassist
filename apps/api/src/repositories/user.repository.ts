import { prisma } from '../lib/prisma';
import type { Prisma } from '@fitnassist/database';

export const userRepository = {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
    });
  },

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  },

  async getNotificationPreferences(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailNotifyConnectionRequests: true,
        emailNotifyMessages: true,
        emailNotifyMarketing: true,
        smsNotifyConnectionRequests: true,
        smsNotifyMessages: true,
        pushNotifyConnectionRequests: true,
        pushNotifyMessages: true,
      },
    });
  },

  async updateNotificationPreferences(
    userId: string,
    preferences: {
      emailNotifyConnectionRequests?: boolean;
      emailNotifyMessages?: boolean;
      emailNotifyMarketing?: boolean;
      smsNotifyConnectionRequests?: boolean;
      smsNotifyMessages?: boolean;
      pushNotifyConnectionRequests?: boolean;
      pushNotifyMessages?: boolean;
    }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: preferences,
      select: {
        emailNotifyConnectionRequests: true,
        emailNotifyMessages: true,
        emailNotifyMarketing: true,
        smsNotifyConnectionRequests: true,
        smsNotifyMessages: true,
        pushNotifyConnectionRequests: true,
        pushNotifyMessages: true,
      },
    });
  },
};
