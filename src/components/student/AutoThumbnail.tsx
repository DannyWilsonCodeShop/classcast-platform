'use client';

import React, { useRef, useState, useEffect } from 'react';

interface AutoThumbnailProps {
  videoUrl: string;
  submissionId: string;
  existingThumbnail?: string | null;
  className?: string;
}

/**
 * Auto-generates and persists a thumbnail for videos that don't have one.
 * Uses a hidden video element + canvas to capture a frame at 2 seconds.
 * Saves the generated thumbnail to S3 and updates the submission record.
 */
export function AutoThumbnail({ videoUrl, submissionId, existingThumbnail, className = '' }: AutoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(existingThumbnail || null);
  const [generating, setGenerating] = useState(false);
  const [attempted, setAttempted] = useState(false);

  // If there's already a thumbnail, just show it
  useEffect(() => {
    if (existingThumbnail) {
      setThumbnail(existingThumbnail);
    }
  }, [existingThumbnail]);

  // Auto-generate if no thumbnail exists
  useEffect(() => {
    if (thumbnail || attempted || !videoUrl || generating) return;
    // Skip YouTube URLs (they have their own thumbnails)
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) return;
    // Skip Google Drive
    if (videoUrl.includes('drive.google')) return;

    setAttempted(true);
    generateAndSave();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl, thumbnail, attempted]);

  const generateAndSave = async () => {
    setGenerating(true);
    try {
      const dataUrl = await captureFrame(videoUrl);
      if (dataUrl) {
        setThumbnail(dataUrl);
        // Save to S3 in the background
        saveThumbnail(dataUrl, submissionId);
      }
    } catch {} finally {
      setGenerating(false);
    }
  };

  const captureFrame = (src: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.src = src;

      video.onloadeddata = () => {
        video.currentTime = Math.min(2, video.duration * 0.1);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(video.videoWidth || 640, 640);
          canvas.height = Math.round(canvas.width * ((video.videoHeight || 360) / (video.videoWidth || 640)));
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
        video.src = '';
      };

      video.onerror = () => resolve(null);
      setTimeout(() => resolve(null), 8000);
    });
  };

  const saveThumbnail = async (dataUrl: string, subId: string) => {
    try {
      // Upload thumbnail to S3
      const res = await fetch('/api/upload/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, userId: 'auto-gen', submissionId: subId }),
      });
      if (res.ok) {
        const data = await res.json();
        const url = data.url || data.thumbnailUrl;
        if (url) {
          setThumbnail(url);
          // Update submission record with thumbnail URL
          await fetch(`/api/video-submissions/${subId}/thumbnail`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ thumbnailUrl: url }),
          });
        }
      }
    } catch {} // Best effort — don't break the UI
  };

  if (thumbnail) {
    return <img src={thumbnail} alt="" className={`object-cover ${className}`} />;
  }

  // Show the video element as a fallback (preload metadata shows first frame)
  return (
    <video
      ref={videoRef}
      src={videoUrl}
      muted
      playsInline
      preload="metadata"
      className={`object-cover ${className}`}
      onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 2; }}
    />
  );
}
