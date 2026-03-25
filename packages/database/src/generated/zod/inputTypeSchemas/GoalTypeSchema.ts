import { z } from 'zod';

export const GoalTypeSchema = z.enum(['TARGET','HABIT']);

export type GoalTypeType = `${z.infer<typeof GoalTypeSchema>}`

export default GoalTypeSchema;
