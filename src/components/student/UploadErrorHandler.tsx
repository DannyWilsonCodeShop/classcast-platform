'use client';

import React, { useState } from 'react';

export interface UploadError {
  type: 'network' | 'file' | 'server' | 'timeout' | 'size' | 'format' | 'unknown';
  message: string;
  details?: string;
  retryable: boolean;
  fileName?: string;
  fileSize?: number;
  retryCount?: number;
}

export interface UploadErrorHandlerProps {
  error: UploadError;
  onRetry?: () => void;
  onSelectNewFile?: () => void;
  onDismiss?: () => void;
  maxRetries?: number;
  className?: string;
}

export const UploadErrorHandler: React.FC<UploadErrorHandlerProps> = ({
  error,
  onRetry,
  onSelectNewFile,
  onDismiss,
  maxRetries = 3,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'network': return '🌐';
      case 'file': return '📁';
      case 'server': return '🖥️';
      case 'timeout': return '⏱️';
      case 'size': return '📏';
      case 'format': return '🎬';
      default: return '⚠️';
    }
  };

  const getErrorColor = (type: string) => {
    switch (type) {
      case 'network': return 'orange';
      case 'file': return 'red';
      case 'server': return 'purple';
      case 'timeout': return 'yellow';
      case 'size': return 'red';
      case 'format': return 'red';
      default: return 'red';
    }
  };

  const getTroubleshootingSteps = (type: string) => {
    switch (type) {
      case 'network':
        return [
          'Check your internet connection',
          'Try switching from mobile data to WiFi (or vice versa)',
          'Move closer to your WiFi router',
          'Restart your router if possible',
          'Try uploading at a different time when network is less congested',
        ];
      case 'file':
        return [
          'Make sure the file is not corrupted',
          'Try recording or selecting the video again',
          'Check if the file opens properly in your device\'s video player',
          'Ensure the file is not currently being used by another app',
        ];
      case 'server':
        return [
          'Wait a few minutes and try again',
          'Check if the website is experiencing issues',
          'Try refreshing the page',
          'Clear your browser cache and cookies',
          'Contact support if the problem persists',
        ];
      case 'timeout':
        return [
          'Ensure you have a stable internet connection',
          'Try uploading during off-peak hours',
          'Consider compressing your video to reduce file size',
          'Close other apps that might be using internet',
          'Try uploading from a different location with better internet',
        ];
      case 'size':
        return [
          'Compress your video using a video editing app',
          'Record at a lower resolution (720p instead of 1080p)',
          'Reduce the video length if possible',
          'Use a different video format (MP4 is usually most efficient)',
          'Contact your instructor about file size limits',
        ];
      case 'format':
        return [
          'Convert your video to MP4 format',
          'Use your device\'s built-in camera app to record',
          'Avoid using third-party video apps that create unusual formats',
          'Check that your video file extension matches the content',
        ];
      default:
        return [
          'Refresh the page and try again',
          'Check your internet connection',
          'Try using a different browser',
          'Clear your browser cache',
          'Contact support for assistance',
        ];
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canRetry = error.retryable && (error.retryCount || 0) < maxRetries;
  const errorColor = getErrorColor(error.type);

  return (
    <div className={`bg-white rounded-lg shadow-lg border-2 border-red-200 ${className}`}>
      <div className="p-6 space-y-4">
        {/* Error Header */}
        <div className="flex items-start space-x-3">
          <div className="text-3xl">{getErrorIcon(error.type)}</div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${
              errorColor === 'red' ? 'text-red-800' :
              errorColor === 'orange' ? 'text-orange-800' :
              errorColor === 'purple' ? 'text-purple-800' :
              errorColor === 'yellow' ? 'text-yellow-800' :
              'text-red-800'
            }`}>
              Upload Failed
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {error.message}
            </p>
          </div>
        </div>

        {/* File Information */}
        {error.fileName && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="text-xl">🎥</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {error.fileName}
                </p>
                {error.fileSize && (
                  <p className="text-sm text-gray-500">
                    {formatFileSize(error.fileSize)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Details */}
        {error.details && (
          <div className="space-y-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              {showDetails ? 'Hide' : 'Show'} error details
            </button>
            
            {showDetails && (
              <div className="bg-gray-100 border border-gray-200 rounded p-3 text-sm text-gray-700">
                {error.details}
              </div>
            )}
          </div>
        )}

        {/* Retry Information */}
        {error.retryCount !== undefined && error.retryCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              Retry attempts: {error.retryCount} of {maxRetries}
            </p>
          </div>
        )}

        {/* Troubleshooting Section */}
        <div className="space-y-2">
          <button
            onClick={() => setShowTroubleshooting(!showTroubleshooting)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showTroubleshooting ? 'Hide' : 'Show'} troubleshooting tips
          </button>
          
          {showTroubleshooting && (
            <div className={`border rounded-lg p-4 ${
              errorColor === 'red' ? 'bg-red-25 border-red-100' :
              errorColor === 'orange' ? 'bg-orange-25 border-orange-100' :
              errorColor === 'purple' ? 'bg-purple-25 border-purple-100' :
              errorColor === 'yellow' ? 'bg-yellow-25 border-yellow-100' :
              'bg-red-25 border-red-100'
            }`}>
              <h4 className="text-sm font-medium text-gray-800 mb-3">
                💡 Try these solutions:
              </h4>
              <div className="space-y-2">
                {getTroubleshootingSteps(error.type).map((step, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                    <span className="text-blue-500 mt-0.5 flex-shrink-0">
                      {index + 1}.
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Fix Suggestions */}
        <div className={`border rounded-lg p-4 ${
          errorColor === 'red' ? 'bg-red-50 border-red-200' :
          errorColor === 'orange' ? 'bg-orange-50 border-orange-200' :
          errorColor === 'purple' ? 'bg-purple-50 border-purple-200' :
          errorColor === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
          'bg-red-50 border-red-200'
        }`}>
          <h4 className="text-sm font-medium text-gray-800 mb-2">
            🚀 Quick fixes to try first:
          </h4>
          <div className="grid grid-cols-1 gap-2 text-xs text-gray-700">
            {error.type === 'network' && (
              <>
                <div>• Switch to WiFi if using mobile data</div>
                <div>• Move closer to your router</div>
                <div>• Try again in a few minutes</div>
              </>
            )}
            {error.type === 'size' && (
              <>
                <div>• Record at 720p instead of 1080p</div>
                <div>• Keep videos under 5 minutes</div>
                <div>• Use MP4 format for smaller files</div>
              </>
            )}
            {error.type === 'format' && (
              <>
                <div>• Use your device's camera app</div>
                <div>• Save as MP4 format</div>
                <div>• Avoid third-party video apps</div>
              </>
            )}
            {(error.type === 'server' || error.type === 'timeout') && (
              <>
                <div>• Wait 2-3 minutes and retry</div>
                <div>• Refresh the page</div>
                <div>• Check if site is working normally</div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          <div className="flex space-x-3">
            {canRetry && onRetry && (
              <button
                onClick={onRetry}
                className={`flex-1 text-white px-4 py-3 rounded-lg font-medium transition-colors ${
                  errorColor === 'red' ? 'bg-red-600 hover:bg-red-700' :
                  errorColor === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
                  errorColor === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                  errorColor === 'yellow' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                🔄 Try Again ({maxRetries - (error.retryCount || 0)} attempts left)
              </button>
            )}
            
            {onSelectNewFile && (
              <button
                onClick={onSelectNewFile}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                📁 Select Different File
              </button>
            )}
          </div>

          {!canRetry && error.retryable && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Maximum retry attempts reached
              </p>
              <button
                onClick={onSelectNewFile}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                📁 Try with a different file
              </button>
            </div>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Dismiss
            </button>
          )}
        </div>

        {/* Support Contact */}
        <div className="border-t border-gray-200 pt-4 text-center">
          <p className="text-xs text-gray-500">
            Still having trouble? Contact your instructor or technical support for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};