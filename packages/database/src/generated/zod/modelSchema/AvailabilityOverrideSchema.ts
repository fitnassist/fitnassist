import { z } from 'zod';

/////////////////////////////////////////
// AVAILABILITY OVERRIDE SCHEMA
/////////////////////////////////////////

export const AvailabilityOverrideSchema = z.object({
  id: z.string().cuid(),
  trainerId: z.string(),
  date: z.coerce.date(),
  isBlocked: z.boolean(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  reason: z.string().max(200).nullable(),
  createdAt: z.coerce.date(),
})

export type AvailabilityOverride = z.infer<typeof AvailabilityOverrideSchema>

/////////////////////////////////////////
// AVAILABILITY OVERRIDE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const AvailabilityOverrideOptionalDefaultsSchema = AvailabilityOverrideSchema.merge(z.object({
  id: z.string().cuid().optional(),
  isBlocked: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type AvailabilityOverrideOptionalDefaults = z.infer<typeof AvailabilityOverrideOptionalDefaultsSchema>

export default AvailabilityOverrideSchema;
