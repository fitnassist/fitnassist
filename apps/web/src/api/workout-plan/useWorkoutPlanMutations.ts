import { trpc } from '@/lib/trpc';

export const useCreateWorkoutPlan = () => {
  const utils = trpc.useUtils();
  return trpc.workoutPlan.create.useMutation({
    onSuccess: () => {
      utils.workoutPlan.list.invalidate();
    },
  });
};

export const useUpdateWorkoutPlan = () => {
  const utils = trpc.useUtils();
  return trpc.workoutPlan.update.useMutation({
    onSuccess: (_data, variables) => {
      utils.workoutPlan.list.invalidate();
      utils.workoutPlan.get.invalidate({ id: variables.id });
    },
  });
};

export const useDeleteWorkoutPlan = () => {
  const utils = trpc.useUtils();
  return trpc.workoutPlan.delete.useMutation({
    onSuccess: () => {
      utils.workoutPlan.list.invalidate();
    },
  });
};

export const useSetWorkoutExercises = () => {
  const utils = trpc.useUtils();
  return trpc.workoutPlan.setExercises.useMutation({
    onSuccess: (_data, variables) => {
      utils.workoutPlan.get.invalidate({ id: variables.id });
      utils.workoutPlan.list.invalidate();
    },
  });
};
