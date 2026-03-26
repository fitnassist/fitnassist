import { prisma } from '../lib/prisma';
import type { DiaryEntryType, PostType, Visibility } from '@fitnassist/database';

const postAuthorSelect = {
  id: true,
  name: true,
  image: true,
  role: true,
  trainerProfile: {
    select: {
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

export const postRepository = {
  async create(data: {
    userId: string;
    content: string;
    imageUrl?: string;
    type?: PostType;
    visibility?: Visibility;
  }) {
    return prisma.post.create({
      data: {
        userId: data.userId,
        content: data.content,
        imageUrl: data.imageUrl,
        type: data.type ?? 'UPDATE',
        visibility: data.visibility ?? 'EVERYONE',
      },
      include: {
        user: { select: postAuthorSelect },
        _count: { select: { likes: true } },
      },
    });
  },

  async findById(id: string) {
    return prisma.post.findUnique({
      where: { id },
      include: {
        user: { select: postAuthorSelect },
        _count: { select: { likes: true } },
      },
    });
  },

  async delete(id: string) {
    return prisma.post.delete({
      where: { id },
    });
  },

  async getFeed(
    userId: string,
    friendIds: string[],
    followingIds: string[],
    cursor?: string,
    limit = 20
  ) {
    const items = await prisma.post.findMany({
      where: {
        OR: [
          // Own posts
          { userId },
          // Posts from trainers I follow (public only)
          {
            userId: { in: followingIds },
            visibility: 'EVERYONE',
          },
          // Posts from friends (EVERYONE or PT_AND_FRIENDS)
          {
            userId: { in: friendIds },
            visibility: { in: ['EVERYONE', 'PT_AND_FRIENDS'] },
          },
        ],
      },
      include: {
        user: { select: postAuthorSelect },
        _count: { select: { likes: true } },
        likes: {
          where: { userId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > limit;
    const results = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? results[results.length - 1]?.id : undefined;

    return {
      items: results.map((item) => ({
        ...item,
        hasLiked: item.likes.length > 0,
        likeCount: item._count.likes,
        likes: undefined,
        _count: undefined,
      })),
      nextCursor,
    };
  },

  async getUserPosts(
    userId: string,
    viewerId: string,
    allowedVisibilities: Visibility[],
    cursor?: string,
    limit = 20
  ) {
    const items = await prisma.post.findMany({
      where: {
        userId,
        visibility: { in: allowedVisibilities },
      },
      include: {
        user: { select: postAuthorSelect },
        _count: { select: { likes: true } },
        likes: {
          where: { userId: viewerId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > limit;
    const results = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? results[results.length - 1]?.id : undefined;

    return {
      items: results.map((item) => ({
        ...item,
        hasLiked: item.likes.length > 0,
        likeCount: item._count.likes,
        likes: undefined,
        _count: undefined,
      })),
      nextCursor,
    };
  },

  async likePost(postId: string, userId: string) {
    return prisma.postLike.create({
      data: { postId, userId },
    });
  },

  async unlikePost(postId: string, userId: string) {
    return prisma.postLike.delete({
      where: {
        postId_userId: { postId, userId },
      },
    });
  },

  async hasLiked(postId: string, userId: string) {
    const like = await prisma.postLike.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
      select: { id: true },
    });
    return !!like;
  },

  async getLikeCount(postId: string) {
    return prisma.postLike.count({
      where: { postId },
    });
  },

  async likeDiaryEntry(diaryEntryId: string, userId: string) {
    return prisma.diaryEntryLike.create({
      data: { diaryEntryId, userId },
    });
  },

  async unlikeDiaryEntry(diaryEntryId: string, userId: string) {
    return prisma.diaryEntryLike.delete({
      where: {
        diaryEntryId_userId: { diaryEntryId, userId },
      },
    });
  },

  async hasDiaryEntryLiked(diaryEntryId: string, userId: string) {
    const like = await prisma.diaryEntryLike.findUnique({
      where: {
        diaryEntryId_userId: { diaryEntryId, userId },
      },
      select: { id: true },
    });
    return !!like;
  },

  async getDiaryEntryLikeCount(diaryEntryId: string) {
    return prisma.diaryEntryLike.count({
      where: { diaryEntryId },
    });
  },

  async getPostLikers(postId: string, limit = 10) {
    return prisma.postLike.findMany({
      where: { postId },
      select: {
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async getDiaryEntryLikers(diaryEntryId: string, limit = 10) {
    return prisma.diaryEntryLike.findMany({
      where: { diaryEntryId },
      select: {
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async getFeedDiaryEntries(
    friendIds: string[],
    viewerId: string,
    allowedEntryTypes: DiaryEntryType[],
    beforeDate?: Date,
    limit = 20
  ) {
    if (friendIds.length === 0 || allowedEntryTypes.length === 0) {
      return [];
    }

    const items = await prisma.diaryEntry.findMany({
      where: {
        userId: { in: friendIds },
        type: { in: allowedEntryTypes },
        ...(beforeDate ? { createdAt: { lt: beforeDate } } : {}),
      },
      include: {
        user: {
          select: {
            ...postAuthorSelect,
          },
        },
        weightEntry: true,
        waterEntry: true,
        moodEntry: true,
        sleepEntry: true,
        stepsEntry: true,
        activityEntry: true,
        workoutLogEntry: {
          include: { workoutPlan: { select: { id: true, name: true } } },
        },
        foodEntries: { take: 0 }, // Just need count, handled below
        _count: {
          select: { likes: true, foodEntries: true },
        },
        likes: {
          where: { userId: viewerId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return items.map((item) => ({
      ...item,
      hasLiked: item.likes.length > 0,
      likeCount: item._count.likes,
      foodEntryCount: item._count.foodEntries,
      likes: undefined,
      _count: undefined,
    }));
  },
};
