/**
 * Large File Upload Utility
 * Handles uploads of large files (>100MB) using S3 Multipart Upload
 * Features:
 * - Chunked uploads for reliability
 * - Resumable uploads
 * - Session refresh during long uploads
 * - Better error handling and retry logic
 */

import { getFallbackMimeType } from './fileTypeUtils';

export interface LargeFileUploadOptions {
  file: File;
  folder?: string;
  userId?: string;
  metadata?: Record<string, any>;
  contentType?: string;
  onProgress?: (progress: number) => void;
  onComplete?: (result: LargeFileUploadResult) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: string) => void;
}

export interface LargeFileUploadResult {
  fileKey: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadMethod: string;
}

export interface UploadProgress {
  uploaded: number;
  total: number;
  percentage: number;
  status: 'initializing' | 'uploading' | 'completing' | 'verifying' | 'complete' | 'error';
  currentChunk?: number;
  totalChunks?: number;
}

export class LargeFileUploader {
  private static readonly LARGE_FILE_THRESHOLD = 100 * 1024 * 1024; // 100MB
  private static readonly CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks for better reliability
  private static readonly MAX_RETRIES = 5;
  private static readonly RETRY_DELAY = 2000; // 2 seconds base delay
  private static readonly MAX_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours for very large files
  private static readonly SESSION_REFRESH_INTERVAL = 15 * 60 * 1000; // Refresh session every 15 minutes

  /**
   * Determine if file should use large file upload
   */
  static shouldUseLargeFileUpload(file: File): boolean {
    if (!file) {
      console.warn('❌ No file provided for large file check');
      return false;
    }

    if (typeof file.size !== 'number' || file.size === undefined || file.size === null || isNaN(file.size)) {
      console.warn('❌ Invalid file object for large file check - missing or invalid size:', {
        file: !!file,
        sizeType: typeof file.size,
        sizeValue: file.size,
        isNaN: isNaN(file.size),
        constructor: file?.constructor?.name,
        fileName: file.name,
        fileType: file.type
      });
      return false;
    }

    console.log(`📊 File size check: ${this.formatFileSize(file.size)} (threshold: ${this.formatFileSize(this.LARGE_FILE_THRESHOLD)})`);

    return file.size > this.LARGE_FILE_THRESHOLD;
  }

  /**
   * Upload a large file using S3 Multipart Upload for chunked/resumable uploads
   */
  static async uploadLargeFile(options: LargeFileUploadOptions): Promise<LargeFileUploadResult> {
    const {
      file,
      folder = 'videos',
      userId,
      metadata = {},
      contentType,
      onProgress,
      onComplete,
      onError,
      onStatusChange,
    } = options;

    try {
      // Validate file before starting upload
      if (!file) {
        throw new Error('No file provided for upload');
      }

      if (typeof file.size !== 'number' || file.size === undefined || file.size === null) {
        throw new Error('Invalid file: missing size information');
      }
      if (!file.name || typeof file.name !== 'string') {
        throw new Error('Invalid file: missing name information');
      }

      const resolvedContentType =
        (contentType && contentType.trim() !== '' ? contentType : null) ||
        (file.type && file.type.trim() !== '' ? file.type : null) ||
        getFallbackMimeType();

      console.log(`🚀 Starting large file upload: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);

      // Check if we should use multipart upload (files > 100MB)
      const useMultipart = file.size > 100 * 1024 * 1024;

      if (useMultipart) {
        return await this.uploadWithMultipart({
          file,
          folder,
          userId,
          metadata,
          contentType: resolvedContentType,
          onProgress,
          onComplete,
          onError,
          onStatusChange,
        });
      } else {
        return await this.uploadWithPresignedUrl({
          file,
          folder,
          userId,
          metadata,
          contentType: resolvedContentType,
          onProgress,
          onComplete,
          onError,
          onStatusChange,
        });
      }
    } catch (error) {
      console.error('❌ Large file upload failed:', error);
      const uploadError = error instanceof Error ? error : new Error('Unknown upload error');
      onError?.(uploadError);
      throw uploadError;
    }
  }

  /**
   * Upload using S3 Multipart Upload (for files > 100MB)
   */
  private static async uploadWithMultipart(options: {
    file: File;
    folder: string;
    userId?: string;
    metadata: Record<string, any>;
    contentType: string;
    onProgress?: (progress: number) => void;
    onComplete?: (result: LargeFileUploadResult) => void;
    onError?: (error: Error) => void;
    onStatusChange?: (status: string) => void;
  }): Promise<LargeFileUploadResult> {
    const { file, folder, userId, metadata, contentType, onProgress, onComplete, onError, onStatusChange } = options;

    onStatusChange?.('initializing');
    onProgress?.(0);

    try {
      // Step 1: Initialize multipart upload
      onStatusChange?.('Initializing multipart upload...');
      const initResponse = await fetch('/api/upload/multipart/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          contentType,
          folder,
          userId,
          metadata,
        }),
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(errorData.error || 'Failed to initialize multipart upload');
      }

      const initData = await initResponse.json();
      if (!initData.success) {
        throw new Error(initData.error || 'Failed to initialize multipart upload');
      }

      const { uploadId, fileKey, fileUrl } = initData.data;
      console.log('✅ Multipart upload initialized:', { uploadId, fileKey });

      // Step 2: Calculate chunks
      const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);
      const uploadedParts: Array<{ ETag: string; PartNumber: number }> = [];

      onStatusChange?.(`Uploading ${totalChunks} chunks...`);
      onProgress?.(5);

      // Step 3: Upload chunks with retry logic
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * this.CHUNK_SIZE;
        const end = Math.min(start + this.CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        const partNumber = chunkIndex + 1;

        // Refresh session periodically during long uploads
        if (chunkIndex > 0 && chunkIndex % 10 === 0) {
          await this.refreshSession();
        }

        let retries = 0;
        let uploaded = false;

        while (retries < this.MAX_RETRIES && !uploaded) {
          try {
            // Get presigned URL for this chunk
            const partUrlResponse = await fetch('/api/upload/multipart/part-url', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                uploadId,
                fileKey,
                partNumber,
              }),
            });

            if (!partUrlResponse.ok) {
              throw new Error('Failed to get part URL');
            }

            const partUrlData = await partUrlResponse.json();
            if (!partUrlData.success) {
              throw new Error(partUrlData.error || 'Failed to get part URL');
            }

            const { presignedUrl } = partUrlData.data;

            // Upload chunk
            const etag = await this.uploadChunk(chunk, presignedUrl, contentType, (chunkProgress) => {
              const overallProgress = 5 + Math.round(
                ((chunkIndex + chunkProgress / 100) / totalChunks) * 85
              );
              onProgress?.(overallProgress);
            });

            uploadedParts.push({ ETag: etag, PartNumber: partNumber });
            uploaded = true;

            console.log(`✅ Chunk ${partNumber}/${totalChunks} uploaded`);
            onStatusChange?.(`Uploaded ${partNumber}/${totalChunks} chunks...`);

          } catch (error) {
            retries++;
            if (retries >= this.MAX_RETRIES) {
              throw new Error(`Failed to upload chunk ${partNumber} after ${this.MAX_RETRIES} retries: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            const delay = this.RETRY_DELAY * Math.pow(2, retries - 1); // Exponential backoff
            console.log(`⚠️ Retrying chunk ${partNumber} in ${delay}ms... (${retries}/${this.MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // Step 4: Complete multipart upload
      onStatusChange?.('Completing upload...');
      onProgress?.(90);

      const completeResponse = await fetch('/api/upload/multipart/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadId,
          fileKey,
          parts: uploadedParts,
        }),
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || 'Failed to complete multipart upload');
      }

      const completeData = await completeResponse.json();
      if (!completeData.success) {
        throw new Error(completeData.error || 'Failed to complete multipart upload');
      }

      // Step 5: Verify upload
      onStatusChange?.('Verifying upload...');
      onProgress?.(95);
      await this.verifyUpload(fileKey);

      onProgress?.(100);
      onStatusChange?.('Upload complete!');

      const result: LargeFileUploadResult = {
        fileKey,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        uploadMethod: 'multipart-upload',
      };

      console.log('🎉 Large file upload completed successfully');
      onComplete?.(result);
      return result;

    } catch (error) {
      onStatusChange?.('Upload failed');
      throw error;
    }
  }

  /**
   * Upload using presigned URL (for files 100MB - 500MB)
   */
  private static async uploadWithPresignedUrl(options: {
    file: File;
    folder: string;
    userId?: string;
    metadata: Record<string, any>;
    contentType: string;
    onProgress?: (progress: number) => void;
    onComplete?: (result: LargeFileUploadResult) => void;
    onError?: (error: Error) => void;
    onStatusChange?: (status: string) => void;
  }): Promise<LargeFileUploadResult> {
    const { file, folder, userId, metadata, contentType, onProgress, onComplete, onError, onStatusChange } = options;

    onStatusChange?.('Getting upload URL...');
    onProgress?.(5);

    try {
      // Get presigned URL
      const presignedResponse = await fetch('/api/upload/large-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          contentType,
          folder,
          userId,
          metadata,
        }),
      });

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json();
        throw new Error(errorData.error || 'Failed to get presigned URL');
      }

      const presignedData = await presignedResponse.json();
      if (!presignedData.success) {
        throw new Error(presignedData.error || 'Failed to get presigned URL');
      }

      const { presignedUrl, fileKey, fileUrl } = presignedData.data;

      console.log('✅ Presigned URL obtained, starting direct S3 upload');

      // Upload with improved timeout and retry
      onStatusChange?.('Uploading to cloud storage...');
      onProgress?.(10);
      await this.uploadToS3WithProgress(file, presignedUrl, contentType, onProgress, onStatusChange);

      // Verify upload
      onStatusChange?.('Verifying upload...');
      onProgress?.(95);
      await this.verifyUpload(fileKey);

      onProgress?.(100);
      onStatusChange?.('Upload complete!');

      const result: LargeFileUploadResult = {
        fileKey,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        uploadMethod: 'presigned-large-file',
      };

      console.log('🎉 Large file upload completed successfully');
      onComplete?.(result);
      return result;

    } catch (error) {
      onStatusChange?.('Upload failed');
      throw error;
    }
  }

  /**
   * Upload a single chunk to S3
   */
  private static async uploadChunk(
    chunk: Blob,
    presignedUrl: string,
    contentType: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress?.(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const etag = xhr.getResponseHeader('ETag')?.replace(/"/g, '') || '';
          if (!etag) {
            reject(new Error('No ETag received from S3'));
            return;
          }
          resolve(etag);
        } else {
          reject(new Error(`S3 upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during S3 upload'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.timeout = 10 * 60 * 1000; // 10 minutes per chunk

      xhr.send(chunk);
    });
  }

  /**
   * Upload file to S3 using presigned URL with improved progress tracking and timeout
   */
  private static async uploadToS3WithProgress(
    file: File,
    presignedUrl: string,
    contentType: string,
    onProgress?: (progress: number) => void,
    onStatusChange?: (status: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let lastProgressTime = Date.now();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = 10 + Math.round((event.loaded / event.total) * 80); // 10-90%
          onProgress?.(progress);

          // Refresh session every 15 minutes during upload
          const now = Date.now();
          if (now - lastProgressTime > this.SESSION_REFRESH_INTERVAL) {
            lastProgressTime = now;
            this.refreshSession().catch(err => {
              console.warn('Failed to refresh session during upload:', err);
            });
          }
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('✅ S3 upload completed');
          resolve();
        } else {
          console.error('❌ S3 upload failed:', xhr.status, xhr.statusText);
          reject(new Error(`S3 upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        console.error('❌ S3 upload network error');
        reject(new Error('Network error during S3 upload. Please check your connection and try again.'));
      });

      // Handle timeout
      xhr.addEventListener('timeout', () => {
        console.error('❌ S3 upload timeout');
        reject(new Error('Upload timeout. The file may be too large or your connection too slow. Please try using the external link option (YouTube/Google Drive) instead.'));
      });

      // Configure request
      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.timeout = this.MAX_TIMEOUT; // 2 hours for very large files

      // Start upload
      xhr.send(file);
    });
  }

  /**
   * Refresh authentication session to prevent timeout during long uploads
   */
  private static async refreshSession(): Promise<void> {
    try {
      // Try to refresh the session by making a lightweight API call
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        console.log('✅ Session refreshed during upload');
      }
    } catch (error) {
      console.warn('⚠️ Failed to refresh session:', error);
      // Don't throw - session refresh failure shouldn't stop upload
    }
  }

  /**
   * Verify that the upload was successful
   */
  private static async verifyUpload(fileKey: string): Promise<void> {
    let retries = 0;

    while (retries < this.MAX_RETRIES) {
      try {
        const response = await fetch(`/api/upload/large-file?fileKey=${encodeURIComponent(fileKey)}`);

        if (!response.ok) {
          throw new Error('Failed to verify upload');
        }

        const data = await response.json();

        if (data.success && data.data.exists) {
          console.log('✅ Upload verified successfully');
          return;
        }

        // File not found, wait and retry
        if (retries < this.MAX_RETRIES - 1) {
          console.log(`⏳ Upload verification failed, retrying in ${this.RETRY_DELAY}ms... (${retries + 1}/${this.MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
          retries++;
        } else {
          throw new Error('Upload verification failed after maximum retries');
        }
      } catch (error) {
        if (retries < this.MAX_RETRIES - 1) {
          console.log(`⏳ Upload verification error, retrying... (${retries + 1}/${this.MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
          retries++;
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Get upload progress message
   */
  static getProgressMessage(progress: number): string {
    if (progress < 5) return 'Preparing upload...';
    if (progress < 10) return 'Initializing...';
    if (progress < 90) return 'Uploading to cloud storage...';
    if (progress < 95) return 'Completing upload...';
    if (progress < 100) return 'Verifying upload...';
    return 'Upload complete!';
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Estimate upload time based on file size and connection speed
   */
  static estimateUploadTime(fileSize: number, speedMbps: number = 10): string {
    const fileSizeMb = fileSize / (1024 * 1024);
    const timeSeconds = (fileSizeMb * 8) / speedMbps; // Convert to bits and divide by speed

    if (timeSeconds < 60) {
      return `~${Math.ceil(timeSeconds)} seconds`;
    } else if (timeSeconds < 3600) {
      return `~${Math.ceil(timeSeconds / 60)} minutes`;
    } else {
      return `~${Math.ceil(timeSeconds / 3600)} hours`;
    }
  }
}

