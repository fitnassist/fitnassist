import { describe, it, expect, vi, beforeEach } from 'vitest';
import { messageService } from '../message.service';

vi.mock('../../repositories/message.repository', () => ({
  messageRepository: {
    create: vi.fn(),
    findByConnectionId: vi.fn(),
    markConnectionAsRead: vi.fn(),
    getUnreadCount: vi.fn(),
    getUnreadCountByConnection: vi.fn(),
  },
}));

vi.mock('../../repositories/contact.repository', () => ({
  contactRepository: {
    findByIdWithParticipants: vi.fn(),
    findConnectionsForUser: vi.fn(),
  },
}));

vi.mock('../../repositories/user.repository', () => ({
  userRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('../notification.service', () => ({
  notificationService: {
    notifyNewMessage: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../repositories/notification.repository', () => ({
  notificationRepository: {
    findExistingUnread: vi.fn().mockResolvedValue(null),
    dismiss: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../repositories/conversation-preference.repository', () => ({
  conversationPreferenceRepository: {
    findByConnectionAndUser: vi.fn().mockResolvedValue(null),
    findByUserAndConnection: vi.fn().mockResolvedValue(null),
    findByUser: vi.fn().mockResolvedValue([]),
  },
}));

import { messageRepository } from '../../repositories/message.repository';
import { contactRepository } from '../../repositories/contact.repository';
import { userRepository } from '../../repositories/user.repository';

const mockMessageRepo = vi.mocked(messageRepository);
const mockContactRepo = vi.mocked(contactRepository);
const mockUserRepo = vi.mocked(userRepository);

const mockConnection = {
  id: 'conn-1',
  status: 'ACCEPTED',
  senderId: 'trainee-user',
  trainer: { userId: 'trainer-user' },
};

describe('messageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('sends message as trainee', async () => {
      mockContactRepo.findByIdWithParticipants.mockResolvedValue(mockConnection as any);
      mockMessageRepo.create.mockResolvedValue({ id: 'msg-1', content: 'Hi' } as any);
      mockUserRepo.findById.mockResolvedValue({ id: 'u1', name: 'User', email: 'u@t.com' } as any);

      const result = await messageService.sendMessage(
        { connectionId: 'conn-1', content: 'Hi' },
        'trainee-user'
      );

      expect(result.content).toBe('Hi');
      expect(mockMessageRepo.create).toHaveBeenCalledWith({
        connectionId: 'conn-1',
        senderId: 'trainee-user',
        content: 'Hi',
      });
    });

    it('sends message as trainer', async () => {
      mockContactRepo.findByIdWithParticipants.mockResolvedValue(mockConnection as any);
      mockMessageRepo.create.mockResolvedValue({ id: 'msg-1', content: 'Hello' } as any);
      mockUserRepo.findById.mockResolvedValue({ id: 'u1', name: 'User', email: 'u@t.com' } as any);

      const result = await messageService.sendMessage(
        { connectionId: 'conn-1', content: 'Hello' },
        'trainer-user'
      );

      expect(result.content).toBe('Hello');
    });

    it('throws NOT_FOUND when connection missing', async () => {
      mockContactRepo.findByIdWithParticipants.mockResolvedValue(null);

      await expect(
        messageService.sendMessage({ connectionId: 'bad', content: 'Hi' }, 'user-1')
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws FORBIDDEN when not a participant', async () => {
      mockContactRepo.findByIdWithParticipants.mockResolvedValue(mockConnection as any);

      await expect(
        messageService.sendMessage({ connectionId: 'conn-1', content: 'Hi' }, 'random-user')
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('throws FORBIDDEN when connection not accepted', async () => {
      mockContactRepo.findByIdWithParticipants.mockResolvedValue({
        ...mockConnection,
        status: 'PENDING',
      } as any);

      await expect(
        messageService.sendMessage({ connectionId: 'conn-1', content: 'Hi' }, 'trainee-user')
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });
  });

  describe('getMessages', () => {
    it('returns messages for participant and marks as read', async () => {
      mockContactRepo.findByIdWithParticipants.mockResolvedValue(mockConnection as any);
      mockMessageRepo.markConnectionAsRead.mockResolvedValue(undefined as any);
      mockMessageRepo.findByConnectionId.mockResolvedValue([{ id: 'msg-1' }] as any);

      const result = await messageService.getMessages('conn-1', 'trainee-user');

      expect(result).toHaveLength(1);
      expect(mockMessageRepo.markConnectionAsRead).toHaveBeenCalledWith('conn-1', 'trainee-user');
    });

    it('throws NOT_FOUND when connection missing', async () => {
      mockContactRepo.findByIdWithParticipants.mockResolvedValue(null);

      await expect(
        messageService.getMessages('conn-1', 'trainee-user')
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws FORBIDDEN for non-participant', async () => {
      mockContactRepo.findByIdWithParticipants.mockResolvedValue(mockConnection as any);

      await expect(
        messageService.getMessages('conn-1', 'random-user')
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });
  });

  describe('getConnections', () => {
    it('returns connections with unread counts', async () => {
      mockContactRepo.findConnectionsForUser.mockResolvedValue([
        { id: 'conn-1' },
        { id: 'conn-2' },
      ] as any);
      mockMessageRepo.getUnreadCountByConnection
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(0);

      const result = await messageService.getConnections('user-1');

      expect(result).toHaveLength(2);
      expect(result[0]!.unreadCount).toBe(3);
      expect(result[1]!.unreadCount).toBe(0);
    });

    it('returns empty array when no connections', async () => {
      mockContactRepo.findConnectionsForUser.mockResolvedValue([]);

      const result = await messageService.getConnections('user-1');
      expect(result).toHaveLength(0);
    });
  });

  describe('getUnreadCount', () => {
    it('returns unread count', async () => {
      mockMessageRepo.getUnreadCount.mockResolvedValue(5);

      const result = await messageService.getUnreadCount('user-1');
      expect(result).toEqual({ count: 5 });
    });
  });

  describe('getConnection', () => {
    it('returns connection for participant', async () => {
      mockContactRepo.findByIdWithParticipants.mockResolvedValue(mockConnection as any);

      const result = await messageService.getConnection('conn-1', 'trainee-user');
      expect(result).toEqual(mockConnection);
    });

    it('throws NOT_FOUND when connection missing', async () => {
      mockContactRepo.findByIdWithParticipants.mockResolvedValue(null);

      await expect(
        messageService.getConnection('conn-1', 'user-1')
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws FORBIDDEN for non-participant', async () => {
      mockContactRepo.findByIdWithParticipants.mockResolvedValue(mockConnection as any);

      await expect(
        messageService.getConnection('conn-1', 'random-user')
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });
  });
});
