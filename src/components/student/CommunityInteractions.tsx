'use client';
import React, { useState, useCallback } from 'react';
import { PeerSubmissionData } from './StudentCommunityFeed';

export interface CommunityInteractionsProps {
  submission: PeerSubmissionData;
  onLike: (submissionId: string) => void;
  onComment: (submissionId: string, comment: string) => void;
  isOwnSubmission: boolean;
}

export interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  isEdited?: boolean;
}

export const CommunityInteractions: React.FC<CommunityInteractionsProps> = ({
  submission,
  onLike,
  onComment,
  isOwnSubmission,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Validate peer response if this is a peer response (not just a comment)
      const isPeerResponse = submission.assignmentId && submission.courseId;
      
      if (isPeerResponse) {
        // Get assignment data for validation
        const assignmentResponse = await fetch(`/api/assignments?assignmentId=${submission.assignmentId}`);
        const assignmentData = await assignmentResponse.json();
        
        if (assignmentData?.assignment) {
          // Validate peer response
          const validationResponse = await fetch('/api/peer-responses/validate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              assignmentId: submission.assignmentId,
              videoId: submission.submissionId,
              studentId: 'current-user-id', // In real app, get from auth context
              content: newComment.trim(),
              assignment: assignmentData.assignment
            }),
          });
          
          const validation = await validationResponse.json();
          
          if (!validation.validation.canSubmit) {
            alert(`Cannot submit response: ${validation.validation.errors.join(', ')}`);
            setIsSubmitting(false);
            return;
          }
          
          if (validation.validation.warnings.length > 0) {
            const proceed = confirm(`Warning: ${validation.validation.warnings.join(', ')}\n\nDo you want to continue?`);
            if (!proceed) {
              setIsSubmitting(false);
              return;
            }
          }
        }
      }
      
      await onComment(submission.submissionId, newComment.trim());
      setNewComment('');
      setShowComments(true);
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert('Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [newComment, isSubmitting, onComment, submission.submissionId, submission.assignmentId, submission.courseId]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  }, [handleSubmitComment]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  }, []);

  const isLiked = submission.likes?.some(like => like.userId === 'current-user-id') || false;
  const likeCount = submission.likes?.length || 0;
  const commentCount = submission.comments?.length || 0;

  return (
    <div className="space-y-4">
      {/* Interaction Stats */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          {likeCount > 0 && (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              {likeCount} {likeCount === 1 ? 'like' : 'likes'}
            </span>
          )}
          {commentCount > 0 && (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </span>
          )}
        </div>
        
        {submission.sharedAt && (
          <span className="text-xs text-gray-500">
            Shared {formatDate(submission.sharedAt)}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-4 border-t border-gray-200 pt-3">
        <button
          onClick={() => onLike(submission.submissionId)}
          disabled={isOwnSubmission}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isLiked
              ? 'text-red-600 bg-red-50 hover:bg-red-100'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          } ${isOwnSubmission ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg
            className={`w-5 h-5 ${isLiked ? 'text-red-600' : 'text-gray-500'}`}
            fill={isLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span>{isLiked ? 'Liked' : 'Like'}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Comment</span>
        </button>

        {!isOwnSubmission && (
          <button className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>Share</span>
          </button>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200 pt-4">
          {/* Add Comment */}
          <div className="mb-4">
            <div className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">Y</span>
                </div>
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a comment..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  disabled={isSubmitting}
                />
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">
                      Press Enter to submit, Shift+Enter for new line
                    </span>
                    {submission.assignmentId && (
                      <div className="text-xs text-gray-400 mt-1">
                        {newComment.trim().split(/\s+/).length} words • {newComment.length} characters
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Posting...' : 'Post Response'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Existing Comments */}
          {submission.comments && submission.comments.length > 0 ? (
            <div className="space-y-3">
              {submission.comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {comment.authorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.authorName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                      {comment.isEdited && (
                        <span className="text-xs text-gray-500 italic">(edited)</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      )}
    </div>
  );
};





