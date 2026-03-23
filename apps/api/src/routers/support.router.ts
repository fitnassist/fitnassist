import { router, publicProcedure } from '../lib/trpc';
import { supportService } from '../services/support.service';
import { supportContactSchema } from '@fitnassist/schemas';

export const supportRouter = router({
  submit: publicProcedure
    .input(supportContactSchema)
    .mutation(async ({ input }) => {
      await supportService.submitEnquiry(input);
      return { success: true };
    }),
});
