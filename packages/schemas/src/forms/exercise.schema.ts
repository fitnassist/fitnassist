import { z } from 'zod';
import { MuscleGroupSchema, ExperienceLevelSchema } from '@fitnassist/database';

// Allow empty string or valid URL
const optionalUrl = z.string().refine(
  (v) => v === '' || z.string().url().safeParse(v).success,
  { message: 'Must be a valid URL' }
).optional().nullable();

export const exerciseListSchema = z.object({
  search: z.string().optional(),
  muscleGroup: MuscleGroupSchema.optional(),
  difficulty: ExperienceLevelSchema.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export const getExerciseSchema = z.object({
  id: z.string().cuid(),
});

export const createExerciseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(2000).optional().nullable(),
  instructions: z.string().max(5000).optional().nullable(),
  videoUrl: optionalUrl,
  videoUploadUrl: optionalUrl,
  thumbnailUrl: optionalUrl,
  muscleGroups: z.array(MuscleGroupSchema).default([]),
  equipment: z.array(z.string()).default([]),
  difficulty: ExperienceLevelSchema.optional().nullable(),
}).refine(
  (data) => {
    const hasInstructions = !!data.instructions?.trim();
    const hasVideo = !!data.videoUrl?.trim() || !!data.videoUploadUrl?.trim();
    return hasInstructions || hasVideo;
  },
  {
    message: 'Please provide either instructions or a video (or both)',
    path: ['instructions'],
  }
);

export const updateExerciseSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  description: z.string().max(2000).optional().nullable(),
  instructions: z.string().max(5000).optional().nullable(),
  videoUrl: optionalUrl,
  videoUploadUrl: optionalUrl,
  thumbnailUrl: optionalUrl,
  muscleGroups: z.array(MuscleGroupSchema).optional(),
  equipment: z.array(z.string()).optional(),
  difficulty: ExperienceLevelSchema.optional().nullable(),
});

export const deleteExerciseSchema = z.object({
  id: z.string().cuid(),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
export type ExerciseListInput = z.infer<typeof exerciseListSchema>;
