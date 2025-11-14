'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlayIcon, HeartIcon, ChatBubbleLeftIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/contexts/AuthContext';
import { api, VideoReel } from '@/lib/api';


export default function StudentVideosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [videos, setVideos] = useState<VideoReel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setIsLoading(true);
      
      // Use the clean API to fetch videos
      const videosData = await api.getVideos();
      setVideos(videosData);
    } catch (error) {
      console.error('Error loading videos:', error);
      // Set empty array on error - no mock data
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (videoId: string) => {
    try {
      // Use the API to like the video
      const updatedVideo = await api.likeVideo(videoId);
      
      // Update local state with the response
      setVideos(prev => prev.map(video => 
        video.id === videoId ? updatedVideo : video
      ));
    } catch (error) {
      console.error('Error liking video:', error);
      // Fallback to local state update if API fails
      setVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { 
              ...video, 
              isLiked: !video.isLiked,
              likes: video.isLiked ? video.likes - 1 : video.likes + 1
            }
          : video
      ));
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

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.author?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = !filterCourse || video.courseId === filterCourse;
    return matchesSearch && matchesCourse;
  });

  const uniqueCourses = [...new Set(videos.map(video => video.courseId))];

  if (isLoading) {
    return (
      <StudentRoute>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
          </div>
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
        {/* Header with Back Button */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/student/dashboard"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                title="Back to Home"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-slate-500 to-gray-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  🎬
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Student Videos</h1>
                  <p className="text-xs text-gray-600">
                    Discover videos created by your peers
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <img
                src="/MyClassCast (800 x 200 px).png"
                alt="MyClassCast"
                className="h-6 w-auto object-contain"
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Filter */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search videos, authors, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              <div className="sm:w-64">
                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="">All Courses</option>
                  {uniqueCourses.map(courseId => {
                    const course = videos.find(v => v.courseId === courseId);
                    return (
                      <option key={courseId} value={courseId}>
                        {course?.author?.course || courseId}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {filteredVideos.length} of {videos.length} videos
            </div>
          </div>

          {/* Videos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              >
                {/* Video Thumbnail */}
                <div className="relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <button className="bg-white bg-opacity-90 rounded-full p-3 hover:bg-opacity-100 transition-all">
                      <PlayIcon className="h-8 w-8 text-gray-800" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                    {video.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {video.description}
                  </p>
                  
                  {/* Author Info */}
                  <div className="flex items-center space-x-2 mb-3">
                    <img
                      src={video.author?.avatar || '/api/placeholder/32/32'}
                      alt={video.author?.name || 'Unknown Author'}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {video.author?.name || 'Unknown Author'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {video.author?.course || 'Unknown Course'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLike(video.id)}
                        className="flex items-center space-x-1 text-xs text-gray-600 hover:text-red-600 transition-colors"
                      >
                        {video.isLiked ? (
                          <HeartSolidIcon className="h-4 w-4 text-red-500" />
                        ) : (
                          <HeartIcon className="h-4 w-4" />
                        )}
                        <span>{video.likes}</span>
                      </button>
                      
                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <ChatBubbleLeftIcon className="h-4 w-4" />
                        <span>{video.comments}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {formatTimeAgo(video.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredVideos.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">🎬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
              <p className="text-gray-600">
                {searchTerm || filterCourse 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No videos have been posted yet. Check back later!'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </StudentRoute>
  );
}
