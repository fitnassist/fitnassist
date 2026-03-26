import { TRPCError } from '@trpc/server';
import { friendshipRepository } from '../repositories/friendship.repository';
import { traineeRepository } from '../repositories/trainee.repository';
import { inAppNotificationService } from './in-app-notification.service';
import { sseManager } from '../lib/sse';
import { prisma } from '../lib/prisma';

export const friendshipService = {
  async sendRequest(requesterId: string, addresseeId: string) {
    // Can't send to self
    if (requesterId === addresseeId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'You cannot send a friend request to yourself',
      });
    }

    // Requester must have a trainee profile with a handle
    const requesterProfile = await traineeRepository.findByUserId(requesterId);
    if (!requesterProfile?.handle) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'You need to set up your profile and handle before sending friend requests',
      });
    }

    // Check if either user has blocked the other
    const blocked = await friendshipRepository.isBlocked(requesterId, addresseeId);
    if (blocked) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Unable to send friend request',
      });
    }

    // Check for existing friendship
    const existing = await friendshipRepository.findExisting(requesterId, addresseeId);
    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You are already friends with this user',
        });
      }

      if (existing.status === 'PENDING') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A friend request is already pending',
        });
      }

      // DECLINED - allow re-request by updating status back to PENDING
      if (existing.status === 'DECLINED') {
        const updated = await friendshipRepository.updateStatus(existing.id, 'PENDING');

        // Get requester name for notification
        const requester = await prisma.user.findUnique({
          where: { id: requesterId },
          select: { name: true },
        });

        // SSE notification
        sseManager.broadcastToUser(addresseeId, 'message', {
          type: 'friend_request',
          friendshipId: existing.id,
          senderName: requester?.name ?? 'Someone',
        });

        // In-app notification
        inAppNotificationService.notify({
          userId: addresseeId,
          type: 'FRIEND_REQUEST',
          title: `${requester?.name ?? 'Someone'} sent you a friend request`,
          link: '/dashboard/friends',
        }).catch(console.error);

        return updated;
      }
    }

    // Create new friendship request
    const friendship = await friendshipRepository.createRequest(requesterId, addresseeId);

    // Get requester name for notification
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { name: true },
    });

    // SSE notification
    sseManager.broadcastToUser(addresseeId, 'message', {
      type: 'friend_request',
      friendshipId: friendship.id,
      senderName: requester?.name ?? 'Someone',
    });

    // In-app notification
    inAppNotificationService.notify({
      userId: addresseeId,
      type: 'FRIEND_REQUEST',
      title: `${requester?.name ?? 'Someone'} sent you a friend request`,
      link: '/dashboard/friends',
    }).catch(console.error);

    return friendship;
  },

  async acceptRequest(userId: string, requestId: string) {
    const friendship = await friendshipRepository.findById(requestId);
    if (!friendship) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Friend request not found',
      });
    }

    if (friendship.addresseeId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to accept this request',
      });
    }

    if (friendship.status !== 'PENDING') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This request is no longer pending',
      });
    }

    const updated = await friendshipRepository.updateStatus(requestId, 'ACCEPTED');

    // Get addressee name for notification
    const addressee = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // SSE notification to requester
    sseManager.broadcastToUser(friendship.requesterId, 'message', {
      type: 'friend_accepted',
      friendshipId: requestId,
      userName: addressee?.name ?? 'Someone',
    });

    // In-app notification
    inAppNotificationService.notify({
      userId: friendship.requesterId,
      type: 'FRIEND_ACCEPTED',
      title: `${addressee?.name ?? 'Someone'} accepted your friend request`,
      link: '/dashboard/friends',
    }).catch(console.error);

    return updated;
  },

  async declineRequest(userId: string, requestId: string) {
    const friendship = await friendshipRepository.findById(requestId);
    if (!friendship) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Friend request not found',
      });
    }

    if (friendship.addresseeId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to decline this request',
      });
    }

    if (friendship.status !== 'PENDING') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This request is no longer pending',
      });
    }

    return friendshipRepository.updateStatus(requestId, 'DECLINED');
  },

  async removeFriend(userId: string, friendshipId: string) {
    const friendship = await friendshipRepository.findById(friendshipId);
    if (!friendship) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Friendship not found',
      });
    }

    if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to remove this friendship',
      });
    }

    if (friendship.status !== 'ACCEPTED') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This friendship is not active',
      });
    }

    return friendshipRepository.delete(friendshipId);
  },

  async blockUser(userId: string, targetId: string) {
    const existing = await friendshipRepository.findExisting(userId, targetId);

    if (existing) {
      return friendshipRepository.updateStatus(existing.id, 'BLOCKED');
    }

    // Create a new BLOCKED friendship record
    return prisma.friendship.create({
      data: {
        requesterId: userId,
        addresseeId: targetId,
        status: 'BLOCKED',
      },
    });
  },

  async unblockUser(userId: string, targetId: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        requesterId: userId,
        addresseeId: targetId,
        status: 'BLOCKED',
      },
    });

    if (!friendship) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Block record not found',
      });
    }

    return friendshipRepository.delete(friendship.id);
  },

  async getFriends(userId: string, cursor?: string, limit?: number) {
    return friendshipRepository.findFriends(userId, cursor, limit);
  },

  async getPendingCount(userId: string) {
    return friendshipRepository.getPendingCount(userId);
  },

  async getPendingRequests(userId: string, cursor?: string, limit?: number) {
    return friendshipRepository.findPendingRequests(userId, cursor, limit);
  },

  async getSentRequests(userId: string, cursor?: string, limit?: number) {
    return friendshipRepository.findSentRequests(userId, cursor, limit);
  },

  async areFriends(userIdA: string, userIdB: string) {
    return friendshipRepository.areFriends(userIdA, userIdB);
  },

  async getBlockedUsers(userId: string) {
    const friendships = await prisma.friendship.findMany({
      where: {
        requesterId: userId,
        status: 'BLOCKED',
      },
      include: {
        addressee: {
          select: {
            id: true,
            name: true,
            image: true,
            traineeProfile: {
              select: {
                avatarUrl: true,
                handle: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return friendships;
  },

  async getFriendshipStatus(userId: string, targetId: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: targetId },
          { requesterId: targetId, addresseeId: userId },
        ],
      },
    });

    if (!friendship) {
      return null;
    }

    return {
      id: friendship.id,
      status: friendship.status,
      isRequester: friendship.requesterId === userId,
    };
  },
};
