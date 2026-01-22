'use client';

import React, { useState, useCallback, useRef } from 'react';
import { EnhancedUploadFeedback } from './EnhancedUploadFeedback';
import { useEnhancedUploadState } from '@/hooks/useEnhancedUploadState';
import { resolveMimeType, getFallbackMimeType } from '@/lib/fileTypeUtils';

export interface EnhancedMobileUploadProps {
  onFileSelect: (file: File) => Promise<any>;
  allowedTypes: string[];
  maxFileSize: number;
  assignmentId: string;
  courseId: string;
  onUploadComplete?: (result: any) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export const EnhancedMobileUpload: React.FC<EnhancedMobileUploadProps> = ({
  onFileSelect,
  allowedTypes,
  maxFileSize,
  assignmentId,
  courseId,
  onUploadComplete,
  onUploadError,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    uploadState,
    uploadWithRetry,
    cancel,
    reset,
    canRetry,
  } = useEnhancedUploadState({
    maxRetries: 3,
    retryDelay: 2000,
    onComplete: (result) => {
      onUploadComplete?.(result);
      // Auto-reset after 5 seconds
      setTimeout(() => {
        reset();
        setSelectedFile(null);
      }, 5000);
    },
    onError: (error) => {
      onUploadError?.(error);
    },
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    console.log('📱 Enhanced mobile file validation:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
    });

    if (!file) {
      return { isValid: false, error: 'No file selected' };
    }

    if (typeof file.size !== 'number' || file.size === undefined) {
      return { isValid: false, error: 'File size information unavailable' };
    }

    if (!file.name || typeof file.name !== 'string') {
      return { isValid: false, error: 'File name information unavailable' };
    }

    if (file.size > maxFileSize) {
      return { 
        isValid: false, 
        error: `File size (${formatFileSize(file.size)}) exceeds limit of ${formatFileSize(maxFileSize)}` 
      };
    }

    if (file.size === 0) {
      return { isValid: false, error: 'File appears to be empty' };
    }

    const { isAllowed, detectedType } = resolveMimeType(file, allowedTypes);
    
    if (!isAllowed) {
      return {
        isValid: false,
        error: `File type ${detectedType || 'unknown'} is not supported. Allowed: ${allowedTypes.join(', ')}`,
      };
    }

    return { isValid: true };
  }, [allowedTypes, maxFileSize]);

  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    setValidationError(null);
    
    // Wait for mobile browsers to load file properties
    await new Promise(resolve => setTimeout(resolve, 100));

    const validation = validateFile(file);
    
    if (!validation.isValid) {
      setValidationError(validation.error || 'File validation failed');
      return;
    }

    setSelectedFile(file);
  }, [validateFile]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      await uploadWithRetry(selectedFile, async (file, onProgress, signal) => {
        // Create a mock XMLHttpRequest-like upload with progress
        return new Promise((resolve, reject) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('assignmentId', assignmentId);
          formData.append('courseId', courseId);

          const xhr = new XMLHttpRequest();
          
          // Handle abort signal
          signal.addEventListener('abort', () => {
            xhr.abort();
            reject(new Error('Upload cancelled'));
          });

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = (event.loaded / event.total) * 100;
              onProgress(progress, event.loaded);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const result = JSON.parse(xhr.responseText);
                resolve(result);
              } catch (error) {
                resolve({ success: true, message: 'Upload completed' });
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
          });

          xhr.addEventListener('timeout', () => {
            reject(new Error('Upload timed out'));
          });

          // Set timeout for large files
          xhr.timeout = 300000; // 5 minutes

          xhr.open('POST', '/api/upload');
          xhr.send(formData);
        });
      });
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }, [selectedFile, assignmentId, courseId, uploadWithRetry]);

  const handleRetry = useCallback(() => {
    if (selectedFile && canRetry) {
      handleUpload();
    }
  }, [selectedFile, canRetry, handleUpload]);

  const handleCancel = useCallback(() => {
    cancel();
    setSelectedFile(null);
    setValidationError(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [cancel]);

  const handleSelectNewFile = useCallback(() => {
    reset();
    setSelectedFile(null);
    setValidationError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, [reset]);

  const getAcceptString = (): string => {
    const extensions = allowedTypes.map(type => {
      switch (type) {
        case 'video/mp4': return '.mp4';
        case 'video/quicktime': return '.mov';
        case 'video/x-msvideo': return '.avi';
        case 'video/webm': return '.webm';
        case 'video/ogg': return '.ogv';
        default: return type;
      }
    });
    return [...allowedTypes, ...extensions].join(',');
  };

  return (
    <div className={`enhanced-mobile-upload space-y-6 ${className}`}>
      {/* File Selection Area */}
      {!selectedFile && uploadState.stage === 'idle' && (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">
                📱 Select Video from Device
              </h3>
              <p className="text-sm text-gray-500">
                Tap to choose a video file from your device
              </p>
              <p className="text-xs text-gray-400">
                Max size: {formatFileSize(maxFileSize)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 touch-manipulation"
              style={{ minHeight: '48px' }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Choose Video File
            </button>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-red-500 text-xl">⚠️</div>
            <div>
              <h4 className="text-sm font-medium text-red-800">File Validation Error</h4>
              <p className="mt-1 text-sm text-red-700">{validationError}</p>
              <button
                onClick={handleSelectNewFile}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Select a different file
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Selected - Ready to Upload */}
      {selectedFile && uploadState.stage === 'idle' && !validationError && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🎥</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleUpload}
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              📤 Start Upload
            </button>
            <button
              onClick={handleSelectNewFile}
              className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Change File
            </button>
          </div>
        </div>
      )}

      {/* Upload Feedback */}
      {uploadState.stage !== 'idle' && (
        <EnhancedUploadFeedback
          status={uploadState}
          onRetry={handleRetry}
          onCancel={handleCancel}
        />
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptString()}
        onChange={handleFileInputChange}
        className="hidden"
        capture="environment"
        multiple={false}
      />

      {/* Mobile Tips */}
      <div className="text-center space-y-2">
        <p className="text-xs text-gray-500">
          📱 Mobile Tip: You can record a new video or select from your gallery
        </p>
        <p className="text-xs text-gray-400">
          Supported: MP4, MOV, AVI, WebM • Max: {formatFileSize(maxFileSize)}
        </p>
        {uploadState.stage === 'uploading' && (
          <p className="text-xs text-blue-600 font-medium">
            ⚠️ Keep this page open until upload completes
          </p>
        )}
      </div>
    </div>
  );
};