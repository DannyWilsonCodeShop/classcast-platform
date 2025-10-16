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
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    return videoUrl;
  }

  // If it's an S3 presigned URL, use it directly (they already have auth tokens)
  // This avoids 413 errors from proxy trying to handle long URLs
  if (videoUrl.includes('amazonaws.com') || videoUrl.includes('s3.')) {
    // Use direct S3 URLs - presigned URLs have auth built-in
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
