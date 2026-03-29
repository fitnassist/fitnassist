import { env } from '../config/env';
import { createHmac, randomBytes } from 'crypto';

const GARMIN_REQUEST_TOKEN_URL = 'https://connectapi.garmin.com/oauth-service/oauth/request_token';
const GARMIN_AUTHORIZE_URL = 'https://connect.garmin.com/oauthConfirm';
const GARMIN_ACCESS_TOKEN_URL = 'https://connectapi.garmin.com/oauth-service/oauth/access_token';

// In-memory store for OAuth1a request tokens (temp tokens → { secret, userId })
const pendingTokens = new Map<string, { secret: string; userId: string }>();

const generateNonce = (): string => randomBytes(16).toString('hex');
const timestamp = (): string => Math.floor(Date.now() / 1000).toString();

const percentEncode = (str: string): string =>
  encodeURIComponent(str).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

const buildOAuthHeader = (
  params: Record<string, string>,
  method: string,
  url: string,
  consumerSecret: string,
  tokenSecret: string = ''
): string => {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: env.GARMIN_CONSUMER_KEY!,
    oauth_nonce: generateNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp(),
    oauth_version: '1.0',
    ...params,
  };

  // Build signature base string
  const allParams = { ...oauthParams };
  const paramString = Object.keys(allParams)
    .sort()
    .map(k => `${percentEncode(k)}=${percentEncode(allParams[k]!)}`)
    .join('&');

  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  const signature = createHmac('sha1', signingKey).update(baseString).digest('base64');

  oauthParams['oauth_signature'] = signature;

  const header = Object.keys(oauthParams)
    .sort()
    .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k]!)}"`)
    .join(', ');

  return `OAuth ${header}`;
};

const parseFormBody = (body: string): Record<string, string> => {
  const result: Record<string, string> = {};
  body.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) result[decodeURIComponent(key)] = decodeURIComponent(value);
  });
  return result;
};

export interface GarminPushActivity {
  userId: string;
  userAccessToken: string;
  summaryId: string;
  activityType: string;
  startTimeInSeconds: number;
  durationInSeconds: number;
  distanceInMeters?: number;
  activeKilocalories?: number;
  averageHeartRateInBeatsPerMinute?: number;
  maxHeartRateInBeatsPerMinute?: number;
}

export interface GarminPushDaily {
  userId: string;
  userAccessToken: string;
  calendarDate: string;
  steps?: number;
}

export interface GarminPushSleep {
  userId: string;
  userAccessToken: string;
  calendarDate: string;
  durationInSeconds: number;
  validation: string;
}

export interface GarminPushBody {
  userId: string;
  userAccessToken: string;
  calendarDate: string;
  weightInGrams?: number;
}

const GARMIN_ACTIVITY_MAP: Record<string, string> = {
  RUNNING: 'RUN',
  TRAIL_RUNNING: 'RUN',
  WALKING: 'WALK',
  HIKING: 'HIKE',
  CYCLING: 'CYCLE',
  MOUNTAIN_BIKING: 'CYCLE',
  SWIMMING: 'SWIM',
  OPEN_WATER_SWIMMING: 'SWIM',
};

export const garminClient = {
  async getRequestToken(userId: string): Promise<string> {
    const callbackUrl = `${env.BETTER_AUTH_URL}/api/integrations/garmin/callback`;
    const authHeader = buildOAuthHeader(
      { oauth_callback: callbackUrl },
      'POST',
      GARMIN_REQUEST_TOKEN_URL,
      env.GARMIN_CONSUMER_SECRET!
    );

    const response = await fetch(GARMIN_REQUEST_TOKEN_URL, {
      method: 'POST',
      headers: { 'Authorization': authHeader },
    });

    if (!response.ok) {
      throw new Error(`Garmin request token failed: ${response.status}`);
    }

    const body = await response.text();
    const parsed = parseFormBody(body);
    const token = parsed['oauth_token']!;
    const secret = parsed['oauth_token_secret']!;

    // Store temporarily for callback
    pendingTokens.set(token, { secret, userId });
    // Clean up after 10 minutes
    setTimeout(() => pendingTokens.delete(token), 10 * 60 * 1000);

    return `${GARMIN_AUTHORIZE_URL}?oauth_token=${token}`;
  },

  async exchangeAccessToken(oauthToken: string, oauthVerifier: string): Promise<{
    accessToken: string;
    tokenSecret: string;
    userId: string;
    garminUserId: string;
  }> {
    const pending = pendingTokens.get(oauthToken);
    if (!pending) throw new Error('Unknown or expired OAuth token');
    pendingTokens.delete(oauthToken);

    const authHeader = buildOAuthHeader(
      { oauth_token: oauthToken, oauth_verifier: oauthVerifier },
      'POST',
      GARMIN_ACCESS_TOKEN_URL,
      env.GARMIN_CONSUMER_SECRET!,
      pending.secret
    );

    const response = await fetch(GARMIN_ACCESS_TOKEN_URL, {
      method: 'POST',
      headers: { 'Authorization': authHeader },
    });

    if (!response.ok) {
      throw new Error(`Garmin access token failed: ${response.status}`);
    }

    const body = await response.text();
    const parsed = parseFormBody(body);

    return {
      accessToken: parsed['oauth_token']!,
      tokenSecret: parsed['oauth_token_secret']!,
      userId: pending.userId,
      garminUserId: parsed['oauth_token']!, // Garmin uses token as user identifier
    };
  },

  mapActivityType(garminType: string): string {
    return GARMIN_ACTIVITY_MAP[garminType] ?? 'OTHER';
  },
};
