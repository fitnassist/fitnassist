import webpush from 'web-push';
import { env } from '../config/env';
import { pushSubscriptionRepository } from '../repositories/push-subscription.repository';
import { userRepository } from '../repositories/user.repository';
import type { NotificationType } from '@fitnassist/database';

// Configure VAPID keys if available
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
}

interface PushPayload {
  title: string;
  body?: string;
  link?: string;
  type: string;
}

const shouldSendPush = (
  prefs: Record<string, boolean>,
  type: NotificationType
): boolean => {
  switch (type) {
    case 'CONNECTION_REQUEST':
    case 'CONNECTION_ACCEPTED':
    case 'CONNECTION_DECLINED':
    case 'CLIENT_DISCONNECTED':
      return prefs.pushNotifyConnectionRequests ?? true;
    case 'NEW_MESSAGE':
      return prefs.pushNotifyMessages ?? true;
    case 'BOOKING_CREATED':
    case 'BOOKING_CANCELLED':
    case 'BOOKING_COMPLETED':
      return prefs.pushNotifyBookings ?? true;
    case 'BOOKING_REMINDER':
      return prefs.pushNotifyBookingReminders ?? true;
    case 'PLAN_ASSIGNED':
    case 'PLAN_UNASSIGNED':
      return prefs.pushNotifyPlanAssignments ?? true;
    case 'ONBOARDING_SUBMITTED':
    case 'ONBOARDING_REVIEWED':
      return prefs.pushNotifyOnboarding ?? true;
    case 'DIARY_ENTRY':
    case 'DIARY_COMMENT':
      return prefs.pushNotifyDiary ?? true;
    case 'GOAL_CREATED':
    case 'GOAL_COMPLETED':
      return prefs.pushNotifyGoals ?? true;
    case 'TRIAL_EXPIRING':
    case 'PAYMENT_FAILED':
      return true; // Always push system notifications
    default:
      return true;
  }
};

export const webPushService = {
  isConfigured: () => {
    return !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT);
  },

  getVapidPublicKey: () => {
    return env.VAPID_PUBLIC_KEY ?? null;
  },

  async sendPushNotification(
    userId: string,
    type: NotificationType,
    payload: PushPayload
  ) {
    if (!webPushService.isConfigured()) return;

    // Check user preferences
    const prefs = await userRepository.getNotificationPreferences(userId);
    if (!prefs || !shouldSendPush(prefs as unknown as Record<string, boolean>, type)) {
      return;
    }

    const subscriptions = await pushSubscriptionRepository.findByUserId(userId);
    if (subscriptions.length === 0) return;

    const payloadStr = JSON.stringify(payload);

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payloadStr
          );
        } catch (error: unknown) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          // 410 Gone or 404 — subscription expired, clean up
          if (statusCode === 410 || statusCode === 404) {
            await pushSubscriptionRepository.deleteByEndpoint(sub.endpoint);
          }
          throw error;
        }
      })
    );

    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      console.warn(`[WebPush] ${failed}/${subscriptions.length} notifications failed for user ${userId}`);
    }
  },
};
