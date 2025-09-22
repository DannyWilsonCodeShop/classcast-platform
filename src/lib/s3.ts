import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { awsConfig } from './aws-config';

// S3 client configuration
const s3Client = new S3Client({
  region: awsConfig.region,
  // For local development, you can use:
  // endpoint: 'http://localhost:9000',
});

// Bucket name from unified configuration
const BUCKET_NAME = awsConfig.s3.buckets.videos;

// CloudFront domain from environment
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

// S3 Service Class
export class S3Service {
  private client: S3Client;
  private bucketName: string;

  constructor() {
    this.client = s3Client;
    this.bucketName = BUCKET_NAME;
  }

  // Upload file to S3
  async uploadFile(
    key: string,
    body: Buffer | string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
        Metadata: metadata,
        // Enable server-side encryption
        ServerSideEncryption: 'AES256',
        // Set cache control for better performance
        CacheControl: this.getCacheControl(contentType),
      });

      await this.client.send(command);

      // Return the CloudFront URL if available, otherwise S3 URL
      return this.getFileUrl(key);
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get file from S3
  async getFile(key: string): Promise<{ body: Buffer; contentType: string; metadata?: Record<string, string> }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        throw new Error('File not found or empty');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks);

      return {
        body,
        contentType: response.ContentType || 'application/octet-stream',
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error('Error getting file from S3:', error);
      throw new Error(`Failed to get file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete file from S3
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // List files in a directory
  async listFiles(prefix: string, maxKeys: number = 1000): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await this.client.send(command);
      
      if (!response.Contents) {
        return [];
      }

      return response.Contents
        .map(obj => obj.Key)
        .filter((key): key is string => key !== undefined);
    } catch (error) {
      console.error('Error listing files from S3:', error);
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Check if file exists
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Generate presigned URL for upload
  async generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
        CacheControl: this.getCacheControl(contentType),
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating presigned upload URL:', error);
      throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate presigned URL for download
  async generatePresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating presigned download URL:', error);
      throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get file URL (CloudFront or S3)
  getFileUrl(key: string): string {
    if (CLOUDFRONT_DOMAIN) {
      return `https://${CLOUDFRONT_DOMAIN}/${key}`;
    }
    return `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  }

  // Get cache control based on content type
  private getCacheControl(contentType: string): string {
    if (contentType.startsWith('image/')) {
      return 'public, max-age=31536000'; // 1 year for images
    }
    if (contentType.startsWith('text/') || contentType.includes('javascript') || contentType.includes('css')) {
      return 'public, max-age=86400'; // 1 day for text files
    }
    if (contentType.includes('pdf') || contentType.includes('document')) {
      return 'public, max-age=3600'; // 1 hour for documents
    }
    return 'public, max-age=300'; // 5 minutes default
  }

  // Generate unique file key
  generateFileKey(
    folder: string,
    originalName: string,
    userId?: string,
    timestamp?: number
  ): string {
    const timestampStr = timestamp ? timestamp.toString() : Date.now().toString();
    const userIdStr = userId ? `_${userId}` : '';
    const extension = originalName.split('.').pop();
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    
    // Sanitize the base name
    const sanitizedName = baseName
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .toLowerCase()
      .substring(0, 50); // Limit length
    
    return `${folder}/${sanitizedName}${userIdStr}_${timestampStr}.${extension}`;
  }

  // Upload user avatar
  async uploadUserAvatar(
    userId: string,
    file: Buffer,
    contentType: string
  ): Promise<string> {
    const key = this.generateFileKey('avatars', `avatar_${userId}.jpg`, userId);
    return this.uploadFile(key, file, contentType, {
      'user-id': userId,
      'file-type': 'avatar',
    });
  }

  // Upload assignment attachment
  async uploadAssignmentAttachment(
    assignmentId: string,
    fileName: string,
    file: Buffer,
    contentType: string,
    instructorId: string
  ): Promise<string> {
    const key = this.generateFileKey('assignments', fileName, instructorId);
    return this.uploadFile(key, file, contentType, {
      'assignment-id': assignmentId,
      'instructor-id': instructorId,
      'file-type': 'assignment',
    });
  }

  // Upload submission file
  async uploadSubmissionFile(
    submissionId: string,
    fileName: string,
    file: Buffer,
    contentType: string,
    studentId: string
  ): Promise<string> {
    const key = this.generateFileKey('submissions', fileName, studentId);
    return this.uploadFile(key, file, contentType, {
      'submission-id': submissionId,
      'student-id': studentId,
      'file-type': 'submission',
    });
  }

  // Get file metadata
  async getFileMetadata(key: string): Promise<Record<string, string> | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);
      return response.Metadata || null;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.listFiles('', 1);
      return true;
    } catch (error) {
      console.error('S3 health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const s3Service = new S3Service();

// Export for use in other modules
export default s3Service;
