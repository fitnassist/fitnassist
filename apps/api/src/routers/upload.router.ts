import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../lib/trpc';
import { cloudinaryService, type UploadType } from '../lib/cloudinary';

const uploadTypeSchema = z.enum(['profile', 'cover', 'gallery', 'video-intro', 'exercise-video', 'exercise-thumbnail', 'recipe-image', 'progress-photo']);

export const uploadRouter = router({
  /**
   * Get signed upload parameters for direct client-side upload to Cloudinary
   */
  getUploadParams: protectedProcedure
    .input(
      z.object({
        type: uploadTypeSchema,
      })
    )
    .mutation(async ({ input }) => {
      if (!cloudinaryService.isConfigured) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'File upload is not configured. Please set up Cloudinary credentials.',
        });
      }

      try {
        const params = cloudinaryService.getSignedUploadParams(input.type as UploadType);
        const config = cloudinaryService.getUploadConfig(input.type as UploadType);

        return {
          ...params,
          resourceType: config.resourceType,
          maxFileSize: config.maxFileSize,
        };
      } catch (error) {
        console.error('[Upload] Failed to generate upload params:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate upload parameters',
        });
      }
    }),

  /**
   * Delete an uploaded file from Cloudinary
   */
  deleteFile: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        resourceType: z.enum(['image', 'video']).default('image'),
      })
    )
    .mutation(async ({ input }) => {
      const publicId = cloudinaryService.getPublicIdFromUrl(input.url);

      if (!publicId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid file URL',
        });
      }

      const deleted = await cloudinaryService.deleteFile(publicId, input.resourceType);

      if (!deleted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete file',
        });
      }

      return { success: true };
    }),
});
