'use client';

import React, { useState } from 'react';
import { SimpleMobileUpload } from './SimpleMobileUpload';
import { useMobileUpload } from '@/hooks/useMobileUpload';

interface MobileAssignmentUploadProps {
  assignmentId: string;
  courseId: string;
  assignmentTitle: string;
  maxFileSize?: number;
  onUploadComplete?: (submissionId: string) => void;
  onCancel?: () => void;
}

export const MobileAssignmentUpload: React.FC<MobileAssignmentUploadProps> = ({
  assignmentId,
  courseId,
  assignmentTitle,
  maxFileSize = 2 * 1024 * 1024 * 1024, // 2GB
  onUploadComplete,
  onCancel
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const { uploadFile, isUploading, progress, error } = useMobileUpload({
    assignmentId,
    courseId,
    onSuccess: (result) => {
      console.log('📱 Upload completed successfully:', result);
      setUploadStatus('success');
      if (result.data?.submissionId) {
        onUploadComplete?.(result.data.submissionId);
      }
    },
    onError: (error) => {
      console.error('📱 Upload failed:', error);
      setUploadStatus('error');
    }
  });

  const handleFileSelect = (file: File) => {
    console.log('📱 File selected for assignment upload:', {
      assignment: assignmentTitle,
      file: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    });
    
    setSelectedFile(file);
    setUploadStatus('uploading');
    uploadFile(file);
  };

  const handleRetry = () => {
    setUploadStatus('idle');
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  return (
    <div className="mobile-assignment-upload">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              Submit Assignment
            </h2>
            <p className="text-sm text-gray-600 truncate">
              {assignmentTitle}
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="ml-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Upload Status */}
        {uploadStatus === 'idle' && (
          <SimpleMobileUpload
            onFileSelect={handleFileSelect}
            maxFileSize={maxFileSize}
          />
        )}

        {uploadStatus === 'uploading' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Uploading Video</h3>
                <p className="text-gray-600 mt-1">
                  {selectedFile?.name}
                </p>
                {selectedFile && (
                  <p className="text-sm text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <p className="text-sm font-medium text-blue-600">
                {progress}% uploaded
              </p>

              <p className="text-xs text-gray-500">
                Please keep this page open while uploading
              </p>
            </div>
          </div>
        )}

        {uploadStatus === 'success' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-green-900">Upload Complete!</h3>
                <p className="text-green-700 mt-1">
                  Your video has been submitted successfully
                </p>
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => window.history.back()}
                  className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Back to Assignment
                </button>
                
                <button
                  onClick={handleRetry}
                  className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Submit Another Video
                </button>
              </div>
            </div>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="bg-white rounded-xl border border-red-200 p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-red-900">Upload Failed</h3>
                <p className="text-red-700 mt-1">
                  {error || 'Something went wrong during upload'}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="w-full py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
                
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Tips */}
        <div className="bg-blue-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            📱 Mobile Upload Tips
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Keep your device connected to WiFi for faster uploads</li>
            <li>• Don't close this page while uploading</li>
            <li>• Make sure your device has enough battery</li>
            <li>• Video files up to {formatFileSize(maxFileSize)} are supported</li>
          </ul>
        </div>
      </div>
    </div>
  );
};