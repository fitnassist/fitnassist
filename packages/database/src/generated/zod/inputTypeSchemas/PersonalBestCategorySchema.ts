import { z } from 'zod';

export const PersonalBestCategorySchema = z.enum(['FASTEST_DISTANCE','LONGEST_DISTANCE','LONGEST_DURATION','HEAVIEST_WEIGHT','MOST_STEPS','CUSTOM']);

export type PersonalBestCategoryType = `${z.infer<typeof PersonalBestCategorySchema>}`

export default PersonalBestCategorySchema;
