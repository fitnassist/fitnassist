import { z } from 'zod';

// =============================================================================
// LOG ENTRIES
// =============================================================================

export const logWeightSchema = z.object({
  clientRosterId: z.string().cuid().optional(),
  date: z.string().date(),
  weightKg: z.number().positive({ message: 'Weight must be a positive number' }),
});
export type LogWeightInput = z.infer<typeof logWeightSchema>;

export const logWaterSchema = z.object({
  clientRosterId: z.string().cuid().optional(),
  date: z.string().date(),
  totalMl: z.number().int().min(0, { message: 'Water intake cannot be negative' }),
});
export type LogWaterInput = z.infer<typeof logWaterSchema>;

export const logMeasurementsSchema = z.object({
  clientRosterId: z.string().cuid().optional(),
  date: z.string().date(),
  chestCm: z.number().min(0).nullable().optional(),
  waistCm: z.number().min(0).nullable().optional(),
  hipsCm: z.number().min(0).nullable().optional(),
  bicepCm: z.number().min(0).nullable().optional(),
  thighCm: z.number().min(0).nullable().optional(),
  calfCm: z.number().min(0).nullable().optional(),
  neckCm: z.number().min(0).nullable().optional(),
});
export type LogMeasurementsInput = z.infer<typeof logMeasurementsSchema>;

export const logMoodSchema = z.object({
  clientRosterId: z.string().cuid().optional(),
  date: z.string().date(),
  level: z.enum(['TERRIBLE', 'BAD', 'OKAY', 'GOOD', 'GREAT']),
  notes: z.string().max(500).optional(),
});
export type LogMoodInput = z.infer<typeof logMoodSchema>;

export const logSleepSchema = z.object({
  clientRosterId: z.string().cuid().optional(),
  date: z.string().date(),
  hoursSlept: z.number().min(0).max(24),
  quality: z.number().int().min(1).max(5),
});
export type LogSleepInput = z.infer<typeof logSleepSchema>;

// =============================================================================
// FOOD ENTRIES
// =============================================================================

const foodItemSchema = z.object({
  name: z.string().min(1, { message: 'Food name is required' }),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
  calories: z.number().int().min(0),
  proteinG: z.number().min(0).optional(),
  carbsG: z.number().min(0).optional(),
  fatG: z.number().min(0).optional(),
  fibreG: z.number().min(0).optional(),
  servingSize: z.number().positive().default(1),
  servingUnit: z.string().default('serving'),
  externalId: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
});

export const logFoodSchema = z.object({
  clientRosterId: z.string().cuid().optional(),
  date: z.string().date(),
  items: z.array(foodItemSchema).min(1, { message: 'At least one food item is required' }),
});
export type LogFoodInput = z.infer<typeof logFoodSchema>;

export const updateFoodEntrySchema = z.object({
  id: z.string().cuid(),
  servingSize: z.number().positive().optional(),
  calories: z.number().int().min(0).optional(),
  proteinG: z.number().min(0).nullable().optional(),
  carbsG: z.number().min(0).nullable().optional(),
  fatG: z.number().min(0).nullable().optional(),
});
export type UpdateFoodEntryInput = z.infer<typeof updateFoodEntrySchema>;

export const deleteFoodEntrySchema = z.object({
  id: z.string().cuid(),
});
export type DeleteFoodEntryInput = z.infer<typeof deleteFoodEntrySchema>;

export const searchFoodSchema = z.object({
  query: z.string().min(1).max(200),
});
export type SearchFoodInput = z.infer<typeof searchFoodSchema>;

export const lookupBarcodeSchema = z.object({
  barcode: z.string().min(8).max(14),
});
export type LookupBarcodeInput = z.infer<typeof lookupBarcodeSchema>;

export const getDailyNutritionSchema = z.object({
  userId: z.string().min(1).optional(),
  date: z.string().date(),
});
export type GetDailyNutritionInput = z.infer<typeof getDailyNutritionSchema>;

// =============================================================================
// QUERIES
// =============================================================================

export const getDiaryEntriesSchema = z.object({
  userId: z.string().min(1).optional(),
  date: z.string().date(),
});
export type GetDiaryEntriesInput = z.infer<typeof getDiaryEntriesSchema>;

export const getDiaryRangeSchema = z.object({
  userId: z.string().min(1).optional(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  type: z.enum(['WEIGHT', 'WATER', 'MEASUREMENT', 'MOOD', 'SLEEP', 'FOOD', 'WORKOUT_LOG', 'PROGRESS_PHOTO', 'STEPS', 'ACTIVITY']).optional(),
});
export type GetDiaryRangeInput = z.infer<typeof getDiaryRangeSchema>;

// =============================================================================
// WORKOUT LOG
// =============================================================================

export const logWorkoutSchema = z.object({
  clientRosterId: z.string().cuid().optional(),
  date: z.string().date(),
  workoutPlanId: z.string().cuid().optional(),
  workoutPlanName: z.string().optional(),
  durationMinutes: z.number().int().min(1, { message: 'Duration must be at least 1 minute' }),
  caloriesBurned: z.number().int().min(0, { message: 'Calories burned cannot be negative' }).optional(),
  notes: z.string().max(500).optional(),
});
export type LogWorkoutInput = z.infer<typeof logWorkoutSchema>;

// =============================================================================
// ACTIVITY
// =============================================================================

export const logActivitySchema = z.object({
  clientRosterId: z.string().cuid().optional(),
  date: z.string().date(),
  activityType: z.enum(['RUN', 'WALK', 'CYCLE', 'SWIM', 'HIKE', 'OTHER']),
  activityName: z.string().max(100).optional(),
  distanceKm: z.number().min(0).optional(),
  durationSeconds: z.number().int().min(1, { message: 'Duration must be at least 1 second' }),
  elevationGainM: z.number().min(0).optional(),
  caloriesBurned: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
  // Integration sync fields
  source: z.enum(['MANUAL', 'STRAVA', 'GARMIN', 'APPLE_HEALTH', 'GOOGLE_FIT', 'FITBIT']).optional(),
  externalId: z.string().optional(),
  routePolyline: z.string().optional(),
  startLatitude: z.number().optional(),
  startLongitude: z.number().optional(),
  endLatitude: z.number().optional(),
  endLongitude: z.number().optional(),
  avgHeartRate: z.number().int().min(0).optional(),
  maxHeartRate: z.number().int().min(0).optional(),
});
export type LogActivityInput = z.infer<typeof logActivitySchema>;

// =============================================================================
// PERSONAL BESTS
// =============================================================================

export const getPersonalBestsSchema = z.object({
  userId: z.string().min(1).optional(),
});
export type GetPersonalBestsInput = z.infer<typeof getPersonalBestsSchema>;

// =============================================================================
// STEPS
// =============================================================================

export const logStepsSchema = z.object({
  clientRosterId: z.string().cuid().optional(),
  date: z.string().date(),
  totalSteps: z.number().int().min(0, { message: 'Steps cannot be negative' }),
});
export type LogStepsInput = z.infer<typeof logStepsSchema>;

// =============================================================================
// PROGRESS PHOTOS
// =============================================================================

export const logProgressPhotosSchema = z.object({
  clientRosterId: z.string().cuid().optional(),
  date: z.string().date(),
  photos: z.array(z.object({
    imageUrl: z.string().url(),
    category: z.string().optional(),
    notes: z.string().max(500).optional(),
    sortOrder: z.number().int().min(0).default(0),
  })).min(1, { message: 'At least one photo is required' }),
});
export type LogProgressPhotosInput = z.infer<typeof logProgressPhotosSchema>;

export const getProgressPhotosSchema = z.object({
  userId: z.string().min(1).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});
export type GetProgressPhotosInput = z.infer<typeof getProgressPhotosSchema>;

// =============================================================================
// COMMENTS
// =============================================================================

export const addDiaryCommentSchema = z.object({
  diaryEntryId: z.string().cuid(),
  content: z.string().min(1, { message: 'Comment cannot be empty' }).max(1000, { message: 'Comment must be at most 1000 characters' }),
});
export type AddDiaryCommentInput = z.infer<typeof addDiaryCommentSchema>;

export const getDiaryCommentsSchema = z.object({
  diaryEntryId: z.string().cuid(),
});
export type GetDiaryCommentsInput = z.infer<typeof getDiaryCommentsSchema>;

export const deleteDiaryCommentSchema = z.object({
  id: z.string().cuid(),
});
export type DeleteDiaryCommentInput = z.infer<typeof deleteDiaryCommentSchema>;

// =============================================================================
// ACTIVITY FEED
// =============================================================================

export const getRecentClientActivitySchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
});
export type GetRecentClientActivityInput = z.infer<typeof getRecentClientActivitySchema>;

// =============================================================================
// DELETE
// =============================================================================

export const deleteProgressPhotoSchema = z.object({
  id: z.string().cuid(),
});
export type DeleteProgressPhotoInput = z.infer<typeof deleteProgressPhotoSchema>;

export const deleteDiaryEntrySchema = z.object({
  id: z.string().cuid(),
});
export type DeleteDiaryEntryInput = z.infer<typeof deleteDiaryEntrySchema>;
