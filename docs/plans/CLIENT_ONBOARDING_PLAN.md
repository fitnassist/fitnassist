# Phase 3.3: Client Onboarding — Implementation Plan

## Context

PTs need a way to onboard new clients when they accept a connection. This means: defining a questionnaire with questions + optional waiver, having the trainee complete it, then the PT reviews and approves/rejects. Until approved, the client sits in an ONBOARDING status rather than ACTIVE.

If a PT has no active template, the current flow is unchanged — client goes straight to ACTIVE.

## Schema Changes

### New enum

```prisma
enum OnboardingStatus {
  PENDING      // Waiting for trainee
  SUBMITTED    // Trainee submitted, awaiting PT review
  APPROVED
  REJECTED
}
```

### Extend existing `ClientStatus` enum

Add `ONBOARDING` as the first value (before ACTIVE).

### New models

**OnboardingTemplate** — PT's reusable questionnaire. Only one can be active per trainer.
- `id`, `trainerId`, `name`, `questions` (JSON), `waiverText` (optional), `isActive`, timestamps
- `questions` JSON shape: `[{ id, type, label, required, options? }]`
- Question types: `SHORT_TEXT`, `LONG_TEXT`, `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `YES_NO`, `NUMBER`

**OnboardingResponse** — A trainee's response to a template, 1:1 with ClientRoster.
- `id`, `templateId`, `clientRosterId` (unique), `answers` (JSON), `waiverSigned`, `waiverSignedAt`, `waiverSignedName`, `status`, `completedAt`, `reviewedAt`, `reviewNotes`, timestamps
- `answers` JSON shape: `[{ questionId, answer }]`

### Relations to add
- `TrainerProfile.onboardingTemplates OnboardingTemplate[]`
- `ClientRoster.onboardingResponse OnboardingResponse?`

## Flow

1. PT creates onboarding template with questions + optional waiver text
2. Connection accepted → if PT has active template → create PENDING response, set client status to ONBOARDING
3. Trainee sees banner on dashboard → clicks through to questionnaire form
4. Trainee fills answers + signs waiver → submits → status becomes SUBMITTED
5. PT sees pending review count → opens client → Onboarding tab → reviews answers → approves or rejects
6. Approved → client status ACTIVE. Rejected → client status INACTIVE + review notes.

## Backend

### Repository: `apps/api/src/repositories/onboarding.repository.ts`

Template CRUD + active template lookup + response CRUD + stats.

### Service: `apps/api/src/services/onboarding.service.ts`

- Template management (create/update/delete, enforce one active)
- `createResponseForConnection(trainerId, clientRosterId)` — called from `contact.service.ts` after accept
- `submitResponse(userId, responseId, data)` — validates answers against template questions
- `reviewResponse(userId, responseId, decision, notes)` — updates response + client roster status
- `getPendingOnboarding(userId)` — trainee's pending items

### Router: `apps/api/src/routers/onboarding.router.ts`

Trainer procedures: `createTemplate`, `getTemplates`, `getTemplate`, `updateTemplate`, `deleteTemplate`, `getActiveTemplate`, `getResponseForClient`, `reviewResponse`, `stats`

Trainee procedures: `myPending`, `submitResponse`

### Integration: `apps/api/src/services/contact.service.ts`

After `clientRosterService.createForConnection()` in `acceptConnection()`, call `onboardingService.createResponseForConnection()`. Wrapped in try/catch so accept doesn't fail if onboarding creation fails.

### Existing file updates

| File | Change |
|------|--------|
| `schema.prisma` | New enum, extend ClientStatus, new models, relations |
| `client-roster.schema.ts` | Add ONBOARDING to status enums |
| `client-roster.repository.ts` | Include `onboardingResponse` in queries, ONBOARDING in stats |
| `contact.service.ts` | Trigger onboarding on accept |
| `_app.ts` | Register onboarding router |
| `schemas/src/index.ts` | Export onboarding schemas |

## Frontend

### API Hooks: `apps/web/src/api/onboarding/`

- `useOnboardingTemplates`, `useOnboardingTemplate`, `useActiveTemplate`
- `useOnboardingTemplateMutations` (create/update/delete)
- `useOnboardingResponse`, `useOnboardingReview`
- `useMyPendingOnboarding`, `useSubmitOnboarding`
- `useOnboardingStats`

### Trainer Pages

**Onboarding management page**: `pages/dashboard/onboarding/index.tsx`
- Two tabs: Templates | Pending Review
- Template list with active indicator, create/edit/delete
- Pending review list showing submitted responses

**Template form page**: `pages/dashboard/onboarding/templates/form/index.tsx`
- Name field, waiver text area, question list
- Question builder: type dropdown (react-select), label input, required toggle, options list for choice types
- Add/remove questions, up/down reorder buttons (no drag-and-drop for MVP)

**Client detail — Onboarding tab**: `pages/dashboard/clients/[id]/components/ClientOnboarding/index.tsx`
- Conditionally shown when client has an onboarding response
- Shows submitted answers read-only, waiver status, approve/reject buttons

### Trainee Pages

**Onboarding form page**: `pages/dashboard/onboarding/[responseId]/index.tsx`
- Renders each question as the appropriate input type
- Waiver section: text display + "I agree" checkbox + typed name field
- Submit button
- After submission: shows "Waiting for review" status

**Dashboard banner**: `components/layouts/OnboardingBanner/index.tsx`
- Queries `myPending`, shows banner per pending item: "Complete onboarding for [Trainer Name]"
- Added to trainee dashboard

### Routes

```
dashboardOnboarding: '/dashboard/onboarding'
dashboardOnboardingTemplateCreate: '/dashboard/onboarding/templates/new'
dashboardOnboardingTemplateEdit: (id) => `/dashboard/onboarding/templates/${id}/edit`
dashboardOnboardingComplete: (responseId) => `/dashboard/onboarding/${responseId}`
```

### Nav + Status Updates

- Add "Onboarding" nav item for trainers (with pending review badge count)
- Add ONBOARDING status badge styling (blue) to client cards + filters
- Update client stats to include onboarding count

## Key Design Decisions

- **ONBOARDING status on ClientRoster**: Adding to the enum is cleaner than a separate boolean. Linear progression: ONBOARDING → ACTIVE → ON_HOLD/INACTIVE.
- **One active template per trainer**: Setting a template active deactivates all others. Avoids confusion.
- **Waiver signature**: MVP uses typed full name + timestamp + "I agree" checkbox. No canvas signature pad.
- **Template deletion**: Cannot delete templates with PENDING/SUBMITTED responses. Must resolve first.
- **Backward compatibility**: No active template = current flow unchanged (client → ACTIVE immediately).

## Implementation Order

1. Schema + `npm run db:generate` + push
2. Zod schemas (`onboarding.schema.ts`, update `client-roster.schema.ts`)
3. Backend: repository → service → router
4. Integration: `contact.service.ts` accept flow
5. Frontend: API hooks
6. Frontend: Trainer template management (list + form pages)
7. Frontend: Client status updates (ONBOARDING badge, filters, stats)
8. Frontend: Trainee onboarding form + dashboard banner
9. Frontend: Trainer review (client detail Onboarding tab + pending review list)
10. Typecheck + end-to-end test

## Verification

- Trainer creates template with mixed question types + waiver → saves correctly
- Trainee connects → onboarding response auto-created, client status = ONBOARDING
- Trainee sees banner → fills form → submits → status = SUBMITTED
- Trainer sees pending count → opens client → reviews answers → approves → client status = ACTIVE
- Rejection flow: client status → INACTIVE, review notes visible
- No active template: connection accept works as before (client = ACTIVE, no onboarding)
- `npx tsc --noEmit` clean
