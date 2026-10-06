'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getVideoUrl } from '@/lib/videoUtils';

interface GradingVideoProps {
  submissionId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  studentName?: string;
  isYouTube: boolean;
  isGoogleDrive: boolean;
  videoId: string | null;
  embedUrl: string | null;
}

/**
 * Video player for the bulk grading screen that STOPS playback when it scrolls out of view.
 *
 * On the grading screen an instructor often starts a video, then scrolls down to the next
 * student — previously the video kept playing (and audio kept going) off-screen. This wraps
 * the player in an IntersectionObserver:
 *  - native <video>: paused when it leaves the viewport.
 *  - YouTube / Google Drive <iframe>: there's no cross-origin pause API, so we unmount the
 *    iframe (clear its src) when it scrolls away, which reliably stops playback. It remounts
 *    (showing the thumbnail / a tap-to-load poster) when scrolled back into view.
 */
const GradingVideo: React.FC<GradingVideoProps> = ({
  submissionId,
  videoUrl,
  thumbnailUrl,
  studentName,
  isYouTube,
  isGoogleDrive,
  videoId,
  embedUrl,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(true);

  const poster = thumbnailUrl && !thumbnailUrl.includes('placeholder') ? thumbnailUrl : undefined;
  const isIframe = (isYouTube && videoId && embedUrl) || (isGoogleDrive && embedUrl);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // "Out of view" once less than ~35% of the player is visible.
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.35;
        setInView(visible);
        if (!visible && videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      },
      { threshold: [0, 0.35, 1] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-lg overflow-hidden"
      style={{ aspectRatio: '16/9', maxHeight: '280px' }}
    >
      {isIframe ? (
        inView ? (
          <iframe
            // Key by submission so React fully remounts (and reloads) per card.
            key={submissionId}
            src={embedUrl!}
            className="w-full h-full"
            allow={isYouTube ? 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture' : 'autoplay'}
            allowFullScreen
            title={`${studentName || 'Student'}'s video`}
          />
        ) : (
          // Off-screen: iframe unmounted (playback stopped). Show a lightweight placeholder.
          <div className="w-full h-full flex items-center justify-center bg-black">
            {isYouTube && videoId ? (
              <img
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt=""
                className="w-full h-full object-cover opacity-70"
              />
            ) : (
              <span className="text-white/50 text-xs">Scroll up to play</span>
            )}
          </div>
        )
      ) : (
        <video
          ref={videoRef}
          key={submissionId}
          src={getVideoUrl(videoUrl)}
          poster={poster}
          className="w-full h-full object-contain"
          controls
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
        />
      )}
    </div>
  );
};

export default GradingVideo;
