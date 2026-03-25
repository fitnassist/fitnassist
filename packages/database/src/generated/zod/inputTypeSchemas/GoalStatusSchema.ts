

export const GoalStatusSchema = z.enum(['ACTIVE','COMPLETED','ABANDONED']);

export type GoalStatusType = `${z.infer<typeof GoalStatusSchema>}`

export default GoalStatusSchema;
