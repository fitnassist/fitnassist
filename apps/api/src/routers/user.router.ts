import { z } from 'zod';
import { router, protectedProcedure } from '../lib/trpc';
import { userService } from '../services/user.service';
import { notificationPreferencesSchema } from '@fitnassist/schemas';

export const userRouter = router({
  updateName: protectedProcedure
    .input(z.object({ name: z.string().min(1, 'Name is required').max(100) }))
    .mutation(async ({ ctx, input }) => {
      return userService.updateName(ctx.user.id, input.name);
    }),

  getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
    return userService.getNotificationPreferences(ctx.user.id);
  }),

  updateNotificationPreferences: protectedProcedure
    .input(notificationPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      return userService.updateNotificationPreferences(ctx.user.id, input);
    }),

  updatePhoneNumber: protectedProcedure
    .input(z.object({ phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Must be E.164 format (e.g. +44...)').nullable() }))
    .mutation(async ({ ctx, input }) => {
      return userService.updatePhoneNumber(ctx.user.id, input.phoneNumber);
    }),
});
