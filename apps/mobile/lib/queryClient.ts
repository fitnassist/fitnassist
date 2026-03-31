import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes - reduces refetches on navigation
      gcTime: 1000 * 60 * 10, // 10 minutes - keeps cache longer
      refetchOnWindowFocus: false,
      refetchOnMount: false, // don't refetch if data is still fresh
    },
  },
});
