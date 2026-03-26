import { z } from 'zod';

/////////////////////////////////////////
// USER BADGE SCHEMA
/////////////////////////////////////////

export const UserBadgeSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  badgeId: z.string(),
  earnedAt: z.coerce.date(),
})

export type UserBadge = z.infer<typeof UserBadgeSchema>

/////////////////////////////////////////
// USER BADGE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const UserBadgeOptionalDefaultsSchema = UserBadgeSchema.merge(z.object({
  id: z.string().cuid().optional(),
  earnedAt: z.coerce.date().optional(),
}))

export type UserBadgeOptionalDefaults = z.infer<typeof UserBadgeOptionalDefaultsSchema>

export default UserBadgeSchema;
