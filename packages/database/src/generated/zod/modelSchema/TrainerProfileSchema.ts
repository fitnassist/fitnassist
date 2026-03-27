import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { TravelOptionSchema } from '../inputTypeSchemas/TravelOptionSchema'
import { SubscriptionTierSchema } from '../inputTypeSchemas/SubscriptionTierSchema'

/////////////////////////////////////////
// TRAINER PROFILE SCHEMA
/////////////////////////////////////////

export const TrainerProfileSchema = z.object({
  travelOption: TravelOptionSchema,
  subscriptionTier: SubscriptionTierSchema,
  id: z.string().cuid(),
  userId: z.string(),
  handle: z.string().min(3, { message: "Handle must be at least 3 characters" }).max(30, { message: "Handle must be at most 30 characters" }).regex(/^[a-z0-9-]+$/, { message: "Handle can only contain lowercase letters, numbers, and hyphens" }),
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters" }).max(100),
  bio: z.string().max(2000, { message: "Bio must be at most 2000 characters" }).nullable(),
  qualifications: z.string().array(),
  services: z.string().array(),
  profileImageUrl: z.string().url({ message: "Must be a valid URL" }).nullable(),
  coverImageUrl: z.string().url({ message: "Must be a valid URL" }).nullable(),
  videoIntroUrl: z.string().url({ message: "Must be a valid URL" }).nullable(),
  addressLine1: z.string().max(100).nullable(),
  addressLine2: z.string().max(100).nullable(),
  city: z.string().max(100).nullable(),
  county: z.string().max(50).nullable(),
  postcode: z.string().max(20).nullable(),
  country: z.string().max(2),
  /**
   * Google Place ID for the address (for future reference)
   */
  placeId: z.string().nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  contactEmail: z.string().email({ message: "Please enter a valid email address" }).nullable(),
  phoneNumber: z.string().regex(/^\+?[0-9\s\-\(\)]{10,20}$/, { message: "Please enter a valid phone number" }).nullable(),
  socialLinks: JsonValueSchema.nullable(),
  hourlyRateMin: z.number().int().min(0, { message: "Rate must be a positive number" }).nullable(),
  hourlyRateMax: z.number().int().min(0, { message: "Rate must be a positive number" }).nullable(),
  acceptingClients: z.boolean(),
  isPublished: z.boolean(),
  travelBufferMin: z.number().int().min(0).max(120),
  smartTravelEnabled: z.boolean(),
  offersVideoSessions: z.boolean(),
  paymentsEnabled: z.boolean(),
  stripeConnectedAccountId: z.string().nullable(),
  stripeOnboardingComplete: z.boolean(),
  firstSessionFree: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type TrainerProfile = z.infer<typeof TrainerProfileSchema>

/////////////////////////////////////////
// TRAINER PROFILE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const TrainerProfileOptionalDefaultsSchema = TrainerProfileSchema.merge(z.object({
  travelOption: TravelOptionSchema.optional(),
  subscriptionTier: SubscriptionTierSchema.optional(),
  id: z.string().cuid().optional(),
  country: z.string().max(2).optional(),
  acceptingClients: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  travelBufferMin: z.number().int().min(0).max(120).optional(),
  smartTravelEnabled: z.boolean().optional(),
  offersVideoSessions: z.boolean().optional(),
  paymentsEnabled: z.boolean().optional(),
  stripeOnboardingComplete: z.boolean().optional(),
  firstSessionFree: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type TrainerProfileOptionalDefaults = z.infer<typeof TrainerProfileOptionalDefaultsSchema>

export default TrainerProfileSchema;
