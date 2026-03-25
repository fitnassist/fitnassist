import { z } from 'zod';

/////////////////////////////////////////
// MEAL PLAN SCHEMA
/////////////////////////////////////////

export const MealPlanSchema = z.object({
  id: z.string().cuid(),
  trainerId: z.string(),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).max(100),
  description: z.string().max(2000, { message: "Description must be at most 2000 characters" }).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type MealPlan = z.infer<typeof MealPlanSchema>

/////////////////////////////////////////
// MEAL PLAN OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const MealPlanOptionalDefaultsSchema = MealPlanSchema.merge(z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type MealPlanOptionalDefaults = z.infer<typeof MealPlanOptionalDefaultsSchema>

export default MealPlanSchema;
