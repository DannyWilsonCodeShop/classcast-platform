/**
 * Utility functions for handling video URLs
 */

/**
 * Get the proper video URL, using proxy for S3 URLs to ensure Safari/mobile compatibility
 */
export function getVideoUrl(videoUrl: string | undefined | null): string {
  if (!videoUrl) {
    return '';
  }

  // If it's a YouTube URL, return as-is
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    return videoUrl;
  }

  // If it's an S3 URL, use the proxy for better Safari/mobile compatibility
  if (videoUrl.includes('amazonaws.com') || videoUrl.includes('s3.')) {
    return `/api/video-proxy?url=${encodeURIComponent(videoUrl)}`;
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
