import { prisma } from '../lib/prisma';
import type { FriendshipStatus } from '@fitnassist/database';

const otherUserSelect = {
  id: true,
  name: true,
  image: true,
  traineeProfile: {
    select: {
      avatarUrl: true,
      handle: true,
    },
  },
};

export const friendshipRepository = {
  async createRequest(requesterId: string, addresseeId: string) {
    return prisma.friendship.create({
      data: {
        requesterId,
        addresseeId,
        status: 'PENDING',
      },
      include: {
        requester: true,
        addressee: true,
      },
    });
  },

  async findById(id: string) {
    return prisma.friendship.findUnique({
      where: { id },
      include: {
        requester: true,
        addressee: true,
      },
    });
  },

  async updateStatus(id: string, status: FriendshipStatus) {
    return prisma.friendship.update({
      where: { id },
      data: { status },
    });
  },

  async findFriends(userId: string, cursor?: string, limit = 20) {
    const items = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
      include: {
        requester: { select: otherUserSelect },
        addressee: { select: otherUserSelect },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > limit;
    const results = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? results[results.length - 1]?.id : undefined;

    return { items: results, nextCursor };
  },

  async findPendingRequests(userId: string, cursor?: string, limit = 20) {
    const items = await prisma.friendship.findMany({
      where: {
        addresseeId: userId,
        status: 'PENDING',
      },
      include: {
        requester: { select: otherUserSelect },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > limit;
    const results = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? results[results.length - 1]?.id : undefined;

    return { items: results, nextCursor };
  },

  async findSentRequests(userId: string, cursor?: string, limit = 20) {
    const items = await prisma.friendship.findMany({
      where: {
        requesterId: userId,
        status: 'PENDING',
      },
      include: {
        addressee: { select: otherUserSelect },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > limit;
    const results = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? results[results.length - 1]?.id : undefined;

    return { items: results, nextCursor };
  },

  async areFriends(userIdA: string, userIdB: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: userIdA, addresseeId: userIdB },
          { requesterId: userIdB, addresseeId: userIdA },
        ],
      },
    });

    return !!friendship;
  },

  async findExisting(userIdA: string, userIdB: string) {
    return prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userIdA, addresseeId: userIdB },
          { requesterId: userIdB, addresseeId: userIdA },
        ],
      },
    });
  },

  async getFriendCount(userId: string) {
    return prisma.friendship.count({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
    });
  },

  async getPendingCount(userId: string) {
    return prisma.friendship.count({
      where: {
        addresseeId: userId,
        status: 'PENDING',
      },
    });
  },

  async delete(id: string) {
    return prisma.friendship.delete({
      where: { id },
    });
  },

  async isBlocked(userIdA: string, userIdB: string) {
    const blocked = await prisma.friendship.findFirst({
      where: {
        status: 'BLOCKED',
        OR: [
          { requesterId: userIdA, addresseeId: userIdB },
          { requesterId: userIdB, addresseeId: userIdA },
        ],
      },
    });

    return !!blocked;
  },
};
