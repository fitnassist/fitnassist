import { z } from 'zod';

// =============================================================================
// TRAINEE PROFILE SCHEMAS
// =============================================================================

export const createTraineeProfileSchema = z.object({
  // Personal info
  avatarUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  bio: z.string().max(2000, 'Bio must be at most 2000 characters').optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY']).optional(),

  // Body metrics (stored in metric, display converted by unitPreference)
  heightCm: z.number().min(50).max(300).optional(),
  startWeightKg: z.number().min(20).max(500).optional(),
  goalWeightKg: z.number().min(20).max(500).optional(),
  unitPreference: z.enum(['METRIC', 'IMPERIAL']).default('METRIC'),

  // Fitness info
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  activityLevel: z.enum(['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTREMELY_ACTIVE']).optional(),
  fitnessGoals: z.array(z.string()).default([]),
  fitnessGoalNotes: z.string().max(2000, 'Fitness goal notes must be at most 2000 characters').optional().or(z.literal('')),
  medicalNotes: z.string().max(2000, 'Medical notes must be at most 2000 characters').optional().or(z.literal('')),

  // Weight goal (kg per week: negative = lose, positive = gain, 0 = maintain)
  weeklyWeightGoalKg: z.number().min(-1).max(0.5).optional(),

  // Daily nutrition targets (null/undefined = auto-calculated)
  dailyCalorieTarget: z.number().int().min(0).optional(),
  dailyProteinTargetG: z.number().min(0).optional(),
  dailyCarbsTargetG: z.number().min(0).optional(),
  dailyFatTargetG: z.number().min(0).optional(),
  dailyWaterTargetMl: z.number().int().min(0).optional(),

  // Address (structured)
  addressLine1: z.string().max(100).optional().or(z.literal('')),
  addressLine2: z.string().max(100).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  county: z.string().max(50).optional().or(z.literal('')),
  postcode: z.string().max(20).optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  placeId: z.string().optional().or(z.literal('')),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),

  // Other
  location: z.string().max(200).optional().or(z.literal('')),
  isPublic: z.boolean().default(false),
});

export type CreateTraineeProfileInput = z.infer<typeof createTraineeProfileSchema>;

export const updateTraineeProfileSchema = createTraineeProfileSchema.partial();

export type UpdateTraineeProfileInput = z.infer<typeof updateTraineeProfileSchema>;
