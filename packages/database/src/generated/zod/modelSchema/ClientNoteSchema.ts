import { z } from 'zod';


/////////////////////////////////////////
// CLIENT NOTE SCHEMA
/////////////////////////////////////////

export const ClientNoteSchema = z.object({
  id: z.string().cuid(),
  clientRosterId: z.string(),
  content: z.string().min(1, { message: "Note cannot be empty" }).max(2000, { message: "Note must be at most 2000 characters" }),
  createdAt: z.coerce.date(),
})

export type ClientNote = z.infer<typeof ClientNoteSchema>

/////////////////////////////////////////
// CLIENT NOTE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const ClientNoteOptionalDefaultsSchema = ClientNoteSchema.merge(z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type ClientNoteOptionalDefaults = z.infer<typeof ClientNoteOptionalDefaultsSchema>

export default ClientNoteSchema;
