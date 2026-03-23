import { TRPCError } from '@trpc/server';
import { recipeRepository } from '../repositories/recipe.repository';
import { trainerRepository } from '../repositories/trainer.repository';
import { cloudinaryService } from '../lib/cloudinary';
import type { Prisma } from '@fitnassist/database';

export const recipeService = {
  async list(userId: string, filters: {
    search?: string;
    tag?: string;
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

    return recipeRepository.findByTrainerId({
      trainerId: trainer.id,
      ...filters,
    });
  },

  async get(userId: string, recipeId: string) {
    const recipe = await recipeRepository.findById(recipeId);
    if (!recipe) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Recipe not found',
      });
    }

    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer || recipe.trainerId !== trainer.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this recipe',
      });
    }

    return recipe;
  },

  async create(userId: string, data: {
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    ingredients?: Prisma.InputJsonValue;
    instructions: string;
    calories?: number | null;
    proteinG?: number | null;
    carbsG?: number | null;
    fatG?: number | null;
    prepTimeMin?: number | null;
    cookTimeMin?: number | null;
    servings?: number | null;
    tags?: string[];
  }) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer profile not found',
      });
    }

    return recipeRepository.create(trainer.id, data);
  },

  async update(userId: string, recipeId: string, data: {
    name?: string;
    description?: string | null;
    imageUrl?: string | null;
    ingredients?: Prisma.InputJsonValue;
    instructions?: string;
    calories?: number | null;
    proteinG?: number | null;
    carbsG?: number | null;
    fatG?: number | null;
    prepTimeMin?: number | null;
    cookTimeMin?: number | null;
    servings?: number | null;
    tags?: string[];
  }) {
    const recipe = await recipeRepository.findById(recipeId);
    if (!recipe) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Recipe not found',
      });
    }

    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer || recipe.trainerId !== trainer.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this recipe',
      });
    }

    // Clean up old image from Cloudinary if being replaced
    if (data.imageUrl !== undefined && recipe.imageUrl && data.imageUrl !== recipe.imageUrl) {
      const publicId = cloudinaryService.getPublicIdFromUrl(recipe.imageUrl);
      if (publicId) cloudinaryService.deleteFile(publicId).catch(() => {});
    }

    return recipeRepository.update(recipeId, data);
  },

  async delete(userId: string, recipeId: string) {
    const recipe = await recipeRepository.findById(recipeId);
    if (!recipe) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Recipe not found',
      });
    }

    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer || recipe.trainerId !== trainer.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this recipe',
      });
    }

    // Clean up image from Cloudinary
    if (recipe.imageUrl) {
      const publicId = cloudinaryService.getPublicIdFromUrl(recipe.imageUrl);
      if (publicId) cloudinaryService.deleteFile(publicId).catch(() => {});
    }

    return recipeRepository.delete(recipeId);
  },
};
