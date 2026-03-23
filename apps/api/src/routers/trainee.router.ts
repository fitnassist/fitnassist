import { z } from 'zod';
import { router, protectedProcedure, traineeProcedure, trainerProcedure } from '../lib/trpc';
import { traineeService } from '../services/trainee.service';
import { createTraineeProfileSchema, updateTraineeProfileSchema } from '@fitnassist/schemas';
import { calculateNutritionTargets } from '@fitnassist/utils';
import { diaryRepository } from '../repositories/diary.repository';

export const traineeRouter = router({
  hasProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const hasProfile = await traineeService.hasProfile(ctx.user.id);
      return { hasProfile };
    }),

  getMyProfile: traineeProcedure
    .query(async ({ ctx }) => {
      return traineeService.getByUserId(ctx.user.id);
    }),

  create: traineeProcedure
    .input(createTraineeProfileSchema)
    .mutation(async ({ input, ctx }) => {
      return traineeService.create(ctx.user.id, input);
    }),

  update: traineeProcedure
    .input(updateTraineeProfileSchema)
    .mutation(async ({ input, ctx }) => {
      return traineeService.update(ctx.user.id, input);
    }),

  getNutritionTargets: traineeProcedure
    .query(async ({ ctx }) => {
      const profile = await traineeService.getByUserId(ctx.user.id);
      if (!profile) return { calculated: null, manual: null, effective: null };

      // Current weight = latest diary weight entry, or start weight as fallback
      const latestWeight = await diaryRepository.getLatestWeight(ctx.user.id);
      const currentWeightKg = latestWeight ?? profile.startWeightKg;

      const calculated = calculateNutritionTargets({
        ...profile,
        currentWeightKg,
      });
      const manual = {
        calories: profile.dailyCalorieTarget,
        proteinG: profile.dailyProteinTargetG,
        carbsG: profile.dailyCarbsTargetG,
        fatG: profile.dailyFatTargetG,
      };

      // "effective" = manual override if set, else calculated
      const hasManualOverride = manual.calories != null;
      const effective = hasManualOverride
        ? {
            calories: manual.calories!,
            proteinG: manual.proteinG ?? calculated?.proteinG ?? 0,
            carbsG: manual.carbsG ?? calculated?.carbsG ?? 0,
            fatG: manual.fatG ?? calculated?.fatG ?? 0,
          }
        : calculated;

      return { calculated, manual, effective };
    }),

  getProfile: trainerProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      return traineeService.getProfileForTrainer(input.userId, ctx.user.id);
    }),
});
