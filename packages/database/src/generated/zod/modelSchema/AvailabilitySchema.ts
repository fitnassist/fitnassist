import { z } from 'zod';
import { DayOfWeekSchema } from '../inputTypeSchemas/DayOfWeekSchema'

/////////////////////////////////////////
// AVAILABILITY SCHEMA
/////////////////////////////////////////

export const AvailabilitySchema = z.object({
  dayOfWeek: DayOfWeekSchema,
  id: z.string().cuid(),
  trainerId: z.string(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  sessionDurationMin: z.number().int().min(15).max(180),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Availability = z.infer<typeof AvailabilitySchema>

/////////////////////////////////////////
// AVAILABILITY OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const AvailabilityOptionalDefaultsSchema = AvailabilitySchema.merge(z.object({
  id: z.string().cuid().optional(),
  sessionDurationMin: z.number().int().min(15).max(180).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type AvailabilityOptionalDefaults = z.infer<typeof AvailabilityOptionalDefaultsSchema>

export default AvailabilitySchema;
