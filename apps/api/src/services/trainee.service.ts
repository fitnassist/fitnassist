import { TRPCError } from '@trpc/server';
import { traineeRepository } from '../repositories/trainee.repository';
import { contactRepository } from '../repositories/contact.repository';
import { trainerRepository } from '../repositories/trainer.repository';
import type { CreateTraineeProfileInput, UpdateTraineeProfileInput } from '@fitnassist/schemas';

export const traineeService = {
  async hasProfile(userId: string): Promise<boolean> {
    const profile = await traineeRepository.findByUserId(userId);
    return !!profile;
  },

  async getByUserId(userId: string) {
    return traineeRepository.findByUserId(userId);
  },

  async create(userId: string, data: CreateTraineeProfileInput) {
    const existing = await traineeRepository.findByUserId(userId);
    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Trainee profile already exists',
      });
    }

    // Convert dateOfBirth string to Date if provided
    const { dateOfBirth, ...rest } = data;

    return traineeRepository.create(userId, {
      ...rest,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      // Clean empty strings to null
      avatarUrl: rest.avatarUrl || undefined,
      bio: rest.bio || undefined,
      fitnessGoalNotes: rest.fitnessGoalNotes || undefined,
      medicalNotes: rest.medicalNotes || undefined,
      location: rest.location || undefined,
      addressLine1: rest.addressLine1 || undefined,
      addressLine2: rest.addressLine2 || undefined,
      city: rest.city || undefined,
      county: rest.county || undefined,
      postcode: rest.postcode || undefined,
      country: rest.country || undefined,
      placeId: rest.placeId || undefined,
    });
  },

  async getProfileForTrainer(traineeUserId: string, trainerUserId: string) {
    // Check if the trainee has a profile
    const profile = await traineeRepository.findByUserId(traineeUserId);
    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainee profile not found',
      });
    }

    // If profile is public, any trainer can view it
    if (!profile.isPublic) {
      // Check if they have an accepted connection
      // We need to find the trainer profile to get the trainerId
      const trainerProfile = await trainerRepository.findByUserId(trainerUserId);
      if (!trainerProfile) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only connected trainers can view this profile',
        });
      }

      const connection = await contactRepository.findConnectionByTraineeAndTrainer(
        traineeUserId,
        trainerProfile.id,
      );

      if (!connection || connection.status !== 'ACCEPTED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only connected trainers can view this profile',
        });
      }
    }

    return profile;
  },

  async update(userId: string, data: UpdateTraineeProfileInput) {
    const profile = await traineeRepository.findByUserId(userId);
    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainee profile not found',
      });
    }

    // Convert dateOfBirth string to Date if provided
    const { dateOfBirth, ...rest } = data;

    return traineeRepository.update(profile.id, {
      ...rest,
      ...(dateOfBirth !== undefined && {
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      }),
    });
  },
};
