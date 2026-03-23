# Phase 3: Client Management — Implementation Plan

## Overview

Give PTs tools to manage their clients professionally through the platform. This phase has 4 sub-features built incrementally:

1. **3.1 Client Roster** — view clients, status tracking, timestamped note entries
2. **3.2 Resources Library** — exercises, recipes, workout/meal plans, assign to clients
3. **3.3 Client Onboarding** — questionnaires, waivers, approval
4. **3.4 Client Progress Tracking** — view stats, assign goals, track completion

This plan details 3.1 fully, with architectural notes for 3.2-3.4 so schema decisions account for future needs.

---

## 3.1 Client Roster

### Current State

- Trainer's "My Contacts" page shows accepted connections as a flat list
- Each connection shows name, avatar, and "Message" / "View Profile" buttons
- No status tracking, notes, or client management features
- The `ContactRequest` model tracks the connection but has no roster-specific fields
- Trainee profiles exist with body metrics, fitness goals, experience level

### Approach

Create a dedicated "Clients" page for trainers (separate from existing "My Contacts" which serves both user types). This gives trainers a professional client management view while keeping "My Contacts" as the simpler contact list for trainees.

### Database Schema

Add a `ClientRoster` model that sits on top of the existing connection:

```prisma
model ClientRoster {
  id             String        @id @default(cuid())
  trainerId      String
  connectionId   String        @unique

  // Client status
  status         ClientStatus  @default(ACTIVE)

  // PT's private notes about this client
  notes          String?       @db.Text

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  // Relations
  trainer        TrainerProfile @relation(fields: [trainerId], references: [id], onDelete: Cascade)
  connection     ContactRequest @relation(fields: [connectionId], references: [id], onDelete: Cascade)

  @@unique([trainerId, connectionId])
  @@index([trainerId])
  @@index([status])
  @@map("client_roster")
}

enum ClientStatus {
  ACTIVE
  INACTIVE
  ON_HOLD
}
```

**Why a separate model vs extending ContactRequest:**
- ContactRequest is a shared model (trainees see it too). Roster data is trainer-private.
- Notes, status, and future fields (assigned resources, onboarding state) are PT-only concerns.
- Clean separation: ContactRequest = connection lifecycle, ClientRoster = client management.

**Auto-creation:** When a trainer accepts a connection request, automatically create a `ClientRoster` entry with `ACTIVE` status. This means every accepted connection gets a roster entry.

Also add the relation to `TrainerProfile`:

```prisma
model TrainerProfile {
  // ... existing
  clientRoster     ClientRoster[]
}

model ContactRequest {
  // ... existing
  clientRoster     ClientRoster?
}
```

### Backend

#### Repository: `apps/api/src/repositories/client-roster.repository.ts`

```
- findByTrainerId(trainerId, filters?) → paginated list with connection + trainee profile data
- findById(id) → single roster entry with full relations
- updateStatus(id, status)
- updateNotes(id, notes)
- getCountsByStatus(trainerId) → { active: N, inactive: N, onHold: N }
```

**Query shape for the list:**
```typescript
include: {
  connection: {
    include: {
      sender: {
        include: { traineeProfile: true }
      },
      _count: { select: { messages: true } }
    }
  }
}
```

This gives us: client name, email, avatar, trainee profile (goals, metrics), message count, last message date — all in one query.

#### Service: `apps/api/src/services/client-roster.service.ts`

```
- getClients(userId, filters?) → paginated client list
- getClient(userId, clientId) → single client detail
- updateStatus(userId, clientId, status)
- updateNotes(userId, clientId, notes)
- getStats(userId) → counts by status
```

All methods verify the trainer owns the roster entry.

#### Router: `apps/api/src/routers/client-roster.router.ts`

```
- clientRoster.list → trainerProcedure, input: { status?, search?, page, limit }
- clientRoster.get → trainerProcedure, input: { id }
- clientRoster.updateStatus → trainerProcedure, input: { id, status }
- clientRoster.updateNotes → trainerProcedure, input: { id, notes }
- clientRoster.stats → trainerProcedure
```

#### Schema: `packages/schemas/src/forms/client-roster.schema.ts`

```typescript
export const clientRosterListSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_HOLD']).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export const updateClientStatusSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_HOLD']),
});

export const updateClientNotesSchema = z.object({
  id: z.string().cuid(),
  notes: z.string().max(5000).optional().nullable(),
});
```

#### Auto-create on connection accept

Update `apps/api/src/services/contact.service.ts` → `acceptConnection()`:
After accepting the connection, create a `ClientRoster` entry for the trainer.

### Frontend

#### New route: `/dashboard/clients`

Add to `apps/web/src/config/routes.ts`:
```typescript
dashboardClients: '/dashboard/clients'
dashboardClientDetail: (id: string) => `/dashboard/clients/${id}`
```

#### Navigation

Update `apps/web/src/components/layouts/DashboardLayout/hooks/useNavItems.tsx`:
Add "Clients" nav item for trainers, between Messages and My Contacts.

#### Clients List Page: `apps/web/src/pages/dashboard/clients/index.tsx`

Layout using `PageLayout` component:
- Header: "Clients" with stats badges (Active: N, On Hold: N, Inactive: N)
- Filter bar: status filter (react-select), search input (name search)
- Client cards in a list

**Client card shows:**
- Avatar + name
- Status badge (green=active, amber=on hold, grey=inactive)
- Trainee profile summary (goals, experience level) if available
- Last message date
- Quick actions: Message, View Profile, Change Status

#### Client Detail Page: `apps/web/src/pages/dashboard/clients/[id]/index.tsx`

Tabbed layout:
- **Overview tab**: Client info (from trainee profile), connection date, status with change dropdown
- **Notes tab**: Rich text area for PT's private notes, auto-save on blur
- **Messages tab**: Link/redirect to existing message thread (reuse, don't rebuild)

#### API hooks: `apps/web/src/api/client-roster/`

```
- useClients(filters) → list query
- useClient(id) → detail query
- useUpdateClientStatus() → mutation
- useUpdateClientNotes() → mutation
- useClientStats() → stats query
```

### File Summary

#### New Files

| File | Purpose |
|------|---------|
| `packages/schemas/src/forms/client-roster.schema.ts` | Validation schemas |
| `apps/api/src/repositories/client-roster.repository.ts` | Data access |
| `apps/api/src/services/client-roster.service.ts` | Business logic |
| `apps/api/src/routers/client-roster.router.ts` | tRPC router |
| `apps/web/src/api/client-roster/useClients.ts` | List hook |
| `apps/web/src/api/client-roster/useClient.ts` | Detail hook |
| `apps/web/src/api/client-roster/useClientMutations.ts` | Mutation hooks |
| `apps/web/src/api/client-roster/useClientStats.ts` | Stats hook |
| `apps/web/src/api/client-roster/index.ts` | Barrel export |
| `apps/web/src/pages/dashboard/clients/index.tsx` | Clients list page |
| `apps/web/src/pages/dashboard/clients/components/ClientCard/index.tsx` | Client card component |
| `apps/web/src/pages/dashboard/clients/components/ClientFilters/index.tsx` | Filter bar |
| `apps/web/src/pages/dashboard/clients/components/index.ts` | Barrel export |
| `apps/web/src/pages/dashboard/clients/hooks/useClientPage.ts` | Page state hook |
| `apps/web/src/pages/dashboard/clients/hooks/index.ts` | Barrel export |
| `apps/web/src/pages/dashboard/clients/[id]/index.tsx` | Client detail page |
| `apps/web/src/pages/dashboard/clients/[id]/components/ClientOverview/index.tsx` | Overview tab |
| `apps/web/src/pages/dashboard/clients/[id]/components/ClientNotes/index.tsx` | Notes tab |
| `apps/web/src/pages/dashboard/clients/[id]/components/index.ts` | Barrel export |

#### Modified Files

| File | Changes |
|------|---------|
| `packages/database/prisma/schema.prisma` | Add ClientRoster model, ClientStatus enum, relations |
| `packages/schemas/src/index.ts` | Export client-roster schemas |
| `apps/api/src/routers/_app.ts` | Register clientRoster router |
| `apps/api/src/services/contact.service.ts` | Auto-create roster entry on accept |
| `apps/web/src/config/routes.ts` | Add client routes |
| `apps/web/src/App.tsx` | Add client page routes |
| `apps/web/src/components/layouts/DashboardLayout/hooks/useNavItems.tsx` | Add Clients nav item |

### Implementation Order

1. Schema + migration (ClientRoster model)
2. Schemas package (validation)
3. Repository + service + router
4. Auto-create on connection accept
5. API hooks
6. Nav item + routes
7. Clients list page + components
8. Client detail page + tabs

### Verification

- `npm run db:generate` — no schema errors
- `npx tsc --noEmit` — no type errors
- Accept a connection → verify ClientRoster entry created
- Clients page shows all accepted connections with correct status
- Status changes persist and filter correctly
- Notes save and load correctly
- Search filters by client name

---

## 3.2 Resources Library (Outline)

**Goal:** PTs create and manage exercises, recipes, workout plans, and meal plans. Assign resources to specific clients.

### Key Schema Models

```prisma
model Exercise {
  id           String         @id @default(cuid())
  trainerId    String
  name         String
  description  String?        @db.Text
  videoUrl     String?        // External link (YouTube, Vimeo, etc.)
  videoUploadUrl String?      // Uploaded video via Cloudinary
  imageUrl     String?
  muscleGroups String[]
  equipment    String[]
  difficulty   ExperienceLevel?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  trainer      TrainerProfile @relation(...)
  workoutExercises WorkoutExercise[]

  @@index([trainerId])
  @@map("exercises")
}

model Recipe {
  id           String         @id @default(cuid())
  trainerId    String
  name         String
  description  String?        @db.Text
  ingredients  Json           // [{name, quantity, unit}]
  instructions String         @db.Text
  imageUrl     String?
  calories     Int?
  protein      Float?
  carbs        Float?
  fat          Float?
  prepTime     Int?           // minutes
  cookTime     Int?           // minutes
  tags         String[]
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  trainer      TrainerProfile @relation(...)
  mealPlanRecipes MealPlanRecipe[]

  @@index([trainerId])
  @@map("recipes")
}

model WorkoutPlan {
  id           String         @id @default(cuid())
  trainerId    String
  name         String
  description  String?
  exercises    WorkoutExercise[]
  assignments  ResourceAssignment[]

  trainer      TrainerProfile @relation(...)
  @@map("workout_plans")
}

model WorkoutExercise {
  id           String       @id @default(cuid())
  workoutPlanId String
  exerciseId   String
  sets         Int?
  reps         String?      // "8-12" or "to failure"
  restSeconds  Int?
  sortOrder    Int          @default(0)
  notes        String?

  workoutPlan  WorkoutPlan  @relation(...)
  exercise     Exercise     @relation(...)
  @@map("workout_exercises")
}

model MealPlan {
  id           String         @id @default(cuid())
  trainerId    String
  name         String
  description  String?
  recipes      MealPlanRecipe[]
  assignments  ResourceAssignment[]

  trainer      TrainerProfile @relation(...)
  @@map("meal_plans")
}

model MealPlanRecipe {
  id           String     @id @default(cuid())
  mealPlanId   String
  recipeId     String
  dayOfWeek    Int?       // 0-6 (Mon-Sun)
  mealType     String?    // breakfast, lunch, dinner, snack
  sortOrder    Int        @default(0)

  mealPlan     MealPlan   @relation(...)
  recipe       Recipe     @relation(...)
  @@map("meal_plan_recipes")
}

model ResourceAssignment {
  id           String     @id @default(cuid())
  trainerId    String
  clientRosterId String
  resourceType String     // 'workout_plan' | 'meal_plan'
  resourceId   String
  assignedAt   DateTime   @default(now())
  notes        String?

  trainer      TrainerProfile @relation(...)
  clientRoster ClientRoster   @relation(...)
  @@map("resource_assignments")
}
```

**Note on exercise videos:** The `Exercise` model has both `videoUrl` (external link — YouTube, Vimeo, any URL) and `videoUploadUrl` (direct upload via Cloudinary). The UI should let PTs paste a link OR upload a file, not force one or the other.

### Frontend Pages

- `/dashboard/resources` — tabbed view: Exercises | Recipes | Workout Plans | Meal Plans
- `/dashboard/resources/exercises/new` — create/edit exercise form
- `/dashboard/resources/recipes/new` — create/edit recipe form
- `/dashboard/resources/workout-plans/new` — workout plan builder (drag exercises)
- `/dashboard/resources/meal-plans/new` — meal plan builder (drag recipes)
- Assignment modal on client detail page

---

## 3.3 Client Onboarding (Outline)

**Goal:** PTs define onboarding questionnaires and waivers. When a connection is accepted, the trainee completes onboarding before the PT "activates" them.

### Key Schema Models

```prisma
model OnboardingTemplate {
  id           String         @id @default(cuid())
  trainerId    String
  name         String
  questions    Json           // [{type, label, required, options?}]
  waiverText   String?        @db.Text
  isActive     Boolean        @default(true)

  trainer      TrainerProfile @relation(...)
  responses    OnboardingResponse[]
  @@map("onboarding_templates")
}

model OnboardingResponse {
  id           String             @id @default(cuid())
  templateId   String
  clientRosterId String
  answers      Json               // [{questionId, answer}]
  waiverSigned Boolean            @default(false)
  waiverSignedAt DateTime?
  status       OnboardingStatus   @default(PENDING)
  completedAt  DateTime?
  reviewedAt   DateTime?

  template     OnboardingTemplate @relation(...)
  clientRoster ClientRoster       @relation(...)
  @@map("onboarding_responses")
}

enum OnboardingStatus {
  PENDING      // Waiting for trainee to complete
  SUBMITTED    // Trainee submitted, awaiting PT review
  APPROVED     // PT approved
  REJECTED     // PT rejected
}
```

### Flow

1. PT creates onboarding template with questions + optional waiver
2. When connection accepted, if PT has active template, trainee gets prompted
3. Trainee fills out questionnaire and signs waiver
4. PT reviews and approves/rejects
5. Client roster status updates based on approval

---

## 3.4 Client Progress Tracking (Outline)

**Goal:** PTs view trainee stats and assign goals.

### Key Schema Models

```prisma
model ClientGoal {
  id             String         @id @default(cuid())
  clientRosterId String
  name           String
  description    String?
  targetValue    Float?
  targetUnit     String?        // "kg", "reps", "minutes"
  currentValue   Float?
  deadline       DateTime?
  isCompleted    Boolean        @default(false)
  completedAt    DateTime?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  clientRoster   ClientRoster   @relation(...)
  @@map("client_goals")
}
```

### Frontend

- Client detail page gets a "Progress" tab
- Shows trainee profile data (weight, goals, experience) if shared
- PT can assign goals with targets and deadlines
- Progress visualization (simple bar/percentage, charts later)

---

## Phase Dependencies

```
3.1 Client Roster (start here)
 └── 3.2 Resources Library (needs roster for assignment)
 └── 3.3 Client Onboarding (needs roster for status tracking)
 └── 3.4 Client Progress Tracking (needs roster for goals)
```

3.2, 3.3, and 3.4 are independent of each other and can be built in any order after 3.1.
