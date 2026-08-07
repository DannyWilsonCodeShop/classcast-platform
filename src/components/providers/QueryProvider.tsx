'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 5 minutes — prevents refetch on navigation
            staleTime: 5 * 60 * 1000,
            // Keep unused data in cache for 30 minutes (longer retention for back-navigation)
            gcTime: 30 * 60 * 1000,
            // Retry failed requests 2 times (reduced from 3 for faster failure)
            retry: 2,
            // Don't refetch on window focus (reduces unnecessary API calls)
            refetchOnWindowFocus: false,
            // Refetch on reconnect
            refetchOnReconnect: true,
            // Don't refetch on mount if data is still fresh
            refetchOnMount: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
