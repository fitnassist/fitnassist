import { z } from 'zod';


export const WorkoutPlanScalarFieldEnumSchema = z.enum(['id','trainerId','name','description','createdAt','updatedAt']);

export default WorkoutPlanScalarFieldEnumSchema;
