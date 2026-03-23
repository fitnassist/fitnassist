import { trpc } from '@/lib/trpc';

export const useRecipes = (filters: {
  search?: string;
  tag?: string;
  page?: number;
  limit?: number;
}) => {
  return trpc.recipe.list.useQuery({
    search: filters.search || undefined,
    tag: filters.tag || undefined,
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
  });
};
