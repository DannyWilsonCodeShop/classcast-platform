/**
 * YouTube URL utilities
 */

/**
 * Extract YouTube video ID from various URL formats
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/v/ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
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
 * Generate YouTube embed URL from video ID or full URL
 * Uses youtube-nocookie.com for better compatibility with school firewalls
 */
export function getYouTubeEmbedUrl(urlOrId: string, useNoCookie: boolean = true): string | null {
  // If it's already an embed URL, return it (but convert to nocookie if requested)
  if (urlOrId.includes('youtube.com/embed/') || urlOrId.includes('youtube-nocookie.com/embed/')) {
    if (useNoCookie && urlOrId.includes('youtube.com/embed/')) {
      return urlOrId.replace('youtube.com', 'youtube-nocookie.com');
    }
    return urlOrId;
  }

  // Extract video ID
  const videoId = urlOrId.includes('youtube.com') || urlOrId.includes('youtu.be')
    ? extractYouTubeVideoId(urlOrId)
    : urlOrId; // Assume it's already a video ID

  if (!videoId) return null;

  // Use youtube-nocookie.com domain for better firewall compatibility
  const domain = useNoCookie ? 'youtube-nocookie.com' : 'youtube.com';
  return `https://www.${domain}/embed/${videoId}`;
}

/**
 * Generate YouTube thumbnail URL from video ID or full URL
 */
export function getYouTubeThumbnail(urlOrId: string, quality: 'default' | 'hq' | 'mq' | 'sd' | 'maxres' = 'hq'): string | null {
  const videoId = urlOrId.includes('youtube.com') || urlOrId.includes('youtu.be')
    ? extractYouTubeVideoId(urlOrId)
    : urlOrId;

  if (!videoId) return null;

  const qualityMap = {
    'default': 'default.jpg',
    'mq': 'mqdefault.jpg',
    'hq': 'hqdefault.jpg',
    'sd': 'sddefault.jpg',
    'maxres': 'maxresdefault.jpg'
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`;
}

/**
 * Validate YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  if (!url) return false;

  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+/;
  return youtubeRegex.test(url);
}

/**
 * Get YouTube video URL from video ID
 */
export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

