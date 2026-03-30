import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { RNEventSource } from 'rn-eventsource-reborn';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { getCookie } from '@better-auth/expo/client';
import { trpc } from '@/lib/trpc';

const apiUrl = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3001';
const SSE_URL = `${apiUrl}/api/sse/messages`;
const BASE_DELAY = 1000;
const MAX_RETRIES = 5;

const getAuthCookie = (): string | null => {
  const raw = SecureStore.getItem('fitnassist_cookie');
  if (!raw) return null;
  return getCookie(raw) || null;
};

export const useSse = () => {
  const [connected, setConnected] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const esRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const utils = trpc.useUtils();

  const handleEvent = useCallback((data: { type: string; connectionId?: string }) => {
    switch (data.type) {
      case 'new_message':
        if (data.connectionId) {
          utils.message.getThread.invalidate({ connectionId: data.connectionId });
        }
        utils.message.getConnections.invalidate();
        utils.message.getUnreadCount.invalidate();
        break;

      case 'messages_read':
        if (data.connectionId) {
          utils.message.getThread.invalidate({ connectionId: data.connectionId });
        }
        utils.message.getConnections.invalidate();
        break;

      case 'new_request':
      case 'connection_accepted':
      case 'connection_declined':
        utils.contact.getMyRequests.invalidate();
        utils.contact.getStats.invalidate();
        utils.message.getConnections.invalidate();
        break;

      case 'notification':
        utils.notification.getUnreadCount.invalidate();
        break;

      case 'booking_created':
      case 'booking_confirmed':
      case 'booking_cancelled':
      case 'booking_rescheduled':
      case 'booking_completed':
        utils.booking.upcoming.invalidate();
        break;

      case 'diary_entry':
      case 'diary_comment':
        utils.diary.getRecentClientActivity.invalidate();
        break;

      case 'goal_completed':
        utils.goal.getRecentClientGoalUpdates.invalidate();
        break;

      default:
        break;
    }
  }, [utils]);

  const connect = useCallback(() => {
    const cookie = getAuthCookie();
    if (!cookie) return;

    const es = new RNEventSource(SSE_URL, {
      headers: { Cookie: cookie },
    });

    es.addEventListener('connected', () => {
      setConnected(true);
      retryCountRef.current = 0;
    });

    es.addEventListener('message', (event: { data?: string }) => {
      if (!event.data) return;
      try {
        const data = JSON.parse(event.data);
        handleEvent(data);
      } catch {
        // ignore parse errors
      }
    });

    es.addEventListener('error', () => {
      setConnected(false);
      es.close();
      esRef.current = null;

      if (retryCountRef.current < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retryCountRef.current);
        retryCountRef.current += 1;
        retryTimerRef.current = setTimeout(connect, delay);
      }
    });

    esRef.current = es;
  }, [handleEvent]);

  const disconnect = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setConnected(false);
  }, []);

  useEffect(() => {
    connect();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (!esRef.current) {
          retryCountRef.current = 0;
          connect();
        }
      } else if (state === 'background') {
        disconnect();
      }
    });

    return () => {
      disconnect();
      subscription.remove();
    };
  }, [connect, disconnect]);

  return { sseConnected: connected };
};
