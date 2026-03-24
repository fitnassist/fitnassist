import { router, trainerProcedure, traineeProcedure, requireTier } from '../lib/trpc';
import { onboardingService } from '../services/onboarding.service';
import { z } from 'zod';
import {
  createOnboardingTemplateSchema,
  updateOnboardingTemplateSchema,
  getOnboardingTemplateSchema,
  deleteOnboardingTemplateSchema,
  submitOnboardingResponseSchema,
  reviewOnboardingResponseSchema,
  getOnboardingResponseSchema,
} from '@fitnassist/schemas';

export const onboardingRouter = router({
  // Trainer: Template management
  createTemplate: trainerProcedure
    .use(requireTier('PRO'))
    .input(createOnboardingTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      return onboardingService.createTemplate(ctx.user.id, input);
    }),

  getTemplates: trainerProcedure
    .query(async ({ ctx }) => {
      return onboardingService.getTemplates(ctx.user.id);
    }),

  getTemplate: trainerProcedure
    .input(getOnboardingTemplateSchema)
    .query(async ({ input, ctx }) => {
      return onboardingService.getTemplate(ctx.user.id, input.id);
    }),

  updateTemplate: trainerProcedure
    .use(requireTier('PRO'))
    .input(updateOnboardingTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      return onboardingService.updateTemplate(ctx.user.id, input);
    }),

  deleteTemplate: trainerProcedure
    .use(requireTier('PRO'))
    .input(deleteOnboardingTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      return onboardingService.deleteTemplate(ctx.user.id, input.id);
    }),

  getActiveTemplates: trainerProcedure
    .query(async ({ ctx }) => {
      return onboardingService.getActiveTemplates(ctx.user.id);
    }),

  // Trainer: Review
  getResponsesForClient: trainerProcedure
    .input(getOnboardingResponseSchema)
    .query(async ({ input, ctx }) => {
      return onboardingService.getResponsesForClient(ctx.user.id, input.clientRosterId);
    }),

  reviewResponse: trainerProcedure
    .use(requireTier('PRO'))
    .input(reviewOnboardingResponseSchema)
    .mutation(async ({ input, ctx }) => {
      return onboardingService.reviewResponse(ctx.user.id, input);
    }),

  submittedResponses: trainerProcedure
    .query(async ({ ctx }) => {
      return onboardingService.getSubmittedResponses(ctx.user.id);
    }),

  stats: trainerProcedure
    .query(async ({ ctx }) => {
      return onboardingService.getStats(ctx.user.id);
    }),

  pendingReviewCount: trainerProcedure
    .query(async ({ ctx }) => {
      return onboardingService.getPendingReviewCount(ctx.user.id);
    }),

  // Trainee: Onboarding
  getResponse: traineeProcedure
    .input(z.object({ responseId: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      return onboardingService.getResponseById(ctx.user.id, input.responseId);
    }),

  myPending: traineeProcedure
    .query(async ({ ctx }) => {
      return onboardingService.getPendingOnboarding(ctx.user.id);
    }),

  submitResponse: traineeProcedure
    .input(submitOnboardingResponseSchema)
    .mutation(async ({ input, ctx }) => {
      return onboardingService.submitResponse(ctx.user.id, input);
    }),
});
