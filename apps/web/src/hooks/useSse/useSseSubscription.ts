import { useEffect, useRef, useState, useCallback } from 'react';
import type { SseEvent } from '@fitnassist/types';

const SSE_URL = '/api/sse/messages';
const MAX_RETRIES = 5;
const BASE_DELAY = 1000;

export interface UseSseSubscriptionReturn {
  isConnected: boolean;
  lastEvent: SseEvent | null;
}

export const useSseSubscription = (): UseSseSubscriptionReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SseEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(SSE_URL, { withCredentials: true });
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('connected', () => {
      setIsConnected(true);
      retriesRef.current = 0;
    });

    eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as SseEvent;
        setLastEvent(data);
      } catch {
        console.error('[SSE] Failed to parse event');
      }
    });

    eventSource.addEventListener('heartbeat', () => {
      // Connection alive
    });

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      eventSourceRef.current = null;

      if (retriesRef.current < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retriesRef.current);
        retriesRef.current += 1;
        retryTimeoutRef.current = setTimeout(connect, delay);
      }
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [connect]);

  return { isConnected, lastEvent };
};
