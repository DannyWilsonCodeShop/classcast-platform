import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Don't refetch on window focus (annoying for users)
      refetchOnWindowFocus: false,
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on reconnect unless data is stale
      refetchOnReconnect: 'always',
    },
  },
});