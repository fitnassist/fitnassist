import { router, publicProcedure } from '../lib/trpc';
import { newsletterService } from '../services/newsletter.service';
import { newsletterSignupSchema } from '@fitnassist/schemas';

export const newsletterRouter = router({
  subscribe: publicProcedure
    .input(newsletterSignupSchema)
    .mutation(async ({ input }) => {
      await newsletterService.subscribe(input.email);
      return { success: true };
    }),
});
