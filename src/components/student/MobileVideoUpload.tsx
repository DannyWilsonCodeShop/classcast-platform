'use client';

import React, { useState, useCallback, useRef } from 'react';
import { resolveMimeType, getFallbackMimeType } from '@/lib/fileTypeUtils';

export interface MobileVideoUploadProps {
  onFileSelect: (file: File) => void;
  allowedTypes: string[];
  maxFileSize: number;
  className?: string;
}

/**
 * Mobile-optimized video upload component
 * Handles mobile browser quirks and file API limitations
 */
export const MobileVideoUpload: React.FC<MobileVideoUploadProps> = ({
  onFileSelect,
  allowedTypes,
  maxFileSize,
  className = '',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateMobileFile = (file: File): { isValid: boolean; error?: string; resolvedType?: string } => {
    console.log('🔍 Mobile file validation:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      lastModified: file?.lastModified,
      hasSize: typeof file?.size,
      hasType: typeof file?.type,
      hasName: typeof file?.name
    });

    // Check if file object exists
    if (!file) {
      return { isValid: false, error: 'No file selected' };
    }

    // Check if file has required properties (mobile browsers can be inconsistent)
    if (typeof file.size !== 'number') {
      return { isValid: false, error: 'File size information unavailable (mobile browser issue)' };
    }

    if (typeof file.type !== 'string') {
      return { isValid: false, error: 'File type information unavailable (mobile browser issue)' };
    }

    if (!file.name || typeof file.name !== 'string') {
      return { isValid: false, error: 'File name information unavailable (mobile browser issue)' };
    }

    // Check file size
    if (file.size > maxFileSize) {
      return { 
        isValid: false, 
        error: `File size (${formatFileSize(file.size)}) exceeds limit of ${formatFileSize(maxFileSize)}` 
      };
    }

    const { canonicalType, detectedType, isAllowed, resolutionLog } = resolveMimeType(file, allowedTypes);
    console.log('📱 Mobile file MIME resolution:', { canonicalType, detectedType, isAllowed, resolutionLog });

    if (!isAllowed) {
      return {
        isValid: false,
        error: `File type ${detectedType || getFallbackMimeType()} is not supported. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    const resolvedType = canonicalType || detectedType || getFallbackMimeType();

    // Additional mobile-specific checks
    if (file.size === 0) {
      return { isValid: false, error: 'File appears to be empty' };
    }

    return { isValid: true, resolvedType };
  };

  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsProcessing(true);
    
    try {
      const files = e.target.files;
      
      if (!files || files.length === 0) {
        console.log('📱 No files selected on mobile');
        return;
      }

      const file = files[0]; // Take the first file
      
      console.log('📱 Mobile file selected:', {
        name: file?.name,
        size: file?.size,
        type: file?.type,
        constructor: file?.constructor?.name
      });

      // Wait a bit for mobile browsers to fully load file properties
      await new Promise(resolve => setTimeout(resolve, 100));

      const validation = validateMobileFile(file);
      
      if (!validation.isValid) {
        console.error('📱 Mobile file validation failed:', validation.error);
        alert(`Upload Error: ${validation.error}`);
        return;
      }

      console.log('✅ Mobile file validation passed, calling onFileSelect');
      onFileSelect(file);

    } catch (error) {
      console.error('📱 Mobile file selection error:', error);
      alert('Error selecting file. Please try again.');
    } finally {
      setIsProcessing(false);
      
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [allowedTypes, maxFileSize, onFileSelect]);

  const handleClick = useCallback(() => {
    if (isProcessing) return;
    fileInputRef.current?.click();
  }, [isProcessing]);

  const getAcceptString = (): string => {
    // Mobile browsers work better with file extensions
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
    <div className={`mobile-video-upload ${className}`}>
      {/* Mobile-optimized upload button */}
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div className="space-y-4">
          {/* Mobile Upload Icon */}
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

          {/* Upload Text */}
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

          {/* Mobile Upload Button */}
          <button
            type="button"
            onClick={handleClick}
            disabled={isProcessing}
            className={`
              inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white
              ${isProcessing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }
              transition-colors duration-200 touch-manipulation
            `}
            style={{ minHeight: '48px' }} // Ensure touch-friendly size
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Choose Video File
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hidden File Input - Mobile Optimized */}
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptString()}
        onChange={handleFileInputChange}
        className="hidden"
        // Mobile-specific attributes
        capture="environment" // Prefer rear camera for video recording
        multiple={false}
      />

      {/* Mobile-specific help text */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          📱 Mobile Tip: You can record a new video or select from your gallery
        </p>
        <p className="text-xs text-gray-400">
          Supported: MP4, MOV, AVI, WebM
        </p>
      </div>
    </div>
  );
};