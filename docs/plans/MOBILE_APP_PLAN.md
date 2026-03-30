# Mobile App Plan (React Native / Expo)

## Overview

Build a React Native mobile app using Expo that provides full feature parity with the Fitnassist web app, plus mobile-only features (GPS tracking, barcode scanning, AI food recognition). The app lives in `apps/mobile` within the existing monorepo and shares packages, schemas, types, and the same tRPC API backend.

## Tech Stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Framework | Expo SDK 53+ (managed workflow) | Auto monorepo support, OTA updates, managed native modules |
| Navigation | Expo Router v5 | File-based routing, built on React Navigation, closest to web's React Router |
| Styling | NativeWind v4 + shared Tailwind config | Same Tailwind classes as web, shared `tailwind.config.js` |
| UI Components | React Native Reusables | "shadcn/ui for React Native" — same copy-paste philosophy, NativeWind + Radix primitives |
| Data Fetching | @trpc/react-query + TanStack Query | Same hooks and patterns as web |
| Auth | @better-auth/expo + expo-secure-store | First-class Better Auth plugin, token-based sessions stored securely |
| Push Notifications | expo-notifications + expo-server-sdk (backend) | Integrates with existing notification service |
| Real-time | rn-eventsource-reborn (SSE polyfill) | Same SSE pattern as web for live messaging/updates |
| Forms | React Hook Form + Zod | Same as web, shared schemas from @fitnassist/schemas |
| Maps | react-native-maps | Native maps for trainer search + GPS tracking |
| Camera | expo-camera + expo-barcode-scanner | Barcode scanning, AI food photos |
| Location | expo-location | GPS tracking for walks/runs/rides |
| Storage | expo-secure-store (auth), @react-native-async-storage/async-storage (prefs) | Secure token storage + general preferences |
| Image Picking | expo-image-picker | Profile photos, gallery uploads, progress photos |

## What We Share vs What We Rebuild

### Shared (no changes needed)
- Backend API (`apps/api`) — tRPC stays as-is, mobile is just another client
- `@fitnassist/schemas` — Zod schemas, form validation, constants
- `@fitnassist/database` — TypeScript types and enums (not Prisma client itself)
- `@fitnassist/types` — shared type definitions
- Business logic patterns — same tRPC hooks structure, same query keys

### Rebuilt for React Native
- All UI components — React DOM → React Native components
- Navigation — React Router → Expo Router (file-based)
- Styling — Tailwind CSS → NativeWind (same class names, different runtime)
- Auth client — cookie-based → token-based via @better-auth/expo
- SSE client — native EventSource → rn-eventsource-reborn polyfill
- Push notifications — web push (service worker) → expo-notifications (FCM/APNs)
- File uploads — browser File API → expo-image-picker + FormData

### New (mobile-only)
- GPS activity tracking (walks, runs, rides)
- Barcode food scanning
- AI food recognition (Claude Vision)
- Native push notifications (APNs + FCM)
- Background location tracking

---

## Monorepo Structure

```
fitnassist/
├── apps/
│   ├── web/                          # Existing React web app
│   ├── api/                          # Existing Express + tRPC backend
│   └── mobile/                       # NEW — Expo React Native app
│       ├── app/                      # Expo Router file-based routes
│       │   ├── (auth)/               # Auth group (login, register)
│       │   │   ├── login.tsx
│       │   │   ├── register.tsx
│       │   │   ├── forgot-password.tsx
│       │   │   └── _layout.tsx
│       │   ├── (tabs)/              # Main tab navigator (authenticated)
│       │   │   ├── index.tsx         # Dashboard/Home tab
│       │   │   ├── messages.tsx      # Messages tab
│       │   │   ├── bookings.tsx      # Bookings tab
│       │   │   ├── diary.tsx         # Diary tab (trainee) / Clients tab (trainer)
│       │   │   ├── profile.tsx       # Profile/Settings tab
│       │   │   └── _layout.tsx       # Tab bar configuration
│       │   ├── trainers/
│       │   │   ├── index.tsx         # Find a Trainer (search + map)
│       │   │   └── [handle].tsx      # Trainer public profile
│       │   ├── dashboard/
│       │   │   ├── requests.tsx
│       │   │   ├── clients/
│       │   │   │   ├── index.tsx
│       │   │   │   └── [id].tsx
│       │   │   ├── resources/
│       │   │   │   └── index.tsx
│       │   │   ├── onboarding/
│       │   │   │   └── index.tsx
│       │   │   ├── analytics.tsx
│       │   │   ├── reviews.tsx
│       │   │   ├── referrals.tsx
│       │   │   ├── goals.tsx
│       │   │   ├── my-plans.tsx
│       │   │   ├── feed.tsx
│       │   │   ├── friends.tsx
│       │   │   ├── leaderboards.tsx
│       │   │   ├── achievements.tsx
│       │   │   ├── purchases.tsx
│       │   │   └── settings.tsx
│       │   ├── messages/
│       │   │   └── [connectionId].tsx  # Message thread
│       │   ├── bookings/
│       │   │   ├── [id].tsx            # Booking detail
│       │   │   ├── [id]/call.tsx       # Video call
│       │   │   └── book/[trainerId].tsx
│       │   ├── tracking/               # Mobile-only GPS tracking
│       │   │   └── index.tsx
│       │   ├── scan/                   # Mobile-only barcode/food scanning
│       │   │   └── index.tsx
│       │   ├── _layout.tsx             # Root layout (auth guard, providers)
│       │   └── +not-found.tsx
│       ├── components/
│       │   ├── ui/                     # React Native Reusables components
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── input.tsx
│       │   │   ├── badge.tsx
│       │   │   ├── skeleton.tsx
│       │   │   ├── sheet.tsx           # Bottom sheet (mobile pattern)
│       │   │   └── index.ts
│       │   ├── layouts/
│       │   │   ├── AuthGuard.tsx
│       │   │   ├── RoleGuard.tsx
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── lib/
│       │   ├── trpc.ts                 # tRPC client (token-based auth)
│       │   ├── auth.ts                 # Better Auth Expo client
│       │   ├── sse.ts                  # SSE with rn-eventsource-reborn
│       │   ├── queryClient.ts
│       │   └── utils.ts
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useColorScheme.ts
│       │   └── useNotifications.ts
│       ├── api/                        # tRPC wrapper hooks (mirrors web/src/api/)
│       │   ├── trainer/
│       │   ├── message/
│       │   ├── booking/
│       │   └── ...
│       ├── constants/
│       │   └── theme.ts
│       ├── assets/
│       │   ├── icon.png
│       │   ├── splash.png
│       │   └── adaptive-icon.png
│       ├── app.json                    # Expo config
│       ├── metro.config.js
│       ├── tailwind.config.js          # Extends shared config
│       ├── nativewind-env.d.ts
│       ├── babel.config.js
│       ├── tsconfig.json
│       ├── eas.json                    # EAS Build config
│       └── package.json
├── packages/
│   ├── database/                       # Shared — types + Zod schemas
│   ├── schemas/                        # Shared — form schemas + constants
│   ├── types/                          # Shared — TypeScript types
│   └── utils/                          # Shared — utilities
└── package.json                        # Workspace root
```

---

## Navigation Architecture

### Tab Bar (authenticated)

The bottom tab bar adapts based on user role:

**Trainer tabs:**
| Tab | Icon | Screen |
|-----|------|--------|
| Home | Home | Dashboard with stats, quick actions |
| Messages | MessageCircle | Conversations list |
| Bookings | Calendar | Booking calendar/list |
| Clients | Users | Client roster |
| Profile | User | Profile, settings, more menu |

**Trainee tabs:**
| Tab | Icon | Screen |
|-----|------|--------|
| Home | Home | Dashboard with stats, feed |
| Messages | MessageCircle | Conversations list |
| Bookings | Calendar | Upcoming bookings |
| Diary | BookHeart | Diary entries + tracking |
| Profile | User | Profile, settings, more menu |

### Stack Navigation (within tabs)

Each tab has a stack navigator for drill-down screens. The Profile tab includes a "More" menu that links to less-frequently-used screens (analytics, referrals, leaderboards, achievements, etc.) rather than cluttering the tab bar.

### Auth Flow

```
app/_layout.tsx (root)
├── Unauthenticated → (auth)/ group
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
└── Authenticated → (tabs)/ group
    ├── Dashboard
    ├── Messages
    ├── Bookings
    ├── Diary/Clients
    └── Profile + More
```

---

## Backend Changes

The API is largely untouched. Key changes:

### 1. Better Auth Expo Plugin

**File: `apps/api/src/lib/auth.ts`**

Add the `expo()` plugin to the existing Better Auth config:

```typescript
import { expo } from "@better-auth/expo";

export const auth = betterAuth({
  // ... existing config
  plugins: [
    expo(),
  ],
});
```

This enables token-based auth alongside the existing cookie-based auth. Both work simultaneously — web uses cookies, mobile uses bearer tokens.

### 2. Expo Push Token Storage

**Schema change: `packages/database/prisma/schema.prisma`**

Add expo push token field to the existing `PushSubscription` model or create a dedicated model:

```prisma
model ExpoPushToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique  // ExponentPushToken[xxxx]
  deviceId  String?           // For managing multiple devices
  platform  String?           // ios | android
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("expo_push_tokens")
}
```

### 3. Expo Push Notification Service

**New file: `apps/api/src/services/expo-push.service.ts`**

Uses `expo-server-sdk` to send native push notifications. Called alongside the existing `webPushService` in `inAppNotificationService.notify()`:

```typescript
// In inAppNotificationService.notify():
// 1. Save to DB (existing)
// 2. Broadcast via SSE (existing)
// 3. Send web push (existing)
// 4. Send Expo push (NEW)
expoPushService.sendPushNotification(params.userId, params.type, {
  title: params.title,
  body: params.body,
  link: params.link,
}).catch(console.error);
```

### 4. GPS Activity Tracking Endpoint

**New tRPC procedures** for saving GPS-tracked activities:

```typescript
// apps/api/src/routers/activity.router.ts (extend existing)
saveGpsActivity: protectedProcedure
  .input(gpsActivitySchema)
  .mutation(async ({ ctx, input }) => {
    // Save activity with GPS route polyline
    // Create diary entry automatically
    // Calculate distance, pace, elevation
  });
```

### 5. Food Scanning Endpoints

**New tRPC procedures:**

```typescript
// apps/api/src/routers/food.router.ts
scanBarcode: protectedProcedure
  .input(z.object({ barcode: z.string() }))
  .query(async ({ input }) => {
    // Lookup barcode in Open Food Facts API
    // Return nutritional info
  });

recognizeFood: protectedProcedure
  .input(z.object({ imageBase64: z.string() }))
  .mutation(async ({ input }) => {
    // Send to Claude Vision API
    // Return identified food items with estimated nutrition
  });
```

---

## Implementation Phases

### Phase M1: Scaffolding & Auth (Foundation)

**Goal**: Expo app running in monorepo with auth working end-to-end.

**Tasks:**
1. Create Expo app in `apps/mobile` with Expo Router
2. Configure NativeWind v4 with shared Tailwind config
3. Set up React Native Reusables base components (Button, Input, Card, Text)
4. Wire up tRPC client with token-based auth headers
5. Add `@better-auth/expo` plugin to both server and mobile client
6. Build auth screens: Login, Register, Forgot Password, Reset Password
7. Implement auth guard in root layout (redirect to login if unauthenticated)
8. Configure role-based tab navigation (trainer vs trainee tabs)
9. Set up EAS Build for iOS and Android dev builds
10. Test auth flow end-to-end on both platforms

**Key files:**
- `apps/mobile/app/_layout.tsx` — Root layout with providers + auth guard
- `apps/mobile/app/(auth)/_layout.tsx` — Auth stack layout
- `apps/mobile/app/(tabs)/_layout.tsx` — Tab bar with role-based tabs
- `apps/mobile/lib/trpc.ts` — tRPC client with bearer token
- `apps/mobile/lib/auth.ts` — Better Auth Expo client
- `apps/api/src/lib/auth.ts` — Add expo() plugin

**Definition of done**: Can register, login, see role-appropriate tab bar, logout. Sessions persist across app restarts.

---

### Phase M2: Dashboard & Profile

**Goal**: Home dashboard and profile screens functional for both roles.

**Tasks:**
1. Trainer dashboard — stats row, quick actions, recent activity
2. Trainee dashboard — stats summary, upcoming bookings, recent diary
3. Profile viewing — own profile + public trainer/trainee profiles
4. Trainer profile creation/edit flow
5. Trainee profile creation/edit flow
6. Image upload via expo-image-picker (profile photo, cover image)
7. Find a Trainer — search with map (react-native-maps) and list view
8. Trainer public profile with gallery, services, reviews
9. Settings screen — account settings, notification preferences, subscription info

**Screens:**
- `(tabs)/index.tsx` — Dashboard (role-adaptive)
- `(tabs)/profile.tsx` — Profile + settings + "more" menu
- `trainers/index.tsx` — Search with map
- `trainers/[handle].tsx` — Public profile
- `dashboard/settings.tsx` — Full settings

**Key patterns:**
- Pull-to-refresh on all list screens
- Skeleton loaders during data fetching
- Bottom sheets (Sheet component) instead of modals where appropriate
- Platform-adaptive UI (iOS feels iOS-native, Android feels Material-ish)

**Definition of done**: Both roles can view their dashboard, edit their profile, search for trainers, and manage settings.

---

### Phase M3: Messaging & Notifications

**Goal**: Real-time messaging and push notifications.

**Tasks:**
1. Conversations list with unread badges
2. Message thread with real-time updates via SSE
3. Send messages (text)
4. Conversation actions (archive, delete) via swipe gestures or long-press menu
5. SSE connection management (connect on app foreground, disconnect on background)
6. Register Expo push tokens with backend
7. Receive and handle push notifications (foreground + background)
8. Deep linking from notifications to relevant screen
9. Notification preferences screen
10. Badge count on app icon

**SSE setup:**
```typescript
// apps/mobile/lib/sse.ts
import RNEventSource from 'rn-eventsource-reborn';

// Same pattern as web but using the RN polyfill
// Connect when app is in foreground, disconnect on background
// Reconnect with exponential backoff
```

**Push notification flow:**
1. On app launch → request notification permissions
2. Get Expo push token → send to backend via tRPC
3. Backend stores token in `ExpoPushToken` table
4. When notification event occurs → backend sends via both web push AND Expo push
5. On tap → deep link to relevant screen via Expo Router

**Definition of done**: Can send/receive messages in real-time, push notifications arrive when app is backgrounded, tapping notification opens correct screen.

---

### Phase M4: Bookings & Calendar

**Goal**: Full booking flow for both trainers and trainees.

**Tasks:**
1. Trainee: browse trainer availability and book sessions
2. Trainee: view upcoming/past bookings
3. Trainer: view bookings calendar (day/week view)
4. Trainer: manage availability (set working hours, overrides)
5. Booking detail screen (confirm, cancel, reschedule)
6. Video call integration (Daily.co WebView or native SDK)
7. Booking notifications + reminders
8. Trainer: book session for client

**Screens:**
- `(tabs)/bookings.tsx` — Bookings list/calendar
- `bookings/[id].tsx` — Booking detail
- `bookings/[id]/call.tsx` — Video call
- `bookings/book/[trainerId].tsx` — Book a session

**Key pattern**: Calendar views use a React Native calendar library (e.g., `react-native-calendars`) rather than trying to replicate the web calendar.

**Definition of done**: Trainees can book sessions, trainers can manage availability and view their calendar, video calls work.

---

### Phase M5: Trainer Features

**Goal**: Client management, resources, analytics, reviews, referrals.

**Tasks:**
1. Client roster with search and status filters
2. Client detail — notes, assigned plans, goals, diary view
3. Resources library — exercises, recipes, workout plans, meal plans
4. Resource creation/editing forms
5. Onboarding templates and responses
6. Reviews dashboard
7. Analytics dashboard (charts using react-native-chart-kit or victory-native)
8. Referrals page with share link (native share sheet)
9. Connection requests management

**Screens:**
- `(tabs)/diary.tsx` — Becomes "Clients" tab for trainers
- `dashboard/clients/[id].tsx` — Client detail
- `dashboard/resources/index.tsx` — Resources library
- `dashboard/analytics.tsx` — Analytics
- `dashboard/reviews.tsx` — Reviews
- `dashboard/referrals.tsx` — Referrals with native share

**Key pattern**: Referral sharing uses `expo-sharing` / `Share` API to open the native share sheet with the referral link, much more natural than copy-to-clipboard on mobile.

**Definition of done**: Trainers can manage all aspects of their business from the mobile app.

---

### Phase M6: Trainee Features

**Goal**: Diary, goals, plans, social features.

**Tasks:**
1. Diary — daily entries (weight, water, mood, sleep, food, workouts, steps)
2. Diary entry creation with quick-add patterns
3. Goal tracking with progress visualisation
4. My Plans — view assigned workout and meal plans
5. Feed — posts from followed users
6. Create posts (text + photos)
7. Friends — friend requests, friend list
8. Leaderboards
9. Achievements/badges
10. Purchases — order history
11. Trend charts (weight, measurements, nutrition, etc.)

**Screens:**
- `(tabs)/diary.tsx` — Diary for trainees
- `dashboard/goals.tsx` — Goals
- `dashboard/my-plans.tsx` — Assigned plans
- `dashboard/feed.tsx` — Social feed
- `dashboard/friends.tsx` — Friends
- `dashboard/leaderboards.tsx` — Leaderboards
- `dashboard/achievements.tsx` — Badges
- `dashboard/purchases.tsx` — Order history

**Key pattern**: Diary entry is the most-used screen — optimise for speed. Quick-add buttons, swipe between days, minimal taps to log.

**Definition of done**: Trainees have full feature parity with web for tracking, social, and plan viewing.

---

### Phase M7: Payments & Subscription

**Goal**: Subscription management and payment flows.

**Tasks:**
1. Pricing screen showing tiers
2. Subscription checkout via Stripe (WebView to Stripe Checkout)
3. Subscription management (current plan, upgrade/downgrade, cancel)
4. Session payment at booking time (Stripe WebView)
5. Payment history
6. Product storefront browsing
7. Product checkout with cart
8. Stripe Connect onboarding for trainers (WebView)

**Stripe approach**: Use WebView for Stripe Checkout sessions (same URLs as web). The backend creates the checkout session and returns the URL, the mobile app opens it in an in-app browser. This avoids the complexity of native Stripe SDK integration while using the exact same payment flow.

**Definition of done**: Users can subscribe, pay for sessions, and buy products from the mobile app.

---

### Phase M8: Mobile-Only Features

**Goal**: GPS tracking, barcode scanning, AI food recognition.

### 8.1 GPS Activity Tracking

**Tasks:**
1. Start/pause/stop tracking screen with live map
2. Background location tracking via expo-location (foreground service on Android)
3. Route recording (polyline of GPS coordinates)
4. Distance, pace, duration, elevation calculations
5. Activity summary screen with route map
6. Auto-create diary entry on save
7. Activity types: walk, run, cycle, hike, swim (manual for swim)
8. Integration with existing activity/diary system

**Screens:**
- `tracking/index.tsx` — Live tracking with map, controls, stats overlay

**Key considerations:**
- Background location requires `expo-location` with foreground service notification on Android
- Battery optimisation: configurable GPS accuracy (high for running, lower for walking)
- Route smoothing to handle GPS jitter
- Offline support: queue upload if no connection

### 8.2 Barcode Food Scanning

**Tasks:**
1. Camera-based barcode scanner using expo-camera
2. Lookup scanned barcode against Open Food Facts API
3. Display nutritional information
4. Quick-add to diary food entry
5. Manual search fallback if barcode not found
6. Scan history for recently scanned items

**Screens:**
- `scan/index.tsx` — Camera view with barcode overlay
- Inline in diary food entry creation

**API**: Open Food Facts is free and open source. Endpoint: `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`

### 8.3 AI Food Recognition

**Tasks:**
1. Take photo of food via camera or pick from gallery
2. Send image to backend → Claude Vision API
3. Return identified food items with estimated nutritional values
4. User confirms/edits recognised items
5. Quick-add confirmed items to diary

**Flow:**
1. User takes photo of their meal
2. Image uploaded to backend
3. Backend sends to Claude Vision with prompt for food identification + nutrition estimation
4. Returns structured response: `[{ name, calories, protein, carbs, fat, confidence }]`
5. User reviews, adjusts portions, saves to diary

**Key consideration**: Claude Vision responses are estimates — always show confidence level and let users edit values before saving.

**Definition of done**: Users can track outdoor activities with GPS, scan food barcodes, and photograph meals for AI-powered nutritional logging.

---

### Phase M9: Polish & App Store

**Goal**: Production-ready app for App Store and Google Play submission.

**Tasks:**
1. App icon and splash screen design
2. Onboarding flow for first-time users (swipeable intro screens)
3. Deep linking configuration (fitnassist:// scheme + universal links)
4. Offline handling — graceful degradation, cached data, retry queues
5. Error boundaries and crash reporting (Sentry)
6. Performance optimisation — list virtualisation, image caching, lazy loading
7. Accessibility audit — screen reader support, dynamic type, contrast
8. Dark mode support (follow system theme)
9. App Store screenshots and metadata
10. Google Play listing and metadata
11. EAS Build configuration for production
12. EAS Submit for both stores
13. OTA update configuration (expo-updates)
14. App review compliance (Apple/Google guidelines)
15. Privacy policy updates for mobile data collection (location, camera)

**App Store requirements to plan for:**
- Apple: Privacy nutrition labels, App Tracking Transparency if applicable
- Google: Data safety section, target API level compliance
- Both: In-app review prompts (after positive interactions)

**Definition of done**: App approved and live on both App Store and Google Play.

---

## Key Technical Decisions

### Offline Support Strategy

Not building full offline-first (too complex for v1). Instead:
- Cache recent data with TanStack Query's persistence
- Show cached data when offline with "offline" banner
- Queue mutations (messages, diary entries) and retry when online
- GPS tracking works fully offline, syncs when connected

### Image Handling

- Use `expo-image` (not `Image` from RN) for better caching and performance
- Compress images before upload (expo-image-manipulator)
- Progressive loading with blur placeholders

### Deep Linking

```
fitnassist://                          → Dashboard
fitnassist://trainers/{handle}         → Trainer profile
fitnassist://messages/{connectionId}   → Message thread
fitnassist://bookings/{id}             → Booking detail
fitnassist://dashboard/diary           → Diary
```

Also configure universal links (HTTPS) so `fitnassist.co/trainers/handle` opens in the app if installed.

### State Management

Same approach as web — TanStack Query for server state, React context for local UI state (auth, theme). No Redux or Zustand needed.

### Video Calls

Use Daily.co's React Native SDK (`@daily-co/react-native-daily-js`) for native video rather than WebView. This gives better performance, picture-in-picture, and background audio.

---

## Phase Dependencies

```
Phase M1 (Scaffolding & Auth)
    └── Phase M2 (Dashboard & Profile)
    └── Phase M3 (Messaging & Notifications)
            └── Phase M4 (Bookings & Calendar)
            └── Phase M5 (Trainer Features)
            └── Phase M6 (Trainee Features)
                    └── Phase M7 (Payments & Subscription)
                    └── Phase M8 (Mobile-Only Features)
                            └── Phase M9 (Polish & App Store)
```

M2, M3 can run in parallel after M1.
M4, M5, M6 can run in parallel after M3.
M7, M8 can run in parallel after M6.
M9 is the final phase.

## Commands

```bash
# Development
npm run dev:mobile         # Start Expo dev server
npm run dev:api            # Start API (needed for mobile dev)

# Building
npx eas build --platform ios --profile development
npx eas build --platform android --profile development
npx eas build --platform all --profile production

# Submitting
npx eas submit --platform ios
npx eas submit --platform android

# OTA Updates
npx eas update --branch production --message "description"
```

## Environment Variables

Mobile app environment variables are embedded at build time via `app.json` / `app.config.js`:

```javascript
// apps/mobile/app.config.js
export default {
  expo: {
    extra: {
      apiUrl: process.env.API_URL ?? 'http://localhost:3001',
      eas: { projectId: '...' },
    },
  },
};
```

Accessed via `expo-constants`:
```typescript
import Constants from 'expo-constants';
const API_URL = Constants.expoConfig?.extra?.apiUrl;
```
