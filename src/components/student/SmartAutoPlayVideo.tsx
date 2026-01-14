'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon } from '@heroicons/react/24/outline';
import { getVideoUrl } from '@/lib/videoUtils';
import { parseVideoUrl, getEmbedUrl } from '@/lib/urlUtils';

interface SmartAutoPlayVideoProps {
  videoUrl: string;
  title?: string;
  onPlay?: () => void;
  className?: string;
}

/**
 * Smart Auto-Play Video Component
 * 
 * Features:
 * - Preloads metadata only (minimal data usage)
 * - Auto-plays on good connections (WiFi/4G) when in view
 * - Muted auto-play for better UX
 * - Click to unmute and play with sound
 * - Hover to preload full video
 * - Intersection Observer for viewport detection
 */
const SmartAutoPlayVideo: React.FC<SmartAutoPlayVideoProps> = ({
  videoUrl,
  title,
  onPlay,
  className = ''
}) => {
  const [preload, setPreload] = useState<'none' | 'metadata' | 'auto'>('metadata');
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout>();

  const videoUrlInfo = videoUrl ? parseVideoUrl(videoUrl) : null;
  const isYouTube = videoUrlInfo?.type === 'youtube';
  const videoId = isYouTube ? videoUrlInfo?.videoId || null : null;
  const embedUrl = videoUrlInfo?.embedUrl || null;

  // Check connection quality
  useEffect(() => {
    const checkConnection = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      if (connection) {
        // Auto-play only on WiFi or 4G
        const goodConnection = 
          connection.effectiveType === '4g' || 
          connection.type === 'wifi' ||
          connection.type === 'ethernet';
        
        setShouldAutoPlay(goodConnection);
        console.log('📶 Connection type:', connection.effectiveType || connection.type, '- Auto-play:', goodConnection);
      } else {
        // If we can't detect connection, assume it's good (desktop)
        setShouldAutoPlay(true);
      }
    };

    checkConnection();

    // Listen for connection changes
    const connection = (navigator as any).connection;
    if (connection && typeof connection.addEventListener === 'function') {
      connection.addEventListener('change', checkConnection);
      return () => connection.removeEventListener('change', checkConnection);
    }
  }, []);

  // Intersection Observer for viewport detection
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
          
          // If video comes into view and we haven't auto-played yet
          if (entry.isIntersecting && shouldAutoPlay && !hasAutoPlayed && !isYouTube) {
            // Wait 2 seconds before auto-playing
            autoPlayTimeoutRef.current = setTimeout(() => {
              handleAutoPlay();
            }, 2000);
          } else if (!entry.isIntersecting) {
            // Clear timeout if video leaves viewport
            if (autoPlayTimeoutRef.current) {
              clearTimeout(autoPlayTimeoutRef.current);
            }
            // Pause video if it leaves viewport
            if (videoRef.current && isPlaying) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      {
        threshold: 0.5, // 50% of video must be visible
        rootMargin: '0px'
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
    };
  }, [shouldAutoPlay, hasAutoPlayed, isPlaying, isYouTube]);

  const handleAutoPlay = async () => {
    if (!videoRef.current || hasAutoPlayed || isYouTube) return;

    try {
      // Ensure video is muted for auto-play
      videoRef.current.muted = true;
      await videoRef.current.play();
      setIsPlaying(true);
      setHasAutoPlayed(true);
      setShowPlayButton(false);
      if (onPlay) onPlay();
    } catch (error) {
      console.log('Auto-play prevented:', error);
      // Auto-play was prevented, show play button
      setShowPlayButton(true);
    }
  };

  const handleManualPlay = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        await videoRef.current.play();
        setIsPlaying(true);
        setShowPlayButton(false);
        if (onPlay) onPlay();
      }
    } catch (error) {
      console.error('Play error:', error);
    }
  };

  const handleUnmute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = false;
    setIsMuted(false);
  };

  const handleMouseEnter = () => {
    // Preload full video on hover for instant playback
    if (preload === 'metadata') {
      setPreload('auto');
    }
  };

  // For YouTube videos, use thumbnail with click-to-play
  if (isYouTube && videoId && embedUrl) {
    return (
      <div 
        ref={containerRef}
        className={`relative w-full h-full group cursor-pointer ${className}`}
        onClick={(e) => {
          const iframe = document.createElement('iframe');
          iframe.src = `${embedUrl}?autoplay=1&controls=1&rel=0&modestbranding=1`;
          iframe.className = 'w-full h-full';
          iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
          iframe.allowFullscreen = true;
          iframe.title = title || 'Video';
          e.currentTarget.replaceWith(iframe);
          if (onPlay) onPlay();
        }}
      >
        <img
          src={imageError 
            ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
          }
          alt={title || 'Video'}
          className="w-full h-full object-cover"
          onError={() => {
            if (!imageError) {
              setImageError(true);
            }
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <PlayIcon className="w-8 h-8 text-white ml-1" fill="currentColor" />
          </div>
        </div>
        {/* Connection indicator */}
        {shouldAutoPlay && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            📶 Good connection
          </div>
        )}
      </div>
    );
  }

  // For direct video files, use smart auto-play
  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full ${className}`}
      onMouseEnter={handleMouseEnter}
    >
      <video
        ref={videoRef}
        src={getVideoUrl(videoUrl)}
        className="w-full h-full object-contain"
        preload={preload}
        playsInline
        muted={isMuted}
        loop
        onClick={handleManualPlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Play button overlay */}
      {showPlayButton && !isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black bg-opacity-20 hover:bg-opacity-30 transition-all"
          onClick={handleManualPlay}
        >
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
            <PlayIcon className="w-8 h-8 text-white ml-1" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Unmute button (shows when video is playing but muted) */}
      {isPlaying && isMuted && (
        <button
          onClick={handleUnmute}
          className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm hover:bg-opacity-90 transition-all flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
          <span>Tap to unmute</span>
        </button>
      )}

      {/* Auto-play indicator */}
      {shouldAutoPlay && isInView && !hasAutoPlayed && !isPlaying && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
          📶 Auto-playing...
        </div>
      )}

      {/* Data saver indicator */}
      {!shouldAutoPlay && (
        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
          💾 Data saver on
        </div>
      )}
    </div>
  );
};

export default SmartAutoPlayVideo;
