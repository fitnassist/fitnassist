import { trpc } from '@/lib/trpc';

export const useRecipe = (id: string) => {
  return trpc.recipe.get.useQuery({ id }, { enabled: !!id });
};
