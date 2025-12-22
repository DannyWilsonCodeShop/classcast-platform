/**
 * Google Drive video URL utilities
 */

/**
 * Detect if a URL is a Google Drive file link
 */
export function isValidGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  const normalized = url.trim();
  const drivePatterns = [
    /https?:\/\/drive\.google\.com\/file\/d\/[^/]+\/?(view|preview)?/i,
    /https?:\/\/drive\.google\.com\/open\?id=[^&]+/i,
    /https?:\/\/drive\.google\.com\/uc\?(export=download&)?id=[^&]+/i,
    /https?:\/\/drive\.google\.com\/uc\?id=[^&]+/i,
    /https?:\/\/drive\.google\.com\/folderview\?id=[^&]+/i,
  ];
  return drivePatterns.some((pattern) => pattern.test(normalized));
}

/**
 * Extract the Google Drive file ID from a share link
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;

  // /file/d/<id>/
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (fileMatch && fileMatch[1]) {
    return fileMatch[1];
  }

  // open?id=<id>
  const openMatch = url.match(/[?&]id=([^&]+)/i);
  if (openMatch && openMatch[1]) {
    return openMatch[1];
  }

  // uc?export=download&id=<id> or uc?id=<id>
  const ucMatch = url.match(/drive\.google\.com\/uc\?(?:export=download&)?id=([^&]+)/i);
  if (ucMatch && ucMatch[1]) {
    return ucMatch[1];
  }

  return null;
}

/**
 * Build the preview URL that can be embedded in an iframe
 */
export function getGoogleDrivePreviewUrl(urlOrId: string): string | null {
  const fileId = urlOrId.includes('drive.google.com')
    ? extractGoogleDriveFileId(urlOrId)
    : urlOrId;

  if (!fileId) return null;
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Build an embeddable URL for Google Drive videos (alternative approach)
 */
export function getGoogleDriveEmbedUrl(urlOrId: string): string | null {
  const fileId = urlOrId.includes('drive.google.com')
    ? extractGoogleDriveFileId(urlOrId)
    : urlOrId;

  if (!fileId) return null;
  // Try the embed endpoint which sometimes works better for videos
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/**
 * Build a direct download URL (if needed)
 */
export function getGoogleDriveDownloadUrl(urlOrId: string): string | null {
  const fileId = urlOrId.includes('drive.google.com')
    ? extractGoogleDriveFileId(urlOrId)
    : urlOrId;

  if (!fileId) return null;
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Get a thumbnail URL for a Google Drive video (best-effort)
 */
export function getGoogleDriveThumbnailUrl(urlOrId: string): string | null {
  const fileId = urlOrId.includes('drive.google.com')
    ? extractGoogleDriveFileId(urlOrId)
    : urlOrId;

  if (!fileId) return null;
  return `https://drive.google.com/thumbnail?id=${fileId}`;
}

/**
 * Normalize a Google Drive link into useful variants
 */
export function normalizeGoogleDriveUrl(url: string): {
  fileId: string | null;
  previewUrl: string | null;
  downloadUrl: string | null;
  thumbnailUrl: string | null;
} {
  const fileId = extractGoogleDriveFileId(url);
  return {
    fileId,
    previewUrl: fileId ? getGoogleDrivePreviewUrl(fileId) : null,
    downloadUrl: fileId ? getGoogleDriveDownloadUrl(fileId) : null,
    thumbnailUrl: fileId ? getGoogleDriveThumbnailUrl(fileId) : null,
  };
}



