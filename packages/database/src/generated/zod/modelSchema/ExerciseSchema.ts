import { z } from 'zod';
import { MuscleGroupSchema } from '../inputTypeSchemas/MuscleGroupSchema'
import { ExperienceLevelSchema } from '../inputTypeSchemas/ExperienceLevelSchema'

/////////////////////////////////////////
// EXERCISE SCHEMA
/////////////////////////////////////////

export const ExerciseSchema = z.object({
  muscleGroups: MuscleGroupSchema.array(),
  difficulty: ExperienceLevelSchema.nullable(),
  id: z.string().cuid(),
  trainerId: z.string(),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).max(100),
  description: z.string().max(2000, { message: "Description must be at most 2000 characters" }).nullable(),
  instructions: z.string().max(500, { message: "Instructions must be at most 500 characters" }).nullable(),
  videoUrl: z.string().url({ message: "Must be a valid URL" }).nullable(),
  videoUploadUrl: z.string().url({ message: "Must be a valid URL" }).nullable(),
  thumbnailUrl: z.string().url({ message: "Must be a valid URL" }).nullable(),
  equipment: z.string().array(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Exercise = z.infer<typeof ExerciseSchema>

/////////////////////////////////////////
// EXERCISE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const ExerciseOptionalDefaultsSchema = ExerciseSchema.merge(z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type ExerciseOptionalDefaults = z.infer<typeof ExerciseOptionalDefaultsSchema>

export default ExerciseSchema;
