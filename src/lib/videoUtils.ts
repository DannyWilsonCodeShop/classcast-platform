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
