# Session Payments Plan (Phase 7.3)

## Overview

Enable trainers (ELITE tier) to accept payments for sessions. Trainees pay at booking time via Stripe. Trainers receive payouts to their bank account via Stripe Connect. Automated refunds based on trainer-defined cancellation policies.

## Key Decisions

| Decision | Choice |
|----------|--------|
| Stripe model | Connect with destination charges |
| Platform fee | £0.50 flat per paid session (from trainer's payout) |
| Stripe fees | Absorbed by trainer (deducted from payout) |
| Payment timing | Charge immediately at booking confirmation |
| Refund automation | Based on trainer-defined cancellation policy tiers |
| Free sessions | "First session free" toggle — auto-applied for first-time clients |
| Session pricing | Single price for standard duration (multi-duration later) |
| Rescheduling | No refund — original payment carries to new booking |
| Declined bookings | Full auto-refund |

## Architecture

### Payment Flow

```
Trainee books session
  → Sees price + cancellation policy
  → Clicks "Confirm & Pay"
  → Stripe PaymentIntent created (destination charge to trainer's connected account)
  → Card charged immediately
  → Booking created as PENDING
  → Trainer confirms → booking moves to CONFIRMED
  → Trainer declines → full auto-refund

Trainer books for client
  → Client receives notification with price
  → Client clicks "Confirm & Pay"
  → Same payment flow as above
```

### Refund Flow

```
Cancellation requested
  → Calculate hours until session start
  → Look up trainer's cancellation policy
  → Determine refund amount (full / partial / none)
  → Process Stripe refund automatically
  → Both parties notified of refund amount
```

### Stripe Connect Onboarding

```
Trainer enables payments in settings
  → We create a Stripe Connected Account (Standard)
  → Redirect to Stripe hosted onboarding
  → Trainer enters bank details, verifies identity
  → Stripe redirects back to settings
  → We store connected account ID
  → Payments now enabled
```

## Database Changes

### New Models

```prisma
model SessionPrice {
  id         String         @id @default(cuid())
  trainerId  String         @unique
  amount     Int            // Price in pence (e.g. 5000 = £50.00)
  currency   String         @default("gbp")
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt

  trainer    TrainerProfile @relation(fields: [trainerId], references: [id])
}

model CancellationPolicy {
  id                    String         @id @default(cuid())
  trainerId             String         @unique
  fullRefundHours       Int            @default(48)   // Hours before session for full refund
  partialRefundHours    Int            @default(24)   // Hours before session for partial refund
  partialRefundPercent  Int            @default(50)   // Percentage refunded in partial window
  // Less than partialRefundHours = no refund
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt

  trainer               TrainerProfile @relation(fields: [trainerId], references: [id])
}

model SessionPayment {
  id                    String         @id @default(cuid())
  bookingId             String         @unique
  stripePaymentIntentId String         @unique
  stripeChargeId        String?
  amount                Int            // Amount charged in pence
  platformFee           Int            @default(50)  // £0.50 = 50 pence
  currency              String         @default("gbp")
  status                PaymentStatus  @default(PENDING)
  refundAmount          Int?           // Amount refunded in pence (null = no refund)
  refundReason          String?
  refundedAt            DateTime?
  paidAt                DateTime?
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt

  booking               Booking        @relation(fields: [bookingId], references: [id])
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}
```

### TrainerProfile Changes

```prisma
model TrainerProfile {
  // ... existing fields ...
  paymentsEnabled        Boolean          @default(false)
  stripeConnectedAccountId String?
  stripeOnboardingComplete Boolean         @default(false)
  firstSessionFree       Boolean          @default(false)

  sessionPrice           SessionPrice?
  cancellationPolicy     CancellationPolicy?
}
```

### Booking Changes

```prisma
model Booking {
  // ... existing fields ...
  payment    SessionPayment?
}
```

## Backend Implementation

### 1. Stripe Connect Service (`apps/api/src/services/stripe-connect.service.ts`)

New service for Connected Account operations:

- `createConnectedAccount(trainerId, email)` — Create Standard connected account
- `createOnboardingLink(accountId, returnUrl)` — Generate Stripe hosted onboarding URL
- `createDashboardLink(accountId)` — Generate Stripe Express dashboard link
- `getAccountStatus(accountId)` — Check if onboarding is complete, payouts enabled
- `createPaymentIntent(amount, trainerId, bookingId)` — Create destination charge
- `refundPayment(paymentIntentId, amount?)` — Full or partial refund
- `calculateRefundAmount(booking, cancellationPolicy)` — Determine refund based on policy

### 2. Session Payment Service (`apps/api/src/services/session-payment.service.ts`)

Business logic for session payments:

- `initiatePayment(bookingId, traineeUserId)` — Create PaymentIntent, return client secret
- `confirmPayment(paymentIntentId)` — Called after Stripe confirms payment
- `processCancellationRefund(bookingId, cancelledByUserId)` — Auto-refund based on policy
- `processDeclineRefund(bookingId)` — Full refund when trainer declines
- `isFirstSession(trainerId, traineeUserId)` — Check booking history for first-session-free

### 3. Repositories

**`session-payment.repository.ts`:**
- `create(data)`, `findByBookingId(bookingId)`, `findByPaymentIntentId(id)`, `update(id, data)`

**`session-price.repository.ts`:**
- `upsert(trainerId, amount)`, `findByTrainerId(trainerId)`

**`cancellation-policy.repository.ts`:**
- `upsert(trainerId, data)`, `findByTrainerId(trainerId)`

### 4. Router Changes

**New: `session-payment.router.ts`**
- `createPaymentIntent` — Trainee creates PI for a booking (returns client secret)
- `getPaymentStatus` — Check payment status for a booking

**Updated: `availability.router.ts`**
- `updateSessionPrice` — ELITE-gated, set session price
- `getSessionPrice` — Get trainer's session price
- `updateCancellationPolicy` — ELITE-gated, set cancellation policy
- `getCancellationPolicy` — Get trainer's cancellation policy
- `updatePaymentSettings` — Toggle paymentsEnabled + firstSessionFree
- `getPaymentSettings` — Get current payment settings

**Updated: `booking.router.ts`**
- Modify `create` / `createForClient` — check if payment required, return payment info
- Modify `cancel` — trigger refund calculation
- Modify `decline` — trigger full refund

### 5. Stripe Connect Webhook Events

Add to existing webhook handler:
- `account.updated` — Sync connected account onboarding status
- `payment_intent.succeeded` — Mark SessionPayment as SUCCEEDED
- `payment_intent.payment_failed` — Mark as FAILED, notify both parties
- `charge.refunded` — Update SessionPayment refund fields

### 6. Booking Flow Changes

**Current flow:**
1. Trainee selects date/time/location → Create booking (PENDING)
2. Trainer confirms → CONFIRMED

**New flow (when trainer has payments enabled):**
1. Trainee selects date/time/location → Sees price + cancellation policy
2. Trainee clicks "Confirm & Pay" → Stripe PaymentIntent created
3. Trainee enters card details (Stripe Elements) → Payment charged
4. On payment success → Booking created as PENDING
5. Trainer confirms → CONFIRMED
6. Trainer declines → Full auto-refund

**First session free:**
- Step 2 skipped, no PaymentIntent created
- Booking shows "Free — first session" label

**Trainer-initiated booking:**
- Trainer creates booking → Client sees "Confirm & Pay £50" in notification
- Client opens booking detail → Pays via Stripe Elements
- On payment → Booking confirmed

## Frontend Implementation

### 1. New Packages

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js --workspace=apps/web
```

### 2. Settings Pages

**`SchedulingTab/PaymentSettings.tsx`** (new component in settings):
- Toggle: "Accept session payments" (launches Stripe Connect onboarding if no connected account)
- Session price input (£ amount)
- Toggle: "Offer first session free"
- Cancellation policy form:
  - Full refund window (hours dropdown: 24, 48, 72)
  - Partial refund window (hours dropdown: 12, 24, 48)
  - Partial refund percentage (dropdown: 25%, 50%, 75%)
- "Manage payouts" link → Stripe Express dashboard
- Stripe Connect onboarding status indicator

### 3. Booking Flow Changes

**`BookSessionPage` / `TrainerBookSessionPage`:**
- After confirm step, if trainer has payments enabled:
  - Show price summary + cancellation policy
  - Mount Stripe Elements (PaymentElement)
  - "Confirm & Pay £XX" button
  - On payment success → create booking
- If first session free:
  - Show "Free — your first session with [trainer]" badge
  - Normal "Confirm" button (no payment)

**`BookingDetailPage`:**
- Show payment status (Paid £50, Refunded £25, Free session)
- For trainer-initiated bookings awaiting payment: show "Pay £XX" button with Stripe Elements

**`BookingCard`:**
- Show price badge (£50 or "Free")
- Show refund status if applicable

### 4. API Hooks

**`apps/web/src/api/session-payment/`:**
- `useCreatePaymentIntent(bookingId)` — Returns client secret
- `usePaymentStatus(bookingId)` — Query payment info

**`apps/web/src/api/availability/`** (additions):
- `useSessionPrice()`, `useUpdateSessionPrice()`
- `useCancellationPolicy()`, `useUpdateCancellationPolicy()`
- `usePaymentSettings()`, `useUpdatePaymentSettings()`

### 5. Stripe Connect Onboarding Flow

1. Trainer clicks "Accept session payments" toggle → ON
2. If no connected account: API creates one, returns onboarding link
3. Redirect to Stripe hosted onboarding (new tab)
4. On return: check account status, show completion status
5. Once complete: enable price setting, show "Payouts active" badge

## Cancellation Policy Logic

```typescript
const calculateRefund = (
  sessionStart: Date,
  policy: CancellationPolicy,
  amountPaid: number
): { refundAmount: number; refundPercent: number } => {
  const hoursUntilSession = (sessionStart.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntilSession >= policy.fullRefundHours) {
    return { refundAmount: amountPaid, refundPercent: 100 };
  }
  if (hoursUntilSession >= policy.partialRefundHours) {
    const refund = Math.round(amountPaid * (policy.partialRefundPercent / 100));
    return { refundAmount: refund, refundPercent: policy.partialRefundPercent };
  }
  return { refundAmount: 0, refundPercent: 0 };
};
```

## Email Notifications

Update email templates for:
- **Booking pending (paid)**: "Payment of £50 received. Awaiting trainer confirmation."
- **Booking declined (refund)**: "Your booking was declined. A full refund of £50 has been issued."
- **Booking cancelled (refund)**: "Booking cancelled. Based on the cancellation policy, £25 has been refunded."
- **Booking cancelled (no refund)**: "Booking cancelled. Per the cancellation policy, no refund is applicable."
- **Payment failed**: "Your payment could not be processed. Please update your card details."

## Implementation Order

1. **Schema + migrate** — Add new models and fields
2. **Stripe Connect service** — Account creation, onboarding, status checks
3. **Session pricing + cancellation policy** — Settings CRUD (API + frontend)
4. **Payment flow** — PaymentIntent creation, Stripe Elements, booking integration
5. **Refund automation** — Cancel/decline triggers, policy calculation
6. **First session free** — Detection logic, skip payment flow
7. **Webhook handlers** — payment_intent.succeeded, charge.refunded, account.updated
8. **Email notifications** — Update templates with payment info
9. **Testing** — End-to-end with Stripe test mode

## Security Considerations

- PaymentIntents created server-side only, client receives only the client secret
- Connected account IDs never exposed to frontend
- Webhook signature verification on all Stripe events
- Platform fee enforced server-side (cannot be bypassed)
- Cancellation policy fetched server-side for refund calculation (trainee can't manipulate)
- Amount validation: PaymentIntent amount must match trainer's configured price

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Trainer changes price after booking | Original price honoured (stored on SessionPayment) |
| Trainer disables payments mid-booking | Existing paid bookings unaffected |
| Card declined | Booking not created, trainee prompted to retry |
| Stripe Connect onboarding incomplete | Payments disabled until complete |
| Rescheduled booking | Payment carries over, no refund |
| Double payment attempt | PaymentIntent is idempotent per booking |
| Trainer hasn't set a price | Cannot enable payments without setting price |
| First session + cancellation | Full refund (nothing was charged) |
