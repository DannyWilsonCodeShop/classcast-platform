import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
const s3Client = new S3Client({
  region: 'us-east-1',
  // Uses default credential provider chain (IAM role)
});

const BUCKET_NAME = 'cdk-hnb659fds-assets-463470937777-us-east-1';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadAvatarToS3(
  file: File,
  userId: string
): Promise<UploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Please select a valid image file'
      };
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: 'File size must be less than 5MB'
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `avatar_${userId}_${timestamp}.${fileExtension}`;
    const key = `profile-pictures/${filename}`;

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: file.type,
      ACL: 'public-read'
    });

    await s3Client.send(uploadCommand);

    // Return the public URL
    const url = `https://${BUCKET_NAME}.s3.us-east-1.amazonaws.com/${key}`;
    
    return {
      success: true,
      url
    };

  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

export async function uploadBase64ToS3(
  base64Data: string,
  userId: string,
  contentType: string = 'image/jpeg'
): Promise<UploadResult> {
  try {
    // Extract base64 data
    const base64String = base64Data.split(',')[1];
    if (!base64String) {
      return {
        success: false,
        error: 'Invalid base64 data'
      };
    }

    // Convert to buffer
    const buffer = Buffer.from(base64String, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `avatar_${userId}_${timestamp}.jpg`;
    const key = `profile-pictures/${filename}`;

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read'
    });

    await s3Client.send(uploadCommand);

    // Return the public URL
    const url = `https://${BUCKET_NAME}.s3.us-east-1.amazonaws.com/${key}`;
    
    return {
      success: true,
      url
    };

  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}
