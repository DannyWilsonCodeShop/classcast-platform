export interface SocialAnalytics {
  userId: string;
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  averageRating: number;
  totalRatings: number;
  followers: number;
  following: number;
  engagementRate: number;
  topPerformingVideo?: {
    id: string;
    title: string;
    views: number;
    likes: number;
    rating: number;
  };
  recentActivity: ActivityItem[];
  monthlyStats: MonthlyStats[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'video_created' | 'video_liked' | 'video_shared' | 'comment_received' | 'rating_received' | 'follower_gained';
  videoId?: string;
  videoTitle?: string;
  value: number;
  timestamp: string;
  description: string;
}

export interface MonthlyStats {
  month: string;
  year: number;
  videosCreated: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  averageRating: number;
  engagementRate: number;
}

export interface VideoAnalytics {
  videoId: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  rating: number;
  totalRatings: number;
  engagementRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsEvent {
  userId: string;
  videoId?: string;
  eventType: 'view' | 'like' | 'unlike' | 'comment' | 'share' | 'rate' | 'follow' | 'unfollow';
  value?: number;
  metadata?: Record<string, any>;
  timestamp: string;
}
