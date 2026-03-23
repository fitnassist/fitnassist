import { router, trainerProcedure } from '../lib/trpc';
import { exerciseService } from '../services/exercise.service';
import {
  exerciseListSchema,
  getExerciseSchema,
  createExerciseSchema,
  updateExerciseSchema,
  deleteExerciseSchema,
} from '@fitnassist/schemas';

export const exerciseRouter = router({
  list: trainerProcedure
    .input(exerciseListSchema)
    .query(async ({ input, ctx }) => {
      return exerciseService.list(ctx.user.id, input);
    }),

  get: trainerProcedure
    .input(getExerciseSchema)
    .query(async ({ input, ctx }) => {
      return exerciseService.get(ctx.user.id, input.id);
    }),

  create: trainerProcedure
    .input(createExerciseSchema)
    .mutation(async ({ input, ctx }) => {
      return exerciseService.create(ctx.user.id, input);
    }),

  update: trainerProcedure
    .input(updateExerciseSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return exerciseService.update(ctx.user.id, id, data);
    }),

  delete: trainerProcedure
    .input(deleteExerciseSchema)
    .mutation(async ({ input, ctx }) => {
      return exerciseService.delete(ctx.user.id, input.id);
    }),
});
