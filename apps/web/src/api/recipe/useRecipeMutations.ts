import { trpc } from '@/lib/trpc';

export const useCreateRecipe = () => {
  const utils = trpc.useUtils();
  return trpc.recipe.create.useMutation({
    onSuccess: () => {
      utils.recipe.list.invalidate();
    },
  });
};

export const useUpdateRecipe = () => {
  const utils = trpc.useUtils();
  return trpc.recipe.update.useMutation({
    onSuccess: (_data, variables) => {
      utils.recipe.list.invalidate();
      utils.recipe.get.invalidate({ id: variables.id });
    },
  });
};

export const useDeleteRecipe = () => {
  const utils = trpc.useUtils();
  return trpc.recipe.delete.useMutation({
    onSuccess: () => {
      utils.recipe.list.invalidate();
    },
  });
};
