import { env } from '../config/env';

const DAILY_API_BASE = 'https://api.daily.co/v1';

interface DailyRoom {
  id: string;
  name: string;
  url: string;
  created_at: string;
  config: Record<string, unknown>;
}

/** Config/billing errors that should not be shown to end users */
const isConfigError = (status: number, body: string): boolean => {
  const lowerBody = body.toLowerCase();
  return (
    status === 401 ||
    status === 403 ||
    (status === 402 || lowerBody.includes('payment') || lowerBody.includes('billing')) ||
    lowerBody.includes('api key') ||
    lowerBody.includes('not configured') ||
    lowerBody.includes('unauthorized')
  );
};

export class DailyConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DailyConfigError';
  }
}

export class DailyRoomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DailyRoomError';
  }
}

const dailyFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  if (!env.DAILY_API_KEY) {
    throw new DailyConfigError('DAILY_API_KEY is not configured');
  }

  return fetch(`${DAILY_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.DAILY_API_KEY}`,
      ...options.headers,
    },
  });
};

export const dailyService = {
  /**
   * Create a video call room for a booking.
   * Room auto-expires 24 hours after the session end time.
   * Throws DailyConfigError for billing/auth issues, DailyRoomError for other failures.
   */
  createRoom: async (bookingId: string, sessionEndTime: Date): Promise<{ url: string; name: string }> => {
    const roomName = `fitnassist-${bookingId}`;
    const expiryTime = Math.floor(sessionEndTime.getTime() / 1000) + 24 * 60 * 60;

    const res = await dailyFetch('/rooms', {
      method: 'POST',
      body: JSON.stringify({
        name: roomName,
        properties: {
          exp: expiryTime,
          enable_chat: true,
          enable_screenshare: false,
          max_participants: 2,
          enable_knocking: true,
        },
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('[Daily] Failed to create room:', res.status, errorBody);

      if (isConfigError(res.status, errorBody)) {
        throw new DailyConfigError(`Video call service configuration error: ${res.status}`);
      }
      throw new DailyRoomError(`Failed to create video call room: ${res.status}`);
    }

    const room = (await res.json()) as DailyRoom;
    return { url: room.url, name: room.name };
  },

  /**
   * Delete a video call room when a booking is cancelled.
   */
  deleteRoom: async (roomName: string): Promise<void> => {
    const res = await dailyFetch(`/rooms/${roomName}`, {
      method: 'DELETE',
    });

    if (!res.ok && res.status !== 404) {
      const error = await res.text();
      console.error('[Daily] Failed to delete room:', error);
    }
  },
};
