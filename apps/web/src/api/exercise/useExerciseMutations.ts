import { trpc } from '@/lib/trpc';

export const useCreateExercise = () => {
  const utils = trpc.useUtils();
  return trpc.exercise.create.useMutation({
    onSuccess: () => {
      utils.exercise.list.invalidate();
    },
  });
};

export const useUpdateExercise = () => {
  const utils = trpc.useUtils();
  return trpc.exercise.update.useMutation({
    onSuccess: (_data, variables) => {
      utils.exercise.list.invalidate();
      utils.exercise.get.invalidate({ id: variables.id });
    },
  });
};

export const useDeleteExercise = () => {
  const utils = trpc.useUtils();
  return trpc.exercise.delete.useMutation({
    onSuccess: () => {
      utils.exercise.list.invalidate();
    },
  });
};
