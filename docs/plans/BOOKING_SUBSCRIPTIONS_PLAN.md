# Phase 6: Booking, Scheduling & Subscriptions

## Context

Trainers need a way to manage their availability and let clients book sessions. Simultaneously, we're introducing paid subscription tiers to monetise the platform. These go together naturally — booking is a Pro feature.

**Key decisions:**
- 4 tiers: FREE, BASIC (£10/mo), PRO (£25/mo), ELITE (£49.99/mo)
- Monthly + Annual billing (annual ~2 months free)
- 30-day Pro trial for new trainers
- Full calendar system with recurring weekly availability, time-off blocking, client booking, and reminders
- Smart travel time using Google Maps Distance Matrix (optional) + manual buffer fallback
- Travel time accounts for PT's previous session location, not just their base
- Session payments deferred to a later phase — booking only for now
- Stripe for subscription billing

---

## Tier Feature Map

| Feature | Free | Basic | Pro | Elite |
|---------|------|-------|-----|-------|
| Basic profile & listing | Yes | Yes | Yes | Yes |
| Connections & messaging | Yes | Yes | Yes | Yes |
| Profile gallery & video intro | - | Yes | Yes | Yes |
| Featured in search | - | Yes | Yes | Yes |
| Client management | - | - | Yes | Yes |
| Resources library | - | - | Yes | Yes |
| Booking & scheduling | - | - | Yes | Yes |
| Priority support | - | - | - | Yes |
| Advanced analytics | - | - | - | Yes |
| Custom branding | - | - | - | Yes |
| Custom subdomain | - | - | - | Yes |

**Pricing (GBP, in pence):**
| Tier | Monthly | Annual |
|------|---------|--------|
| Basic | 1000 (£10) | 10000 (£100) |
| Pro | 2500 (£25) | 25000 (£250) |
| Elite | 4999 (£49.99) | 49900 (£499) |

---

## Schema Changes (All)

### Updated Enum

```prisma
enum SubscriptionTier {
  FREE
  BASIC
  PRO
  ELITE
}
```

### New Enums

```prisma
enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  UNPAID
  INCOMPLETE
}

enum BillingPeriod {
  MONTHLY
  ANNUAL
}

enum BookingStatus {
  CONFIRMED
  CANCELLED_BY_TRAINER
  CANCELLED_BY_CLIENT
  COMPLETED
  NO_SHOW
}

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}
```

### New Models

```prisma
model Subscription {
  id                   String             @id @default(cuid())
  trainerId            String             @unique
  stripeCustomerId     String             @unique
  stripeSubscriptionId String?            @unique
  stripePriceId        String?
  status               SubscriptionStatus @default(TRIALING)
  tier                 SubscriptionTier   @default(FREE)
  billingPeriod        BillingPeriod?
  trialStartDate       DateTime?
  trialEndDate         DateTime?
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean            @default(false)
  canceledAt           DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  trainer              TrainerProfile     @relation(fields: [trainerId], references: [id], onDelete: Cascade)

  @@index([stripeCustomerId])
  @@index([status])
  @@map("subscriptions")
}

model SessionLocation {
  id           String         @id @default(cuid())
  trainerId    String
  /// @zod.string.min(2).max(100)
  name         String
  /// @zod.string.max(200)
  addressLine1 String?
  /// @zod.string.max(100)
  city         String?
  /// @zod.string.max(20)
  postcode     String?
  /// @zod.number.min(-90).max(90)
  latitude     Float?
  /// @zod.number.min(-180).max(180)
  longitude    Float?
  placeId      String?
  isDefault    Boolean        @default(false)
  isActive     Boolean        @default(true)
  sortOrder    Int            @default(0)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  trainer      TrainerProfile @relation(fields: [trainerId], references: [id], onDelete: Cascade)
  bookings     Booking[]

  @@index([trainerId])
  @@map("session_locations")
}

model Availability {
  id                 String         @id @default(cuid())
  trainerId          String
  dayOfWeek          DayOfWeek
  /// @zod.string.regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime          String         // "09:00"
  /// @zod.string.regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime            String         // "17:00"
  /// @zod.number.int().min(15).max(180)
  sessionDurationMin Int            @default(60)
  createdAt          DateTime       @default(now())
  updatedAt          DateTime       @updatedAt

  trainer            TrainerProfile @relation(fields: [trainerId], references: [id], onDelete: Cascade)

  @@index([trainerId, dayOfWeek])
  @@map("availabilities")
}

model AvailabilityOverride {
  id        String         @id @default(cuid())
  trainerId String
  date      DateTime       @db.Date
  isBlocked Boolean        @default(true)
  /// @zod.string.regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime String?
  /// @zod.string.regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime   String?
  /// @zod.string.max(200)
  reason    String?
  createdAt DateTime       @default(now())

  trainer   TrainerProfile @relation(fields: [trainerId], references: [id], onDelete: Cascade)

  @@index([trainerId, date])
  @@map("availability_overrides")
}

model Booking {
  id                 String          @id @default(cuid())
  trainerId          String
  clientRosterId     String
  locationId         String?
  date               DateTime        @db.Date
  /// @zod.string.regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime          String
  /// @zod.string.regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime            String
  /// @zod.number.int().min(15).max(180)
  durationMin        Int
  /// @zod.string.max(200)
  clientAddress      String?
  /// @zod.string.max(20)
  clientPostcode     String?
  clientLatitude     Float?
  clientLongitude    Float?
  status             BookingStatus   @default(CONFIRMED)
  /// @zod.string.max(500)
  cancellationReason String?
  cancelledAt        DateTime?
  reminderSentAt     DateTime?
  /// @zod.string.max(500)
  notes              String?
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  trainer            TrainerProfile  @relation(fields: [trainerId], references: [id], onDelete: Cascade)
  clientRoster       ClientRoster    @relation(fields: [clientRosterId], references: [id], onDelete: Cascade)
  location           SessionLocation? @relation(fields: [locationId], references: [id], onDelete: SetNull)

  @@index([trainerId, date])
  @@index([clientRosterId])
  @@index([date, status])
  @@map("bookings")
}

model TravelTimeCache {
  id              String   @id @default(cuid())
  originLat       Float
  originLng       Float
  destLat         Float
  destLng         Float
  durationSeconds Int
  distanceMeters  Int
  fetchedAt       DateTime @default(now())
  expiresAt       DateTime

  @@unique([originLat, originLng, destLat, destLng])
  @@index([expiresAt])
  @@map("travel_time_cache")
}
```

### Additions to Existing Models

**TrainerProfile** — add fields:
```prisma
  travelBufferMin      Int              @default(15)
  smartTravelEnabled   Boolean          @default(false)
```

**TrainerProfile** — add relations:
```prisma
  subscription         Subscription?
  sessionLocations     SessionLocation[]
  availabilities       Availability[]
  availabilityOverrides AvailabilityOverride[]
  bookings             Booking[]
```

**ClientRoster** — add relation:
```prisma
  bookings             Booking[]
```

**User** — add notification preferences:
```prisma
  emailNotifyBookings          Boolean @default(true)
  emailNotifyBookingReminders  Boolean @default(true)
```

---

## Sub-phase 1: Stripe + Subscription Infrastructure

**Goal:** Backend plumbing — Stripe client, Subscription model, webhooks, feature gating middleware. No UI.

### New files

| File | Purpose |
|------|---------|
| `apps/api/src/lib/stripe.ts` | Stripe client init |
| `apps/api/src/config/features.ts` | Feature → tier mapping + `TIER_HIERARCHY` |
| `apps/api/src/repositories/subscription.repository.ts` | Prisma data access |
| `apps/api/src/services/stripe.service.ts` | Create customer, checkout session, portal session |
| `apps/api/src/services/subscription.service.ts` | Get tier, check access, trial logic |
| `apps/api/src/routers/subscription.router.ts` | tRPC: getCurrentSubscription, createCheckoutSession, createPortalSession |
| `apps/api/src/routes/stripe-webhook.ts` | Express route at `/api/stripe/webhook` (needs raw body) |
| `packages/schemas/src/forms/subscription.schema.ts` | Zod schemas |
| `packages/schemas/src/constants/subscription.constants.ts` | Tier names, prices (shared FE/BE) |
| `apps/web/src/api/subscription/index.ts` | API hooks barrel |
| `apps/web/src/api/subscription/useSubscription.ts` | Get current subscription hook |
| `apps/web/src/hooks/useFeatureAccess/index.ts` | `useFeatureAccess(feature)` → `{ hasAccess, requiredTier, currentTier }` |

### Modified files

| File | Change |
|------|--------|
| `schema.prisma` | Add ELITE to enum, add Subscription model, TrainerProfile fields |
| `apps/api/src/config/env.ts` | Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, 6x `STRIPE_PRICE_ID_*` |
| `apps/api/src/app.ts` | Mount webhook route **before** `express.json()` with `express.raw()` |
| `apps/api/src/routers/_app.ts` | Add subscription router |
| `apps/api/package.json` | Add `stripe` dependency |
| `packages/schemas/src/index.ts` | Export new schemas + constants |

### Key implementation notes

**Feature config:**
```typescript
export const FEATURE_TIER_MAP = {
  gallery: 'BASIC', featuredSearch: 'BASIC', videoIntro: 'BASIC',
  clientManagement: 'PRO', resources: 'PRO', booking: 'PRO',
  advancedAnalytics: 'ELITE', customBranding: 'ELITE', prioritySupport: 'ELITE',
} as const;
export const TIER_HIERARCHY = { FREE: 0, BASIC: 1, PRO: 2, ELITE: 3 } as const;
```

**`requireTier` middleware** — composable with `trainerProcedure`:
```typescript
trainerProcedure.use(requireTier('PRO')).input(...).mutation(...)
```

**Stripe webhook** — must be Express route (not tRPC) for raw body access. Handle events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.trial_will_end`, `invoice.payment_failed`, `invoice.paid`, `checkout.session.completed`.

**Trial:** On trainer signup, create Stripe customer + Subscription with `status: TRIALING`, `tier: PRO`, 30-day window. Stripe fires `customer.subscription.updated` when trial ends.

### Verify
- Stripe webhook receives test events and creates/updates Subscription records
- `requireTier('PRO')` blocks FREE/BASIC trainers
- Trial period tracked correctly
- `useFeatureAccess` returns correct values per tier

---

## Sub-phase 2: Subscription Management UI

**Goal:** Pricing page, settings tab, trial banner, upgrade prompts, retroactive feature gating.

### New files

| File | Purpose |
|------|---------|
| `apps/web/src/pages/pricing/index.tsx` | Public pricing page |
| `apps/web/src/pages/pricing/components/PricingCard/index.tsx` | Tier card |
| `apps/web/src/pages/pricing/components/PricingToggle/index.tsx` | Monthly/Annual toggle |
| `apps/web/src/pages/pricing/components/index.ts` | Barrel |
| `apps/web/src/pages/dashboard/settings/components/SubscriptionTab/index.tsx` | Current plan, manage, cancel |
| `apps/web/src/components/UpgradePrompt/index.tsx` | Reusable "upgrade to unlock" component |
| `apps/web/src/components/TrialBanner/index.tsx` | Trial countdown banner in dashboard header |

### Modified files

| File | Change |
|------|--------|
| `apps/web/src/App.tsx` | Add `/pricing` route |
| `apps/web/src/config/routes.ts` | Add `pricing` route |
| `apps/web/src/pages/dashboard/settings/index.tsx` | Add "Subscription" tab |
| `DashboardLayout/index.tsx` | Show TrialBanner when trialing |

### Retroactive gating

**Backend** — add `requireTier` to mutation procedures on:
- `exercise.router.ts`, `recipe.router.ts`, `workout-plan.router.ts`, `meal-plan.router.ts`, `client-roster.router.ts`, `onboarding.router.ts` → `requireTier('PRO')`
- `gallery.router.ts` mutations → `requireTier('BASIC')`

**Frontend** — wrap gated pages with `useFeatureAccess` check, show `UpgradePrompt` if no access. Keep read/query access so downgraded trainers still see their data.

### Verify
- Pricing page renders with all tiers and toggle
- Subscribe button creates Stripe checkout
- Subscription tab shows plan details and links to Stripe portal
- Trial banner shows countdown
- Gated features show UpgradePrompt for wrong tier
- Backend blocks mutations for wrong tier

---

## Sub-phase 3: Booking Infrastructure

**Goal:** All booking backend — models, availability calculation, travel time, booking CRUD. No UI.

### New files

| File | Purpose |
|------|---------|
| `apps/api/src/lib/distance-matrix.ts` | Google Maps Distance Matrix API wrapper |
| `apps/api/src/repositories/session-location.repository.ts` | Location CRUD |
| `apps/api/src/repositories/availability.repository.ts` | Availability + overrides |
| `apps/api/src/repositories/booking.repository.ts` | Booking CRUD + queries |
| `apps/api/src/repositories/travel-time-cache.repository.ts` | Cache lookup/upsert |
| `apps/api/src/services/session-location.service.ts` | Location business logic |
| `apps/api/src/services/availability.service.ts` | **Core complexity** — slot generation |
| `apps/api/src/services/booking.service.ts` | Book, cancel, validate |
| `apps/api/src/services/travel-time.service.ts` | Manual buffer + Distance Matrix |
| `apps/api/src/routers/session-location.router.ts` | tRPC endpoints |
| `apps/api/src/routers/availability.router.ts` | tRPC endpoints |
| `apps/api/src/routers/booking.router.ts` | tRPC endpoints |
| `packages/schemas/src/forms/session-location.schema.ts` | Zod schemas |
| `packages/schemas/src/forms/availability.schema.ts` | Zod schemas |
| `packages/schemas/src/forms/booking.schema.ts` | Zod schemas |

### Modified files

| File | Change |
|------|--------|
| `schema.prisma` | All booking models + User notification prefs |
| `apps/api/src/routers/_app.ts` | Add 3 new routers |
| `packages/schemas/src/index.ts` | Export new schemas |
| `user.repository.ts` | Add booking notification prefs to select/update |
| `settings.schema.ts` | Add booking notification prefs |

### Available slots algorithm (`availability.service.ts`)

`getAvailableSlots(trainerId, date, durationMin)`:
1. Get day of week for `date`
2. Fetch `Availability` records for that trainer + day
3. Check `AvailabilityOverride` — if `isBlocked=true`, return empty
4. Fetch confirmed `Booking` records for that date
5. Generate candidate slots at `sessionDurationMin` intervals within each availability window
6. For each candidate, check:
   - No overlap with existing bookings
   - Sufficient travel time from previous booking's **actual location** to this slot's location
   - Sufficient travel time from this slot to next booking's location

### Travel time logic (`travel-time.service.ts`)

- If `smartTravelEnabled = false`: flat `travelBufferMin` between sessions
- If `smartTravelEnabled = true`:
  1. Get previous booking's location (lat/lng from its SessionLocation or clientLatitude/clientLongitude)
  2. Round lat/lng to 3 decimals for cache key (~100m precision)
  3. Check `TravelTimeCache` (where `expiresAt > now`)
  4. On miss: call Google Maps Distance Matrix API, cache with 7-day expiry
  5. Slot available if `prevBookingEnd + travelSeconds <= slotStart`

### Race condition prevention

Use Prisma transaction when creating bookings — re-query available slots inside the transaction to prevent double-booking.

### Verify
- Session locations CRUD works
- Weekly availability CRUD works
- Date overrides work (blocking + extra availability)
- `getAvailableSlots` returns correct slots considering bookings + travel
- Booking creation validates and prevents double-booking
- Travel time cache works (manual + Distance Matrix)

---

## Sub-phase 4: PT Scheduling UI

**Goal:** Trainer-facing UI split into two places:
- **Settings > Scheduling tab** — configuration that rarely changes (availability hours, locations, travel settings, date overrides)
- **Dashboard > Bookings page** — operational view trainers check regularly (calendar, manage bookings)

### New files

| File | Purpose |
|------|---------|
| `apps/web/src/api/session-location/` | Hooks + barrel |
| `apps/web/src/api/availability/` | Hooks + barrel |
| `apps/web/src/api/booking/` | Hooks + barrel |
| **Settings components (configuration):** | |
| `settings/components/SchedulingTab/index.tsx` | Settings tab container with sub-sections |
| `settings/components/SchedulingTab/WeeklyScheduleBuilder.tsx` | Visual weekly grid for availability hours |
| `settings/components/SchedulingTab/SessionLocationList.tsx` | Location CRUD list with Google Places |
| `settings/components/SchedulingTab/TravelSettings.tsx` | Buffer select + smart travel toggle |
| `settings/components/SchedulingTab/DateOverrides.tsx` | Calendar for blocking/unblocking dates |
| **Bookings page (operational):** | |
| `apps/web/src/pages/dashboard/bookings/index.tsx` | Trainer bookings page (calendar + list view) |
| `bookings/components/BookingCalendar/index.tsx` | Calendar view of bookings |
| `bookings/components/BookingCard/index.tsx` | Booking detail card with actions |
| `bookings/components/index.ts` | Barrel |

### Modified files

| File | Change |
|------|--------|
| `apps/web/src/App.tsx` | Add `/dashboard/bookings` route (shared by trainer + trainee in sub-phase 5) |
| `apps/web/src/config/routes.ts` | Add route constant |
| `apps/web/src/pages/dashboard/settings/index.tsx` | Add "Scheduling" tab (trainer only, PRO+) |
| `DashboardLayout/hooks/useNavItems.tsx` | Add "Bookings" nav for PRO+ trainers |

### Verify
- Settings > Scheduling tab: can add/edit/remove session locations
- Settings > Scheduling tab: can set weekly availability visually
- Settings > Scheduling tab: can block off dates
- Settings > Scheduling tab: can configure travel settings
- Bookings page: can view bookings in calendar
- Bookings page: can cancel bookings

---

## Sub-phase 5: Client Booking UI

**Goal:** Client-facing booking flow — browse slots, book, view/manage bookings.

### New files

| File | Purpose |
|------|---------|
| `bookings/components/BookingList/index.tsx` | Upcoming + past bookings |
| `bookings/components/BookingDetailCard/index.tsx` | Single booking with cancel |
| `bookings/book/index.tsx` | Multi-step booking flow |
| `bookings/book/components/DatePicker/index.tsx` | Calendar date selector |
| `bookings/book/components/SlotPicker/index.tsx` | Available time slots |
| `bookings/book/components/LocationPicker/index.tsx` | Choose/enter location |
| `bookings/book/components/BookingConfirmation/index.tsx` | Review + confirm |

### Modified files

| File | Change |
|------|--------|
| `apps/web/src/App.tsx` | Add `/dashboard/bookings/book/:trainerId` route |
| `apps/web/src/config/routes.ts` | Add route constants |
| `apps/web/src/pages/dashboard/bookings/index.tsx` | Add trainee view (role-conditional rendering) |
| `DashboardLayout/hooks/useNavItems.tsx` | Add "Bookings" nav for trainees |

### Booking flow
1. Select date (only dates with availability shown)
2. Select time slot
3. Select/enter location (based on trainer's travel option)
4. Review and confirm

### Verify
- Client can browse available dates and slots
- Client can book a session with location selection
- Client can view upcoming/past bookings
- Client can cancel a booking
- Travel time correctly affects available slots
- Double-booking prevented

---

## Sub-phase 6: Booking Notifications

**Goal:** Email notifications for booking lifecycle + daily reminder cron.

### New files

| File | Purpose |
|------|---------|
| `apps/api/src/services/booking-notification.service.ts` | All notification logic |
| `.github/workflows/booking-reminders.yml` | Daily cron at 7am UTC |

### Modified files

| File | Change |
|------|--------|
| `apps/api/src/lib/email-templates.ts` | Add `bookingConfirmation`, `bookingReminder`, `bookingCancellation` templates |
| `apps/api/src/routes/cron.ts` | Add `/booking-reminders` endpoint |
| `apps/api/src/services/booking.service.ts` | Call notification service after create/cancel |
| `NotificationsTab/index.tsx` | Add booking notification toggles |

### Email templates
- **Confirmation** (both parties): date, time, location, name
- **24hr reminder** (both parties): same + notes
- **Cancellation** (other party): who cancelled, reason, link to rebook

### Reminder cron
Query bookings where `date = tomorrow`, `status = CONFIRMED`, `reminderSentAt IS NULL`. Send reminder, set `reminderSentAt`. Idempotent — safe to re-run.

### Verify
- Confirmation emails sent on booking creation
- Cancellation emails sent correctly
- Reminder cron sends once, not duplicated
- Notification preferences respected

---

## Cross-Cutting Concerns

- **SSE**: Emit booking events via existing SSE infrastructure so both parties see live updates
- **Cache invalidation**: Every mutation invalidates affected queries (available slots, booking lists)
- **ConfirmDialog**: Use existing component for cancellation (never `window.confirm()`)
- **react-select**: Use `Select` from `@/components/ui` for dropdowns (travel buffer, etc.)

---

## Implementation Order

1. Sub-phase 1: Stripe + Subscription Infrastructure
2. Sub-phase 2: Subscription Management UI
3. Sub-phase 3: Booking Infrastructure
4. Sub-phase 4: PT Scheduling UI
5. Sub-phase 5: Client Booking UI
6. Sub-phase 6: Booking Notifications

Each sub-phase is independently shippable and verifiable.
