export interface VideoInteraction {
  id: string;
  videoId: string;
  userId: string;
  type: 'like' | 'comment' | 'response' | 'rating';
  content?: string; // For comments and responses
  rating?: number; // 1-5 stars for content creator rating
  createdAt: string;
  updatedAt: string;
}

export interface VideoComment {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  likes: number;
  replies: VideoComment[];
  createdAt: string;
  updatedAt: string;
}

export interface VideoResponse {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  status: 'draft' | 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
  instructorId?: string;
  submittedAt?: string;
  gradedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoRating {
  id: string;
  videoId: string;
  raterId: string;
  raterName: string;
  raterAvatar?: string;
  contentCreatorId: string;
  contentCreatorName: string;
  rating: number; // 1-5 stars
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoStats {
  videoId: string;
  views: number;
  likes: number;
  comments: number;
  responses: number;
  averageRating: number;
  totalRatings: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentCreatorProfile {
  userId: string;
  userName: string;
  userAvatar?: string;
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  averageRating: number;
  totalRatings: number;
  followers: number;
  following: number;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  videoId: string;
  content: string;
}

export interface CreateResponseRequest {
  videoId: string;
  content: string;
}

export interface CreateRatingRequest {
  videoId: string;
  contentCreatorId: string;
  rating: number;
  comment?: string;
}

export interface LikeVideoRequest {
  videoId: string;
  action: 'like' | 'unlike';
}
