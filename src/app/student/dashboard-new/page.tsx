'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { FeedItem } from '@/app/api/student/feed/route';
import Image from 'next/image';
import { getYouTubeVideoId, getYouTubeEmbedUrl } from '@/lib/youtube';
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
      const response = await fetch(`/api/student/feed?userId=${user?.id}`);
      const data = await response.json();
      
      if (data.success) {
        setFeed(data.feed);
        setCourses(data.courses);
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
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Top Bar */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            {/* ClassCast Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">ClassCast</h1>
            </div>

            {/* Community Post Bar */}
            <button
              onClick={() => setShowPostComposer(!showPostComposer)}
              className="flex-1 mx-4 px-4 py-2 bg-gray-100 rounded-full text-left text-gray-500 text-sm hover:bg-gray-200 transition-colors"
            >
              Post to community...
            </button>

            {/* School Logo */}
            <div className="w-8 h-8 flex-shrink-0">
              {user?.schoolLogo ? (
                <Image
                  src={user.schoolLogo}
                  alt="School"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain rounded"
                />
              ) : (
                <div className="w-full h-full bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                  S
                </div>
              )}
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
              {filteredFeed.map((item) => (
                <FeedItemComponent key={item.id} item={item} formatTimestamp={formatTimestamp} />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-around">
            {/* Course Buttons (max 3) */}
            {courses.slice(0, 3).map((course) => (
              <button
                key={course.courseId}
                onClick={() => setSelectedCourse(course.courseId)}
                className={`relative flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors ${
                  selectedCourse === course.courseId
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {course.initials}
                  </div>
                  {course.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {course.unreadCount}
                    </div>
                  )}
                </div>
                <span className="text-xs mt-1">{course.code}</span>
              </button>
            ))}

            {/* Join Class Button */}
            <button 
              onClick={() => router.push('/student/enroll')}
              className="flex flex-col items-center justify-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 rounded-full border-2 border-gray-300 border-dashed flex items-center justify-center text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-xs mt-1">Join</span>
            </button>

            {/* Profile Button */}
            <button 
              onClick={() => router.push('/student/profile')}
              className="flex flex-col items-center justify-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {user?.avatar && !user.avatar.includes('placeholder') ? (
                  <Image
                    src={user.avatar}
                    alt={user.firstName || 'User'}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 font-semibold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </StudentRoute>
  );
};

// Feed Item Component
const FeedItemComponent: React.FC<{ item: FeedItem; formatTimestamp: (timestamp: string) => string }> = ({ item, formatTimestamp }) => {
  if (item.type === 'video') {
    return <VideoFeedItem item={item} formatTimestamp={formatTimestamp} />;
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
const VideoFeedItem: React.FC<{ item: FeedItem; formatTimestamp: (timestamp: string) => string }> = ({ item, formatTimestamp }) => {
  const videoId = item.videoUrl ? getYouTubeVideoId(item.videoUrl) : null;
  const isYouTube = !!videoId;

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {item.author?.avatar && !item.author.avatar.includes('placeholder') ? (
              <Image
                src={item.author.avatar}
                alt={item.author.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
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
        {item.courseInitials && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
            {item.courseInitials}
          </span>
        )}
      </div>

      {/* Video Player - Mobile Optimized (16:9 aspect ratio for better mobile viewing) */}
      <div className="relative w-full bg-black" style={{ aspectRatio: '16/9' }}>
        {isYouTube ? (
          <iframe
            src={getYouTubeEmbedUrl(item.videoUrl || '')}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={item.videoUrl}
            controls
            className="w-full h-full object-contain"
            playsInline
          />
        )}
      </div>

      {/* Title & Actions */}
      <div className="px-4 py-3">
        <p className="font-medium text-gray-900 mb-2">{item.title}</p>
        <div className="flex items-center space-x-4 text-gray-600">
          <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-sm">{item.likes}</span>
          </button>
          <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm">{item.comments}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Community Feed Item
const CommunityFeedItem: React.FC<{ item: FeedItem; formatTimestamp: (timestamp: string) => string }> = ({ item, formatTimestamp }) => {
  // Check if avatar is emoji (single character, 2-4 bytes)
  const isEmoji = item.author?.avatar && item.author.avatar.length <= 4 && !item.author.avatar.startsWith('http');

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {isEmoji ? (
            <span className="text-2xl">{item.author?.avatar}</span>
          ) : item.author?.avatar && !item.author.avatar.includes('placeholder') ? (
            <Image
              src={item.author.avatar}
              alt={item.author.name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
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
        <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm">{item.comments}</span>
        </button>
      </div>
    </div>
  );
};

// Assignment Feed Item
const AssignmentFeedItem: React.FC<{ item: FeedItem; formatTimestamp: (timestamp: string) => string }> = ({ item, formatTimestamp }) => {
  const getStatusColor = () => {
    if (item.status === 'past_due') return 'bg-red-50 border-red-200 text-red-700';
    if (item.status === 'active') return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    return 'bg-green-50 border-green-200 text-green-700';
  };

  return (
    <div className={`border-b border-gray-200 px-4 py-4 ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="font-semibold">{item.title}</h3>
          </div>
          <p className="text-sm mb-2">{item.description}</p>
          {item.dueDate && (
            <p className="text-xs">
              Due: {new Date(item.dueDate).toLocaleDateString()} at {new Date(item.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        {item.courseInitials && (
          <span className="px-2 py-1 bg-white/50 text-current text-xs font-semibold rounded ml-2">
            {item.courseInitials}
          </span>
        )}
      </div>
      <button className="mt-2 px-4 py-2 bg-white text-current rounded-lg text-sm font-medium hover:bg-white/80 transition-colors">
        View Assignment
      </button>
    </div>
  );
};

export default StudentDashboardNew;

