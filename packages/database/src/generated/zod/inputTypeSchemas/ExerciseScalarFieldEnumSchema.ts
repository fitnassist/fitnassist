import { z } from 'zod';

export const ExerciseScalarFieldEnumSchema = z.enum(['id','trainerId','name','description','instructions','videoUrl','videoUploadUrl','thumbnailUrl','muscleGroups','equipment','difficulty','createdAt','updatedAt']);

export default ExerciseScalarFieldEnumSchema;
