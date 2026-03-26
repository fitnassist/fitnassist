import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../lib/trpc';
import { followService } from '../services/follow.service';

export const followRouter = router({
  follow: protectedProcedure
    .input(z.object({
      followingId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return followService.followUser(ctx.user.id, input.followingId);
    }),

  unfollow: protectedProcedure
    .input(z.object({
      followingId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return followService.unfollowUser(ctx.user.id, input.followingId);
    }),

  getFollowers: publicProcedure
    .input(z.object({
      userId: z.string(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      return followService.getFollowers(input.userId, input.cursor, input.limit);
    }),

  getFollowing: publicProcedure
    .input(z.object({
      userId: z.string(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      return followService.getFollowing(input.userId, input.cursor, input.limit);
    }),

  isFollowing: protectedProcedure
    .input(z.object({
      followingId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      return followService.isFollowing(ctx.user.id, input.followingId);
    }),

  getFollowCounts: publicProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ input }) => {
      return followService.getFollowCounts(input.userId);
    }),
});
