import { z } from 'zod';
import { GenderSchema } from '../inputTypeSchemas/GenderSchema'
import { UnitPreferenceSchema } from '../inputTypeSchemas/UnitPreferenceSchema'
import { ExperienceLevelSchema } from '../inputTypeSchemas/ExperienceLevelSchema'
import { ActivityLevelSchema } from '../inputTypeSchemas/ActivityLevelSchema'
import { VisibilitySchema } from '../inputTypeSchemas/VisibilitySchema'

/////////////////////////////////////////
// TRAINEE PROFILE SCHEMA
/////////////////////////////////////////

export const TraineeProfileSchema = z.object({
  gender: GenderSchema.nullable(),
  unitPreference: UnitPreferenceSchema,
  experienceLevel: ExperienceLevelSchema.nullable(),
  activityLevel: ActivityLevelSchema.nullable(),
  privacyBio: VisibilitySchema,
  privacyLocation: VisibilitySchema,
  privacyBodyMetrics: VisibilitySchema,
  privacyGoals: VisibilitySchema,
  privacyPersonalBests: VisibilitySchema,
  privacyProgressPhotos: VisibilitySchema,
  privacyStats: VisibilitySchema,
  privacyTrendWeight: VisibilitySchema,
  privacyTrendMeasurements: VisibilitySchema,
  privacyTrendNutrition: VisibilitySchema,
  privacyTrendWater: VisibilitySchema,
  privacyTrendMood: VisibilitySchema,
  privacyTrendSleep: VisibilitySchema,
  privacyTrendActivity: VisibilitySchema,
  privacyTrendSteps: VisibilitySchema,
  id: z.string().cuid(),
  userId: z.string(),
  handle: z.string().min(3, { message: "Handle must be at least 3 characters" }).max(30, { message: "Handle must be at most 30 characters" }).regex(/^[a-z0-9_-]+$/, { message: "Handle can only contain lowercase letters, numbers, hyphens, or underscores" }).nullable(),
  avatarUrl: z.string().url({ message: "Must be a valid URL" }).nullable(),
  bio: z.string().max(2000, { message: "Bio must be at most 2000 characters" }).nullable(),
  dateOfBirth: z.coerce.date().nullable(),
  heightCm: z.number().min(50).max(300).nullable(),
  startWeightKg: z.number().min(20).max(500).nullable(),
  goalWeightKg: z.number().min(20).max(500).nullable(),
  fitnessGoals: z.string().array(),
  fitnessGoalNotes: z.string().max(2000, { message: "Fitness goal notes must be at most 2000 characters" }).nullable(),
  medicalNotes: z.string().max(2000, { message: "Medical notes must be at most 2000 characters" }).nullable(),
  weeklyWeightGoalKg: z.number().min(-1).max(0.5).nullable(),
  dailyCalorieTarget: z.number().int().min(0).nullable(),
  dailyProteinTargetG: z.number().min(0).nullable(),
  dailyCarbsTargetG: z.number().min(0).nullable(),
  dailyFatTargetG: z.number().min(0).nullable(),
  dailyWaterTargetMl: z.number().int().min(0).nullable(),
  addressLine1: z.string().max(100).nullable(),
  addressLine2: z.string().max(100).nullable(),
  city: z.string().max(100).nullable(),
  county: z.string().max(50).nullable(),
  postcode: z.string().max(20).nullable(),
  country: z.string(),
  placeId: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  location: z.string().max(200).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type TraineeProfile = z.infer<typeof TraineeProfileSchema>

/////////////////////////////////////////
// TRAINEE PROFILE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const TraineeProfileOptionalDefaultsSchema = TraineeProfileSchema.merge(z.object({
  unitPreference: UnitPreferenceSchema.optional(),
  privacyBio: VisibilitySchema.optional(),
  privacyLocation: VisibilitySchema.optional(),
  privacyBodyMetrics: VisibilitySchema.optional(),
  privacyGoals: VisibilitySchema.optional(),
  privacyPersonalBests: VisibilitySchema.optional(),
  privacyProgressPhotos: VisibilitySchema.optional(),
  privacyStats: VisibilitySchema.optional(),
  privacyTrendWeight: VisibilitySchema.optional(),
  privacyTrendMeasurements: VisibilitySchema.optional(),
  privacyTrendNutrition: VisibilitySchema.optional(),
  privacyTrendWater: VisibilitySchema.optional(),
  privacyTrendMood: VisibilitySchema.optional(),
  privacyTrendSleep: VisibilitySchema.optional(),
  privacyTrendActivity: VisibilitySchema.optional(),
  privacyTrendSteps: VisibilitySchema.optional(),
  id: z.string().cuid().optional(),
  country: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type TraineeProfileOptionalDefaults = z.infer<typeof TraineeProfileOptionalDefaultsSchema>

export default TraineeProfileSchema;
