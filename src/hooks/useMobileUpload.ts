'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  success: boolean;
  data?: {
    fileUrl: string;
    fileName: string;
    fileSize: number;
    submissionId?: string;
  };
  error?: string;
}

interface UseMobileUploadOptions {
  assignmentId?: string;
  courseId?: string;
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: string) => void;
}

export function useMobileUpload(options: UseMobileUploadOptions = {}) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<UploadResult> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      console.log('📱 Starting mobile upload:', {
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        fileType: file.type || 'unknown'
      });

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'video-submissions');
      formData.append('userId', user.id);
      
      const metadata = {
        assignmentId: options.assignmentId,
        courseId: options.courseId,
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type || 'video/mp4',
        isMobileUpload: true
      };
      formData.append('metadata', JSON.stringify(metadata));

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentage = Math.round((e.loaded / e.total) * 100);
            setProgress(percentage);
            
            const progressData: UploadProgress = {
              loaded: e.loaded,
              total: e.total,
              percentage
            };
            
            options.onProgress?.(progressData);
            console.log(`📱 Upload progress: ${percentage}%`);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log('📱 Upload successful:', response);
              
              const result: UploadResult = {
                success: true,
                data: {
                  fileUrl: response.data.fileUrl,
                  fileName: response.data.fileName,
                  fileSize: response.data.fileSize
                }
              };
              
              resolve(result);
            } catch (parseError) {
              console.error('📱 Failed to parse upload response:', parseError);
              reject(new Error('Invalid response from server'));
            }
          } else {
            console.error('📱 Upload failed with status:', xhr.status);
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.error || `Upload failed with status ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          console.error('📱 Upload network error');
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('timeout', () => {
          console.error('📱 Upload timeout');
          reject(new Error('Upload timeout'));
        });

        xhr.open('POST', '/api/upload');
        xhr.timeout = 10 * 60 * 1000; // 10 minute timeout
        xhr.send(formData);
      });

      const result = await uploadPromise;
      
      // If we have assignment info, create submission record
      if (options.assignmentId && result.success && result.data) {
        try {
          console.log('📱 Creating submission record...');
          
          const submissionResponse = await fetch('/api/video-submissions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              assignmentId: options.assignmentId,
              studentId: user.id,
              courseId: options.courseId,
              videoUrl: result.data.fileUrl,
              videoTitle: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
              videoDescription: `Mobile video submission for assignment ${options.assignmentId}`,
              duration: 0, // Will be calculated server-side
              fileName: result.data.fileName,
              fileSize: result.data.fileSize,
              fileType: file.type || 'video/mp4',
              isUploaded: true,
              isRecorded: false,
              isMobileUpload: true
            }),
          });

          if (submissionResponse.ok) {
            const submissionData = await submissionResponse.json();
            result.data.submissionId = submissionData.submission.submissionId;
            console.log('📱 Submission record created:', submissionData.submission.submissionId);
          } else {
            console.warn('📱 Failed to create submission record, but upload succeeded');
          }
        } catch (submissionError) {
          console.warn('📱 Submission record creation failed:', submissionError);
          // Don't fail the entire upload for this
        }
      }

      options.onSuccess?.(result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('📱 Mobile upload failed:', error);
      
      setError(errorMessage);
      options.onError?.(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsUploading(false);
    }
  }, [user, options]);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    uploadFile,
    isUploading,
    progress,
    error,
    reset
  };
}