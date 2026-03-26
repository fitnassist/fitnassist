import { TRPCError } from '@trpc/server';
import type { DiaryEntryType, Visibility } from '@fitnassist/database';
import { postRepository } from '../repositories/post.repository';
import { friendshipRepository } from '../repositories/friendship.repository';
import { badgeService } from './badge.service';
import { inAppNotificationService } from './in-app-notification.service';
import { sseManager } from '../lib/sse';
import { prisma } from '../lib/prisma';

// Map diary entry types to the privacy field that controls their visibility
const DIARY_TYPE_PRIVACY_FIELD: Record<DiaryEntryType, string> = {
  WEIGHT: 'privacyTrendWeight',
  WATER: 'privacyTrendWater',
  MEASUREMENT: 'privacyTrendMeasurements',
  MOOD: 'privacyTrendMood',
  SLEEP: 'privacyTrendSleep',
  FOOD: 'privacyTrendNutrition',
  WORKOUT_LOG: 'privacyTrendActivity',
  PROGRESS_PHOTO: 'privacyProgressPhotos',
  STEPS: 'privacyTrendSteps',
  ACTIVITY: 'privacyTrendActivity',
};

const FRIEND_VISIBLE_LEVELS: Visibility[] = ['PT_AND_FRIENDS', 'EVERYONE'];

const getFriendIds = async (userId: string): Promise<string[]> => {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });

  return friendships.map((f) =>
    f.requesterId === userId ? f.addresseeId : f.requesterId
  );
};

const getFollowingIds = async (userId: string): Promise<string[]> => {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  return follows.map((f) => f.followingId);
};

const getFollowerIds = async (userId: string): Promise<string[]> => {
  const follows = await prisma.follow.findMany({
    where: { followingId: userId },
    select: { followerId: true },
  });

  return follows.map((f) => f.followerId);
};

export const postService = {
  async createPost(
    userId: string,
    data: { content: string; imageUrl?: string; visibility?: Visibility }
  ) {
    const post = await postRepository.create({
      userId,
      content: data.content,
      imageUrl: data.imageUrl,
      visibility: data.visibility,
    });

    // Broadcast to friends and followers based on visibility
    const recipientIds = new Set<string>();

    if (post.visibility === 'EVERYONE') {
      // Notify followers + friends
      const [followerIds, friendIds] = await Promise.all([
        getFollowerIds(userId),
        getFriendIds(userId),
      ]);
      followerIds.forEach((id) => recipientIds.add(id));
      friendIds.forEach((id) => recipientIds.add(id));
    } else if (post.visibility === 'PT_AND_FRIENDS') {
      // Notify friends only
      const friendIds = await getFriendIds(userId);
      friendIds.forEach((id) => recipientIds.add(id));
    }

    // Remove self from recipients
    recipientIds.delete(userId);

    if (recipientIds.size > 0) {
      const recipientArray = Array.from(recipientIds);

      // SSE broadcast for live feed updates
      sseManager.broadcastToUsers(recipientArray, 'message', {
        type: 'new_post',
        postId: post.id,
        authorName: post.user.name,
      });
    }

    badgeService.checkAndAwardBadges(userId, 'POST').catch(() => {});

    return {
      ...post,
      hasLiked: false,
      likeCount: 0,
    };
  },

  async deletePost(userId: string, postId: string) {
    const post = await postRepository.findById(postId);
    if (!post) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      });
    }

    if (post.userId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only delete your own posts',
      });
    }

    return postRepository.delete(postId);
  },

  async getFeed(userId: string, cursor?: string, limit = 20) {
    const [friendIds, followingIds] = await Promise.all([
      getFriendIds(userId),
      getFollowingIds(userId),
    ]);

    // Parse cursor — format: "timestamp|type|id" or just a post ID for backwards compat
    let postCursor: string | undefined;
    let diaryCursorDate: Date | undefined;

    if (cursor) {
      const pipeIdx = cursor.indexOf('|');
      if (pipeIdx !== -1) {
        const parts = cursor.split('|');
        if (parts[0]) diaryCursorDate = new Date(parts[0]);
        if (parts[2]) postCursor = parts[2];
      } else {
        postCursor = cursor;
      }
    }

    // Get posts
    const postsResult = await postRepository.getFeed(
      userId, friendIds, followingIds, postCursor, limit
    );

    // Get diary entries from friends based on their privacy settings
    let allowedDiaryTypes: DiaryEntryType[] = [];

    if (friendIds.length > 0) {
      // Get friends' privacy settings to determine which diary types are visible
      const friendProfiles = await prisma.traineeProfile.findMany({
        where: { userId: { in: friendIds } },
        select: {
          userId: true,
          privacyTrendWeight: true,
          privacyTrendMeasurements: true,
          privacyTrendNutrition: true,
          privacyTrendWater: true,
          privacyTrendMood: true,
          privacyTrendSleep: true,
          privacyTrendActivity: true,
          privacyTrendSteps: true,
          privacyProgressPhotos: true,
        },
      });

      // Build set of diary types that at least one friend has made visible
      const visibleTypes = new Set<DiaryEntryType>();
      for (const profile of friendProfiles) {
        for (const [diaryType, privacyField] of Object.entries(DIARY_TYPE_PRIVACY_FIELD)) {
          const value = profile[privacyField as keyof typeof profile] as Visibility;
          if (FRIEND_VISIBLE_LEVELS.includes(value)) {
            visibleTypes.add(diaryType as DiaryEntryType);
          }
        }
      }
      allowedDiaryTypes = Array.from(visibleTypes);
    }

    const diaryEntries = await postRepository.getFeedDiaryEntries(
      friendIds, userId, allowedDiaryTypes, diaryCursorDate, limit
    );

    // Merge posts and diary entries, sorted by createdAt desc
    const postItems = postsResult.items.map((p) => ({
      ...p,
      itemType: 'post' as const,
      sortDate: new Date(p.createdAt),
    }));

    const diaryItems = diaryEntries.map((d) => ({
      ...d,
      itemType: 'diary_entry' as const,
      sortDate: new Date(d.createdAt),
    }));

    const merged = [...postItems, ...diaryItems]
      .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
      .slice(0, limit);

    // Determine if there are more items
    const hasMorePosts = postsResult.nextCursor !== undefined;
    const hasMoreDiary = diaryEntries.length >= limit;
    const hasMore = hasMorePosts || hasMoreDiary;

    // Build composite cursor from the last item
    let nextCursor: string | undefined;
    if (hasMore && merged.length > 0) {
      const last = merged[merged.length - 1]!;
      const lastPostId = postsResult.nextCursor ?? postsResult.items[postsResult.items.length - 1]?.id ?? '';
      nextCursor = `${last.sortDate.toISOString()}|${last.itemType}|${lastPostId}`;
    }

    return {
      items: merged.map(({ sortDate: _sortDate, ...item }) => item),
      nextCursor,
    };
  },

  async getUserPosts(
    userId: string,
    viewerId: string,
    cursor?: string,
    limit = 20
  ) {
    // Determine allowed visibilities based on relationship
    let allowedVisibilities: Visibility[];

    if (userId === viewerId) {
      // Own posts — see everything
      allowedVisibilities = ['ONLY_ME', 'MY_PT', 'PT_AND_FRIENDS', 'EVERYONE'];
    } else {
      const areFriends = await friendshipRepository.areFriends(userId, viewerId);
      if (areFriends) {
        allowedVisibilities = ['PT_AND_FRIENDS', 'EVERYONE'];
      } else {
        allowedVisibilities = ['EVERYONE'];
      }
    }

    return postRepository.getUserPosts(userId, viewerId, allowedVisibilities, cursor, limit);
  },

  async likePost(userId: string, postId: string) {
    const post = await postRepository.findById(postId);
    if (!post) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      });
    }

    const alreadyLiked = await postRepository.hasLiked(postId, userId);
    if (alreadyLiked) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'You have already liked this post',
      });
    }

    await postRepository.likePost(postId, userId);

    // Notify post author (unless liking own post)
    if (post.userId !== userId) {
      const liker = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      sseManager.broadcastToUser(post.userId, 'message', {
        type: 'post_liked',
        postId,
        userName: liker?.name ?? 'Someone',
      });

      inAppNotificationService.notify({
        userId: post.userId,
        type: 'POST_LIKED',
        title: `${liker?.name ?? 'Someone'} liked your post`,
        link: '/dashboard/feed',
      }).catch(console.error);

      badgeService.checkAndAwardBadges(post.userId, 'LIKE_RECEIVED').catch(() => {});
    }

    return { success: true };
  },

  async unlikePost(userId: string, postId: string) {
    const post = await postRepository.findById(postId);
    if (!post) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      });
    }

    const hasLiked = await postRepository.hasLiked(postId, userId);
    if (!hasLiked) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'You have not liked this post',
      });
    }

    await postRepository.unlikePost(postId, userId);

    return { success: true };
  },

  async likeDiaryEntry(userId: string, diaryEntryId: string) {
    const diaryEntry = await prisma.diaryEntry.findUnique({
      where: { id: diaryEntryId },
      select: { userId: true },
    });

    if (!diaryEntry) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Diary entry not found',
      });
    }

    const alreadyLiked = await postRepository.hasDiaryEntryLiked(diaryEntryId, userId);
    if (alreadyLiked) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'You have already liked this diary entry',
      });
    }

    await postRepository.likeDiaryEntry(diaryEntryId, userId);

    // Notify diary entry owner (unless liking own entry)
    if (diaryEntry.userId !== userId) {
      const liker = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      sseManager.broadcastToUser(diaryEntry.userId, 'message', {
        type: 'diary_entry_liked',
        diaryEntryId,
        userName: liker?.name ?? 'Someone',
      });

      inAppNotificationService.notify({
        userId: diaryEntry.userId,
        type: 'DIARY_ENTRY_LIKED',
        title: `${liker?.name ?? 'Someone'} liked your diary entry`,
        link: '/dashboard/diary',
      }).catch(console.error);

      badgeService.checkAndAwardBadges(diaryEntry.userId, 'LIKE_RECEIVED').catch(() => {});
    }

    return { success: true };
  },

  async getNewFeedCount(userId: string) {
    // Get the user's last feed viewed timestamp
    const profile = await prisma.traineeProfile.findUnique({
      where: { userId },
      select: { lastFeedViewedAt: true },
    });

    const since = profile?.lastFeedViewedAt ?? new Date(0);

    const [friendIds, followingIds] = await Promise.all([
      getFriendIds(userId),
      getFollowingIds(userId),
    ]);

    // Count new posts since last view
    const newPostCount = await prisma.post.count({
      where: {
        createdAt: { gt: since },
        NOT: { userId }, // Don't count own posts
        OR: [
          {
            userId: { in: followingIds },
            visibility: 'EVERYONE',
          },
          {
            userId: { in: friendIds },
            visibility: { in: ['EVERYONE', 'PT_AND_FRIENDS'] },
          },
        ],
      },
    });

    // Count new diary entries from friends since last view
    let newDiaryCount = 0;
    if (friendIds.length > 0) {
      const friendProfiles = await prisma.traineeProfile.findMany({
        where: { userId: { in: friendIds } },
        select: {
          userId: true,
          privacyTrendWeight: true,
          privacyTrendMeasurements: true,
          privacyTrendNutrition: true,
          privacyTrendWater: true,
          privacyTrendMood: true,
          privacyTrendSleep: true,
          privacyTrendActivity: true,
          privacyTrendSteps: true,
          privacyProgressPhotos: true,
        },
      });

      const visibleTypes = new Set<string>();
      for (const fp of friendProfiles) {
        for (const [diaryType, privacyField] of Object.entries(DIARY_TYPE_PRIVACY_FIELD)) {
          const value = fp[privacyField as keyof typeof fp] as Visibility;
          if (FRIEND_VISIBLE_LEVELS.includes(value)) {
            visibleTypes.add(diaryType);
          }
        }
      }

      if (visibleTypes.size > 0) {
        newDiaryCount = await prisma.diaryEntry.count({
          where: {
            createdAt: { gt: since },
            userId: { in: friendIds },
            type: { in: Array.from(visibleTypes) as DiaryEntryType[] },
          },
        });
      }
    }

    return newPostCount + newDiaryCount;
  },

  async markFeedViewed(userId: string) {
    await prisma.traineeProfile.update({
      where: { userId },
      data: { lastFeedViewedAt: new Date() },
    });
    return { success: true };
  },

  async getPostLikers(postId: string) {
    const likers = await postRepository.getPostLikers(postId);
    return likers.map((l) => ({ id: l.user.id, name: l.user.name }));
  },

  async getDiaryEntryLikers(diaryEntryId: string) {
    const likers = await postRepository.getDiaryEntryLikers(diaryEntryId);
    return likers.map((l) => ({ id: l.user.id, name: l.user.name }));
  },

  async unlikeDiaryEntry(userId: string, diaryEntryId: string) {
    const diaryEntry = await prisma.diaryEntry.findUnique({
      where: { id: diaryEntryId },
      select: { id: true },
    });

    if (!diaryEntry) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Diary entry not found',
      });
    }

    const hasLiked = await postRepository.hasDiaryEntryLiked(diaryEntryId, userId);
    if (!hasLiked) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'You have not liked this diary entry',
      });
    }

    await postRepository.unlikeDiaryEntry(diaryEntryId, userId);

    return { success: true };
  },
};
