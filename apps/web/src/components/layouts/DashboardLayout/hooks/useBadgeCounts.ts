import { trpc } from '@/lib/trpc';
import { BADGE_POLL_INTERVAL } from '../DashboardLayout.constants';
import type { BadgeCounts } from '../DashboardLayout.types';

export const useBadgeCounts = (isAuthenticated: boolean, isTrainer: boolean, sseConnected: boolean): BadgeCounts => {
  // Fetch unread message count — SSE invalidates this cache, so no polling needed when connected
  const { data: unreadMessages } = trpc.message.getUnreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: sseConnected ? false : BADGE_POLL_INTERVAL,
  });

  // Fetch pending request count for trainers
  const { data: pendingRequests } = trpc.contact.getPendingCount.useQuery(undefined, {
    enabled: isTrainer && isAuthenticated,
    refetchInterval: sseConnected ? false : BADGE_POLL_INTERVAL,
  });

  // Fetch pending onboarding review count for trainers
  // Always poll — SSE doesn't emit onboarding events
  const { data: pendingOnboarding } = trpc.onboarding.pendingReviewCount.useQuery(undefined, {
    enabled: isTrainer && isAuthenticated,
    refetchInterval: BADGE_POLL_INTERVAL,
  });

  // Fetch pending friend request count for trainees
  const { data: pendingFriendRequests } = trpc.friendship.getPendingCount.useQuery(undefined, {
    enabled: !isTrainer && isAuthenticated,
    refetchInterval: sseConnected ? false : BADGE_POLL_INTERVAL,
  });

  // Fetch new feed item count for trainees
  const { data: newFeedCount } = trpc.post.getNewFeedCount.useQuery(undefined, {
    enabled: !isTrainer && isAuthenticated,
    refetchInterval: sseConnected ? false : BADGE_POLL_INTERVAL,
  });

  // Fetch pending booking count (bookings awaiting current user's confirmation)
  const { data: pendingBookingCount } = trpc.booking.getPendingCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: sseConnected ? false : BADGE_POLL_INTERVAL,
  });

  return {
    messages: unreadMessages?.count ?? 0,
    requests: pendingRequests?.count ?? 0,
    onboarding: pendingOnboarding ?? 0,
    friendRequests: pendingFriendRequests ?? 0,
    newFeed: newFeedCount ?? 0,
    pendingBookings: pendingBookingCount?.count ?? 0,
  };
};
