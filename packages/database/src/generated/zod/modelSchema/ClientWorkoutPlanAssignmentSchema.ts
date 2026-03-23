import { z } from 'zod';

/////////////////////////////////////////
// CLIENT WORKOUT PLAN ASSIGNMENT SCHEMA
/////////////////////////////////////////

export const ClientWorkoutPlanAssignmentSchema = z.object({
  id: z.string().cuid(),
  clientRosterId: z.string(),
  workoutPlanId: z.string(),
  assignedAt: z.coerce.date(),
})

export type ClientWorkoutPlanAssignment = z.infer<typeof ClientWorkoutPlanAssignmentSchema>

/////////////////////////////////////////
// CLIENT WORKOUT PLAN ASSIGNMENT OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const ClientWorkoutPlanAssignmentOptionalDefaultsSchema = ClientWorkoutPlanAssignmentSchema.merge(z.object({
  id: z.string().cuid().optional(),
  assignedAt: z.coerce.date().optional(),
}))

export type ClientWorkoutPlanAssignmentOptionalDefaults = z.infer<typeof ClientWorkoutPlanAssignmentOptionalDefaultsSchema>

export default ClientWorkoutPlanAssignmentSchema;
