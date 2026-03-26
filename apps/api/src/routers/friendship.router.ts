import { z } from 'zod';
import { router, protectedProcedure } from '../lib/trpc';
import { friendshipService } from '../services/friendship.service';

const paginationInput = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
});

export const friendshipRouter = router({
  sendRequest: protectedProcedure
    .input(z.object({ addresseeId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return friendshipService.sendRequest(ctx.user.id, input.addresseeId);
    }),

  acceptRequest: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return friendshipService.acceptRequest(ctx.user.id, input.requestId);
    }),

  declineRequest: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return friendshipService.declineRequest(ctx.user.id, input.requestId);
    }),

  removeFriend: protectedProcedure
    .input(z.object({ friendshipId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return friendshipService.removeFriend(ctx.user.id, input.friendshipId);
    }),

  blockUser: protectedProcedure
    .input(z.object({ targetId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return friendshipService.blockUser(ctx.user.id, input.targetId);
    }),

  unblockUser: protectedProcedure
    .input(z.object({ targetId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return friendshipService.unblockUser(ctx.user.id, input.targetId);
    }),

  getFriends: protectedProcedure
    .input(paginationInput)
    .query(async ({ input, ctx }) => {
      return friendshipService.getFriends(ctx.user.id, input.cursor, input.limit);
    }),

  getPendingCount: protectedProcedure
    .query(async ({ ctx }) => {
      return friendshipService.getPendingCount(ctx.user.id);
    }),

  getPendingRequests: protectedProcedure
    .input(paginationInput)
    .query(async ({ input, ctx }) => {
      return friendshipService.getPendingRequests(ctx.user.id, input.cursor, input.limit);
    }),

  getSentRequests: protectedProcedure
    .input(paginationInput)
    .query(async ({ input, ctx }) => {
      return friendshipService.getSentRequests(ctx.user.id, input.cursor, input.limit);
    }),

  areFriends: protectedProcedure
    .input(z.object({ targetId: z.string() }))
    .query(async ({ input, ctx }) => {
      return friendshipService.areFriends(ctx.user.id, input.targetId);
    }),

  getBlockedUsers: protectedProcedure
    .query(async ({ ctx }) => {
      return friendshipService.getBlockedUsers(ctx.user.id);
    }),

  getStatus: protectedProcedure
    .input(z.object({ targetId: z.string() }))
    .query(async ({ input, ctx }) => {
      return friendshipService.getFriendshipStatus(ctx.user.id, input.targetId);
    }),
});
