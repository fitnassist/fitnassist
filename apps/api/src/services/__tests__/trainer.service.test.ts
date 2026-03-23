import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trainerService } from '../trainer.service';

vi.mock('../../repositories/trainer.repository', () => ({
  trainerRepository: {
    findById: vi.fn(),
    findByHandle: vi.fn(),
    findByUserId: vi.fn(),
    handleExists: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    recordProfileView: vi.fn(),
    search: vi.fn(),
    getProfileViewCount: vi.fn(),
  },
}));

vi.mock('../../lib/geocoding', () => ({
  geocodePostcode: vi.fn(),
  formatUKPostcode: vi.fn((p: string) => p.toUpperCase().replace(/\s+/g, ' ')),
}));

import { trainerRepository } from '../../repositories/trainer.repository';
import { geocodePostcode } from '../../lib/geocoding';

const mockTrainerRepo = vi.mocked(trainerRepository);
const mockGeocode = vi.mocked(geocodePostcode);

describe('trainerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getByHandle', () => {
    it('returns published trainer and records view', async () => {
      const trainer = { id: 't1', handle: 'coach', isPublished: true, userId: 'u1' };
      mockTrainerRepo.findByHandle.mockResolvedValue(trainer as any);

      const result = await trainerService.getByHandle('coach');

      expect(result).toEqual(trainer);
      expect(mockTrainerRepo.recordProfileView).toHaveBeenCalledWith('t1', undefined);
    });

    it('throws NOT_FOUND for missing trainer', async () => {
      mockTrainerRepo.findByHandle.mockResolvedValue(null);

      await expect(
        trainerService.getByHandle('nobody')
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws NOT_FOUND for unpublished profile when viewer is not owner', async () => {
      mockTrainerRepo.findByHandle.mockResolvedValue({
        id: 't1',
        isPublished: false,
        userId: 'owner',
      } as any);

      await expect(
        trainerService.getByHandle('coach', 'other-user')
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('allows owner to view unpublished profile without recording view', async () => {
      const trainer = { id: 't1', isPublished: false, userId: 'owner' };
      mockTrainerRepo.findByHandle.mockResolvedValue(trainer as any);

      const result = await trainerService.getByHandle('coach', 'owner');

      expect(result).toEqual(trainer);
      expect(mockTrainerRepo.recordProfileView).not.toHaveBeenCalled();
    });

    it('records view with viewerId for non-owner', async () => {
      const trainer = { id: 't1', handle: 'coach', isPublished: true, userId: 'owner' };
      mockTrainerRepo.findByHandle.mockResolvedValue(trainer as any);

      await trainerService.getByHandle('coach', 'viewer-1');

      expect(mockTrainerRepo.recordProfileView).toHaveBeenCalledWith('t1', 'viewer-1');
    });
  });

  describe('getById', () => {
    it('returns trainer by id', async () => {
      const trainer = { id: 't1', displayName: 'Coach' };
      mockTrainerRepo.findById.mockResolvedValue(trainer as any);

      const result = await trainerService.getById('t1');
      expect(result).toEqual(trainer);
    });

    it('throws NOT_FOUND when trainer missing', async () => {
      mockTrainerRepo.findById.mockResolvedValue(null);

      await expect(
        trainerService.getById('missing')
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('create', () => {
    it('creates trainer with geocoded postcode', async () => {
      mockTrainerRepo.handleExists.mockResolvedValue(false);
      mockGeocode.mockResolvedValue({ latitude: 51.5, longitude: -0.1 });
      mockTrainerRepo.create.mockResolvedValue({ id: 't1' } as any);

      const result = await trainerService.create('user-1', {
        handle: 'coach',
        displayName: 'Coach Mike',
        postcode: 'sw1a 1aa',
      } as any);

      expect(result).toEqual({ id: 't1' });
      expect(mockTrainerRepo.create).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ latitude: 51.5, longitude: -0.1 })
      );
    });

    it('throws CONFLICT when handle taken', async () => {
      mockTrainerRepo.handleExists.mockResolvedValue(true);

      await expect(
        trainerService.create('user-1', { handle: 'taken', displayName: 'Test' } as any)
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('creates trainer without geocoding when coordinates provided', async () => {
      mockTrainerRepo.handleExists.mockResolvedValue(false);
      mockTrainerRepo.create.mockResolvedValue({ id: 't1' } as any);

      await trainerService.create('user-1', {
        handle: 'coach',
        displayName: 'Coach',
        postcode: 'SW1A 1AA',
        latitude: 51.5,
        longitude: -0.1,
      } as any);

      expect(mockGeocode).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates trainer successfully', async () => {
      mockTrainerRepo.findByUserId.mockResolvedValue({
        id: 't1',
        handle: 'coach',
        postcode: 'SW1A 1AA',
      } as any);
      mockTrainerRepo.update.mockResolvedValue({ id: 't1', displayName: 'Updated' } as any);

      const result = await trainerService.update('user-1', { displayName: 'Updated' } as any);
      expect(result.displayName).toBe('Updated');
    });

    it('throws NOT_FOUND when no profile', async () => {
      mockTrainerRepo.findByUserId.mockResolvedValue(null);

      await expect(
        trainerService.update('user-1', { displayName: 'Test' } as any)
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws CONFLICT when changing to taken handle', async () => {
      mockTrainerRepo.findByUserId.mockResolvedValue({ id: 't1', handle: 'old-handle' } as any);
      mockTrainerRepo.handleExists.mockResolvedValue(true);

      await expect(
        trainerService.update('user-1', { handle: 'taken-handle' } as any)
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('allows keeping same handle without conflict check', async () => {
      mockTrainerRepo.findByUserId.mockResolvedValue({ id: 't1', handle: 'coach' } as any);
      mockTrainerRepo.update.mockResolvedValue({ id: 't1', handle: 'coach' } as any);

      await trainerService.update('user-1', { handle: 'coach' } as any);

      expect(mockTrainerRepo.handleExists).not.toHaveBeenCalled();
    });

    it('geocodes new postcode on update', async () => {
      mockTrainerRepo.findByUserId.mockResolvedValue({
        id: 't1',
        handle: 'coach',
        postcode: 'SW1A 1AA',
      } as any);
      mockGeocode.mockResolvedValue({ latitude: 52.0, longitude: -1.0 });
      mockTrainerRepo.update.mockResolvedValue({ id: 't1' } as any);

      await trainerService.update('user-1', { postcode: 'EC1A 1BB' } as any);

      expect(mockGeocode).toHaveBeenCalled();
      expect(mockTrainerRepo.update).toHaveBeenCalledWith(
        't1',
        expect.objectContaining({ latitude: 52.0, longitude: -1.0 })
      );
    });
  });

  describe('hasProfile', () => {
    it('returns true when profile exists', async () => {
      mockTrainerRepo.findByUserId.mockResolvedValue({ id: 't1' } as any);
      expect(await trainerService.hasProfile('user-1')).toBe(true);
    });

    it('returns false when no profile', async () => {
      mockTrainerRepo.findByUserId.mockResolvedValue(null);
      expect(await trainerService.hasProfile('user-1')).toBe(false);
    });
  });

  describe('publish', () => {
    it('publishes trainer profile', async () => {
      mockTrainerRepo.findByUserId.mockResolvedValue({ id: 't1' } as any);
      mockTrainerRepo.update.mockResolvedValue({ id: 't1', isPublished: true } as any);

      const result = await trainerService.publish('user-1');
      expect(mockTrainerRepo.update).toHaveBeenCalledWith('t1', { isPublished: true });
      expect(result.isPublished).toBe(true);
    });

    it('throws NOT_FOUND when no profile', async () => {
      mockTrainerRepo.findByUserId.mockResolvedValue(null);

      await expect(
        trainerService.publish('user-1')
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('unpublish', () => {
    it('unpublishes trainer profile', async () => {
      mockTrainerRepo.findByUserId.mockResolvedValue({ id: 't1' } as any);
      mockTrainerRepo.update.mockResolvedValue({ id: 't1', isPublished: false } as any);

      const result = await trainerService.unpublish('user-1');
      expect(mockTrainerRepo.update).toHaveBeenCalledWith('t1', { isPublished: false });
      expect(result.isPublished).toBe(false);
    });

    it('throws NOT_FOUND when no profile', async () => {
      mockTrainerRepo.findByUserId.mockResolvedValue(null);

      await expect(
        trainerService.unpublish('user-1')
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
