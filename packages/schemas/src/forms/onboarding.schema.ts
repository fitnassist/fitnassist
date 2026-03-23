import { z } from 'zod';

// =============================================================================
// QUESTION TYPES
// =============================================================================

export const questionTypeSchema = z.enum([
  'SHORT_TEXT',
  'LONG_TEXT',
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'YES_NO',
  'NUMBER',
]);

export type QuestionType = z.infer<typeof questionTypeSchema>;

export const questionSchema = z.object({
  id: z.string(),
  type: questionTypeSchema,
  label: z.string().min(1, 'Question text is required').max(500),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
});

export type Question = z.infer<typeof questionSchema>;

export const answerSchema = z.object({
  questionId: z.string(),
  answer: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});

export type Answer = z.infer<typeof answerSchema>;

// =============================================================================
// TEMPLATE SCHEMAS
// =============================================================================

export const createOnboardingTemplateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
  waiverText: z.string().max(10000, 'Waiver text must be at most 10000 characters').optional().nullable(),
  isActive: z.boolean().default(false),
});

export type CreateOnboardingTemplateInput = z.infer<typeof createOnboardingTemplateSchema>;

export const updateOnboardingTemplateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
  waiverText: z.string().max(10000, 'Waiver text must be at most 10000 characters').optional().nullable(),
  isActive: z.boolean(),
});

export type UpdateOnboardingTemplateInput = z.infer<typeof updateOnboardingTemplateSchema>;

export const getOnboardingTemplateSchema = z.object({
  id: z.string().cuid(),
});

export const deleteOnboardingTemplateSchema = z.object({
  id: z.string().cuid(),
});

// =============================================================================
// RESPONSE SCHEMAS
// =============================================================================

export const submitOnboardingResponseSchema = z.object({
  responseId: z.string().cuid(),
  answers: z.array(answerSchema),
  waiverSigned: z.boolean(),
  waiverSignedName: z.string().max(200).optional().nullable(),
});

export type SubmitOnboardingResponseInput = z.infer<typeof submitOnboardingResponseSchema>;

export const reviewOnboardingResponseSchema = z.object({
  responseId: z.string().cuid(),
  decision: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().max(2000, 'Review notes must be at most 2000 characters').optional().nullable(),
});

export type ReviewOnboardingResponseInput = z.infer<typeof reviewOnboardingResponseSchema>;

export const getOnboardingResponseSchema = z.object({
  clientRosterId: z.string().cuid(),
});
