'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface FileUploadProps {
  onFileUpload: (file: UploadedFile) => void;
  onError?: (error: string) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in bytes
  category?: string;
  description?: string;
  isPublic?: boolean;
  week?: number;
  module?: string;
  uploadEndpoint: string; // e.g., '/api/courses/123/files' or '/api/assignments/456/files'
  className?: string;
  multiple?: boolean;
}

export interface UploadedFile {
  fileId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
  category: string;
  isPublic: boolean;
  week?: number;
  module?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  onError,
  acceptedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'text/plain'
  ],
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  category = 'resource',
  description = '',
  isPublic = true,
  week,
  module,
  uploadEndpoint,
  className = '',
  multiple = false
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Allowed types: ${acceptedTypes.join(', ')}`;
    }

    if (file.size > maxFileSize) {
      return `File size (${formatFileSize(file.size)}) exceeds the maximum allowed size of ${formatFileSize(maxFileSize)}`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('uploadedBy', user.id);
    formData.append('isPublic', isPublic.toString());
    
    if (week !== undefined) {
      formData.append('week', week.toString());
    }
    
    if (module) {
      formData.append('module', module);
    }

    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    return result.data;
  };

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (!files.length) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const filesToUpload = Array.from(files);
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        
        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
          onError?.(validationError);
          continue;
        }

        // Upload file
        try {
          const uploadedFile = await uploadFile(file);
          onFileUpload(uploadedFile);
          
          // Update progress
          setUploadProgress(((i + 1) / filesToUpload.length) * 100);
        } catch (uploadError) {
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Upload failed';
          onError?.(`Failed to upload ${file.name}: ${errorMessage}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onError?.(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [acceptedTypes, maxFileSize, category, description, isPublic, week, module, uploadEndpoint, user?.id, onFileUpload, onError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`file-upload ${className}`}>
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {isUploading ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Uploading files...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">{Math.round(uploadProgress)}% complete</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className={`
                p-3 rounded-full transition-colors duration-200
                ${isDragOver ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
              `}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className={`
                text-lg font-medium transition-colors duration-200
                ${isDragOver ? 'text-blue-600' : 'text-gray-900'}
              `}>
                {isDragOver ? 'Drop files here' : 'Upload Files'}
              </h3>
              <p className="text-sm text-gray-500">
                Click to browse or drag and drop files
              </p>
              <p className="text-xs text-gray-400">
                Max size: {formatFileSize(maxFileSize)} • {multiple ? 'Multiple files allowed' : 'Single file only'}
              </p>
            </div>

            <button
              type="button"
              className={`
                inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors duration-200
                ${isDragOver
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
                }
              `}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Choose Files
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        multiple={multiple}
        className="hidden"
      />

      {/* File type info */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500">
          Supported formats: {acceptedTypes.map(type => {
            const extension = type.split('/')[1];
            return extension.toUpperCase();
          }).join(', ')}
        </p>
      </div>
    </div>
  );
};

export default FileUpload;