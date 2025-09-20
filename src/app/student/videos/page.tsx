'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlayIcon, HeartIcon, ChatBubbleLeftIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/contexts/AuthContext';

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
      
      // Mock data for now - in production this would come from API
      const mockVideos: VideoReel[] = [
        {
          id: '1',
          title: 'React Hooks Explained',
          description: 'A comprehensive tutorial on React hooks for beginners. Learn useState, useEffect, and custom hooks.',
          thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop',
          videoUrl: '/api/placeholder/video1.mp4',
          duration: 120,
          author: {
            id: 'student-1',
            name: 'Sarah Johnson',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
            course: 'CS 101 - Introduction to Programming'
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
          description: 'Best practices for designing efficient databases. Learn normalization, indexing, and query optimization.',
          thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=225&fit=crop',
          videoUrl: '/api/placeholder/video2.mp4',
          duration: 180,
          author: {
            id: 'student-2',
            name: 'Mike Chen',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
            course: 'CS 201 - Database Systems'
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
          description: 'Understanding asynchronous programming in JavaScript. Master promises, async/await, and error handling.',
          thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&h=225&fit=crop',
          videoUrl: '/api/placeholder/video3.mp4',
          duration: 95,
          author: {
            id: 'student-3',
            name: 'Emily Davis',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
            course: 'CS 102 - Web Development'
          },
          likes: 18,
          comments: 5,
          isLiked: false,
          createdAt: '2024-12-08T16:45:00Z',
          courseId: 'cs-102'
        },
        {
          id: '4',
          title: 'Machine Learning Basics',
          description: 'Introduction to machine learning concepts and algorithms. Perfect for beginners starting their ML journey.',
          thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=225&fit=crop',
          videoUrl: '/api/placeholder/video4.mp4',
          duration: 240,
          author: {
            id: 'student-4',
            name: 'Alex Rodriguez',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
            course: 'CS 301 - Machine Learning'
          },
          likes: 42,
          comments: 15,
          isLiked: false,
          createdAt: '2024-12-07T09:15:00Z',
          courseId: 'cs-301'
        },
        {
          id: '5',
          title: 'Data Structures and Algorithms',
          description: 'Essential data structures every programmer should know. Arrays, linked lists, trees, and graphs explained.',
          thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop',
          videoUrl: '/api/placeholder/video5.mp4',
          duration: 200,
          author: {
            id: 'student-5',
            name: 'Jordan Kim',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face',
            course: 'CS 202 - Data Structures'
          },
          likes: 28,
          comments: 9,
          isLiked: true,
          createdAt: '2024-12-06T11:30:00Z',
          courseId: 'cs-202'
        },
        {
          id: '6',
          title: 'UI/UX Design Principles',
          description: 'Learn the fundamentals of user interface and user experience design. Create beautiful and functional designs.',
          thumbnail: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=225&fit=crop',
          videoUrl: '/api/placeholder/video6.mp4',
          duration: 160,
          author: {
            id: 'student-6',
            name: 'Maya Patel',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face',
            course: 'DES 101 - Design Fundamentals'
          },
          likes: 35,
          comments: 11,
          isLiked: false,
          createdAt: '2024-12-05T13:45:00Z',
          courseId: 'des-101'
        }
      ];
      
      setVideos(mockVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (videoId: string) => {
    setVideos(prev => prev.map(video => 
      video.id === videoId 
        ? { 
            ...video, 
            isLiked: !video.isLiked,
            likes: video.isLiked ? video.likes - 1 : video.likes + 1
          }
        : video
    ));
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
                         video.author.name.toLowerCase().includes(searchTerm.toLowerCase());
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
            <div className="text-xs text-gray-500">
              ClassCast
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
                        {course?.author.course || courseId}
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
                      src={video.author.avatar}
                      alt={video.author.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {video.author.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {video.author.course}
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

          {filteredVideos.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">🎬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
              <p className="text-gray-600">
                {searchTerm || filterCourse 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No videos have been posted yet'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </StudentRoute>
  );
}
