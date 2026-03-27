import { z } from 'zod';
import { SessionTypeSchema } from '../inputTypeSchemas/SessionTypeSchema'
import { BookingStatusSchema } from '../inputTypeSchemas/BookingStatusSchema'

/////////////////////////////////////////
// BOOKING SCHEMA
/////////////////////////////////////////

export const BookingSchema = z.object({
  sessionType: SessionTypeSchema,
  status: BookingStatusSchema,
  id: z.string().cuid(),
  trainerId: z.string(),
  clientRosterId: z.string(),
  locationId: z.string().nullable(),
  date: z.coerce.date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMin: z.number().int().min(15).max(180),
  clientAddress: z.string().max(200).nullable(),
  clientPostcode: z.string().max(20).nullable(),
  clientLatitude: z.number().nullable(),
  clientLongitude: z.number().nullable(),
  dailyRoomUrl: z.string().url().nullable(),
  dailyRoomName: z.string().nullable(),
  initiatedBy: z.string().nullable(),
  cancellationReason: z.string().max(500).nullable(),
  cancelledAt: z.coerce.date().nullable(),
  declineReason: z.string().max(500).nullable(),
  declinedAt: z.coerce.date().nullable(),
  holdExpiresAt: z.coerce.date().nullable(),
  rescheduledFromId: z.string().nullable(),
  reminderSentAt: z.coerce.date().nullable(),
  notes: z.string().max(500).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Booking = z.infer<typeof BookingSchema>

/////////////////////////////////////////
// BOOKING OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const BookingOptionalDefaultsSchema = BookingSchema.merge(z.object({
  sessionType: SessionTypeSchema.optional(),
  status: BookingStatusSchema.optional(),
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type BookingOptionalDefaults = z.infer<typeof BookingOptionalDefaultsSchema>

export default BookingSchema;
