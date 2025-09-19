'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Link from 'next/link';

interface PublicVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  submittedAt: string;
  likes: number;
  views: number;
  rating: number;
  assignmentTitle: string;
  assignmentId: string;
  isPublic: boolean;
}

interface VideoStats {
  totalViews: number;
  totalLikes: number;
  totalVideos: number;
  publicVideos: number;
  averageRating: number;
}

export default function MyVideosPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [stats, setStats] = useState<VideoStats>({
    totalViews: 0,
    totalLikes: 0,
    totalVideos: 0,
    publicVideos: 0,
    averageRating: 0
  });
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    // Mock video data - in real app, this would be fetched from API
    const mockVideos: PublicVideo[] = [
      {
        id: '1',
        title: 'Quadratic Equations Made Easy',
        description: 'I break down the quadratic formula and show two different methods to solve these equations.',
        thumbnailUrl: '/thumbnails/quadratic-1.jpg',
        duration: '4:32',
        submittedAt: '2024-01-15T10:30:00Z',
        likes: 12,
        views: 45,
        rating: 4.8,
        assignmentTitle: 'Math Problem Solving Video',
        assignmentId: '1',
        isPublic: true
      },
      {
        id: '2',
        title: 'Visual Approach to Quadratics',
        description: 'I use graphs and visual representations to explain quadratic equations.',
        thumbnailUrl: '/thumbnails/quadratic-2.jpg',
        duration: '3:45',
        submittedAt: '2024-01-14T14:20:00Z',
        likes: 18,
        views: 62,
        rating: 4.9,
        assignmentTitle: 'Math Problem Solving Video',
        assignmentId: '1',
        isPublic: true
      },
      {
        id: '3',
        title: 'Step-by-Step Quadratic Solutions',
        description: 'I show a systematic approach to solving quadratic equations with clear examples.',
        thumbnailUrl: '/thumbnails/quadratic-3.jpg',
        duration: '5:15',
        submittedAt: '2024-01-13T16:45:00Z',
        likes: 9,
        views: 38,
        rating: 4.6,
        assignmentTitle: 'Math Problem Solving Video',
        assignmentId: '1',
        isPublic: false
      },
      {
        id: '4',
        title: 'Physics Lab: Pendulum Motion',
        description: 'Demonstrating simple harmonic motion with a pendulum experiment.',
        thumbnailUrl: '/thumbnails/physics-1.jpg',
        duration: '6:20',
        submittedAt: '2024-01-10T09:15:00Z',
        likes: 25,
        views: 89,
        rating: 4.7,
        assignmentTitle: 'Physics Lab Report',
        assignmentId: '2',
        isPublic: true
      },
      {
        id: '5',
        title: 'Chemistry: Acid-Base Reactions',
        description: 'Exploring different types of acid-base reactions with visual demonstrations.',
        thumbnailUrl: '/thumbnails/chemistry-1.jpg',
        duration: '7:45',
        submittedAt: '2024-01-08T11:30:00Z',
        likes: 31,
        views: 124,
        rating: 4.9,
        assignmentTitle: 'Chemistry Lab Video',
        assignmentId: '3',
        isPublic: true
      },
      {
        id: '6',
        title: 'English: Poetry Analysis',
        description: 'Analyzing Robert Frost\'s "The Road Not Taken" with literary techniques.',
        thumbnailUrl: '/thumbnails/english-1.jpg',
        duration: '8:10',
        submittedAt: '2024-01-05T14:45:00Z',
        likes: 14,
        views: 67,
        rating: 4.5,
        assignmentTitle: 'Poetry Analysis Video',
        assignmentId: '4',
        isPublic: false
      }
    ];

    setVideos(mockVideos);

    // Calculate stats
    const totalViews = mockVideos.reduce((sum, video) => sum + video.views, 0);
    const totalLikes = mockVideos.reduce((sum, video) => sum + video.likes, 0);
    const totalVideos = mockVideos.length;
    const publicVideos = mockVideos.filter(video => video.isPublic).length;
    const averageRating = mockVideos.reduce((sum, video) => sum + video.rating, 0) / totalVideos;

    setStats({
      totalViews,
      totalLikes,
      totalVideos,
      publicVideos,
      averageRating: Math.round(averageRating * 10) / 10
    });
  }, [user, isAuthenticated, isLoading, router]);

  const filteredVideos = videos.filter(video => {
    if (filter === 'all') return true;
    if (filter === 'public') return video.isPublic;
    if (filter === 'private') return !video.isPublic;
    return true;
  });

  const toggleVideoPrivacy = (videoId: string) => {
    setVideos(prev => prev.map(video => 
      video.id === videoId 
        ? { ...video, isPublic: !video.isPublic }
        : video
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <LoadingSpinner text="Loading your videos..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link 
              href="/dashboard"
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">My Videos</h1>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border-2 border-blue-300/30 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalViews.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Views</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border-2 border-red-300/30 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.totalLikes}</div>
            <div className="text-sm text-gray-600">Total Likes</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border-2 border-purple-300/30 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalVideos}</div>
            <div className="text-sm text-gray-600">Total Videos</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border-2 border-green-300/30 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.publicVideos}</div>
            <div className="text-sm text-gray-600">Public Videos</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border-2 border-yellow-300/30 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.averageRating}</div>
            <div className="text-sm text-gray-600">Avg Rating</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border-2 border-gray-300/30 mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Videos ({videos.length})
            </button>
            <button
              onClick={() => setFilter('public')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
                filter === 'public'
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Public ({videos.filter(v => v.isPublic).length})
            </button>
            <button
              onClick={() => setFilter('private')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
                filter === 'private'
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Private ({videos.filter(v => !v.isPublic).length})
            </button>
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div key={video.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30 hover:border-blue-300/50 transition-all duration-300">
              {/* Video Thumbnail */}
              <div className="relative mb-4">
                <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      <p className="text-sm font-medium">{video.title}</p>
                    </div>
                  </div>
                </div>
                
                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {video.duration}
                </div>
                
                {/* Privacy Badge */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${
                  video.isPublic 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {video.isPublic ? '🌍 Public' : '🔒 Private'}
                </div>
              </div>

              {/* Video Info */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg mb-1">{video.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{video.description}</p>
                </div>
                
                <div className="text-sm text-gray-500">
                  <p>Assignment: {video.assignmentTitle}</p>
                  <p>Submitted: {new Date(video.submittedAt).toLocaleDateString()}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <span className="text-red-500">❤️</span>
                      <span className="font-bold text-gray-700">{video.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-blue-500">👁️</span>
                      <span className="font-bold text-gray-700">{video.views}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-bold text-gray-700">{video.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <Link
                    href={`/assignments/${video.assignmentId}`}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 text-sm"
                  >
                    View Assignment
                  </Link>
                  
                  <button
                    onClick={() => toggleVideoPrivacy(video.id)}
                    className={`px-4 py-2 rounded-xl font-bold transition-all duration-300 text-sm ${
                      video.isPublic
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {video.isPublic ? '🔒 Make Private' : '🌍 Make Public'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📹</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Videos Found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't uploaded any videos yet." 
                : `You don't have any ${filter} videos.`}
            </p>
            <Link
              href="/assignments"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
            >
              Browse Assignments
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
