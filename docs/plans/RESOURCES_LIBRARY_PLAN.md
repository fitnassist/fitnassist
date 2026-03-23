# Phase 3.2: Resources Library — Implementation Plan

## Overview

Give PTs tools to create and manage a personal library of exercises and recipes, build workout plans and meal plans from those resources, and assign plans to specific clients.

**Scope:** This phase builds the resource CRUD and assignment system. Trainees viewing assigned resources is a read-only layer added here too (otherwise assignment has no visible effect).

---

## Current State

- Client Roster (3.1) is live — trainers manage clients with status/notes
- Cloudinary upload infrastructure exists with `exercise-video` (100MB) and `exercise-thumbnail` (5MB) types already configured
- `ImageUpload`, `VideoUpload` components exist in `src/components/ui/`
- No resource models exist in the schema yet

---

## Database Schema

### New Enums

```prisma
enum MuscleGroup {
  CHEST
  BACK
  SHOULDERS
  BICEPS
  TRICEPS
  FOREARMS
  ABS
  OBLIQUES
  QUADS
  HAMSTRINGS
  GLUTES
  CALVES
  FULL_BODY
  CARDIO
}

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
}
```

### New Models

```prisma
model Exercise {
  id             String          @id @default(cuid())
  trainerId      String

  /// @zod.string.min(2, { message: "Name must be at least 2 characters" }).max(100)
  name           String
  /// @zod.string.max(2000, { message: "Description must be at most 2000 characters" })
  description    String?         @db.Text
  /// @zod.string.max(500, { message: "Instructions must be at most 500 characters" })
  instructions   String?         @db.Text

  // Media — link OR upload (not mutually exclusive)
  /// @zod.string.url({ message: "Must be a valid URL" })
  videoUrl       String?         // External link (YouTube, Vimeo, any URL)
  /// @zod.string.url({ message: "Must be a valid URL" })
  videoUploadUrl String?         // Uploaded video via Cloudinary
  /// @zod.string.url({ message: "Must be a valid URL" })
  thumbnailUrl   String?         // Uploaded thumbnail or auto-generated

  // Categorisation
  muscleGroups   MuscleGroup[]
  equipment      String[]
  difficulty     ExperienceLevel?

  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  // Relations
  trainer        TrainerProfile  @relation(fields: [trainerId], references: [id], onDelete: Cascade)
  workoutExercises WorkoutExercise[]

  @@index([trainerId])
  @@map("exercises")
}

model Recipe {
  id             String          @id @default(cuid())
  trainerId      String

  /// @zod.string.min(2, { message: "Name must be at least 2 characters" }).max(100)
  name           String
  /// @zod.string.max(2000, { message: "Description must be at most 2000 characters" })
  description    String?         @db.Text
  /// @zod.string.url({ message: "Must be a valid URL" })
  imageUrl       String?

  // Ingredients stored as JSON array: [{name, quantity, unit}]
  ingredients    Json            @default("[]")
  /// @zod.string.max(5000, { message: "Instructions must be at most 5000 characters" })
  instructions   String          @db.Text

  // Nutrition (per serving)
  /// @zod.number.int().min(0)
  calories       Int?
  /// @zod.number.min(0)
  proteinG       Float?
  /// @zod.number.min(0)
  carbsG         Float?
  /// @zod.number.min(0)
  fatG           Float?

  // Timing
  /// @zod.number.int().min(0)
  prepTimeMin    Int?
  /// @zod.number.int().min(0)
  cookTimeMin    Int?
  /// @zod.number.int().min(1)
  servings       Int?

  tags           String[]

  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  // Relations
  trainer        TrainerProfile  @relation(fields: [trainerId], references: [id], onDelete: Cascade)
  mealPlanRecipes MealPlanRecipe[]

  @@index([trainerId])
  @@map("recipes")
}

model WorkoutPlan {
  id             String          @id @default(cuid())
  trainerId      String

  /// @zod.string.min(2, { message: "Name must be at least 2 characters" }).max(100)
  name           String
  /// @zod.string.max(2000, { message: "Description must be at most 2000 characters" })
  description    String?         @db.Text

  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  // Relations
  trainer        TrainerProfile  @relation(fields: [trainerId], references: [id], onDelete: Cascade)
  exercises      WorkoutExercise[]
  assignments    ResourceAssignment[]

  @@index([trainerId])
  @@map("workout_plans")
}

model WorkoutExercise {
  id             String       @id @default(cuid())
  workoutPlanId  String
  exerciseId     String

  /// @zod.number.int().min(1)
  sets           Int?
  reps           String?      // "8-12" or "to failure"
  /// @zod.number.int().min(0)
  restSeconds    Int?
  sortOrder      Int          @default(0)
  /// @zod.string.max(500)
  notes          String?

  // Relations
  workoutPlan    WorkoutPlan  @relation(fields: [workoutPlanId], references: [id], onDelete: Cascade)
  exercise       Exercise     @relation(fields: [exerciseId], references: [id], onDelete: Cascade)

  @@index([workoutPlanId])
  @@map("workout_exercises")
}

model MealPlan {
  id             String          @id @default(cuid())
  trainerId      String

  /// @zod.string.min(2, { message: "Name must be at least 2 characters" }).max(100)
  name           String
  /// @zod.string.max(2000, { message: "Description must be at most 2000 characters" })
  description    String?         @db.Text

  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  // Relations
  trainer        TrainerProfile  @relation(fields: [trainerId], references: [id], onDelete: Cascade)
  recipes        MealPlanRecipe[]
  assignments    ResourceAssignment[]

  @@index([trainerId])
  @@map("meal_plans")
}

model MealPlanRecipe {
  id             String     @id @default(cuid())
  mealPlanId     String
  recipeId       String

  dayOfWeek      Int?       // 0=Monday, 6=Sunday
  mealType       MealType?
  sortOrder      Int        @default(0)

  // Relations
  mealPlan       MealPlan   @relation(fields: [mealPlanId], references: [id], onDelete: Cascade)
  recipe         Recipe     @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@index([mealPlanId])
  @@map("meal_plan_recipes")
}

model ResourceAssignment {
  id             String     @id @default(cuid())
  trainerId      String
  clientRosterId String

  resourceType   String     // 'WORKOUT_PLAN' | 'MEAL_PLAN'
  workoutPlanId  String?
  mealPlanId     String?

  assignedAt     DateTime   @default(now())
  /// @zod.string.max(500)
  notes          String?

  // Relations
  trainer        TrainerProfile @relation(fields: [trainerId], references: [id], onDelete: Cascade)
  clientRoster   ClientRoster   @relation(fields: [clientRosterId], references: [id], onDelete: Cascade)
  workoutPlan    WorkoutPlan?   @relation(fields: [workoutPlanId], references: [id], onDelete: Cascade)
  mealPlan       MealPlan?      @relation(fields: [mealPlanId], references: [id], onDelete: Cascade)

  @@index([clientRosterId])
  @@index([trainerId])
  @@map("resource_assignments")
}
```

### Relations to Add to Existing Models

```prisma
model TrainerProfile {
  // ... existing
  exercises          Exercise[]
  recipes            Recipe[]
  workoutPlans       WorkoutPlan[]
  mealPlans          MealPlan[]
  resourceAssignments ResourceAssignment[]
}

model ClientRoster {
  // ... existing
  resourceAssignments ResourceAssignment[]
}
```

### Cloudinary Config

Add a `recipe-image` upload type to `apps/api/src/lib/cloudinary.ts`:
- Folder: `fitnassist/recipes`
- 10MB max
- 800x600 fill crop

---

## Backend

### Repositories

#### `apps/api/src/repositories/exercise.repository.ts`

```
- create(trainerId, data) → Exercise
- findById(id) → Exercise with relations
- findByTrainerId(trainerId, { search?, muscleGroup?, difficulty?, page, limit }) → paginated
- update(id, data) → Exercise
- delete(id) → void
- count(trainerId) → number
```

#### `apps/api/src/repositories/recipe.repository.ts`

```
- create(trainerId, data) → Recipe
- findById(id) → Recipe
- findByTrainerId(trainerId, { search?, tag?, page, limit }) → paginated
- update(id, data) → Recipe
- delete(id) → void
- count(trainerId) → number
```

#### `apps/api/src/repositories/workout-plan.repository.ts`

```
- create(trainerId, data) → WorkoutPlan
- findById(id) → WorkoutPlan with exercises (ordered by sortOrder) + exercise details
- findByTrainerId(trainerId, { search?, page, limit }) → paginated
- update(id, data) → WorkoutPlan
- delete(id) → void (cascades workout exercises)
- setExercises(planId, exercises[]) → batch upsert WorkoutExercise entries
```

#### `apps/api/src/repositories/meal-plan.repository.ts`

```
- create(trainerId, data) → MealPlan
- findById(id) → MealPlan with recipes (ordered by dayOfWeek, mealType, sortOrder) + recipe details
- findByTrainerId(trainerId, { search?, page, limit }) → paginated
- update(id, data) → MealPlan
- delete(id) → void (cascades meal plan recipes)
- setRecipes(planId, recipes[]) → batch upsert MealPlanRecipe entries
```

#### `apps/api/src/repositories/resource-assignment.repository.ts`

```
- assign(trainerId, clientRosterId, resourceType, resourceId, notes?) → ResourceAssignment
- unassign(id) → void
- findByClientRosterId(clientRosterId) → assignments with plan details
- findByResourceId(resourceType, resourceId) → assignments (who has this plan?)
```

### Services

Each service follows the same pattern: verify trainer ownership, delegate to repository.

#### `apps/api/src/services/exercise.service.ts`

- CRUD operations with trainer ownership verification
- On delete: also delete uploaded video/thumbnail from Cloudinary

#### `apps/api/src/services/recipe.service.ts`

- CRUD operations with trainer ownership verification
- On delete: also delete uploaded image from Cloudinary

#### `apps/api/src/services/workout-plan.service.ts`

- CRUD for plan metadata
- `setExercises(userId, planId, exercises[])` — replaces all exercises in the plan
- Verify all exercise IDs belong to the trainer

#### `apps/api/src/services/meal-plan.service.ts`

- CRUD for plan metadata
- `setRecipes(userId, planId, recipes[])` — replaces all recipes in the plan
- Verify all recipe IDs belong to the trainer

#### `apps/api/src/services/resource-assignment.service.ts`

- `assign(userId, clientRosterId, resourceType, resourceId, notes?)` — verify ownership of both client and resource
- `unassign(userId, assignmentId)` — verify ownership
- `getForClient(userId, clientRosterId)` — all assignments for a client

### Routers

#### `apps/api/src/routers/exercise.router.ts` (trainerProcedure)

```
- exercise.list → { search?, muscleGroup?, difficulty?, page, limit }
- exercise.get → { id }
- exercise.create → { name, description?, instructions?, videoUrl?, videoUploadUrl?, thumbnailUrl?, muscleGroups[], equipment[], difficulty? }
- exercise.update → { id, ...fields }
- exercise.delete → { id }
```

#### `apps/api/src/routers/recipe.router.ts` (trainerProcedure)

```
- recipe.list → { search?, tag?, page, limit }
- recipe.get → { id }
- recipe.create → { name, description?, imageUrl?, ingredients, instructions, calories?, proteinG?, carbsG?, fatG?, prepTimeMin?, cookTimeMin?, servings?, tags[] }
- recipe.update → { id, ...fields }
- recipe.delete → { id }
```

#### `apps/api/src/routers/workout-plan.router.ts` (trainerProcedure)

```
- workoutPlan.list → { search?, page, limit }
- workoutPlan.get → { id } — includes exercises with details
- workoutPlan.create → { name, description? }
- workoutPlan.update → { id, name?, description? }
- workoutPlan.delete → { id }
- workoutPlan.setExercises → { id, exercises: [{exerciseId, sets?, reps?, restSeconds?, notes?, sortOrder}] }
```

#### `apps/api/src/routers/meal-plan.router.ts` (trainerProcedure)

```
- mealPlan.list → { search?, page, limit }
- mealPlan.get → { id } — includes recipes with details
- mealPlan.create → { name, description? }
- mealPlan.update → { id, name?, description? }
- mealPlan.delete → { id }
- mealPlan.setRecipes → { id, recipes: [{recipeId, dayOfWeek?, mealType?, sortOrder}] }
```

#### `apps/api/src/routers/resource-assignment.router.ts` (trainerProcedure)

```
- resourceAssignment.assign → { clientRosterId, resourceType, resourceId, notes? }
- resourceAssignment.unassign → { id }
- resourceAssignment.getForClient → { clientRosterId }
```

Register all routers in `apps/api/src/routers/_app.ts`.

### Schemas

#### `packages/schemas/src/forms/exercise.schema.ts`

```typescript
export const exerciseListSchema = z.object({
  search: z.string().optional(),
  muscleGroup: z.nativeEnum(MuscleGroup).optional(),
  difficulty: z.nativeEnum(ExperienceLevel).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export const createExerciseSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  instructions: z.string().max(500).optional(),
  videoUrl: z.string().url().optional().nullable(),
  videoUploadUrl: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  muscleGroups: z.array(z.nativeEnum(MuscleGroup)).default([]),
  equipment: z.array(z.string()).default([]),
  difficulty: z.nativeEnum(ExperienceLevel).optional().nullable(),
});

export const updateExerciseSchema = z.object({
  id: z.string().cuid(),
}).merge(createExerciseSchema.partial());
```

#### `packages/schemas/src/forms/recipe.schema.ts`

```typescript
export const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().optional(),
  unit: z.string().optional(),
});

export const createRecipeSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional().nullable(),
  ingredients: z.array(ingredientSchema).default([]),
  instructions: z.string().min(1).max(5000),
  calories: z.number().int().min(0).optional().nullable(),
  proteinG: z.number().min(0).optional().nullable(),
  carbsG: z.number().min(0).optional().nullable(),
  fatG: z.number().min(0).optional().nullable(),
  prepTimeMin: z.number().int().min(0).optional().nullable(),
  cookTimeMin: z.number().int().min(0).optional().nullable(),
  servings: z.number().int().min(1).optional().nullable(),
  tags: z.array(z.string()).default([]),
});
```

#### `packages/schemas/src/forms/workout-plan.schema.ts`

```typescript
export const createWorkoutPlanSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
});

export const workoutExerciseSchema = z.object({
  exerciseId: z.string().cuid(),
  sets: z.number().int().min(1).optional().nullable(),
  reps: z.string().max(50).optional().nullable(),
  restSeconds: z.number().int().min(0).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const setWorkoutExercisesSchema = z.object({
  id: z.string().cuid(),
  exercises: z.array(workoutExerciseSchema),
});
```

#### `packages/schemas/src/forms/meal-plan.schema.ts`

```typescript
export const createMealPlanSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
});

export const mealPlanRecipeSchema = z.object({
  recipeId: z.string().cuid(),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  mealType: z.nativeEnum(MealType).optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const setMealPlanRecipesSchema = z.object({
  id: z.string().cuid(),
  recipes: z.array(mealPlanRecipeSchema),
});
```

#### `packages/schemas/src/forms/resource-assignment.schema.ts`

```typescript
export const assignResourceSchema = z.object({
  clientRosterId: z.string().cuid(),
  resourceType: z.enum(['WORKOUT_PLAN', 'MEAL_PLAN']),
  resourceId: z.string().cuid(),
  notes: z.string().max(500).optional(),
});
```

---

## Frontend

### Navigation

Add "Resources" nav item to `useNavItems.tsx` for trainers, between "Clients" and "Settings":
- Icon: `BookOpen` from lucide-react
- Route: `/dashboard/resources`

### Routes

Add to `apps/web/src/config/routes.ts`:

```typescript
dashboardResources: '/dashboard/resources',
dashboardExerciseCreate: '/dashboard/resources/exercises/new',
dashboardExerciseEdit: (id: string) => `/dashboard/resources/exercises/${id}/edit`,
dashboardRecipeCreate: '/dashboard/resources/recipes/new',
dashboardRecipeEdit: (id: string) => `/dashboard/resources/recipes/${id}/edit`,
dashboardWorkoutPlanCreate: '/dashboard/resources/workout-plans/new',
dashboardWorkoutPlanEdit: (id: string) => `/dashboard/resources/workout-plans/${id}/edit`,
dashboardMealPlanCreate: '/dashboard/resources/meal-plans/new',
dashboardMealPlanEdit: (id: string) => `/dashboard/resources/meal-plans/${id}/edit`,
```

### Pages

#### Resources Hub: `/dashboard/resources`

`apps/web/src/pages/dashboard/resources/index.tsx`

- `PageLayout` with title "Resources"
- `ResponsiveTabs` with 4 tabs: Exercises | Recipes | Workout Plans | Meal Plans
- Each tab shows a filterable list with a "Create New" button
- Search bar within each tab
- Empty states with call to action

#### Exercise Create/Edit: `/dashboard/resources/exercises/new` and `.../exercises/:id/edit`

`apps/web/src/pages/dashboard/resources/exercises/form/index.tsx` (shared form for create/edit)

- Name, description, instructions
- Video section: toggle between "Paste a link" (URL input) and "Upload a video" (VideoUpload component using `exercise-video` type)
- Thumbnail upload (ImageUpload using `exercise-thumbnail` type) — or auto-generated from uploaded video
- Muscle groups: checkbox grid (multi-select)
- Equipment: tag input (free text, add multiple)
- Difficulty: react-select dropdown (Beginner/Intermediate/Advanced)

#### Recipe Create/Edit: `/dashboard/resources/recipes/new` and `.../recipes/:id/edit`

`apps/web/src/pages/dashboard/resources/recipes/form/index.tsx`

- Name, description
- Image upload (ImageUpload using `recipe-image` type)
- Ingredients: dynamic list — each row has name, quantity, unit fields. Add/remove rows.
- Instructions: textarea
- Nutrition section: calories, protein, carbs, fat (optional fields)
- Timing: prep time, cook time, servings
- Tags: tag input

#### Workout Plan Create/Edit: `/dashboard/resources/workout-plans/new` and `.../workout-plans/:id/edit`

`apps/web/src/pages/dashboard/resources/workout-plans/form/index.tsx`

- Name, description
- Exercise list: search and add from trainer's exercise library
- Each exercise row: sets, reps, rest, notes
- Drag to reorder (using @dnd-kit, already a dependency)
- Remove exercise button

#### Meal Plan Create/Edit: `/dashboard/resources/meal-plans/new` and `.../meal-plans/:id/edit`

`apps/web/src/pages/dashboard/resources/meal-plans/form/index.tsx`

- Name, description
- 7-day grid layout (Mon–Sun columns)
- Each day has meal type sections (Breakfast, Lunch, Dinner, Snack)
- Search and add recipes from trainer's recipe library
- Drag to reorder within a day/meal type

### Resource Cards

Reusable card components for each resource type:

- `ExerciseCard` — thumbnail, name, muscle groups badges, difficulty badge, video icon
- `RecipeCard` — image, name, calories, prep+cook time, tags
- `WorkoutPlanCard` — name, exercise count, created date
- `MealPlanCard` — name, recipe count, created date

### Client Detail: Assignments Tab

Add a third tab "Resources" to the client detail page (`/dashboard/clients/:id`):

- Lists currently assigned workout plans and meal plans
- "Assign Resource" button opens a modal:
  - Toggle: Workout Plan | Meal Plan
  - Search/select from trainer's plans
  - Optional notes field
  - Assign button
- Each assignment card: plan name, assigned date, notes, "Unassign" button
- Clicking a plan name navigates to the plan detail/edit page

### API Hooks

```
apps/web/src/api/exercise/
  ├── useExercises.ts      — list
  ├── useExercise.ts       — detail
  ├── useExerciseMutations.ts — create, update, delete
  └── index.ts

apps/web/src/api/recipe/
  ├── useRecipes.ts
  ├── useRecipe.ts
  ├── useRecipeMutations.ts
  └── index.ts

apps/web/src/api/workout-plan/
  ├── useWorkoutPlans.ts
  ├── useWorkoutPlan.ts
  ├── useWorkoutPlanMutations.ts  — create, update, delete, setExercises
  └── index.ts

apps/web/src/api/meal-plan/
  ├── useMealPlans.ts
  ├── useMealPlan.ts
  ├── useMealPlanMutations.ts     — create, update, delete, setRecipes
  └── index.ts

apps/web/src/api/resource-assignment/
  ├── useResourceAssignments.ts
  ├── useResourceAssignmentMutations.ts  — assign, unassign
  └── index.ts
```

---

## File Summary

### New Files

| File | Purpose |
|------|---------|
| **Schemas** | |
| `packages/schemas/src/forms/exercise.schema.ts` | Exercise validation |
| `packages/schemas/src/forms/recipe.schema.ts` | Recipe validation |
| `packages/schemas/src/forms/workout-plan.schema.ts` | Workout plan validation |
| `packages/schemas/src/forms/meal-plan.schema.ts` | Meal plan validation |
| `packages/schemas/src/forms/resource-assignment.schema.ts` | Assignment validation |
| **Backend** | |
| `apps/api/src/repositories/exercise.repository.ts` | Exercise data access |
| `apps/api/src/repositories/recipe.repository.ts` | Recipe data access |
| `apps/api/src/repositories/workout-plan.repository.ts` | Workout plan data access |
| `apps/api/src/repositories/meal-plan.repository.ts` | Meal plan data access |
| `apps/api/src/repositories/resource-assignment.repository.ts` | Assignment data access |
| `apps/api/src/services/exercise.service.ts` | Exercise business logic |
| `apps/api/src/services/recipe.service.ts` | Recipe business logic |
| `apps/api/src/services/workout-plan.service.ts` | Workout plan business logic |
| `apps/api/src/services/meal-plan.service.ts` | Meal plan business logic |
| `apps/api/src/services/resource-assignment.service.ts` | Assignment business logic |
| `apps/api/src/routers/exercise.router.ts` | Exercise endpoints |
| `apps/api/src/routers/recipe.router.ts` | Recipe endpoints |
| `apps/api/src/routers/workout-plan.router.ts` | Workout plan endpoints |
| `apps/api/src/routers/meal-plan.router.ts` | Meal plan endpoints |
| `apps/api/src/routers/resource-assignment.router.ts` | Assignment endpoints |
| **Frontend — API hooks** | |
| `apps/web/src/api/exercise/*.ts` | Exercise hooks (4 files) |
| `apps/web/src/api/recipe/*.ts` | Recipe hooks (4 files) |
| `apps/web/src/api/workout-plan/*.ts` | Workout plan hooks (4 files) |
| `apps/web/src/api/meal-plan/*.ts` | Meal plan hooks (4 files) |
| `apps/web/src/api/resource-assignment/*.ts` | Assignment hooks (3 files) |
| **Frontend — Pages** | |
| `apps/web/src/pages/dashboard/resources/index.tsx` | Resources hub (tabbed) |
| `apps/web/src/pages/dashboard/resources/components/ExerciseList/index.tsx` | Exercise tab content |
| `apps/web/src/pages/dashboard/resources/components/RecipeList/index.tsx` | Recipe tab content |
| `apps/web/src/pages/dashboard/resources/components/WorkoutPlanList/index.tsx` | Workout plan tab content |
| `apps/web/src/pages/dashboard/resources/components/MealPlanList/index.tsx` | Meal plan tab content |
| `apps/web/src/pages/dashboard/resources/components/ExerciseCard/index.tsx` | Exercise card |
| `apps/web/src/pages/dashboard/resources/components/RecipeCard/index.tsx` | Recipe card |
| `apps/web/src/pages/dashboard/resources/components/WorkoutPlanCard/index.tsx` | Plan card |
| `apps/web/src/pages/dashboard/resources/components/MealPlanCard/index.tsx` | Plan card |
| `apps/web/src/pages/dashboard/resources/components/index.ts` | Barrel export |
| `apps/web/src/pages/dashboard/resources/exercises/form/index.tsx` | Exercise form |
| `apps/web/src/pages/dashboard/resources/recipes/form/index.tsx` | Recipe form |
| `apps/web/src/pages/dashboard/resources/workout-plans/form/index.tsx` | Workout plan builder |
| `apps/web/src/pages/dashboard/resources/meal-plans/form/index.tsx` | Meal plan builder |
| `apps/web/src/pages/dashboard/clients/[id]/components/ClientResources/index.tsx` | Assignment tab |
| `apps/web/src/pages/dashboard/clients/[id]/components/AssignResourceModal/index.tsx` | Assignment modal |

### Modified Files

| File | Changes |
|------|---------|
| `packages/database/prisma/schema.prisma` | Add 7 new models, 2 enums, relations on TrainerProfile + ClientRoster |
| `packages/database/src/index.ts` | Export new types and enum schemas |
| `packages/schemas/src/index.ts` | Export new form schemas |
| `apps/api/src/lib/cloudinary.ts` | Add `recipe-image` upload type |
| `apps/api/src/routers/_app.ts` | Register 5 new routers |
| `apps/web/src/config/routes.ts` | Add resource routes |
| `apps/web/src/App.tsx` | Add resource page routes |
| `apps/web/src/components/layouts/DashboardLayout/hooks/useNavItems.tsx` | Add Resources nav item |
| `apps/web/src/pages/dashboard/clients/[id]/index.tsx` | Add Resources tab |
| `apps/web/src/pages/dashboard/clients/[id]/components/index.ts` | Export new components |

---

## Implementation Order

### Phase A: Exercises (build the foundation)
1. Schema changes + `npm run db:generate`
2. Exercise schemas, repository, service, router
3. API hooks
4. Resources hub page (just Exercises tab initially)
5. Exercise create/edit form
6. Exercise cards + list

### Phase B: Recipes
7. Recipe schemas, repository, service, router
8. Recipe API hooks
9. Recipe create/edit form
10. Recipe cards + list tab
11. Add `recipe-image` Cloudinary type

### Phase C: Workout Plans
12. Workout plan + workout exercise schemas, repository, service, router
13. Workout plan API hooks
14. Workout plan create/edit with exercise picker + drag-to-reorder
15. Workout plan cards + list tab

### Phase D: Meal Plans
16. Meal plan + meal plan recipe schemas, repository, service, router
17. Meal plan API hooks
18. Meal plan create/edit with recipe picker + day/meal grid
19. Meal plan cards + list tab

### Phase E: Client Assignments
20. Resource assignment schemas, repository, service, router
21. Assignment API hooks
22. Client detail Resources tab + AssignResourceModal

---

## Verification

- `npm run db:generate` — no schema errors
- `npx tsc --noEmit` — no type errors
- CRUD operations work for all 4 resource types
- Exercise form: can paste video link OR upload video, not forced to choose
- Workout plan builder: can add/reorder/remove exercises
- Meal plan builder: can add recipes to days/meals
- Assignment: can assign/unassign plans from client detail page
- Assigned resources visible on client detail page

---

## Design Decisions

1. **Exercise videos: link OR upload** — Both `videoUrl` and `videoUploadUrl` fields exist. UI shows a toggle/tab. Neither is required. PT can use YouTube links, direct uploads, or both.

2. **Ingredients as JSON** — Structured `[{name, quantity, unit}]` rather than free text. Enables future features (shopping lists, nutrition calculation) while keeping the schema simple.

3. **Plans reference resources, not embed them** — WorkoutExercise references Exercise by ID. If the PT updates an exercise, all plans using it get the update. Trade-off: deleting an exercise cascades to remove it from plans.

4. **ResourceAssignment uses polymorphic reference** — `resourceType` + `workoutPlanId` / `mealPlanId` nullable FKs. This keeps referential integrity (actual FK constraints) while supporting multiple resource types. Can extend to new types later.

5. **No trainee-side CRUD** — Trainees can only view assigned resources (read-only). They don't create their own exercises/recipes. This keeps scope tight for 3.2.
