import { z } from 'zod';

// =============================================================================
// SEARCH FORM SCHEMAS
// =============================================================================
// These schemas are for search/filter forms that don't map to database models

export const trainerSearchFormSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusMiles: z.number().min(1).max(100).default(10),
  services: z.array(z.string()).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export type TrainerSearchFormInput = z.infer<typeof trainerSearchFormSchema>;
