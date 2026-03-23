import { z } from 'zod';
import { GenderSchema } from '../inputTypeSchemas/GenderSchema'
import { UnitPreferenceSchema } from '../inputTypeSchemas/UnitPreferenceSchema'
import { ExperienceLevelSchema } from '../inputTypeSchemas/ExperienceLevelSchema'
import { ActivityLevelSchema } from '../inputTypeSchemas/ActivityLevelSchema'

/////////////////////////////////////////
// TRAINEE PROFILE SCHEMA
/////////////////////////////////////////

export const TraineeProfileSchema = z.object({
  gender: GenderSchema.nullable(),
  unitPreference: UnitPreferenceSchema,
  experienceLevel: ExperienceLevelSchema.nullable(),
  activityLevel: ActivityLevelSchema.nullable(),
  id: z.string().cuid(),
  userId: z.string(),
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
  location: z.string().max(200).nullable(),
  isPublic: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type TraineeProfile = z.infer<typeof TraineeProfileSchema>

/////////////////////////////////////////
// TRAINEE PROFILE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const TraineeProfileOptionalDefaultsSchema = TraineeProfileSchema.merge(z.object({
  unitPreference: UnitPreferenceSchema.optional(),
  id: z.string().cuid().optional(),
  isPublic: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type TraineeProfileOptionalDefaults = z.infer<typeof TraineeProfileOptionalDefaultsSchema>

export default TraineeProfileSchema;
