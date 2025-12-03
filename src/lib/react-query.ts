import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Query keys for consistent caching
export const queryKeys = {
  user: (userId: string) => ['user', userId],
  courses: () => ['courses'],
  course: (courseId: string) => ['course', courseId],
  assignments: (courseId: string) => ['assignments', courseId],
  assignment: (assignmentId: string) => ['assignment', assignmentId],
  submissions: (assignmentId: string) => ['submissions', assignmentId],
  grades: (assignmentId: string) => ['grades', assignmentId],
};
