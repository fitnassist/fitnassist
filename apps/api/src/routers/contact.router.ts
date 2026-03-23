import { z } from 'zod';
import { router, protectedProcedure, trainerProcedure } from '../lib/trpc';
import { contactService } from '../services/contact.service';
import { trainerService } from '../services/trainer.service';
import { callbackRequestSchema, connectionRequestSchema } from '@fitnassist/schemas';

export const contactRouter = router({
  // Trainee routes - requires login to contact trainers
  submitCallbackRequest: protectedProcedure
    .input(callbackRequestSchema)
    .mutation(async ({ input, ctx }) => {
      return contactService.submitCallbackRequest(input, ctx.user.id);
    }),

  submitConnectionRequest: protectedProcedure
    .input(connectionRequestSchema)
    .mutation(async ({ input, ctx }) => {
      return contactService.submitConnectionRequest(input, ctx.user.id);
    }),

  checkPendingRequest: protectedProcedure
    .input(z.object({
      trainerId: z.string().cuid(),
    }))
    .query(async ({ input, ctx }) => {
      return contactService.checkPendingRequest(ctx.user.id, input.trainerId);
    }),

  getSentRequests: protectedProcedure
    .query(async ({ ctx }) => {
      return contactService.getSentRequests(ctx.user.id);
    }),

  // Trainer routes
  getMyRequests: trainerProcedure
    .input(z.object({
      status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'RESPONDED', 'CLOSED']).optional(),
      type: z.enum(['CALLBACK_REQUEST', 'CONNECTION_REQUEST']).optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const trainer = await trainerService.getByUserId(ctx.user.id);
      if (!trainer) return [];
      return contactService.getRequestsForTrainer(trainer.id, input?.status);
    }),

  acceptConnection: trainerProcedure
    .input(z.object({
      requestId: z.string().cuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      return contactService.acceptConnection(input.requestId, ctx.user.id);
    }),

  declineConnection: trainerProcedure
    .input(z.object({
      requestId: z.string().cuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      return contactService.declineConnection(input.requestId, ctx.user.id);
    }),

  updateStatus: trainerProcedure
    .input(z.object({
      requestId: z.string().cuid(),
      status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'RESPONDED', 'CLOSED']),
    }))
    .mutation(async ({ input, ctx }) => {
      return contactService.updateStatus(input.requestId, input.status, ctx.user.id);
    }),

  getStats: trainerProcedure
    .query(async ({ ctx }) => {
      const trainer = await trainerService.getByUserId(ctx.user.id);
      if (!trainer) {
        return {
          connections: { total: 0, last30Days: 0, last7Days: 0 },
          callbacks: { total: 0, last30Days: 0, last7Days: 0 },
        };
      }
      return contactService.getStatsForTrainer(trainer.id);
    }),

  getPendingCount: trainerProcedure
    .query(async ({ ctx }) => {
      const trainer = await trainerService.getByUserId(ctx.user.id);
      if (!trainer) {
        return { count: 0 };
      }
      const requests = await contactService.getRequestsForTrainer(trainer.id, 'PENDING');
      return { count: requests.length };
    }),
});
