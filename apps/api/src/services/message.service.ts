import { TRPCError } from '@trpc/server';
import { messageRepository } from '../repositories/message.repository';
import { contactRepository } from '../repositories/contact.repository';
import { conversationPreferenceRepository } from '../repositories/conversation-preference.repository';
import { userRepository } from '../repositories/user.repository';
import { notificationService } from './notification.service';
import { sseManager } from '../lib/sse';
import type { SendMessageInput } from '@fitnassist/schemas';
import type { SseNewMessageEvent, SseMessagesReadEvent } from '@fitnassist/types';

const verifyParticipant = async (connectionId: string, userId: string) => {
  const connection = await contactRepository.findByIdWithParticipants(connectionId);

  if (!connection) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Connection not found' });
  }

  const isTrainee = connection.senderId === userId;
  const isTrainer = connection.trainer.userId === userId;

  if (!isTrainee && !isTrainer) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not a participant in this connection' });
  }

  return { connection, isTrainee, isTrainer };
};

export const messageService = {
  async sendMessage(data: SendMessageInput, senderId: string) {
    const { connection, isTrainee } = await verifyParticipant(data.connectionId, senderId);

    if (connection.status !== 'ACCEPTED') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Cannot send messages until connection is accepted',
      });
    }

    const message = await messageRepository.create({
      connectionId: data.connectionId,
      senderId,
      content: data.content,
    });

    // Broadcast new message to both participants via SSE
    const sseEvent: SseNewMessageEvent = {
      type: 'new_message',
      connectionId: data.connectionId,
      message,
    };
    const participantIds = [connection.senderId, connection.trainer.userId].filter(Boolean) as string[];
    sseManager.broadcastToUsers(participantIds, 'message', sseEvent);

    // Send email notification to the other participant (fire-and-forget)
    const recipientUserId = isTrainee ? connection.trainer.userId : connection.senderId;
    if (recipientUserId) {
      const [sender, recipient] = await Promise.all([
        userRepository.findById(senderId),
        userRepository.findById(recipientUserId),
      ]);

      if (sender && recipient) {
        notificationService.notifyNewMessage(
          recipientUserId,
          recipient.email,
          sender.name,
          data.content,
          data.connectionId,
        ).catch(() => {
          // Don't fail the message send if notification fails
        });
      }
    }

    return message;
  },

  async getMessages(
    connectionId: string,
    userId: string,
    options?: { limit?: number; cursor?: string }
  ) {
    await verifyParticipant(connectionId, userId);

    // Look up user's deletedAt for this connection
    const pref = await conversationPreferenceRepository.findByConnectionAndUser(connectionId, userId);
    const afterDate = pref?.deletedAt ?? undefined;

    // Mark messages as read
    await messageRepository.markConnectionAsRead(connectionId, userId);

    return messageRepository.findByConnectionId(connectionId, {
      ...options,
      afterDate,
    });
  },

  async markAsRead(connectionId: string, userId: string) {
    const { connection, isTrainee } = await verifyParticipant(connectionId, userId);

    const result = await messageRepository.markConnectionAsRead(connectionId, userId);

    // Broadcast read status to the other participant via SSE
    const otherUserId = isTrainee ? connection.trainer.userId : connection.senderId;
    if (otherUserId) {
      const sseEvent: SseMessagesReadEvent = {
        type: 'messages_read',
        connectionId,
        readBy: userId,
      };
      sseManager.broadcastToUser(otherUserId, 'message', sseEvent);
    }

    return result;
  },

  async getUnreadCount(userId: string) {
    // Get user's deletion preferences to respect deletedAt
    const prefs = await conversationPreferenceRepository.findByUser(userId);
    const deletedAtMap = new Map<string, Date>();
    for (const pref of prefs) {
      if (pref.deletedAt) {
        deletedAtMap.set(pref.connectionId, pref.deletedAt);
      }
    }

    const count = await messageRepository.getUnreadCount(
      userId,
      deletedAtMap.size > 0 ? deletedAtMap : undefined
    );
    return { count };
  },

  async getConnections(userId: string, archived?: boolean) {
    const connections = await contactRepository.findConnectionsForUser(userId);

    // Get user's preferences for filtering
    const prefs = await conversationPreferenceRepository.findByUser(userId);
    const prefsMap = new Map(prefs.map(p => [p.connectionId, p]));

    // Enrich each connection with unread count and filtered messages
    const enriched = await Promise.all(
      connections.map(async (connection) => {
        const pref = prefsMap.get(connection.id);
        const isArchived = pref?.isArchived ?? false;
        const deletedAt = pref?.deletedAt ?? undefined;

        const unreadCount = await messageRepository.getUnreadCountByConnection(
          connection.id,
          userId,
          deletedAt
        );

        // Filter out last message if it's before the user's deletedAt
        let filteredMessages = connection.messages;
        if (deletedAt && filteredMessages.length > 0) {
          filteredMessages = filteredMessages.filter(
            (msg) => new Date(msg.createdAt) >= deletedAt
          );
        }

        // A "deleted" conversation (has deletedAt) with no messages after deletion
        // should be completely hidden from both lists
        const hasNewMessagesAfterDelete = deletedAt
          ? filteredMessages.length > 0 || unreadCount > 0
          : true;

        return {
          ...connection,
          messages: filteredMessages,
          unreadCount,
          _isArchived: isArchived,
          _isDeleted: !!deletedAt,
          _hasNewMessagesAfterDelete: hasNewMessagesAfterDelete,
        };
      })
    );

    return enriched.filter((conn) => {
      // Deleted conversations with no new activity are completely hidden
      if (conn._isDeleted && !conn._hasNewMessagesAfterDelete) return false;

      if (archived) {
        // Archived list: only show archived conversations
        return conn._isArchived;
      } else {
        // Main list: show non-archived conversations
        // Deleted conversations that have new messages show in main list (not archived)
        return !conn._isArchived;
      }
    }).map(({ _isArchived, _isDeleted, _hasNewMessagesAfterDelete, ...conn }) => conn);
  },

  async getConnection(connectionId: string, userId: string) {
    const connection = await contactRepository.findByIdWithParticipants(connectionId);

    if (!connection) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Connection not found' });
    }

    const isTrainee = connection.senderId === userId;
    const isTrainer = connection.trainer.userId === userId;

    if (!isTrainee && !isTrainer) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not a participant in this connection' });
    }

    return connection;
  },

  async archiveConversation(connectionId: string, userId: string) {
    await verifyParticipant(connectionId, userId);
    return conversationPreferenceRepository.upsertArchive(connectionId, userId, true);
  },

  async unarchiveConversation(connectionId: string, userId: string) {
    await verifyParticipant(connectionId, userId);
    return conversationPreferenceRepository.upsertArchive(connectionId, userId, false);
  },

  async deleteConversation(connectionId: string, userId: string) {
    await verifyParticipant(connectionId, userId);
    return conversationPreferenceRepository.upsertDelete(connectionId, userId);
  },
};
