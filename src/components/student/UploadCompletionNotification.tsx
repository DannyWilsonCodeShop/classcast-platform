'use client';

import React, { useState, useEffect } from 'react';

export interface UploadCompletionData {
  fileName: string;
  fileSize: number;
  uploadTime: number; // in seconds
  submissionId: string;
  assignmentTitle?: string;
  courseTitle?: string;
}

export interface UploadCompletionNotificationProps {
  completionData: UploadCompletionData;
  onDismiss?: () => void;
  onViewSubmission?: (submissionId: string) => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  className?: string;
}

export const UploadCompletionNotification: React.FC<UploadCompletionNotificationProps> = ({
  completionData,
  onDismiss,
  onViewSubmission,
  autoHide = true,
  autoHideDelay = 10000,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti after animation
    const confettiTimer = setTimeout(() => setShowConfetti(false), 3000);
    
    // Auto-hide notification
    let autoHideTimer: NodeJS.Timeout;
    if (autoHide) {
      autoHideTimer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss?.(), 300); // Wait for fade out animation
      }, autoHideDelay);
    }

    return () => {
      clearTimeout(confettiTimer);
      if (autoHideTimer) clearTimeout(autoHideTimer);
    };
  }, [autoHide, autoHideDelay, onDismiss]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUploadTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
      
      {/* Notification Card */}
      <div className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 50}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              >
                <div className={`w-2 h-2 rounded-full ${
                  ['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400', 'bg-pink-400'][Math.floor(Math.random() * 6)]
                }`} />
              </div>
            ))}
          </div>
        )}

        <div className="p-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {/* Pulse animation */}
              <div className="absolute inset-0 w-20 h-20 bg-green-200 rounded-full animate-ping opacity-20" />
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              🎉 Upload Complete!
            </h2>
            <p className="text-gray-600">
              Your video has been successfully submitted and is ready for grading.
            </p>
          </div>

          {/* File Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🎥</div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900 truncate">
                  {completionData.fileName}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(completionData.fileSize)} • Uploaded in {formatUploadTime(completionData.uploadTime)}
                </p>
              </div>
            </div>

            {/* Assignment Info */}
            {(completionData.assignmentTitle || completionData.courseTitle) && (
              <div className="border-t border-gray-200 pt-3">
                {completionData.assignmentTitle && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Assignment:</span> {completionData.assignmentTitle}
                  </p>
                )}
                {completionData.courseTitle && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Course:</span> {completionData.courseTitle}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2" />
              <p className="text-xs text-gray-600">Uploaded</p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2" />
              <p className="text-xs text-gray-600">Processed</p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2" />
              <p className="text-xs text-gray-600">Submitted</p>
            </div>
          </div>

          {/* Success Details */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-green-500 text-xl">✅</div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-medium text-green-800">Submission Confirmed</h4>
                <div className="mt-2 space-y-1 text-xs text-green-700">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Video uploaded and verified
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Processing completed successfully
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Available for instructor review
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Submission ID: {completionData.submissionId.slice(-8)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {onViewSubmission && (
              <button
                onClick={() => onViewSubmission(completionData.submissionId)}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                📋 View Submission
              </button>
            )}
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onDismiss?.(), 300);
              }}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              ✓ Got It
            </button>
          </div>

          {/* Auto-hide indicator */}
          {autoHide && (
            <div className="text-xs text-gray-500">
              This notification will auto-close in {Math.ceil(autoHideDelay / 1000)} seconds
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onDismiss?.(), 300);
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};