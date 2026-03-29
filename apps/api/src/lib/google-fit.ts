import { env } from '../config/env';

const GOOGLE_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FITNESS_API_BASE = 'https://www.googleapis.com/fitness/v1/users/me';

class GoogleFitApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'GoogleFitApiError';
    this.status = status;
  }
}

const fitnessFetch = async <T>(path: string, accessToken: string, options: { method?: string; body?: unknown } = {}): Promise<T> => {
  const { method = 'GET', body } = options;
  const response = await fetch(`${FITNESS_API_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new GoogleFitApiError(`Google Fit API error: ${response.status} ${text}`, response.status);
  }

  return response.json() as Promise<T>;
};

export interface GoogleFitDataPoint {
  startTimeNanos: string;
  endTimeNanos: string;
  value: Array<{ intVal?: number; fpVal?: number; mapVal?: Array<{ key: string; value: { intVal?: number; fpVal?: number } }> }>;
}

export interface GoogleFitDataset {
  point: GoogleFitDataPoint[];
}

export interface GoogleFitSession {
  id: string;
  name: string;
  startTimeMillis: string;
  endTimeMillis: string;
  activityType: number;
}

// Google Fit activity type → our type
const GFIT_ACTIVITY_MAP: Record<number, string> = {
  8: 'RUN',   // Running
  7: 'WALK',  // Walking
  1: 'CYCLE', // Biking
  82: 'SWIM', // Swimming
  35: 'HIKE', // Hiking
};

export const googleFitClient = {
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_FIT_CLIENT_ID!,
      redirect_uri: `${env.BETTER_AUTH_URL}/api/integrations/google-fit/callback`,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.body.read',
        'https://www.googleapis.com/auth/fitness.sleep.read',
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });
    return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
  },

  async exchangeToken(code: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_FIT_CLIENT_ID!,
        client_secret: env.GOOGLE_FIT_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${env.BETTER_AUTH_URL}/api/integrations/google-fit/callback`,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new GoogleFitApiError(`Token exchange failed: ${response.status} ${text}`, response.status);
    }

    return response.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>;
  },

  async refreshToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_FIT_CLIENT_ID!,
        client_secret: env.GOOGLE_FIT_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new GoogleFitApiError(`Token refresh failed: ${response.status} ${text}`, response.status);
    }

    return response.json() as Promise<{ access_token: string; expires_in: number }>;
  },

  async getDataset(accessToken: string, dataSourceId: string, startTimeNanos: string, endTimeNanos: string): Promise<GoogleFitDataset> {
    return fitnessFetch<GoogleFitDataset>(
      `/dataSources/${encodeURIComponent(dataSourceId)}/datasets/${startTimeNanos}-${endTimeNanos}`,
      accessToken
    );
  },

  async aggregateData(
    accessToken: string,
    dataTypeName: string,
    startTimeMillis: number,
    endTimeMillis: number
  ): Promise<{ bucket: Array<{ startTimeMillis: string; endTimeMillis: string; dataset: Array<{ point: GoogleFitDataPoint[] }> }> }> {
    return fitnessFetch(
      '/dataset:aggregate',
      accessToken,
      {
        method: 'POST',
        body: {
          aggregateBy: [{ dataTypeName }],
          bucketByTime: { durationMillis: 86400000 }, // 1 day
          startTimeMillis,
          endTimeMillis,
        },
      }
    );
  },

  async getSessions(accessToken: string, startTimeMillis: number, endTimeMillis: number): Promise<{ session: GoogleFitSession[] }> {
    const params = new URLSearchParams({
      startTime: new Date(startTimeMillis).toISOString(),
      endTime: new Date(endTimeMillis).toISOString(),
    });
    return fitnessFetch<{ session: GoogleFitSession[] }>(`/sessions?${params}`, accessToken);
  },

  mapActivityType(googleType: number): string {
    return GFIT_ACTIVITY_MAP[googleType] ?? 'OTHER';
  },
};
