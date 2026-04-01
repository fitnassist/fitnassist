import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from '@/lib/toast';
import type { SseEvent } from '@fitnassist/types';

export const useSseEvents = (lastEvent: SseEvent | null) => {
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!lastEvent) return;

    switch (lastEvent.type) {
      // --- Message events ---
      case 'new_message': {
        const { connectionId, message } = lastEvent;

        utils.message.getThread.setData({ connectionId }, (old) => {
          if (!old) return old;
          if (old.some((m) => m.id === message.id)) return old;
          return [...old, message];
        });

        utils.message.getConnections.invalidate();
        utils.message.getUnreadCount.invalidate();
        break;
      }

      case 'messages_read': {
        const { connectionId } = lastEvent;
        utils.message.getThread.invalidate({ connectionId });
        utils.message.getConnections.invalidate();
        utils.message.getUnreadCount.invalidate();
        break;
      }

      // --- Contact request events ---
      case 'new_request': {
        utils.contact.getPendingCount.invalidate();
        utils.contact.getMyRequests.invalidate();
        break;
      }

      case 'connection_accepted': {
        utils.contact.getSentRequests.invalidate();
        utils.contact.checkPendingRequest.invalidate();
        utils.message.getConnections.invalidate();
        break;
      }

      case 'connection_declined': {
        utils.contact.getSentRequests.invalidate();
        utils.contact.checkPendingRequest.invalidate();
        break;
      }

      // --- Diary events ---
      case 'diary_entry': {
        utils.diary.getEntries.invalidate();
        utils.diary.getRange.invalidate();
        utils.diary.getRecentClientActivity.invalidate();
        break;
      }

      case 'diary_comment': {
        utils.diary.getEntries.invalidate();
        utils.diary.getRange.invalidate();
        utils.diary.getComments.invalidate();
        break;
      }

      // --- Personal best events ---
      case 'personal_best': {
        utils.diary.getPersonalBests.invalidate();
        break;
      }

      // --- Goal events ---
      case 'goal_completed': {
        utils.goal.list.invalidate();
        utils.goal.getRecentClientGoalUpdates.invalidate();
        break;
      }

      // --- Booking events ---
      case 'booking_created':
      case 'booking_cancelled':
      case 'booking_pending':
      case 'booking_confirmed':
      case 'booking_declined':
      case 'booking_rescheduled':
      case 'booking_hold_expired':
      case 'booking_suggestion': {
        utils.booking.upcoming.invalidate();
        utils.booking.listByDateRange.invalidate();
        utils.booking.listByClientRoster.invalidate();
        utils.booking.get.invalidate();
        utils.booking.getSuggestions.invalidate();
        utils.booking.getPendingCount.invalidate();
        utils.availability.getSlots.invalidate();
        utils.trainer.getDashboardStats.invalidate();
        utils.analytics.bookingAnalytics.invalidate();
        break;
      }

      // --- Notification events ---
      case 'notification': {
        utils.notification.getUnreadCount.invalidate();
        utils.notification.list.invalidate();
        const { notification } = lastEvent;

        // Invalidate order queries when order-related notifications arrive
        if (
          [
            'NEW_ORDER',
            'ORDER_CONFIRMED',
            'ORDER_SHIPPED',
            'ORDER_DELIVERED',
            'ORDER_REFUNDED',
          ].includes(notification.type)
        ) {
          utils.order.myOrders.invalidate();
          utils.order.trainerOrders.invalidate();
        }

        toast.info(notification.body || notification.title);
        break;
      }

      // --- Social events ---
      case 'friend_request': {
        utils.friendship.getPendingRequests.invalidate();
        utils.friendship.getPendingCount.invalidate();
        utils.friendship.getStatus.invalidate();
        break;
      }

      case 'friend_accepted': {
        utils.friendship.getFriends.invalidate();
        utils.friendship.getSentRequests.invalidate();
        utils.friendship.getStatus.invalidate();
        break;
      }

      case 'new_follower': {
        utils.follow.getFollowCounts.invalidate();
        utils.follow.getFollowers.invalidate();
        break;
      }

      // --- Post events ---
      case 'new_post': {
        utils.post.getFeed.invalidate();
        utils.post.getNewFeedCount.invalidate();
        break;
      }

      case 'post_liked': {
        utils.post.getFeed.invalidate();
        utils.post.getUserPosts.invalidate();
        break;
      }

      case 'diary_entry_liked': {
        utils.diary.getEntries.invalidate();
        break;
      }

      // --- Badge events ---
      case 'badge_earned': {
        utils.badge.getUserBadges.invalidate();
        utils.badge.getShowcaseBadges.invalidate();
        utils.badge.getMyShowcaseBadgeIds.invalidate();
        break;
      }
    }
  }, [lastEvent, utils]);
};
