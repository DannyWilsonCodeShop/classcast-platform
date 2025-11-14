'use client';

import React from 'react';

export interface VideoUploadProgressProps {
  progress: number;
  fileName: string;
  className?: string;
}

export const VideoUploadProgress: React.FC<VideoUploadProgressProps> = ({
  progress,
  fileName,
  className = '',
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProgressColor = (progress: number): string => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    if (progress < 100) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getProgressText = (progress: number): string => {
    if (progress < 10) return 'Starting upload...';
    if (progress < 30) return 'Uploading...';
    if (progress < 70) return 'Processing...';
    if (progress < 100) return 'Finalizing...';
    return 'Upload complete!';
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Uploading Video</h3>
              <p className="text-sm text-gray-500">{getProgressText(progress)}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{Math.round(progress)}%</div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        </div>

        {/* File Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
              <p className="text-sm text-gray-500">
                Video file • {formatFileSize(0)} {/* File size would be passed as prop in real implementation */}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Upload Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-300 ease-out ${getProgressColor(progress)}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${progress >= 10 ? 'bg-green-500' : 'bg-gray-300'}`} />
            <p className="text-xs text-gray-600">Started</p>
          </div>
          <div className="text-center">
            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${progress >= 50 ? 'bg-green-500' : 'bg-gray-300'}`} />
            <p className="text-xs text-gray-600">Uploading</p>
          </div>
          <div className="text-center">
            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${progress >= 100 ? 'bg-green-500' : 'bg-gray-300'}`} />
            <p className="text-xs text-gray-600">Complete</p>
          </div>
        </div>

        {/* Additional Info */}
        {progress < 100 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-800">Upload in Progress</h4>
                <p className="mt-1 text-sm text-blue-700">
                  Please don't close this page or navigate away while the upload is in progress. 
                  Large files may take several minutes to complete.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {progress === 100 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-green-800">Upload Complete!</h4>
                <p className="mt-1 text-sm text-green-700">
                  Your video has been successfully uploaded and is now being processed.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};






