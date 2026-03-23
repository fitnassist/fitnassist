import { prisma } from '../lib/prisma';

export interface CreateMessageParams {
  connectionId: string;
  senderId: string;
  content: string;
}

export const messageRepository = {
  async create(data: CreateMessageParams) {
    return prisma.message.create({
      data: {
        connectionId: data.connectionId,
        senderId: data.senderId,
        content: data.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            trainerProfile: {
              select: {
                profileImageUrl: true,
              },
            },
            traineeProfile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  },

  async findByConnectionId(
    connectionId: string,
    options?: { limit?: number; cursor?: string; afterDate?: Date }
  ) {
    const { limit = 50, cursor, afterDate } = options || {};

    return prisma.message.findMany({
      where: {
        connectionId,
        ...(afterDate && { createdAt: { gte: afterDate } }),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            trainerProfile: {
              select: {
                profileImageUrl: true,
              },
            },
            traineeProfile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });
  },

  async markAsRead(messageIds: string[], userId: string) {
    return prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        senderId: { not: userId }, // Only mark messages from others as read
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  },

  async markConnectionAsRead(connectionId: string, userId: string) {
    return prisma.message.updateMany({
      where: {
        connectionId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  },

  async getUnreadCount(userId: string, deletedAtMap?: Map<string, Date>) {
    // Get connections where user is either the sender or trainer
    // Exclude archived conversations
    const connections = await prisma.contactRequest.findMany({
      where: {
        OR: [
          { senderId: userId },
          { trainer: { userId } },
        ],
        status: 'ACCEPTED',
        NOT: {
          conversationPreferences: {
            some: { userId, isArchived: true },
          },
        },
      },
      select: { id: true },
    });

    const connectionIds = connections.map((c) => c.id);

    if (connectionIds.length === 0) return 0;

    // If we have deletedAt info, we need to count per-connection
    if (deletedAtMap && deletedAtMap.size > 0) {
      const counts = await Promise.all(
        connectionIds.map(async (connId) => {
          const deletedAt = deletedAtMap.get(connId);
          return prisma.message.count({
            where: {
              connectionId: connId,
              senderId: { not: userId },
              isRead: false,
              ...(deletedAt && { createdAt: { gte: deletedAt } }),
            },
          });
        })
      );
      return counts.reduce((sum, c) => sum + c, 0);
    }

    return prisma.message.count({
      where: {
        connectionId: { in: connectionIds },
        senderId: { not: userId },
        isRead: false,
      },
    });
  },

  async getUnreadCountByConnection(connectionId: string, userId: string, afterDate?: Date) {
    return prisma.message.count({
      where: {
        connectionId,
        senderId: { not: userId },
        isRead: false,
        ...(afterDate && { createdAt: { gte: afterDate } }),
      },
    });
  },
};
