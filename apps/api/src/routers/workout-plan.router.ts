import { router, trainerProcedure } from '../lib/trpc';
import { workoutPlanService } from '../services/workout-plan.service';
import {
  workoutPlanListSchema,
  getWorkoutPlanSchema,
  createWorkoutPlanSchema,
  updateWorkoutPlanSchema,
  deleteWorkoutPlanSchema,
  setWorkoutExercisesSchema,
} from '@fitnassist/schemas';

export const workoutPlanRouter = router({
  list: trainerProcedure
    .input(workoutPlanListSchema)
    .query(async ({ input, ctx }) => {
      return workoutPlanService.list(ctx.user.id, input);
    }),

  get: trainerProcedure
    .input(getWorkoutPlanSchema)
    .query(async ({ input, ctx }) => {
      return workoutPlanService.get(ctx.user.id, input.id);
    }),

  create: trainerProcedure
    .input(createWorkoutPlanSchema)
    .mutation(async ({ input, ctx }) => {
      return workoutPlanService.create(ctx.user.id, input);
    }),

  update: trainerProcedure
    .input(updateWorkoutPlanSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return workoutPlanService.update(ctx.user.id, id, data);
    }),

  delete: trainerProcedure
    .input(deleteWorkoutPlanSchema)
    .mutation(async ({ input, ctx }) => {
      return workoutPlanService.delete(ctx.user.id, input.id);
    }),

  setExercises: trainerProcedure
    .input(setWorkoutExercisesSchema)
    .mutation(async ({ input, ctx }) => {
      return workoutPlanService.setExercises(ctx.user.id, input.id, input.exercises);
    }),
});
