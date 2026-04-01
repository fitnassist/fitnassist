import type { NotificationType, Prisma } from '@fitnassist/database';
import { notificationRepository } from '../repositories/notification.repository';
import { webPushService } from './web-push.service';
import { expoPushService } from './expo-push.service';
import { sseManager } from '../lib/sse';

interface NotifyParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Prisma.InputJsonValue;
  link?: string;
}

export const inAppNotificationService = {
  /**
   * Create a persistent notification and broadcast via SSE.
   * Returns the created notification.
   */
  async notify(params: NotifyParams) {
    const notification = await notificationRepository.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data,
      link: params.link,
    });

    // Broadcast via SSE for live updates
    sseManager.broadcastToUser(params.userId, 'message', {
      type: 'notification',
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        link: notification.link,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      },
    });

    const pushPayload = {
      title: params.title,
      body: params.body,
      link: params.link,
      type: params.type,
    };

    // Send browser push notification (fire and forget)
    webPushService.sendPushNotification(params.userId, params.type, pushPayload).catch(() => {});

    // Send Expo mobile push notification (fire and forget)
    expoPushService.sendPushNotification(params.userId, params.type, pushPayload).catch(() => {});

    return notification;
  },

  /**
   * Send the same notification to multiple users.
   */
  async notifyMany(userIds: string[], params: Omit<NotifyParams, 'userId'>) {
    const results = await Promise.allSettled(
      userIds.map((userId) => this.notify({ ...params, userId }))
    );

    return results
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof this.notify>>> => r.status === 'fulfilled')
      .map((r) => r.value);
  },

  /**
   * Notify only if there isn't already an unread notification of the same type
   * with matching data for this user. Useful for deduplicating NEW_MESSAGE notifications.
   */
  async notifyIfNotExists(params: NotifyParams) {
    const existing = await notificationRepository.findExistingUnread(
      params.userId,
      params.type,
      params.data
    );

    if (existing) return existing;

    return this.notify(params);
  },
};
