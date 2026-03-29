# Phase 8: Integrations, Wearables & Advanced Tracking

## Context

Trainees need Fitnassist to replace all their other fitness apps (Strava, MyFitnessPal, Fitbit, Apple Health). Since trainee accounts are free (funded by trainer subscriptions), offering best-in-class tracking with automatic data sync is the key differentiator that makes switching a no-brainer. This phase adds third-party integrations that can be done server-side now, and plans the architecture for mobile-only features (GPS tracking, barcode scanning, AI food recognition) later.

## What Already Exists

- `ActivitySource` enum: `MANUAL`, `STRAVA`, `GARMIN`, `APPLE_HEALTH`, `GOOGLE_FIT`
- `ActivityEntry` has: `source`, `externalId`, `routePolyline`, GPS lat/lng fields, `avgHeartRate`, `maxHeartRate`
- Diary upsert patterns for all entry types (weight, steps, sleep, water, food, activity)
- Cron infrastructure at `/api/cron/*` with bearer token auth
- Stripe webhook pattern (raw body + signature verification)
- SSE broadcasting + 3-channel notifications
- Better Auth `Account` model (used for auth only — won't reuse for integrations)

## Key Design Decisions

1. **Separate `IntegrationConnection` model** — not the Better Auth `Account` model. Integrations need sync status, webhook IDs, preferences, and have a different lifecycle.
2. **Dual sync: webhooks + polling fallback** — Strava/Fitbit use webhooks for real-time. Google Fit is polling-only. Cron catches missed webhook events.
3. **Manual entries always win** — If a manual diary entry exists for the same time window (±30 min for activities, same date for daily entries), skip the synced version. Dedup via `externalId`.
4. **Token refresh: on-demand + proactive** — Retry on 401 with fresh token. Cron proactively refreshes tokens expiring within 1 hour.
5. **30-day history import** on initial connect, as background job.
6. **Add `source` field** to `StepsEntry`, `SleepEntry`, `WeightEntry`, `WaterEntry` for tracking origin.
7. **Encrypt tokens at rest** with AES-256-GCM.

---

## Schema Changes

**File: `packages/database/prisma/schema.prisma`**

New enums:
```prisma
enum IntegrationProvider {
  STRAVA
  GOOGLE_FIT
  FITBIT
  GARMIN
}

enum IntegrationStatus {
  CONNECTED
  DISCONNECTED
  ERROR
  SYNCING
}
```

Add `FITBIT` to existing `ActivitySource` enum.

New `IntegrationConnection` model:
- `id`, `userId` → User
- `provider` IntegrationProvider, `status` IntegrationStatus @default(CONNECTED)
- `accessToken` String @db.Text (encrypted), `refreshToken` String? @db.Text (encrypted)
- `tokenExpiresAt` DateTime?, `scope` String?
- `externalUserId` String? (e.g. Strava athlete ID — for webhook lookups)
- `webhookSubscriptionId` String?
- `lastSyncAt` DateTime?, `lastSyncError` String?
- `syncPreferences` Json? (`{ activities: true, steps: true, sleep: true, weight: true, water: true }`)
- `initialImportComplete` Boolean @default(false)
- `@@unique([userId, provider])`, `@@index([provider, status])`

Add `source ActivitySource @default(MANUAL)` to: `StepsEntry`, `SleepEntry`, `WeightEntry`, `WaterEntry`.

Add relation on `User`: `integrations IntegrationConnection[]`.

---

## Implementation Chunks

### Chunk 1: Infrastructure — Schema, Repository, Encryption, Core Service

**Schema**: Add enums, `IntegrationConnection` model, `FITBIT` to `ActivitySource`, `source` field to `StepsEntry`/`SleepEntry`/`WeightEntry`/`WaterEntry`. Run `db:generate` + migrate.

**New files:**
- `apps/api/src/lib/encryption.ts` — AES-256-GCM `encrypt()`/`decrypt()` for token storage
- `apps/api/src/repositories/integration.repository.ts` — CRUD: `findByUserAndProvider`, `findByProvider(status?)`, `findByExternalUserId`, `upsert`, `updateTokens`, `updateSyncStatus`, `disconnect`, `findAllConnected`
- `apps/api/src/services/integration.service.ts` — `getConnections(userId)`, `disconnect(userId, provider)`, `getConnectionStatus(userId, provider)`
- `apps/api/src/routers/integration.router.ts` — `list` query, `disconnect` mutation, `updatePreferences` mutation
- `packages/schemas/src/forms/integration.schema.ts` — Zod schemas for disconnect/preferences

**Modified files:**
- `packages/database/prisma/schema.prisma`
- `apps/api/src/config/env.ts` — Add `INTEGRATION_ENCRYPTION_KEY`, all provider env vars (optional)
- `apps/api/src/routers/_app.ts` — Register `integration` router
- `packages/schemas/src/index.ts` — Export integration schemas

### Chunk 2: Sync Engine

Shared sync logic all integrations funnel through, reusing the existing `diaryService` methods so all side effects (goals, PBs, badges, SSE) trigger automatically.

**New files:**
- `apps/api/src/services/integration-sync.service.ts`:
  - `syncActivity(userId, externalActivity)` — dedup by `externalId`, skip if manual entry in same time window, calls `diaryService.logActivity()` with source/externalId/GPS/HR fields
  - `syncSteps(userId, date, steps, source)` — only writes if no manual entry or higher value
  - `syncSleep(userId, date, hours, quality, source)` — same pattern
  - `syncWeight(userId, date, weightKg, source)` — same pattern
  - `syncWater(userId, date, totalMl, source)` — same pattern

**Modified files:**
- `apps/api/src/repositories/diary.repository.ts` — `createActivity()` accepts optional `source`, `externalId`, GPS, HR fields. New `findActivityByExternalId()`. Upsert methods accept `source`.
- `apps/api/src/services/diary.service.ts` — `logActivity()` passes through new fields. Upserts accept `source`.
- `packages/schemas/src/forms/diary.schema.ts` — Extend `logActivitySchema` with optional source/external fields

### Chunk 3: Strava OAuth + Sync

**New files:**
- `apps/api/src/lib/strava.ts` — HTTP client (base URLs, error handling, rate limit awareness)
- `apps/api/src/services/strava.service.ts` — `getAuthUrl()`, `exchangeToken()`, `refreshToken()`, `getActivity()`, `getActivities()`, `mapStravaActivity()`, `importHistory()`, `deauthorize()`
- `apps/api/src/routes/integrations.ts` — Express router (OAuth redirects can't use tRPC):
  - `GET /api/integrations/strava/auth` — redirect to Strava with state=userId
  - `GET /api/integrations/strava/callback` — exchange code, store tokens, trigger history import, redirect to settings

**Modified files:**
- `apps/api/src/app.ts` — Mount `/api/integrations` routes after `express.json()`
- `apps/api/src/config/env.ts` — Validate `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`

### Chunk 4: Strava Webhooks + Cron

**New files:**
- `apps/api/src/routes/integration-webhooks.ts` — Express router:
  - `GET /api/webhooks/strava` — hub.challenge validation
  - `POST /api/webhooks/strava` — activity create/update/delete/deauthorize events → fetch full activity → sync engine

**Modified files:**
- `apps/api/src/services/strava.service.ts` — `handleWebhookEvent()`, `createWebhookSubscription()`
- `apps/api/src/routes/cron.ts` — Add `POST /api/cron/integration-sync` (poll providers without webhooks), `POST /api/cron/token-refresh` (refresh expiring tokens), `POST /api/cron/strava-catchup` (catch missed webhooks)
- `apps/api/src/app.ts` — Mount webhook routes

### Chunk 5: Integration Settings UI

**New files:**
- `apps/web/src/pages/dashboard/settings/components/IntegrationsTab/index.tsx` — Lists available integrations, shows connection status, connect/disconnect buttons
- `apps/web/src/pages/dashboard/settings/components/IntegrationsTab/IntegrationCard.tsx` — Card per provider: logo, status badge, connect/disconnect, sync preferences toggles, last synced time
- `apps/web/src/pages/dashboard/settings/components/IntegrationsTab/integrations.constants.ts` — Provider metadata (names, descriptions, available data types, logo paths)
- `apps/web/src/api/integration/useIntegration.ts` — `useIntegrations()`, `useDisconnectIntegration()`, `useUpdateSyncPreferences()`
- `apps/web/src/api/integration/index.ts` — Barrel export

**Modified files:**
- `apps/web/src/pages/dashboard/settings/index.tsx` — Add "Integrations" tab
- `apps/web/src/pages/dashboard/settings/components/index.ts` — Export IntegrationsTab

### Chunk 6: Source Badges + Activity Maps

**New files:**
- `apps/web/src/components/ui/source-badge.tsx` — Small badge showing provider icon (Strava orange, Google Fit blue, etc.) next to synced entries
- `apps/web/src/components/ActivityMap/index.tsx` — Leaflet map rendering decoded polyline route with start/end markers

**Modified files:**
- Diary display components — Add `<SourceBadge>` next to activities/steps/sleep/weight when `source !== 'MANUAL'`
- Activity detail view — Show map when `routePolyline` present, show heart rate data

**New deps:** `leaflet`, `react-leaflet`, `@types/leaflet`, `@mapbox/polyline`

### Chunk 7: Google Fit Integration

**New files:**
- `apps/api/src/lib/google-fit.ts` — REST API client for Google Fitness API
- `apps/api/src/services/google-fit.service.ts` — `getAuthUrl()`, `exchangeToken()`, `refreshToken()`, `getSteps()`, `getActivities()`, `getSleep()`, `getWeight()`, `syncAll()`, `importHistory()`

**Modified files:**
- `apps/api/src/routes/integrations.ts` — Add Google Fit OAuth routes
- `apps/api/src/routes/cron.ts` — `integration-sync` cron polls Google Fit for connected users

### Chunk 8: Fitbit Integration

**New files:**
- `apps/api/src/lib/fitbit.ts` — REST API client
- `apps/api/src/services/fitbit.service.ts` — OAuth2, `getSteps()`, `getSleep()`, `getHeartRate()`, `getWeight()`, `getActivities()`, `getWater()`, `createSubscription()`, `syncAll()`, `importHistory()`

**Modified files:**
- `apps/api/src/routes/integrations.ts` — Fitbit OAuth routes
- `apps/api/src/routes/integration-webhooks.ts` — Fitbit webhook verification + handler

### Chunk 9: Garmin Integration

**New files:**
- `apps/api/src/lib/garmin.ts` — API client with OAuth1a signing
- `apps/api/src/services/garmin.service.ts` — OAuth1a flow, `handlePush()`, `mapGarminActivity()`, `importHistory()`

**Modified files:**
- `apps/api/src/routes/integrations.ts` — Garmin OAuth1a routes
- `apps/api/src/routes/integration-webhooks.ts` — Garmin push endpoints (activities, dailies, sleep, body)

**New dep:** `oauth-1.0a`

### Chunk 10: Token Refresh & Error Recovery

**New files:**
- `apps/api/src/services/token-refresh.service.ts` — `refreshExpiringTokens()` (finds tokens expiring within 1h, refreshes per-provider), `handleRefreshError()` (marks ERROR, notifies user)

**Modified files:**
- `apps/api/src/services/integration.service.ts` — Add `withTokenRefresh(connection, apiCall)` wrapper
- `apps/api/src/routes/cron.ts` — Wire up token-refresh cron

---

## Tier 2: Future Mobile Features (Architecture Notes)

These require a mobile app (React Native) or PWA with device APIs. Plan the data model now, build later.

### GPS Activity Tracking
- `navigator.geolocation.watchPosition()` for live tracking in PWA/mobile
- Build polyline from GPS points client-side
- Upload via existing `logActivity` endpoint with GPS fields already in schema
- Show live route during recording, final route after save
- Architecture: New `apps/mobile/` workspace (React Native + Expo)

### Barcode Food Scanning
- Camera access via `navigator.mediaDevices.getUserMedia()` or RN camera
- Decode barcode client-side (`quagga2` or `zxing-wasm`)
- Look up product in Open Food Facts API (already integrated in `diary.router.ts` — `searchFood`/`getFoodNutrients`)
- Pre-fill food entry form with nutrition data

### AI Food Recognition
- Photo upload to API endpoint
- API calls Claude Vision API with image
- Returns estimated food items with calories/macros
- User confirms/adjusts before saving as `FoodEntry`
- Could also work on web (file upload) — not strictly mobile-only

---

## Environment Variables

```
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_WEBHOOK_VERIFY_TOKEN=      # Random string, Strava echoes back
GOOGLE_FIT_CLIENT_ID=
GOOGLE_FIT_CLIENT_SECRET=
FITBIT_CLIENT_ID=
FITBIT_CLIENT_SECRET=
FITBIT_WEBHOOK_VERIFY_CODE=
GARMIN_CONSUMER_KEY=
GARMIN_CONSUMER_SECRET=
INTEGRATION_ENCRYPTION_KEY=       # 32-byte hex for AES-256-GCM
```

All optional (graceful degradation — provider features hidden when keys not configured).

---

## Implementation Order

1. Chunk 1: Schema + infrastructure (repo, encryption, core service, router)
2. Chunk 2: Sync engine (shared sync logic through diary service)
3. Chunk 3: Strava OAuth + sync
4. Chunk 4: Strava webhooks + cron jobs
5. Chunk 5: Integration settings UI
6. Chunk 6: Source badges + activity maps
7. Chunk 7: Google Fit
8. Chunk 8: Fitbit
9. Chunk 9: Garmin
10. Chunk 10: Token refresh & error recovery

## Verification

1. Connect Strava → redirects to Strava OAuth → callback stores tokens → settings shows "Connected"
2. Initial history import: last 30 days of Strava activities appear in diary with Strava badge
3. Log a new Strava activity → webhook fires → appears in diary within seconds, triggers PB/goal/badge checks
4. Manual entry for same time as Strava activity → Strava version skipped (no duplicate)
5. Disconnect Strava → tokens cleared, status shows disconnected
6. Connect Google Fit → cron syncs steps/sleep/weight → appear in diary with source badges
7. Connect Fitbit → webhook syncs activities/steps/sleep/water
8. Activity map shows route for GPS-tracked activities
9. Token expiry → auto-refresh, no user action needed
10. Integration error → user notified, settings show error state with reconnect option
11. Typecheck passes, all existing tests still pass
