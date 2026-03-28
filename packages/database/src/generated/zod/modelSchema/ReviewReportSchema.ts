import { z } from 'zod';
import { ReportReasonSchema } from '../inputTypeSchemas/ReportReasonSchema'

/////////////////////////////////////////
// REVIEW REPORT SCHEMA
/////////////////////////////////////////

export const ReviewReportSchema = z.object({
  reason: ReportReasonSchema,
  id: z.string().cuid(),
  reviewId: z.string(),
  reporterId: z.string(),
  details: z.string().max(500, { message: "Details must be at most 500 characters" }).nullable(),
  createdAt: z.coerce.date(),
})

export type ReviewReport = z.infer<typeof ReviewReportSchema>

/////////////////////////////////////////
// REVIEW REPORT OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const ReviewReportOptionalDefaultsSchema = ReviewReportSchema.merge(z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type ReviewReportOptionalDefaults = z.infer<typeof ReviewReportOptionalDefaultsSchema>

export default ReviewReportSchema;
