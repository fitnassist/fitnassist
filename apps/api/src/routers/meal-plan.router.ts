import { router, trainerProcedure, requireTier } from '../lib/trpc';
import { mealPlanService } from '../services/meal-plan.service';
import {
  mealPlanListSchema,
  getMealPlanSchema,
  createMealPlanSchema,
  updateMealPlanSchema,
  deleteMealPlanSchema,
  setMealPlanRecipesSchema,
} from '@fitnassist/schemas';

export const mealPlanRouter = router({
  list: trainerProcedure
    .input(mealPlanListSchema)
    .query(async ({ input, ctx }) => {
      return mealPlanService.list(ctx.user.id, input);
    }),

  get: trainerProcedure
    .input(getMealPlanSchema)
    .query(async ({ input, ctx }) => {
      return mealPlanService.get(ctx.user.id, input.id);
    }),

  create: trainerProcedure
    .use(requireTier('PRO'))
    .input(createMealPlanSchema)
    .mutation(async ({ input, ctx }) => {
      return mealPlanService.create(ctx.user.id, input);
    }),

  update: trainerProcedure
    .use(requireTier('PRO'))
    .input(updateMealPlanSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return mealPlanService.update(ctx.user.id, id, data);
    }),

  delete: trainerProcedure
    .use(requireTier('PRO'))
    .input(deleteMealPlanSchema)
    .mutation(async ({ input, ctx }) => {
      return mealPlanService.delete(ctx.user.id, input.id);
    }),

  setRecipes: trainerProcedure
    .use(requireTier('PRO'))
    .input(setMealPlanRecipesSchema)
    .mutation(async ({ input, ctx }) => {
      return mealPlanService.setRecipes(ctx.user.id, input.id, input.recipes);
    }),
});
