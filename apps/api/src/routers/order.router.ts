import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  router,
  trainerProcedure,
  protectedProcedure,
  requireTier,
} from "../lib/trpc";
import { trainerRepository } from "../repositories/trainer.repository";
import { productPaymentService } from "../services/product-payment.service";
import { orderCheckoutService } from "../services/order-checkout.service";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  refundOrderSchema,
} from "@fitnassist/schemas";

const requireTrainerProfile = async (userId: string) => {
  const profile = await trainerRepository.findByUserId(userId);
  if (!profile) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Trainer profile not found",
    });
  }
  return profile;
};

export const orderRouter = router({
  // =========================================================================
  // Buyer (any authenticated user)
  // =========================================================================

  create: protectedProcedure
    .input(createOrderSchema)
    .mutation(async ({ ctx, input }) => {
      return productPaymentService.createOrder(
        ctx.user.id,
        input.trainerId,
        input.items,
        input.couponCode,
        input.shippingName,
        input.shippingAddress,
      );
    }),

  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        successUrl: z.string().url().optional(),
        cancelUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return orderCheckoutService.createCheckoutSession(
        input.orderId,
        ctx.user.id,
        input.successUrl,
        input.cancelUrl,
      );
    }),

  myOrders: protectedProcedure
    .input(
      z
        .object({
          cursor: z.string().optional(),
          limit: z.number().int().min(1).max(50).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return productPaymentService.getBuyerOrders(
        ctx.user.id,
        input?.cursor,
        input?.limit,
      );
    }),

  getDownloadUrl: protectedProcedure
    .input(z.object({ orderId: z.string(), productId: z.string() }))
    .query(async ({ ctx, input }) => {
      return productPaymentService.getDownloadUrl(
        input.orderId,
        input.productId,
        ctx.user.id,
      );
    }),

  // =========================================================================
  // Trainer (ELITE)
  // =========================================================================

  trainerOrders: trainerProcedure
    .use(requireTier("ELITE"))
    .input(
      z
        .object({
          cursor: z.string().optional(),
          limit: z.number().int().min(1).max(50).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return productPaymentService.getTrainerOrders(
        profile.id,
        input?.cursor,
        input?.limit,
      );
    }),

  updateStatus: trainerProcedure
    .use(requireTier("ELITE"))
    .input(updateOrderStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return productPaymentService.updateOrderStatus(
        profile.id,
        input.orderId,
        input.status,
      );
    }),

  refund: trainerProcedure
    .use(requireTier("ELITE"))
    .input(refundOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return productPaymentService.refundOrder(
        input.orderId,
        profile.id,
        input.reason,
      );
    }),
});
