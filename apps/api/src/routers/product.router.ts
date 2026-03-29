import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, trainerProcedure, publicProcedure, requireTier } from '../lib/trpc';
import { trainerRepository } from '../repositories/trainer.repository';
import { productService } from '../services/product.service';
import {
  createProductSchema,
  updateProductSchema,
  publishProductSchema,
  archiveProductSchema,
  deleteProductSchema,
  reorderProductsSchema,
} from '@fitnassist/schemas';

const requireTrainerProfile = async (userId: string) => {
  const profile = await trainerRepository.findByUserId(userId);
  if (!profile) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
  }
  return profile;
};

export const productRouter = router({
  // =========================================================================
  // Public
  // =========================================================================

  getPublicProducts: publicProcedure
    .input(z.object({ trainerId: z.string() }))
    .query(async ({ input }) => {
      return productService.getPublicProducts(input.trainerId);
    }),

  getPublicProduct: publicProcedure
    .input(z.object({ trainerId: z.string(), slug: z.string() }))
    .query(async ({ input }) => {
      return productService.getPublicProduct(input.trainerId, input.slug);
    }),

  // =========================================================================
  // Trainer (ELITE)
  // =========================================================================

  list: trainerProcedure
    .use(requireTier('ELITE'))
    .query(async ({ ctx }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return productService.getProducts(profile.id);
    }),

  get: trainerProcedure
    .use(requireTier('ELITE'))
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return productService.getProduct(profile.id, input.productId);
    }),

  create: trainerProcedure
    .use(requireTier('ELITE'))
    .input(createProductSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return productService.createProduct(profile.id, input);
    }),

  update: trainerProcedure
    .use(requireTier('ELITE'))
    .input(updateProductSchema)
    .mutation(async ({ ctx, input }) => {
      const { productId, ...data } = input;
      const profile = await requireTrainerProfile(ctx.user.id);
      return productService.updateProduct(profile.id, productId, data);
    }),

  delete: trainerProcedure
    .use(requireTier('ELITE'))
    .input(deleteProductSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return productService.deleteProduct(profile.id, input.productId);
    }),

  publish: trainerProcedure
    .use(requireTier('ELITE'))
    .input(publishProductSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return productService.publishProduct(profile.id, input.productId);
    }),

  archive: trainerProcedure
    .use(requireTier('ELITE'))
    .input(archiveProductSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return productService.archiveProduct(profile.id, input.productId);
    }),

  reorder: trainerProcedure
    .use(requireTier('ELITE'))
    .input(reorderProductsSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return productService.reorderProducts(profile.id, input.productIds);
    }),
});
