'use client';

import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

interface VideoCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle: string;
  authorName: string;
  onCommentSubmit: (comment: string) => Promise<void>;
}

export const VideoCommentModal: React.FC<VideoCommentModalProps> = ({
  isOpen,
  onClose,
  videoId,
  videoTitle,
  authorName,
  onCommentSubmit
}) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) return;

    try {
      setIsSubmitting(true);
      await onCommentSubmit(comment.trim());
      
      // Show success message
      setShowSuccess(true);
      setComment('');
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">Leave a Comment</h3>
            <p className="text-sm text-gray-600 mt-1">
              On <span className="font-medium">{authorName}</span>'s video
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="p-4 bg-green-50 border-b border-green-200">
            <div className="flex items-center space-x-2 text-green-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Comment submitted successfully!</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts on this video..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={6}
              maxLength={500}
              disabled={isSubmitting || showSuccess}
              autoFocus
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {comment.length}/500 characters
              </span>
              {comment.trim() && (
                <span className="text-xs text-blue-600 font-medium">
                  ✓ Ready to submit
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
              disabled={isSubmitting || showSuccess}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!comment.trim() || isSubmitting || showSuccess}
              className={`
                flex items-center space-x-2 px-6 py-2.5 rounded-xl font-medium transition-all duration-200
                ${comment.trim() && !isSubmitting && !showSuccess
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Comment</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Tip */}
        <div className="px-6 pb-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Keep comments constructive and helpful. Your feedback helps your classmates improve!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

