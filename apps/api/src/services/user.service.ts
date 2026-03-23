import { TRPCError } from '@trpc/server';
import { userRepository } from '../repositories/user.repository';
import type { NotificationPreferencesInput } from '@fitnassist/schemas';

export const userService = {
  async getNotificationPreferences(userId: string) {
    const preferences = await userRepository.getNotificationPreferences(userId);

    if (!preferences) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return preferences;
  },

  async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferencesInput
  ) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return userRepository.updateNotificationPreferences(userId, preferences);
  },
};
