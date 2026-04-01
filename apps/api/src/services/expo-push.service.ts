import { expoPushTokenRepository } from '../repositories/expo-push-token.repository';
import { userRepository } from '../repositories/user.repository';
import type { NotificationType } from '@fitnassist/database';

interface ExpoPushPayload {
  title: string;
  body?: string;
  link?: string;
  type: string;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  sound: 'default';
  priority: 'high';
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  details?: { error?: string };
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

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
      return true;
    default:
      return true;
  }
};

export const expoPushService = {
  async sendPushNotification(
    userId: string,
    type: NotificationType,
    payload: ExpoPushPayload
  ) {
    const prefs = await userRepository.getNotificationPreferences(userId);
    if (!prefs || !shouldSendPush(prefs as unknown as Record<string, boolean>, type)) {
      return;
    }

    const tokens = await expoPushTokenRepository.findByUserId(userId);
    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = tokens.map((t) => ({
      to: t.token,
      title: payload.title,
      body: payload.body,
      data: { link: payload.link, type: payload.type },
      sound: 'default' as const,
      priority: 'high' as const,
    }));

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        console.warn(`[ExpoPush] API returned ${response.status} for user ${userId}`);
        return;
      }

      const result = await response.json() as { data: ExpoPushTicket[] };

      // Clean up invalid tokens (DeviceNotRegistered)
      result.data.forEach((ticket, index) => {
        if (
          ticket.status === 'error' &&
          ticket.details?.error === 'DeviceNotRegistered'
        ) {
          const tokenRecord = tokens[index];
          if (tokenRecord) {
            expoPushTokenRepository.deleteByToken(tokenRecord.token).catch(() => {});
          }
        }
      });
    } catch (error) {
      console.warn(`[ExpoPush] Failed to send notification for user ${userId}`, error);
    }
  },
};
