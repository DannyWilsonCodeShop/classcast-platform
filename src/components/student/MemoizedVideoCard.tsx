import React, { memo, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { getVideoUrl } from '@/lib/videoUtils';
import { getYouTubeEmbedUrl } from '@/lib/youtube';
import { isValidGoogleDriveUrl, getGoogleDrivePreviewUrl } from '@/lib/googleDrive';

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

interface MemoizedVideoCardProps {
  item: FeedItem;
  onLike: (itemId: string) => void;
  onComment: (itemId: string, comment: string) => void;
  onRate: (itemId: string, rating: number) => void;
  isConnected: boolean;
  className?: string;
}

// Memoized video thumbnail component
const VideoThumbnail = memo<{
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  className?: string;
}>(({ videoUrl, thumbnailUrl, title, className = "" }) => {
  const videoSource = useMemo(() => {
    if (!videoUrl) return null;
    
    // YouTube video
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      return {
        type: 'youtube',
        url: getYouTubeEmbedUrl(videoUrl) || videoUrl
      };
    }
    
    // Google Drive video
    if (isValidGoogleDriveUrl(videoUrl)) {
      return {
        type: 'googledrive',
        url: getGoogleDrivePreviewUrl(videoUrl) || videoUrl
      };
    }
    
    // Regular video file
    return {
      type: 'video',
      url: getVideoUrl(videoUrl)
    };
  }, [videoUrl]);
  
  if (!videoSource) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500">No video</span>
      </div>
    );
  }
  
  // Use thumbnail if available
  if (thumbnailUrl && thumbnailUrl !== '/api/placeholder/300/200') {
    return (
      <Image
        src={thumbnailUrl}
        alt={title}
        fill
        className={`object-cover ${className}`}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={false}
      />
    );
  }
  
  // For YouTube and Google Drive, show iframe
  if (videoSource.type === 'youtube' || videoSource.type === 'googledrive') {
    return (
      <iframe
        src={videoSource.url}
        className={`w-full h-full ${className}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    );
  }
  
  // For regular videos, show video element with poster
  return (
    <video
      src={`${videoSource.url}#t=2`}
      className={`w-full h-full object-cover ${className}`}
      preload="metadata"
      playsInline
      muted
      poster={thumbnailUrl}
    />
  );
});

VideoThumbnail.displayName = 'VideoThumbnail';

// Memoized interaction stats component
const InteractionStats = memo<{
  likes: number;
  comments: number;
  isLiked: boolean;
  onLike: () => void;
  onComment: () => void;
}>(({ likes, comments, isLiked, onLike, onComment }) => (
  <div className="flex items-center space-x-4 text-sm text-gray-600">
    <button
      onClick={onLike}
      className={`flex items-center space-x-1 hover:text-red-500 transition-colors ${
        isLiked ? 'text-red-500' : ''
      }`}
    >
      <span>{isLiked ? '❤️' : '🤍'}</span>
      <span>{likes || 0}</span>
    </button>
    
    <button
      onClick={onComment}
      className="flex items-center space-x-1 hover:text-blue-500 transition-colors"
    >
      <span>💬</span>
      <span>{comments || 0}</span>
    </button>
  </div>
));

InteractionStats.displayName = 'InteractionStats';

// Main memoized video card component
const MemoizedVideoCard = memo<MemoizedVideoCardProps>(({
  item,
  onLike,
  onComment,
  onRate,
  isConnected,
  className = ""
}) => {
  // Memoize handlers to prevent re-renders
  const handleLike = useCallback(() => {
    onLike(item.id);
  }, [item.id, onLike]);
  
  const handleComment = useCallback(() => {
    const comment = prompt('Enter your comment:');
    if (comment?.trim()) {
      onComment(item.id, comment.trim());
    }
  }, [item.id, onComment]);
  
  const handleRate = useCallback((rating: number) => {
    onRate(item.id, rating);
  }, [item.id, onRate]);
  
  // Memoize formatted date
  const formattedDate = useMemo(() => {
    const date = new Date(item.submittedAt || item.createdAt);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [item.submittedAt, item.createdAt]);
  
  // Memoize course badge
  const courseBadge = useMemo(() => {
    if (!item.courseCode && !item.courseName) return null;
    
    return (
      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
        {item.courseCode || item.courseName}
      </span>
    );
  }, [item.courseCode, item.courseName]);
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Video thumbnail */}
      {item.videoUrl && (
        <div className="relative aspect-video bg-gray-900">
          <VideoThumbnail
            videoUrl={item.videoUrl}
            thumbnailUrl={item.thumbnailUrl}
            title={item.title}
            className="absolute inset-0"
          />
        </div>
      )}
      
      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
            {item.studentName && (
              <p className="text-sm text-gray-600">by {item.studentName}</p>
            )}
          </div>
          {courseBadge}
        </div>
        
        {/* Description */}
        {item.description && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {item.description}
          </p>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between">
          <InteractionStats
            likes={item.likes || 0}
            comments={item.comments || 0}
            isLiked={item.isLiked || false}
            onLike={handleLike}
            onComment={handleComment}
          />
          
          <span className="text-xs text-gray-500">{formattedDate}</span>
        </div>
        
        {/* Grade info */}
        {item.grade !== undefined && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Grade:</span>
              <span className="font-semibold text-green-600">
                {item.grade}/{item.points || 100}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

MemoizedVideoCard.displayName = 'MemoizedVideoCard';

export default MemoizedVideoCard;