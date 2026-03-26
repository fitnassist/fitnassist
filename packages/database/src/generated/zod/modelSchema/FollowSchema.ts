import { z } from 'zod';

/////////////////////////////////////////
// FOLLOW SCHEMA
/////////////////////////////////////////

export const FollowSchema = z.object({
  id: z.string().cuid(),
  followerId: z.string(),
  followingId: z.string(),
  createdAt: z.coerce.date(),
})

export type Follow = z.infer<typeof FollowSchema>

/////////////////////////////////////////
// FOLLOW OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const FollowOptionalDefaultsSchema = FollowSchema.merge(z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type FollowOptionalDefaults = z.infer<typeof FollowOptionalDefaultsSchema>

export default FollowSchema;
