import { TRPCError } from '@trpc/server';
import { trainerRepository, type TrainerSearchParams } from '../repositories/trainer.repository';
import type { UpdateTrainerProfileInput, CreateTrainerProfileInput } from '@fitnassist/schemas';
import { geocodePostcode, formatUKPostcode } from '../lib/geocoding';

export const trainerService = {
  async getById(id: string) {
    const trainer = await trainerRepository.findById(id);
    if (!trainer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer not found',
      });
    }
    return trainer;
  },

  async getByHandle(handle: string, viewerId?: string) {
    const trainer = await trainerRepository.findByHandle(handle);

    if (!trainer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer not found',
      });
    }

    // Allow owner to view their own unpublished profile
    const isOwner = viewerId && trainer.userId === viewerId;

    if (!trainer.isPublished && !isOwner) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer not found',
      });
    }

    // Only record profile view if not the owner viewing their own profile
    if (!isOwner) {
      await trainerRepository.recordProfileView(trainer.id, viewerId);
    }

    return trainer;
  },

  async getByUserId(userId: string) {
    return trainerRepository.findByUserId(userId);
  },

  async search(params: TrainerSearchParams) {
    return trainerRepository.search(params);
  },

  async create(userId: string, data: CreateTrainerProfileInput) {
    // Check handle uniqueness
    const handleExists = await trainerRepository.handleExists(data.handle);
    if (handleExists) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'This handle is already taken',
      });
    }

    // Geocode postcode to get coordinates
    let latitude = data.latitude;
    let longitude = data.longitude;
    let postcode = data.postcode;

    if (postcode && (!latitude || !longitude)) {
      postcode = formatUKPostcode(postcode);
      const geoResult = await geocodePostcode(postcode);
      if (geoResult) {
        latitude = geoResult.latitude;
        longitude = geoResult.longitude;
      }
    }

    return trainerRepository.create(userId, {
      ...data,
      postcode,
      latitude,
      longitude,
    });
  },

  async hasProfile(userId: string): Promise<boolean> {
    const trainer = await trainerRepository.findByUserId(userId);
    return !!trainer;
  },

  async update(userId: string, data: UpdateTrainerProfileInput) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer profile not found',
      });
    }

    // Check handle uniqueness if changing
    if (data.handle && data.handle !== trainer.handle) {
      const handleExists = await trainerRepository.handleExists(data.handle, userId);
      if (handleExists) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This handle is already taken',
        });
      }
    }

    // Geocode postcode if changed and no coordinates provided
    let updateData = { ...data };
    if (data.postcode && data.postcode !== trainer.postcode) {
      const formattedPostcode = formatUKPostcode(data.postcode);
      updateData.postcode = formattedPostcode;

      if (!data.latitude || !data.longitude) {
        const geoResult = await geocodePostcode(formattedPostcode);
        if (geoResult) {
          updateData.latitude = geoResult.latitude;
          updateData.longitude = geoResult.longitude;
        }
      }
    }

    return trainerRepository.update(trainer.id, updateData);
  },

  async publish(userId: string) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer profile not found',
      });
    }

    return trainerRepository.update(trainer.id, { isPublished: true });
  },

  async unpublish(userId: string) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer profile not found',
      });
    }

    return trainerRepository.update(trainer.id, { isPublished: false });
  },

  async getStats(userId: string) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer profile not found',
      });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [viewsTotal, views30Days, views7Days] = await Promise.all([
      trainerRepository.getProfileViewCount(trainer.id),
      trainerRepository.getProfileViewCount(trainer.id, thirtyDaysAgo),
      trainerRepository.getProfileViewCount(trainer.id, sevenDaysAgo),
    ]);

    return {
      views: {
        total: viewsTotal,
        last30Days: views30Days,
        last7Days: views7Days,
      },
    };
  },
};
