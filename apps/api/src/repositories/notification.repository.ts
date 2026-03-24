import { prisma } from '../lib/prisma';
import type { NotificationType, Prisma } from '@fitnassist/database';

export const notificationRepository = {
  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    data?: Prisma.InputJsonValue;
    link?: string;
  }) {
    return prisma.notification.create({
      data,
    });
  },

  async findByUserId(
    userId: string,
    options: {
      cursor?: string;
      limit?: number;
      includeDismissed?: boolean;
    } = {}
  ) {
    const { cursor, limit = 20, includeDismissed = false } = options;

    const where = {
      userId,
      ...(!includeDismissed && { isDismissed: false }),
    };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    return { items, nextCursor };
  },

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
        isDismissed: false,
      },
    });
  },

  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  },

  async dismiss(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isDismissed: true },
    });
  },

  async findExistingUnread(userId: string, type: NotificationType, dataMatch?: Prisma.InputJsonValue) {
    return prisma.notification.findFirst({
      where: {
        userId,
        type,
        isRead: false,
        isDismissed: false,
        ...(dataMatch && { data: { equals: dataMatch } }),
      },
    });
  },

  async deleteOlderThan(days: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return prisma.notification.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
  },

  async deleteDismissedOlderThan(days: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return prisma.notification.deleteMany({
      where: {
        isDismissed: true,
        createdAt: { lt: cutoff },
      },
    });
  },
};
