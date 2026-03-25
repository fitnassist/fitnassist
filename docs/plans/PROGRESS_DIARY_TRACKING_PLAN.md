# Plan: Client Progress & Diary Tracking

## Context

Combines Phase 3.4 (Client Progress Tracking) and Phase 4.1 (Goals & Tracking) from the MVP plan. Gives trainees a diary system for logging daily entries (weight, food, water, measurements, mood, sleep, workouts) and both parties a goals system. PTs see everything on the client detail page; trainees see their own dashboard. Built incrementally across 6 phases.

**Key decisions:**
- Store all measurements in metric (kg, cm), convert on display using trainee's `unitPreference`
- Use USDA FoodData Central API for food database (free, comprehensive, no key required — DEMO_KEY fallback)
- Use `recharts` for charts/trends
- Use `react-compare-slider` for progress photo comparison
- Both PT and trainee can create goals; both see all diary entries
- PT can comment on any diary entry

---

## Phase 1: Core Diary Infrastructure + Basic Entries ✅

**Goal:** Schema, backend, and basic UI for weight, water, measurements, mood, and sleep logging.

### Schema Changes

```prisma
enum DiaryEntryType {
  WEIGHT
  WATER
  MEASUREMENT
  MOOD
  SLEEP
  FOOD
  WORKOUT_LOG
  PROGRESS_PHOTO
}

enum MoodLevel {
  TERRIBLE
  BAD
  OKAY
  GOOD
  GREAT
}

model DiaryEntry {
  id             String         @id @default(cuid())
  userId         String
  type           DiaryEntryType
  date           DateTime       @db.Date       // the day this entry is for
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  // Relations
  user           User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  weightEntry    WeightEntry?
  waterEntry     WaterEntry?
  measurementEntry MeasurementEntry?
  moodEntry      MoodEntry?
  sleepEntry     SleepEntry?
  foodEntries    FoodEntry[]
  workoutLog     WorkoutLog?
  progressPhotos ProgressPhoto[]
  comments       DiaryComment[]

  @@index([userId, date])
  @@index([userId, type])
  @@map("diary_entries")
}

model WeightEntry {
  id           String     @id @default(cuid())
  diaryEntryId String     @unique
  /// @zod.number.positive()
  weightKg     Float

  diaryEntry   DiaryEntry @relation(fields: [diaryEntryId], references: [id], onDelete: Cascade)
  @@map("weight_entries")
}

model WaterEntry {
  id           String     @id @default(cuid())
  diaryEntryId String     @unique
  /// @zod.number.min(0)
  totalMl      Int        // running total for the day

  diaryEntry   DiaryEntry @relation(fields: [diaryEntryId], references: [id], onDelete: Cascade)
  @@map("water_entries")
}

model MeasurementEntry {
  id           String     @id @default(cuid())
  diaryEntryId String     @unique
  chestCm      Float?
  waistCm      Float?
  hipsCm       Float?
  bicepCm      Float?
  thighCm      Float?
  calfCm       Float?
  neckCm       Float?

  diaryEntry   DiaryEntry @relation(fields: [diaryEntryId], references: [id], onDelete: Cascade)
  @@map("measurement_entries")
}

model MoodEntry {
  id           String     @id @default(cuid())
  diaryEntryId String     @unique
  level        MoodLevel
  notes        String?

  diaryEntry   DiaryEntry @relation(fields: [diaryEntryId], references: [id], onDelete: Cascade)
  @@map("mood_entries")
}

model SleepEntry {
  id           String     @id @default(cuid())
  diaryEntryId String     @unique
  /// @zod.number.min(0).max(24)
  hoursSlept   Float
  /// @zod.number.int().min(1).max(5)
  quality      Int        // 1-5 scale

  diaryEntry   DiaryEntry @relation(fields: [diaryEntryId], references: [id], onDelete: Cascade)
  @@map("sleep_entries")
}
```

**Why separate tables per entry type:** Each type has different fields. A single JSON column would lose type safety and make querying/aggregation harder. Separate tables with `@unique diaryEntryId` keep things clean.

**Why one DiaryEntry per type per day:** Water and food accumulate throughout the day. Weight/mood/sleep are typically once-daily. The `date` field (not datetime) groups entries by day. Food entries are many-per-diary-entry (multiple meals).

### Backend

**Repository:** `apps/api/src/repositories/diary.repository.ts`
```
- createEntry(userId, type, date, data) → creates DiaryEntry + related sub-entry in transaction
- findEntriesByDate(userId, date) → all entries for a day with sub-entries
- findEntriesByDateRange(userId, startDate, endDate, type?) → for charts
- findLatestByType(userId, type) → most recent entry of a type
- updateEntry(id, data) → update sub-entry
- deleteEntry(id) → cascades
- upsertWaterEntry(userId, date, totalMl) → create-or-update for water (accumulates through day)
```

**Service:** `apps/api/src/services/diary.service.ts`
```
- logWeight(userId, date, weightKg)
- logWater(userId, date, totalMl)
- logMeasurements(userId, date, measurements)
- logMood(userId, date, level, notes?)
- logSleep(userId, date, hoursSlept, quality)
- getEntriesForDate(userId, date)
- getEntriesForRange(userId, startDate, endDate, type?)
- deleteEntry(userId, entryId) → verify ownership
- getDailySummary(userId, date) → aggregated view
```

All methods work for both trainees (own data) and trainers (via clientRosterId lookup to get trainee's userId).

**Router:** `apps/api/src/routers/diary.router.ts`
```
- diary.logWeight → protectedProcedure (trainee logs own, or trainer logs for client)
- diary.logWater → protectedProcedure
- diary.logMeasurements → protectedProcedure
- diary.logMood → protectedProcedure
- diary.logSleep → protectedProcedure
- diary.getEntries → protectedProcedure, input: { userId?, date }
- diary.getRange → protectedProcedure, input: { userId?, startDate, endDate, type? }
- diary.deleteEntry → protectedProcedure
- diary.getDailySummary → protectedProcedure
```

**Input pattern for dual-access:** Each mutation accepts optional `clientRosterId`. If provided, service verifies the caller is the trainer for that roster entry and resolves the trainee's userId. If omitted, uses the caller's own userId (trainee logging for themselves).

**Schemas:** `packages/schemas/src/forms/diary.schema.ts`
```typescript
export const logWeightSchema = z.object({
  clientRosterId: z.string().cuid().optional(),
  date: z.string().date(),
  weightKg: z.number().positive(),
});
// Similar for water, measurements, mood, sleep
export const diaryDateRangeSchema = z.object({
  userId: z.string().optional(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  type: z.nativeEnum(DiaryEntryType).optional(),
});
```

### Frontend — Trainee Diary Page

**New route:** `/dashboard/diary`

**Nav item:** Add "Diary" to trainee nav items (between Messages and My Plans).

**Page:** `apps/web/src/pages/dashboard/diary/index.tsx`
- Date picker at top (defaults to today, can navigate back/forward)
- Card-based entry sections for each type
- Each section: current value + quick-log form
- "Add Entry" floating action or section buttons

**Components:**
```
pages/dashboard/diary/
├── index.tsx                    # Main diary page
├── components/
│   ├── DiaryDatePicker/         # Date navigation
│   ├── WeightLogger/            # Weight input with unit conversion
│   ├── WaterTracker/            # Glass/ml buttons, progress toward daily goal
│   ├── MeasurementsLogger/      # Body measurement form
│   ├── MoodLogger/              # Emoji/icon mood selector (5 levels)
│   ├── SleepLogger/             # Hours + quality slider
│   ├── DailySummaryCard/        # Overview of all entries for the day
│   └── index.ts
├── hooks/
│   ├── useDiary.ts              # Page state, date management
│   └── index.ts
└── diary.utils.ts               # Unit conversion helpers
```

**API hooks:** `apps/web/src/api/diary/`
```
- useLogWeight(), useLogWater(), useLogMeasurements(), useLogMood(), useLogSleep()
- useDiaryEntries(date), useDiaryRange(startDate, endDate, type?)
- useDeleteDiaryEntry()
- useDailySummary(date)
```

**Unit conversion utility** (`diary.utils.ts`):
```typescript
export const kgToLbs = (kg: number) => kg * 2.20462;
export const lbsToKg = (lbs: number) => lbs / 2.20462;
export const cmToInches = (cm: number) => cm / 2.54;
export const inchesToCm = (inches: number) => inches * 2.54;
export const mlToFlOz = (ml: number) => ml / 29.5735;
export const formatWeight = (kg: number, unit: 'METRIC' | 'IMPERIAL') => ...
export const formatHeight = (cm: number, unit: 'METRIC' | 'IMPERIAL') => ...
```

### Key Files — Phase 1

| File | Change |
|------|--------|
| `schema.prisma` | DiaryEntry + WeightEntry + WaterEntry + MeasurementEntry + MoodEntry + SleepEntry models, DiaryEntryType + MoodLevel enums |
| `packages/schemas/src/forms/diary.schema.ts` (new) | Validation schemas for all entry types |
| `packages/schemas/src/index.ts` | Export diary schemas |
| `apps/api/src/repositories/diary.repository.ts` (new) | Data access |
| `apps/api/src/services/diary.service.ts` (new) | Business logic with dual-access pattern |
| `apps/api/src/routers/diary.router.ts` (new) | tRPC endpoints |
| `apps/api/src/routers/_app.ts` | Register diary router |
| `apps/web/src/api/diary/` (new dir) | Hook files + barrel |
| `apps/web/src/pages/dashboard/diary/` (new dir) | Page + components |
| `apps/web/src/config/routes.ts` | Add diary route |
| `apps/web/src/App.tsx` | Add diary route |
| `DashboardLayout/hooks/useNavItems.tsx` | Add Diary nav for trainees |
| `apps/web/src/pages/dashboard/diary/diary.utils.ts` (new) | Unit conversion |

---

## Phase 2: Food & Calorie Tracking ✅

**Goal:** MyFitnessPal-style food logging with Nutritionix API for food search.

### Schema

```prisma
model FoodEntry {
  id           String     @id @default(cuid())
  diaryEntryId String
  /// @zod.string.min(1)
  name         String
  mealType     MealType   // reuse existing BREAKFAST | LUNCH | DINNER | SNACK enum
  calories     Int
  proteinG     Float?
  carbsG       Float?
  fatG         Float?
  fibreG       Float?
  /// @zod.number.positive()
  servingSize  Float      @default(1)
  servingUnit  String     @default("serving")

  // Nutritionix reference for future lookup
  externalId   String?    // nutritionix food_id or nix_item_id
  thumbnailUrl String?

  diaryEntry   DiaryEntry @relation(fields: [diaryEntryId], references: [id], onDelete: Cascade)
  @@index([diaryEntryId])
  @@map("food_entries")
}
```

### Backend — Nutritionix Integration

**Lib:** `apps/api/src/lib/nutritionix.ts`
```typescript
// Wraps Nutritionix API v2
// Headers: x-app-id, x-app-key (from env)
// searchFood(query) → GET /v2/search/instant (branded + common)
// getFoodDetails(query) → POST /v2/natural/nutrients (natural language)
// getBarcode(upc) → GET /v2/search/item?upc=... (future mobile)
```

**Service additions** to `diary.service.ts`:
```
- searchFood(query) → proxied Nutritionix search
- logFood(userId, date, mealType, foodItems[])
- updateFoodEntry(userId, foodEntryId, data)
- deleteFoodEntry(userId, foodEntryId)
- getDailyNutrition(userId, date) → { totalCalories, totalProtein, totalCarbs, totalFat, byMeal }
```

**Router additions:**
```
- diary.searchFood → protectedProcedure, input: { query }
- diary.logFood → protectedProcedure
- diary.updateFoodEntry → protectedProcedure
- diary.deleteFoodEntry → protectedProcedure
- diary.getDailyNutrition → protectedProcedure
```

### Frontend — Food Logger

**Components:**
```
pages/dashboard/diary/components/
├── FoodLogger/
│   ├── index.tsx              # Meal sections (Breakfast/Lunch/Dinner/Snack)
│   ├── FoodSearchModal.tsx    # Search Nutritionix, select food, set serving
│   ├── FoodEntryRow.tsx       # Single food item with edit/delete
│   └── NutritionSummary.tsx   # Daily totals bar (calories, macros)
```

**FoodSearchModal flow:**
1. User types food name → debounced search to Nutritionix via backend proxy
2. Results show: food name, brand (if branded), calories per serving, thumbnail
3. User selects → can adjust serving size
4. Confirm → food entry created

**Daily nutrition display:**
- Horizontal bar showing calories consumed vs daily target
- Macro breakdown (protein/carbs/fat) as stacked bar or pie
- Per-meal subtotals

### Calorie Target

Add to `TraineeProfile`:
```prisma
  dailyCalorieTarget  Int?
  dailyProteinTargetG Float?
  dailyCarbsTargetG   Float?
  dailyFatTargetG     Float?
  dailyWaterTargetMl  Int?    // also used by water tracker in Phase 1
```

These are set by the trainee in their profile settings or by the PT on the client detail page.

### Key Files — Phase 2

| File | Change |
|------|--------|
| `schema.prisma` | FoodEntry model, nutrition targets on TraineeProfile |
| `packages/schemas/src/forms/diary.schema.ts` | Food entry schemas |
| `apps/api/src/lib/nutritionix.ts` (new) | API wrapper |
| `apps/api/src/services/diary.service.ts` | Food logging methods |
| `apps/api/src/routers/diary.router.ts` | Food endpoints |
| `apps/web/src/pages/dashboard/diary/components/FoodLogger/` (new) | Food UI components |
| `apps/web/src/api/diary/` | Food hooks |

---

## Phase 3: Goals System ✅

**Goal:** Both PT and trainee can create goals. Two types: target goals (reach a value) and recurring habits (do X times per week).

### Schema

```prisma
enum GoalType {
  TARGET      // reach a specific value (e.g., weigh 80kg)
  HABIT       // recurring action (e.g., drink 2L water 5x/week)
}

enum GoalStatus {
  ACTIVE
  COMPLETED
  ABANDONED
}

model Goal {
  id             String     @id @default(cuid())
  userId         String     // the trainee this goal is for
  createdById    String     // who created it (trainee or their trainer)
  /// @zod.string.min(1).max(200)
  name           String
  description    String?
  type           GoalType
  status         GoalStatus @default(ACTIVE)

  // TARGET fields
  targetValue    Float?
  targetUnit     String?    // "kg", "cm", "reps", etc.
  currentValue   Float?
  entryType      DiaryEntryType?  // which diary type auto-updates this (e.g., WEIGHT)
  entryField     String?          // which field (e.g., "weightKg", "waistCm")

  // HABIT fields
  /// @zod.number.int().min(1).max(7)
  frequencyPerWeek Int?
  habitEntryType   DiaryEntryType?  // what diary entry counts as completion

  deadline       DateTime?
  completedAt    DateTime?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  user           User       @relation("goalUser", fields: [userId], references: [id], onDelete: Cascade)
  createdBy      User       @relation("goalCreator", fields: [createdById], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@map("goals")
}
```

**Auto-detection logic** (in diary service, on entry creation):
- When a weight entry is logged, check if there's an active TARGET goal with `entryType: WEIGHT`. If so, update `currentValue`. If target reached, mark `COMPLETED`.
- When any diary entry is logged, check if there's an active HABIT goal with `habitEntryType` matching. Count entries this week. If frequency met, give visual feedback (not auto-complete since habits recur weekly).

### Backend

**Repository:** `apps/api/src/repositories/goal.repository.ts`
```
- create(data)
- findByUserId(userId, status?)
- findById(id)
- update(id, data)
- updateCurrentValue(id, currentValue)
- getWeeklyHabitProgress(goalId, weekStart) → count of matching entries
```

**Service:** `apps/api/src/services/goal.service.ts`
```
- createGoal(callerId, userId, data) → verify caller is user or their trainer
- getGoals(callerId, userId?, status?) → own goals or client's goals
- updateGoal(callerId, goalId, data)
- abandonGoal(callerId, goalId)
- completeGoal(callerId, goalId)
- checkAutoProgress(userId, entryType, value?) → called by diary service after logging
```

**Router:** `apps/api/src/routers/goal.router.ts`
```
- goal.create → protectedProcedure
- goal.list → protectedProcedure, input: { userId?, status? }
- goal.update → protectedProcedure
- goal.abandon → protectedProcedure
- goal.complete → protectedProcedure
```

### Frontend

**Trainee:** New section on diary page or separate `/dashboard/goals` page
- Active goals with progress bars/rings
- "Add Goal" form: name, type (target/habit), target value, frequency, deadline
- Goal cards: progress indicator, status badge, edit/abandon/complete actions

**Trainer view:** Goals tab on client detail page (Phase 6)

### Key Files — Phase 3

| File | Change |
|------|--------|
| `schema.prisma` | Goal model, GoalType + GoalStatus enums |
| `packages/schemas/src/forms/goal.schema.ts` (new) | Goal validation schemas |
| `apps/api/src/repositories/goal.repository.ts` (new) | Goal data access |
| `apps/api/src/services/goal.service.ts` (new) | Goal business logic |
| `apps/api/src/services/diary.service.ts` | Add auto-progress check after entries |
| `apps/api/src/routers/goal.router.ts` (new) | Goal endpoints |
| `apps/api/src/routers/_app.ts` | Register goal router |
| `apps/web/src/api/goal/` (new dir) | Goal hooks |
| `apps/web/src/pages/dashboard/diary/` or `goals/` | Goals UI |

---

## Phase 4: Progress Photos ✅

**Goal:** Trainees upload progress photos. Side-by-side comparison with drag slider.

### Schema

```prisma
model ProgressPhoto {
  id           String     @id @default(cuid())
  diaryEntryId String
  /// @zod.string.url()
  imageUrl     String     // Cloudflare R2 URL
  category     String?    // "front", "side", "back" — freeform
  notes        String?
  sortOrder    Int        @default(0)

  diaryEntry   DiaryEntry @relation(fields: [diaryEntryId], references: [id], onDelete: Cascade)
  @@index([diaryEntryId])
  @@map("progress_photos")
}
```

### Backend

- Upload follows existing Cloudflare R2 pattern (signed upload URL from backend, client uploads directly)
- Service: `logProgressPhotos(userId, date, photos[])`, `getProgressPhotos(userId, dateRange?)`
- Photos are grouped by DiaryEntry (by date), so comparison picks two dates

### Frontend

**Components:**
```
pages/dashboard/diary/components/
├── ProgressPhotos/
│   ├── index.tsx              # Upload + grid of photos by date
│   ├── PhotoUpload.tsx        # Drag-drop or click upload (reuse existing upload patterns)
│   ├── PhotoGrid.tsx          # Thumbnails grouped by date
│   └── PhotoCompare.tsx       # react-compare-slider for before/after
```

**Comparison flow:**
1. User picks two dates from photo timeline
2. Side-by-side or slider comparison using `react-compare-slider`
3. Category filter (front/side/back) to match angles

### New Dependencies
- `react-compare-slider` (frontend only)

### Key Files — Phase 4

| File | Change |
|------|--------|
| `schema.prisma` | ProgressPhoto model |
| `apps/api/src/services/diary.service.ts` | Photo logging methods |
| `apps/api/src/routers/diary.router.ts` | Photo endpoints + signed upload URL |
| `apps/web/src/pages/dashboard/diary/components/ProgressPhotos/` (new) | Photo UI |
| `package.json` (web) | Add react-compare-slider |

---

## Phase 5: Charts & Trends ✅

**Goal:** Visualise progress over time with interactive charts.

### New Dependency
- `recharts` (frontend only)

### Frontend

**New page section or tab on diary:** "Trends"

**Components:**
```
pages/dashboard/diary/components/
├── Trends/
│   ├── index.tsx              # Trend dashboard with chart selector
│   ├── WeightChart.tsx        # Line chart: weight over time with goal line
│   ├── MeasurementChart.tsx   # Multi-line chart: body measurements
│   ├── NutritionChart.tsx     # Stacked bar: daily calories/macros
│   ├── WaterChart.tsx         # Bar chart: daily water intake vs target
│   ├── MoodChart.tsx          # Scatter/line: mood over time
│   ├── SleepChart.tsx         # Bar chart: hours + quality overlay
│   └── TrendDateRange.tsx     # Date range selector (7d, 30d, 90d, custom)
```

**Chart features:**
- Responsive (mobile-friendly)
- Tooltips on data points
- Goal target line overlay where applicable
- Date range: last 7/30/90 days or custom range
- Uses existing `diary.getRange` endpoint (no new backend needed)

### Key Files — Phase 5

| File | Change |
|------|--------|
| `package.json` (web) | Add recharts |
| `apps/web/src/pages/dashboard/diary/components/Trends/` (new) | Chart components |
| `apps/web/src/pages/dashboard/diary/index.tsx` | Add Trends tab/section |

---

## Phase 6: PT View — Progress Tab + Comments ✅

**Goal:** PTs see client progress on the client detail page. PTs can comment on diary entries.

### Schema

```prisma
model DiaryComment {
  id           String     @id @default(cuid())
  diaryEntryId String
  userId       String     // commenter (PT or trainee)
  /// @zod.string.min(1).max(1000)
  content      String
  createdAt    DateTime   @default(now())

  diaryEntry   DiaryEntry @relation(fields: [diaryEntryId], references: [id], onDelete: Cascade)
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([diaryEntryId])
  @@map("diary_comments")
}
```

### Backend

**Service additions:**
```
- addComment(userId, diaryEntryId, content) → verify user is owner or their trainer
- getComments(diaryEntryId)
- deleteComment(userId, commentId) → verify ownership
```

**Router additions:**
```
- diary.addComment → protectedProcedure
- diary.getComments → protectedProcedure
- diary.deleteComment → protectedProcedure
```

### Frontend — PT Client Detail

**New tab:** "Progress" on client detail page (`apps/web/src/pages/dashboard/clients/[id]/`)

**Components:**
```
pages/dashboard/clients/[id]/components/
├── ClientProgress/
│   ├── index.tsx              # Progress tab container
│   ├── ClientDiarySummary.tsx # Recent diary entries feed
│   ├── ClientGoals.tsx        # Active goals with progress + create goal form
│   ├── ClientCharts.tsx       # Reuse Trends components with client's userId
│   ├── ClientPhotos.tsx       # Reuse PhotoGrid + PhotoCompare
│   └── DiaryEntryCard.tsx     # Single diary entry with comment section
```

**DiaryEntryCard:**
- Shows entry type icon, date, data summary
- Expandable comment section
- PT can add comments (textarea + send button)
- Comment list with timestamps

**ClientGoals:**
- List of active/completed goals
- PT can create goals for the client
- Progress bars/rings for target goals
- Weekly streak indicator for habits

### Key Files — Phase 6

| File | Change |
|------|--------|
| `schema.prisma` | DiaryComment model |
| `packages/schemas/src/forms/diary.schema.ts` | Comment schemas |
| `apps/api/src/services/diary.service.ts` | Comment methods |
| `apps/api/src/routers/diary.router.ts` | Comment endpoints |
| `apps/web/src/pages/dashboard/clients/[id]/components/ClientProgress/` (new) | PT progress view |
| `apps/web/src/pages/dashboard/clients/[id]/index.tsx` | Add Progress tab |

---

## Implementation Order

```
Phase 1: Core Diary (schema + backend + trainee diary page)
  └── Phase 2: Food Tracking (Nutritionix + food logger UI)
  └── Phase 3: Goals (schema + backend + goals UI)
  └── Phase 4: Progress Photos (upload + comparison)
  └── Phase 5: Charts (recharts + trend visualisations)
  └── Phase 6: PT View (progress tab + comments)
```

Phases 2-4 are independent of each other after Phase 1. Phase 5 depends on having data (any of 1-4). Phase 6 depends on all prior phases.

## Verification (per phase)

**Phase 1:** Trainee logs weight/water/measurements/mood/sleep → entries appear on diary page → navigate between dates → delete entry → `npx tsc --noEmit` clean

**Phase 2:** Search food → select and log → daily calorie total correct → per-meal breakdown shows → edit serving size → delete food entry

**Phase 3:** Create target goal → log entry that matches → currentValue auto-updates → create habit goal → log entries → weekly count tracks → complete/abandon goal

**Phase 4:** Upload progress photos → grid displays by date → select two dates → comparison slider works → category filter

**Phase 5:** Weight chart shows data points over 30 days → goal line overlaid → switch time ranges → all chart types render with data

**Phase 6:** PT opens client → Progress tab shows diary feed → PT creates goal for client → PT comments on entry → trainee sees comment on their diary page
