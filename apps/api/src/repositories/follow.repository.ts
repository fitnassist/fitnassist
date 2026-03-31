import { prisma } from '../lib/prisma';

const userSelect = {
  id: true,
  name: true,
  image: true,
  trainerProfile: {
    select: {
      displayName: true,
      profileImageUrl: true,
      handle: true,
    },
  },
  traineeProfile: {
    select: {
      avatarUrl: true,
      handle: true,
    },
  },
};

export const followRepository = {
  async create(followerId: string, followingId: string) {
    return prisma.follow.create({
      data: { followerId, followingId },
    });
  },

  async delete(followerId: string, followingId: string) {
    return prisma.follow.delete({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
  },

  async findFollowers(userId: string, cursor?: string, limit = 20) {
    const items = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: { select: userSelect },
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

  async findFollowing(userId: string, cursor?: string, limit = 20) {
    const items = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: { select: userSelect },
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

  async isFollowing(followerId: string, followingId: string) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
      select: { id: true },
    });
    return !!follow;
  },

  async getFollowerCount(userId: string) {
    return prisma.follow.count({
      where: { followingId: userId },
    });
  },

  async getFollowingCount(userId: string) {
    return prisma.follow.count({
      where: { followerId: userId },
    });
  },
};
