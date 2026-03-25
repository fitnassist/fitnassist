import { z } from 'zod';


/////////////////////////////////////////
// CLIENT MEAL PLAN ASSIGNMENT SCHEMA
/////////////////////////////////////////

export const ClientMealPlanAssignmentSchema = z.object({
  id: z.string().cuid(),
  clientRosterId: z.string(),
  mealPlanId: z.string(),
  assignedAt: z.coerce.date(),
})

export type ClientMealPlanAssignment = z.infer<typeof ClientMealPlanAssignmentSchema>

/////////////////////////////////////////
// CLIENT MEAL PLAN ASSIGNMENT OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const ClientMealPlanAssignmentOptionalDefaultsSchema = ClientMealPlanAssignmentSchema.merge(z.object({
  id: z.string().cuid().optional(),
  assignedAt: z.coerce.date().optional(),
}))

export type ClientMealPlanAssignmentOptionalDefaults = z.infer<typeof ClientMealPlanAssignmentOptionalDefaultsSchema>

export default ClientMealPlanAssignmentSchema;
