import { z } from 'zod';

/////////////////////////////////////////
// EXPO PUSH TOKEN SCHEMA
/////////////////////////////////////////

export const ExpoPushTokenSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  token: z.string(),
  platform: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type ExpoPushToken = z.infer<typeof ExpoPushTokenSchema>

/////////////////////////////////////////
// EXPO PUSH TOKEN OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const ExpoPushTokenOptionalDefaultsSchema = ExpoPushTokenSchema.merge(z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type ExpoPushTokenOptionalDefaults = z.infer<typeof ExpoPushTokenOptionalDefaultsSchema>

export default ExpoPushTokenSchema;
