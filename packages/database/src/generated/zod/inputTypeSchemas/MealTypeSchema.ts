

export const MealTypeSchema = z.enum(['BREAKFAST','LUNCH','DINNER','SNACK']);

export type MealTypeType = `${z.infer<typeof MealTypeSchema>}`

export default MealTypeSchema;
