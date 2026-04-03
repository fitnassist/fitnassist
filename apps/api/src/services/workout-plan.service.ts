import { TRPCError } from "@trpc/server";
import { workoutPlanRepository } from "../repositories/workout-plan.repository";
import { exerciseRepository } from "../repositories/exercise.repository";
import { trainerRepository } from "../repositories/trainer.repository";

export const workoutPlanService = {
  async list(
    userId: string,
    filters: {
      search?: string;
      page: number;
      limit: number;
    },
  ) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Trainer profile not found",
      });
    }

    return workoutPlanRepository.findByTrainerId({
      trainerId: trainer.id,
      ...filters,
    });
  },

  async get(userId: string, planId: string) {
    const plan = await workoutPlanRepository.findById(planId);
    if (!plan) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workout plan not found",
      });
    }

    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer || plan.trainerId !== trainer.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this workout plan",
      });
    }

    return plan;
  },

  async create(
    userId: string,
    data: {
      name: string;
      description?: string | null;
    },
  ) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Trainer profile not found",
      });
    }

    return workoutPlanRepository.create(trainer.id, data);
  },

  async update(
    userId: string,
    planId: string,
    data: {
      name?: string;
      description?: string | null;
    },
  ) {
    const plan = await workoutPlanRepository.findById(planId);
    if (!plan) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workout plan not found",
      });
    }

    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer || plan.trainerId !== trainer.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this workout plan",
      });
    }

    return workoutPlanRepository.update(planId, data);
  },

  async delete(userId: string, planId: string) {
    const plan = await workoutPlanRepository.findById(planId);
    if (!plan) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workout plan not found",
      });
    }

    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer || plan.trainerId !== trainer.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this workout plan",
      });
    }

    return workoutPlanRepository.delete(planId);
  },

  async setExercises(
    userId: string,
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
    const plan = await workoutPlanRepository.findById(planId);
    if (!plan) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workout plan not found",
      });
    }

    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer || plan.trainerId !== trainer.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this workout plan",
      });
    }

    // Verify all exercises belong to this trainer
    for (const ex of exercises) {
      const exercise = await exerciseRepository.findById(ex.exerciseId);
      if (!exercise || exercise.trainerId !== trainer.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Exercise ${ex.exerciseId} not found or does not belong to you`,
        });
      }
    }

    return workoutPlanRepository.setExercises(planId, exercises);
  },
};
