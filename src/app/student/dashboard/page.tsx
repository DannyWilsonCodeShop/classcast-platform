'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { FeedItem } from '@/app/api/student/feed/route';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout/DashboardLayout';
import CourseProgressCard from '@/components/dashboard/widgets/CourseProgressCard';
import StudyStreak from '@/components/dashboard/widgets/StudyStreak';
import { VirtualizedFeed } from '@/components/student/VirtualizedFeed';
import InteractionBar from '@/components/student/InteractionBar';
import Avatar from '@/components/common/Avatar';
import { getVideoUrl } from '@/lib/videoUtils';
import { parseVideoUrl, getEmbedUrl } from '@/lib/urlUtils';
import { extractYouTubeVideoId as getYouTubeVideoId } from '@/lib/youtube';
import RichTextRenderer from '@/components/common/RichTextRenderer';
import DemoModeBanner from '@/components/common/DemoModeBanner';
import { 
  AcademicCapIcon, 
  ClockIcon, 
  TrophyIcon, 
  ChartBarIcon,
  BookOpenIcon,
  VideoCameraIcon,
  UserGroupIcon,
  StarIcon,
  PlayIcon,
  FireIcon,
  HeartIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';

interface Course {
  courseId: string;
  name: string;
  initials: string;
  code: string;
  unreadCount: number;
}

interface CourseData {
  courseId: string;
  courseName: string;
  courseCode: string;
  instructor: {
    name: string;
    email: string;
  };
  semester: string;
  year: number;
  enrolledAt: string;
}

// Daily rotating community questions
const DAILY_QUESTIONS = [
  "Share a funny moment from your day!",
  "Quote of the day—go!",
  "What song is stuck in your head?",
  "What's one thing you learned today?",
  "Describe your mood with emojis!",
  "Favorite school subject and why?",
  "Coffee, tea, or juice?",
  "What's your weekend plan?",
  "One word to describe today?",
  "Favorite movie or show right now?",
  "What's your dream vacation spot?",
  "Post a joke or pun!",
  "Favorite lunch food?",
  "What inspires you today?",
  "What's your go-to study snack?",
  "Favorite book or author?",
  "Would you rather fly or be invisible?",
  "Post a random fun fact!",
  "What's one goal for this week?",
  "Who's your favorite historical figure?",
  "What's your favorite science topic?",
  "Math: circles or triangles?",
  "Write a 3-word story!",
  "Post a cool nature fact!",
  "If school had a mascot, what's it?",
  "What's your favorite planet?",
  "One thing that made you smile?",
  "What's your favorite season?",
  "History or literature—pick one!",
  "What's one thing you're grateful for?",
  "Favorite word in another language?",
  "Describe your day as weather!",
  "What's your favorite sport?",
  "One emoji that sums up today?",
  "Share a study tip!",
  "What's one talent you have?",
  "Favorite animal and why?",
  "What invention changed the world?",
  "If you were a color, which one?",
  "What's one mystery you'd solve?"
];

// Function to get today's question based on the date
const getDailyQuestion = (): string => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const questionIndex = dayOfYear % DAILY_QUESTIONS.length;
  return DAILY_QUESTIONS[questionIndex];
};

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Set<string>>(new Set());
  const [includeAllPublicVideos, setIncludeAllPublicVideos] = useState(false);
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [dailyQuestion] = useState(getDailyQuestion());
  const [activityStats, setActivityStats] = useState({
    daysActive: 0,
    assignmentsCompleted: 0,
    currentStreak: 0,
    averageProgress: 0
  });

  useEffect(() => {
    if (user?.id) {
      fetchFeed();
      loadConnections();
    }
  }, [user, includeAllPublicVideos]);

  useEffect(() => {
    // Load activity stats after feed and connections are loaded
    if (feed.length > 0 || connections.size > 0) {
      loadActivityStats();
    }
  }, [feed, connections, user?.id]);

  const fetchFeed = async () => {
    try {
      const response = await fetch(`/api/student/feed?userId=${user?.id}&includeAllPublic=${includeAllPublicVideos}`);
      const data = await response.json();
      
      if (data.success) {
        const pinnedItems = data.feed.filter((item: FeedItem) => item.isPinned || item.isHighlighted);
        const regularItems = data.feed.filter((item: FeedItem) => !item.isPinned && !item.isHighlighted);
        const randomizedRegular = [...regularItems].sort(() => Math.random() - 0.5);
        const sortedFeed = [...pinnedItems, ...randomizedRegular];
        
        setFeed(sortedFeed);
        setCourses(data.courses);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConnections = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/connections?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success && data.connections) {
        const connectedIds = new Set<string>();
        data.connections.forEach((conn: any) => {
          if (conn.status === 'accepted') {
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

  const loadActivityStats = async () => {
    if (!user?.id) return;
    
    try {
      // Calculate meaningful progress metrics for occasional students
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      // Mock calculation of days active this month (in real app, track login dates)
      const daysActiveThisMonth = Math.floor(Math.random() * 15) + 5; // 5-20 days
      
      // Count completed assignments from feed
      const completedAssignments = feed.filter(item => 
        item.type === 'video' && item.author?.id === user.id
      ).length;
      
      // Mock current study streak (in real app, track consecutive days)
      const currentStreak = Math.floor(Math.random() * 10) + 1; // 1-10 days
      
      // Calculate course progress based on time to May 1st, 2025
      const now = new Date();
      const courseEndDate = new Date('2025-05-01');
      const courseStartDate = new Date('2024-08-15'); // Assume fall semester start
      
      let averageProgress = 0;
      if (now >= courseEndDate) {
        averageProgress = 100;
      } else if (now >= courseStartDate) {
        const totalDuration = courseEndDate.getTime() - courseStartDate.getTime();
        const elapsed = now.getTime() - courseStartDate.getTime();
        averageProgress = Math.round((elapsed / totalDuration) * 100);
      }

      setActivityStats({
        daysActive: daysActiveThisMonth,
        assignmentsCompleted: completedAssignments,
        currentStreak: currentStreak,
        averageProgress: Math.min(Math.max(averageProgress, 0), 100)
      });
    } catch (error) {
      console.error('Error loading activity stats:', error);
    }
  };

  const handleStudyBuddy = async (targetUserId: string) => {
    if (!user?.id || !targetUserId) return;
    
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: user.id,
          requestedId: targetUserId,
          status: 'accepted'
        })
      });

      const data = await response.json();
      if (data.success) {
        setConnections(prev => new Set(prev).add(targetUserId));
      }
    } catch (error) {
      console.error('Error adding study buddy:', error);
    }
  };

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = user?.firstName || 'Student';
    
    if (hour < 12) return `Good morning, ${firstName}!`;
    if (hour < 17) return `Good afternoon, ${firstName}!`;
    return `Good evening, ${firstName}!`;
  };

  const quickStats = [
    {
      name: 'Days Active',
      value: activityStats.daysActive,
      icon: ClockIcon,
      color: 'bg-blue-500',
      change: 'This month'
    },
    {
      name: 'Assignments Done',
      value: activityStats.assignmentsCompleted,
      icon: AcademicCapIcon,
      color: 'bg-green-500',
      change: 'Completed work'
    },
    {
      name: 'Study Streak',
      value: `${activityStats.currentStreak} days`,
      icon: FireIcon,
      color: 'bg-orange-500',
      change: 'Current streak'
    },
    {
      name: 'Course Progress',
      value: `${activityStats.averageProgress}%`,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      change: 'Overall progress'
    }
  ];

  const filteredFeedItems = feed.filter(item => item.type === 'video' || item.type === 'community');

  if (loading) {
    return (
      <StudentRoute>
        <DemoModeBanner />
        <DashboardLayout title="Loading..." subtitle="Getting your learning dashboard ready...">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3 bg-gray-200 h-64 rounded-xl"></div>
              <div className="bg-gray-200 h-64 rounded-xl"></div>
            </div>
          </div>
        </DashboardLayout>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <DemoModeBanner />
      <DashboardLayout 
        title={getGreeting()} 
        subtitle="Ready to continue your learning journey?"
      >
        <div className="h-[calc(100vh-200px)] overflow-hidden">
          {/* Main Content Grid - Fixed Height */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            {/* Left Column - Social Feed (3/4 width) */}
            <div className="lg:col-span-3 flex flex-col h-full">
              {/* Community Post Bar - Compact */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-4 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <Avatar 
                    user={user}
                    size="md"
                    className="w-8 h-8"
                  />
                  <button
                    onClick={() => setShowPostComposer(!showPostComposer)}
                    className="flex-1 px-3 py-2 bg-gray-50 rounded-full text-left text-gray-600 text-sm hover:bg-gray-100 transition-all border border-gray-200"
                  >
                    ✨ {dailyQuestion}
                  </button>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-1 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeAllPublicVideos}
                        onChange={(e) => setIncludeAllPublicVideos(e.target.checked)}
                        className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                      />
                      <span className="whitespace-nowrap flex items-center">
                        <FireIcon className="w-3 h-3 mr-1 text-orange-500" />
                        Explore
                      </span>
                    </label>
                  </div>
                </div>

                {/* Expanded Post Composer - Compact */}
                {showPostComposer && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder={dailyQuestion}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex items-center justify-end space-x-2 mt-2">
                      <button
                        onClick={() => {
                          setShowPostComposer(false);
                          setPostContent('');
                        }}
                        className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePostSubmit}
                        disabled={!postContent.trim()}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Explore Mode Indicator - Compact */}
              {includeAllPublicVideos && (
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-2 flex items-center justify-between shadow-md mb-4 flex-shrink-0">
                  <div className="flex items-center space-x-2 text-white">
                    <FireIcon className="w-4 h-4" />
                    <div>
                      <p className="font-semibold text-xs">Explore Mode Active</p>
                      <p className="text-xs opacity-90">Showing public videos from all courses</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIncludeAllPublicVideos(false)}
                    className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                    title="Return to my courses only"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Student Videos & Community Feed - Scrollable */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0">
                <div className="p-3 border-b border-gray-200 flex-shrink-0">
                  <h3 className="text-base font-bold text-gray-900">Student Videos & Community</h3>
                  <p className="text-xs text-gray-600">See what your classmates are sharing</p>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {filteredFeedItems.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <VideoCameraIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">No Posts Yet</h3>
                      <p className="text-sm text-gray-600">
                        Student videos and community posts will appear here.
                      </p>
                    </div>
                  ) : (
                    <VirtualizedFeed
                      feedItems={filteredFeedItems}
                      renderItem={(item, index) => (
                        <CompactFeedItemComponent 
                          key={item.id} 
                          item={item} 
                          formatTimestamp={formatTimestamp} 
                          currentUserId={user?.id} 
                          onDelete={fetchFeed} 
                          assignmentId={item.assignmentId}
                          onStudyBuddy={handleStudyBuddy}
                          isConnected={connections.has(item.author?.id || '')}
                        />
                      )}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Simplified Widgets (1/4 width) */}
            <div className="space-y-4 h-full overflow-y-auto">
              {/* Upcoming Assignments */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-bold text-gray-900 mb-3">Upcoming Assignments</h3>
                <div className="text-center py-4">
                  <ClockIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No upcoming assignments</p>
                </div>
              </div>

              {/* Study Modules */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-900">Study Modules</h3>
                  <button
                    onClick={() => router.push('/student/study-modules')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="text-center py-4">
                  <AcademicCapIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Coming Soon</p>
                  <p className="text-xs text-gray-400 mt-1">Interactive study modules will be available soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </StudentRoute>
  );
};

// Compact Feed Item Component for space-efficient display
const CompactFeedItemComponent: React.FC<{ 
  item: FeedItem; 
  formatTimestamp: (timestamp: string) => string; 
  currentUserId?: string; 
  onDelete?: () => void; 
  assignmentId?: string; 
  onStudyBuddy?: (userId: string) => void; 
  isConnected?: boolean 
}> = ({ item, formatTimestamp, currentUserId, onDelete, onStudyBuddy, isConnected }) => {
  if (item.type === 'video') {
    return <CompactVideoFeedItem item={item} formatTimestamp={formatTimestamp} currentUserId={currentUserId} onDelete={onDelete} onStudyBuddy={onStudyBuddy} isConnected={isConnected} />;
  }
  
  if (item.type === 'community') {
    return <CompactCommunityFeedItem item={item} formatTimestamp={formatTimestamp} onStudyBuddy={onStudyBuddy} isConnected={isConnected} />;
  }
  
  return null;
};

// Compact Video Feed Item - Smaller and more space-efficient
const CompactVideoFeedItem: React.FC<{ 
  item: FeedItem; 
  formatTimestamp: (timestamp: string) => string; 
  currentUserId?: string; 
  onDelete?: () => void; 
  onStudyBuddy?: (userId: string) => void; 
  isConnected?: boolean 
}> = ({ item, formatTimestamp, currentUserId, onDelete, onStudyBuddy, isConnected }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [localIsConnected, setLocalIsConnected] = React.useState(isConnected || false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [likes, setLikes] = React.useState(item.likes || 0);
  const [isLiked, setIsLiked] = React.useState(item.isLiked || false);
  const [comments, setComments] = React.useState(item.comments || 0);
  const [userRating, setUserRating] = React.useState<number>(0);
  
  React.useEffect(() => {
    setLocalIsConnected(isConnected || false);
  }, [isConnected]);

  const videoUrlInfo = item.videoUrl ? parseVideoUrl(item.videoUrl) : null;
  const isYouTube = videoUrlInfo?.type === 'youtube';
  const videoId = isYouTube ? videoUrlInfo?.videoId || null : null;
  const embedUrl = item.videoUrl ? getEmbedUrl(item.videoUrl) : null;
  const [imageError, setImageError] = React.useState(false);

  return (
    <div className="border-b border-gray-100 p-4 hover:bg-gray-50/50 transition-colors">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div 
            onClick={() => item.author?.id && router.push(`/student/profile/${item.author.id}`)}
            className="cursor-pointer"
          >
            <Avatar 
              src={item.author?.avatar}
              name={item.author?.name}
              size="sm"
              className="w-6 h-6 hover:ring-2 hover:ring-blue-300 transition-all"
            />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <p 
                onClick={() => item.author?.id && router.push(`/student/profile/${item.author.id}`)}
                className="font-medium text-xs text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
              >
                {item.author?.name}
              </p>
              
              {/* Compact Study Buddy Button */}
              {item.author?.id && item.author.id !== currentUserId && onStudyBuddy && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (item.author?.id && onStudyBuddy && !isConnecting) {
                      setIsConnecting(true);
                      await onStudyBuddy(item.author.id);
                      setLocalIsConnected(true);
                      setIsConnecting(false);
                    }
                  }}
                  disabled={isConnecting}
                  className={`inline-flex items-center px-1.5 py-0.5 rounded border transition-all text-xs ${
                    localIsConnected 
                      ? 'bg-green-50 border-green-300 text-green-700' 
                      : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                  } disabled:opacity-50`}
                >
                  {localIsConnected ? '✓' : '+'}
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">{formatTimestamp(item.timestamp)}</p>
          </div>
        </div>
        
        {item.courseInitials && (
          <span className="px-2 py-0.5 text-white text-xs font-medium rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
            {item.courseInitials}
          </span>
        )}
      </div>

      {/* Better Sized Video Player */}
      <div className="relative w-full bg-black mb-3 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        {isYouTube && videoId && embedUrl ? (
          <div 
            className="relative w-full h-full group cursor-pointer"
            onClick={(e) => {
              const iframe = document.createElement('iframe');
              iframe.src = `${embedUrl}?autoplay=1&controls=1&rel=0&modestbranding=1`;
              iframe.className = 'w-full h-full';
              iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
              iframe.allowFullscreen = true;
              iframe.title = item.title || 'Video';
              e.currentTarget.replaceWith(iframe);
            }}
          >
            <img
              src={imageError 
                ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
              }
              alt={item.title || 'Video'}
              className="w-full h-full object-cover"
              onError={() => {
                if (!imageError) {
                  setImageError(true);
                }
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                <PlayIcon className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
              </div>
            </div>
          </div>
        ) : (
          <video
            src={getVideoUrl(item.videoUrl)}
            className="w-full h-full object-contain"
            controls
            playsInline
          />
        )}
      </div>

      {/* Title & Actions */}
      <div>
        <button 
          onClick={() => router.push(`/student/assignments/${item.assignmentId}/feed`)}
          className="font-medium text-sm text-gray-900 hover:text-blue-600 transition-colors text-left w-full mb-3 line-clamp-2"
        >
          {item.title}
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-gray-600">
            <button className={`flex items-center space-x-1 transition-colors text-xs ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
              <HeartIcon className="w-3 h-3" fill={isLiked ? 'currentColor' : 'none'} />
              <span>{likes}</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors text-xs">
              <ChatBubbleLeftIcon className="w-3 h-3" />
              <span>{comments}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact Community Feed Item - Smaller and more space-efficient
const CompactCommunityFeedItem: React.FC<{ 
  item: FeedItem; 
  formatTimestamp: (timestamp: string) => string; 
  onStudyBuddy?: (userId: string) => void; 
  isConnected?: boolean 
}> = ({ item, formatTimestamp, onStudyBuddy, isConnected }) => {
  const { user } = useAuth();
  const [likes, setLikes] = React.useState(item.likes || 0);
  const [isLiked, setIsLiked] = React.useState(item.isLiked || false);
  const [comments, setComments] = React.useState(item.comments || 0);

  return (
    <div className="border-b border-gray-100 p-4 hover:bg-gray-50/50 transition-colors">
      {/* Compact Header */}
      <div className="flex items-center space-x-2 mb-3">
        <Avatar 
          src={item.author?.avatar}
          name={item.author?.name}
          size="sm"
          className="w-6 h-6"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-xs text-gray-900">{item.author?.name}</p>
              <p className="text-xs text-gray-500">{formatTimestamp(item.timestamp)}</p>
            </div>
            {/* Compact Study Buddy Button */}
            {item.author?.id && item.author.id !== user?.id && onStudyBuddy && (
              <button
                onClick={() => onStudyBuddy(item.author!.id!)}
                className={`flex items-center px-2 py-1 rounded text-xs transition-all ${
                  isConnected 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isConnected ? '✓' : '+'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Compact Content */}
      {item.title && item.title !== item.content && <h3 className="font-medium text-xs text-gray-900 mb-1">{item.title}</h3>}
      <p className="text-gray-700 text-xs leading-relaxed mb-2 line-clamp-3">{item.content}</p>

      {/* Compact Actions */}
      <div className="flex items-center space-x-3 text-gray-600">
        <button className={`flex items-center space-x-1 transition-colors text-xs ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
          <HeartIcon className="w-3 h-3" fill={isLiked ? 'currentColor' : 'none'} />
          <span>{likes}</span>
        </button>
        <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors text-xs">
          <ChatBubbleLeftIcon className="w-3 h-3" />
          <span>{comments}</span>
        </button>
      </div>
    </div>
  );
};

// Feed Item Component (reused from original dashboard)
const FeedItemComponent: React.FC<{ 
  item: FeedItem; 
  formatTimestamp: (timestamp: string) => string; 
  currentUserId?: string; 
  onDelete?: () => void; 
  assignmentId?: string; 
  onStudyBuddy?: (userId: string) => void; 
  isConnected?: boolean 
}> = ({ item, formatTimestamp, currentUserId, onDelete, onStudyBuddy, isConnected }) => {
  if (item.type === 'video') {
    return <VideoFeedItem item={item} formatTimestamp={formatTimestamp} currentUserId={currentUserId} onDelete={onDelete} onStudyBuddy={onStudyBuddy} isConnected={isConnected} />;
  }
  
  if (item.type === 'community') {
    return <CommunityFeedItem item={item} formatTimestamp={formatTimestamp} onStudyBuddy={onStudyBuddy} isConnected={isConnected} />;
  }
  
  return null;
};

// Video Feed Item (simplified version with smart loading)
const VideoFeedItem: React.FC<{ 
  item: FeedItem; 
  formatTimestamp: (timestamp: string) => string; 
  currentUserId?: string; 
  onDelete?: () => void; 
  onStudyBuddy?: (userId: string) => void; 
  isConnected?: boolean 
}> = ({ item, formatTimestamp, currentUserId, onDelete, onStudyBuddy, isConnected }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [localIsConnected, setLocalIsConnected] = React.useState(isConnected || false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [likes, setLikes] = React.useState(item.likes || 0);
  const [isLiked, setIsLiked] = React.useState(item.isLiked || false);
  const [comments, setComments] = React.useState(item.comments || 0);
  const [userRating, setUserRating] = React.useState<number>(0);
  
  React.useEffect(() => {
    setLocalIsConnected(isConnected || false);
  }, [isConnected]);

  const videoUrlInfo = item.videoUrl ? parseVideoUrl(item.videoUrl) : null;
  const isYouTube = videoUrlInfo?.type === 'youtube';
  const videoId = isYouTube ? videoUrlInfo?.videoId || null : null;
  const embedUrl = item.videoUrl ? getEmbedUrl(item.videoUrl) : null;
  const [imageError, setImageError] = React.useState(false);

  return (
    <div className="border-b border-gray-100 p-6 hover:bg-gray-50/50 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            onClick={() => item.author?.id && router.push(`/student/profile/${item.author.id}`)}
            className="cursor-pointer"
          >
            <Avatar 
              src={item.author?.avatar}
              name={item.author?.name}
              size="lg"
              className="w-10 h-10 hover:ring-2 hover:ring-blue-300 transition-all"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <p 
                onClick={() => item.author?.id && router.push(`/student/profile/${item.author.id}`)}
                className="font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
              >
                {item.author?.name}
              </p>
              
              {/* Study Buddy Button */}
              {item.author?.id && item.author.id !== currentUserId && onStudyBuddy && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (item.author?.id && onStudyBuddy && !isConnecting) {
                      setIsConnecting(true);
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
        
        <div className="flex items-center space-x-2">
          {item.courseInitials && (
            <span className="px-3 py-1 text-white text-xs font-semibold rounded-full shadow-lg bg-gradient-to-r from-purple-500 to-blue-500">
              {item.courseInitials}
            </span>
          )}
        </div>
      </div>

      {/* Video Player - Smart Loading */}
      <div className="relative w-full bg-black mb-4 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        {isYouTube && videoId && embedUrl ? (
          <div 
            className="relative w-full h-full group cursor-pointer"
            onClick={(e) => {
              const iframe = document.createElement('iframe');
              iframe.src = `${embedUrl}?autoplay=1&controls=1&rel=0&modestbranding=1`;
              iframe.className = 'w-full h-full';
              iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
              iframe.allowFullscreen = true;
              iframe.title = item.title || 'Video';
              e.currentTarget.replaceWith(iframe);
            }}
          >
            <img
              src={imageError 
                ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
              }
              alt={item.title || 'Video'}
              className="w-full h-full object-cover"
              onError={() => {
                if (!imageError) {
                  setImageError(true);
                }
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl">
                <PlayIcon className="w-6 h-6 text-white ml-1" fill="currentColor" />
              </div>
            </div>
          </div>
        ) : (
          <video
            src={getVideoUrl(item.videoUrl)}
            className="w-full h-full object-contain"
            controls
            playsInline
          />
        )}
      </div>

      {/* Title & Actions */}
      <div>
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
          }}
        />
      </div>
    </div>
  );
};

// Community Feed Item (simplified version)
const CommunityFeedItem: React.FC<{ 
  item: FeedItem; 
  formatTimestamp: (timestamp: string) => string; 
  onStudyBuddy?: (userId: string) => void; 
  isConnected?: boolean 
}> = ({ item, formatTimestamp, onStudyBuddy, isConnected }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [likes, setLikes] = React.useState(item.likes || 0);
  const [isLiked, setIsLiked] = React.useState(item.isLiked || false);
  const [comments, setComments] = React.useState(item.comments || 0);

  return (
    <div className="border-b border-gray-100 p-6 hover:bg-gray-50/50 transition-colors">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-3">
        <Avatar 
          src={item.author?.avatar}
          name={item.author?.name}
          size="lg"
          className="w-10 h-10"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-gray-900">{item.author?.name}</p>
              <p className="text-xs text-gray-500">{formatTimestamp(item.timestamp)}</p>
            </div>
            {/* Study Buddy Button */}
            {item.author?.id && item.author.id !== user?.id && onStudyBuddy && (
              <button
                onClick={() => onStudyBuddy(item.author!.id!)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all font-medium text-sm ${
                  isConnected 
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-md' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                }`}
              >
                <UserGroupIcon className="w-4 h-4" />
                <span>{isConnected ? 'Connected' : 'Connect'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {item.title && item.title !== item.content && <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>}
      <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed mb-3">{item.content}</p>

      {/* Actions */}
      <div className="flex items-center space-x-4 text-gray-600">
        <button className={`flex items-center space-x-1 transition-colors ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
          <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-sm">{likes}</span>
        </button>
        <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm">{comments} {comments === 1 ? 'comment' : 'comments'}</span>
        </button>
      </div>
    </div>
  );
};

export default StudentDashboard;