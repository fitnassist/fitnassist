import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, traineeProcedure, trainerProcedure } from '../lib/trpc';
import { traineeService } from '../services/trainee.service';
import {
  createTraineeProfileSchema,
  updateTraineeProfileSchema,
  updatePrivacySettingsSchema,
  setHandleSchema,
  checkHandleSchema,
} from '@fitnassist/schemas';
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

  // Trainer viewing a trainee's profile (privacy-filtered)
  getProfile: trainerProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      return traineeService.getProfileForTrainer(input.userId, ctx.user.id);
    }),

  // Public profile by handle or userId (privacy-filtered based on viewer relationship)
  getByHandle: publicProcedure
    .input(z.object({ handle: z.string() }))
    .query(async ({ input, ctx }) => {
      return traineeService.getByHandle(input.handle, ctx.user?.id);
    }),

  // Handle management
  setHandle: traineeProcedure
    .input(setHandleSchema)
    .mutation(async ({ input, ctx }) => {
      return traineeService.setHandle(ctx.user.id, input.handle);
    }),

  checkHandleAvailability: publicProcedure
    .input(checkHandleSchema)
    .query(async ({ input, ctx }) => {
      return traineeService.checkHandleAvailability(input.handle, ctx.user?.id);
    }),

  // Public profile data (goals, PBs, activity, photos, weight, stats)
  getPublicProfileData: publicProcedure
    .input(z.object({ handle: z.string() }))
    .query(async ({ input, ctx }) => {
      return traineeService.getPublicProfileData(input.handle, ctx.user?.id);
    }),

  // Privacy settings
  getPrivacySettings: traineeProcedure
    .query(async ({ ctx }) => {
      return traineeService.getPrivacySettings(ctx.user.id);
    }),

  updatePrivacySettings: traineeProcedure
    .input(updatePrivacySettingsSchema)
    .mutation(async ({ input, ctx }) => {
      return traineeService.updatePrivacySettings(ctx.user.id, input);
    }),
});
