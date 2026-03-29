# Infrastructure & Services

How the platform is hosted, what third-party services are used, and how everything connects.

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Vercel     │     │   Railway    │     │    Neon       │
│  (Frontend)  │────▶│   (API)      │────▶│ (PostgreSQL)  │
│  React SPA   │     │  Express +   │     │  Serverless   │
│              │     │  tRPC        │     │              │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │
              ┌────────────┼────────────────┐
              │            │                │
        ┌─────▼──┐   ┌────▼────┐   ┌──────▼──────┐
        │ Stripe │   │ Resend  │   │   Twilio     │
        │Payments│   │ Email   │   │   SMS        │
        └────────┘   └─────────┘   └─────────────┘
```

## Hosting

| Component | Provider | URL | Notes |
|-----------|----------|-----|-------|
| Frontend | [Vercel](https://vercel.com) | `fitnassist.co` | React SPA (`apps/web`), auto-deploys from `main` |
| API | [Railway](https://railway.com) | `api.fitnassist.co` | Express + tRPC (`apps/api`), auto-deploys from `main` |
| Database | [Neon](https://neon.tech) | — | Serverless PostgreSQL, Prisma ORM |

## Core Services

| Service | Provider | Purpose | Config |
|---------|----------|---------|--------|
| Auth | [Better Auth](https://www.better-auth.com) | User authentication, sessions, Google OAuth | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` |
| Payments | [Stripe](https://stripe.com) | Subscription billing, Connect payouts, session payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Email | [Resend](https://resend.com) | Transactional emails (welcome, reports, receipts) | `RESEND_API_KEY` |
| SMS | [Twilio](https://twilio.com) | Text notifications (booking confirmations) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` |
| Video | [Daily.co](https://daily.co) | WebRTC video rooms for training sessions | `DAILY_API_KEY` |
| Maps | [Google Maps](https://console.cloud.google.com) | Geocoding, distance matrix, trainer search | `GOOGLE_MAPS_API_KEY` |
| Food Data | [USDA FoodData Central](https://fdc.nal.usda.gov) | Food nutrition database | `USDA_API_KEY` |
| Push | Web Push (VAPID) | Browser push notifications | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` |

## Integration Providers (Wearables)

Trainee wearable/fitness app integrations. All provider env vars are optional — features are hidden when keys aren't configured.

| Provider | Auth Flow | Real-time Sync | Polling Fallback | Data Types | Developer Portal |
|----------|-----------|----------------|------------------|------------|------------------|
| Strava | OAuth2 | Webhooks → `/api/webhooks/strava` | Catchup cron (6h) | Activities, GPS routes, heart rate | [strava.com/settings/api](https://www.strava.com/settings/api) |
| Google Fit | OAuth2 | None (no webhook support) | Cron poll (15min) | Steps, sleep, weight, activities | [GCP Console](https://console.cloud.google.com/apis/credentials) — enable Fitness API |
| Fitbit | OAuth2 | Webhooks → `/api/webhooks/fitbit` | — | Activities, steps, sleep, weight, water | [dev.fitbit.com/apps](https://dev.fitbit.com/apps) |
| Garmin | OAuth1a | Push API → `/api/webhooks/garmin/*` | — | Activities, dailies, sleep, body comp | [developerportal.garmin.com](https://developerportal.garmin.com) (requires approval) |

### OAuth Callback URLs

Register these with each provider's developer portal:

```
Strava:     https://api.fitnassist.co/api/integrations/strava/callback
Google Fit: https://api.fitnassist.co/api/integrations/google-fit/callback
Fitbit:     https://api.fitnassist.co/api/integrations/fitbit/callback
Garmin:     https://api.fitnassist.co/api/integrations/garmin/callback
```

### Webhook URLs

Register these for real-time data sync:

```
Strava:  https://api.fitnassist.co/api/webhooks/strava
Fitbit:  https://api.fitnassist.co/api/webhooks/fitbit
Garmin:  https://api.fitnassist.co/api/webhooks/garmin/activities
         https://api.fitnassist.co/api/webhooks/garmin/dailies
         https://api.fitnassist.co/api/webhooks/garmin/sleep
         https://api.fitnassist.co/api/webhooks/garmin/body
```

### Token Security

Integration tokens are encrypted at rest using AES-256-GCM (`INTEGRATION_ENCRYPTION_KEY`). Tokens are proactively refreshed by cron before expiry. If refresh fails, the connection is marked as ERROR and the user is notified in-app.

## Cron Jobs (GitHub Actions)

Scheduled tasks run as GitHub Actions workflows (`.github/workflows/`). Each workflow uses `curl` to POST to the Railway API with `secrets.CRON_SECRET` for auth.

| Workflow File | Schedule | API Endpoint | Purpose |
|---------------|----------|--------------|---------|
| `weekly-reports.yml` | Mon 7:00 UTC | `/api/cron/weekly-reports` | Trainer weekly activity summaries |
| | | `/api/cron/client-weekly-reports` | Client weekly progress summaries |
| `booking-reminders.yml` | Daily 7:00 UTC | `/api/cron/booking-reminders` | Upcoming session reminders |
| `booking-hold-expiry.yml` | Every 5 min | `/api/cron/booking-hold-expiry` | Expire unpaid pending bookings |
| `video-room-cleanup.yml` | Daily 2:00 UTC | `/api/cron/cleanup-video-rooms` | Delete expired Daily.co video rooms |
| `cleanup-notifications.yml` | Daily 3:00 UTC | `/api/cron/cleanup-notifications` | Purge old/dismissed notifications |
| `token-refresh.yml` | Every 30 min | `/api/cron/token-refresh` | Refresh expiring OAuth tokens |
| `integration-sync.yml` | Every 15 min | `/api/cron/integration-sync` | Poll Google Fit (no webhook support) |
| `strava-catchup.yml` | Every 6 hours | `/api/cron/strava-catchup` | Re-sync last 24h to catch missed webhooks |

### Adding a New Cron Job

1. Add the endpoint in `apps/api/src/routes/cron.ts` (protected by `CRON_SECRET`)
2. Create a workflow in `.github/workflows/` following the existing pattern
3. Push to `main` — GitHub Actions will pick it up automatically

## Webhooks (Inbound)

External services that POST to our API:

| Source | Endpoint | Purpose |
|--------|----------|---------|
| Stripe | `/api/webhooks/stripe` | Payment events, subscription changes |
| Strava | `/api/webhooks/strava` | Activity create/update/delete, deauthorization |
| Fitbit | `/api/webhooks/fitbit` | Activity, steps, sleep, weight, water updates |
| Garmin | `/api/webhooks/garmin/*` | Activity, daily, sleep, body composition pushes |

## Environment Variables

### Railway (API)

**Core:**
- `DATABASE_URL` — Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` — Auth session signing secret
- `BETTER_AUTH_URL` — API base URL (`https://api.fitnassist.co`)
- `FRONTEND_URL` — Frontend URL (`https://fitnassist.co`)
- `CRON_SECRET` — Bearer token for cron job authentication

**Services:**
- `RESEND_API_KEY` — Resend email API key
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth (user login)
- `GOOGLE_MAPS_API_KEY` — Geocoding & distance matrix
- `USDA_API_KEY` — USDA FoodData Central
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Stripe payments
- `STRIPE_PRICE_ID_PRO_MONTHLY`, `STRIPE_PRICE_ID_PRO_ANNUAL` — Pro plan prices
- `STRIPE_PRICE_ID_ELITE_MONTHLY`, `STRIPE_PRICE_ID_ELITE_ANNUAL` — Elite plan prices
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — Web push
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` — SMS
- `DAILY_API_KEY` — Daily.co video rooms

**Integrations (all optional):**
- `INTEGRATION_ENCRYPTION_KEY` — 32-byte hex key for AES-256-GCM token encryption
- `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET` — Strava API credentials
- `STRAVA_WEBHOOK_VERIFY_TOKEN` — Random string for Strava webhook validation
- `GOOGLE_FIT_CLIENT_ID`, `GOOGLE_FIT_CLIENT_SECRET` — Google Fitness API
- `FITBIT_CLIENT_ID`, `FITBIT_CLIENT_SECRET` — Fitbit API credentials
- `FITBIT_WEBHOOK_VERIFY_CODE` — Random string for Fitbit webhook validation
- `GARMIN_CONSUMER_KEY`, `GARMIN_CONSUMER_SECRET` — Garmin Connect API

### Vercel (Frontend)

- `VITE_API_URL` — Backend API URL
- `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe public key
- `VITE_GOOGLE_MAPS_API_KEY` — Google Maps (client-side)

### GitHub Actions Secrets

- `API_URL` — Railway API URL (`https://api.fitnassist.co`)
- `CRON_SECRET` — Same value as Railway's `CRON_SECRET`
