import { z } from 'zod';
import { MealTypeSchema } from '@fitnassist/database';

export const mealPlanListSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export const getMealPlanSchema = z.object({
  id: z.string().cuid(),
});

export const createMealPlanSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(2000).optional().nullable(),
});

export const updateMealPlanSchema = z.object({
  id: z.string().cuid(),
}).merge(createMealPlanSchema.partial());

export const deleteMealPlanSchema = z.object({
  id: z.string().cuid(),
});

export const mealPlanRecipeItemSchema = z.object({
  recipeId: z.string().cuid(),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  mealType: MealTypeSchema.optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const setMealPlanRecipesSchema = z.object({
  id: z.string().cuid(),
  recipes: z.array(mealPlanRecipeItemSchema),
});

export type CreateMealPlanInput = z.infer<typeof createMealPlanSchema>;
export type UpdateMealPlanInput = z.infer<typeof updateMealPlanSchema>;
export type MealPlanRecipeItem = z.infer<typeof mealPlanRecipeItemSchema>;
export type SetMealPlanRecipesInput = z.infer<typeof setMealPlanRecipesSchema>;
