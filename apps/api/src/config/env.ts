import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  DATABASE_URL: z.string(),

  // Auth
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.string().default('http://localhost:3001'),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_SECRET: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_APP_BUNDLE_ID: z.string().optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().default('onboarding@resend.dev'),
  SUPPORT_EMAIL: z.string().default('support@fitnassist.co'),

  // Frontend
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Google Maps
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // USDA FoodData Central (free key from https://api.data.gov/signup/)
  USDA_API_KEY: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_ID_PRO_ANNUAL: z.string().optional(),
  STRIPE_PRICE_ID_ELITE_MONTHLY: z.string().optional(),
  STRIPE_PRICE_ID_ELITE_ANNUAL: z.string().optional(),

  // Twilio (SMS)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),

  // Web Push (VAPID keys)
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  // Daily.co (Video Calls)
  DAILY_API_KEY: z.string().optional(),

  // Cron job authentication
  CRON_SECRET: z.string().optional(),

  // Integration encryption (32-byte hex for AES-256-GCM)
  INTEGRATION_ENCRYPTION_KEY: z.string().length(64).optional(),

  // Strava
  STRAVA_CLIENT_ID: z.string().optional(),
  STRAVA_CLIENT_SECRET: z.string().optional(),
  STRAVA_WEBHOOK_VERIFY_TOKEN: z.string().optional(),

  // Google Fit
  GOOGLE_FIT_CLIENT_ID: z.string().optional(),
  GOOGLE_FIT_CLIENT_SECRET: z.string().optional(),

  // Fitbit
  FITBIT_CLIENT_ID: z.string().optional(),
  FITBIT_CLIENT_SECRET: z.string().optional(),
  FITBIT_WEBHOOK_VERIFY_CODE: z.string().optional(),

  // Garmin
  GARMIN_CONSUMER_KEY: z.string().optional(),
  GARMIN_CONSUMER_SECRET: z.string().optional(),

  // Website builder
  SITE_DOMAIN: z.string().default('sites.fitnassist.co'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return result.data;
}

export const env = loadEnv();
