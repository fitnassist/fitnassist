import { z } from 'zod';


/////////////////////////////////////////
// WORKOUT PLAN SCHEMA
/////////////////////////////////////////

export const WorkoutPlanSchema = z.object({
  id: z.string().cuid(),
  trainerId: z.string(),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).max(100),
  description: z.string().max(2000, { message: "Description must be at most 2000 characters" }).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type WorkoutPlan = z.infer<typeof WorkoutPlanSchema>

/////////////////////////////////////////
// WORKOUT PLAN OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const WorkoutPlanOptionalDefaultsSchema = WorkoutPlanSchema.merge(z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type WorkoutPlanOptionalDefaults = z.infer<typeof WorkoutPlanOptionalDefaultsSchema>

export default WorkoutPlanSchema;
