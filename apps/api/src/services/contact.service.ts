import { TRPCError } from '@trpc/server';
import { contactRepository } from '../repositories/contact.repository';
import { trainerRepository } from '../repositories/trainer.repository';
import { userRepository } from '../repositories/user.repository';
import { messageRepository } from '../repositories/message.repository';
import { notificationService } from './notification.service';
import { clientRosterService } from './client-roster.service';
import { clientRosterRepository } from '../repositories/client-roster.repository';
import { onboardingService } from './onboarding.service';
import { sseManager } from '../lib/sse';
import type { CallbackRequestInput, ConnectionRequestInput } from '@fitnassist/schemas';
import type { ContactRequestStatus } from '@fitnassist/database';
import type { SseNewRequestEvent, SseConnectionAcceptedEvent, SseConnectionDeclinedEvent } from '@fitnassist/types';

export const contactService = {
  async submitCallbackRequest(data: CallbackRequestInput, senderId: string) {
    // Get sender info
    const sender = await userRepository.findById(senderId);
    if (!sender) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // Verify trainer exists
    const trainer = await trainerRepository.findById(data.trainerId);
    if (!trainer || !trainer.isPublished) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer not found',
      });
    }

    // Check for existing pending request
    const existingRequest = await contactRepository.findPendingByTraineeAndTrainer(
      senderId,
      data.trainerId
    );
    if (existingRequest) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'You already have a pending request with this trainer',
      });
    }

    // Create callback request
    const request = await contactRepository.create({
      trainerId: data.trainerId,
      senderId,
      type: 'CALLBACK_REQUEST',
      name: sender.name,
      email: sender.email,
      phone: data.phone,
      message: data.message,
    });

    // Notify trainer via SSE
    const sseEvent: SseNewRequestEvent = {
      type: 'new_request',
      requestId: request.id,
      requestType: 'CALLBACK_REQUEST',
      senderName: sender.name,
    };
    sseManager.broadcastToUser(trainer.user.id, 'message', sseEvent);

    // Send email notification to trainer (respects preferences)
    await notificationService.notifyCallbackRequest(
      trainer.user.id,
      trainer.contactEmail || trainer.user.email,
      sender.name,
      sender.email,
      data.phone,
      data.message,
    );

    return request;
  },

  async submitConnectionRequest(data: ConnectionRequestInput, senderId: string) {
    // Get sender info
    const sender = await userRepository.findById(senderId);
    if (!sender) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // Verify trainer exists
    const trainer = await trainerRepository.findById(data.trainerId);
    if (!trainer || !trainer.isPublished) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer not found',
      });
    }

    // Check for existing pending request
    const existingRequest = await contactRepository.findPendingByTraineeAndTrainer(
      senderId,
      data.trainerId
    );
    if (existingRequest) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'You already have a pending request with this trainer',
      });
    }

    // Check for a previously closed (disconnected) connection — reopen it instead of creating a new one
    const closedConnection = await contactRepository.findClosedConnectionByTraineeAndTrainer(
      senderId,
      data.trainerId
    );

    let request;
    if (closedConnection) {
      // Reopen the old connection so message history is preserved
      request = await contactRepository.reopen(closedConnection.id);
    } else {
      // Create new connection request
      request = await contactRepository.create({
        trainerId: data.trainerId,
        senderId,
        type: 'CONNECTION_REQUEST',
        name: sender.name,
        email: sender.email,
        message: data.message,
      });
    }

    // Notify trainer via SSE
    const sseEvent: SseNewRequestEvent = {
      type: 'new_request',
      requestId: request.id,
      requestType: 'CONNECTION_REQUEST',
      senderName: sender.name,
    };
    sseManager.broadcastToUser(trainer.user.id, 'message', sseEvent);

    // Send email notification to trainer (respects preferences)
    await notificationService.notifyConnectionRequest(
      trainer.user.id,
      trainer.contactEmail || trainer.user.email,
      sender.name,
      sender.email,
      data.message,
    );

    return request;
  },

  async checkPendingRequest(traineeId: string, trainerId: string) {
    const request = await contactRepository.findConnectionByTraineeAndTrainer(traineeId, trainerId);
    return {
      hasPending: request?.status === 'PENDING',
      isConnected: request?.status === 'ACCEPTED',
      connectionId: request?.id,
      request,
    };
  },

  async acceptConnection(requestId: string, userId: string) {
    const request = await contactRepository.findById(requestId);
    if (!request) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Connection request not found',
      });
    }

    // Verify the user owns this trainer profile
    if (request.trainer.userId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to accept this request',
      });
    }

    // Verify this is a connection request and is pending
    if (request.type !== 'CONNECTION_REQUEST') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This is not a connection request',
      });
    }

    if (request.status !== 'PENDING') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This request has already been responded to',
      });
    }

    const updatedRequest = await contactRepository.accept(requestId);

    // Check if there's an existing disconnected roster entry for this connection
    // (happens when reconnecting after a disconnect — the old connection was reopened)
    const existingRoster = await clientRosterRepository.findByConnectionId(requestId);
    let clientRoster;
    if (existingRoster) {
      // Reactivate the existing roster entry
      await clientRosterRepository.updateStatus(existingRoster.id, 'ACTIVE');
      clientRoster = existingRoster;
    } else {
      // Create new client roster entry
      clientRoster = await clientRosterService.createForConnection(request.trainerId, requestId);
    }

    // Trigger onboarding if trainer has an active template
    try {
      await onboardingService.createResponseForConnection(request.trainerId, clientRoster.id);
    } catch {
      // Non-blocking: don't fail accept if onboarding creation fails
    }

    // Create initial message from the original request message (only for new connections)
    if (!existingRoster && request.message && request.senderId) {
      await messageRepository.create({
        connectionId: requestId,
        senderId: request.senderId,
        content: request.message,
      });
    }

    // Notify trainee via SSE
    if (request.senderId) {
      const sseEvent: SseConnectionAcceptedEvent = {
        type: 'connection_accepted',
        requestId,
        trainerName: request.trainer.displayName,
      };
      sseManager.broadcastToUser(request.senderId, 'message', sseEvent);
    }

    // Send email notification to trainee (respects preferences)
    if (request.senderId && request.email) {
      await notificationService.notifyConnectionAccepted(
        request.senderId,
        request.email,
        request.trainer.displayName,
        requestId,
      );
    }

    return updatedRequest;
  },

  async declineConnection(requestId: string, userId: string) {
    const request = await contactRepository.findById(requestId);
    if (!request) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Connection request not found',
      });
    }

    // Verify the user owns this trainer profile
    if (request.trainer.userId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to decline this request',
      });
    }

    // Verify this is a connection request and is pending
    if (request.type !== 'CONNECTION_REQUEST') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This is not a connection request',
      });
    }

    if (request.status !== 'PENDING') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This request has already been responded to',
      });
    }

    const updatedRequest = await contactRepository.decline(requestId);

    // Notify trainee via SSE
    if (request.senderId) {
      const sseEvent: SseConnectionDeclinedEvent = {
        type: 'connection_declined',
        requestId,
        trainerName: request.trainer.displayName,
      };
      sseManager.broadcastToUser(request.senderId, 'message', sseEvent);
    }

    // Send email notification to trainee (respects preferences)
    if (request.senderId && request.email) {
      await notificationService.notifyConnectionDeclined(
        request.senderId,
        request.email,
        request.trainer.displayName,
      );
    }

    return updatedRequest;
  },

  async getRequestsForTrainer(trainerId: string, status?: ContactRequestStatus) {
    return contactRepository.findByTrainerId(trainerId, status);
  },

  async getSentRequests(senderId: string) {
    return contactRepository.findBySenderId(senderId);
  },

  async updateStatus(requestId: string, status: ContactRequestStatus, userId: string) {
    const request = await contactRepository.findById(requestId);
    if (!request) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Contact request not found',
      });
    }

    // Verify the user owns this trainer profile
    if (request.trainer.userId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this request',
      });
    }

    return contactRepository.updateStatus(requestId, status);
  },

  async getStatsForTrainer(trainerId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      connectionsTotal,
      connections30Days,
      connections7Days,
      callbacksTotal,
      callbacks30Days,
      callbacks7Days,
    ] = await Promise.all([
      contactRepository.getCountByTrainerId(trainerId, 'CONNECTION_REQUEST'),
      contactRepository.getCountByTrainerId(trainerId, 'CONNECTION_REQUEST', thirtyDaysAgo),
      contactRepository.getCountByTrainerId(trainerId, 'CONNECTION_REQUEST', sevenDaysAgo),
      contactRepository.getCountByTrainerId(trainerId, 'CALLBACK_REQUEST'),
      contactRepository.getCountByTrainerId(trainerId, 'CALLBACK_REQUEST', thirtyDaysAgo),
      contactRepository.getCountByTrainerId(trainerId, 'CALLBACK_REQUEST', sevenDaysAgo),
    ]);

    return {
      connections: {
        total: connectionsTotal,
        last30Days: connections30Days,
        last7Days: connections7Days,
      },
      callbacks: {
        total: callbacksTotal,
        last30Days: callbacks30Days,
        last7Days: callbacks7Days,
      },
    };
  },
};
