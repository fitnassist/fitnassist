import { MealTypeSchema } from '../inputTypeSchemas/MealTypeSchema'

/////////////////////////////////////////
// MEAL PLAN RECIPE SCHEMA
/////////////////////////////////////////

export const MealPlanRecipeSchema = z.object({
  mealType: MealTypeSchema.nullable(),
  id: z.string().cuid(),
  mealPlanId: z.string(),
  recipeId: z.string(),
  dayOfWeek: z.number().int().nullable(),
  sortOrder: z.number().int(),
})

export type MealPlanRecipe = z.infer<typeof MealPlanRecipeSchema>

/////////////////////////////////////////
// MEAL PLAN RECIPE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const MealPlanRecipeOptionalDefaultsSchema = MealPlanRecipeSchema.merge(z.object({
  id: z.string().cuid().optional(),
  sortOrder: z.number().int().optional(),
}))

export type MealPlanRecipeOptionalDefaults = z.infer<typeof MealPlanRecipeOptionalDefaultsSchema>

export default MealPlanRecipeSchema;
