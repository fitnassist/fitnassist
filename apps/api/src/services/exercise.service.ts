import { TRPCError } from '@trpc/server';
import { exerciseRepository } from '../repositories/exercise.repository';
import { trainerRepository } from '../repositories/trainer.repository';
import { cloudinaryService } from '../lib/cloudinary';
import type { MuscleGroup, ExperienceLevel } from '@fitnassist/database';

export const exerciseService = {
  async list(userId: string, filters: {
    search?: string;
    muscleGroup?: MuscleGroup;
    difficulty?: ExperienceLevel;
    page: number;
    limit: number;
  }) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer profile not found',
      });
    }

    return exerciseRepository.findByTrainerId({
      trainerId: trainer.id,
      ...filters,
    });
  },

  async get(userId: string, exerciseId: string) {
    const exercise = await exerciseRepository.findById(exerciseId);
    if (!exercise) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Exercise not found',
      });
    }

    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer || exercise.trainerId !== trainer.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this exercise',
      });
    }

    return exercise;
  },

  async create(userId: string, data: {
    name: string;
    description?: string | null;
    instructions?: string | null;
    videoUrl?: string | null;
    videoUploadUrl?: string | null;
    thumbnailUrl?: string | null;
    muscleGroups?: MuscleGroup[];
    equipment?: string[];
    difficulty?: ExperienceLevel | null;
  }) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer profile not found',
      });
    }

    return exerciseRepository.create(trainer.id, data);
  },

  async update(userId: string, exerciseId: string, data: {
    name?: string;
    description?: string | null;
    instructions?: string | null;
    videoUrl?: string | null;
    videoUploadUrl?: string | null;
    thumbnailUrl?: string | null;
    muscleGroups?: MuscleGroup[];
    equipment?: string[];
    difficulty?: ExperienceLevel | null;
  }) {
    const exercise = await exerciseRepository.findById(exerciseId);
    if (!exercise) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Exercise not found',
      });
    }

    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer || exercise.trainerId !== trainer.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this exercise',
      });
    }

    // Clean up old media files from Cloudinary if they're being replaced
    if (data.videoUploadUrl !== undefined && exercise.videoUploadUrl && data.videoUploadUrl !== exercise.videoUploadUrl) {
      const publicId = cloudinaryService.getPublicIdFromUrl(exercise.videoUploadUrl);
      if (publicId) cloudinaryService.deleteFile(publicId, 'video').catch(() => {});
    }
    if (data.thumbnailUrl !== undefined && exercise.thumbnailUrl && data.thumbnailUrl !== exercise.thumbnailUrl) {
      const publicId = cloudinaryService.getPublicIdFromUrl(exercise.thumbnailUrl);
      if (publicId) cloudinaryService.deleteFile(publicId).catch(() => {});
    }

    return exerciseRepository.update(exerciseId, data);
  },

  async delete(userId: string, exerciseId: string) {
    const exercise = await exerciseRepository.findById(exerciseId);
    if (!exercise) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Exercise not found',
      });
    }

    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer || exercise.trainerId !== trainer.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this exercise',
      });
    }

    // Clean up media files from Cloudinary
    if (exercise.videoUploadUrl) {
      const publicId = cloudinaryService.getPublicIdFromUrl(exercise.videoUploadUrl);
      if (publicId) cloudinaryService.deleteFile(publicId, 'video').catch(() => {});
    }
    if (exercise.thumbnailUrl) {
      const publicId = cloudinaryService.getPublicIdFromUrl(exercise.thumbnailUrl);
      if (publicId) cloudinaryService.deleteFile(publicId).catch(() => {});
    }

    return exerciseRepository.delete(exerciseId);
  },
};
