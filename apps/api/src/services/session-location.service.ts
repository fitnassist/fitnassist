import { TRPCError } from '@trpc/server';
import { sessionLocationRepository } from '../repositories/session-location.repository';

export const sessionLocationService = {
  getByTrainerId: (trainerId: string) => {
    return sessionLocationRepository.findByTrainerId(trainerId);
  },

  getActiveByTrainerId: (trainerId: string) => {
    return sessionLocationRepository.findActiveByTrainerId(trainerId);
  },

  create: async (trainerId: string, data: {
    name: string;
    addressLine1?: string;
    city?: string;
    postcode?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
    isDefault?: boolean;
  }) => {
    // If setting as default, clear other defaults first
    if (data.isDefault) {
      await sessionLocationRepository.clearDefault(trainerId);
    }

    return sessionLocationRepository.create({ ...data, trainerId });
  },

  update: async (trainerId: string, id: string, data: {
    name?: string;
    addressLine1?: string;
    city?: string;
    postcode?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
    isDefault?: boolean;
    isActive?: boolean;
    sortOrder?: number;
  }) => {
    const location = await sessionLocationRepository.findById(id);
    if (!location || location.trainerId !== trainerId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Location not found' });
    }

    if (data.isDefault) {
      await sessionLocationRepository.clearDefault(trainerId);
    }

    return sessionLocationRepository.update(id, data);
  },

  delete: async (trainerId: string, id: string) => {
    const location = await sessionLocationRepository.findById(id);
    if (!location || location.trainerId !== trainerId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Location not found' });
    }

    return sessionLocationRepository.delete(id);
  },
};
