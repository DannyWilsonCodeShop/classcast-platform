import { getGoogleDrivePreviewUrl, isValidGoogleDriveUrl } from './googleDrive';

/**
 * Utility functions for handling video URLs
 */

/**
 * Get the proper video URL - use direct S3 URLs (presigned URLs already have auth)
 */
export function getVideoUrl(videoUrl: string | undefined | null): string {
  if (!videoUrl) {
    return '';
  }

  // Convert s3:// URLs to https:// format
  if (videoUrl.startsWith('s3://')) {
    const httpsUrl = convertS3UrlToHttps(videoUrl);
    console.log('🎬 Converted s3:// URL to https://', { original: videoUrl, converted: httpsUrl });
    return httpsUrl;
  }

  // If it's a YouTube URL, return as-is
  if (isYouTubeUrl(videoUrl)) {
    return videoUrl;
  }

  // If it's a Google Drive URL, ensure we're using the preview endpoint
  if (isGoogleDriveUrl(videoUrl)) {
    const previewUrl = getGoogleDrivePreviewUrl(videoUrl);
    return previewUrl || videoUrl;
  }

  // If it's an S3 presigned URL, use it directly (they already have auth tokens)
  // This avoids 413 errors from proxy trying to handle long URLs
  if (isS3VideoUrl(videoUrl)) {
    console.log('🎬 Using direct S3 URL (no proxy)');
    return videoUrl;
  }

  // For other URLs (like data URLs or external URLs), return as-is
  return videoUrl;
}

/**
 * Check if a video URL is from S3
 */
export function isS3VideoUrl(url: string): boolean {
  return url.includes('amazonaws.com') || url.includes('s3.');
}

/**
 * Check if a video URL is from YouTube
 */
export function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

/**
 * Check if a video URL is from Google Drive
 */
export function isGoogleDriveUrl(url: string): boolean {
  return isValidGoogleDriveUrl(url);
}

/**
 * Convert s3:// URL to https:// format
 */
export function convertS3UrlToHttps(s3Url: string): string {
  if (!s3Url.startsWith('s3://')) {
    return s3Url;
  }

  // Parse s3://bucket-name/key/path
  const match = s3Url.match(/^s3:\/\/([^\/]+)\/(.+)$/);
  if (!match) {
    console.warn('Invalid s3:// URL format:', s3Url);
    return s3Url;
  }

  const [, bucket, key] = match;
  
  // Convert to https:// format
  // Use the standard S3 URL format: https://bucket.s3.region.amazonaws.com/key
  const httpsUrl = `https://${bucket}.s3.us-east-1.amazonaws.com/${key}`;
  
  return httpsUrl;
}
