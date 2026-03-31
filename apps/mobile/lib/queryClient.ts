import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,          // 30 s — data considered fresh for 30 s
      gcTime: 1000 * 60 * 5,      // keep cache 5 min
      refetchOnWindowFocus: true,  // refetch when app returns to foreground
      refetchOnMount: true,        // refetch when component mounts if stale
      refetchOnReconnect: true,
    },
  },
});
