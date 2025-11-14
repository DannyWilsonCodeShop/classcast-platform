/**
 * Video URL Processor for Backend API
 * Processes and validates video URLs before storing in database
 */

import { parseVideoUrl, convertToBestFormat, VideoUrlInfo } from './urlUtils';

export interface ProcessedVideoUrl {
  originalUrl: string;
  displayUrl: string;
  embedUrl?: string;
  videoType: 'youtube' | 'google-drive' | 'direct' | 'unknown';
  videoId?: string;
  isValid: boolean;
  error?: string;
}

/**
 * Process a video URL for storage and display
 * This should be called when a user submits a video URL
 */
export function processVideoUrl(url: string): ProcessedVideoUrl {
  if (!url || typeof url !== 'string') {
    return {
      originalUrl: url || '',
      displayUrl: url || '',
      videoType: 'unknown',
      isValid: false,
      error: 'URL is required',
    };
  }

  const parsed = parseVideoUrl(url.trim());

  // Convert Google Drive URLs to embeddable format
  let displayUrl = parsed.url;
  if (parsed.type === 'google-drive' && parsed.embedUrl) {
    displayUrl = parsed.embedUrl;
  }

  return {
    originalUrl: parsed.url,
    displayUrl: displayUrl,
    embedUrl: parsed.embedUrl,
    videoType: parsed.type,
    videoId: parsed.videoId,
    isValid: parsed.isValid,
    error: parsed.error,
  };
}

/**
 * Validate a video URL and return error message if invalid
 */
export function validateVideoUrl(url: string): { isValid: boolean; error?: string } {
  const processed = processVideoUrl(url);
  
  if (!processed.isValid) {
    return {
      isValid: false,
      error: processed.error || 'Invalid video URL',
    };
  }

  return { isValid: true };
}

/**
 * Get the best URL format for embedding/display
 */
export function getDisplayUrl(url: string): string {
  const processed = processVideoUrl(url);
  return processed.displayUrl;
}

/**
 * Get embed URL if available
 */
export function getEmbedUrl(url: string): string | null {
  const processed = processVideoUrl(url);
  return processed.embedUrl || null;
}

/**
 * Check if URL is a Google Drive link that needs special handling
 */
export function isGoogleDriveUrl(url: string): boolean {
  const processed = processVideoUrl(url);
  return processed.videoType === 'google-drive';
}

/**
 * Check if URL is a YouTube link
 */
export function isYouTubeUrl(url: string): boolean {
  const processed = processVideoUrl(url);
  return processed.videoType === 'youtube';
}

