import { z } from 'zod';

// Allow empty string or valid URL
const optionalUrl = z.string().refine(
  (v) => v === '' || z.string().url().safeParse(v).success,
  { message: 'Must be a valid URL' }
).optional().nullable();

// Accept NaN from empty number inputs and treat as null
const optionalNumber = z.preprocess(
  (v) => (v === '' || (typeof v === 'number' && isNaN(v)) ? null : v),
  z.number().min(0).optional().nullable()
);
const optionalInt = z.preprocess(
  (v) => (v === '' || (typeof v === 'number' && isNaN(v)) ? null : v),
  z.number().int().min(0).optional().nullable()
);
const optionalIntMin1 = z.preprocess(
  (v) => (v === '' || (typeof v === 'number' && isNaN(v)) ? null : v),
  z.number().int().min(1).optional().nullable()
);

export const ingredientSchema = z.object({
  name: z.string(),
  quantity: z.string().optional(),
  unit: z.string().optional(),
});

export const recipeListSchema = z.object({
  search: z.string().optional(),
  tag: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export const getRecipeSchema = z.object({
  id: z.string().cuid(),
});

export const createRecipeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: optionalUrl,
  ingredients: z.array(ingredientSchema).default([]),
  instructions: z.string().min(1, 'Instructions are required').max(5000),
  calories: optionalInt,
  proteinG: optionalNumber,
  carbsG: optionalNumber,
  fatG: optionalNumber,
  prepTimeMin: optionalInt,
  cookTimeMin: optionalInt,
  servings: optionalIntMin1,
  tags: z.array(z.string()).default([]),
});

export const updateRecipeSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: optionalUrl,
  ingredients: z.array(ingredientSchema).optional(),
  instructions: z.string().min(1).max(5000).optional(),
  calories: optionalInt,
  proteinG: optionalNumber,
  carbsG: optionalNumber,
  fatG: optionalNumber,
  prepTimeMin: optionalInt,
  cookTimeMin: optionalInt,
  servings: optionalIntMin1,
  tags: z.array(z.string()).optional(),
});

export const deleteRecipeSchema = z.object({
  id: z.string().cuid(),
});

export type Ingredient = z.infer<typeof ingredientSchema>;
export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
export type RecipeListInput = z.infer<typeof recipeListSchema>;
