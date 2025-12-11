/**
 * Lazy-loading video player component for optimal performance
 * Only loads videos when they're about to be viewed
 */

import React, { useState, useRef, useEffect } from 'react';
import { getVideoUrl } from '@/lib/videoUtils';
import { getYouTubeEmbedUrl, isValidYouTubeUrl } from '@/lib/youtube';
import { getGoogleDrivePreviewUrl, isValidGoogleDriveUrl } from '@/lib/googleDrive';

interface LazyVideoPlayerProps {
  videoUrl: string;
  studentName: string;
  submissionId: string;
  loadingStrategy: 'immediate' | 'priority' | 'normal' | 'lazy';
  thumbnailUrl?: string;
  onLoad?: () => void;
}

export const LazyVideoPlayer: React.FC<LazyVideoPlayerProps> = ({
  videoUrl,
  studentName,
  submissionId,
  loadingStrategy,
  thumbnailUrl,
  onLoad
}) => {
  const [isLoaded, setIsLoaded] = useState(loadingStrategy === 'immediate');
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loadingStrategy === 'immediate') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          
          // Load based on strategy
          const loadDelay = {
            priority: 0,
            normal: 500,
            lazy: 1000
          }[loadingStrategy] || 1000;

          setTimeout(() => {
            setIsLoaded(true);
            onLoad?.();
          }, loadDelay);
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [loadingStrategy, onLoad]);

  // Render placeholder while not loaded
  if (!isLoaded) {
    return (
      <div 
        ref={containerRef}
        className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden"
      >
        {/* Loading placeholder with student info */}
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🎥</div>
          <div className="text-lg font-semibold text-gray-700 mb-1">{studentName}</div>
          <div className="text-sm text-gray-500">
            {loadingStrategy === 'priority' ? 'Loading...' : 'Scroll to load video'}
          </div>
          
          {/* Loading indicator for priority videos */}
          {(loadingStrategy === 'priority' || isInView) && (
            <div className="mt-3">
              <div className="inline-flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Performance hint */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {loadingStrategy === 'immediate' ? '⚡ Priority' : 
           loadingStrategy === 'priority' ? '🚀 Fast' :
           loadingStrategy === 'normal' ? '📱 Normal' : '💤 Lazy'}
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="w-full h-96 bg-gradient-to-br from-red-50 to-red-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">❌</div>
          <div className="text-lg font-semibold text-red-700 mb-1">Video Load Error</div>
          <div className="text-sm text-red-600">{studentName}</div>
          <button 
            onClick={() => {
              setHasError(false);
              setIsLoaded(false);
              setTimeout(() => setIsLoaded(true), 100);
            }}
            className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render actual video based on type
  return (
    <div className="w-full h-96 bg-black rounded-lg overflow-hidden relative">
      {/* YouTube Video */}
      {isValidYouTubeUrl(videoUrl) ? (
        <div className="relative w-full h-full">
          <iframe
            src={getYouTubeEmbedUrl(videoUrl) || videoUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={() => setHasError(true)}
          />
          {/* YouTube branding overlay */}
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium opacity-75">
            ▶️ YouTube
          </div>
        </div>
      ) : isValidGoogleDriveUrl(videoUrl) ? (
        /* Google Drive Video */
        <div className="relative w-full h-full">
          <iframe
            src={getGoogleDrivePreviewUrl(videoUrl) || videoUrl}
            className="w-full h-full"
            allow="autoplay"
            allowFullScreen
            onError={() => setHasError(true)}
          />
          {/* Google Drive branding overlay */}
          <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium opacity-75">
            📁 Drive
          </div>
        </div>
      ) : (
        /* Regular Video (S3, etc.) */
        <div className="relative w-full h-full">
          <video
            src={getVideoUrl(videoUrl)}
            className="w-full h-full object-contain"
            controls
            preload={loadingStrategy === 'immediate' ? 'metadata' : 'none'}
            poster={thumbnailUrl && 
                   thumbnailUrl !== '/api/placeholder/300/200' && 
                   !thumbnailUrl.includes('placeholder') 
              ? thumbnailUrl 
              : undefined
            }
            onLoadedMetadata={(e) => {
              // Set video to 2 seconds for thumbnail if no poster
              const video = e.target as HTMLVideoElement;
              if (video.duration > 2) {
                video.currentTime = 2;
              }
            }}
            onError={() => setHasError(true)}
          >
            Your browser does not support the video tag.
          </video>
          
          {/* Custom thumbnail overlay for videos without valid thumbnails */}
          {(!thumbnailUrl || 
            thumbnailUrl === '/api/placeholder/300/200' || 
            thumbnailUrl.includes('placeholder')) && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center pointer-events-none">
              <div className="text-white text-center">
                <div className="text-4xl mb-2">🎥</div>
                <div className="text-lg font-semibold">{studentName}</div>
                <div className="text-sm opacity-75">Video Submission</div>
              </div>
            </div>
          )}
          
          {/* S3 branding overlay */}
          <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium opacity-75">
            ☁️ Upload
          </div>
        </div>
      )}

      {/* Loading strategy indicator */}
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
        {loadingStrategy === 'immediate' ? '⚡ Priority Load' : 
         loadingStrategy === 'priority' ? '🚀 Fast Load' :
         loadingStrategy === 'normal' ? '📱 Normal Load' : '💤 Lazy Load'}
      </div>
    </div>
  );
};