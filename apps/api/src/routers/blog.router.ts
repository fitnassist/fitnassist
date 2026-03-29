import { TRPCError } from '@trpc/server';
import { router, trainerProcedure, publicProcedure, requireTier } from '../lib/trpc';
import { trainerRepository } from '../repositories/trainer.repository';
import { blogService } from '../services/blog.service';
import { z } from 'zod';
import {
  createBlogPostSchema,
  updateBlogPostSchema,
  blogPostIdSchema,
  getPublicBlogPostsSchema,
  getPublicBlogPostSchema,
} from '@fitnassist/schemas';

const requireTrainerProfile = async (userId: string) => {
  const profile = await trainerRepository.findByUserId(userId);
  if (!profile) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
  }
  return profile;
};

export const blogRouter = router({
  // =========================================================================
  // Public
  // =========================================================================

  getPublicPosts: publicProcedure
    .input(getPublicBlogPostsSchema)
    .query(async ({ input }) => {
      return blogService.getPublicPosts(input.subdomain, input.cursor, input.limit, input.search, input.tag);
    }),

  getPublicTags: publicProcedure
    .input(z.object({ subdomain: z.string() }))
    .query(async ({ input }) => {
      return blogService.getPublicTags(input.subdomain);
    }),

  getPublicPost: publicProcedure
    .input(getPublicBlogPostSchema)
    .query(async ({ input }) => {
      return blogService.getPublicPost(input.subdomain, input.slug);
    }),

  // =========================================================================
  // Trainer (ELITE)
  // =========================================================================

  getMyPosts: trainerProcedure
    .use(requireTier('ELITE'))
    .query(async ({ ctx }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return blogService.getMyPosts(profile.id);
    }),

  create: trainerProcedure
    .use(requireTier('ELITE'))
    .input(createBlogPostSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return blogService.createPost(profile.id, input);
    }),

  update: trainerProcedure
    .use(requireTier('ELITE'))
    .input(updateBlogPostSchema)
    .mutation(async ({ ctx, input }) => {
      const { postId, ...data } = input;
      const profile = await requireTrainerProfile(ctx.user.id);
      return blogService.updatePost(profile.id, postId, data);
    }),

  delete: trainerProcedure
    .use(requireTier('ELITE'))
    .input(blogPostIdSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return blogService.deletePost(profile.id, input.postId);
    }),

  publish: trainerProcedure
    .use(requireTier('ELITE'))
    .input(blogPostIdSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return blogService.publishPost(profile.id, input.postId);
    }),

  unpublish: trainerProcedure
    .use(requireTier('ELITE'))
    .input(blogPostIdSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return blogService.unpublishPost(profile.id, input.postId);
    }),
});
