import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'

/////////////////////////////////////////
// ONBOARDING TEMPLATE SCHEMA
/////////////////////////////////////////

export const OnboardingTemplateSchema = z.object({
  id: z.string().cuid(),
  trainerId: z.string(),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).max(100),
  /**
   * Questions JSON: [{ id, type, label, required, options? }]
   */
  questions: JsonValueSchema,
  waiverText: z.string().max(10000, { message: "Waiver text must be at most 10000 characters" }).nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type OnboardingTemplate = z.infer<typeof OnboardingTemplateSchema>

/////////////////////////////////////////
// ONBOARDING TEMPLATE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const OnboardingTemplateOptionalDefaultsSchema = OnboardingTemplateSchema.merge(z.object({
  id: z.string().cuid().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type OnboardingTemplateOptionalDefaults = z.infer<typeof OnboardingTemplateOptionalDefaultsSchema>

export default OnboardingTemplateSchema;
