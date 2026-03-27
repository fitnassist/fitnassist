import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dayOfWeekEnum = z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']);

export const availabilitySlotSchema = z.object({
  dayOfWeek: dayOfWeekEnum,
  startTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)'),
  sessionDurationMin: z.number().int().min(15).max(180).default(60),
});

export const setWeeklyAvailabilitySchema = z.object({
  slots: z.array(availabilitySlotSchema),
});

export type SetWeeklyAvailabilityInput = z.infer<typeof setWeeklyAvailabilitySchema>;

export const createAvailabilityOverrideSchema = z.object({
  date: z.string(), // ISO date string
  isBlocked: z.boolean().default(true),
  startTime: z.string().regex(timeRegex).optional(),
  endTime: z.string().regex(timeRegex).optional(),
  reason: z.string().max(200).optional(),
});

export type CreateAvailabilityOverrideInput = z.infer<typeof createAvailabilityOverrideSchema>;

export const deleteAvailabilityOverrideSchema = z.object({
  id: z.string().cuid(),
});

export const getAvailableSlotsSchema = z.object({
  trainerId: z.string().cuid(),
  date: z.string(), // ISO date string
  durationMin: z.number().int().min(15).max(180).optional(),
});

export const getAvailableDatesSchema = z.object({
  trainerId: z.string().cuid(),
  startDate: z.string(), // ISO date string
  endDate: z.string(), // ISO date string
  durationMin: z.number().int().min(15).max(180).optional(),
});

export const updateTravelSettingsSchema = z.object({
  travelBufferMin: z.number().int().min(0).max(120),
  smartTravelEnabled: z.boolean(),
});

export type UpdateTravelSettingsInput = z.infer<typeof updateTravelSettingsSchema>;

export const updateVideoSettingsSchema = z.object({
  offersVideoSessions: z.boolean(),
});

export type UpdateVideoSettingsInput = z.infer<typeof updateVideoSettingsSchema>;
