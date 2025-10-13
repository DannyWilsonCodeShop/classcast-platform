import React from 'react';
import { getYouTubeEmbedUrl } from '@/lib/youtube';

interface YouTubePlayerProps {
  url: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  controls?: boolean;
  width?: string | number;
  height?: string | number;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  url,
  title = 'YouTube Video',
  className = '',
  autoplay = false,
  controls = true,
  width = '100%',
  height = '100%'
}) => {
  const embedUrl = getYouTubeEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center p-8 rounded-lg ${className}`}>
        <div className="text-center">
          <p className="text-gray-600 mb-2">⚠️ Invalid YouTube URL</p>
          <p className="text-sm text-gray-500">Could not load video</p>
        </div>
      </div>
    );
  }

  // Build URL with parameters
  const params = new URLSearchParams();
  if (autoplay) params.append('autoplay', '1');
  if (!controls) params.append('controls', '0');
  params.append('rel', '0'); // Don't show related videos
  params.append('modestbranding', '1'); // Minimal YouTube branding

  const finalUrl = `${embedUrl}?${params.toString()}`;

  return (
    <div className={className} style={{ width, height }}>
      <iframe
        src={finalUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full rounded-lg"
        style={{ border: 'none' }}
      />
    </div>
  );
};

export default YouTubePlayer;

