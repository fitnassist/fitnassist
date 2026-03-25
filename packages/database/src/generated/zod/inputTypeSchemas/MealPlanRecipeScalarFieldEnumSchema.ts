import { z } from 'zod';


export const MealPlanRecipeScalarFieldEnumSchema = z.enum(['id','mealPlanId','recipeId','dayOfWeek','mealType','sortOrder']);

export default MealPlanRecipeScalarFieldEnumSchema;
