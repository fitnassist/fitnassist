import { z } from 'zod';


export const ExperienceLevelSchema = z.enum(['BEGINNER','INTERMEDIATE','ADVANCED']);

export type ExperienceLevelType = `${z.infer<typeof ExperienceLevelSchema>}`

export default ExperienceLevelSchema;
