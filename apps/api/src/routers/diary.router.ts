import { router, protectedProcedure } from "../lib/trpc";
import { diaryService } from "../services/diary.service";
import { foodRecognitionService } from "../services/food-recognition.service";
import { prisma } from "../lib/prisma";
import {
  logWeightSchema,
  logWaterSchema,
  logMeasurementsSchema,
  logMoodSchema,
  logSleepSchema,
  logFoodSchema,
  updateFoodEntrySchema,
  deleteFoodEntrySchema,
  searchFoodSchema,
  lookupBarcodeSchema,
  getDiaryEntriesSchema,
  getDiaryRangeSchema,
  getDailyNutritionSchema,
  deleteDiaryEntrySchema,
  logWorkoutSchema,
  logStepsSchema,
  logProgressPhotosSchema,
  getProgressPhotosSchema,
  addDiaryCommentSchema,
  getDiaryCommentsSchema,
  deleteDiaryCommentSchema,
  deleteProgressPhotoSchema,
  getRecentClientActivitySchema,
  logActivitySchema,
  getPersonalBestsSchema,
  recognizeFoodSchema,
} from "@fitnassist/schemas";

export const diaryRouter = router({
  logWeight: protectedProcedure
    .input(logWeightSchema)
    .mutation(async ({ input, ctx }) => {
      return diaryService.logWeight(ctx.user.id, input);
    }),

  logWater: protectedProcedure
    .input(logWaterSchema)
    .mutation(async ({ input, ctx }) => {
      return diaryService.logWater(ctx.user.id, input);
    }),

  logMeasurements: protectedProcedure
    .input(logMeasurementsSchema)
    .mutation(async ({ input, ctx }) => {
      return diaryService.logMeasurements(ctx.user.id, input);
    }),

  logMood: protectedProcedure
    .input(logMoodSchema)
    .mutation(async ({ input, ctx }) => {
      return diaryService.logMood(ctx.user.id, input);
    }),

  logSleep: protectedProcedure
    .input(logSleepSchema)
    .mutation(async ({ input, ctx }) => {
      return diaryService.logSleep(ctx.user.id, input);
    }),

  // ---- Food ----
  searchFood: protectedProcedure
    .input(searchFoodSchema)
    .query(async ({ input }) => {
      return diaryService.searchFood(input.query);
    }),

  getFoodNutrients: protectedProcedure
    .input(searchFoodSchema)
    .query(async ({ input }) => {
      return diaryService.getFoodNutrients(input.query);
    }),

  lookupBarcode: protectedProcedure
    .input(lookupBarcodeSchema)
    .query(async ({ input }) => {
      return diaryService.lookupBarcode(input.barcode);
    }),

  recognizeFood: protectedProcedure
    .input(recognizeFoodSchema)
    .mutation(async ({ input }) => {
      return foodRecognitionService.recognizeFromImage(input.imageBase64);
    }),

  logFood: protectedProcedure
    .input(logFoodSchema)
    .mutation(async ({ input, ctx }) => {
      return diaryService.logFood(ctx.user.id, input);
    }),

  updateFoodEntry: protectedProcedure
    .input(updateFoodEntrySchema)
    .mutation(async ({ input, ctx }) => {
      return diaryService.updateFoodEntry(ctx.user.id, input);
    }),

  deleteFoodEntry: protectedProcedure
    .input(deleteFoodEntrySchema)
    .mutation(async ({ input, ctx }) => {
      return diaryService.deleteFoodEntry(ctx.user.id, input.id);
    }),

  getDailyNutrition: protectedProcedure
    .input(getDailyNutritionSchema)
    .query(async ({ input, ctx }) => {
      return diaryService.getDailyNutrition(ctx.user.id, input);
    }),

  // ---- Workout Log ----
  logWorkout: protectedProcedure
    .input(logWorkoutSchema)
    .mutation(async ({ input, ctx }) => {
      return diaryService.logWorkout(ctx.user.id, input);
    }),

  // ---- Activity ----
  logActivity: protectedProcedure
    .input(logActivitySchema)
    .mutation(async ({ input, ctx }) => {
      return diaryService.logActivity(ctx.user.id, input);
    }),

  // ---- Personal Bests ----
  getPersonalBests: protectedProcedure
    .input(getPersonalBestsSchema)
    .query(async ({ input, ctx }) => {
      return diaryService.getPersonalBests(ctx.user.id, input.userId);
    }),

  // ---- Steps ----
  logSteps: protectedProcedure
    .input(logStepsSchema)
    .mutation(async ({ input, ctx }) => {
      return diaryService.logSteps(ctx.user.id, input);
    }),

  // ---- Progress Photos ----
  logProgressPhotos: protectedProcedure
    .input(logProgressPhotosSchema)
    .mutation(async ({ input, ctx }) => {
      return diaryService.logProgressPhotos(ctx.user.id, input);
    }),

  getProgressPhotos: protectedProcedure
    .input(getProgressPhotosSchema)
    .query(async ({ input, ctx }) => {
      return diaryService.getProgressPhotos(ctx.user.id, input);
    }),

  deleteProgressPhoto: protectedProcedure
    .input(deleteProgressPhotoSchema)
    .mutation(async ({ input, ctx }) => {
      return diaryService.deleteProgressPhoto(ctx.user.id, input.id);
    }),

  // ---- Comments ----
  addComment: protectedProcedure
    .input(addDiaryCommentSchema)
    .mutation(async ({ input, ctx }) => {
      return diaryService.addComment(
        ctx.user.id,
        input.diaryEntryId,
        input.content,
      );
    }),

  getComments: protectedProcedure
    .input(getDiaryCommentsSchema)
    .query(async ({ input, ctx }) => {
      return diaryService.getComments(ctx.user.id, input.diaryEntryId);
    }),

  deleteComment: protectedProcedure
    .input(deleteDiaryCommentSchema)
    .mutation(async ({ input, ctx }) => {
      return diaryService.deleteComment(ctx.user.id, input.id);
    }),

  /**
   * Get all workout plans assigned to the trainee
   */
  getMyWorkoutPlans: protectedProcedure.query(async ({ ctx }) => {
    const rosters = await prisma.clientRoster.findMany({
      where: {
        connection: {
          senderId: ctx.user.id,
          type: "CONNECTION_REQUEST",
          status: "ACCEPTED",
        },
      },
      include: {
        workoutPlanAssignments: {
          select: {
            workoutPlan: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    const seen = new Set<string>();
    const plans: Array<{
      id: string;
      name: string;
      description: string | null;
    }> = [];

    for (const roster of rosters) {
      for (const assignment of roster.workoutPlanAssignments) {
        if (!seen.has(assignment.workoutPlan.id)) {
          seen.add(assignment.workoutPlan.id);
          plans.push(assignment.workoutPlan);
        }
      }
    }

    return plans;
  }),

  /**
   * Get all recipes from the trainee's assigned meal plans
   */
  getMyRecipes: protectedProcedure.query(async ({ ctx }) => {
    const rosters = await prisma.clientRoster.findMany({
      where: {
        connection: {
          senderId: ctx.user.id,
          type: "CONNECTION_REQUEST",
          status: "ACCEPTED",
        },
      },
      include: {
        mealPlanAssignments: {
          select: {
            mealPlan: {
              select: {
                name: true,
                recipes: {
                  select: {
                    mealType: true,
                    recipe: {
                      select: {
                        id: true,
                        name: true,
                        calories: true,
                        proteinG: true,
                        carbsG: true,
                        fatG: true,
                        servings: true,
                        imageUrl: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Flatten and deduplicate recipes
    const seen = new Set<string>();
    const recipes: Array<{
      id: string;
      name: string;
      mealPlanName: string;
      mealType: string | null;
      calories: number | null;
      proteinG: number | null;
      carbsG: number | null;
      fatG: number | null;
      servings: number | null;
      imageUrl: string | null;
    }> = [];

    for (const roster of rosters) {
      for (const assignment of roster.mealPlanAssignments) {
        for (const mpr of assignment.mealPlan.recipes) {
          if (!seen.has(mpr.recipe.id)) {
            seen.add(mpr.recipe.id);
            recipes.push({
              ...mpr.recipe,
              mealPlanName: assignment.mealPlan.name,
              mealType: mpr.mealType,
            });
          }
        }
      }
    }

    return recipes;
  }),

  // ---- Activity Feed ----
  getRecentClientActivity: protectedProcedure
    .input(getRecentClientActivitySchema)
    .query(async ({ input, ctx }) => {
      return diaryService.getRecentClientActivity(ctx.user.id, input.limit);
    }),

  // ---- Queries ----
  getEntries: protectedProcedure
    .input(getDiaryEntriesSchema)
    .query(async ({ input, ctx }) => {
      return diaryService.getEntries(ctx.user.id, input);
    }),

  getRange: protectedProcedure
    .input(getDiaryRangeSchema)
    .query(async ({ input, ctx }) => {
      return diaryService.getRange(ctx.user.id, input);
    }),

  deleteEntry: protectedProcedure
    .input(deleteDiaryEntrySchema)
    .mutation(async ({ input, ctx }) => {
      return diaryService.deleteEntry(ctx.user.id, input.id);
    }),
});
