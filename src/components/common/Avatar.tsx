'use client';

import React from 'react';

interface AvatarProps {
  user: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
  onClick?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({ 
  user, 
  size = 'md', 
  className = '', 
  showBorder = false,
  onClick 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-24 h-24 text-6xl'
  };

  const getInitials = () => {
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const isEmoji = (str: string) => {
    // Check if the string is a single emoji
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    return emojiRegex.test(str) && str.length <= 2;
  };

  const isImageUrl = (str: string) => {
    return str.startsWith('http') || str.startsWith('data:') || str.startsWith('/');
  };

  const renderAvatar = () => {
    if (user.avatar) {
      // Check if it's an emoji
      if (isEmoji(user.avatar)) {
        return (
          <div className="w-full h-full bg-white flex items-center justify-center">
            {user.avatar}
          </div>
        );
      }
      
      // Check if it's an image URL
      if (isImageUrl(user.avatar)) {
        // Handle S3 URLs with proxy for CORS
        const imageSrc = user.avatar.includes('s3.amazonaws.com') || user.avatar.includes('s3.') 
          ? `/api/avatar-proxy?url=${encodeURIComponent(user.avatar)}`
          : user.avatar;
          
        return (
          <img
            src={imageSrc}
            alt={`${user.firstName} ${user.lastName}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<div class="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-bold">${getInitials()}</div>`;
              }
            }}
          />
        );
      }
      
      // If it's neither emoji nor image URL, treat as initials
      return (
        <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-bold">
          {user.avatar}
        </div>
      );
    }

    // Fallback to initials
    return (
      <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-bold">
        {getInitials()}
      </div>
    );
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
