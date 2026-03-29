import { env } from '../config/env';

const FITBIT_AUTH_BASE = 'https://www.fitbit.com/oauth2/authorize';
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';
const FITBIT_API_BASE = 'https://api.fitbit.com';

class FitbitApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'FitbitApiError';
    this.status = status;
  }
}

const fitbitFetch = async <T>(path: string, accessToken: string): Promise<T> => {
  const response = await fetch(`${FITBIT_API_BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new FitbitApiError(`Fitbit API error: ${response.status} ${text}`, response.status);
  }

  return response.json() as Promise<T>;
};

export interface FitbitActivity {
  logId: number;
  activityName: string;
  activityTypeId: number;
  startTime: string;
  startDate: string;
  duration: number; // ms
  distance?: number; // km (if available)
  calories: number;
  steps?: number;
  elevationGain?: number;
  averageHeartRate?: number;
  heartRateZones?: Array<{ name: string; min: number; max: number; minutes: number }>;
}

export interface FitbitSleepLog {
  dateOfSleep: string;
  duration: number; // ms
  efficiency: number;
  minutesAsleep: number;
  minutesAwake: number;
}

// Fitbit activity type → our type
const FITBIT_ACTIVITY_MAP: Record<number, string> = {
  90009: 'RUN', // Running
  90013: 'WALK', // Walking
  90001: 'CYCLE', // Cycling
  15000: 'SWIM', // Swimming
  90012: 'HIKE', // Hiking
};

export const fitbitClient = {
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: env.FITBIT_CLIENT_ID!,
      response_type: 'code',
      redirect_uri: `${env.BETTER_AUTH_URL}/api/integrations/fitbit/callback`,
      scope: 'activity sleep weight heartrate nutrition profile',
      state,
    });
    return `${FITBIT_AUTH_BASE}?${params.toString()}`;
  },

  async exchangeToken(code: string): Promise<{ access_token: string; refresh_token: string; expires_in: number; user_id: string }> {
    const basicAuth = Buffer.from(`${env.FITBIT_CLIENT_ID}:${env.FITBIT_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(FITBIT_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${env.BETTER_AUTH_URL}/api/integrations/fitbit/callback`,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new FitbitApiError(`Token exchange failed: ${response.status} ${text}`, response.status);
    }

    return response.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number; user_id: string }>;
  },

  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
    const basicAuth = Buffer.from(`${env.FITBIT_CLIENT_ID}:${env.FITBIT_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(FITBIT_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new FitbitApiError(`Token refresh failed: ${response.status} ${text}`, response.status);
    }

    return response.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>;
  },

  async getActivities(accessToken: string, date: string): Promise<{ activities: FitbitActivity[] }> {
    return fitbitFetch(`/1/user/-/activities/date/${date}.json`, accessToken);
  },

  async getSteps(accessToken: string, date: string): Promise<{ 'activities-steps': Array<{ dateTime: string; value: string }> }> {
    return fitbitFetch(`/1/user/-/activities/steps/date/${date}/1d.json`, accessToken);
  },

  async getSleep(accessToken: string, date: string): Promise<{ sleep: FitbitSleepLog[]; summary: { totalMinutesAsleep: number } }> {
    return fitbitFetch(`/1.2/user/-/sleep/date/${date}.json`, accessToken);
  },

  async getWeight(accessToken: string, date: string): Promise<{ weight: Array<{ date: string; weight: number; bmi: number }> }> {
    return fitbitFetch(`/1/user/-/body/log/weight/date/${date}.json`, accessToken);
  },

  async getWater(accessToken: string, date: string): Promise<{ summary: { water: number } }> {
    return fitbitFetch(`/1/user/-/foods/log/water/date/${date}.json`, accessToken);
  },

  mapActivityType(activityTypeId: number): string {
    return FITBIT_ACTIVITY_MAP[activityTypeId] ?? 'OTHER';
  },
};
