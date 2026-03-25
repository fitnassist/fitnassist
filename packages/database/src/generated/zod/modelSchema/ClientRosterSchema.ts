import { z } from 'zod';
import { ClientStatusSchema } from '../inputTypeSchemas/ClientStatusSchema'

/////////////////////////////////////////
// CLIENT ROSTER SCHEMA
/////////////////////////////////////////

export const ClientRosterSchema = z.object({
  status: ClientStatusSchema,
  id: z.string().cuid(),
  trainerId: z.string(),
  connectionId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type ClientRoster = z.infer<typeof ClientRosterSchema>

/////////////////////////////////////////
// CLIENT ROSTER OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const ClientRosterOptionalDefaultsSchema = ClientRosterSchema.merge(z.object({
  status: ClientStatusSchema.optional(),
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type ClientRosterOptionalDefaults = z.infer<typeof ClientRosterOptionalDefaultsSchema>

export default ClientRosterSchema;
