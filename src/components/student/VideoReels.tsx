'use client';

import React, { useState, useEffect } from 'react';
import { PlayIcon, PauseIcon, HeartIcon, ChatBubbleLeftIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api, VideoReel } from '@/lib/api';


interface VideoReelsProps {
  studentId: string;
  onVideoClick?: (video: VideoReel) => void;
}

const VideoReels: React.FC<VideoReelsProps> = ({ studentId, onVideoClick }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [reels, setReels] = useState<VideoReel[]>([]);
  const [currentVideo, setCurrentVideo] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [showRating, setShowRating] = useState<boolean>(false);
  const [selectedVideoForRating, setSelectedVideoForRating] = useState<VideoReel | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);

  useEffect(() => {
    loadVideoReels();
  }, [studentId]);

  const loadVideoReels = async () => {
    try {
      setIsLoading(true);
      
      // Use the clean API to fetch videos
      const videosData = await api.getVideos();
      setReels(videosData.slice(0, 10)); // Show only first 10 videos
    } catch (error) {
      console.error('Error loading video reels:', error);
      // Set empty array on error - no mock data
      setReels([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (videoId: string) => {
    try {
      // Use the clean API to like the video
      const updatedVideo = await api.likeVideo(videoId);
      
      // Update local state with the response
      setReels(prev => prev.map(r => 
        r.id === videoId ? updatedVideo : r
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
      // Fallback to local state update if API fails
      setReels(prev => prev.map(r => 
        r.id === videoId 
          ? { 
              ...r, 
              isLiked: !r.isLiked,
              likes: r.isLiked ? Math.max(0, r.likes - 1) : r.likes + 1
            }
          : r
      ));
    }
  };

  const handleVideoClick = (video: VideoReel) => {
    if (onVideoClick) {
      onVideoClick(video);
    }
  };

  const handleCommentClick = async (videoId: string) => {
    setSelectedVideoId(videoId);
    setShowComments(true);
    await loadComments(videoId);
  };

  const loadComments = async (videoId: string) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/interactions?type=comment`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(data.interactions || []);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedVideoId || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      
      const response = await fetch(`/api/videos/${selectedVideoId}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: 'comment',
          userId: studentId,
          userName: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Current User',
          userAvatar: user?.avatar || '/api/placeholder/40/40',
          content: newComment.trim()
        }),
      });

      if (response.ok) {
        setNewComment('');
        await loadComments(selectedVideoId);
        
        // Update the comment count in the reels
        setReels(prev => prev.map(reel => 
          reel.id === selectedVideoId 
            ? { ...reel, comments: reel.comments + 1 }
            : reel
        ));
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleRatingClick = (video: VideoReel) => {
    setSelectedVideoForRating(video);
    setShowRating(true);
    setRating(0);
    setRatingComment('');
  };

  const handleSubmitRating = async () => {
    if (!selectedVideoForRating || rating === 0 || isSubmittingRating) return;

    try {
      setIsSubmittingRating(true);
      
      const response = await fetch(`/api/videos/${selectedVideoForRating.id}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: 'rating',
          userId: studentId,
          userName: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Current User',
          userAvatar: user?.avatar || '/api/placeholder/40/40',
          contentCreatorId: selectedVideoForRating.author?.id || '',
          rating: rating,
          comment: ratingComment.trim()
        }),
      });

      if (response.ok) {
        setShowRating(false);
        setSelectedVideoForRating(null);
        setRating(0);
        setRatingComment('');
        
        // Refresh the video reels to show updated stats
        await loadVideoReels();
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎬 Recently Posted</h3>
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-48 bg-gray-200 rounded-xl animate-pulse">
              <div className="h-32 bg-gray-300 rounded-t-xl"></div>
              <div className="p-3">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3 mb-2"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🎬 Recently Posted</h3>
        <button 
          onClick={() => router.push('/student/videos')}
          className="text-sm text-[#4A90E2] hover:text-[#9B5DE5] font-medium transition-colors"
        >
          View All →
        </button>
      </div>
      
      {/* Horizontal Scrolling Grid */}
      <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            className="flex-shrink-0 w-48 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer group"
            onClick={() => handleVideoClick(reel)}
          >
            {/* Video Thumbnail */}
            <div className="relative">
              <img
                src={reel.thumbnail}
                alt={reel.title}
                className="w-full h-32 object-cover rounded-t-xl"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlaying(!isPlaying);
                    setCurrentVideo(index);
                  }}
                  className="bg-white bg-opacity-0 group-hover:bg-opacity-90 rounded-full p-2 transition-all duration-200"
                >
                  {isPlaying && currentVideo === index ? (
                    <PauseIcon className="h-5 w-5 text-gray-800" />
                  ) : (
                    <PlayIcon className="h-5 w-5 text-gray-800" />
                  )}
                </button>
              </div>
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {formatDuration(reel.duration)}
              </div>
            </div>

            {/* Video Info */}
            <div className="p-3">
              <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 group-hover:text-[#4A90E2] transition-colors">
                {reel.title}
              </h4>
              
              {/* Author Info */}
              <div className="flex items-center space-x-2 mb-2">
                <img
                  src={reel.author?.avatar || '/api/placeholder/20/20'}
                  alt={reel.author?.name || 'Unknown Author'}
                  className="w-5 h-5 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {reel.author?.name || 'Unknown Author'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTimeAgo(reel.createdAt)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(reel.id);
                    }}
                    className="flex items-center space-x-1 text-xs text-gray-600 hover:text-red-600 transition-colors"
                  >
                    {reel.isLiked ? (
                      <HeartSolidIcon className="h-3 w-3 text-red-500" />
                    ) : (
                      <HeartIcon className="h-3 w-3" />
                    )}
                    <span>{reel.likes}</span>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCommentClick(reel.id);
                    }}
                    className="flex items-center space-x-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <ChatBubbleLeftIcon className="h-3 w-3" />
                    <span>{reel.comments}</span>
                  </button>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRatingClick(reel);
                  }}
                  className="text-xs text-gray-600 hover:text-yellow-600 transition-colors"
                  title="Rate this content creator"
                >
                  ⭐
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {reels.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🎬</div>
          <p className="text-gray-600">No videos posted yet</p>
          <p className="text-sm text-gray-500">Check back later for peer videos!</p>
        </div>
      )}

      {/* Comments Modal */}
      {showComments && selectedVideoId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
              <button
                onClick={() => {
                  setShowComments(false);
                  setSelectedVideoId(null);
                  setComments([]);
                  setNewComment('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-2xl mb-2">💬</div>
                  <p className="text-gray-600">No comments yet</p>
                  <p className="text-sm text-gray-500">Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <img
                      src={comment.userAvatar || '/api/placeholder/40/40'}
                      alt={comment.userName}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">{comment.userName}</p>
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(comment.createdAt)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmittingComment ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRating && selectedVideoForRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Rate Content Creator</h3>
              <p className="text-sm text-gray-600 mt-1">
                Rate {selectedVideoForRating.author?.name || 'Unknown Author'}'s content
              </p>
            </div>

            {/* Rating Content */}
            <div className="p-4 space-y-4">
              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How would you rate this content? *
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-2xl transition-colors ${
                        star <= rating
                          ? 'text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {rating === 0 && 'Select a rating'}
                  {rating === 1 && 'Poor - Not helpful at all'}
                  {rating === 2 && 'Fair - Somewhat helpful'}
                  {rating === 3 && 'Good - Helpful content'}
                  {rating === 4 && 'Very Good - Very helpful'}
                  {rating === 5 && 'Excellent - Extremely helpful'}
                </p>
              </div>

              {/* Optional Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Optional feedback
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Share what you liked about this content..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowRating(false);
                  setSelectedVideoForRating(null);
                  setRating(0);
                  setRatingComment('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={rating === 0 || isSubmittingRating}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoReels;
