import { z } from 'zod';

/////////////////////////////////////////
// REVIEW SCHEMA
/////////////////////////////////////////

export const ReviewSchema = z.object({
  id: z.string().cuid(),
  trainerId: z.string(),
  reviewerId: z.string(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10, { message: "Review must be at least 10 characters" }).max(2000, { message: "Review must be at most 2000 characters" }),
  replyText: z.string().max(2000, { message: "Reply must be at most 2000 characters" }).nullable(),
  repliedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Review = z.infer<typeof ReviewSchema>

/////////////////////////////////////////
// REVIEW OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const ReviewOptionalDefaultsSchema = ReviewSchema.merge(z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type ReviewOptionalDefaults = z.infer<typeof ReviewOptionalDefaultsSchema>

export default ReviewSchema;
