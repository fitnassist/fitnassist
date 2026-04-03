import { z } from "zod";

export const workoutPlanListSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export const getWorkoutPlanSchema = z.object({
  id: z.string().cuid(),
});

export const createWorkoutPlanSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(2000).optional().nullable(),
});

export const updateWorkoutPlanSchema = z
  .object({
    id: z.string().cuid(),
  })
  .merge(createWorkoutPlanSchema.partial());

export const deleteWorkoutPlanSchema = z.object({
  id: z.string().cuid(),
});

export const workoutExerciseItemSchema = z.object({
  exerciseId: z.string().cuid(),
  sets: z.number().int().min(1).optional().nullable(),
  reps: z.string().max(50).optional().nullable(),
  restSeconds: z.number().int().min(0).optional().nullable(),
  targetWeight: z.number().min(0).optional().nullable(),
  weightUnit: z.enum(["kg", "lbs"]).optional().nullable(),
  targetDuration: z.string().max(50).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const setWorkoutExercisesSchema = z.object({
  id: z.string().cuid(),
  exercises: z.array(workoutExerciseItemSchema),
});

export type CreateWorkoutPlanInput = z.infer<typeof createWorkoutPlanSchema>;
export type UpdateWorkoutPlanInput = z.infer<typeof updateWorkoutPlanSchema>;
export type WorkoutExerciseItem = z.infer<typeof workoutExerciseItemSchema>;
export type SetWorkoutExercisesInput = z.infer<
  typeof setWorkoutExercisesSchema
>;
