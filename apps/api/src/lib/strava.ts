import { env } from '../config/env';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const STRAVA_AUTH_BASE = 'https://www.strava.com/oauth';

interface StravaRequestOptions {
  method?: string;
  accessToken?: string;
  body?: Record<string, unknown>;
  params?: Record<string, string>;
}

class StravaApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'StravaApiError';
    this.status = status;
  }
}

const stravaFetch = async <T>(path: string, options: StravaRequestOptions = {}): Promise<T> => {
  const { method = 'GET', accessToken, body, params } = options;
  const url = new URL(`${STRAVA_API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  if (body) headers['Content-Type'] = 'application/json';

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new StravaApiError(
      `Strava API error: ${response.status} ${text}`,
      response.status
    );
  }

  return response.json() as Promise<T>;
};

export interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
  };
}

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  elapsed_time: number;
  moving_time: number;
  distance: number; // meters
  total_elevation_gain: number; // meters
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
  map?: {
    summary_polyline?: string;
    polyline?: string;
  };
  start_latlng?: [number, number];
  end_latlng?: [number, number];
}

export interface StravaWebhookEvent {
  object_type: 'activity' | 'athlete';
  object_id: number;
  aspect_type: 'create' | 'update' | 'delete';
  owner_id: number;
  subscription_id: number;
  event_time: number;
  updates?: Record<string, unknown>;
}

export const stravaClient = {
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: env.STRAVA_CLIENT_ID!,
      response_type: 'code',
      redirect_uri: `${env.BETTER_AUTH_URL}/api/integrations/strava/callback`,
      scope: 'read,activity:read_all',
      state,
    });
    return `${STRAVA_AUTH_BASE}/authorize?${params.toString()}`;
  },

  async exchangeToken(code: string): Promise<StravaTokenResponse> {
    const response = await fetch(`${STRAVA_AUTH_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.STRAVA_CLIENT_ID,
        client_secret: env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new StravaApiError(`Token exchange failed: ${response.status} ${text}`, response.status);
    }

    return response.json() as Promise<StravaTokenResponse>;
  },

  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_at: number }> {
    const response = await fetch(`${STRAVA_AUTH_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.STRAVA_CLIENT_ID,
        client_secret: env.STRAVA_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new StravaApiError(`Token refresh failed: ${response.status} ${text}`, response.status);
    }

    return response.json() as Promise<{ access_token: string; refresh_token: string; expires_at: number }>;
  },

  async getActivity(accessToken: string, activityId: number): Promise<StravaActivity> {
    return stravaFetch<StravaActivity>(`/activities/${activityId}`, { accessToken });
  },

  async getActivities(
    accessToken: string,
    options: { after?: number; before?: number; page?: number; perPage?: number } = {}
  ): Promise<StravaActivity[]> {
    const params: Record<string, string> = {};
    if (options.after) params.after = String(options.after);
    if (options.before) params.before = String(options.before);
    if (options.page) params.page = String(options.page);
    params.per_page = String(options.perPage ?? 50);

    return stravaFetch<StravaActivity[]>('/athlete/activities', { accessToken, params });
  },

  async deauthorize(accessToken: string): Promise<void> {
    await fetch(`${STRAVA_AUTH_BASE}/deauthorize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `access_token=${accessToken}`,
    });
  },
};
