'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { FeedItem } from '@/app/api/student/feed/route';
import Image from 'next/image';
import { extractYouTubeVideoId as getYouTubeVideoId, getYouTubeEmbedUrl } from '@/lib/youtube';
import { useRouter } from 'next/navigation';

interface Course {
  courseId: string;
  name: string;
  initials: string;
  code: string;
  unreadCount: number;
}

const StudentDashboardNew: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchFeed();
    }
  }, [user]);

  const fetchFeed = async () => {
    try {
      console.log('📡 Fetching feed for user:', user?.id);
      const response = await fetch(`/api/student/feed?userId=${user?.id}`);
      const data = await response.json();
      
      console.log('📦 Feed data received:', {
        success: data.success,
        feedLength: data.feed?.length,
        coursesLength: data.courses?.length,
        feed: data.feed
      });
      
      if (data.success) {
        setFeed(data.feed);
        setCourses(data.courses);
        
        // Log all item types
        const typeCounts = data.feed.reduce((acc: any, item: FeedItem) => {
          acc[item.type] = (acc[item.type] || 0) + 1;
          return acc;
        }, {});
        console.log('📊 Feed item types:', typeCounts);
        
        // Log video items specifically
        const videos = data.feed.filter((item: FeedItem) => item.type === 'video');
        console.log('🎬 Video items in feed:', videos.length, videos);
        
        // Log assignment items
        const assignments = data.feed.filter((item: FeedItem) => item.type === 'assignment');
        console.log('📚 Assignment items in feed:', assignments.length, assignments);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter feed by selected course
  const filteredFeed = selectedCourse 
    ? feed.filter(item => item.courseId === selectedCourse || item.type === 'community')
    : feed;

  // When a course is selected, separate assignments and other content
  const courseAssignments = selectedCourse 
    ? filteredFeed.filter(item => item.type === 'assignment' && item.courseId === selectedCourse)
    : [];
  
  const otherFeedItems = selectedCourse
    ? filteredFeed.filter(item => item.type !== 'assignment')
    : filteredFeed;

  const handlePostSubmit = async () => {
    if (!postContent.trim()) return;

    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: postContent.substring(0, 100),
          content: postContent,
          userId: user?.id
        })
      });

      if (response.ok) {
        setPostContent('');
        setShowPostComposer(false);
        fetchFeed(); // Refresh feed
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Top Bar */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            {/* ClassCast Logo */}
            <div className="flex items-center flex-shrink-0">
              <Image
                src="/MyClassCast (800 x 200 px).png"
                alt="MyClassCast"
                width={120}
                height={30}
                className="h-7 w-auto object-contain"
                priority
              />
            </div>

            {/* Community Post Bar */}
            <button
              onClick={() => setShowPostComposer(!showPostComposer)}
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-left text-gray-500 text-sm hover:bg-gray-200 transition-colors"
            >
              Post to community...
            </button>

            {/* School Logo */}
            <div className="w-10 h-10 flex-shrink-0">
              <Image
                src="/logos/cristo-rey-atlanta.png"
                alt="Cristo Rey Atlanta"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>

          {/* Expanded Post Composer */}
          {showPostComposer && (
            <div className="max-w-2xl mx-auto px-4 pb-4">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                autoFocus
              />
              <div className="flex items-center justify-end space-x-2 mt-2">
                <button
                  onClick={() => {
                    setShowPostComposer(false);
                    setPostContent('');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePostSubmit}
                  disabled={!postContent.trim()}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feed */}
        <div className="max-w-2xl mx-auto">
          {/* Active Filter Indicator */}
          {selectedCourse && (
            <div className="sticky top-[57px] z-40 bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between">
              <span className="text-sm text-blue-700 font-medium">
                Showing: {courses.find(c => c.courseId === selectedCourse)?.name}
              </span>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Show All
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : feed.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-gray-500">No posts yet. Start by posting something!</p>
            </div>
          ) : filteredFeed.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-gray-500">No posts in this course yet.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {/* Only show videos and community posts (NO assignments) */}
              {filteredFeed
                .filter(item => item.type === 'video' || item.type === 'community')
                .map((item) => (
                  <FeedItemComponent key={item.id} item={item} formatTimestamp={formatTimestamp} currentUserId={user?.id} onDelete={fetchFeed} assignmentId={item.assignmentId} />
                ))}
              
              {/* Empty state if no videos/posts */}
              {filteredFeed.filter(item => item.type === 'video' || item.type === 'community').length === 0 && (
                <div className="bg-white py-12 px-4">
                  <div className="text-center max-w-sm mx-auto">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Yet</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Community posts and videos will appear here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </StudentRoute>
  );
};

// Video Thumbnail Card - Instagram/TikTok Style
const VideoThumbnailCard: React.FC<{ video: FeedItem }> = ({ video }) => {
  const router = useRouter();
  const videoId = video.videoUrl ? getYouTubeVideoId(video.videoUrl) : null;
  const isYouTube = !!videoId;
  
  // Generate thumbnail URL for YouTube videos
  const thumbnailUrl = isYouTube && videoId
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : '/api/placeholder/160/240';

  return (
    <div 
      onClick={() => router.push(`/student/assignments/${video.assignmentId}/feed`)}
      className="flex-shrink-0 w-32 cursor-pointer group"
    >
      <div className="relative w-32 h-48 overflow-hidden bg-gray-900 transition-transform group-hover:scale-105">
        {/* Thumbnail */}
        {isYouTube ? (
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <svg className="w-12 h-12 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white bg-opacity-90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent" />
        
        {/* Author info */}
        <div className="absolute bottom-2 left-2 right-2">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700 overflow-hidden flex-shrink-0">
              {video.author?.avatar && !video.author.avatar.includes('placeholder') ? (
                <img src={video.author.avatar} alt={video.author.name} className="w-full h-full object-cover" />
              ) : (
                <span>{video.author?.name.split(' ').map(n => n[0]).join('')}</span>
              )}
            </div>
            <p className="text-white text-xs font-semibold truncate">{video.author?.name}</p>
          </div>
          <p className="text-white text-xs line-clamp-2 leading-tight">{video.title}</p>
        </div>

        {/* Course badge */}
        {video.courseInitials && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full shadow-lg">
              {video.courseInitials}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Feed Item Component
const FeedItemComponent: React.FC<{ item: FeedItem; formatTimestamp: (timestamp: string) => string; currentUserId?: string; onDelete?: () => void; assignmentId?: string }> = ({ item, formatTimestamp, currentUserId, onDelete }) => {
  if (item.type === 'video') {
    return <VideoFeedItem item={item} formatTimestamp={formatTimestamp} currentUserId={currentUserId} onDelete={onDelete} />;
  }
  
  if (item.type === 'community') {
    return <CommunityFeedItem item={item} formatTimestamp={formatTimestamp} />;
  }
  
  if (item.type === 'assignment') {
    return <AssignmentFeedItem item={item} formatTimestamp={formatTimestamp} />;
  }
  
  return null;
};

// Video Feed Item
const VideoFeedItem: React.FC<{ item: FeedItem; formatTimestamp: (timestamp: string) => string; currentUserId?: string; onDelete?: () => void }> = ({ item, formatTimestamp, currentUserId, onDelete }) => {
  const videoId = item.videoUrl ? getYouTubeVideoId(item.videoUrl) : null;
  const isYouTube = !!videoId;
  const [imageError, setImageError] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  
  // Check if avatar is emoji or valid image
  const isEmoji = item.author?.avatar && item.author.avatar.length <= 4 && !item.author.avatar.startsWith('http');
  const hasValidAvatar = item.author?.avatar && !item.author.avatar.includes('placeholder') && !imageError;
  
  // Check if this is the current user's video
  const isMyVideo = currentUserId && item.author?.id === currentUserId;
  
  // Debug logging
  if (item.type === 'video') {
    console.log('🎥 Video item:', {
      title: item.title,
      authorId: item.author?.id,
      currentUserId,
      isMyVideo
    });
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/video-submissions/${item.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setShowDeleteConfirm(false);
        onDelete?.(); // Refresh feed
      } else {
        alert('Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Error deleting video');
    }
  };

  // Auto-play video when in view (Intersection Observer)
  React.useEffect(() => {
    if (!videoRef.current || isYouTube) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {
              // Auto-play failed (browser restriction), that's okay
            });
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.5 } // Play when 50% visible
    );

    observer.observe(videoRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isYouTube]);

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {isEmoji ? (
              <span className="text-2xl">{item.author?.avatar}</span>
            ) : hasValidAvatar ? (
              <Image
                src={item.author.avatar}
                alt={item.author.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-gray-600 font-semibold text-sm">
                {item.author?.name.split(' ').map(n => n[0]).join('')}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">{item.author?.name}</p>
            <p className="text-xs text-gray-500">{formatTimestamp(item.timestamp)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {item.courseInitials && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
              {item.courseInitials}
            </span>
          )}
          {isMyVideo && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 hover:bg-red-50 rounded-full transition-colors"
              title="Delete video"
            >
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Video?</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player - Auto-play when in view */}
      <div className="relative w-full bg-black mb-2" style={{ aspectRatio: '16/9' }}>
        {isYouTube ? (
          <iframe
            src={`${getYouTubeEmbedUrl(item.videoUrl || '')}&autoplay=1&mute=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={item.videoUrl}
              className="w-full h-full object-contain"
              playsInline
              muted={isMuted}
              loop
            />
            {/* Mute/Unmute Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="absolute bottom-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
            >
              {isMuted ? (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Title & Actions */}
      <div className="px-4 py-4">
        <p className="font-medium text-gray-900 mb-3">{item.title}</p>
        <div className="flex items-center space-x-6 text-gray-600">
          <button className="flex items-center space-x-1.5 hover:text-red-500 transition-colors py-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-sm font-medium">{item.likes}</span>
          </button>
          <button className="flex items-center space-x-1.5 hover:text-blue-500 transition-colors py-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm font-medium">{item.comments}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Community Feed Item
const CommunityFeedItem: React.FC<{ item: FeedItem; formatTimestamp: (timestamp: string) => string }> = ({ item, formatTimestamp }) => {
  const [imageError, setImageError] = React.useState(false);
  const [showComments, setShowComments] = React.useState(false);
  
  // Check if avatar is emoji (single character, 2-4 bytes)
  const isEmoji = item.author?.avatar && item.author.avatar.length <= 4 && !item.author.avatar.startsWith('http');
  const hasValidAvatar = item.author?.avatar && !item.author.avatar.includes('placeholder') && !imageError;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {isEmoji ? (
            <span className="text-2xl">{item.author?.avatar}</span>
          ) : hasValidAvatar ? (
            <Image
              src={item.author.avatar}
              alt={item.author.name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-gray-600 font-semibold text-sm">
              {item.author?.name.split(' ').map(n => n[0]).join('')}
            </span>
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900">{item.author?.name}</p>
          <p className="text-xs text-gray-500">{formatTimestamp(item.timestamp)}</p>
        </div>
      </div>

      {/* Content */}
      {item.title && item.title !== item.content && <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>}
      <p className="text-gray-700 whitespace-pre-wrap">{item.content}</p>

      {/* Actions */}
      <div className="flex items-center space-x-4 mt-3 text-gray-600">
        <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-sm">{item.likes}</span>
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-1 hover:text-blue-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm">{item.comments} {item.comments === 1 ? 'comment' : 'comments'}</span>
        </button>
      </div>

      {/* Collapsible Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="space-y-3">
            <p className="text-sm text-gray-500 italic">Comments section coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Assignment Feed Item
const AssignmentFeedItem: React.FC<{ item: FeedItem; formatTimestamp: (timestamp: string) => string }> = ({ item, formatTimestamp }) => {
  const router = useRouter();
  
  const getStatusColor = () => {
    if (item.status === 'past_due') return 'bg-red-50 border-red-200 text-red-700';
    if (item.status === 'active') return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    return 'bg-green-50 border-green-200 text-green-700';
  };

  const handleClick = () => {
    router.push(`/student/assignments/${item.id}/feed`);
  };

  // Strip HTML tags and get clean preview text
  const getCleanPreview = (html: string) => {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()
      .substring(0, 120) // Limit preview length
      + (html.length > 120 ? '...' : '');
  };

  return (
    <div 
      onClick={handleClick}
      className={`rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all border-2 ${
        item.status === 'past_due' 
          ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 hover:border-red-400' 
          : item.status === 'active'
          ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300 hover:border-yellow-400'
          : 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 hover:border-green-400'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              item.status === 'past_due' ? 'bg-red-500' :
              item.status === 'active' ? 'bg-yellow-500' : 'bg-green-500'
            }`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900">{item.title}</h3>
          </div>
          <p className="text-sm mb-3 line-clamp-2 text-gray-700">
            {getCleanPreview(item.description || '')}
          </p>
          {item.dueDate && (
            <div className="flex items-center space-x-1 text-xs text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">
                Due: {new Date(item.dueDate).toLocaleDateString()} at {new Date(item.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
        {item.courseInitials && (
          <span className="px-3 py-1 bg-white text-gray-900 text-xs font-bold rounded-full shadow-sm">
            {item.courseInitials}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-300/50">
        <div className={`text-xs font-semibold uppercase ${
          item.status === 'past_due' ? 'text-red-700' :
          item.status === 'active' ? 'text-yellow-700' : 'text-green-700'
        }`}>
          {item.status === 'past_due' ? '🔴 Past Due' :
           item.status === 'active' ? '🟡 Due Soon' : '🟢 Upcoming'}
        </div>
        <div className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-shadow">
          View Assignment →
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardNew;

