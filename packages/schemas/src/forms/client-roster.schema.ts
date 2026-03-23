import { z } from 'zod';

export const clientRosterListSchema = z.object({
  status: z.enum(['ONBOARDING', 'ACTIVE', 'INACTIVE', 'ON_HOLD']).optional(),
  includeDisconnected: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export type ClientRosterListInput = z.infer<typeof clientRosterListSchema>;

export const getClientSchema = z.object({
  id: z.string().cuid(),
});

export type GetClientInput = z.infer<typeof getClientSchema>;

export const updateClientStatusSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(['ONBOARDING', 'ACTIVE', 'INACTIVE', 'ON_HOLD']),
});

export type UpdateClientStatusInput = z.infer<typeof updateClientStatusSchema>;

export const createClientNoteSchema = z.object({
  clientRosterId: z.string().cuid(),
  content: z.string().min(1, 'Note cannot be empty').max(2000, 'Note must be at most 2000 characters'),
});

export type CreateClientNoteInput = z.infer<typeof createClientNoteSchema>;

export const deleteClientNoteSchema = z.object({
  id: z.string().cuid(),
});

export type DeleteClientNoteInput = z.infer<typeof deleteClientNoteSchema>;

export const getClientNotesSchema = z.object({
  clientRosterId: z.string().cuid(),
});

export type GetClientNotesInput = z.infer<typeof getClientNotesSchema>;

export const assignWorkoutPlanSchema = z.object({
  clientRosterId: z.string().cuid(),
  workoutPlanId: z.string().cuid(),
  planName: z.string().optional(),
});

export const unassignWorkoutPlanSchema = z.object({
  clientRosterId: z.string().cuid(),
  workoutPlanId: z.string().cuid(),
});

export const assignMealPlanSchema = z.object({
  clientRosterId: z.string().cuid(),
  mealPlanId: z.string().cuid(),
  planName: z.string().optional(),
});

export const unassignMealPlanSchema = z.object({
  clientRosterId: z.string().cuid(),
  mealPlanId: z.string().cuid(),
});

export const bulkAssignPlanSchema = z.object({
  clientIds: z.array(z.string().cuid()).min(1, 'Select at least one client'),
  workoutPlanId: z.string().cuid().optional().nullable(),
  mealPlanId: z.string().cuid().optional().nullable(),
});

export type BulkAssignPlanInput = z.infer<typeof bulkAssignPlanSchema>;
