'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Link from 'next/link';

interface Video {
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

export default function MobileVideosPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [stats, setStats] = useState<VideoStats>({
    totalViews: 0,
    totalLikes: 0,
    totalVideos: 0,
    publicVideos: 0,
    averageRating: 0
  });
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    // Mock video data
    const mockVideos: Video[] = [
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
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50 flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-b-2xl flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <Link 
            href="/mobile"
            className="flex items-center text-blue-100 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <h1 className="text-xl font-bold">My Videos</h1>
          <div className="w-6"></div> {/* Spacer for centering */}
        </div>
        
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <div className="text-lg font-bold">{stats.totalViews.toLocaleString()}</div>
            <div className="text-xs">Views</div>
          </div>
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <div className="text-lg font-bold">{stats.totalLikes}</div>
            <div className="text-xs">Likes</div>
          </div>
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <div className="text-lg font-bold">{stats.totalVideos}</div>
            <div className="text-xs">Videos</div>
          </div>
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <div className="text-lg font-bold">{stats.publicVideos}</div>
            <div className="text-xs">Public</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs - Fixed */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-3 px-4 text-sm font-bold transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All ({videos.length})
          </button>
          <button
            onClick={() => setFilter('public')}
            className={`flex-1 py-3 px-4 text-sm font-bold transition-colors ${
              filter === 'public'
                ? 'bg-green-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Public ({videos.filter(v => v.isPublic).length})
          </button>
          <button
            onClick={() => setFilter('private')}
            className={`flex-1 py-3 px-4 text-sm font-bold transition-colors ${
              filter === 'private'
                ? 'bg-gray-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Private ({videos.filter(v => !v.isPublic).length})
          </button>
        </div>
      </div>

      {/* Video Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 active:scale-95 transition-transform"
            >
              {/* Video Thumbnail */}
              <div className="relative">
                <div className="aspect-video bg-gray-200 rounded-t-xl overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <div className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                  {video.duration}
                </div>
                
                {/* Privacy Badge */}
                <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  video.isPublic 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {video.isPublic ? '🌍' : '🔒'}
                </div>
              </div>

              {/* Video Info */}
              <div className="p-3">
                <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2">{video.title}</h3>
                <p className="text-xs text-gray-500 mb-2">{video.assignmentTitle}</p>
                
                {/* Stats */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-red-500">❤️</span>
                      <span className="font-bold text-gray-700">{video.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-blue-500">👁️</span>
                      <span className="font-bold text-gray-700">{video.views}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-bold text-gray-700">{video.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📹</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">No Videos Found</h3>
            <p className="text-gray-600 text-sm">
              {filter === 'all' 
                ? "You haven't uploaded any videos yet." 
                : `You don't have any ${filter} videos.`}
            </p>
          </div>
        )}
      </div>

      {/* Video Detail Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Video Details</h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Video Thumbnail */}
            <div className="aspect-video bg-gray-200 rounded-xl mb-4 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium">{selectedVideo.title}</p>
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-gray-800 mb-1">{selectedVideo.title}</h4>
                <p className="text-sm text-gray-600">{selectedVideo.description}</p>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>Assignment: {selectedVideo.assignmentTitle}</p>
                <p>Duration: {selectedVideo.duration}</p>
                <p>Submitted: {new Date(selectedVideo.submittedAt).toLocaleDateString()}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-red-500">❤️</span>
                    <span className="font-bold text-gray-700">{selectedVideo.likes} Likes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-500">👁️</span>
                    <span className="font-bold text-gray-700">{selectedVideo.views} Views</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-bold text-gray-700">{selectedVideo.rating}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-3 border-t border-gray-200">
                <Link
                  href={`/assignments/${selectedVideo.assignmentId}`}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-xl font-bold text-center text-sm"
                >
                  View Assignment
                </Link>
                
                <button
                  onClick={() => toggleVideoPrivacy(selectedVideo.id)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm ${
                    selectedVideo.isPublic
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {selectedVideo.isPublic ? '🔒' : '🌍'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
