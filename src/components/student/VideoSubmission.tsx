'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { VideoUploadZone } from './VideoUploadZone';
import { VideoPreview } from './VideoPreview';
import { VideoUploadProgress } from './VideoUploadProgress';
import { VideoValidationErrors } from './VideoValidationErrors';
import { LiveVideoRecorder } from './LiveVideoRecorder';
import LoadingSpinner from '../common/LoadingSpinner';
import ContentModerationChecker from '../common/ContentModerationChecker';
import { ContentModerationResult } from '@/lib/contentModeration';
import { LargeFileUploader } from '@/lib/largeFileUpload';
import { MobileVideoUpload } from './MobileVideoUpload';
import { isMobileDevice, logDeviceInfo } from '@/lib/deviceDetection';

export interface VideoSubmissionProps {
  assignmentId: string;
  courseId: string;
  onSubmissionComplete?: (submissionData: VideoSubmissionData) => void;
  onSubmissionError?: (error: string) => void;
  maxFileSize?: number;
  allowedVideoTypes?: string[];
  maxDuration?: number;
  showPreview?: boolean;
  enableLiveRecording?: boolean;
  assignmentRequirements?: string[];
  className?: string;
}

export interface VideoSubmissionData {
  submissionId: string;
  fileKey: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  duration: number;
  metadata: {
    assignmentId: string;
    courseId: string;
    studentId: string;
    uploadedAt: string;
    videoFormat: string;
    resolution?: string;
  };
}

export interface VideoFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  previewUrl?: string;
  duration?: number;
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
  };
}

export const VideoSubmission: React.FC<VideoSubmissionProps> = ({
  assignmentId,
  courseId,
  onSubmissionComplete,
  onSubmissionError,
  maxFileSize = 2048 * 1024 * 1024, // 2GB to match API limit
  allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'],
  maxDuration = 300,
  showPreview = true,
  enableLiveRecording = true,
  assignmentRequirements = [],
  className = '',
}) => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<VideoFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submissionData, setSubmissionData] = useState<VideoSubmissionData | null>(null);
  const [moderationResult, setModerationResult] = useState<ContentModerationResult | null>(null);
  const [isModerating, setIsModerating] = useState(false);
  const [recordingMode, setRecordingMode] = useState<'upload' | 'record'>('upload');
  const [isMobile, setIsMobile] = useState(false);

  const validateVideoFile = useCallback((file: File): string[] => {
    const errors: string[] = [];
    
    console.log('🔍 Validating video file:', {
      file: !!file,
      hasSize: file ? typeof file.size : 'no file',
      hasType: file ? typeof file.type : 'no file',
      hasName: file ? typeof file.name : 'no file',
      size: file?.size,
      type: file?.type,
      name: file?.name
    });
    
    // Check if file exists and has required properties
    if (!file) {
      errors.push('No file provided');
      return errors;
    }
    
    // More robust file validation with detailed error messages
    if (typeof file.size !== 'number' || file.size === undefined || file.size === null) {
      console.error('❌ File size validation failed:', {
        sizeType: typeof file.size,
        sizeValue: file.size,
        fileObject: file
      });
      errors.push('Invalid file: missing or invalid size information (browser compatibility issue)');
      return errors;
    }
    
    if (!file.type || typeof file.type !== 'string') {
      console.error('❌ File type validation failed:', {
        typeType: typeof file.type,
        typeValue: file.type,
        fileObject: file
      });
      errors.push('Invalid file: missing or invalid type information (browser compatibility issue)');
      return errors;
    }
    
    if (!file.name || typeof file.name !== 'string') {
      console.error('❌ File name validation failed:', {
        nameType: typeof file.name,
        nameValue: file.name,
        fileObject: file
      });
      errors.push('Invalid file: missing or invalid name information (browser compatibility issue)');
      return errors;
    }
    
    if (file.size > maxFileSize) {
      errors.push(`File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`);
    }
    
    if (!allowedVideoTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not supported`);
    }
    
    console.log('✅ File validation passed:', {
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      type: file.type
    });
    
    return errors;
  }, [maxFileSize, allowedVideoTypes]);

  const handleRecordingComplete = useCallback(async (blob: Blob) => {
    setValidationErrors([]);
    setSelectedFile(null);

    // Convert blob to file
    const file = new File([blob], `recording-${Date.now()}.webm`, {
      type: 'video/webm'
    });

    const errors = validateVideoFile(file);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const videoFile: VideoFile = {
      file,
      id: crypto.randomUUID(),
      status: 'pending',
      progress: 0,
    };

    if (showPreview) {
      videoFile.previewUrl = URL.createObjectURL(file);
    }

    try {
      const metadata = await extractVideoMetadata(file);
      videoFile.metadata = metadata;
      videoFile.duration = metadata.duration;
    } catch (error) {
      console.warn('Failed to extract video metadata:', error);
    }

    setSelectedFile(videoFile);
    
    // Start content moderation for the recorded video
    if (videoFile.previewUrl) {
      setIsModerating(true);
      try {
        const response = await fetch('/api/moderation/video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoUrl: videoFile.previewUrl,
            metadata: {
              title: file.name,
              duration: videoFile.duration || 0,
              description: `Video submission for assignment ${assignmentId}`
            },
            userId: user?.id,
            contentType: 'assignment_submission'
          }),
        });

        const data = await response.json();
        if (data.success) {
          setModerationResult(data.result);
        }
      } catch (error) {
        console.error('Content moderation failed:', error);
      } finally {
        setIsModerating(false);
      }
    }
  }, [validateVideoFile, showPreview, assignmentId, user?.id]);

  const handleFileSelect = useCallback(async (file: File) => {
    console.log('📁 File selected for upload:', {
      file: !!file,
      constructor: file?.constructor?.name,
      hasSize: file ? typeof file.size : 'no file',
      hasType: file ? typeof file.type : 'no file',
      hasName: file ? typeof file.name : 'no file'
    });

    setValidationErrors([]);
    setSelectedFile(null);

    // Check if file is valid
    if (!file) {
      console.error('❌ No file provided to handleFileSelect');
      setValidationErrors(['No file selected']);
      return;
    }

    // Add a small delay to ensure file properties are fully loaded (mobile browser fix)
    await new Promise(resolve => setTimeout(resolve, 100));

    const errors = validateVideoFile(file);
    if (errors.length > 0) {
      console.error('❌ File validation failed:', errors);
      setValidationErrors(errors);
      return;
    }

    const videoFile: VideoFile = {
      file,
      id: crypto.randomUUID(),
      status: 'pending',
      progress: 0,
    };

    if (showPreview) {
      videoFile.previewUrl = URL.createObjectURL(file);
    }

    try {
      const metadata = await extractVideoMetadata(file);
      videoFile.metadata = metadata;
      videoFile.duration = metadata.duration;
    } catch (error) {
      console.warn('Failed to extract video metadata:', error);
    }

    setSelectedFile(videoFile);
    
    // Start content moderation for the video
    if (videoFile.previewUrl) {
      setIsModerating(true);
      try {
        const response = await fetch('/api/moderation/video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoUrl: videoFile.previewUrl,
            metadata: {
              title: file.name,
              duration: videoFile.duration || 0,
              description: `Video submission for assignment ${assignmentId}`
            },
            userId: user?.id,
            contentType: 'assignment_submission'
          }),
        });

        const data = await response.json();
        if (data.success) {
          setModerationResult(data.result);
        }
      } catch (error) {
        console.error('Content moderation failed:', error);
      } finally {
        setIsModerating(false);
      }
    }
  }, [validateVideoFile, showPreview, assignmentId, user?.id]);

  const extractVideoMetadata = useCallback((file: File): Promise<{
    duration: number;
    width: number;
    height: number;
    format: string;
  }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        const metadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          format: file.type,
        };
        URL.revokeObjectURL(url);
        resolve(metadata);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video metadata'));
      };

      video.src = url;
    });
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      setSelectedFile(prev => prev ? { ...prev, status: 'uploading' } : null);

      const metadata = {
        assignmentId,
        courseId,
        studentId: user.userId,
        videoDuration: selectedFile.duration,
        videoResolution: selectedFile.metadata ? `${selectedFile.metadata.width}x${selectedFile.metadata.height}` : undefined,
        videoFormat: selectedFile.metadata?.format,
      };

      let result;

      // Use large file upload for files over 100MB
      if (LargeFileUploader.shouldUseLargeFileUpload(selectedFile.file)) {
        console.log(`📁 Using large file upload for ${LargeFileUploader.formatFileSize(selectedFile.file.size)} file`);
        
        result = await LargeFileUploader.uploadLargeFile({
          file: selectedFile.file,
          folder: 'video-submissions',
          userId: user.sub,
          metadata,
          onProgress: (progress) => {
            setUploadProgress(progress);
          },
        });

        // Convert to expected format
        result = {
          data: {
            fileUrl: result.fileUrl,
            fileName: result.fileName,
            fileSize: result.fileSize,
          }
        };
      } else {
        // Use regular upload for smaller files
        console.log(`📁 Using regular upload for ${LargeFileUploader.formatFileSize(selectedFile.file.size)} file`);
        
        const formData = new FormData();
        formData.append('file', selectedFile.file);
        formData.append('folder', 'video-submissions');
        formData.append('userId', user.sub);
        formData.append('metadata', JSON.stringify(metadata));

        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + Math.random() * 10;
          });
        }, 200);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        result = await response.json();
        setUploadProgress(100);
      }

      setSelectedFile(prev => prev ? { ...prev, status: 'processing' } : null);
      setIsProcessing(true);

      // Create submission record in database
      const submissionPayload = {
        assignmentId,
        studentId: user.id || user.sub,
        courseId,
        videoUrl: result.data.fileUrl,
        videoTitle: selectedFile.file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        videoDescription: `Video submission for assignment ${assignmentId}`,
        duration: selectedFile.duration || 0,
        fileName: result.data.fileName,
        fileSize: selectedFile.file.size,
        fileType: selectedFile.file.type,
        isUploaded: true,
        isRecorded: false,
        isLocalStorage: false,
      };

      console.log('Creating submission record:', submissionPayload);

      const submissionResponse = await fetch('/api/video-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionPayload),
      });

      if (!submissionResponse.ok) {
        const errorData = await submissionResponse.json();
        console.error('Failed to create submission record:', errorData);
        throw new Error(errorData.error || 'Failed to create submission record');
      }

      const submissionResult = await submissionResponse.json();
      console.log('Submission record created:', submissionResult);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const submissionData: VideoSubmissionData = {
        submissionId: submissionResult.submission.submissionId,
        fileKey: result.data.fileKey,
        fileUrl: result.data.fileUrl,
        fileName: result.data.fileName,
        fileSize: result.data.fileSize,
        duration: selectedFile.duration || 0,
        metadata: {
          assignmentId,
          courseId,
          studentId: user.id || user.sub,
          uploadedAt: submissionResult.submission.submittedAt,
          videoFormat: selectedFile.metadata?.format || 'unknown',
          resolution: selectedFile.metadata ? `${selectedFile.metadata.width}x${selectedFile.metadata.height}` : undefined,
        },
      };

      setSubmissionData(submissionData);
      setSelectedFile(prev => prev ? { ...prev, status: 'completed' } : null);
      setIsProcessing(false);

      onSubmissionComplete?.(submissionData);

    } catch (error) {
      console.error('Upload failed:', error);
      setSelectedFile(prev => prev ? { 
        ...prev, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Upload failed' 
      } : null);
      onSubmissionError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFile, user, assignmentId, courseId, onSubmissionComplete, onSubmissionError]);

  const handleFileRemove = useCallback(() => {
    if (selectedFile?.previewUrl) {
      URL.revokeObjectURL(selectedFile.previewUrl);
    }
    setSelectedFile(null);
    setValidationErrors([]);
    setSubmissionData(null);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (selectedFile?.previewUrl) {
        URL.revokeObjectURL(selectedFile.previewUrl);
      }
    };
  }, [selectedFile]);

  // Device detection for mobile-specific handling
  useEffect(() => {
    setIsMobile(isMobileDevice());
    logDeviceInfo(); // Log device info for debugging mobile issues
  }, []);

  const canUpload = selectedFile && selectedFile.status === 'pending' && validationErrors.length === 0;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Video Submission</h2>
        <p className="mt-2 text-gray-600">
          Upload your video assignment. Supported formats: MP4, WebM, MOV
        </p>
        <div className="mt-2 text-sm text-gray-500">
          Max file size: {Math.round(maxFileSize / (1024 * 1024))}MB • 
          Max duration: {Math.floor(maxDuration / 60)}m {maxDuration % 60}s
          {selectedFile && LargeFileUploader.shouldUseLargeFileUpload(selectedFile.file) && (
            <div className="mt-1 text-blue-600 font-medium">
              📁 Large file detected - using optimized upload system
            </div>
          )}
        </div>
      </div>

      {/* Mode Selection */}
      {enableLiveRecording && !selectedFile && (
        <div className="flex justify-center">
          <div className="bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setRecordingMode('upload')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                recordingMode === 'upload'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📁 Upload Video
            </button>
            <button
              onClick={() => setRecordingMode('record')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                recordingMode === 'record'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎥 Record Live
            </button>
          </div>
        </div>
      )}

      {/* Assignment Requirements - Always visible for reference */}
      {assignmentRequirements.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
            <span className="mr-2">📋</span>
            Assignment Requirements
          </h3>
          <div className="space-y-2">
            {assignmentRequirements.map((requirement, index) => (
              <div key={index} className="flex items-start space-x-2 text-sm text-blue-700">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{requirement}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedFile && recordingMode === 'upload' && (
        isMobile ? (
          <MobileVideoUpload
            onFileSelect={handleFileSelect}
            allowedTypes={allowedVideoTypes}
            maxFileSize={maxFileSize}
          />
        ) : (
          <VideoUploadZone
            onFileSelect={handleFileSelect}
            allowedTypes={allowedVideoTypes}
            maxFileSize={maxFileSize}
          />
        )
      )}

      {!selectedFile && recordingMode === 'record' && enableLiveRecording && (
        <div className="relative">
          <LiveVideoRecorder
            onRecordingComplete={handleRecordingComplete}
            onError={(error) => {
              console.error('Recording error:', error);
              onSubmissionError?.(error);
            }}
            maxDuration={maxDuration}
          />
          
          {/* Floating Requirements Panel - Always visible during recording */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg max-w-xs max-h-80 overflow-y-auto">
            <h4 className="text-xs font-semibold text-gray-800 mb-2 flex items-center">
              <span className="mr-1">📋</span>
              Assignment Requirements
            </h4>
            <div className="space-y-1 text-xs text-gray-600">
              {assignmentRequirements.slice(0, 5).map((requirement, index) => (
                <div key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                  <span className="leading-tight">{requirement}</span>
                </div>
              ))}
              {assignmentRequirements.length > 5 && (
                <div className="text-xs text-gray-500 italic">
                  +{assignmentRequirements.length - 5} more requirements
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedFile && (
        <div className="space-y-4">
          {showPreview && selectedFile.previewUrl && (
            <VideoPreview
              videoFile={selectedFile}
              onRemove={handleFileRemove}
            />
          )}

          {selectedFile.status === 'uploading' && (
            <VideoUploadProgress
              progress={uploadProgress}
              fileName={selectedFile.file.name}
            />
          )}

          {selectedFile.status === 'processing' && (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Processing your video...</p>
            </div>
          )}

          {validationErrors.length > 0 && (
            <VideoValidationErrors errors={validationErrors} />
          )}

          {/* Content Moderation */}
          {isModerating && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-blue-700">Checking video content for appropriateness...</span>
              </div>
            </div>
          )}

          {moderationResult && (
            <ContentModerationChecker
              content={selectedFile.previewUrl || ''}
              type="video"
              onModerationComplete={() => {}}
              context={{
                assignmentId,
                courseId,
                studentId: user?.id,
                userId: user?.id
              }}
              autoCheck={false}
              showGuidelines={false}
            />
          )}

          {selectedFile.status === 'error' && selectedFile.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Upload Failed</h3>
                  <p className="mt-1 text-sm text-red-700">{selectedFile.error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center space-x-4">
            {canUpload && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? 'Uploading...' : 'Upload Video'}
              </button>
            )}
            
            {selectedFile.status !== 'completed' && (
              <button
                onClick={handleFileRemove}
                disabled={isUploading || isProcessing}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Remove File
              </button>
            )}
          </div>
        </div>
      )}

      {submissionData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="flex justify-center">
            <svg className="h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-green-800">Video Submitted Successfully!</h3>
          <p className="mt-2 text-green-700">
            Your video "{submissionData.fileName}" has been uploaded and is being processed.
          </p>
          <div className="mt-4 text-sm text-green-600">
            <p>File size: {(submissionData.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
            {submissionData.duration > 0 && (
              <p>Duration: {Math.floor(submissionData.duration / 60)}m {Math.round(submissionData.duration % 60)}s</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
