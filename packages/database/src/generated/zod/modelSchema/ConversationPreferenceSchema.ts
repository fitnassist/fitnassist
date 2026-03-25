import { z } from 'zod';

/////////////////////////////////////////
// CONVERSATION PREFERENCE SCHEMA
/////////////////////////////////////////

export const ConversationPreferenceSchema = z.object({
  id: z.string().cuid(),
  connectionId: z.string(),
  userId: z.string(),
  isArchived: z.boolean(),
  deletedAt: z.coerce.date().nullable(),
})

export type ConversationPreference = z.infer<typeof ConversationPreferenceSchema>

/////////////////////////////////////////
// CONVERSATION PREFERENCE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const ConversationPreferenceOptionalDefaultsSchema = ConversationPreferenceSchema.merge(z.object({
  id: z.string().cuid().optional(),
  isArchived: z.boolean().optional(),
}))

export type ConversationPreferenceOptionalDefaults = z.infer<typeof ConversationPreferenceOptionalDefaultsSchema>

export default ConversationPreferenceSchema;
