import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'

/////////////////////////////////////////
// RECIPE SCHEMA
/////////////////////////////////////////

export const RecipeSchema = z.object({
  id: z.string().cuid(),
  trainerId: z.string(),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).max(100),
  description: z.string().max(2000, { message: "Description must be at most 2000 characters" }).nullable(),
  imageUrl: z.string().url({ message: "Must be a valid URL" }).nullable(),
  ingredients: JsonValueSchema,
  instructions: z.string().min(1, { message: "Instructions are required" }).max(5000, { message: "Instructions must be at most 5000 characters" }),
  calories: z.number().int().min(0).nullable(),
  proteinG: z.number().min(0).nullable(),
  carbsG: z.number().min(0).nullable(),
  fatG: z.number().min(0).nullable(),
  prepTimeMin: z.number().int().min(0).nullable(),
  cookTimeMin: z.number().int().min(0).nullable(),
  servings: z.number().int().min(1).nullable(),
  tags: z.string().array(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Recipe = z.infer<typeof RecipeSchema>

/////////////////////////////////////////
// RECIPE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const RecipeOptionalDefaultsSchema = RecipeSchema.merge(z.object({
  id: z.string().cuid().optional(),
  ingredients: JsonValueSchema,
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type RecipeOptionalDefaults = z.infer<typeof RecipeOptionalDefaultsSchema>

export default RecipeSchema;
