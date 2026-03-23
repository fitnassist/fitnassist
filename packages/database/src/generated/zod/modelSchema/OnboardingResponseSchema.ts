import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { OnboardingStatusSchema } from '../inputTypeSchemas/OnboardingStatusSchema'

/////////////////////////////////////////
// ONBOARDING RESPONSE SCHEMA
/////////////////////////////////////////

export const OnboardingResponseSchema = z.object({
  status: OnboardingStatusSchema,
  id: z.string().cuid(),
  templateId: z.string(),
  clientRosterId: z.string(),
  /**
   * Answers JSON: [{ questionId, answer }]
   */
  answers: JsonValueSchema.nullable(),
  waiverSigned: z.boolean(),
  waiverSignedAt: z.coerce.date().nullable(),
  waiverSignedName: z.string().max(200, { message: "Name must be at most 200 characters" }).nullable(),
  completedAt: z.coerce.date().nullable(),
  reviewedAt: z.coerce.date().nullable(),
  reviewNotes: z.string().max(2000, { message: "Review notes must be at most 2000 characters" }).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type OnboardingResponse = z.infer<typeof OnboardingResponseSchema>

/////////////////////////////////////////
// ONBOARDING RESPONSE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const OnboardingResponseOptionalDefaultsSchema = OnboardingResponseSchema.merge(z.object({
  status: OnboardingStatusSchema.optional(),
  id: z.string().cuid().optional(),
  waiverSigned: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type OnboardingResponseOptionalDefaults = z.infer<typeof OnboardingResponseOptionalDefaultsSchema>

export default OnboardingResponseSchema;
