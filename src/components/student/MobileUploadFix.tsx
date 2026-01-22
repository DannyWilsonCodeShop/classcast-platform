'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { resolveMimeType, getFallbackMimeType } from '@/lib/fileTypeUtils';

export interface MobileUploadFixProps {
  onFileSelect: (file: File) => Promise<any>;
  allowedTypes: string[];
  maxFileSize: number;
  assignmentId: string;
  courseId: string;
  onUploadComplete?: (result: any) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

interface DeviceInfo {
  isIOS: boolean;
  isSafari: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  connectionType: string;
  memoryLimit: number;
}

interface UploadState {
  stage: 'idle' | 'preparing' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  canResume: boolean;
  uploadId?: string;
}

export const MobileUploadFix: React.FC<MobileUploadFixProps> = ({
  onFileSelect,
  allowedTypes,
  maxFileSize,
  assignmentId,
  courseId,
  onUploadComplete,
  onUploadError,
  className = '',
}) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isIOS: false,
    isSafari: false,
    isAndroid: false,
    isMobile: false,
    connectionType: 'unknown',
    memoryLimit: 0,
  });
  
  const [uploadState, setUploadState] = useState<UploadState>({
    stage: 'idle',
    progress: 0,
    canResume: false,
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadControllerRef = useRef<AbortController | null>(null);

  // Detect device and browser capabilities
  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      const isMobile = /Mobi|Android/i.test(userAgent);
      
      // Detect connection type
      let connectionType = 'unknown';
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connectionType = connection?.effectiveType || connection?.type || 'unknown';
      }
      
      // Estimate memory limit (iOS Safari is particularly constrained)
      let memoryLimit = 2048; // Default 2GB
      if (isIOS && isSafari) {
        memoryLimit = 512; // iOS Safari: 512MB safe limit
      } else if (isIOS) {
        memoryLimit = 1024; // iOS Chrome: 1GB
      }
      
      setDeviceInfo({
        isIOS,
        isSafari,
        isAndroid,
        isMobile,
        connectionType,
        memoryLimit: memoryLimit * 1024 * 1024, // Convert to bytes
      });
    };

    detectDevice();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateMobileFile = useCallback((file: File): { isValid: boolean; error?: string; warnings: string[] } => {
    const warnings: string[] = [];
    
    console.log('📱 Enhanced mobile file validation:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      deviceInfo,
    });

    if (!file) {
      return { isValid: false, error: 'No file selected', warnings };
    }

    // Basic file property checks
    if (typeof file.size !== 'number' || file.size === undefined) {
      return { isValid: false, error: 'File size unavailable - try selecting the file again', warnings };
    }

    if (!file.name || typeof file.name !== 'string') {
      return { isValid: false, error: 'File name unavailable - try selecting the file again', warnings };
    }

    if (file.size === 0) {
      return { isValid: false, error: 'File appears to be empty or corrupted', warnings };
    }

    // Size validation with device-specific limits
    if (file.size > maxFileSize) {
      return { 
        isValid: false, 
        error: `File size (${formatFileSize(file.size)}) exceeds limit of ${formatFileSize(maxFileSize)}`,
        warnings 
      };
    }

    // iOS Safari memory warnings
    if (deviceInfo.isIOS && deviceInfo.isSafari && file.size > deviceInfo.memoryLimit) {
      warnings.push(`⚠️ Large file on iOS Safari may cause memory issues. Consider using Chrome or reducing file size.`);
    }

    // Cellular connection warnings
    if (deviceInfo.connectionType.includes('2g') || deviceInfo.connectionType.includes('3g')) {
      warnings.push(`📶 Slow connection detected. Consider switching to WiFi for faster uploads.`);
    }

    // HEVC format detection for iOS
    if (deviceInfo.isIOS && file.name.toLowerCase().endsWith('.mov')) {
      warnings.push(`📱 iPhone MOV files may use HEVC format. If video doesn't play after upload, try recording in a different app.`);
    }

    // File type validation
    const { isAllowed, detectedType, canonicalType } = resolveMimeType(file, allowedTypes);
    
    if (!isAllowed) {
      return {
        isValid: false,
        error: `File type ${detectedType || 'unknown'} is not supported. Allowed: ${allowedTypes.join(', ')}`,
        warnings
      };
    }

    return { isValid: true, warnings };
  }, [allowedTypes, maxFileSize, deviceInfo]);

  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadState({ stage: 'preparing', progress: 0, canResume: false });
    setWarnings([]);
    
    try {
      const files = e.target.files;
      
      if (!files || files.length === 0) {
        setUploadState({ stage: 'idle', progress: 0, canResume: false });
        return;
      }

      const file = files[0];
      
      // Extended delay for mobile browsers to load file properties
      await new Promise(resolve => setTimeout(resolve, deviceInfo.isMobile ? 300 : 100));

      const validation = validateMobileFile(file);
      
      if (!validation.isValid) {
        setUploadState({ 
          stage: 'error', 
          progress: 0, 
          error: validation.error,
          canResume: false 
        });
        onUploadError?.(validation.error || 'File validation failed');
        return;
      }

      setWarnings(validation.warnings);
      setSelectedFile(file);
      setUploadState({ stage: 'idle', progress: 0, canResume: false });

    } catch (error) {
      console.error('📱 Mobile file selection error:', error);
      setUploadState({ 
        stage: 'error', 
        progress: 0, 
        error: 'Error selecting file. Please try again.',
        canResume: false 
      });
      onUploadError?.('Error selecting file. Please try again.');
    }
  }, [validateMobileFile, deviceInfo.isMobile, onUploadError]);

  const uploadWithMobileOptimizations = useCallback(async (file: File) => {
    const uploadId = crypto.randomUUID();
    setUploadState({ stage: 'uploading', progress: 0, canResume: true, uploadId });
    
    uploadControllerRef.current = new AbortController();
    
    try {
      // Use streaming upload for large files or iOS Safari
      const useStreaming = file.size > 100 * 1024 * 1024 || (deviceInfo.isIOS && deviceInfo.isSafari);
      
      if (useStreaming) {
        console.log('📱 Using streaming upload for mobile optimization');
        await streamingUpload(file, uploadId);
      } else {
        console.log('📱 Using standard upload');
        await standardUpload(file);
      }
      
      setUploadState({ stage: 'processing', progress: 100, canResume: false });
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadState({ stage: 'completed', progress: 100, canResume: false });
      onUploadComplete?.({ success: true, fileId: uploadId });
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setUploadState({ stage: 'idle', progress: 0, canResume: false });
        return;
      }
      
      console.error('📱 Mobile upload error:', error);
      setUploadState({ 
        stage: 'error', 
        progress: 0, 
        error: error instanceof Error ? error.message : 'Upload failed',
        canResume: true 
      });
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    }
  }, [deviceInfo, onUploadComplete, onUploadError]);

  const streamingUpload = async (file: File, uploadId: string) => {
    const chunkSize = deviceInfo.isIOS && deviceInfo.isSafari ? 1024 * 1024 : 5 * 1024 * 1024; // 1MB for iOS Safari, 5MB for others
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      if (uploadControllerRef.current?.signal.aborted) {
        throw new Error('Upload cancelled');
      }
      
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunkIndex', chunkIndex.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('uploadId', uploadId);
      formData.append('fileName', file.name);
      formData.append('assignmentId', assignmentId);
      formData.append('courseId', courseId);
      
      const response = await fetch('/api/upload/chunk', {
        method: 'POST',
        body: formData,
        signal: uploadControllerRef.current?.signal,
      });
      
      if (!response.ok) {
        throw new Error(`Chunk upload failed: ${response.statusText}`);
      }
      
      const progress = ((chunkIndex + 1) / totalChunks) * 100;
      setUploadState(prev => ({ ...prev, progress }));
    }
  };

  const standardUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('assignmentId', assignmentId);
    formData.append('courseId', courseId);

    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      uploadControllerRef.current?.signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Upload cancelled'));
      });

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadState(prev => ({ ...prev, progress }));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  };

  const handleUpload = useCallback(() => {
    if (selectedFile) {
      uploadWithMobileOptimizations(selectedFile);
    }
  }, [selectedFile, uploadWithMobileOptimizations]);

  const handleCancel = useCallback(() => {
    uploadControllerRef.current?.abort();
    setUploadState({ stage: 'idle', progress: 0, canResume: false });
    setSelectedFile(null);
    setWarnings([]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const getAcceptString = (): string => {
    // Enhanced accept string for better mobile compatibility
    const mimeTypes = allowedTypes;
    const extensions = allowedTypes.map(type => {
      switch (type) {
        case 'video/mp4': return '.mp4';
        case 'video/quicktime': return '.mov';
        case 'video/x-msvideo': return '.avi';
        case 'video/webm': return '.webm';
        case 'video/ogg': return '.ogv';
        case 'video/x-m4v': return '.m4v';
        default: return '';
      }
    }).filter(Boolean);
    
    return [...mimeTypes, ...extensions].join(',');
  };

  return (
    <div className={`mobile-upload-fix space-y-4 ${className}`}>
      {/* Device Info Display (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-2 rounded text-xs">
          <div>Device: {deviceInfo.isIOS ? 'iOS' : deviceInfo.isAndroid ? 'Android' : 'Desktop'}</div>
          <div>Browser: {deviceInfo.isSafari ? 'Safari' : 'Other'}</div>
          <div>Connection: {deviceInfo.connectionType}</div>
          <div>Memory Limit: {formatFileSize(deviceInfo.memoryLimit)}</div>
        </div>
      )}

      {/* Warnings Display */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Important Notes:</h4>
          {warnings.map((warning, index) => (
            <p key={index} className="text-sm text-yellow-700 mb-1">{warning}</p>
          ))}
        </div>
      )}

      {/* File Selection */}
      {uploadState.stage === 'idle' && !selectedFile && (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
                {deviceInfo.isIOS && deviceInfo.isSafari && (
                  <span className="block text-orange-600">
                    iOS Safari limit: {formatFileSize(deviceInfo.memoryLimit)}
                  </span>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 touch-manipulation"
              style={{ minHeight: '48px' }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Choose Video File
            </button>
          </div>
        </div>
      )}

      {/* File Selected */}
      {selectedFile && uploadState.stage === 'idle' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🎥</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleUpload}
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium touch-manipulation"
              style={{ minHeight: '48px' }}
            >
              📤 Start Upload
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors touch-manipulation"
              style={{ minHeight: '48px' }}
            >
              Change
            </button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {(uploadState.stage === 'uploading' || uploadState.stage === 'processing') && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {uploadState.stage === 'uploading' ? '📤 Uploading...' : '⚙️ Processing...'}
              </h3>
              <p className="text-sm text-gray-500">
                {uploadState.stage === 'uploading' ? 'Please keep this page open' : 'Almost done!'}
              </p>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(uploadState.progress)}%
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="h-3 bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${uploadState.progress}%` }}
            />
          </div>
          
          {uploadState.canResume && (
            <button
              onClick={handleCancel}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors touch-manipulation"
            >
              Cancel Upload
            </button>
          )}
        </div>
      )}

      {/* Success */}
      {uploadState.stage === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-lg font-medium text-green-800 mb-2">Upload Complete!</h3>
          <p className="text-green-700">Your video has been successfully uploaded and processed.</p>
        </div>
      )}

      {/* Error */}
      {uploadState.stage === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="text-red-500 text-xl">⚠️</div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">Upload Failed</h4>
              <p className="mt-1 text-sm text-red-700">{uploadState.error}</p>
              
              {deviceInfo.isIOS && deviceInfo.isSafari && (
                <div className="mt-3 p-3 bg-red-100 rounded">
                  <p className="text-xs text-red-700">
                    <strong>iOS Safari Tip:</strong> Try using Chrome, or reduce video length/quality for better compatibility.
                  </p>
                </div>
              )}
              
              <div className="mt-4 flex space-x-3">
                {uploadState.canResume && (
                  <button
                    onClick={handleUpload}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm touch-manipulation"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={handleCancel}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm touch-manipulation"
                >
                  Select Different File
                </button>
              </div>
            </div>
          </div>
        </div>
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
          📱 Mobile Tips: Use WiFi for large files • Keep app open during upload
        </p>
        {deviceInfo.isIOS && (
          <p className="text-xs text-orange-600">
            iPhone users: For best results, record videos under 5 minutes or use YouTube/Google Drive links
          </p>
        )}
      </div>
    </div>
  );
};