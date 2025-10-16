'use client';

import React, { useEffect, useRef } from 'react';
import { extractYouTubeVideoId } from '@/lib/youtube';

interface YouTubePlayerProps {
  url: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  controls?: boolean;
  width?: string | number;
  height?: string | number;
  playbackSpeed?: number; // NEW: Support for playback speed
  onPlayerReady?: (player: any) => void; // NEW: Callback when player is ready
}

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  url,
  title = 'YouTube Video',
  className = '',
  autoplay = false,
  controls = true,
  width = '100%',
  height = '100%',
  playbackSpeed = 1.0,
  onPlayerReady
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const videoId = extractYouTubeVideoId(url);

  useEffect(() => {
    if (!videoId) return;

    // Load YouTube IFrame API script if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // Wait for API to load
      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    } else {
      initializePlayer();
    }

    function initializePlayer() {
      if (!containerRef.current || playerRef.current) return;

      // Create a unique div for this player instance
      const playerId = `youtube-player-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const playerDiv = document.createElement('div');
      playerDiv.id = playerId;
      containerRef.current.appendChild(playerDiv);

      playerRef.current = new window.YT.Player(playerId, {
        videoId: videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          controls: controls ? 1 : 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin // Add origin for CORS
        },
        events: {
          onReady: (event: any) => {
            console.log('✅ YouTube player ready, setting speed to:', playbackSpeed);
            try {
              event.target.setPlaybackRate(playbackSpeed);
            } catch (err) {
              console.warn('Could not set initial playback rate:', err);
            }
            if (onPlayerReady) {
              onPlayerReady(event.target);
            }
          },
          onError: (event: any) => {
            console.error('YouTube player error code:', event.data);
            // Error codes: 2 = Invalid video ID, 5 = HTML5 player error, 100 = Video not found, 101/150 = Embedding disabled
          },
          onStateChange: (event: any) => {
            // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
            console.log('YouTube player state changed:', event.data);
          }
        }
      });
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          console.warn('Error destroying YouTube player:', err);
        }
        playerRef.current = null;
      }
    };
  }, [videoId, autoplay, controls]);

  // Update playback speed when it changes
  useEffect(() => {
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      try {
        playerRef.current.setPlaybackRate(playbackSpeed);
        console.log('📺 YouTube playback speed updated to:', playbackSpeed);
      } catch (err) {
        console.warn('Could not set playback speed:', err);
      }
    }
  }, [playbackSpeed]);

  if (!videoId) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center p-8 rounded-lg ${className}`}>
        <div className="text-center">
          <p className="text-gray-600 mb-2">⚠️ Invalid YouTube URL</p>
          <p className="text-sm text-gray-500">Could not load video</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={className} 
      style={{ width, height }}
    />
  );
};

export default YouTubePlayer;

