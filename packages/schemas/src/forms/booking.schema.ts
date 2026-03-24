import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createBookingSchema = z.object({
  trainerId: z.string().cuid(),
  clientRosterId: z.string().cuid(),
  locationId: z.string().cuid().optional(),
  date: z.string(), // ISO date string
  startTime: z.string().regex(timeRegex),
  durationMin: z.number().int().min(15).max(180),
  clientAddress: z.string().max(200).optional(),
  clientPostcode: z.string().max(20).optional(),
  clientLatitude: z.number().min(-90).max(90).optional(),
  clientLongitude: z.number().min(-180).max(180).optional(),
  notes: z.string().max(500).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const cancelBookingSchema = z.object({
  id: z.string().cuid(),
  reason: z.string().max(500).optional(),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

export const getBookingSchema = z.object({
  id: z.string().cuid(),
});

export const listTrainerBookingsSchema = z.object({
  startDate: z.string(), // ISO date string
  endDate: z.string(), // ISO date string
  status: z.enum(['CONFIRMED', 'CANCELLED_BY_TRAINER', 'CANCELLED_BY_CLIENT', 'COMPLETED', 'NO_SHOW']).optional(),
});

export const completeBookingSchema = z.object({
  id: z.string().cuid(),
});

export const noShowBookingSchema = z.object({
  id: z.string().cuid(),
});
