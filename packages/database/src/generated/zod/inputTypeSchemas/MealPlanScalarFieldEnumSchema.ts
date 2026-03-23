import { z } from 'zod';

export const MealPlanScalarFieldEnumSchema = z.enum(['id','trainerId','name','description','createdAt','updatedAt']);

export default MealPlanScalarFieldEnumSchema;
