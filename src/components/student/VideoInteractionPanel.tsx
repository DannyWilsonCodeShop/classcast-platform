'use client';

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Star, Send, ThumbsUp } from 'lucide-react';
import { VideoInteraction, VideoComment, VideoResponse, VideoRating, VideoStats } from '@/types/video-interactions';

interface VideoInteractionPanelProps {
  videoId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  onStatsUpdate?: (stats: VideoStats) => void;
}

const VideoInteractionPanel: React.FC<VideoInteractionPanelProps> = ({
  videoId,
  userId,
  userName,
  userAvatar,
  onStatsUpdate
}) => {
  const [stats, setStats] = useState<VideoStats>({
    videoId,
    views: 0,
    likes: 0,
    comments: 0,
    responses: 0,
    averageRating: 0,
    totalRatings: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [responses, setResponses] = useState<VideoResponse[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVideoStats();
    loadComments();
    loadResponses();
    checkUserLiked();
  }, [videoId, userId]);

  const loadVideoStats = async () => {
    try {
      const response = await fetch(`/api/videos/${videoId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        onStatsUpdate?.(data.stats);
      }
    } catch (error) {
      console.error('Error loading video stats:', error);
    }
  };

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/videos/${videoId}/interactions?type=comment`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.interactions || []);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadResponses = async () => {
    try {
      const response = await fetch(`/api/videos/${videoId}/interactions?type=response`);
      if (response.ok) {
        const data = await response.json();
        setResponses(data.interactions || []);
      }
    } catch (error) {
      console.error('Error loading responses:', error);
    }
  };

  const checkUserLiked = async () => {
    try {
      const response = await fetch(`/api/videos/${videoId}/interactions?type=like&userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.interactions && data.interactions.length > 0);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const action = isLiked ? 'unlike' : 'like';
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setStats(prev => ({
          ...prev,
          likes: prev.likes + (isLiked ? -1 : 1)
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || loading) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/videos/${videoId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'comment',
          userId,
          userName,
          userAvatar,
          content: newComment
        })
      });

      if (response.ok) {
        setNewComment('');
        loadComments();
        setStats(prev => ({ ...prev, comments: prev.comments + 1 }));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async () => {
    if (!newResponse.trim() || loading) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/videos/${videoId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'response',
          userId,
          userName,
          userAvatar,
          content: newResponse
        })
      });

      if (response.ok) {
        setNewResponse('');
        setShowResponse(false);
        loadResponses();
        setStats(prev => ({ ...prev, responses: prev.responses + 1 }));
      }
    } catch (error) {
      console.error('Error adding response:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async () => {
    if (rating === 0 || loading) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/videos/${videoId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rating',
          userId,
          userName,
          userAvatar,
          contentCreatorId: videoId, // This would need to be the actual creator ID
          rating,
          comment: ratingComment
        })
      });

      if (response.ok) {
        setRating(0);
        setRatingComment('');
        setShowRating(false);
        loadVideoStats(); // Reload to get updated average rating
      }
    } catch (error) {
      console.error('Error adding rating:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4">
      {/* Stats Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            disabled={loading}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-all duration-200 ${
              isLiked 
                ? 'bg-red-500 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{stats.likes}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{stats.comments}</span>
          </button>

          <button
            onClick={() => setShowResponse(!showResponse)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all duration-200"
          >
            <Send className="w-4 h-4" />
            <span>{stats.responses}</span>
          </button>

          <button
            onClick={() => setShowRating(!showRating)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl font-bold bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-all duration-200"
          >
            <Star className="w-4 h-4" />
            <span>{stats.averageRating.toFixed(1)}</span>
          </button>
        </div>

        <div className="text-sm text-gray-600">
          <ThumbsUp className="w-4 h-4 inline mr-1" />
          {stats.views} views
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mb-4">
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleComment}
              disabled={loading || !newComment.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Post
            </button>
          </div>

          <div className="space-y-3 max-h-40 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {comment.userName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="font-bold text-sm text-gray-900">{comment.userName}</div>
                    <div className="text-sm text-gray-700">{comment.content}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Response Section */}
      {showResponse && (
        <div className="mb-4">
          <h3 className="font-bold text-gray-900 mb-2">📝 Write a Response for Grading</h3>
          <textarea
            value={newResponse}
            onChange={(e) => setNewResponse(e.target.value)}
            placeholder="Write your detailed response here. This will be sent to your instructor for grading..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          />
          <div className="flex space-x-2">
            <button
              onClick={handleResponse}
              disabled={loading || !newResponse.trim()}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              Submit Response
            </button>
            <button
              onClick={() => setShowResponse(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rating Section */}
      {showRating && (
        <div className="mb-4">
          <h3 className="font-bold text-gray-900 mb-2">⭐ Rate Content Creator</h3>
          <div className="flex space-x-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-2xl ${
                  star <= rating ? 'text-yellow-500' : 'text-gray-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <input
            type="text"
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
            placeholder="Optional comment about the content..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 mb-3"
          />
          <div className="flex space-x-2">
            <button
              onClick={handleRating}
              disabled={loading || rating === 0}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
            >
              Submit Rating
            </button>
            <button
              onClick={() => setShowRating(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoInteractionPanel;
