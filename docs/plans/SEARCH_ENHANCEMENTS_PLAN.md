# Search Enhancements Implementation Plan

## Overview

Improve the "Find a Trainer" search with additional filters, sorting options, and new schema fields. Currently the search supports location + radius, services, and text search only. This adds qualifications, travel option, price range, availability, and sorting.

## Current State

**Search filters:**
- Location (Google Places Autocomplete + radius: 5/10/15/25/50 miles)
- Services (16 checkboxes, `hasSome` match)
- Text search on displayName + bio

**Sort:** Distance only (when location provided), otherwise `createdAt desc`

**UI:** SearchBar with location input + collapsible filter panel (radius buttons + service checkboxes). Split-screen: trainer list | map.

**Schema fields available but not used in search:** `qualifications`, `travelOption`
**Not in schema yet:** `hourlyRateMin`, `hourlyRateMax`, `acceptingClients`
**Not tracked yet:** `lastActiveAt` on User

## Changes Required

### 1. Database Schema

Add to `TrainerProfile` in `packages/database/prisma/schema.prisma`:

```prisma
model TrainerProfile {
  // ... existing fields ...

  /// @zod.number.int().min(0, "Rate must be a positive number").optional()
  hourlyRateMin    Int?             // Minimum hourly rate in pence (e.g., 2500 = £25)
  /// @zod.number.int().min(0, "Rate must be a positive number").optional()
  hourlyRateMax    Int?             // Maximum hourly rate in pence (e.g., 5000 = £50)
  acceptingClients Boolean          @default(true)
}
```

Add to `User` model:

```prisma
model User {
  // ... existing fields ...
  lastActiveAt     DateTime?
}
```

**Why pence for rates:** Avoids floating point issues, consistent with Stripe (which uses smallest currency unit).

**Migration notes:**
- `hourlyRateMin`/`hourlyRateMax` nullable — existing trainers won't have them set
- `acceptingClients` defaults to `true` — all existing trainers are "accepting" by default
- `lastActiveAt` nullable — backfill existing users with `updatedAt` value in migration

### 2. Track Last Active

Update the tRPC context or a middleware to set `lastActiveAt` on each authenticated request.

**File:** `apps/api/src/lib/trpc.ts` (or middleware)

On every authenticated request, update `user.lastActiveAt = new Date()`. Throttle to at most once per 5 minutes to avoid excessive writes (check if current value is older than 5 min before updating).

### 3. Backend — Search Params

**File:** `packages/schemas/src/forms/trainer.schema.ts`

Add to `trainerSearchSchema`:

```typescript
qualifications: z.array(z.string()).optional(),
travelOption: z.enum(['CLIENT_TRAVELS', 'TRAINER_TRAVELS', 'BOTH']).optional(),
minRate: z.number().int().min(0).optional(),   // pence
maxRate: z.number().int().min(0).optional(),   // pence
acceptingClients: z.boolean().optional(),
sortBy: z.enum(['distance', 'recently_active', 'newest', 'price_low', 'price_high']).default('distance'),
```

### 4. Backend — Repository

**File:** `apps/api/src/repositories/trainer.repository.ts`

Update `TrainerSearchParams` interface and `search()` method:

- **Qualifications filter:** `qualifications: { hasSome: qualifications }` (same pattern as services)
- **Travel option filter:** `travelOption: travelOption` (exact match) — but if user selects "TRAINER_TRAVELS", also include "BOTH" trainers. If "CLIENT_TRAVELS", also include "BOTH".
- **Price range filter:** `hourlyRateMin >= minRate AND hourlyRateMax <= maxRate` (trainers whose rate range falls within the user's filter). Trainers with no rate set should be excluded when price filter is active.
- **Accepting clients filter:** `acceptingClients: true` when filter is on
- **Sort options:**
  - `distance` — current behaviour (requires location)
  - `recently_active` — join to User, order by `lastActiveAt desc nulls last`
  - `newest` — order by `createdAt desc`
  - `price_low` — order by `hourlyRateMin asc nulls last`
  - `price_high` — order by `hourlyRateMax desc nulls last`

**Index additions** in schema:

```prisma
@@index([acceptingClients])
@@index([hourlyRateMin])
@@index([hourlyRateMax])
```

### 5. Frontend — SearchBar

**File:** `apps/web/src/pages/trainers/components/SearchBar.tsx`

Add filter sections to the collapsible panel:

1. **Qualifications** — Checkbox grid (same layout as services), grouped by region (UK / International)
2. **Travel option** — Button group: "Any" | "Studio/Gym" | "Mobile" | "Flexible"
3. **Price range** — Two number inputs: "Min £" and "Max £" (display in pounds, convert to pence for API)
4. **Accepting clients** — Toggle/checkbox: "Only show trainers accepting new clients"

Update `activeFilterCount` to include new filters.
Update `handleClearFilters` to reset new filters.

### 6. Frontend — Sort Control

**File:** `apps/web/src/pages/trainers/components/TrainerList.tsx`

Add a sort dropdown above the results list:

```
Sort by: [Distance ▼]
Options: Distance | Recently Active | Newest | Price (Low-High) | Price (High-Low)
```

- "Distance" only available when location is set; default to "Newest" when no location
- Use a `Select` component from shadcn/ui

### 7. Frontend — Page State

**File:** `apps/web/src/pages/trainers/index.tsx`

Add state for new filters + sort, pass to SearchBar and TrainerList. Persist to URL search params (same pattern as existing filters).

### 8. Frontend — Price Display

**File:** `apps/web/src/pages/trainers/components/TrainerList.tsx`

Show price range on trainer cards when set: "£25 - £50/hr" or "From £25/hr" (if only min set).

### 9. PT Profile Edit — New Fields

**File:** `apps/web/src/pages/trainer/profile/edit/components/tabs/SettingsTab.tsx` (or new tab)

Add fields for PTs to set:
- Hourly rate range (min/max, input in pounds)
- Accepting clients toggle

These could go in the existing Settings tab or the Basic Info tab — wherever makes most sense.

### 10. Public Profile — Display

Show price range and availability status on the public trainer profile page.

## File Summary

### Modified Files

| File | Changes |
|------|---------|
| `packages/database/prisma/schema.prisma` | Add `hourlyRateMin`, `hourlyRateMax`, `acceptingClients` to TrainerProfile; `lastActiveAt` to User |
| `packages/schemas/src/forms/trainer.schema.ts` | Add new search params + update profile schemas |
| `apps/api/src/repositories/trainer.repository.ts` | New filters + sort options in search |
| `apps/api/src/lib/trpc.ts` | Throttled `lastActiveAt` update on auth requests |
| `apps/web/src/pages/trainers/index.tsx` | New filter/sort state + URL params |
| `apps/web/src/pages/trainers/components/SearchBar.tsx` | Qualifications, travel option, price range, accepting clients filters |
| `apps/web/src/pages/trainers/components/TrainerList.tsx` | Sort dropdown + price display on cards |
| `apps/web/src/pages/trainer/profile/edit/components/tabs/SettingsTab.tsx` | Rate + accepting clients fields |
| `apps/web/src/pages/trainer/public/` | Display price + availability |

### No New Files

All changes fit within existing files.

## Implementation Order

1. Schema changes + migration (`hourlyRateMin`, `hourlyRateMax`, `acceptingClients`, `lastActiveAt`)
2. `lastActiveAt` tracking middleware
3. Backend search params + repository filters/sorting
4. SearchBar UI — new filter sections
5. TrainerList — sort dropdown + price display
6. Page state + URL params wiring
7. PT profile edit — rate + accepting clients fields
8. Public profile — display new fields

## Notes

- **Ratings/reviews:** Not included in this plan. This is its own feature that should get a separate plan — involves a new `Review` model, moderation considerations, aggregate rating calculation, and UI for both submitting and displaying reviews. Add to Phase 2 or 3 backlog.
- Price filter UX: when no location is provided, default sort should be "Newest" not "Distance"
- Travel option filter logic: selecting "Mobile" should also show "Flexible" trainers (they do both)
- Trainers with no price set should still appear in unfiltered results, just excluded when price filter is active

## Verification

- `npm run db:generate` — no schema errors
- `npx tsc --noEmit` — no type errors
- Manual test: search with each filter individually and in combination
- Manual test: each sort option produces correct ordering
- Manual test: PT can set rate + availability in profile edit
- Manual test: price + availability shown on public profile and search cards
