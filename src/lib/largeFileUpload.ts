/**
 * Large File Upload Utility
 * Handles uploads of large files (>100MB) using presigned URLs
 */

export interface LargeFileUploadOptions {
  file: File;
  folder?: string;
  userId?: string;
  metadata?: Record<string, any>;
  onProgress?: (progress: number) => void;
  onComplete?: (result: LargeFileUploadResult) => void;
  onError?: (error: Error) => void;
}

export interface LargeFileUploadResult {
  fileKey: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadMethod: string;
}

export class LargeFileUploader {
  private static readonly LARGE_FILE_THRESHOLD = 100 * 1024 * 1024; // 100MB
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Determine if file should use large file upload
   */
  static shouldUseLargeFileUpload(file: File): boolean {
    // Add comprehensive safety checks
    if (!file) {
      console.warn('❌ No file provided for large file check');
      return false;
    }
    
    // Check if file is a proper File object
    if (!(file instanceof File)) {
      console.warn('❌ Object is not a File instance:', {
        type: typeof file,
        constructor: file?.constructor?.name,
        hasSize: 'size' in file,
        hasName: 'name' in file
      });
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
    
    console.log(`📏 File size check: ${this.formatFileSize(file.size)} (threshold: ${this.formatFileSize(this.LARGE_FILE_THRESHOLD)})`);
    return file.size > this.LARGE_FILE_THRESHOLD;
  }

  /**
   * Upload a large file using presigned URL
   */
  static async uploadLargeFile(options: LargeFileUploadOptions): Promise<LargeFileUploadResult> {
    const { file, folder = 'videos', userId, metadata = {}, onProgress, onComplete, onError } = options;

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
      
      if (!file.type || typeof file.type !== 'string') {
        throw new Error('Invalid file: missing type information');
      }

      console.log(`🚀 Starting large file upload: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);

      // Step 1: Get presigned URL
      onProgress?.(5);
      const presignedResponse = await fetch('/api/upload/large-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
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

      // Step 2: Upload directly to S3 with progress tracking
      onProgress?.(10);
      await this.uploadToS3WithProgress(file, presignedUrl, onProgress);

      // Step 3: Verify upload completion
      onProgress?.(95);
      await this.verifyUpload(fileKey);

      onProgress?.(100);

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
      console.error('❌ Large file upload failed:', error);
      const uploadError = error instanceof Error ? error : new Error('Unknown upload error');
      onError?.(uploadError);
      throw uploadError;
    }
  }

  /**
   * Upload file to S3 using presigned URL with progress tracking
   */
  private static async uploadToS3WithProgress(
    file: File,
    presignedUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = 10 + Math.round((event.loaded / event.total) * 80); // 10-90%
          onProgress?.(progress);
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
        reject(new Error('Network error during S3 upload'));
      });

      // Handle timeout
      xhr.addEventListener('timeout', () => {
        console.error('❌ S3 upload timeout');
        reject(new Error('Upload timeout'));
      });

      // Configure request
      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.timeout = 30 * 60 * 1000; // 30 minutes timeout

      // Start upload
      xhr.send(file);
    });
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
    if (progress < 10) return 'Preparing upload...';
    if (progress < 90) return 'Uploading to cloud storage...';
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