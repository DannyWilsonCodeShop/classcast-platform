'use client';

import React from 'react';

interface AvatarProps {
  user?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  } | null;
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
  onClick?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({ 
  user, 
  src,
  name,
  size = 'md', 
  className = '', 
  showBorder = false,
  onClick 
}) => {
  // Support both user object and src/name props
  const avatarUrl = src || user?.avatar;
  const displayName = name || (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '');
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-24 h-24 text-6xl'
  };

  const emojiSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-3xl',
    xl: 'text-6xl'
  };

  const getInitials = () => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
      }
      return name.charAt(0).toUpperCase();
    }
    if (!user) return 'U';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const isEmoji = (str: string) => {
    // Consider it an emoji if it contains at least one emoji code point.
    // Many emojis are multi-codepoint (skin tone, flags), so avoid strict length checks.
    if (!str) return false;
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    return emojiRegex.test(str) && !isImageUrl(str);
  };

  const isImageUrl = (str: string) => {
    return str.startsWith('http') || str.startsWith('data:') || str.startsWith('/');
  };

  // Fallback when there's no uploaded picture: a grey person silhouette (not a blue circle).
  const silhouette = (
    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
      <svg className="w-3/4 h-3/4 text-gray-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" />
      </svg>
    </div>
  );

  const renderAvatar = () => {
    if (!avatarUrl && !user) {
      return silhouette;
    }

    // Check if we have a valid profile picture
    const hasProfilePicture = avatarUrl && 
      (isImageUrl(avatarUrl) || isEmoji(avatarUrl)) && 
      avatarUrl !== '/api/placeholder/40/40' && 
      avatarUrl !== '/api/placeholder/80/80' &&
      !avatarUrl.includes('placeholder');

    if (hasProfilePicture && avatarUrl) {
      // Check if it's an emoji
      if (isEmoji(avatarUrl)) {
        return (
          <div className="w-full h-full bg-blue-50 flex items-center justify-center">
            <span className={emojiSizeClasses[size]}>{avatarUrl}</span>
          </div>
        );
      }
      
      // Check if it's an image URL
      if (isImageUrl(avatarUrl)) {
        // Handle S3 URLs with proxy for CORS
        const imageSrc = avatarUrl.includes('s3.amazonaws.com') || avatarUrl.includes('s3.') 
          ? `/api/avatar-proxy?url=${encodeURIComponent(avatarUrl)}`
          : avatarUrl;
          
        return (
          <img
            src={imageSrc}
            alt={displayName || 'User avatar'}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to the grey silhouette if the image fails to load.
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<div class="w-full h-full bg-gray-200 flex items-center justify-center"><svg class="w-3/4 h-3/4" style="color:#9ca3af" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z"/></svg></div>`;
              }
            }}
          />
        );
      }
    }

    // No profile picture set → grey silhouette.
    return silhouette;
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full overflow-hidden flex-shrink-0
        ${showBorder ? 'border-4 border-white shadow-lg' : ''}
        ${onClick ? 'cursor-pointer hover:scale-110 transition-all duration-200' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {renderAvatar()}
    </div>
  );
};

export default Avatar;
