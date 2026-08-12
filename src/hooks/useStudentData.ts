'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

export interface Assignment {
  assignmentId: string;
  title: string;
  courseName?: string;
  courseInitials?: string;
  dueDate: string;
  maxScore?: number;
  isSubmitted?: boolean;
  createdAt?: string;
}

export interface FeedItem {
  id: string;
  type?: string;
  title?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  author?: { name?: string; avatar?: string; id?: string };
  rating?: number;
  likes?: number;
  comments?: number;
  viewCount?: number;
  assignmentId?: string;
}

async function fetchAssignments(userId: string): Promise<Assignment[]> {
  const res = await fetch(`/api/student/assignments?userId=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch assignments');
  const data = await res.json();
  return data.assignments || [];
}

async function fetchFeed(userId: string): Promise<FeedItem[]> {
  const res = await fetch(`/api/student/feed?userId=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch feed');
  const data = await res.json();
  return (data.feed || []).filter((f: FeedItem) => f.type === 'video');
}

async function fetchCourses(userId: string) {
  const res = await fetch(`/api/student/courses?userId=${userId}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch courses');
  const data = await res.json();
  return data.courses || [];
}

/**
 * Cached hook for student assignments.
 * Uses react-query with 5-min staleTime (configured in QueryProvider).
 * Data persists across page navigations — no refetch on tab switches.
 */
export function useStudentAssignments() {
  const { user } = useAuth();

  return useQuery<Assignment[]>({
    queryKey: ['student-assignments', user?.id],
    queryFn: () => fetchAssignments(user!.id),
    enabled: !!user?.id,
    refetchOnMount: 'always', // Always refetch when component mounts (assignments are critical)
  });
}

/**
 * Cached hook for the student video feed.
 */
export function useStudentFeed() {
  const { user } = useAuth();

  return useQuery<FeedItem[]>({
    queryKey: ['student-feed', user?.id],
    queryFn: () => fetchFeed(user!.id),
    enabled: !!user?.id,
  });
}

/**
 * Cached hook for student courses.
 */
export function useStudentCourses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-courses', user?.id],
    queryFn: () => fetchCourses(user!.id),
    enabled: !!user?.id,
  });
}

/**
 * Prefetch student data on demand (e.g., on hover).
 * Useful for preloading data before navigation.
 */
export function usePrefetchStudentData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const prefetchAssignments = useCallback(() => {
    if (!user?.id) return;
    queryClient.prefetchQuery({
      queryKey: ['student-assignments', user.id],
      queryFn: () => fetchAssignments(user.id),
      staleTime: 5 * 60 * 1000,
    });
  }, [user?.id, queryClient]);

  const prefetchFeed = useCallback(() => {
    if (!user?.id) return;
    queryClient.prefetchQuery({
      queryKey: ['student-feed', user.id],
      queryFn: () => fetchFeed(user.id),
      staleTime: 5 * 60 * 1000,
    });
  }, [user?.id, queryClient]);

  const prefetchCourses = useCallback(() => {
    if (!user?.id) return;
    queryClient.prefetchQuery({
      queryKey: ['student-courses', user.id],
      queryFn: () => fetchCourses(user.id),
      staleTime: 5 * 60 * 1000,
    });
  }, [user?.id, queryClient]);

  return { prefetchAssignments, prefetchFeed, prefetchCourses };
}
