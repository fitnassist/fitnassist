import { prisma } from "../lib/prisma";
import type { Prisma } from "@fitnassist/database";

export interface WorkoutPlanListParams {
  trainerId: string;
  search?: string;
  page: number;
  limit: number;
}

export const workoutPlanRepository = {
  async create(
    trainerId: string,
    data: {
      name: string;
      description?: string | null;
    },
  ) {
    return prisma.workoutPlan.create({
      data: {
        trainerId,
        name: data.name,
        description: data.description,
      },
    });
  },

  async findById(id: string) {
    return prisma.workoutPlan.findUnique({
      where: { id },
      include: {
        exercises: {
          orderBy: { sortOrder: "asc" },
          include: {
            exercise: true,
          },
        },
      },
    });
  },

  async findByTrainerId(params: WorkoutPlanListParams) {
    const { trainerId, search, page, limit } = params;

    const where: Prisma.WorkoutPlanWhereInput = { trainerId };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [plans, total] = await Promise.all([
      prisma.workoutPlan.findMany({
        where,
        include: {
          _count: { select: { exercises: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.workoutPlan.count({ where }),
    ]);

    return {
      plans,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  },

  async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
    },
  ) {
    return prisma.workoutPlan.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.workoutPlan.delete({
      where: { id },
    });
  },

  async setExercises(
    planId: string,
    exercises: {
      exerciseId: string;
      sets?: number | null;
      reps?: string | null;
      restSeconds?: number | null;
      targetWeight?: number | null;
      weightUnit?: string | null;
      targetDuration?: string | null;
      notes?: string | null;
      sortOrder: number;
    }[],
  ) {
    // Delete all existing exercises and replace with new ones
    await prisma.$transaction([
      prisma.workoutExercise.deleteMany({ where: { workoutPlanId: planId } }),
      ...exercises.map((ex) =>
        prisma.workoutExercise.create({
          data: {
            workoutPlanId: planId,
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.restSeconds,
            targetWeight: ex.targetWeight,
            weightUnit: ex.weightUnit,
            targetDuration: ex.targetDuration,
            notes: ex.notes,
            sortOrder: ex.sortOrder,
          },
        }),
      ),
    ]);

    // Return the updated plan
    return prisma.workoutPlan.findUnique({
      where: { id: planId },
      include: {
        exercises: {
          orderBy: { sortOrder: "asc" },
          include: { exercise: true },
        },
      },
    });
  },
};
