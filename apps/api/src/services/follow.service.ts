import { TRPCError } from '@trpc/server';
import { followRepository } from '../repositories/follow.repository';
import { trainerRepository } from '../repositories/trainer.repository';
import { inAppNotificationService } from './in-app-notification.service';
import { sseManager } from '../lib/sse';
import { prisma } from '../lib/prisma';

export const followService = {
  async followUser(followerId: string, followingId: string) {
    // Can't follow yourself
    if (followerId === followingId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'You cannot follow yourself',
      });
    }

    // Target must be a trainer
    const trainerProfile = await trainerRepository.findByUserId(followingId);
    if (!trainerProfile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User is not a trainer',
      });
    }

    // Can't already follow
    const alreadyFollowing = await followRepository.isFollowing(followerId, followingId);
    if (alreadyFollowing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'You are already following this user',
      });
    }

    const follow = await followRepository.create(followerId, followingId);

    // Get follower name for notification
    const follower = await prisma.user.findUnique({
      where: { id: followerId },
      select: { name: true },
    });

    // Send SSE event to the trainer
    sseManager.broadcastToUser(followingId, 'new_follower', {
      type: 'new_follower',
      followerId,
      followerName: follower?.name ?? 'Someone',
    });

    // In-app notification (fire and forget)
    inAppNotificationService.notify({
      userId: followingId,
      type: 'NEW_FOLLOWER',
      title: `${follower?.name ?? 'Someone'} started following you`,
      body: undefined,
      link: `/dashboard/followers`,
    }).catch(console.error);

    return follow;
  },

  async unfollowUser(followerId: string, followingId: string) {
    return followRepository.delete(followerId, followingId);
  },

  async getFollowers(userId: string, cursor?: string, limit?: number) {
    return followRepository.findFollowers(userId, cursor, limit);
  },

  async getFollowing(userId: string, cursor?: string, limit?: number) {
    return followRepository.findFollowing(userId, cursor, limit);
  },

  async isFollowing(followerId: string, followingId: string) {
    return followRepository.isFollowing(followerId, followingId);
  },

  async getFollowCounts(userId: string) {
    const [followers, following] = await Promise.all([
      followRepository.getFollowerCount(userId),
      followRepository.getFollowingCount(userId),
    ]);

    return { followers, following };
  },
};
