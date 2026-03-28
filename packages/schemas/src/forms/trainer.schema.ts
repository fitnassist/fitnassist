import { z } from 'zod';

// =============================================================================
// TRAINER API SCHEMAS
// =============================================================================
// These schemas are for API input validation

export const trainerSearchSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusMiles: z.number().min(1).max(100).default(10),
  services: z.array(z.string()).optional(),
  qualifications: z.array(z.string()).optional(),
  travelOption: z.enum(['CLIENT_TRAVELS', 'TRAINER_TRAVELS', 'BOTH']).optional(),
  minRate: z.number().int().min(0).optional(),
  maxRate: z.number().int().min(0).optional(),
  acceptingClients: z.boolean().optional(),
  sortBy: z.enum(['distance', 'recently_active', 'newest', 'price_low', 'price_high']).default('distance'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export type TrainerSearchInput = z.infer<typeof trainerSearchSchema>;

export const getTrainerByHandleSchema = z.object({
  handle: z.string().min(1),
});

export type GetTrainerByHandleInput = z.infer<typeof getTrainerByHandleSchema>;

export const getTrainerByIdSchema = z.object({
  id: z.string().cuid(),
});

export type GetTrainerByIdInput = z.infer<typeof getTrainerByIdSchema>;

export const trainerProfileSchema = z.object({
  handle: z
    .string()
    .min(3, 'Handle must be at least 3 characters')
    .max(30, 'Handle must be at most 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Handle can only contain lowercase letters, numbers, and hyphens'),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(100),
  bio: z.string().max(2000, 'Bio must be at most 2000 characters').optional(),
  qualifications: z.array(z.string()).optional(),
  services: z.array(z.string()).optional(),
  profileImageUrl: z.string().url('Must be a valid URL').optional(),
  coverImageUrl: z.string().url('Must be a valid URL').optional(),
  videoIntroUrl: z.string().url('Must be a valid URL').nullable().optional(),
  addressLine1: z.string().max(100).optional(),
  addressLine2: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  county: z.string().max(50).optional(),
  postcode: z.string().max(20).optional(),
  country: z.string().max(2).optional(),
  placeId: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  contactEmail: z.string().email('Please enter a valid email address').optional(),
  phoneNumber: z.string().regex(/^\+?[0-9\s\-\(\)]{10,20}$/).optional(),
  socialLinks: z.record(z.string()).optional(),
  travelOption: z.enum(['CLIENT_TRAVELS', 'TRAINER_TRAVELS', 'BOTH']).optional(),
  hourlyRateMin: z.number().int().min(0).optional().nullable(),
  hourlyRateMax: z.number().int().min(0).optional().nullable(),
  acceptingClients: z.boolean().optional(),
});

export type TrainerProfileInput = z.infer<typeof trainerProfileSchema>;

export const updateTrainerProfileSchema = trainerProfileSchema.partial();

export type UpdateTrainerProfileInput = z.infer<typeof updateTrainerProfileSchema>;

// =============================================================================
// WIZARD STEP SCHEMAS
// =============================================================================
// These schemas validate individual steps in the profile creation wizard

// Step 1: Basic Info
export const wizardBasicInfoSchema = z.object({
  handle: z
    .string()
    .min(3, 'Handle must be at least 3 characters')
    .max(30, 'Handle must be at most 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Handle can only contain lowercase letters, numbers, and hyphens'),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(100, 'Display name must be at most 100 characters'),
  bio: z
    .string()
    .max(2000, 'Bio must be at most 2000 characters')
    .optional()
    .or(z.literal('')),
});

export type WizardBasicInfoInput = z.infer<typeof wizardBasicInfoSchema>;

// Step 2: Location & Contact
export const wizardLocationSchema = z.object({
  // Structured address fields
  addressLine1: z.string().max(100, 'Address line 1 must be at most 100 characters').optional().or(z.literal('')),
  addressLine2: z.string().max(100, 'Address line 2 must be at most 100 characters').optional().or(z.literal('')),
  city: z.string().max(100, 'City must be at most 100 characters').optional().or(z.literal('')),
  county: z.string().max(50, 'County must be at most 50 characters').optional().or(z.literal('')),
  postcode: z
    .string()
    .min(1, 'Postcode is required')
    .max(20, 'Postcode must be at most 20 characters')
    .regex(/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, 'Please enter a valid UK postcode'),
  country: z.string().max(2).default('GB'),
  // Google Place ID for future reference
  placeId: z.string().optional().or(z.literal('')),
  // Lat/lng from Places API (auto-filled)
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  // Training location preference
  travelOption: z.enum(['CLIENT_TRAVELS', 'TRAINER_TRAVELS', 'BOTH']),
});

export type WizardLocationInput = z.infer<typeof wizardLocationSchema>;

// Step 3: Services & Qualifications
export const wizardServicesSchema = z.object({
  services: z
    .array(z.string())
    .min(1, 'Please select at least one service'),
  qualifications: z
    .array(z.string())
    .min(1, 'Please select at least one qualification'),
});

export type WizardServicesInput = z.infer<typeof wizardServicesSchema>;

// Step 4: Images
export const wizardImagesSchema = z.object({
  profileImageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  coverImageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export type WizardImagesInput = z.infer<typeof wizardImagesSchema>;

// Step 5: Review (no additional validation, just confirmation)
export const wizardReviewSchema = z.object({
  isPublished: z.boolean().default(false),
});

export type WizardReviewInput = z.infer<typeof wizardReviewSchema>;

// Combined wizard data (all steps)
export const profileWizardSchema = wizardBasicInfoSchema
  .merge(wizardLocationSchema)
  .merge(wizardServicesSchema)
  .merge(wizardImagesSchema)
  .merge(wizardReviewSchema);

export type ProfileWizardInput = z.infer<typeof profileWizardSchema>;

// =============================================================================
// PROFILE CREATE SCHEMA (for API)
// =============================================================================
// Full schema for creating a trainer profile via API

export const createTrainerProfileSchema = z.object({
  handle: z
    .string()
    .min(3, 'Handle must be at least 3 characters')
    .max(30, 'Handle must be at most 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Handle can only contain lowercase letters, numbers, and hyphens'),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(100),
  bio: z.string().max(2000).optional(),
  qualifications: z.array(z.string()).min(1, 'At least one qualification is required'),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  profileImageUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
  addressLine1: z.string().max(100).optional(),
  addressLine2: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  county: z.string().max(50).optional(),
  postcode: z.string().min(1, 'Postcode is required').max(20),
  country: z.string().max(2).default('GB'),
  placeId: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  contactEmail: z.string().email().optional(),
  phoneNumber: z.string().regex(/^\+?[0-9\s\-\(\)]{10,20}$/).optional(),
  socialLinks: z.record(z.string()).optional(),
  travelOption: z.enum(['CLIENT_TRAVELS', 'TRAINER_TRAVELS', 'BOTH']).default('CLIENT_TRAVELS'),
  hourlyRateMin: z.number().int().min(0).optional().nullable(),
  hourlyRateMax: z.number().int().min(0).optional().nullable(),
  acceptingClients: z.boolean().default(true),
  isPublished: z.boolean().default(false),
});

export type CreateTrainerProfileInput = z.infer<typeof createTrainerProfileSchema>;
