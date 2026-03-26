import { TRPCError } from '@trpc/server';
import type { Visibility } from '@fitnassist/database';
import { postRepository } from '../repositories/post.repository';
import { friendshipRepository } from '../repositories/friendship.repository';
import { inAppNotificationService } from './in-app-notification.service';
import { sseManager } from '../lib/sse';
import { prisma } from '../lib/prisma';

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

    return postRepository.getFeed(userId, friendIds, followingIds, cursor, limit);
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
    }

    return { success: true };
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
