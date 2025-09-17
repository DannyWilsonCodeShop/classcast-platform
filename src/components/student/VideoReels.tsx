'use client';

import React, { useState, useEffect } from 'react';
import { PlayIcon, PauseIcon, HeartIcon, ChatBubbleLeftIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface VideoReel {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: number;
  author: {
    id: string;
    name: string;
    avatar: string;
    course: string;
  };
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
  courseId: string;
}

interface VideoReelsProps {
  studentId: string;
  onVideoClick?: (video: VideoReel) => void;
}

const VideoReels: React.FC<VideoReelsProps> = ({ studentId, onVideoClick }) => {
  const [reels, setReels] = useState<VideoReel[]>([]);
  const [currentVideo, setCurrentVideo] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadVideoReels();
  }, [studentId]);

  const loadVideoReels = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/student/video-reels?studentId=${studentId}`);
      // const data = await response.json();
      
      // Mock data for now
      const mockReels: VideoReel[] = [
        {
          id: '1',
          title: 'React Hooks Explained',
          description: 'A quick tutorial on React hooks for beginners',
          thumbnail: '/api/placeholder/300/200',
          videoUrl: '/api/placeholder/video1.mp4',
          duration: 120,
          author: {
            id: 'student-1',
            name: 'Sarah Johnson',
            avatar: '/api/placeholder/40/40',
            course: 'CS 101'
          },
          likes: 24,
          comments: 8,
          isLiked: false,
          createdAt: '2024-12-10T10:30:00Z',
          courseId: 'cs-101'
        },
        {
          id: '2',
          title: 'Database Design Tips',
          description: 'Best practices for designing efficient databases',
          thumbnail: '/api/placeholder/300/200',
          videoUrl: '/api/placeholder/video2.mp4',
          duration: 180,
          author: {
            id: 'student-2',
            name: 'Mike Chen',
            avatar: '/api/placeholder/40/40',
            course: 'CS 201'
          },
          likes: 31,
          comments: 12,
          isLiked: true,
          createdAt: '2024-12-09T14:20:00Z',
          courseId: 'cs-201'
        },
        {
          id: '3',
          title: 'JavaScript Async/Await',
          description: 'Understanding asynchronous programming in JavaScript',
          thumbnail: '/api/placeholder/300/200',
          videoUrl: '/api/placeholder/video3.mp4',
          duration: 95,
          author: {
            id: 'student-3',
            name: 'Emily Davis',
            avatar: '/api/placeholder/40/40',
            course: 'CS 102'
          },
          likes: 18,
          comments: 5,
          isLiked: false,
          createdAt: '2024-12-08T16:45:00Z',
          courseId: 'cs-102'
        }
      ];
      
      setReels(mockReels);
    } catch (error) {
      console.error('Error loading video reels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (videoId: string) => {
    try {
      // TODO: Implement actual like functionality
      setReels(prev => prev.map(reel => 
        reel.id === videoId 
          ? { 
              ...reel, 
              isLiked: !reel.isLiked,
              likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1
            }
          : reel
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleVideoClick = (video: VideoReel) => {
    if (onVideoClick) {
      onVideoClick(video);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎬 Recent Video Reels</h3>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-64 bg-gray-200 rounded-lg animate-pulse">
              <div className="h-40 bg-gray-300 rounded-t-lg"></div>
              <div className="p-3">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🎬 Recent Video Reels</h3>
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          View All
        </button>
      </div>
      
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            className="flex-shrink-0 w-64 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleVideoClick(reel)}
          >
            {/* Video Thumbnail */}
            <div className="relative">
              <img
                src={reel.thumbnail}
                alt={reel.title}
                className="w-full h-40 object-cover rounded-t-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlaying(!isPlaying);
                    setCurrentVideo(index);
                  }}
                  className="bg-white bg-opacity-90 rounded-full p-2 hover:bg-opacity-100 transition-all"
                >
                  {isPlaying && currentVideo === index ? (
                    <PauseIcon className="h-6 w-6 text-gray-800" />
                  ) : (
                    <PlayIcon className="h-6 w-6 text-gray-800" />
                  )}
                </button>
              </div>
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {formatDuration(reel.duration)}
              </div>
            </div>

            {/* Video Info */}
            <div className="p-3">
              <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                {reel.title}
              </h4>
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {reel.description}
              </p>
              
              {/* Author Info */}
              <div className="flex items-center space-x-2 mb-3">
                <img
                  src={reel.author.avatar}
                  alt={reel.author.name}
                  className="w-6 h-6 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {reel.author.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {reel.author.course} • {formatTimeAgo(reel.createdAt)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(reel.id);
                    }}
                    className="flex items-center space-x-1 text-xs text-gray-600 hover:text-red-600 transition-colors"
                  >
                    {reel.isLiked ? (
                      <HeartSolidIcon className="h-4 w-4 text-red-500" />
                    ) : (
                      <HeartIcon className="h-4 w-4" />
                    )}
                    <span>{reel.likes}</span>
                  </button>
                  
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center space-x-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <ChatBubbleLeftIcon className="h-4 w-4" />
                    <span>{reel.comments}</span>
                  </button>
                </div>
                
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ShareIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {reels.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🎬</div>
          <p className="text-gray-600">No video reels available yet</p>
          <p className="text-sm text-gray-500">Check back later for peer videos!</p>
        </div>
      )}
    </div>
  );
};

export default VideoReels;
