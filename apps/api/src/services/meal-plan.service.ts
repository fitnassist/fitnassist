import { TRPCError } from '@trpc/server';
import { mealPlanRepository } from '../repositories/meal-plan.repository';
import { recipeRepository } from '../repositories/recipe.repository';
import { trainerRepository } from '../repositories/trainer.repository';
import type { MealType } from '@fitnassist/database';

export const mealPlanService = {
  async list(userId: string, filters: {
    search?: string;
    page: number;
    limit: number;
  }) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
    }
    return mealPlanRepository.findByTrainerId({ trainerId: trainer.id, ...filters });
  },

  async get(userId: string, planId: string) {
    const plan = await mealPlanRepository.findById(planId);
    if (!plan) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Meal plan not found' });
    }
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer || plan.trainerId !== trainer.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this meal plan' });
    }
    return plan;
  },

  async create(userId: string, data: { name: string; description?: string | null }) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
    }
    return mealPlanRepository.create(trainer.id, data);
  },

  async update(userId: string, planId: string, data: { name?: string; description?: string | null }) {
    const plan = await mealPlanRepository.findById(planId);
    if (!plan) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Meal plan not found' });
    }
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer || plan.trainerId !== trainer.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this meal plan' });
    }
    return mealPlanRepository.update(planId, data);
  },

  async delete(userId: string, planId: string) {
    const plan = await mealPlanRepository.findById(planId);
    if (!plan) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Meal plan not found' });
    }
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer || plan.trainerId !== trainer.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this meal plan' });
    }
    return mealPlanRepository.delete(planId);
  },

  async setRecipes(userId: string, planId: string, recipes: {
    recipeId: string;
    dayOfWeek?: number | null;
    mealType?: MealType | null;
    sortOrder: number;
  }[]) {
    const plan = await mealPlanRepository.findById(planId);
    if (!plan) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Meal plan not found' });
    }
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer || plan.trainerId !== trainer.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this meal plan' });
    }

    // Verify all recipes belong to this trainer
    for (const r of recipes) {
      const recipe = await recipeRepository.findById(r.recipeId);
      if (!recipe || recipe.trainerId !== trainer.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Recipe ${r.recipeId} not found or does not belong to you`,
        });
      }
    }

    return mealPlanRepository.setRecipes(planId, recipes);
  },
};
