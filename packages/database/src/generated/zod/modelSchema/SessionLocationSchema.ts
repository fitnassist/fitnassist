import { z } from 'zod';


/////////////////////////////////////////
// SESSION LOCATION SCHEMA
/////////////////////////////////////////

export const SessionLocationSchema = z.object({
  id: z.string().cuid(),
  trainerId: z.string(),
  name: z.string().min(2).max(100),
  addressLine1: z.string().max(200).nullable(),
  city: z.string().max(100).nullable(),
  postcode: z.string().max(20).nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  placeId: z.string().nullable(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type SessionLocation = z.infer<typeof SessionLocationSchema>

/////////////////////////////////////////
// SESSION LOCATION OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const SessionLocationOptionalDefaultsSchema = SessionLocationSchema.merge(z.object({
  id: z.string().cuid().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type SessionLocationOptionalDefaults = z.infer<typeof SessionLocationOptionalDefaultsSchema>

export default SessionLocationSchema;
