import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, trainerProcedure } from '../lib/trpc';
import {
  createReviewSchema,
  updateReviewSchema,
  replyToReviewSchema,
  reportReviewSchema,
  getTrainerReviewsSchema,
  checkReviewEligibilitySchema,
} from '@fitnassist/schemas';
import { reviewService } from '../services/review.service';

export const reviewRouter = router({
  getByTrainer: publicProcedure
    .input(getTrainerReviewsSchema)
    .query(async ({ input }) => {
      return reviewService.getByTrainer(input.trainerId, input.cursor, input.limit);
    }),

  checkEligibility: protectedProcedure
    .input(checkReviewEligibilitySchema)
    .query(async ({ ctx, input }) => {
      return reviewService.checkEligibility(input.trainerId, ctx.user.id);
    }),

  create: protectedProcedure
    .input(createReviewSchema)
    .mutation(async ({ ctx, input }) => {
      return reviewService.create(input.trainerId, ctx.user.id, input.rating, input.text);
    }),

  update: protectedProcedure
    .input(updateReviewSchema)
    .mutation(async ({ ctx, input }) => {
      return reviewService.update(input.id, ctx.user.id, input.rating, input.text);
    }),

  reply: protectedProcedure
    .input(replyToReviewSchema)
    .mutation(async ({ ctx, input }) => {
      return reviewService.reply(input.reviewId, ctx.user.id, input.replyText);
    }),

  report: protectedProcedure
    .input(reportReviewSchema)
    .mutation(async ({ ctx, input }) => {
      return reviewService.report(input.reviewId, ctx.user.id, input.reason, input.details);
    }),

  getForDashboard: trainerProcedure
    .input(z.object({
      cursor: z.string().cuid().optional(),
      limit: z.number().int().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      return reviewService.getForDashboard(ctx.user.id, input.cursor, input.limit);
    }),
});
