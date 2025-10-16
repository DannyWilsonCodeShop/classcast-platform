'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, Heart, MessageCircle, Share, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient, { VideoReel } from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatarUtils';
import { getVideoUrl } from '@/lib/videoUtils';

interface VideoReelsProps {
  className?: string;
}

// Helper function to extract YouTube video ID
function extractYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Handle youtube.com/watch?v=... format
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    }
    // Handle youtu.be/... format
    if (urlObj.hostname === 'youtu.be') {
      // Extract video ID from pathname and strip any trailing query params
      const videoId = urlObj.pathname.substring(1).split('?')[0];
      return videoId || null;
    }
    return null;
  } catch {
    return null;
  }
}

const VideoReels: React.FC<VideoReelsProps> = ({ className = '' }) => {
  const [reels, setReels] = useState<VideoReel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [generatedThumbnails, setGeneratedThumbnails] = useState<Map<string, string>>(new Map());
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  // Generate thumbnail from 2-second mark
  const generateThumbnail = useCallback((video: HTMLVideoElement, videoId: string): Promise<string> => {
    return new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve('');
          return;
        }
        
        canvas.width = 400;
        canvas.height = 300;
        
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          console.log('🎬 Generated 2-second thumbnail for:', videoId);
          resolve(thumbnail);
        } catch (canvasError) {
          console.error('🎬 Canvas error generating thumbnail:', canvasError);
          resolve('');
        }
      } catch (error) {
        console.error('🎬 Error generating thumbnail:', error);
        resolve('');
      }
    });
  }, []);

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
        const transformedReels: VideoReel[] = rawReels.map((reel: any) => {
          console.log('🎬 Processing reel:', reel.id, 'videoTitle:', reel.videoTitle, 'assignmentTitle:', reel.assignmentTitle, 'studentAvatar:', reel.studentAvatar);
          console.log('🎬 Raw video URL:', reel.videoUrl, 'Type:', typeof reel.videoUrl);
          
          // Use assignment title if available, otherwise use video title, fallback to generic
          const displayTitle = reel.assignmentTitle || reel.videoTitle || reel.title || 'Video Submission';
          
          return {
            id: reel.id || reel.submissionId,
            title: displayTitle,
            description: reel.videoDescription || reel.description || '',
            thumbnail: reel.thumbnailUrl || '/api/placeholder/400/300',
            videoUrl: reel.videoUrl, // Store original URL, process in video element
            duration: reel.duration || 0,
            assignmentId: reel.assignmentId,
            author: {
              id: reel.studentId,
              name: reel.studentName || 'Unknown Author',
              avatar: getAvatarUrl(reel.studentAvatar, reel.studentName),
              course: reel.courseName || 'Unknown Course'
            },
            likes: reel.likes || 0,
            comments: reel.comments?.length || 0,
            isLiked: reel.likedBy?.includes(user?.id || '') || false,
            createdAt: reel.submittedAt || new Date().toISOString(),
            courseId: reel.courseId || ''
          };
        });
        
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

  // Auto-play current video and set up autoscroll
  useEffect(() => {
    if (reels.length > 0 && currentIndex < reels.length) {
      // Pause all videos first
      videoRefs.current.forEach((video, index) => {
        if (video && index !== currentIndex) {
          video.pause();
        }
      });

      const currentVideo = videoRefs.current[currentIndex];
      if (currentVideo) {
        console.log('🎬 Switching to video:', currentIndex, reels[currentIndex]?.title);
        
        // Safari-specific: Wait for video to be ready before attempting autoplay
        const attemptAutoplay = () => {
          if (currentVideo.readyState >= 3) { // HAVE_FUTURE_DATA - more reliable for Safari
            // Don't set currentTime immediately - let Safari handle it
            currentVideo.play().then(() => {
              setIsPlaying(true);
              
              // Track video view after successful play
              if (user?.id && reels[currentIndex]?.id) {
                fetch('/api/videos/track-view', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ 
                    videoId: reels[currentIndex].id,
                    userId: user.id 
                  })
                }).catch(error => {
                  console.error('Error tracking video view:', error);
                });
              }
              
              // Set up autoscroll timer
              if (autoScrollEnabled && currentIndex < reels.length - 1) {
                // Clear any existing timeout
                if (autoScrollTimeoutRef.current) {
                  clearTimeout(autoScrollTimeoutRef.current);
                }
                
                // Set new timeout for autoscroll (5 seconds)
                autoScrollTimeoutRef.current = setTimeout(() => {
                  console.log('⏭️ Auto-scrolling to next video:', currentIndex + 1);
                  setCurrentIndex(prev => {
                    // Ensure we don't go beyond array bounds
                    const nextIndex = prev + 1;
                    return nextIndex < reels.length ? nextIndex : prev;
                  });
                }, 5000);
              }
            }).catch((error) => {
              console.log('Autoplay prevented:', error);
              setIsPlaying(false);
              // Safari fallback: Show play button overlay
            });
          } else {
            // Wait for video to load more data
            setTimeout(attemptAutoplay, 200);
          }
        };

        // Start autoplay attempt after a short delay to ensure video is loaded
        setTimeout(attemptAutoplay, 100);
      }
    }
    
    // Cleanup timeout on unmount or index change
    return () => {
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
    };
  }, [currentIndex, reels.length, autoScrollEnabled]);

  // Pause all other videos
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentIndex) {
        video.pause();
      }
    });
  }, [currentIndex]);

  // Add non-passive wheel event listener to prevent passive event warnings
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelEvent = (e: WheelEvent) => {
      // Only prevent default if we can actually navigate
      if ((e.deltaY > 0 && currentIndex < reels.length - 1) || 
          (e.deltaY < 0 && currentIndex > 0)) {
        e.preventDefault();
        if (e.deltaY > 0) {
          navigateToVideo('next');
        } else {
          navigateToVideo('prev');
        }
      }
    };

    // Add event listener with passive: false to allow preventDefault
    container.addEventListener('wheel', handleWheelEvent, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheelEvent);
    };
  }, [currentIndex, reels.length]);

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
    // Clear autoscroll timer when user manually navigates
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
    }
    
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (direction === 'next' && currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };


  if (isLoading) {
    return (
      <div className={`w-full h-64 sm:h-80 lg:aspect-video bg-gray-100 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
                </div>
              </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className={`w-full h-64 sm:h-80 lg:aspect-video bg-gray-100 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-2">🎥</div>
          <p className="text-gray-600 text-sm">No videos</p>
          <p className="text-gray-500 text-xs">Check back later</p>
        </div>
      </div>
    );
  }

  const currentReel = reels[currentIndex];

  // Safety check to prevent crashes
  if (!currentReel) {
    return (
      <div className={`w-full h-64 sm:h-80 lg:aspect-video bg-gray-100 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-gray-600 text-sm">Video not available</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-64 sm:h-80 lg:aspect-video bg-black rounded-xl overflow-hidden cursor-pointer group ${className}`}
      onClick={() => handleVideoClick(currentReel)}
    >
      {/* Video Player - Conditional rendering for YouTube vs Regular videos */}
      {currentReel.isYouTube || currentReel.youtubeUrl || currentReel.videoUrl?.includes('youtube.com') || currentReel.videoUrl?.includes('youtu.be') ? (
        // YouTube iframe for YouTube videos
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${extractYouTubeVideoId(currentReel.youtubeUrl || currentReel.videoUrl)}?autoplay=1&mute=1&loop=1&playlist=${extractYouTubeVideoId(currentReel.youtubeUrl || currentReel.videoUrl)}&controls=0&modestbranding=1&rel=0`}
          title={currentReel.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          key={currentReel.id}
        />
      ) : (
        // Regular video element for uploaded videos
        <video
          ref={(el) => {
            videoRefs.current[currentIndex] = el;
          }}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
          webkit-playsinline="true"
          preload="metadata"
          crossOrigin="anonymous"
          controls={false}
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
          key={currentReel.id} // Force re-render when video changes
          poster={generatedThumbnails.get(currentReel.id) || (currentReel.thumbnail !== '/api/placeholder/400/300' ? currentReel.thumbnail : undefined)}
          onLoadedData={() => handleVideoLoad(currentIndex)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onCanPlay={() => {
            // Safari: Ensure video is ready for playback
            const video = videoRefs.current[currentIndex];
            if (video && !isPlaying && video.readyState >= 3) {
              video.play().catch(() => {
                // Autoplay failed, user interaction required
                setIsPlaying(false);
              });
            }
          }}
          onLoadedMetadata={() => {
            // Safari: Set initial time after metadata loads and generate thumbnail
            const video = videoRefs.current[currentIndex];
            if (video && video.readyState >= 1) {
              // Only set currentTime if video has enough data
              setTimeout(() => {
                if (video.readyState >= 2) {
                  video.currentTime = 2.0;
                }
              }, 100);
            }
          }}
          onSeeked={(e) => {
            // Generate thumbnail when video seeks to 2 seconds
            const video = e.currentTarget;
            const currentReel = reels[currentIndex];
            if (currentReel && video.currentTime >= 2.0 && video.currentTime < 3.0) {
              if (!generatedThumbnails.has(currentReel.id)) {
                generateThumbnail(video, currentReel.id).then(thumbnail => {
                  if (thumbnail) {
                    setGeneratedThumbnails(prev => new Map(prev.set(currentReel.id, thumbnail)));
                  }
                });
              }
            }
          }}
          onError={(e) => {
            console.error('Video error:', e);
            const video = e.currentTarget;
            console.error('Video error details:', {
              error: video.error,
              networkState: video.networkState,
              readyState: video.readyState,
              src: video.src
            });
            handleVideoError(currentIndex);
          }}
        >
          <source src={getVideoUrl(currentReel.videoUrl)} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

      {/* Play Button Overlay for Safari Autoplay Fallback - Hide for YouTube videos */}
      {!isPlaying && !(currentReel.isYouTube || currentReel.youtubeUrl || currentReel.videoUrl?.includes('youtube.com') || currentReel.videoUrl?.includes('youtu.be')) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const video = videoRefs.current[currentIndex];
              if (video) {
                video.play().then(() => {
                  setIsPlaying(true);
                }).catch((error) => {
                  console.error('Manual play failed:', error);
                });
              }
            }}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-4 transition-all duration-200"
          >
            <Play className="w-8 h-8 text-white" />
          </button>
        </div>
      )}

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
                  src={getAvatarUrl(currentReel.author?.avatar, currentReel.author?.name)}
                  alt={currentReel.author?.name || 'Unknown Author'}
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.log('🖼️ Avatar failed to load for:', currentReel.author?.name, 'URL:', target.src);
                    
                    // Try different fallback approaches
                    const fallbackUrl = `/api/placeholder/40/40?text=${encodeURIComponent((currentReel.author?.name || 'U').charAt(0))}`;
                    if (target.src !== fallbackUrl) {
                      target.src = fallbackUrl;
                    }
                  }}
                  onLoad={() => {
                    console.log('🖼️ Avatar loaded successfully for:', currentReel.author?.name, 'URL:', currentReel.author?.avatar);
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

      {/* Video Counter and Autoscroll Toggle - Mobile Optimized */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center space-x-2">
        {/* Autoscroll Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setAutoScrollEnabled(!autoScrollEnabled);
            if (autoScrollTimeoutRef.current) {
              clearTimeout(autoScrollTimeoutRef.current);
            }
          }}
          className={`p-1.5 rounded-full transition-all duration-200 ${
            autoScrollEnabled 
              ? 'bg-green-500/80 text-white' 
              : 'bg-gray-500/80 text-white'
          }`}
          title={autoScrollEnabled ? 'Disable autoscroll' : 'Enable autoscroll'}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {autoScrollEnabled ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
                </button>
        
        {/* Video Counter */}
        <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
          <span className="text-white text-xs sm:text-sm font-medium">
            {currentIndex + 1} / {reels.length}
          </span>
        </div>
            </div>

      {/* Progress Dots - Mobile Optimized */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-2">
        {reels.map((_, index) => (
                    <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              // Clear autoscroll timer when user manually navigates
              if (autoScrollTimeoutRef.current) {
                clearTimeout(autoScrollTimeoutRef.current);
              }
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