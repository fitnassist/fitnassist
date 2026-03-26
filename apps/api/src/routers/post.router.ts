import { z } from 'zod';
import { router, protectedProcedure } from '../lib/trpc';
import { postService } from '../services/post.service';

const paginationInput = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
});

export const postRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1, 'Post content is required').max(5000),
        imageUrl: z.string().url().optional(),
        visibility: z.enum(['ONLY_ME', 'MY_PT', 'PT_AND_FRIENDS', 'EVERYONE']).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return postService.createPost(ctx.user.id, input);
    }),

  delete: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return postService.deletePost(ctx.user.id, input.postId);
    }),

  getFeed: protectedProcedure
    .input(paginationInput)
    .query(async ({ input, ctx }) => {
      return postService.getFeed(ctx.user.id, input.cursor, input.limit);
    }),

  getUserPosts: protectedProcedure
    .input(
      paginationInput.extend({
        userId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      return postService.getUserPosts(input.userId, ctx.user.id, input.cursor, input.limit);
    }),

  like: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return postService.likePost(ctx.user.id, input.postId);
    }),

  unlike: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return postService.unlikePost(ctx.user.id, input.postId);
    }),

  likeDiaryEntry: protectedProcedure
    .input(z.object({ diaryEntryId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return postService.likeDiaryEntry(ctx.user.id, input.diaryEntryId);
    }),

  unlikeDiaryEntry: protectedProcedure
    .input(z.object({ diaryEntryId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return postService.unlikeDiaryEntry(ctx.user.id, input.diaryEntryId);
    }),

  getPostLikers: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ input }) => {
      return postService.getPostLikers(input.postId);
    }),

  getDiaryEntryLikers: protectedProcedure
    .input(z.object({ diaryEntryId: z.string() }))
    .query(async ({ input }) => {
      return postService.getDiaryEntryLikers(input.diaryEntryId);
    }),

  getNewFeedCount: protectedProcedure
    .query(async ({ ctx }) => {
      return postService.getNewFeedCount(ctx.user.id);
    }),

  markFeedViewed: protectedProcedure
    .mutation(async ({ ctx }) => {
      return postService.markFeedViewed(ctx.user.id);
    }),
});
