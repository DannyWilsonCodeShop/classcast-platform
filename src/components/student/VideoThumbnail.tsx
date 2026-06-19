'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon } from '@heroicons/react/24/solid';

interface VideoThumbnailProps {
  videoUrl: string;
  title?: string;
  authorName?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Standardized Video Thumbnail Component
 * 
 * Displays a static thumbnail for videos with a consistent look:
 * - Extracts a frame from the video (2 seconds in) using canvas
 * - Composites the frame over a branded background
 * - Adds a white outline/border for consistency
 * - Shows a play button overlay
 * - No data usage for auto-play — just a static image
 */
const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  videoUrl,
  title,
  authorName,
  onClick,
  className = '',
}) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Default branded thumbnails to alternate between
  const BRANDED_THUMBNAILS = [
    '/StudentFiles/ChatGPT Image Jun 17, 2026, 06_55_15 PM (1).png',
    '/StudentFiles/ChatGPT Image Jun 17, 2026, 06_55_16 PM (2).png',
  ];

  // For YouTube videos, use their thumbnail API directly
  const getYouTubeThumbnail = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    }
    return null;
  };

  useEffect(() => {
    if (!videoUrl) {
      // Use branded thumbnail as fallback
      const index = Math.abs(videoUrl?.length || 0) % BRANDED_THUMBNAILS.length;
      setThumbnailUrl(BRANDED_THUMBNAILS[index]);
      setIsLoading(false);
      return;
    }

    // YouTube: use their thumbnail
    const ytThumb = getYouTubeThumbnail(videoUrl);
    if (ytThumb) {
      setThumbnailUrl(ytThumb);
      setIsLoading(false);
      return;
    }

    // For all other videos: use branded thumbnail (no data-heavy frame extraction)
    const index = Math.abs(videoUrl.length) % BRANDED_THUMBNAILS.length;
    setThumbnailUrl(BRANDED_THUMBNAILS[index]);
    setIsLoading(false);
  }, [videoUrl]);

  // Get initials for fallback
  const initials = authorName
    ? authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : '🎥';

  return (
    <div
      className={`relative overflow-hidden rounded-lg cursor-pointer group ${className}`}
      style={{ aspectRatio: '16/9' }}
      onClick={onClick}
    >
      {/* Thumbnail image */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={title || 'Video thumbnail'}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <span className="text-white text-2xl">{initials}</span>
        </div>
      )}

      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-xl">
          <PlayIcon className="w-6 h-6 text-[#005587] ml-0.5" />
        </div>
      </div>

      {/* Author name overlay at bottom */}
      {authorName && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <p className="text-white text-xs font-medium truncate">{authorName}</p>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default VideoThumbnail;
