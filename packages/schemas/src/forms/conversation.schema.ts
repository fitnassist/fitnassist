import { z } from 'zod';

export const archiveConversationSchema = z.object({
  connectionId: z.string().cuid(),
});

export type ArchiveConversationInput = z.infer<typeof archiveConversationSchema>;

export const unarchiveConversationSchema = z.object({
  connectionId: z.string().cuid(),
});

export type UnarchiveConversationInput = z.infer<typeof unarchiveConversationSchema>;

export const deleteConversationSchema = z.object({
  connectionId: z.string().cuid(),
});

export type DeleteConversationInput = z.infer<typeof deleteConversationSchema>;
