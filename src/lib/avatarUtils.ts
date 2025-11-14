/**
 * Utility functions for handling avatar URLs
 */

/**
 * Get the proper avatar URL, using proxy for S3 URLs
 */
export function getAvatarUrl(avatarUrl: string | undefined | null, fallbackText?: string): string {
  if (!avatarUrl) {
    // Return placeholder with text if provided
    if (fallbackText) {
      return `/api/placeholder/40/40?text=${encodeURIComponent(fallbackText.charAt(0).toUpperCase())}`;
    }
    return '/api/placeholder/40/40';
  }

  // If it's already a placeholder URL, return as-is
  if (avatarUrl.startsWith('/api/placeholder')) {
    return avatarUrl;
  }

  // If it's an S3 URL, use direct access (S3 permissions are now fixed)
  if (avatarUrl.includes('amazonaws.com') || avatarUrl.includes('s3.')) {
    return avatarUrl; // Use direct S3 URL since permissions are fixed
  }

  // For other URLs (like data URLs or external URLs), return as-is
  return avatarUrl;
}

/**
 * Get avatar URL with size parameters
 */
export function getAvatarUrlWithSize(avatarUrl: string | undefined | null, size: number = 40, fallbackText?: string): string {
  if (!avatarUrl) {
    if (fallbackText) {
      return `/api/placeholder/${size}/${size}?text=${encodeURIComponent(fallbackText.charAt(0).toUpperCase())}`;
    }
    return `/api/placeholder/${size}/${size}`;
  }

  if (avatarUrl.startsWith('/api/placeholder')) {
    return avatarUrl;
  }

  if (avatarUrl.includes('amazonaws.com') || avatarUrl.includes('s3.')) {
    return avatarUrl; // Use direct S3 URL since permissions are fixed
  }

  return avatarUrl;
}
