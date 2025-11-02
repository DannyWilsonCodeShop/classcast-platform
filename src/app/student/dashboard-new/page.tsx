'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { FeedItem } from '@/app/api/student/feed/route';
import Image from 'next/image';
import { extractYouTubeVideoId as getYouTubeVideoId, getYouTubeEmbedUrl } from '@/lib/youtube';
import { useRouter } from 'next/navigation';
import ClassEnrollmentModal from '@/components/student/ClassEnrollmentModal';
import InteractionBar from '@/components/student/InteractionBar';

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
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [showJoinClassPopup, setShowJoinClassPopup] = useState(false);
  const [classAssignments, setClassAssignments] = useState<FeedItem[]>([]);
  const [connections, setConnections] = useState<Set<string>>(new Set());
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchFeed();
      loadConnections();
      loadNotificationCount();
      
      // Poll for notifications every 30 seconds
      const interval = setInterval(() => {
        loadNotificationCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotificationCount = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/notifications/count?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotificationCount(data.count || 0);
        }
      }
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  const loadConnections = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/connections?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success && data.connections) {
        // Create a set of all connected user IDs (both requested and accepted)
        const connectedIds = new Set<string>();
        data.connections.forEach((conn: any) => {
          if (conn.status === 'accepted') {
            // Add both users to the set
            if (conn.requesterId !== user.id) connectedIds.add(conn.requesterId);
            if (conn.requestedId !== user.id) connectedIds.add(conn.requestedId);
          }
        });
        setConnections(connectedIds);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const handleStudyBuddy = async (targetUserId: string) => {
    if (!user?.id || !targetUserId) return;
    
    console.log('🔗 Creating study buddy connection:', { requesterId: user.id, requestedId: targetUserId });
    
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: user.id,
          requestedId: targetUserId,
          status: 'accepted' // Auto-accept for simplicity (or use 'pending' for approval)
        })
      });

      const data = await response.json();
      console.log('🔗 Study buddy response:', data);
      
      if (data.success) {
        // Update local state to reflect connection without reloading feed
        setConnections(prev => new Set(prev).add(targetUserId));
        console.log('✅ Study buddy connection added successfully');
      } else {
        console.error('❌ Failed to add study buddy:', data.error);
        alert('Failed to connect as study buddy. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error adding study buddy:', error);
      alert('Failed to connect as study buddy. Please try again.');
    }
  };

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
        // Randomize the feed order so students see different creators first
        const randomizedFeed = [...data.feed].sort(() => Math.random() - 0.5);
        setFeed(randomizedFeed);
        setCourses(data.courses);
        console.log('🏫 Courses loaded for bottom nav:', data.courses);
        
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

  // Filter feed by selected course and assignment
  const filteredFeed = selectedCourse 
    ? feed.filter(item => item.courseId === selectedCourse || item.type === 'community')
    : feed;

  // Filter by assignment if selected
  const assignmentFilteredFeed = selectedAssignment
    ? filteredFeed.filter(item => item.assignmentId === selectedAssignment || item.type === 'community')
    : filteredFeed;

  // When a course is selected, separate assignments and other content
  const courseAssignments = selectedCourse 
    ? filteredFeed.filter(item => item.type === 'assignment' && item.courseId === selectedCourse)
    : [];
  
  const otherFeedItems = selectedCourse
    ? assignmentFilteredFeed.filter(item => item.type !== 'assignment')
    : assignmentFilteredFeed;

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

  const handleCourseClick = (courseId: string) => {
    // Navigate to the course page instead of filtering
    router.push(`/student/courses/${courseId}`);
  };

  const handleAssignmentClick = (assignmentId: string) => {
    setSelectedAssignment(assignmentId);
  };

  const handleUserClick = (userId: string) => {
    router.push(`/student/profile/${userId}`);
  };

  const handleClassEnrollment = async (classCode: string, sectionId?: string) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch('/api/student/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classCode: classCode.toUpperCase(),
          userId: user.id,
          sectionId: sectionId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh the feed to show the new course
          fetchFeed();
          // Optionally show success message
          console.log('Successfully enrolled in class');
        } else {
          alert(data.error || 'Failed to enroll in class');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to enroll in class');
      }
    } catch (error) {
      console.error('Error enrolling in class:', error);
      alert('Failed to enroll in class');
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        {/* Top Bar */}
        <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-100/80 via-blue-100/80 to-pink-100/80 backdrop-blur-sm border-b-2 border-purple-300/50 shadow-lg">
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
              className="flex-1 px-4 py-2 bg-white/90 rounded-full text-left text-gray-600 text-sm hover:bg-white transition-all shadow-md"
            >
              ✨ Post to community...
            </button>

            {/* School Logo */}
            <div className="w-10 h-10 flex-shrink-0">
              <Image
                src="/CRAJSmallLogo.png"
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
        <div className="max-w-2xl mx-auto pb-20">
          {/* Active Filter Indicator */}
          {selectedCourse && (
            <div className="sticky top-[57px] z-40 bg-gradient-to-r from-indigo-500 to-purple-500 border-b-2 border-white/20 px-4 py-3 flex items-center justify-between shadow-lg">
              <span className="text-sm text-white font-semibold flex items-center gap-2">
                <span className="text-lg">📚</span>
                Showing: {courses.find(c => c.courseId === selectedCourse)?.name}
              </span>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-white hover:bg-white/20 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
              >
                Show All
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-gradient-to-r from-purple-500 via-blue-500 to-pink-500"></div>
            </div>
          ) : feed.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="inline-block p-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mb-4">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">No posts yet. Start by posting something!</p>
            </div>
          ) : filteredFeed.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="inline-block p-6 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full mb-4">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">No posts in this course yet.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {/* Only show videos and community posts (NO assignments) */}
              {filteredFeed
                .filter(item => item.type === 'video' || item.type === 'community')
                .map((item) => (
                  <FeedItemComponent 
                    key={item.id} 
                    item={item} 
                    formatTimestamp={formatTimestamp} 
                    currentUserId={user?.id} 
                    onDelete={fetchFeed} 
                    assignmentId={item.assignmentId}
                    onStudyBuddy={handleStudyBuddy}
                    isConnected={connections.has(item.authorId || '')}
                  />
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

      {/* Class Assignments Section - Horizontal Scroll */}
      {selectedCourse && classAssignments.length > 0 && (
        <div className="bg-white border-t border-gray-200 px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {courses.find(c => c.courseId === selectedCourse)?.name} Assignments
            </h3>
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {classAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  onClick={() => handleAssignmentClick(assignment.id!)}
                  className={`flex-shrink-0 w-64 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAssignment === assignment.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {assignment.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {assignment.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      assignment.status === 'past_due' ? 'bg-red-100 text-red-700' :
                      assignment.status === 'active' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {assignment.status === 'past_due' ? 'Past Due' :
                       assignment.status === 'active' ? 'Due Soon' : 'Upcoming'}
                    </span>
                    {assignment.dueDate && (
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(assignment.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Class Enrollment Modal */}
      <ClassEnrollmentModal
        isOpen={showJoinClassPopup}
        onClose={() => setShowJoinClassPopup(false)}
        onEnroll={handleClassEnrollment}
      />

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-400/90 via-blue-400/90 to-pink-400/90 backdrop-blur-md border-t-2 border-white/30 px-4 py-3 z-50 shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          {/* Course Buttons */}
          <div className="flex items-center space-x-2">
            {console.log('🏫 Courses for bottom nav:', courses)}
            {courses.length > 0 ? (
              courses.slice(0, 3).map((course) => (
                <button
                  key={course.courseId}
                  onClick={() => handleCourseClick(course.courseId)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all shadow-md relative ${
                    selectedCourse === course.courseId 
                      ? 'bg-blue-600 scale-110' 
                      : 'bg-gray-400 hover:bg-gray-500'
                  }`}
                  title={course.name}
                >
                  {course.initials || course.name.substring(0, 3).toUpperCase()}
                  {/* Notification indicator */}
                  {course.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {course.unreadCount > 9 ? '9+' : course.unreadCount}
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="text-xs text-gray-500 px-2">No courses</div>
            )}
          </div>

          {/* Center Buttons */}
          <div className="flex items-center space-x-2">
            {/* Community Button */}
            <button
              onClick={() => router.push('/community')}
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all shadow-lg backdrop-blur-sm"
              title="Community"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>

            {/* Messages Button */}
            <button
              onClick={() => router.push('/student/messages')}
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all shadow-lg backdrop-blur-sm"
              title="Messages"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Notifications Button */}
            <button
              onClick={() => router.push('/student/notifications')}
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all shadow-lg backdrop-blur-sm relative"
              title="Notifications"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Notification badge - only show if there are new notifications */}
              {notificationCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <span className="text-[10px] font-bold text-white">{notificationCount > 9 ? '9+' : notificationCount}</span>
                </div>
              )}
            </button>

            {/* Join Class Button */}
            <button
              onClick={() => setShowJoinClassPopup(true)}
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all shadow-lg backdrop-blur-sm"
              title="Join Class"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>

          {/* Profile Avatar */}
          <button
            onClick={() => router.push('/student/profile')}
            className="w-12 h-12 rounded-full bg-white/30 hover:bg-white/40 flex items-center justify-center overflow-hidden shadow-lg backdrop-blur-sm hover:shadow-xl transition-all border-2 border-white/20"
          >
            {user?.avatar && !user.avatar.includes('placeholder') ? (
              <img 
                src={user.avatar} 
                alt={user.firstName || 'Profile'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-lg">
                {user?.firstName?.[0] || user?.email?.[0] || 'U'}
              </span>
            )}
          </button>
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
const FeedItemComponent: React.FC<{ item: FeedItem; formatTimestamp: (timestamp: string) => string; currentUserId?: string; onDelete?: () => void; assignmentId?: string; onStudyBuddy?: (userId: string) => void; isConnected?: boolean }> = ({ item, formatTimestamp, currentUserId, onDelete, onStudyBuddy, isConnected }) => {
  console.log('🔄 FeedItemComponent rendering:', { type: item.type, title: item.title });
  
  if (item.type === 'video') {
    console.log('🎬 Rendering VideoFeedItem for:', item.title);
    return <VideoFeedItem item={item} formatTimestamp={formatTimestamp} currentUserId={currentUserId} onDelete={onDelete} onStudyBuddy={onStudyBuddy} isConnected={isConnected} />;
  }
  
  if (item.type === 'community') {
    return <CommunityFeedItem item={item} formatTimestamp={formatTimestamp} onStudyBuddy={onStudyBuddy} isConnected={isConnected} />;
  }
  
  if (item.type === 'assignment') {
    return <AssignmentFeedItem item={item} formatTimestamp={formatTimestamp} />;
  }
  
  return null;
};

// Video Feed Item
const VideoFeedItem: React.FC<{ item: FeedItem; formatTimestamp: (timestamp: string) => string; currentUserId?: string; onDelete?: () => void; onStudyBuddy?: (userId: string) => void; isConnected?: boolean }> = ({ item, formatTimestamp, currentUserId, onDelete, onStudyBuddy, isConnected }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [localIsConnected, setLocalIsConnected] = React.useState(isConnected || false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  
  // Update local state when prop changes
  React.useEffect(() => {
    setLocalIsConnected(isConnected || false);
  }, [isConnected]);
  
  console.log('🚀 VideoFeedItem COMPONENT STARTED for:', item.title);
  
  const videoId = item.videoUrl ? getYouTubeVideoId(item.videoUrl) : null;
  const isYouTube = !!videoId;
  
  // Debug logging for video URLs
  console.log('🎬 VideoFeedItem Debug:', {
    videoUrl: item.videoUrl,
    videoId,
    isYouTube,
    embedUrl: item.videoUrl ? getYouTubeEmbedUrl(item.videoUrl) : null
  });
  const [imageError, setImageError] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [likes, setLikes] = React.useState(item.likes || 0);
  
  // Reset image error state when videoId changes
  React.useEffect(() => {
    setImageError(false);
  }, [videoId]);
  const [isLiked, setIsLiked] = React.useState(item.isLiked || false);
  const [comments, setComments] = React.useState(item.comments || 0);
  const [showComments, setShowComments] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);
  const [showRespond, setShowRespond] = React.useState(false);
  const [respondText, setRespondText] = React.useState('');
  const [isSubmittingRespond, setIsSubmittingRespond] = React.useState(false);
  const [userRating, setUserRating] = React.useState<number>(0); // 0 means not rated, 1-5 is the rating
  const [averageRating, setAverageRating] = React.useState<number>(0); // Average rating from all users
  const videoRef = React.useRef<HTMLVideoElement>(null);
  
  // Sync isLiked state with item prop when it changes
  React.useEffect(() => {
    setIsLiked(item.isLiked || false);
    setLikes(item.likes || 0);
    setComments(item.comments || 0);
  }, [item.isLiked, item.likes, item.comments]);
  
  // Load current user's rating for this video
  React.useEffect(() => {
    const loadUserRating = async () => {
      if (!user?.id || !item.id) return;
      
      try {
        const response = await fetch(`/api/videos/${item.id}/rating?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.rating) {
            setUserRating(data.rating);
          }
        }
      } catch (error) {
        console.error('Error loading user rating:', error);
      }
    };
    
    loadUserRating();
  }, [user?.id, item.id]);
  
  // Check if avatar is emoji or valid image
  const isEmoji = item.author?.avatar && item.author.avatar.length <= 4 && !item.author.avatar.startsWith('http');
  const hasValidAvatar = item.author?.avatar && !item.author.avatar.includes('placeholder') && !imageError;
  
  // Debug avatar logic
  console.log('🖼️ Avatar debug:', {
    authorAvatar: item.author?.avatar,
    isEmoji,
    hasValidAvatar,
    imageError,
    authorName: item.author?.name
  });
  
  // Check if this is the current user's video
  const isMyVideo = currentUserId && item.author?.id === currentUserId;
  
  // Debug logging
  if (item.type === 'video') {
    console.log('🎥 Video item:', {
      title: item.title,
      authorId: item.author?.id,
      currentUserId,
      isMyVideo,
      videoUrl: item.videoUrl,
      author: item.author,
      authorName: item.author?.name,
      authorAvatar: item.author?.avatar
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

  const handleLike = async () => {
    if (!user) {
      console.error('User not available for like action');
      return;
    }
    
    try {
      console.log('🔄 Attempting to like video:', item.id, 'with user:', user.id);
      const response = await fetch(`/api/videos/${item.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id,
          isLiked: !isLiked
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Like response:', data);
        if (data.success) {
          setLikes(data.likes);
          setIsLiked(data.isLiked);
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to like video:', errorData);
      }
    } catch (error) {
      console.error('❌ Error liking video:', error);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || isSubmittingComment || !user) return;
    
    try {
      setIsSubmittingComment(true);
      console.log('🔄 Attempting to post comment on video:', item.id, 'with user:', user.id);
      const response = await fetch(`/api/videos/${item.id}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'comment',
          userId: user.id,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          userAvatar: user.avatar || '/api/placeholder/40/40',
          content: commentText.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Comment response:', data);
        if (data.success) {
          setComments(prev => prev + 1);
          setCommentText('');
          // Optionally refresh comments list here
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to post comment:', errorData);
      }
    } catch (error) {
      console.error('❌ Error posting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleRespond = async () => {
    if (!respondText.trim() || isSubmittingRespond || !user) return;
    
    try {
      setIsSubmittingRespond(true);
      console.log('🔄 Attempting to submit response for video:', item.id, 'with user:', user.id);
      const response = await fetch(`/api/videos/${item.id}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'response',
          userId: user.id,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          userAvatar: user.avatar || '/api/placeholder/40/40',
          content: respondText.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Response submitted:', data);
        if (data.success) {
          setRespondText('');
          setShowRespond(false);
          // Optionally show success message
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to submit response:', errorData);
      }
    } catch (error) {
      console.error('❌ Error submitting response:', error);
    } finally {
      setIsSubmittingRespond(false);
    }
  };

  const handleRating = async (rating: number) => {
    if (!user || !item.id) return;
    
    try {
      console.log(`⭐ Rating video ${item.id} with ${rating} stars`);
      const response = await fetch(`/api/videos/${item.id}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'rating',
          userId: user.id,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          userAvatar: user.avatar || '/api/placeholder/40/40',
          rating: rating,
          contentCreatorId: item.author?.id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserRating(rating);
          // Update average rating if returned
          if (data.averageRating !== undefined) {
            setAverageRating(data.averageRating);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error submitting rating:', error);
    }
  };

  // Track video view when component mounts (dashboard display)
  React.useEffect(() => {
    const trackView = async () => {
      if (!item.id || !user?.id) return;
      
      try {
        console.log('📊 Tracking view for video:', item.id, 'user:', user.id);
        await fetch(`/api/videos/${item.id}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    };

    // Track view after a short delay to ensure video is actually viewed
    const timer = setTimeout(trackView, 2000);
    return () => clearTimeout(timer);
  }, [item.id, user?.id]);

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
    <div className="bg-gradient-to-r from-white via-purple-50/30 to-blue-50/30 border-l-4 border-purple-500 border-b-2 border-purple-200/50 shadow-md mb-2">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-blue-50/50">
        <div className="flex items-center space-x-3">
          <div 
            onClick={(e) => {
              e.stopPropagation();
              if (item.author?.id) {
                router.push(`/student/profile/${item.author.id}`);
              }
            }}
            className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors"
          >
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
              <div className="flex items-center space-x-2">
                <p className="font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors">{item.author?.name}</p>
                
                {/* Study Buddy Button - only show if not current user */}
                {item.author?.id && item.author.id !== currentUserId && onStudyBuddy && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (item.author?.id && onStudyBuddy && !isConnecting) {
                        setIsConnecting(true);
                        console.log('🔄 Connect button clicked for:', item.author.id);
                        await onStudyBuddy(item.author.id);
                        setLocalIsConnected(true);
                        setIsConnecting(false);
                      }
                    }}
                    disabled={isConnecting}
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded border transition-all text-xs ${
                      localIsConnected 
                        ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100' 
                        : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                    } disabled:opacity-50`}
                    title={localIsConnected ? 'Study Buddy' : 'Connect as Study Buddy'}
                  >
                    {localIsConnected ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                    <span className="font-medium">{localIsConnected ? 'Connected' : (isConnecting ? '...' : 'Connect')}</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">{formatTimestamp(item.timestamp)}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {item.courseInitials && (
            <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-semibold rounded-full shadow-lg">
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
        {isYouTube && videoId ? (
          <div className="relative w-full h-full group">
            <img
              src={imageError 
                ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
              }
              alt={item.title || 'Video'}
              className="w-full h-full object-cover cursor-pointer"
              onClick={(e) => {
                const iframe = document.createElement('iframe');
                iframe.src = `${getYouTubeEmbedUrl(item.videoUrl || '')}?autoplay=1&mute=0&rel=0&modestbranding=1`;
                iframe.className = 'w-full h-full';
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframe.allowFullscreen = true;
                iframe.title = item.title || 'Video';
                e.currentTarget.parentElement?.replaceChild(iframe, e.currentTarget);
              }}
              onError={() => {
                // Use state to prevent infinite loop
                if (!imageError) {
                  setImageError(true);
                }
              }}
            />
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
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
        <button 
          onClick={() => router.push(`/student/assignments/${item.assignmentId}/feed`)}
          className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-left w-full mb-3"
        >
          {item.title}
        </button>
        <InteractionBar
          videoId={item.id!}
          contentCreatorId={item.author?.id}
          currentUser={{ id: user?.id!, firstName: user?.firstName, lastName: user?.lastName, email: user?.email, avatar: user?.avatar }}
          initialLikes={likes}
          initialComments={comments}
          initialIsLiked={isLiked}
          initialUserRating={userRating}
          onCountsChange={(c) => {
            if (typeof c.likes === 'number') setLikes(c.likes);
            if (typeof c.comments === 'number') setComments(c.comments);
            if (typeof c.userRating === 'number') setUserRating(c.userRating);
            if (typeof c.averageRating === 'number') setAverageRating(c.averageRating);
          }}
        />
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="space-y-3">
            {/* Comment Input */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim() || isSubmittingComment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingComment ? 'Posting...' : 'Post'}
              </button>
            </div>
            
            {/* Comments List - Placeholder for now */}
            <div className="text-sm text-gray-500 italic">
              Comments will appear here...
            </div>
          </div>
        </div>
      )}

      {/* Respond Section */}
      {showRespond && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Submit Your Response</h4>
            <div className="flex space-x-2">
              <textarea
                value={respondText}
                onChange={(e) => setRespondText(e.target.value)}
                placeholder="Write your response here..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows={3}
              />
              <button
                onClick={handleRespond}
                disabled={!respondText.trim() || isSubmittingRespond}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingRespond ? 'Submitting...' : 'Submit'}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              This response will be submitted for grading and assessment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Community Feed Item
const CommunityFeedItem: React.FC<{ item: FeedItem; formatTimestamp: (timestamp: string) => string; onStudyBuddy?: (userId: string) => void; isConnected?: boolean }> = ({ item, formatTimestamp, onStudyBuddy, isConnected }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [imageError, setImageError] = React.useState(false);
  const [showComments, setShowComments] = React.useState(false);
  const [likes, setLikes] = React.useState(item.likes || 0);
  const [isLiked, setIsLiked] = React.useState(item.isLiked || false);
  const [comments, setComments] = React.useState(item.comments || 0);
  const [commentText, setCommentText] = React.useState('');
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);
  
  // Check if avatar is emoji (single character, 2-4 bytes)
  const isEmoji = item.author?.avatar && item.author.avatar.length <= 4 && !item.author.avatar.startsWith('http');
  const hasValidAvatar = item.author?.avatar && !item.author.avatar.includes('placeholder') && !imageError;

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/videos/${item.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user?.id,
          isLiked: !isLiked
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLikes(data.likes);
          setIsLiked(data.isLiked);
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || isSubmittingComment || !user) return;
    
    try {
      setIsSubmittingComment(true);
      const response = await fetch(`/api/videos/${item.id}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'comment',
          userId: user.id,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          userAvatar: user.avatar || '/api/placeholder/40/40',
          content: commentText.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setComments(prev => prev + 1);
          setCommentText('');
        }
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-white via-blue-50/30 to-pink-50/30 border-b-2 border-blue-200/50 px-4 py-4 shadow-md mb-2">
      {/* Header */}
      <div 
        onClick={() => item.author?.id && handleUserClick(item.author.id)}
        className="flex items-center space-x-3 mb-3 cursor-pointer hover:bg-white/50 rounded-lg p-1 -m-1 transition-colors"
      >
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
        <div className="flex-1 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors">{item.author?.name}</p>
            <p className="text-xs text-gray-500">{formatTimestamp(item.timestamp)}</p>
          </div>
          {/* Study Buddy Button - only show if not current user */}
          {item.author?.id && item.author.id !== user?.id && onStudyBuddy && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStudyBuddy(item.author!.id!);
              }}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all font-medium text-sm ${
                isConnected 
                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-md' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
              }`}
              title={isConnected ? 'Study Buddy' : 'Connect as Study Buddy'}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span>{isConnected ? 'Connected' : 'Connect'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {item.title && item.title !== item.content && <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>}
      <p className="text-gray-700 whitespace-pre-wrap">{item.content}</p>

      {/* Actions */}
      <div className="flex items-center space-x-4 mt-3 text-gray-600">
        <button 
          onClick={handleLike}
          className={`flex items-center space-x-1 transition-colors ${
            isLiked ? 'text-red-500' : 'hover:text-red-500'
          }`}
        >
          <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-sm">{likes}</span>
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-1 hover:text-blue-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm">{comments} {comments === 1 ? 'comment' : 'comments'}</span>
        </button>
        <button 
          onClick={() => router.push(`/student/grading/${item.id}`)}
          className="flex items-center space-x-1 hover:text-green-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">Respond</span>
        </button>
      </div>

      {/* Collapsible Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="space-y-3">
            {/* Comment Input */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim() || isSubmittingComment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingComment ? 'Posting...' : 'Post'}
              </button>
            </div>
            
            {/* Comments List - Placeholder for now */}
            <div className="text-sm text-gray-500 italic">
              Comments will appear here...
            </div>
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

