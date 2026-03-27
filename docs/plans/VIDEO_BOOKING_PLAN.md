# Video Call Bookings & Trainer Confirmation Flow

## Overview

Enhance the booking system with trainer confirmation (no more auto-confirm), video call support via Daily.co, trainer-initiated bookings, reschedule tracking, and alternative time suggestions.

---

## Phase 1: Trainer Confirmation Flow + Reschedule

### Step 1.1: Schema Changes (Prisma)

**File: `packages/database/prisma/schema.prisma`**

1. Add `PENDING`, `DECLINED`, `RESCHEDULED` to `BookingStatus` enum
2. Add fields to `Booking`:
   - `initiatedBy String` (userId of creator — determines who needs to confirm)
   - `declineReason String?`
   - `declinedAt DateTime?`
   - `holdExpiresAt DateTime?` (createdAt + 48h)
   - `rescheduledFromId String?` (self-relation for reschedule chain)
   - `rescheduledFrom/rescheduledTo` relations
3. Add `BookingSuggestion` model:
   - id, bookingId, suggestedBy, date, startTime, endTime, status (PENDING/ACCEPTED/DECLINED)
4. Add notification types: `BOOKING_PENDING`, `BOOKING_DECLINED`, `BOOKING_SUGGESTION`, `BOOKING_RESCHEDULED`, `BOOKING_EXPIRED`

### Step 1.2: Schema Updates (Zod)

**File: `packages/schemas/src/forms/booking.schema.ts`**

- `confirmBookingSchema`
- `declineBookingSchema` (with optional reason)
- `rescheduleBookingSchema`
- `suggestAlternativeSchema`
- `respondToSuggestionSchema`

### Step 1.3: Repository Layer

**File: `apps/api/src/repositories/booking.repository.ts`**

- Update `findByTrainerAndDate` — include PENDING in slot-blocking queries
- Update `createWithLock` — conflict check includes PENDING
- Update `findUpcomingByUserId` — include PENDING
- Add `findExpiredPending()` for hold expiry cron
- Support new fields: initiatedBy, holdExpiresAt, rescheduledFromId

**New file: `apps/api/src/repositories/booking-suggestion.repository.ts`**

- create, findByBookingId, findById, update, declineAllForBooking

### Step 1.4: Service Layer

**File: `apps/api/src/services/booking.service.ts`**

- Modify `create` — status PENDING instead of CONFIRMED, set holdExpiresAt (48h), set initiatedBy
- Add `confirm` — PENDING → CONFIRMED (only the other party can confirm)
- Add `decline` — PENDING → DECLINED (with optional reason)
- Modify `cancel` — allow cancelling PENDING bookings too
- Add `reschedule` — mark original as RESCHEDULED, create new PENDING with rescheduledFromId
- Add `suggestAlternative` — validate against real availability, create suggestion
- Add `respondToSuggestion` — accept updates booking time + confirms, decline updates suggestion
- Add `expirePendingBookings` — cron: find expired holds, decline + notify

### Step 1.5: Router Layer

**File: `apps/api/src/routers/booking.router.ts`**

New procedures: confirm, decline, reschedule, suggestAlternative, respondToSuggestion, getSuggestions

### Step 1.6: Hold Expiry Cron

**File: `apps/api/src/routes/cron.ts`**

- `POST /cron/booking-hold-expiry` — run hourly, expire PENDING bookings past holdExpiresAt

### Step 1.7: Email Templates + Notifications

**File: `apps/api/src/lib/email-templates.ts`**

New templates: bookingPending, bookingDeclined, bookingReschedule, bookingSuggestion, bookingHoldExpired

**File: `apps/api/src/services/booking-notification.service.ts`**

Methods for each new state transition.

### Step 1.8: Frontend API Hooks

**File: `apps/web/src/api/booking/index.ts`**

Hooks: useConfirmBooking, useDeclineBooking, useRescheduleBooking, useSuggestAlternative, useRespondToSuggestion, useBookingSuggestions

### Step 1.9: BookingCard Updates

**File: `apps/web/src/pages/dashboard/bookings/components/BookingCard/index.tsx`**

- PENDING/DECLINED/RESCHEDULED status variants
- Confirm/Decline buttons for the confirming party
- "Awaiting confirmation" badge for the initiator
- Suggest alternatives action
- Reschedule option for confirmed bookings
- Reschedule chain link

### Step 1.10: Suggestions UI

**New: `apps/web/src/pages/dashboard/bookings/components/SuggestAlternativeDialog/index.tsx`**

- Reuses DatePicker + SlotPicker from booking wizard
- Lets user pick alternative slots, submits suggestions

**New: `apps/web/src/pages/dashboard/bookings/components/SuggestionsList/index.tsx`**

- Lists suggestions with accept/decline for the responding party

### Step 1.11: Booking Detail Page

**New: `apps/web/src/pages/dashboard/bookings/[id]/index.tsx`**

- Full details, status timeline, suggestions list, reschedule history, actions

---

## Phase 2: Session Types + Video Calls (Daily.co)

### Step 2.1: Schema Changes

**File: `packages/database/prisma/schema.prisma`**

- Add `SessionType` enum: `IN_PERSON | VIDEO_CALL`
- Add to Booking: `sessionType`, `dailyRoomUrl`, `dailyRoomName`
- Add to TrainerProfile: `offersVideoSessions Boolean @default(false)`

### Step 2.2: Daily.co Integration

**New file: `apps/api/src/lib/daily.ts`**

- `createRoom({ name, expiresAt })` — POST to Daily.co API
- `deleteRoom(name)` — DELETE from Daily.co API
- Room name format: `fitnassist-{bookingId}`
- Room expires at session end + 30 min
- Uses `DAILY_API_KEY` env var

### Step 2.3: Service Changes

**File: `apps/api/src/services/booking.service.ts`**

- On confirm: if VIDEO_CALL, create Daily room, store URL
- On cancel: if VIDEO_CALL with room, delete Daily room

### Step 2.4: Notification Updates

- Confirmation/reminder emails include "Join Call" link for video sessions

### Step 2.5: Frontend - Session Type Picker

**New: `apps/web/src/pages/dashboard/bookings/book/components/SessionTypePicker/index.tsx`**

- Card picker: In Person (MapPin icon) / Video Call (Video icon)

### Step 2.6: Booking Wizard Changes

**File: `apps/web/src/pages/dashboard/bookings/book/index.tsx`**

- If trainer offers video: add session type step
- If VIDEO_CALL: skip location step
- Flow: Type → Date → Slot → Location (if in-person) → Confirm

### Step 2.7: BookingCard Changes

- Session type badge (Video/In Person)
- "Join Call" button for VIDEO_CALL + CONFIRMED (15 min before → session end)
- Hide location for video bookings

### Step 2.8: Trainer Settings

- Add "Offers Video Sessions" toggle to trainer booking settings

---

## Phase 3: Trainer-Initiated Bookings (Invites)

### Step 3.1: Service + Router

- `createForClient` — trainer creates PENDING booking for a client
- Client is the confirming party (determined by initiatedBy)
- All Phase 1 flows (confirm, decline, suggest) apply automatically

### Step 3.2: Invite Email

- "Your trainer has scheduled a session" template
- Session details + Accept/Decline/Suggest links

### Step 3.3: Frontend - Trainer Booking Wizard

**New: `apps/web/src/pages/dashboard/bookings/invite/index.tsx`**

- Client picker → Session type → Date → Slot → Location → Confirm
- Reuses all existing booking wizard components

### Step 3.4: Bookings Page Update

- Trainer sees "Schedule Client Session" button
- Can also initiate from client detail page

---

## Key Design Decisions

- **PENDING blocks slots** — prevents double-booking while awaiting confirmation
- **48h hold expiry** — auto-decline via cron if no response
- **initiatedBy determines flow** — whoever creates the booking is NOT the one who confirms
- **Reschedule = RESCHEDULED original + new PENDING** — full audit trail via rescheduledFromId
- **Suggestions from real availability** — slot picker, not free text
- **Daily.co rooms created on CONFIRM only** — no wasted resources on pending/declined bookings
- **Per-trainer video setting** — `offersVideoSessions` on TrainerProfile
