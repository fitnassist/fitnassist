import { z } from 'zod';

// =============================================================================
// GOAL SCHEMAS
// =============================================================================

export const createGoalSchema = z.object({
  clientRosterId: z.string().cuid().optional(),
  name: z.string().min(1, { message: 'Goal name is required' }).max(200, { message: 'Goal name must be at most 200 characters' }),
  description: z.string().max(1000).optional(),
  type: z.enum(['TARGET', 'HABIT']),

  // TARGET fields
  targetValue: z.number().positive().optional(),
  targetUnit: z.string().max(20).optional(),
  currentValue: z.number().optional(),
  entryType: z.enum(['WEIGHT', 'WATER', 'MEASUREMENT', 'MOOD', 'SLEEP', 'FOOD', 'WORKOUT_LOG', 'PROGRESS_PHOTO', 'STEPS']).optional(),
  entryField: z.string().max(50).optional(),

  // HABIT fields
  frequencyPerWeek: z.number().int().min(1).max(7).optional(),
  habitEntryType: z.enum(['WEIGHT', 'WATER', 'MEASUREMENT', 'MOOD', 'SLEEP', 'FOOD', 'WORKOUT_LOG', 'PROGRESS_PHOTO', 'STEPS']).optional(),

  deadline: z.string().date().optional(),
}).refine((data) => {
  if (data.type === 'TARGET') {
    return data.targetValue !== undefined && data.targetUnit !== undefined;
  }
  return true;
}, { message: 'Target goals require a target value and unit', path: ['targetValue'] })
.refine((data) => {
  if (data.type === 'HABIT') {
    return data.frequencyPerWeek !== undefined && data.habitEntryType !== undefined;
  }
  return true;
}, { message: 'Habit goals require a frequency and entry type', path: ['frequencyPerWeek'] });

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  targetValue: z.number().positive().optional(),
  currentValue: z.number().optional(),
  frequencyPerWeek: z.number().int().min(1).max(7).optional(),
  deadline: z.string().date().nullable().optional(),
});
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

export const listGoalsSchema = z.object({
  clientRosterId: z.string().cuid().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ABANDONED']).optional(),
});
export type ListGoalsInput = z.infer<typeof listGoalsSchema>;

export const goalIdSchema = z.object({
  id: z.string().cuid(),
});
export type GoalIdInput = z.infer<typeof goalIdSchema>;

export const getRecentClientGoalUpdatesSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10),
});
export type GetRecentClientGoalUpdatesInput = z.infer<typeof getRecentClientGoalUpdatesSchema>;
