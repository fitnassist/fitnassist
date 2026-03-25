import { z } from 'zod';
import { MealTypeSchema } from '../inputTypeSchemas/MealTypeSchema'

/////////////////////////////////////////
// FOOD ENTRY SCHEMA
/////////////////////////////////////////

export const FoodEntrySchema = z.object({
  mealType: MealTypeSchema,
  id: z.string().cuid(),
  diaryEntryId: z.string(),
  name: z.string().min(1, { message: "Food name is required" }),
  calories: z.number().int().min(0, { message: "Calories cannot be negative" }),
  proteinG: z.number().min(0).nullable(),
  carbsG: z.number().min(0).nullable(),
  fatG: z.number().min(0).nullable(),
  fibreG: z.number().min(0).nullable(),
  servingSize: z.number().positive({ message: "Serving size must be positive" }),
  servingUnit: z.string(),
  externalId: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  createdAt: z.coerce.date(),
})

export type FoodEntry = z.infer<typeof FoodEntrySchema>

/////////////////////////////////////////
// FOOD ENTRY OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const FoodEntryOptionalDefaultsSchema = FoodEntrySchema.merge(z.object({
  id: z.string().cuid().optional(),
  servingSize: z.number().positive({ message: "Serving size must be positive" }).optional(),
  servingUnit: z.string().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type FoodEntryOptionalDefaults = z.infer<typeof FoodEntryOptionalDefaultsSchema>

export default FoodEntrySchema;
