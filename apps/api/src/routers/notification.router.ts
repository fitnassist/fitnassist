import { z } from 'zod';
import { router, protectedProcedure } from '../lib/trpc';
import { notificationRepository } from '../repositories/notification.repository';
import { pushSubscriptionRepository } from '../repositories/push-subscription.repository';
import { webPushService } from '../services/web-push.service';

export const notificationRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return notificationRepository.findByUserId(ctx.user.id, {
        cursor: input.cursor,
        limit: input.limit,
      });
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return notificationRepository.getUnreadCount(ctx.user.id);
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await notificationRepository.markRead(input.id, ctx.user.id);
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await notificationRepository.markAllRead(ctx.user.id);
    return { success: true };
  }),

  dismiss: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await notificationRepository.dismiss(input.id, ctx.user.id);
      return { success: true };
    }),

  getVapidPublicKey: protectedProcedure.query(() => {
    return { key: webPushService.getVapidPublicKey() };
  }),

  registerPushSubscription: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        p256dh: z.string(),
        auth: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await pushSubscriptionRepository.create({
        userId: ctx.user.id,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
      });
      return { success: true };
    }),

  unregisterPushSubscription: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ input }) => {
      await pushSubscriptionRepository.deleteByEndpoint(input.endpoint);
      return { success: true };
    }),
});
