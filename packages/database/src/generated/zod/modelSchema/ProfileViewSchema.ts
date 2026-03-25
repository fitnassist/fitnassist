import { z } from 'zod';

/////////////////////////////////////////
// PROFILE VIEW SCHEMA
/////////////////////////////////////////

export const ProfileViewSchema = z.object({
  id: z.string().cuid(),
  trainerId: z.string(),
  viewerId: z.string().nullable(),
  viewedAt: z.coerce.date(),
})

export type ProfileView = z.infer<typeof ProfileViewSchema>

/////////////////////////////////////////
// PROFILE VIEW OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const ProfileViewOptionalDefaultsSchema = ProfileViewSchema.merge(z.object({
  id: z.string().cuid().optional(),
  viewedAt: z.coerce.date().optional(),
}))

export type ProfileViewOptionalDefaults = z.infer<typeof ProfileViewOptionalDefaultsSchema>

export default ProfileViewSchema;
