'use client';

import React, { useState, useEffect } from 'react';

export interface UploadStatus {
  stage: 'idle' | 'preparing' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  fileName?: string;
  fileSize?: number;
  error?: string;
  uploadSpeed?: number;
  timeRemaining?: number;
  retryCount?: number;
}

export interface EnhancedUploadFeedbackProps {
  status: UploadStatus;
  onRetry?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const EnhancedUploadFeedback: React.FC<EnhancedUploadFeedbackProps> = ({
  status,
  onRetry,
  onCancel,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [celebrationVisible, setCelebrationVisible] = useState(false);

  // Show celebration animation when upload completes
  useEffect(() => {
    if (status.stage === 'completed') {
      setCelebrationVisible(true);
      const timer = setTimeout(() => setCelebrationVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [status.stage]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStageInfo = (stage: string) => {
    switch (stage) {
      case 'preparing':
        return {
          title: 'Preparing Upload',
          description: 'Validating file and preparing for upload...',
          icon: '🔄',
          color: 'blue',
        };
      case 'uploading':
        return {
          title: 'Uploading Video',
          description: 'Your video is being uploaded to the server...',
          icon: '⬆️',
          color: 'blue',
        };
      case 'processing':
        return {
          title: 'Processing Video',
          description: 'Server is processing your video for playback...',
          icon: '⚙️',
          color: 'yellow',
        };
      case 'completed':
        return {
          title: 'Upload Complete!',
          description: 'Your video has been successfully uploaded and processed.',
          icon: '✅',
          color: 'green',
        };
      case 'error':
        return {
          title: 'Upload Failed',
          description: 'There was an error uploading your video.',
          icon: '❌',
          color: 'red',
        };
      default:
        return {
          title: 'Ready to Upload',
          description: 'Select a video file to begin upload.',
          icon: '📁',
          color: 'gray',
        };
    }
  };

  const stageInfo = getStageInfo(status.stage);

  if (status.stage === 'idle') {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border-2 ${className}`}>
      {/* Celebration Animation */}
      {celebrationVisible && status.stage === 'completed' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="text-6xl">🎉</div>
          </div>
          <div className="absolute top-4 right-4 animate-pulse">
            <div className="text-4xl">✨</div>
          </div>
          <div className="absolute top-4 left-4 animate-pulse delay-300">
            <div className="text-4xl">🌟</div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`text-2xl ${status.stage === 'uploading' ? 'animate-pulse' : ''}`}>
              {stageInfo.icon}
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${
                stageInfo.color === 'green' ? 'text-green-800' :
                stageInfo.color === 'red' ? 'text-red-800' :
                stageInfo.color === 'yellow' ? 'text-yellow-800' :
                'text-blue-800'
              }`}>
                {stageInfo.title}
              </h3>
              <p className="text-sm text-gray-600">{stageInfo.description}</p>
            </div>
          </div>
          
          {/* Progress Percentage */}
          {(status.stage === 'uploading' || status.stage === 'processing') && (
            <div className="text-right">
              <div className={`text-2xl font-bold ${
                stageInfo.color === 'blue' ? 'text-blue-600' : 'text-yellow-600'
              }`}>
                {Math.round(status.progress)}%
              </div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          )}
        </div>

        {/* File Information */}
        {status.fileName && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🎥</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {status.fileName}
                </p>
                {status.fileSize && (
                  <p className="text-sm text-gray-500">
                    {formatFileSize(status.fileSize)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {(status.stage === 'uploading' || status.stage === 'processing') && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{Math.round(status.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-300 ease-out ${
                  status.stage === 'uploading' ? 'bg-blue-500' : 'bg-yellow-500'
                } ${status.stage === 'uploading' ? 'animate-pulse' : ''}`}
                style={{ width: `${status.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload Details */}
        {status.stage === 'uploading' && (status.uploadSpeed || status.timeRemaining) && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {status.uploadSpeed && (
              <div className="text-center">
                <div className="font-medium text-gray-900">
                  {formatFileSize(status.uploadSpeed)}/s
                </div>
                <div className="text-gray-500">Upload Speed</div>
              </div>
            )}
            {status.timeRemaining && (
              <div className="text-center">
                <div className="font-medium text-gray-900">
                  {formatTime(status.timeRemaining)}
                </div>
                <div className="text-gray-500">Time Remaining</div>
              </div>
            )}
          </div>
        )}

        {/* Stage Indicators */}
        <div className="flex justify-between items-center">
          {['preparing', 'uploading', 'processing', 'completed'].map((stage, index) => {
            const isActive = status.stage === stage;
            const isCompleted = ['preparing', 'uploading', 'processing', 'completed'].indexOf(status.stage) > index;
            const isError = status.stage === 'error';
            
            return (
              <div key={stage} className="flex flex-col items-center space-y-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isError && index >= ['preparing', 'uploading', 'processing', 'completed'].indexOf(status.stage) 
                    ? 'bg-red-100 text-red-600' :
                  isCompleted || isActive 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                } ${isActive ? 'animate-pulse' : ''}`}>
                  {isError && index >= ['preparing', 'uploading', 'processing', 'completed'].indexOf(status.stage) ? '!' :
                   isCompleted ? '✓' : index + 1}
                </div>
                <div className={`text-xs text-center ${
                  isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}>
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Messages */}
        {status.stage === 'preparing' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="animate-spin text-blue-500">⏳</div>
              <div>
                <h4 className="text-sm font-medium text-blue-800">Getting Ready</h4>
                <p className="mt-1 text-sm text-blue-700">
                  We're validating your video file and preparing it for upload. This usually takes just a few seconds.
                </p>
              </div>
            </div>
          </div>
        )}

        {status.stage === 'uploading' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="animate-bounce text-blue-500">📤</div>
              <div>
                <h4 className="text-sm font-medium text-blue-800">Upload in Progress</h4>
                <p className="mt-1 text-sm text-blue-700">
                  Your video is being uploaded. Please don't close this page or navigate away. 
                  Large files may take several minutes.
                </p>
              </div>
            </div>
          </div>
        )}

        {status.stage === 'processing' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="animate-spin text-yellow-500">⚙️</div>
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Processing Video</h4>
                <p className="mt-1 text-sm text-yellow-700">
                  Your video has been uploaded successfully! We're now processing it to ensure optimal playback quality.
                </p>
              </div>
            </div>
          </div>
        )}

        {status.stage === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-green-500 text-xl">🎉</div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-green-800">Upload Successful!</h4>
                <p className="mt-1 text-sm text-green-700">
                  Your video has been successfully uploaded and processed. It's now available for viewing and grading.
                </p>
                <div className="mt-3 flex items-center space-x-2">
                  <div className="flex items-center text-xs text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Video uploaded
                  </div>
                  <div className="flex items-center text-xs text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Processing complete
                  </div>
                  <div className="flex items-center text-xs text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Ready for grading
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {status.stage === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-red-500 text-xl">⚠️</div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800">Upload Failed</h4>
                <p className="mt-1 text-sm text-red-700">
                  {status.error || 'An unexpected error occurred during upload.'}
                </p>
                {status.retryCount && status.retryCount > 0 && (
                  <p className="mt-1 text-xs text-red-600">
                    Retry attempts: {status.retryCount}
                  </p>
                )}
                
                {/* Common Error Solutions */}
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    {showDetails ? 'Hide' : 'Show'} troubleshooting tips
                  </button>
                  
                  {showDetails && (
                    <div className="bg-red-25 border border-red-100 rounded p-3 text-xs text-red-700">
                      <div className="space-y-2">
                        <div>• Check your internet connection</div>
                        <div>• Ensure the file is a valid video format (MP4, MOV, WebM)</div>
                        <div>• Verify the file size is under the limit</div>
                        <div>• Try refreshing the page and uploading again</div>
                        <div>• If on mobile, try switching to WiFi</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {status.stage === 'error' && onRetry && (
            <button
              onClick={onRetry}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              🔄 Try Again
            </button>
          )}
          
          {(status.stage === 'uploading' || status.stage === 'processing') && onCancel && (
            <button
              onClick={onCancel}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Cancel Upload
            </button>
          )}
          
          {status.stage === 'completed' && (
            <div className="text-center">
              <div className="text-sm text-green-600 font-medium">
                ✅ Your submission has been recorded
              </div>
              <div className="text-xs text-gray-500 mt-1">
                You can now navigate away from this page
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};