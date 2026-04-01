import { describe, it, expect } from 'vitest';
import { getInitials, getOtherPerson, getSenderAvatarUrl } from './messages.utils';
import type { ConnectionBase, Message } from './messages.types';

describe('getInitials', () => {
  it('returns two initials for two-word name', () => {
    expect(getInitials('Jane Doe')).toBe('JD');
  });

  it('returns one initial for single name', () => {
    expect(getInitials('Jane')).toBe('J');
  });
});

describe('getOtherPerson', () => {
  const mockConnection = {
    senderId: 'trainee-user-id',
    trainer: {
      displayName: 'Coach Mike',
      profileImageUrl: 'https://example.com/mike.jpg',
      handle: 'coach-mike',
    },
    sender: {
      id: 'trainee-user-id',
      name: 'Jane Doe',
      image: 'https://example.com/jane.jpg',
      traineeProfile: {
        avatarUrl: 'https://example.com/jane-avatar.jpg',
      },
    },
    name: 'Jane Doe',
  } as unknown as ConnectionBase;

  it('returns trainer info when user is the trainee (sender)', () => {
    const result = getOtherPerson(mockConnection, 'trainee-user-id');
    expect(result).toEqual({
      name: 'Coach Mike',
      image: 'https://example.com/mike.jpg',
      isTrainer: true,
      trainerHandle: 'coach-mike',
    });
  });

  it('returns trainee info when user is the trainer', () => {
    const result = getOtherPerson(mockConnection, 'trainer-user-id');
    expect(result).toEqual({
      name: 'Jane Doe',
      image: 'https://example.com/jane-avatar.jpg',
      isTrainer: false,
      userId: 'trainee-user-id',
    });
  });
});

describe('getSenderAvatarUrl', () => {
  it('returns trainer profile image', () => {
    const sender = {
      trainerProfile: { profileImageUrl: 'https://example.com/trainer.jpg' },
      traineeProfile: null,
      image: null,
    } as unknown as Message['sender'];
    expect(getSenderAvatarUrl(sender)).toBe('https://example.com/trainer.jpg');
  });

  it('returns trainee avatar url', () => {
    const sender = {
      trainerProfile: null,
      traineeProfile: { avatarUrl: 'https://example.com/trainee.jpg' },
      image: null,
    } as unknown as Message['sender'];
    expect(getSenderAvatarUrl(sender)).toBe('https://example.com/trainee.jpg');
  });

  it('falls back to user image', () => {
    const sender = {
      trainerProfile: null,
      traineeProfile: null,
      image: 'https://example.com/user.jpg',
    } as unknown as Message['sender'];
    expect(getSenderAvatarUrl(sender)).toBe('https://example.com/user.jpg');
  });

  it('returns null/undefined when no images', () => {
    const sender = {
      trainerProfile: null,
      traineeProfile: null,
      image: null,
    } as unknown as Message['sender'];
    expect(getSenderAvatarUrl(sender)).toBeNull();
  });
});
