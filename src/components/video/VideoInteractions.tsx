'use client';

import { useState } from 'react';
import StudentShareModal from './StudentShareModal';

interface VideoInteractionsProps {
  videoId: string;
  initialLikes: number;
  initialComments: number;
  initialViews: number;
  isLiked: boolean;
  onLike: (videoId: string) => void;
  onComment: (videoId: string, comment: string) => void;
  onResponse: (videoId: string, response: string) => void;
  onShare: (videoId: string, type: 'internal' | 'external') => void;
}

interface Comment {
  id: string;
  author: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

export default function VideoInteractions({
  videoId,
  initialLikes,
  initialComments,
  initialViews,
  isLiked,
  onLike,
  onComment,
  onResponse,
  onShare
}: VideoInteractionsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(isLiked);
  const [comments, setComments] = useState(initialComments);
  const [views, setViews] = useState(initialViews);
  const [showComments, setShowComments] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showStudentShare, setShowStudentShare] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [commentList, setCommentList] = useState<Comment[]>([
    {
      id: '1',
      author: 'Sarah Chen',
      authorAvatar: 'SC',
      content: 'Great explanation! This really helped me understand the concept.',
      timestamp: '2h ago',
      likes: 5,
      isLiked: false
    },
    {
      id: '2',
      author: 'Marcus Rodriguez',
      authorAvatar: 'MR',
      content: 'Could you explain the second step in more detail?',
      timestamp: '1h ago',
      likes: 2,
      isLiked: true,
      replies: [
        {
          id: '2-1',
          author: 'Alex Johnson',
          authorAvatar: 'AJ',
          content: 'I can help with that! The second step involves...',
          timestamp: '30m ago',
          likes: 1,
          isLiked: false
        }
      ]
    }
  ]);

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes(prev => newLiked ? prev + 1 : prev - 1);
    onLike(videoId);
  };

  const handleComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        author: 'You',
        authorAvatar: 'U',
        content: newComment,
        timestamp: 'Just now',
        likes: 0,
        isLiked: false
      };
      setCommentList(prev => [comment, ...prev]);
      setComments(prev => prev + 1);
      setNewComment('');
      onComment(videoId, newComment);
    }
  };

  const handleResponse = () => {
    if (newResponse.trim()) {
      // In a real app, this would submit to backend for grading
      console.log('Graded response submitted:', newResponse);
      setNewResponse('');
      setShowResponse(false);
      onResponse(videoId, newResponse);
    }
  };

  const handleShare = (type: 'internal' | 'external') => {
    if (type === 'internal') {
      setShowShare(false);
      setShowStudentShare(true);
    } else {
      setShowShare(false);
      onShare(videoId, type);
    }
  };

  const handleStudentShare = (studentIds: string[]) => {
    console.log('Sharing video with students:', studentIds);
    setShowStudentShare(false);
    onShare(videoId, 'internal');
  };

  const handleCommentLike = (commentId: string) => {
    setCommentList(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, isLiked: !comment.isLiked, likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1 }
        : comment
    ));
  };

  return (
    <div className="space-y-4">
      {/* Main Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 transition-colors ${
              liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <span className="text-2xl">{liked ? '❤️' : '🤍'}</span>
            <span className="font-bold text-lg">{likes}</span>
          </button>
          
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <span className="text-2xl">💬</span>
            <span className="font-bold text-lg">{comments}</span>
          </button>
          
          <button
            onClick={() => setShowResponse(true)}
            className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors"
          >
            <span className="text-2xl">📝</span>
            <span className="font-bold text-lg">Respond</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-gray-500">
            <span className="text-lg">👁️</span>
            <span className="font-bold text-lg">{views}</span>
          </div>
          
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center space-x-2 text-gray-500 hover:text-purple-500 transition-colors"
          >
            <span className="text-2xl">📤</span>
            <span className="font-bold text-lg">Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
          <h3 className="font-bold text-gray-800">Comments ({comments})</h3>
          
          {/* Add Comment */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleComment()}
            />
            <button
              onClick={handleComment}
              className="px-4 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
            >
              Post
            </button>
          </div>
          
          {/* Comments List */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {commentList.map((comment) => (
              <div key={comment.id} className="bg-white rounded-lg p-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{comment.authorAvatar}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-800 text-sm">{comment.author}</span>
                      <span className="text-xs text-gray-500">• {comment.timestamp}</span>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{comment.content}</p>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleCommentLike(comment.id)}
                        className={`flex items-center space-x-1 text-xs ${
                          comment.isLiked ? 'text-red-500' : 'text-gray-500'
                        }`}
                      >
                        <span>{comment.isLiked ? '❤️' : '🤍'}</span>
                        <span>{comment.likes}</span>
                      </button>
                      <button className="text-xs text-gray-500 hover:text-blue-500">
                        Reply
                      </button>
                    </div>
                    
                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-2 ml-4 space-y-2">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="bg-gray-50 rounded-lg p-2">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-gray-800 text-xs">{reply.author}</span>
                              <span className="text-xs text-gray-500">• {reply.timestamp}</span>
                            </div>
                            <p className="text-gray-700 text-xs">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Graded Response Modal */}
      {showResponse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Create Graded Response</h3>
              <button
                onClick={() => setShowResponse(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-bold text-blue-800 mb-2">📝 Graded Response Guidelines</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Write a thoughtful response (minimum 200 words)</li>
                  <li>• Include specific examples from the video</li>
                  <li>• Connect to course concepts and materials</li>
                  <li>• Your response will be graded by your instructor</li>
                </ul>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Response
                </label>
                <textarea
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  placeholder="Write your detailed response here..."
                  rows={8}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none resize-none"
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {newResponse.length} characters (minimum 200)
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowResponse(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResponse}
                  disabled={newResponse.length < 200}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShare && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Share Video</h3>
              <button
                onClick={() => setShowShare(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleShare('internal')}
                className="w-full flex items-center space-x-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <span className="text-2xl">👥</span>
                <div className="text-left">
                  <div className="font-bold text-gray-800">Share with Classmates</div>
                  <div className="text-sm text-gray-600">Send to specific students or groups</div>
                </div>
              </button>
              
              <button
                onClick={() => handleShare('external')}
                className="w-full flex items-center space-x-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
              >
                <span className="text-2xl">🌐</span>
                <div className="text-left">
                  <div className="font-bold text-gray-800">Share Externally</div>
                  <div className="text-sm text-gray-600">Copy link or share to social media</div>
                </div>
              </button>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-500 text-center">
                  Video link: classcast.app/video/{videoId}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Share Modal */}
      <StudentShareModal
        isOpen={showStudentShare}
        onClose={() => setShowStudentShare(false)}
        videoTitle={`Video ${videoId}`}
        onShare={handleStudentShare}
      />
    </div>
  );
}
