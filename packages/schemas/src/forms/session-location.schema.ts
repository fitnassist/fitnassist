import { z } from 'zod';

export const createSessionLocationSchema = z.object({
  name: z.string().min(2).max(100),
  addressLine1: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  postcode: z.string().max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  placeId: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export type CreateSessionLocationInput = z.infer<typeof createSessionLocationSchema>;

export const updateSessionLocationSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(2).max(100).optional(),
  addressLine1: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  postcode: z.string().max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  placeId: z.string().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type UpdateSessionLocationInput = z.infer<typeof updateSessionLocationSchema>;

export const deleteSessionLocationSchema = z.object({
  id: z.string().cuid(),
});
