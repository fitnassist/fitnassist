import { z } from 'zod';

export const createReviewSchema = z.object({
  trainerId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10, 'Review must be at least 10 characters').max(2000, 'Review must be at most 2000 characters'),
});

export const updateReviewSchema = z.object({
  id: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10, 'Review must be at least 10 characters').max(2000, 'Review must be at most 2000 characters'),
});

export const replyToReviewSchema = z.object({
  reviewId: z.string().cuid(),
  replyText: z.string().min(1, 'Reply cannot be empty').max(2000, 'Reply must be at most 2000 characters'),
});

export const reportReviewSchema = z.object({
  reviewId: z.string().cuid(),
  reason: z.enum(['INAPPROPRIATE', 'FAKE', 'SPAM', 'HARASSMENT']),
  details: z.string().max(500, 'Details must be at most 500 characters').optional(),
});

export const getTrainerReviewsSchema = z.object({
  trainerId: z.string().cuid(),
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

export const checkReviewEligibilitySchema = z.object({
  trainerId: z.string().cuid(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReplyToReviewInput = z.infer<typeof replyToReviewSchema>;
export type ReportReviewInput = z.infer<typeof reportReviewSchema>;
export type GetTrainerReviewsInput = z.infer<typeof getTrainerReviewsSchema>;
export type CheckReviewEligibilityInput = z.infer<typeof checkReviewEligibilitySchema>;
