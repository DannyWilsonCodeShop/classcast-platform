/**
 * URL Utilities for Video Links
 * Handles YouTube, Google Drive, and other video URL formats
 */

export interface VideoUrlInfo {
  type: 'youtube' | 'google-drive' | 'direct' | 'unknown';
  url: string;
  embedUrl?: string;
  videoId?: string;
  isValid: boolean;
  error?: string;
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract Google Drive file ID from URL
 */
export function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;

  // Handle various Google Drive URL formats:
  // https://drive.google.com/file/d/FILE_ID/view
  // https://drive.google.com/open?id=FILE_ID
  // https://docs.google.com/file/d/FILE_ID/edit
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Convert Google Drive URL to embeddable format
 */
export function convertGoogleDriveToEmbed(url: string): string | null {
  const fileId = extractGoogleDriveId(url);
  if (!fileId) return null;

  // Convert to embeddable format
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Convert Google Drive URL to direct download format (if publicly accessible)
 */
export function convertGoogleDriveToDirect(url: string): string | null {
  const fileId = extractGoogleDriveId(url);
  if (!fileId) return null;

  // Convert to direct download format
  // Note: This only works if the file is set to "Anyone with the link can view"
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Validate and parse a video URL
 */
export function parseVideoUrl(url: string): VideoUrlInfo {
  if (!url || typeof url !== 'string') {
    return {
      type: 'unknown',
      url: url || '',
      isValid: false,
      error: 'Invalid URL: URL is required',
    };
  }

  const trimmedUrl = url.trim();

  // Check if it's a YouTube URL
  const youtubeId = extractYouTubeId(trimmedUrl);
  if (youtubeId) {
    return {
      type: 'youtube',
      url: trimmedUrl,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
      videoId: youtubeId,
      isValid: true,
    };
  }

  // Check if it's a Google Drive URL
  const driveId = extractGoogleDriveId(trimmedUrl);
  if (driveId) {
    const embedUrl = convertGoogleDriveToEmbed(trimmedUrl);
    return {
      type: 'google-drive',
      url: trimmedUrl,
      embedUrl: embedUrl || undefined,
      videoId: driveId,
      isValid: true,
    };
  }

  // Check if it's a direct video URL (ends with common video extensions)
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v'];
  try {
    const urlObj = new URL(trimmedUrl);
    const pathname = urlObj.pathname.toLowerCase();
    const isDirectVideo = videoExtensions.some(ext => pathname.endsWith(ext));
    
    if (isDirectVideo) {
      return {
        type: 'direct',
        url: trimmedUrl,
        isValid: true,
      };
    }
  } catch (e) {
    // Invalid URL format
  }

  // Unknown URL type
  return {
    type: 'unknown',
    url: trimmedUrl,
    isValid: false,
    error: 'Unsupported URL format. Please provide a YouTube link, Google Drive link, or direct video URL.',
  };
}

/**
 * Validate if a URL is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * Validate if a URL is a valid Google Drive URL
 */
export function isValidGoogleDriveUrl(url: string): boolean {
  return extractGoogleDriveId(url) !== null;
}

/**
 * Get embed URL for a video (works for YouTube and Google Drive)
 */
export function getEmbedUrl(url: string): string | null {
  const parsed = parseVideoUrl(url);
  return parsed.embedUrl || null;
}

/**
 * Check if URL needs to be converted (e.g., Google Drive view link to embed)
 */
export function needsConversion(url: string): boolean {
  const parsed = parseVideoUrl(url);
  return parsed.type === 'google-drive' && !url.includes('/preview');
}

/**
 * Convert URL to best format for embedding/display
 */
export function convertToBestFormat(url: string): string {
  const parsed = parseVideoUrl(url);
  
  if (parsed.type === 'google-drive' && parsed.embedUrl) {
    return parsed.embedUrl;
  }
  
  return parsed.url;
}

