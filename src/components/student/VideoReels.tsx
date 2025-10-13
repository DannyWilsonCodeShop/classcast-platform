'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, Heart, MessageCircle, Share, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient, { VideoReel } from '@/lib/api';

interface VideoReelsProps {
  className?: string;
}

const VideoReels: React.FC<VideoReelsProps> = ({ className = '' }) => {
  const [reels, setReels] = useState<VideoReel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  // Load video reels
  const loadVideoReels = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/student/community/submissions', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const rawReels = await response.json();
        console.log('📦 Loaded raw reels:', rawReels.length);
        
        // Transform API response to match VideoReel interface
        const transformedReels: VideoReel[] = rawReels.map((reel: any) => ({
          id: reel.id || reel.submissionId,
          title: reel.videoTitle || reel.title || 'Video Submission',
          description: reel.videoDescription || reel.description || '',
          thumbnail: reel.thumbnailUrl || '/api/placeholder/400/300',
          videoUrl: reel.videoUrl,
          duration: reel.duration || 0,
          assignmentId: reel.assignmentId,
          author: {
            id: reel.studentId,
            name: reel.studentName || 'Unknown Author',
            avatar: reel.studentAvatar || '/api/placeholder/40/40',
            course: reel.courseName || 'Unknown Course'
          },
          likes: reel.likes || 0,
          comments: reel.comments?.length || 0,
          isLiked: reel.likedBy?.includes(user?.id || '') || false,
          createdAt: reel.submittedAt || new Date().toISOString(),
          courseId: reel.courseId || ''
        }));
        
        console.log('📦 Transformed reels:', transformedReels.length);
        setReels(transformedReels);
        
        // Initialize liked videos
        const liked = new Set<string>();
        transformedReels.forEach((reel: VideoReel) => {
          if (reel.isLiked) {
            liked.add(reel.id);
          }
        });
        setLikedVideos(liked);
      }
    } catch (error) {
      console.error('Error loading video reels:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideoReels();
  }, [loadVideoReels]);

  // Auto-play current video
  useEffect(() => {
    if (reels.length > 0 && currentIndex < reels.length) {
      const currentVideo = videoRefs.current[currentIndex];
      if (currentVideo) {
        currentVideo.currentTime = 2.0; // Start at 2 seconds for better preview
        currentVideo.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.log('Autoplay prevented:', error);
          setIsPlaying(false);
        });
      }
    }
  }, [currentIndex, reels.length]);

  // Pause all other videos
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentIndex) {
        video.pause();
      }
    });
  }, [currentIndex]);

  const handleVideoClick = (reel: VideoReel & { assignmentId?: string }) => {
    // Navigate to peer reviews page with this video
    const url = `/student/peer-reviews?assignmentId=${reel.assignmentId || 'unknown'}&videoId=${reel.id}`;
    router.push(url);
  };

  const handleLike = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updatedVideo = await apiClient.likeVideo(videoId);
      if (updatedVideo) {
        setReels(prev => prev.map(r => 
          r.id === videoId ? {
            ...updatedVideo,
            author: r.author // Preserve author info
          } : r
        ));
        
        // Update liked state
        setLikedVideos(prev => {
          const newSet = new Set(prev);
          if (updatedVideo.isLiked) {
            newSet.add(videoId);
          } else {
            newSet.delete(videoId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleVideoLoad = (index: number) => {
    const video = videoRefs.current[index];
    if (video && index === currentIndex) {
      video.currentTime = 2.0;
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const handleVideoError = (index: number) => {
    console.error('Video failed to load:', reels[index]?.id);
  };

  const navigateToVideo = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (direction === 'next' && currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      navigateToVideo('next');
    } else {
      navigateToVideo('prev');
    }
  };

  if (isLoading) {
    return (
      <div className={`w-full bg-gray-100 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
                </div>
              </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className={`w-full bg-gray-100 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-2">🎥</div>
          <p className="text-gray-600 text-sm">No videos</p>
          <p className="text-gray-500 text-xs">Check back later</p>
        </div>
      </div>
    );
  }

  const currentReel = reels[currentIndex];

  return (
    <div 
      ref={containerRef}
      className={`relative w-full bg-black rounded-xl overflow-hidden cursor-pointer group ${className}`}
      onWheel={handleWheel}
      onClick={() => handleVideoClick(currentReel)}
    >
      {/* Video Player */}
      <video
        ref={(el) => {
          videoRefs.current[currentIndex] = el;
        }}
        className="w-full h-full object-cover"
        muted
        loop
        playsInline
        preload="metadata"
        onLoadedData={() => handleVideoLoad(currentIndex)}
        onError={() => handleVideoError(currentIndex)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src={currentReel.videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigateToVideo('prev');
          }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all duration-200 opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}

      {currentIndex < reels.length - 1 && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            navigateToVideo('next');
          }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all duration-200 opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Video Info Overlay - Mobile Optimized */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
        <div className="flex items-start justify-between">
          {/* Left Side - Video Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold mb-1 truncate">
              {currentReel.title}
            </h3>
            <div className="flex items-center space-x-2 mb-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentReel.author?.id) {
                    router.push(`/student/profile/${currentReel.author.id}`);
                  }
                }}
                className="flex items-center space-x-1 sm:space-x-2 hover:opacity-80 transition-opacity"
              >
                <img
                  src={currentReel.author?.avatar || '/api/placeholder/20/20'}
                  alt={currentReel.author?.name || 'Unknown Author'}
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/api/placeholder/20/20';
                  }}
                />
                <span className="text-xs sm:text-sm font-medium">
                  {currentReel.author?.name || 'Unknown Author'}
                </span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 line-clamp-1 sm:line-clamp-2">
              {currentReel.description}
            </p>
              </div>

          {/* Right Side - Actions - Mobile Optimized */}
          <div className="flex flex-col items-center space-y-2 sm:space-y-3 ml-2 sm:ml-4">
                  <button
              onClick={(e) => handleLike(currentReel.id, e)}
              className={`p-2 sm:p-3 rounded-full transition-all duration-200 ${
                likedVideos.has(currentReel.id)
                  ? 'bg-red-500 text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${likedVideos.has(currentReel.id) ? 'fill-current' : ''}`} />
                  </button>
            <span className="text-xs text-white">
              {currentReel.likes || 0}
            </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                // Navigate to comments/peer reviews
                handleVideoClick(currentReel);
                    }}
              className="p-2 sm:p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-all duration-200"
                  >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
            <span className="text-xs text-white">
              {currentReel.comments || 0}
            </span>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                // Share functionality
                if (navigator.share) {
                  navigator.share({
                    title: currentReel.title,
                    url: window.location.href,
                  });
                }
              }}
              className="p-2 sm:p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-all duration-200"
            >
              <Share className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
      </div>
      
      {/* Play/Pause Button - Mobile Optimized */}
              <button
        onClick={(e) => {
          e.stopPropagation();
          const video = videoRefs.current[currentIndex];
          if (video) {
            if (isPlaying) {
              video.pause();
            } else {
              video.play();
            }
          }
        }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 sm:p-3 transition-all duration-200 opacity-0 group-hover:opacity-100"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        ) : (
          <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        )}
                </button>

      {/* Video Counter - Mobile Optimized */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
        <span className="text-white text-xs sm:text-sm font-medium">
          {currentIndex + 1} / {reels.length}
        </span>
            </div>

      {/* Progress Dots - Mobile Optimized */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-2">
        {reels.map((_, index) => (
                    <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(index);
            }}
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-200 ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
          />
                  ))}
                </div>
    </div>
  );
};

export default VideoReels;