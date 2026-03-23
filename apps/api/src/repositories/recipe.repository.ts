import { prisma } from '../lib/prisma';
import type { Prisma } from '@fitnassist/database';

export interface RecipeListParams {
  trainerId: string;
  search?: string;
  tag?: string;
  page: number;
  limit: number;
}

export const recipeRepository = {
  async create(trainerId: string, data: {
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
    return prisma.recipe.create({
      data: {
        trainerId,
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        ingredients: data.ingredients ?? [],
        instructions: data.instructions,
        calories: data.calories,
        proteinG: data.proteinG,
        carbsG: data.carbsG,
        fatG: data.fatG,
        prepTimeMin: data.prepTimeMin,
        cookTimeMin: data.cookTimeMin,
        servings: data.servings,
        tags: data.tags ?? [],
      },
    });
  },

  async findById(id: string) {
    return prisma.recipe.findUnique({
      where: { id },
    });
  },

  async findByTrainerId(params: RecipeListParams) {
    const { trainerId, search, tag, page, limit } = params;

    const where: Prisma.RecipeWhereInput = { trainerId };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (tag) {
      where.tags = { has: tag };
    }

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.recipe.count({ where }),
    ]);

    return {
      recipes,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  },

  async update(id: string, data: {
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
    return prisma.recipe.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.recipe.delete({
      where: { id },
    });
  },

  async count(trainerId: string) {
    return prisma.recipe.count({
      where: { trainerId },
    });
  },
};
