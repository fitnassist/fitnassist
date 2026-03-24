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
        emailNotifyWeeklyReport: true,
        emailNotifyBookings: true,
        emailNotifyBookingReminders: true,
        smsNotifyConnectionRequests: true,
        smsNotifyMessages: true,
        pushNotifyConnectionRequests: true,
        pushNotifyMessages: true,
        pushNotifyBookings: true,
        pushNotifyBookingReminders: true,
        pushNotifyPlanAssignments: true,
        pushNotifyOnboarding: true,
        pushNotifyDiary: true,
        pushNotifyGoals: true,
      },
    });
  },

  async updateNotificationPreferences(
    userId: string,
    preferences: {
      emailNotifyConnectionRequests?: boolean;
      emailNotifyMessages?: boolean;
      emailNotifyMarketing?: boolean;
      emailNotifyWeeklyReport?: boolean;
      emailNotifyBookings?: boolean;
      emailNotifyBookingReminders?: boolean;
      smsNotifyConnectionRequests?: boolean;
      smsNotifyMessages?: boolean;
      pushNotifyConnectionRequests?: boolean;
      pushNotifyMessages?: boolean;
      pushNotifyBookings?: boolean;
      pushNotifyBookingReminders?: boolean;
      pushNotifyPlanAssignments?: boolean;
      pushNotifyOnboarding?: boolean;
      pushNotifyDiary?: boolean;
      pushNotifyGoals?: boolean;
    }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: preferences,
      select: {
        emailNotifyConnectionRequests: true,
        emailNotifyMessages: true,
        emailNotifyMarketing: true,
        emailNotifyWeeklyReport: true,
        emailNotifyBookings: true,
        emailNotifyBookingReminders: true,
        smsNotifyConnectionRequests: true,
        smsNotifyMessages: true,
        pushNotifyConnectionRequests: true,
        pushNotifyMessages: true,
        pushNotifyBookings: true,
        pushNotifyBookingReminders: true,
        pushNotifyPlanAssignments: true,
        pushNotifyOnboarding: true,
        pushNotifyDiary: true,
        pushNotifyGoals: true,
      },
    });
  },
};
