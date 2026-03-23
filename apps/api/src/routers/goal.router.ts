import { router, protectedProcedure } from '../lib/trpc';
import { goalService } from '../services/goal.service';
import {
  createGoalSchema,
  updateGoalSchema,
  listGoalsSchema,
  goalIdSchema,
  getRecentClientGoalUpdatesSchema,
} from '@fitnassist/schemas';

export const goalRouter = router({
  create: protectedProcedure
    .input(createGoalSchema)
    .mutation(async ({ input, ctx }) => {
      return goalService.createGoal(ctx.user.id, input);
    }),

  list: protectedProcedure
    .input(listGoalsSchema)
    .query(async ({ input, ctx }) => {
      return goalService.listGoals(ctx.user.id, input);
    }),

  update: protectedProcedure
    .input(updateGoalSchema)
    .mutation(async ({ input, ctx }) => {
      return goalService.updateGoal(ctx.user.id, input);
    }),

  complete: protectedProcedure
    .input(goalIdSchema)
    .mutation(async ({ input, ctx }) => {
      return goalService.completeGoal(ctx.user.id, input.id);
    }),

  abandon: protectedProcedure
    .input(goalIdSchema)
    .mutation(async ({ input, ctx }) => {
      return goalService.abandonGoal(ctx.user.id, input.id);
    }),

  getRecentClientGoalUpdates: protectedProcedure
    .input(getRecentClientGoalUpdatesSchema)
    .query(async ({ input, ctx }) => {
      return goalService.getRecentClientGoalUpdates(ctx.user.id, input.limit);
    }),
});
