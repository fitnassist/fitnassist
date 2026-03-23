import { z } from 'zod';
import { router, protectedProcedure } from '../lib/trpc';
import { messageService } from '../services/message.service';
import {
  sendMessageSchema,
  archiveConversationSchema,
  unarchiveConversationSchema,
  deleteConversationSchema,
} from '@fitnassist/schemas';

export const messageRouter = router({
  send: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ input, ctx }) => {
      return messageService.sendMessage(input, ctx.user.id);
    }),

  getThread: protectedProcedure
    .input(z.object({
      connectionId: z.string().cuid(),
      limit: z.number().min(1).max(100).optional(),
      cursor: z.string().cuid().optional(),
    }))
    .query(async ({ input, ctx }) => {
      return messageService.getMessages(
        input.connectionId,
        ctx.user.id,
        { limit: input.limit, cursor: input.cursor }
      );
    }),

  markAsRead: protectedProcedure
    .input(z.object({
      connectionId: z.string().cuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      return messageService.markAsRead(input.connectionId, ctx.user.id);
    }),

  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      return messageService.getUnreadCount(ctx.user.id);
    }),

  getConnections: protectedProcedure
    .input(z.object({
      archived: z.boolean().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      return messageService.getConnections(ctx.user.id, input?.archived);
    }),

  getConnection: protectedProcedure
    .input(z.object({
      connectionId: z.string().cuid(),
    }))
    .query(async ({ input, ctx }) => {
      return messageService.getConnection(input.connectionId, ctx.user.id);
    }),

  archiveConversation: protectedProcedure
    .input(archiveConversationSchema)
    .mutation(async ({ input, ctx }) => {
      return messageService.archiveConversation(input.connectionId, ctx.user.id);
    }),

  unarchiveConversation: protectedProcedure
    .input(unarchiveConversationSchema)
    .mutation(async ({ input, ctx }) => {
      return messageService.unarchiveConversation(input.connectionId, ctx.user.id);
    }),

  deleteConversation: protectedProcedure
    .input(deleteConversationSchema)
    .mutation(async ({ input, ctx }) => {
      return messageService.deleteConversation(input.connectionId, ctx.user.id);
    }),
});
