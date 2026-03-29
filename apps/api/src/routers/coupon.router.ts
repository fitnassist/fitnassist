import { TRPCError } from '@trpc/server';
import { router, trainerProcedure, publicProcedure, requireTier } from '../lib/trpc';
import { trainerRepository } from '../repositories/trainer.repository';
import { couponService } from '../services/coupon.service';
import {
  createCouponSchema,
  updateCouponSchema,
  deleteCouponSchema,
  validateCouponSchema,
} from '@fitnassist/schemas';

const requireTrainerProfile = async (userId: string) => {
  const profile = await trainerRepository.findByUserId(userId);
  if (!profile) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
  }
  return profile;
};

export const couponRouter = router({
  // =========================================================================
  // Public
  // =========================================================================

  validate: publicProcedure
    .input(validateCouponSchema)
    .query(async ({ input }) => {
      return couponService.validateCoupon(input.trainerId, input.code, input.subtotalPence);
    }),

  // =========================================================================
  // Trainer (ELITE)
  // =========================================================================

  list: trainerProcedure
    .use(requireTier('ELITE'))
    .query(async ({ ctx }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return couponService.getCoupons(profile.id);
    }),

  create: trainerProcedure
    .use(requireTier('ELITE'))
    .input(createCouponSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return couponService.createCoupon(profile.id, input);
    }),

  update: trainerProcedure
    .use(requireTier('ELITE'))
    .input(updateCouponSchema)
    .mutation(async ({ ctx, input }) => {
      const { couponId, ...data } = input;
      const profile = await requireTrainerProfile(ctx.user.id);
      return couponService.updateCoupon(profile.id, couponId, data);
    }),

  delete: trainerProcedure
    .use(requireTier('ELITE'))
    .input(deleteCouponSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return couponService.deleteCoupon(profile.id, input.couponId);
    }),
});
