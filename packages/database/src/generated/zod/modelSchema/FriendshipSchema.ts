import { z } from 'zod';
import { FriendshipStatusSchema } from '../inputTypeSchemas/FriendshipStatusSchema'

/////////////////////////////////////////
// FRIENDSHIP SCHEMA
/////////////////////////////////////////

export const FriendshipSchema = z.object({
  status: FriendshipStatusSchema,
  id: z.string().cuid(),
  requesterId: z.string(),
  addresseeId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Friendship = z.infer<typeof FriendshipSchema>

/////////////////////////////////////////
// FRIENDSHIP OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const FriendshipOptionalDefaultsSchema = FriendshipSchema.merge(z.object({
  status: FriendshipStatusSchema.optional(),
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type FriendshipOptionalDefaults = z.infer<typeof FriendshipOptionalDefaultsSchema>

export default FriendshipSchema;
