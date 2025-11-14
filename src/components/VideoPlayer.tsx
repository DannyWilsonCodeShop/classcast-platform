'use client';

import { getEmbedUrl, parseVideoUrl } from '@/lib/urlUtils';

interface VideoPlayerProps {
  videoUrl: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  autoplay?: boolean;
  controls?: boolean;
}

/**
 * Video Player Component
 * Handles YouTube, Google Drive, and direct video URLs
 * Automatically embeds videos in the appropriate format
 */
export function VideoPlayer({
  videoUrl,
  width = '100%',
  height = 315,
  className = '',
  autoplay = false,
  controls = true,
}: VideoPlayerProps) {
  if (!videoUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded ${className}`} style={{ width, height }}>
        <p className="text-gray-500">No video URL provided</p>
      </div>
    );
  }

  const parsed = parseVideoUrl(videoUrl);
  const embedUrl = getEmbedUrl(videoUrl);

  // YouTube or Google Drive - use iframe
  if ((parsed.type === 'youtube' || parsed.type === 'google-drive') && embedUrl) {
    const iframeSrc = autoplay 
      ? `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`
      : embedUrl;

    return (
      <div className={className} style={{ width, height }}>
        <iframe
          src={iframeSrc}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded"
        />
      </div>
    );
  }

  // Direct video URL - use HTML5 video element
  if (parsed.type === 'direct') {
    return (
      <div className={className} style={{ width, height }}>
        <video
          controls={controls}
          autoPlay={autoplay}
          width="100%"
          height="100%"
          className="rounded"
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          <source src={videoUrl} type="video/ogg" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Unknown or invalid URL
  return (
    <div className={`flex items-center justify-center bg-gray-100 rounded ${className}`} style={{ width, height }}>
      <div className="text-center p-4">
        <p className="text-red-600 font-medium">Unable to load video</p>
        <p className="text-sm text-gray-500 mt-1">
          {parsed.error || 'Unsupported video format'}
        </p>
        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm mt-2 inline-block"
          >
            Open video in new tab
          </a>
        )}
      </div>
    </div>
  );
}

