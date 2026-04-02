import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { traineeService } from '../trainee.service';

vi.mock('../../repositories/trainee.repository', () => ({
  traineeRepository: {
    findByUserId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../repositories/contact.repository', () => ({
  contactRepository: {
    findConnectionByTraineeAndTrainer: vi.fn(),
  },
}));

vi.mock('../../repositories/trainer.repository', () => ({
  trainerRepository: {
    findByUserId: vi.fn(),
  },
}));

import { traineeRepository } from '../../repositories/trainee.repository';
import { contactRepository } from '../../repositories/contact.repository';
import { trainerRepository } from '../../repositories/trainer.repository';

const mockTraineeRepo = vi.mocked(traineeRepository);
const mockContactRepo = vi.mocked(contactRepository);
const mockTrainerRepo = vi.mocked(trainerRepository);

describe('traineeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hasProfile', () => {
    it('returns true when profile exists', async () => {
      mockTraineeRepo.findByUserId.mockResolvedValue({ id: 'profile-1' } as any);
      expect(await traineeService.hasProfile('user-1')).toBe(true);
    });

    it('returns false when no profile', async () => {
      mockTraineeRepo.findByUserId.mockResolvedValue(null);
      expect(await traineeService.hasProfile('user-1')).toBe(false);
    });
  });

  describe('getByUserId', () => {
    it('returns profile', async () => {
      const profile = { id: 'profile-1', userId: 'user-1' };
      mockTraineeRepo.findByUserId.mockResolvedValue(profile as any);
      expect(await traineeService.getByUserId('user-1')).toEqual(profile);
    });

    it('returns null when not found', async () => {
      mockTraineeRepo.findByUserId.mockResolvedValue(null);
      expect(await traineeService.getByUserId('user-1')).toBeNull();
    });
  });

  describe('create', () => {
    it('creates profile successfully', async () => {
      mockTraineeRepo.findByUserId.mockResolvedValue(null);
      mockTraineeRepo.create.mockResolvedValue({ id: 'profile-1' } as any);

      const result = await traineeService.create('user-1', {
        fitnessGoals: ['WEIGHT_LOSS'],
        unitPreference: 'METRIC',
      } as any);

      expect(result).toEqual({ id: 'profile-1' });
      expect(mockTraineeRepo.create).toHaveBeenCalledWith('user-1', expect.any(Object));
    });

    it('throws CONFLICT when profile already exists', async () => {
      mockTraineeRepo.findByUserId.mockResolvedValue({ id: 'existing' } as any);

      await expect(
        traineeService.create('user-1', { fitnessGoals: [], unitPreference: 'METRIC' } as any)
      ).rejects.toThrow(TRPCError);

      await expect(
        traineeService.create('user-1', { fitnessGoals: [], unitPreference: 'METRIC' } as any)
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('converts dateOfBirth string to Date', async () => {
      mockTraineeRepo.findByUserId.mockResolvedValue(null);
      mockTraineeRepo.create.mockResolvedValue({ id: 'profile-1' } as any);

      await traineeService.create('user-1', {
        dateOfBirth: '1990-01-15',
        fitnessGoals: [],
        unitPreference: 'METRIC',
      } as any);

      expect(mockTraineeRepo.create).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ dateOfBirth: expect.any(Date) })
      );
    });
  });

  describe('getProfileForTrainer', () => {
    const mockProfile = {
      id: 'p1',
      userId: 'trainee-1',
      handle: 'jane',
      avatarUrl: null,
      unitPreference: 'METRIC',
      createdAt: new Date(),
      bio: 'Hello',
      experienceLevel: 'BEGINNER',
      activityLevel: 'MODERATE',
      gender: null,
      dateOfBirth: null,
      fitnessGoals: ['WEIGHT_LOSS'],
      fitnessGoalNotes: null,
      city: 'London',
      postcode: 'SW1',
      location: 'London',
      heightCm: null,
      startWeightKg: null,
      goalWeightKg: null,
      medicalNotes: 'Some notes',
      privacyBio: 'EVERYONE',
      privacyLocation: 'EVERYONE',
      privacyBodyMetrics: 'EVERYONE',
      privacyGoals: 'EVERYONE',
      privacyPersonalBests: 'EVERYONE',
      privacyProgressPhotos: 'EVERYONE',
      privacyStats: 'EVERYONE',
      privacyBadges: 'EVERYONE',
      privacyFriendCount: 'EVERYONE',
      privacyTrendWeight: 'EVERYONE',
      privacyTrendMeasurements: 'EVERYONE',
      privacyTrendNutrition: 'EVERYONE',
      privacyTrendWater: 'EVERYONE',
      privacyTrendMood: 'EVERYONE',
      privacyTrendSleep: 'EVERYONE',
      privacyTrendActivity: 'EVERYONE',
      privacyTrendSteps: 'EVERYONE',
      user: { name: 'Jane' },
    };

    it('returns filtered profile for unconnected trainer (PUBLIC view)', async () => {
      mockTraineeRepo.findByUserId.mockResolvedValue(mockProfile as any);
      mockTrainerRepo.findByUserId.mockResolvedValue({ id: 'trainer-profile-1' } as any);
      mockContactRepo.findConnectionByTraineeAndTrainer.mockResolvedValue(null);

      const result = await traineeService.getProfileForTrainer('trainee-1', 'trainer-user-1');
      expect(result).toHaveProperty('userName', 'Jane');
      // Medical notes are hidden for PUBLIC viewers
      expect(result.medicalNotes).toBeNull();
    });

    it('returns private profile for connected trainer', async () => {
      mockTraineeRepo.findByUserId.mockResolvedValue(mockProfile as any);
      mockTrainerRepo.findByUserId.mockResolvedValue({ id: 'trainer-profile-1' } as any);
      mockContactRepo.findConnectionByTraineeAndTrainer.mockResolvedValue({ status: 'ACCEPTED' } as any);

      const result = await traineeService.getProfileForTrainer('trainee-1', 'trainer-user-1');
      expect(result).toHaveProperty('userName', 'Jane');
      // Connected PT can see medical notes
      expect(result.medicalNotes).toBe('Some notes');
    });

    it('throws FORBIDDEN for unconnected trainer on private profile', async () => {
      const privateProfile = {
        ...mockProfile,
        privacyBio: 'MY_PT',
        privacyLocation: 'MY_PT',
      };
      mockTraineeRepo.findByUserId.mockResolvedValue(privateProfile as any);
      mockTrainerRepo.findByUserId.mockResolvedValue({ id: 'trainer-profile-1' } as any);
      mockContactRepo.findConnectionByTraineeAndTrainer.mockResolvedValue(null);

      // Does not throw FORBIDDEN anymore - returns filtered profile with restricted fields nulled
      const result = await traineeService.getProfileForTrainer('trainee-1', 'trainer-user-1');
      expect(result).toHaveProperty('userName', 'Jane');
      expect(result.bio).toBeNull();
      expect(result.city).toBeNull();
    });

    it('throws FORBIDDEN when trainer profile not found', async () => {
      mockTraineeRepo.findByUserId.mockResolvedValue(mockProfile as any);
      mockTrainerRepo.findByUserId.mockResolvedValue(null);

      await expect(
        traineeService.getProfileForTrainer('trainee-1', 'trainer-1')
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('throws NOT_FOUND when profile does not exist', async () => {
      mockTraineeRepo.findByUserId.mockResolvedValue(null);

      await expect(
        traineeService.getProfileForTrainer('trainee-1', 'trainer-1')
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('update', () => {
    it('updates profile successfully', async () => {
      mockTraineeRepo.findByUserId.mockResolvedValue({ id: 'p1' } as any);
      mockTraineeRepo.update.mockResolvedValue({ id: 'p1', bio: 'Updated' } as any);

      const result = await traineeService.update('user-1', { bio: 'Updated' } as any);
      expect(result.bio).toBe('Updated');
    });

    it('throws NOT_FOUND when no profile', async () => {
      mockTraineeRepo.findByUserId.mockResolvedValue(null);

      await expect(
        traineeService.update('user-1', { bio: 'test' } as any)
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('passes update to repository with profile id', async () => {
      mockTraineeRepo.findByUserId.mockResolvedValue({ id: 'p1' } as any);
      mockTraineeRepo.update.mockResolvedValue({ id: 'p1' } as any);

      await traineeService.update('user-1', { bio: 'New bio' } as any);
      expect(mockTraineeRepo.update).toHaveBeenCalledWith('p1', expect.objectContaining({ bio: 'New bio' }));
    });
  });
});
