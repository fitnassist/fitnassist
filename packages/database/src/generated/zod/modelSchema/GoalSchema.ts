import { z } from 'zod';
import { GoalTypeSchema } from '../inputTypeSchemas/GoalTypeSchema'
import { GoalStatusSchema } from '../inputTypeSchemas/GoalStatusSchema'
import { DiaryEntryTypeSchema } from '../inputTypeSchemas/DiaryEntryTypeSchema'

/////////////////////////////////////////
// GOAL SCHEMA
/////////////////////////////////////////

export const GoalSchema = z.object({
  type: GoalTypeSchema,
  status: GoalStatusSchema,
  entryType: DiaryEntryTypeSchema.nullable(),
  habitEntryType: DiaryEntryTypeSchema.nullable(),
  id: z.string().cuid(),
  userId: z.string(),
  createdById: z.string(),
  name: z.string().min(1, { message: "Goal name is required" }).max(200, { message: "Goal name must be at most 200 characters" }),
  description: z.string().max(1000, { message: "Description must be at most 1000 characters" }).nullable(),
  targetValue: z.number().nullable(),
  targetUnit: z.string().nullable(),
  currentValue: z.number().nullable(),
  entryField: z.string().nullable(),
  frequencyPerWeek: z.number().int().min(1, { message: "Frequency must be at least 1" }).max(7, { message: "Frequency must be at most 7" }).nullable(),
  deadline: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Goal = z.infer<typeof GoalSchema>

/////////////////////////////////////////
// GOAL OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const GoalOptionalDefaultsSchema = GoalSchema.merge(z.object({
  status: GoalStatusSchema.optional(),
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type GoalOptionalDefaults = z.infer<typeof GoalOptionalDefaultsSchema>

export default GoalSchema;
