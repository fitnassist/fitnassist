# Referral Program Plan (Phase 9.4)

## Overview

Trainer referral program for organic growth. Any trainer can refer other trainers to the platform. When a referred trainer subscribes, the referrer gets 1 month free and the referred trainer gets 20% off their first subscription payment. Leverages existing Stripe subscription infrastructure — no new payment flows needed, just coupons applied at the right moments.

## Design Decisions

1. **Referral code = trainer's handle** — no separate code generation needed. Handles are already unique, URL-friendly, and memorable.
2. **Reward: referrer gets 1 month free** — implemented as a 100% off Stripe coupon (duration: once) applied to their subscription.
3. **Incentive: referred trainer gets 20% off first payment** — implemented as a 20% off Stripe coupon passed via `discounts` in the checkout session.
4. **Activation trigger: `checkout.session.completed` webhook** — fires when the referred trainer's first subscription payment succeeds.
5. **All trainers can refer** — even free-tier trainers. No tier gating.
6. **No self-referrals** — validated at referral creation time.
7. **90-day expiry** — PENDING referrals expire after 90 days via cron job.

## Implementation

### Schema

- `ReferralStatus` enum: `PENDING`, `ACTIVATED`, `EXPIRED`
- `Referral` model: tracks referrer (TrainerProfile), referred user, status, reward flags, expiry
- Notification types: `REFERRAL_SIGNED_UP`, `REFERRAL_ACTIVATED`

### Backend

- **Repository**: `apps/api/src/repositories/referral.repository.ts` — CRUD, pagination, status filtering, expiry
- **Service**: `apps/api/src/services/referral.service.ts` — create referrals, activate on subscription, apply Stripe rewards, stats, expiry
- **Router**: `apps/api/src/routers/referral.router.ts` — `claimReferral` (public), `getStats`, `getHistory`, `getReferralLink` (trainer), `getReferrerInfo` (public)
- **Stripe integration**: Discount coupon injected into checkout sessions for referred users; 100% off coupon applied to referrer's subscription on activation
- **Webhook**: `checkout.session.completed` triggers referral activation
- **Cron**: `POST /api/cron/expire-referrals` expires stale PENDING referrals

### Frontend

- **Registration**: `?ref=handle` query param captured, referral banner shown, referral claimed after signup
- **Dashboard page**: `/dashboard/referrals` with referral link card (copy-to-clipboard), stats grid, paginated history table
- **Nav item**: "Referrals" in trainer sidebar, no tier gating

### Schemas

- `packages/schemas/src/forms/referral.schema.ts` — input schemas, constants (expiry days, discount percentages)

## Flow

1. Trainer shares `fitnassist.co/register?ref=their-handle`
2. New user visits link → sees referral banner with referrer's name and 20% off messaging
3. User registers → `claimReferral` mutation creates PENDING referral
4. Referred user sets up trainer profile → starts trial
5. Referred user subscribes → checkout session includes 20% off coupon
6. Payment succeeds → webhook fires → referral activated → referrer gets 100% off next invoice
7. Both parties notified via in-app notifications
8. Cron expires PENDING referrals after 90 days
