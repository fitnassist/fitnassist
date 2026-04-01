import { trpc } from '@/lib/trpc';

export const useCreateMealPlan = () => {
  const utils = trpc.useUtils();
  return trpc.mealPlan.create.useMutation({
    onSuccess: () => {
      utils.mealPlan.list.invalidate();
    },
  });
};

export const useUpdateMealPlan = () => {
  const utils = trpc.useUtils();
  return trpc.mealPlan.update.useMutation({
    onSuccess: (_data, variables) => {
      utils.mealPlan.list.invalidate();
      utils.mealPlan.get.invalidate({ id: variables.id });
    },
  });
};

export const useDeleteMealPlan = () => {
  const utils = trpc.useUtils();
  return trpc.mealPlan.delete.useMutation({
    onSuccess: () => {
      utils.mealPlan.list.invalidate();
    },
  });
};

export const useSetMealPlanRecipes = () => {
  const utils = trpc.useUtils();
  return trpc.mealPlan.setRecipes.useMutation({
    onSuccess: (_data, variables) => {
      utils.mealPlan.get.invalidate({ id: variables.id });
      utils.mealPlan.list.invalidate();
    },
  });
};
