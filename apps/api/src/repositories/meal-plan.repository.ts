import { prisma } from '../lib/prisma';
import type { MealType, Prisma } from '@fitnassist/database';

export interface MealPlanListParams {
  trainerId: string;
  search?: string;
  page: number;
  limit: number;
}

export const mealPlanRepository = {
  async create(trainerId: string, data: {
    name: string;
    description?: string | null;
  }) {
    return prisma.mealPlan.create({
      data: {
        trainerId,
        name: data.name,
        description: data.description,
      },
    });
  },

  async findById(id: string) {
    return prisma.mealPlan.findUnique({
      where: { id },
      include: {
        recipes: {
          orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }, { sortOrder: 'asc' }],
          include: {
            recipe: true,
          },
        },
      },
    });
  },

  async findByTrainerId(params: MealPlanListParams) {
    const { trainerId, search, page, limit } = params;

    const where: Prisma.MealPlanWhereInput = { trainerId };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [plans, total] = await Promise.all([
      prisma.mealPlan.findMany({
        where,
        include: {
          _count: { select: { recipes: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.mealPlan.count({ where }),
    ]);

    return {
      plans,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  },

  async update(id: string, data: {
    name?: string;
    description?: string | null;
  }) {
    return prisma.mealPlan.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.mealPlan.delete({
      where: { id },
    });
  },

  async setRecipes(planId: string, recipes: {
    recipeId: string;
    dayOfWeek?: number | null;
    mealType?: MealType | null;
    sortOrder: number;
  }[]) {
    await prisma.$transaction([
      prisma.mealPlanRecipe.deleteMany({ where: { mealPlanId: planId } }),
      ...recipes.map(r =>
        prisma.mealPlanRecipe.create({
          data: {
            mealPlanId: planId,
            recipeId: r.recipeId,
            dayOfWeek: r.dayOfWeek,
            mealType: r.mealType,
            sortOrder: r.sortOrder,
          },
        })
      ),
    ]);

    return prisma.mealPlan.findUnique({
      where: { id: planId },
      include: {
        recipes: {
          orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }, { sortOrder: 'asc' }],
          include: { recipe: true },
        },
      },
    });
  },
};
