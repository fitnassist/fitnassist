import { prisma } from '../lib/prisma';
import type { MuscleGroup, ExperienceLevel, Prisma } from '@fitnassist/database';

export interface ExerciseListParams {
  trainerId: string;
  search?: string;
  muscleGroup?: MuscleGroup;
  difficulty?: ExperienceLevel;
  page: number;
  limit: number;
}

export const exerciseRepository = {
  async create(trainerId: string, data: {
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
    return prisma.exercise.create({
      data: {
        trainerId,
        name: data.name,
        description: data.description,
        instructions: data.instructions,
        videoUrl: data.videoUrl,
        videoUploadUrl: data.videoUploadUrl,
        thumbnailUrl: data.thumbnailUrl,
        muscleGroups: data.muscleGroups ?? [],
        equipment: data.equipment ?? [],
        difficulty: data.difficulty,
      },
    });
  },

  async findById(id: string) {
    return prisma.exercise.findUnique({
      where: { id },
    });
  },

  async findByTrainerId(params: ExerciseListParams) {
    const { trainerId, search, muscleGroup, difficulty, page, limit } = params;

    const where: Prisma.ExerciseWhereInput = {
      trainerId,
      ...(difficulty && { difficulty }),
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (muscleGroup) {
      where.muscleGroups = { has: muscleGroup };
    }

    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.exercise.count({ where }),
    ]);

    return {
      exercises,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  },

  async update(id: string, data: {
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
    return prisma.exercise.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.exercise.delete({
      where: { id },
    });
  },

  async count(trainerId: string) {
    return prisma.exercise.count({
      where: { trainerId },
    });
  },
};
