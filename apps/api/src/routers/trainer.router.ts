import { router, publicProcedure, protectedProcedure, trainerProcedure } from '../lib/trpc';
import { trainerService } from '../services/trainer.service';
import {
  trainerSearchSchema,
  getTrainerByHandleSchema,
  getTrainerByIdSchema,
  createTrainerProfileSchema,
  updateTrainerProfileSchema,
} from '@fitnassist/schemas';

export const trainerRouter = router({
  // Public routes
  search: publicProcedure
    .input(trainerSearchSchema)
    .query(async ({ input }) => {
      return trainerService.search(input);
    }),

  getByHandle: publicProcedure
    .input(getTrainerByHandleSchema)
    .query(async ({ input, ctx }) => {
      return trainerService.getByHandle(input.handle, ctx.user?.id);
    }),

  getById: publicProcedure
    .input(getTrainerByIdSchema)
    .query(async ({ input }) => {
      return trainerService.getById(input.id);
    }),

  // Protected routes (any authenticated user with TRAINER role)
  hasProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const hasProfile = await trainerService.hasProfile(ctx.user.id);
      return { hasProfile };
    }),

  getMyProfile: trainerProcedure
    .query(async ({ ctx }) => {
      return trainerService.getByUserId(ctx.user.id);
    }),

  create: trainerProcedure
    .input(createTrainerProfileSchema)
    .mutation(async ({ input, ctx }) => {
      return trainerService.create(ctx.user.id, input);
    }),

  update: trainerProcedure
    .input(updateTrainerProfileSchema)
    .mutation(async ({ input, ctx }) => {
      return trainerService.update(ctx.user.id, input);
    }),

  publish: trainerProcedure
    .mutation(async ({ ctx }) => {
      return trainerService.publish(ctx.user.id);
    }),

  unpublish: trainerProcedure
    .mutation(async ({ ctx }) => {
      return trainerService.unpublish(ctx.user.id);
    }),

  getStats: trainerProcedure
    .query(async ({ ctx }) => {
      return trainerService.getStats(ctx.user.id);
    }),
});
