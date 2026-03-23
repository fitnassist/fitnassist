import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, trainerProcedure, publicProcedure } from '../lib/trpc';
import { galleryRepository } from '../repositories/gallery.repository';
import { trainerRepository } from '../repositories/trainer.repository';
import { cloudinaryService } from '../lib/cloudinary';

export const galleryRouter = router({
  list: publicProcedure
    .input(z.object({ trainerId: z.string().cuid() }))
    .query(async ({ input }) => {
      return galleryRepository.findByTrainerId(input.trainerId);
    }),

  add: trainerProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input, ctx }) => {
      const profile = await trainerRepository.findByUserId(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
      }

      try {
        return await galleryRepository.add(profile.id, input.url);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Gallery is full')) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: error.message });
        }
        throw error;
      }
    }),

  remove: trainerProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const profile = await trainerRepository.findByUserId(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
      }

      const image = await galleryRepository.findById(input.id);
      if (!image || image.trainerId !== profile.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Gallery image not found' });
      }

      // Delete from Cloudinary
      const publicId = cloudinaryService.getPublicIdFromUrl(image.url);
      if (publicId) {
        await cloudinaryService.deleteFile(publicId, 'image');
      }

      return galleryRepository.remove(input.id);
    }),

  reorder: trainerProcedure
    .input(z.object({ imageIds: z.array(z.string().cuid()) }))
    .mutation(async ({ input, ctx }) => {
      const profile = await trainerRepository.findByUserId(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
      }

      return galleryRepository.reorder(profile.id, input.imageIds);
    }),
});
