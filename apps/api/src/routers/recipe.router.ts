import { router, trainerProcedure, requireTier } from '../lib/trpc';
import { recipeService } from '../services/recipe.service';
import {
  recipeListSchema,
  getRecipeSchema,
  createRecipeSchema,
  updateRecipeSchema,
  deleteRecipeSchema,
} from '@fitnassist/schemas';

export const recipeRouter = router({
  list: trainerProcedure
    .input(recipeListSchema)
    .query(async ({ input, ctx }) => {
      return recipeService.list(ctx.user.id, input);
    }),

  get: trainerProcedure
    .input(getRecipeSchema)
    .query(async ({ input, ctx }) => {
      return recipeService.get(ctx.user.id, input.id);
    }),

  create: trainerProcedure
    .use(requireTier('PRO'))
    .input(createRecipeSchema)
    .mutation(async ({ input, ctx }) => {
      return recipeService.create(ctx.user.id, input);
    }),

  update: trainerProcedure
    .use(requireTier('PRO'))
    .input(updateRecipeSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return recipeService.update(ctx.user.id, id, data);
    }),

  delete: trainerProcedure
    .use(requireTier('PRO'))
    .input(deleteRecipeSchema)
    .mutation(async ({ input, ctx }) => {
      return recipeService.delete(ctx.user.id, input.id);
    }),
});
