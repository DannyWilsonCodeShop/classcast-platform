'use client';

import React, { useState, useCallback, useRef } from 'react';

export interface VideoUploadZoneProps {
  onFileSelect: (file: File) => void;
  allowedTypes: string[];
  maxFileSize: number;
  className?: string;
}

export const VideoUploadZone: React.FC<VideoUploadZoneProps> = ({
  onFileSelect,
  allowedTypes,
  maxFileSize,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter === 1) {
      setIsDragOver(false);
    }
  }, [dragCounter]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    
    console.log('📁 Files dropped:', {
      fileCount: files.length,
      files: files.map(f => ({
        name: f?.name,
        size: f?.size,
        type: f?.type,
        hasSize: typeof f?.size,
        hasType: typeof f?.type
      }))
    });

    if (files.length === 0) {
      console.warn('⚠️ No files dropped');
      return;
    }

    // Add delay for browsers to fully load file properties
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // File validation for drag/drop
    const videoFile = files.find(file => {
      if (!file) {
        console.warn('❌ Empty file in dropped array');
        return false;
      }
      
      // Check if file has required properties
      if (typeof file.size !== 'number' || file.size === undefined || file.size === null || isNaN(file.size)) {
        console.warn('❌ Drag/drop file API issue - invalid size property:', {
          hasSize: typeof file.size,
          sizeValue: file.size,
          isNaN: isNaN(file.size),
          fileName: file.name,
          fileType: file.type,
          constructor: file?.constructor?.name,
          isFileInstance: file instanceof File
        });
        return false;
      }
      
      if (typeof file.type !== 'string' || !file.type) {
        console.warn('❌ Drag/drop file API issue - invalid type property:', {
          hasType: typeof file.type,
          typeValue: file.type,
          fileName: file.name
        });
        return false;
      }
      
      if (!allowedTypes.includes(file.type)) {
        console.warn('❌ Dropped file type not allowed:', {
          fileType: file.type,
          allowedTypes,
          fileName: file.name
        });
        return false;
      }
      
      return true;
    });

    if (videoFile) {
      // Final validation before passing to parent
      if (typeof videoFile.size !== 'number' || videoFile.size <= 0) {
        console.error('❌ Dropped file has invalid size before passing to parent:', {
          file: videoFile,
          sizeType: typeof videoFile.size,
          sizeValue: videoFile.size
        });
        alert('Dropped file appears to be corrupted or empty. Please try dropping the file again.');
        return;
      }
      console.log('✅ Valid video file dropped:', {
        name: videoFile.name,
        size: `${(videoFile.size / (1024 * 1024)).toFixed(2)}MB`,
        type: videoFile.type
      });
      // Add a small delay to ensure file is fully loaded
      setTimeout(() => {
        onFileSelect(videoFile);
      }, 50);
    } else {
      console.error('❌ No valid video file found in dropped files');
      alert('Please drop a valid video file. Supported formats: ' + allowedTypes.join(', '));
    }
  }, [allowedTypes, onFileSelect]);

  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    console.log('📁 File input change detected:', {
      fileCount: files.length,
      files: files.map(f => ({
        name: f?.name,
        size: f?.size,
        type: f?.type,
        hasSize: typeof f?.size,
        hasType: typeof f?.type
      }))
    });
    
    if (files.length === 0) {
      console.warn('⚠️ No files selected');
      return;
    }

    // Add delay for mobile browsers to fully load file properties
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mobile-specific file validation
    const videoFile = files.find(file => {
      if (!file) {
        console.warn('❌ Empty file in array');
        return false;
      }
      
      // Check if file has required properties (mobile browsers sometimes have issues)
      if (typeof file.size !== 'number' || file.size === undefined || file.size === null || isNaN(file.size)) {
        console.warn('❌ File API issue - invalid size property:', {
          hasSize: typeof file.size,
          sizeValue: file.size,
          isNaN: isNaN(file.size),
          fileName: file.name,
          fileType: file.type,
          constructor: file?.constructor?.name,
          isFileInstance: file instanceof File
        });
        return false;
      }
      
      if (typeof file.type !== 'string' || !file.type) {
        console.warn('❌ File API issue - invalid type property:', {
          hasType: typeof file.type,
          typeValue: file.type,
          fileName: file.name
        });
        return false;
      }
      
      if (!allowedTypes.includes(file.type)) {
        console.warn('❌ File type not allowed:', {
          fileType: file.type,
          allowedTypes,
          fileName: file.name
        });
        return false;
      }
      
      return true;
    });

    if (videoFile) {
      // Final validation before passing to parent
      if (typeof videoFile.size !== 'number' || videoFile.size <= 0) {
        console.error('❌ File has invalid size before passing to parent:', {
          file: videoFile,
          sizeType: typeof videoFile.size,
          sizeValue: videoFile.size
        });
        alert('File appears to be corrupted or empty. Please try selecting the file again.');
        return;
      }
      console.log('✅ Valid video file selected:', {
        name: videoFile.name,
        size: `${(videoFile.size / (1024 * 1024)).toFixed(2)}MB`,
        type: videoFile.type,
        lastModified: new Date(videoFile.lastModified).toISOString()
      });
      // Add a small delay to ensure file is fully loaded
      setTimeout(() => {
        onFileSelect(videoFile);
      }, 50);
    } else {
      console.error('❌ No valid video file found in selection');
      alert('Please select a valid video file. Supported formats: ' + allowedTypes.join(', '));
    }

    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [allowedTypes, onFileSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeExtensions = (): string => {
    return allowedTypes
      .map(type => type.split('/')[1])
      .filter(Boolean)
      .map(ext => ext.toUpperCase())
      .join(', ');
  };

  return (
    <div
      className={`relative ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
          ${isDragOver
            ? 'border-blue-500 bg-blue-50 scale-105'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
        onClick={handleClick}
      >
        <div className="space-y-4">
          {/* Upload Icon */}
          <div className="flex justify-center">
            <div className={`
              p-4 rounded-full transition-colors duration-200
              ${isDragOver ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
            `}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
          </div>

          {/* Upload Text */}
          <div className="space-y-2">
            <h3 className={`
              text-lg font-medium transition-colors duration-200
              ${isDragOver ? 'text-blue-600' : 'text-gray-900'}
            `}>
              {isDragOver ? 'Drop your video here' : 'Click to upload or drag and drop'}
            </h3>
            <p className="text-sm text-gray-500">
              {getFileTypeExtensions()} files up to {formatFileSize(maxFileSize)}
            </p>
          </div>

          {/* Upload Button */}
          <button
            type="button"
            className={`
              inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors duration-200
              ${isDragOver
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-600 text-white hover:bg-gray-700'
              }
            `}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Choose Video File
          </button>
        </div>

        {/* Drag Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg pointer-events-none" />
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Help Text */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Supported formats: {getFileTypeExtensions()}
        </p>
        <p className="text-xs text-gray-500">
          Maximum file size: {formatFileSize(maxFileSize)}
        </p>
      </div>
    </div>
  );
};






