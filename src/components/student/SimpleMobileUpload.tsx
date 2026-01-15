'use client';

import React, { useState, useRef } from 'react';

interface SimpleMobileUploadProps {
  onFileSelect: (file: File) => void;
  maxFileSize?: number;
  className?: string;
}

/**
 * Simple, reliable mobile file upload component
 * Focuses on core functionality without complex validation
 */
export const SimpleMobileUpload: React.FC<SimpleMobileUploadProps> = ({
  onFileSelect,
  maxFileSize = 2 * 1024 * 1024 * 1024, // 2GB default
  className = '',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setIsProcessing(true);

    try {
      const files = e.target.files;
      if (!files || files.length === 0) {
        setIsProcessing(false);
        return;
      }

      const file = files[0];
      
      // Basic validation
      if (!file) {
        throw new Error('No file selected');
      }

      if (file.size > maxFileSize) {
        throw new Error(`File size (${formatFileSize(file.size)}) exceeds limit of ${formatFileSize(maxFileSize)}`);
      }

      // Simple file type check
      const fileName = file.name.toLowerCase();
      const validExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
      const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
      
      if (!hasValidExtension) {
        throw new Error('Please select a video file (MP4, MOV, AVI, WebM, MKV, M4V)');
      }

      // Wait a moment for mobile browsers to fully process the file
      await new Promise(resolve => setTimeout(resolve, 200));

      console.log('📱 Mobile upload - File selected:', {
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || 'unknown',
        lastModified: new Date(file.lastModified).toISOString()
      });

      onFileSelect(file);

    } catch (error) {
      console.error('📱 Mobile upload error:', error);
      setError(error instanceof Error ? error.message : 'File selection failed');
    } finally {
      setIsProcessing(false);
      // Reset input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    if (isProcessing) return;
    fileInputRef.current?.click();
  };

  return (
    <div className={`mobile-upload-container ${className}`}>
      {/* Simple Upload Button */}
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
        <div className="space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              📱 Upload Video File
            </h3>
            <p className="text-gray-600 mb-4">
              Select a video from your device or record a new one
            </p>
            <p className="text-sm text-gray-500">
              Max size: {formatFileSize(maxFileSize)}
            </p>
          </div>

          {/* Upload Button */}
          <button
            type="button"
            onClick={handleButtonClick}
            disabled={isProcessing}
            className={`
              w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200
              ${isProcessing 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-lg hover:shadow-xl'
              }
            `}
            style={{ minHeight: '56px' }} // Touch-friendly size
          >
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Choose Video File</span>
              </div>
            )}
          </button>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Input - Mobile Optimized */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.mov,.avi,.webm,.mkv,.m4v"
        onChange={handleFileChange}
        className="hidden"
        capture="environment" // Prefer rear camera on mobile
      />

      {/* Help Text */}
      <div className="mt-4 text-center space-y-2">
        <p className="text-sm text-gray-600">
          📱 Tap the button above to select or record a video
        </p>
        <p className="text-xs text-gray-500">
          Supported: MP4, MOV, AVI, WebM, MKV, M4V
        </p>
      </div>
    </div>
  );
};