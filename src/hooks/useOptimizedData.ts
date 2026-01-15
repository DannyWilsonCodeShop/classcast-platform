import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiUrl, getEnvironmentApiUrl } from '@/lib/apiConfig';

// Query keys for consistent caching
export const queryKeys = {
  user: (userId: string) => ['user', userId] as const,
  currentUser: () => ['currentUser'] as const,
  courses: () => ['courses'] as const,
  course: (courseId: string) => ['course', courseId] as const,
  courseStudents: (courseId: string) => ['courseStudents', courseId] as const,
  assignments: (courseId: string) => ['assignments', courseId] as const,
  assignment: (assignmentId: string) => ['assignment', assignmentId] as const,
  submissions: (assignmentId: string) => ['submissions', assignmentId] as const,
  submission: (submissionId: string) => ['submission', submissionId] as const,
  grades: (assignmentId: string) => ['grades', assignmentId] as const,
  peerReviews: () => ['peerReviews'] as const,
  notifications: () => ['notifications'] as const,
};

// Hook for fetching user data with caching
export function useUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: async () => {
      const response = await fetch(getEnvironmentApiUrl(`users/${userId}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    enabled: !!userId,
  });
}

// Hook for fetching courses with caching
export function useCourses() {
  return useQuery({
    queryKey: queryKeys.courses(),
    queryFn: async () => {
      const response = await fetch(getEnvironmentApiUrl('courses'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    },
  });
}

// Hook for fetching a single course
export function useCourse(courseId: string) {
  return useQuery({
    queryKey: queryKeys.course(courseId),
    queryFn: async () => {
      const response = await fetch(getEnvironmentApiUrl(`courses/${courseId}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch course');
      return response.json();
    },
    enabled: !!courseId,
  });
}

// Hook for fetching assignments
export function useAssignments(courseId: string) {
  return useQuery({
    queryKey: queryKeys.assignments(courseId),
    queryFn: async () => {
      const response = await fetch(getEnvironmentApiUrl(`courses/${courseId}/assignments`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch assignments');
      return response.json();
    },
    enabled: !!courseId,
  });
}

// Hook for fetching a single assignment
export function useAssignment(assignmentId: string) {
  return useQuery({
    queryKey: queryKeys.assignment(assignmentId),
    queryFn: async () => {
      const response = await fetch(getApiUrl(`assignments/${assignmentId}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch assignment');
      return response.json();
    },
    enabled: !!assignmentId,
  });
}

// Hook for fetching submissions
export function useSubmissions(assignmentId: string) {
  return useQuery({
    queryKey: queryKeys.submissions(assignmentId),
    queryFn: async () => {
      const response = await fetch(getEnvironmentApiUrl(`instructor/video-submissions?assignmentId=${assignmentId}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch submissions');
      return response.json();
    },
    enabled: !!assignmentId,
  });
}

// Hook for mutations with automatic cache invalidation
export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(getEnvironmentApiUrl('assignments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create assignment');
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate assignments list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments(variables.courseId) });
    },
  });
}

// Hook for updating data with optimistic updates
export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, data }: { assignmentId: string; data: any }) => {
      const response = await fetch(getApiUrl(`assignments/${assignmentId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update assignment');
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update the cache immediately
      queryClient.setQueryData(queryKeys.assignment(variables.assignmentId), data);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments(data.courseId) });
    },
  });
}

// Prefetch data for better UX
export function usePrefetchCourse(courseId: string) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.course(courseId),
      queryFn: async () => {
        const response = await fetch(getEnvironmentApiUrl(`courses/${courseId}`), {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch course');
        return response.json();
      },
    });
  };
}
