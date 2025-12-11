import { useQuery, useQueries } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface Course {
  courseId: string;
  name: string;
  initials: string;
  code: string;
  unreadCount: number;
}

interface FeedItem {
  id: string;
  type: 'assignment' | 'community_post' | 'video_submission';
  title: string;
  description?: string;
  courseId?: string;
  courseName?: string;
  courseCode?: string;
  assignmentId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  studentName?: string;
  studentId?: string;
  submittedAt?: string;
  dueDate?: string;
  createdAt: string;
  likes?: number;
  comments?: number;
  isLiked?: boolean;
  status?: string;
  points?: number;
  grade?: number;
  feedback?: string;
}

// Fetch user courses
export const useUserCourses = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['courses', user?.id],
    queryFn: async (): Promise<Course[]> => {
      if (!user?.id) return [];
      
      const response = await fetch(`/api/student/courses?userId=${user.id}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const data = await response.json();
      return data.courses || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch student feed
export const useStudentFeed = (includeAllPublicVideos = false) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['student-feed', user?.id, includeAllPublicVideos],
    queryFn: async (): Promise<FeedItem[]> => {
      if (!user?.id) return [];
      
      const response = await fetch(
        `/api/student/feed?userId=${user.id}&includeAllPublicVideos=${includeAllPublicVideos}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch feed');
      }
      
      const data = await response.json();
      return data.feed || [];
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes (feed changes more frequently)
  });
};

// Fetch user connections
export const useUserConnections = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['connections', user?.id],
    queryFn: async (): Promise<Set<string>> => {
      if (!user?.id) return new Set();
      
      const response = await fetch(`/api/student/connections?userId=${user.id}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        return new Set(); // Don't throw error for connections
      }
      
      const data = await response.json();
      return new Set(data.connections?.map((c: any) => c.connectedUserId) || []);
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes (connections don't change often)
  });
};

// Fetch notification count
export const useNotificationCount = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['notification-count', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;
      
      const response = await fetch(`/api/notifications/count?userId=${user.id}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        return 0; // Don't throw error for notifications
      }
      
      const data = await response.json();
      return data.count || 0;
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute (notifications are time-sensitive)
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
};

// Fetch class assignments for a specific course
export const useClassAssignments = (courseId: string | null) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['class-assignments', courseId, user?.id],
    queryFn: async (): Promise<FeedItem[]> => {
      if (!courseId || !user?.id) return [];
      
      const response = await fetch(
        `/api/student/assignments?courseId=${courseId}&userId=${user.id}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }
      
      const data = await response.json();
      return data.assignments || [];
    },
    enabled: !!courseId && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Combined hook for all dashboard data
export const useDashboardData = (includeAllPublicVideos = false) => {
  const coursesQuery = useUserCourses();
  const feedQuery = useStudentFeed(includeAllPublicVideos);
  const connectionsQuery = useUserConnections();
  const notificationCountQuery = useNotificationCount();
  
  return {
    courses: coursesQuery.data || [],
    feed: feedQuery.data || [],
    connections: connectionsQuery.data || new Set(),
    notificationCount: notificationCountQuery.data || 0,
    
    // Loading states
    isLoadingCourses: coursesQuery.isLoading,
    isLoadingFeed: feedQuery.isLoading,
    isLoadingConnections: connectionsQuery.isLoading,
    isLoadingNotifications: notificationCountQuery.isLoading,
    
    // Overall loading state
    isLoading: coursesQuery.isLoading || feedQuery.isLoading,
    
    // Error states
    coursesError: coursesQuery.error,
    feedError: feedQuery.error,
    connectionsError: connectionsQuery.error,
    notificationError: notificationCountQuery.error,
    
    // Refetch functions
    refetchCourses: coursesQuery.refetch,
    refetchFeed: feedQuery.refetch,
    refetchConnections: connectionsQuery.refetch,
    refetchNotifications: notificationCountQuery.refetch,
  };
};