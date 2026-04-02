import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contactService } from '../contact.service';

vi.mock('../../repositories/contact.repository', () => ({
  contactRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findPendingByTraineeAndTrainer: vi.fn(),
    findClosedConnectionByTraineeAndTrainer: vi.fn(),
    reopen: vi.fn(),
    findConnectionByTraineeAndTrainer: vi.fn(),
    accept: vi.fn(),
    decline: vi.fn(),
    findByTrainerId: vi.fn(),
    findBySenderId: vi.fn(),
    updateStatus: vi.fn(),
    getCountByTrainerId: vi.fn(),
  },
}));

vi.mock('../../repositories/trainer.repository', () => ({
  trainerRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('../../repositories/user.repository', () => ({
  userRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('../../repositories/message.repository', () => ({
  messageRepository: {
    create: vi.fn(),
  },
}));

vi.mock('../notification.service', () => ({
  notificationService: {
    notifyConnectionRequest: vi.fn().mockResolvedValue(undefined),
    notifyConnectionAccepted: vi.fn().mockResolvedValue(undefined),
    notifyConnectionDeclined: vi.fn().mockResolvedValue(undefined),
    notifyCallbackRequest: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../client-roster.service', () => ({
  clientRosterService: {
    createForConnection: vi.fn().mockResolvedValue({ id: 'roster-1' }),
  },
}));

vi.mock('../../repositories/client-roster.repository', () => ({
  clientRosterRepository: {
    findByConnectionId: vi.fn().mockResolvedValue(null),
    updateStatus: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../onboarding.service', () => ({
  onboardingService: {
    createResponseForConnection: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../in-app-notification.service', () => ({
  inAppNotificationService: {
    notify: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../lib/sse', () => ({
  sseManager: {
    broadcastToUser: vi.fn(),
  },
}));

import { contactRepository } from '../../repositories/contact.repository';
import { trainerRepository } from '../../repositories/trainer.repository';
import { userRepository } from '../../repositories/user.repository';
import { messageRepository } from '../../repositories/message.repository';

const mockContactRepo = vi.mocked(contactRepository);
const mockTrainerRepo = vi.mocked(trainerRepository);
const mockUserRepo = vi.mocked(userRepository);
const mockMessageRepo = vi.mocked(messageRepository);

describe('contactService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitConnectionRequest', () => {
    it('creates connection request successfully', async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 'user-1', name: 'Jane', email: 'jane@test.com' } as any);
      mockTrainerRepo.findById.mockResolvedValue({
        id: 'trainer-1',
        isPublished: true,
        user: { id: 'trainer-user', email: 'trainer@test.com' },
        contactEmail: null,
      } as any);
      mockContactRepo.findPendingByTraineeAndTrainer.mockResolvedValue(null);
      mockContactRepo.findClosedConnectionByTraineeAndTrainer.mockResolvedValue(null);
      mockContactRepo.create.mockResolvedValue({ id: 'request-1' } as any);

      const result = await contactService.submitConnectionRequest(
        { trainerId: 'trainer-1', message: 'Hi' } as any,
        'user-1'
      );

      expect(result).toEqual({ id: 'request-1' });
      expect(mockContactRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'CONNECTION_REQUEST', senderId: 'user-1' })
      );
    });

    it('throws NOT_FOUND when sender not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(
        contactService.submitConnectionRequest({ trainerId: 'trainer-1' } as any, 'user-1')
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws NOT_FOUND when trainer not found', async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 'user-1', name: 'Jane', email: 'jane@test.com' } as any);
      mockTrainerRepo.findById.mockResolvedValue(null);

      await expect(
        contactService.submitConnectionRequest({ trainerId: 'trainer-1' } as any, 'user-1')
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws NOT_FOUND when trainer is unpublished', async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 'user-1', name: 'Jane', email: 'jane@test.com' } as any);
      mockTrainerRepo.findById.mockResolvedValue({
        id: 'trainer-1',
        isPublished: false,
        user: { id: 'tu', email: 't@t.com' },
        contactEmail: null,
      } as any);

      await expect(
        contactService.submitConnectionRequest({ trainerId: 'trainer-1' } as any, 'user-1')
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws CONFLICT on duplicate request', async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 'user-1', name: 'Jane', email: 'jane@test.com' } as any);
      mockTrainerRepo.findById.mockResolvedValue({
        id: 'trainer-1',
        isPublished: true,
        user: { id: 'tu', email: 't@t.com' },
        contactEmail: null,
      } as any);
      mockContactRepo.findPendingByTraineeAndTrainer.mockResolvedValue({ id: 'existing' } as any);

      await expect(
        contactService.submitConnectionRequest({ trainerId: 'trainer-1' } as any, 'user-1')
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });
  });

  describe('acceptConnection', () => {
    const mockRequest = {
      id: 'req-1',
      type: 'CONNECTION_REQUEST',
      status: 'PENDING',
      senderId: 'trainee-user',
      email: 'trainee@test.com',
      message: 'Hello trainer!',
      trainer: { userId: 'trainer-user', displayName: 'Coach Mike' },
    };

    it('accepts and creates initial message', async () => {
      mockContactRepo.findById.mockResolvedValue(mockRequest as any);
      mockContactRepo.accept.mockResolvedValue({ ...mockRequest, status: 'ACCEPTED' } as any);
      mockMessageRepo.create.mockResolvedValue({ id: 'msg-1' } as any);

      const result = await contactService.acceptConnection('req-1', 'trainer-user');

      expect(result.status).toBe('ACCEPTED');
      expect(mockMessageRepo.create).toHaveBeenCalledWith({
        connectionId: 'req-1',
        senderId: 'trainee-user',
        content: 'Hello trainer!',
      });
    });

    it('throws NOT_FOUND when request missing', async () => {
      mockContactRepo.findById.mockResolvedValue(null);

      await expect(
        contactService.acceptConnection('req-1', 'trainer-user')
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws FORBIDDEN when user is not the trainer', async () => {
      mockContactRepo.findById.mockResolvedValue(mockRequest as any);

      await expect(
        contactService.acceptConnection('req-1', 'wrong-user')
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('throws BAD_REQUEST when not a connection request type', async () => {
      mockContactRepo.findById.mockResolvedValue({
        ...mockRequest,
        type: 'CALLBACK_REQUEST',
      } as any);

      await expect(
        contactService.acceptConnection('req-1', 'trainer-user')
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('throws BAD_REQUEST when not pending', async () => {
      mockContactRepo.findById.mockResolvedValue({ ...mockRequest, status: 'ACCEPTED' } as any);

      await expect(
        contactService.acceptConnection('req-1', 'trainer-user')
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('does not create initial message when no message content', async () => {
      const requestNoMessage = { ...mockRequest, message: null };
      mockContactRepo.findById.mockResolvedValue(requestNoMessage as any);
      mockContactRepo.accept.mockResolvedValue({ ...requestNoMessage, status: 'ACCEPTED' } as any);

      await contactService.acceptConnection('req-1', 'trainer-user');

      expect(mockMessageRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('declineConnection', () => {
    const mockRequest = {
      id: 'req-1',
      type: 'CONNECTION_REQUEST',
      status: 'PENDING',
      senderId: 'trainee-user',
      email: 'trainee@test.com',
      trainer: { userId: 'trainer-user', displayName: 'Coach Mike' },
    };

    it('declines successfully', async () => {
      mockContactRepo.findById.mockResolvedValue(mockRequest as any);
      mockContactRepo.decline.mockResolvedValue({ ...mockRequest, status: 'DECLINED' } as any);

      const result = await contactService.declineConnection('req-1', 'trainer-user');
      expect(result.status).toBe('DECLINED');
    });

    it('throws NOT_FOUND when request missing', async () => {
      mockContactRepo.findById.mockResolvedValue(null);

      await expect(
        contactService.declineConnection('req-1', 'trainer-user')
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws FORBIDDEN when user is not the trainer', async () => {
      mockContactRepo.findById.mockResolvedValue(mockRequest as any);

      await expect(
        contactService.declineConnection('req-1', 'wrong-user')
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('throws BAD_REQUEST when not a connection request type', async () => {
      mockContactRepo.findById.mockResolvedValue({
        ...mockRequest,
        type: 'CALLBACK_REQUEST',
      } as any);

      await expect(
        contactService.declineConnection('req-1', 'trainer-user')
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('throws BAD_REQUEST when not pending', async () => {
      mockContactRepo.findById.mockResolvedValue({ ...mockRequest, status: 'DECLINED' } as any);

      await expect(
        contactService.declineConnection('req-1', 'trainer-user')
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
  });
});
