import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import type { SseEvent } from '@fitnassist/types';

export const useSseEvents = (lastEvent: SseEvent | null) => {
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!lastEvent) return;

    switch (lastEvent.type) {
      // --- Message events ---
      case 'new_message': {
        const { connectionId, message } = lastEvent;

        utils.message.getThread.setData(
          { connectionId },
          (old) => {
            if (!old) return old;
            if (old.some((m) => m.id === message.id)) return old;
            return [...old, message];
          }
        );

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

      // --- Goal events ---
      case 'goal_completed': {
        utils.goal.list.invalidate();
        utils.goal.getRecentClientGoalUpdates.invalidate();
        break;
      }

      // --- Booking events ---
      case 'booking_created':
      case 'booking_cancelled': {
        utils.booking.upcoming.invalidate();
        utils.booking.listByDateRange.invalidate();
        utils.booking.listByClientRoster.invalidate();
        utils.availability.getSlots.invalidate();
        utils.trainer.getDashboardStats.invalidate();
        utils.analytics.bookingAnalytics.invalidate();
        break;
      }

      // --- Notification events ---
      case 'notification': {
        utils.notification.getUnreadCount.invalidate();
        utils.notification.list.invalidate();
        break;
      }
    }
  }, [lastEvent, utils]);
};
