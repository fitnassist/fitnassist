import { router, protectedProcedure } from '../lib/trpc';
import { userService } from '../services/user.service';
import { notificationPreferencesSchema } from '@fitnassist/schemas';

export const userRouter = router({
  getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
    return userService.getNotificationPreferences(ctx.user.id);
  }),

  updateNotificationPreferences: protectedProcedure
    .input(notificationPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      return userService.updateNotificationPreferences(ctx.user.id, input);
    }),
});
