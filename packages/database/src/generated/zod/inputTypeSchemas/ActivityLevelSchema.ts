import { z } from 'zod';

export const ActivityLevelSchema = z.enum(['SEDENTARY','LIGHTLY_ACTIVE','MODERATELY_ACTIVE','VERY_ACTIVE','EXTREMELY_ACTIVE']);

export type ActivityLevelType = `${z.infer<typeof ActivityLevelSchema>}`

export default ActivityLevelSchema;
