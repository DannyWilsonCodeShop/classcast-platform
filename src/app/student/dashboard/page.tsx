'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { CompactAssignmentList } from '@/components/student/CompactAssignmentList';
import VideoReels from '@/components/student/VideoReels';
import CourseCard from '@/components/student/CourseCard';
import PortalIndicator from '@/components/common/PortalIndicator';
import StudentOnboardingWizard from '@/components/wizards/StudentOnboardingWizard';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, Wifi, WifiOff } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ai-tutor'>('ai-tutor');
  const [showWizard, setShowWizard] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState({
    activeCourses: 0,
    assignmentsDue: 0,
    completed: 0
  });
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  useEffect(() => {
    // Only load data if user is authenticated
    if (!isAuthenticated || !user || isLoading) {
      return;
    }

    const loadDashboardData = async () => {
      try {
        setIsLoadingStats(true);
        setIsLoadingCourses(true);
        setIsLoadingAssignments(true);
        
        // Set fallback data immediately
          setStats({
            activeCourses: 0,
            assignmentsDue: 0,
            completed: 0
          });
        setCourses([]);
        setAssignments([]);
        
        // Try to load stats from API (with error handling)
        try {
          const statsResponse = await fetch('/api/student/stats');
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setStats(statsData);
          }
        } catch (error) {
          console.warn('Stats API not available:', error);
        }
        
        // Try to load courses from API (with error handling)
        try {
        const coursesResponse = await fetch('/api/student/courses');
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
            setCourses(coursesData.courses || coursesData || []);
          }
        } catch (error) {
          console.warn('Courses API not available:', error);
        }
        
        // Try to load assignments from API (with error handling)
        try {
        const assignmentsResponse = await fetch('/api/student/assignments');
        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json();
            setAssignments(assignmentsData.assignments || assignmentsData || []);
          }
        } catch (error) {
          console.warn('Assignments API not available:', error);
        }
        
        // Try to load community posts from API (with error handling)
        try {
          setIsLoadingPosts(true);
          const postsResponse = await fetch('/api/community/posts');
          if (postsResponse.ok) {
            const postsData = await postsResponse.json();
            setCommunityPosts(postsData || []);
          }
        } catch (error) {
          console.warn('Community posts API not available:', error);
        } finally {
          setIsLoadingPosts(false);
        }
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Set empty data on error
        setStats({ activeCourses: 0, assignmentsDue: 0, completed: 0 });
        setCourses([]);
        setAssignments([]);
      } finally {
        setIsLoadingStats(false);
        setIsLoadingCourses(false);
        setIsLoadingAssignments(false);
      }
    };

    loadDashboardData();
  }, [isAuthenticated, user, isLoading]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <StudentRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl shadow-lg overflow-hidden">
                <img 
                  src="/UpdatedCCLogo.png" 
                  alt="ClassCast Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#4A90E2] mb-2">
              ClassCast
            </h2>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A90E2] mx-auto mb-4"></div>
            <p className="text-[#333333]">Loading your dashboard...</p>
          </div>
        </div>
      </StudentRoute>
    );
  }

  // Show loading state if user is not authenticated
  if (!isAuthenticated || !user) {
    return (
      <StudentRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl shadow-lg overflow-hidden">
                <img 
                  src="/UpdatedCCLogo.png" 
                  alt="ClassCast Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#4A90E2] mb-2">
              ClassCast
            </h2>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A90E2] mx-auto mb-4"></div>
            <p className="text-[#333333]">Redirecting to login...</p>
          </div>
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <div className="h-screen overflow-hidden flex flex-col bg-[#F5F5F5]">
        {/* Branded Header */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-[#4A90E2]/20 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left Side - Logo and User Info */}
            <div className="flex items-center space-x-4">
              {/* ClassCast Logo */}
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-xl shadow-lg overflow-hidden">
                  <img 
                    src="/UpdatedCCLogo.png" 
                    alt="ClassCast Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-[#4A90E2]">
                    ClassCast
                  </h1>
                </div>
              </div>
              
              {/* User Welcome */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/student/profile')}
                  className="w-10 h-10 rounded-full bg-[#4A90E2] flex items-center justify-center text-white font-bold text-lg shadow-lg hover:scale-110 transition-all duration-200 cursor-pointer"
                  title="View Profile"
                >
                  {user?.firstName?.charAt(0) || 'S'}
                </button>
              <div>
                  <h2 className="text-lg font-bold text-[#333333]">Hey {user?.firstName || 'Student'}! 👋</h2>
                <div className="flex items-center space-x-2">
                  {isOnline ? (
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-[#06D6A0] rounded-full animate-pulse"></div>
                        <span className="text-xs text-[#06D6A0] font-medium">Live</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-[#333333] rounded-full"></div>
                        <span className="text-xs text-[#333333]">Offline</span>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Actions */}
            <div className="flex items-center space-x-2">
              <PortalIndicator />
              <button
                onClick={handleLogout}
                className="p-2 bg-[#FF6F61] text-white rounded-full hover:scale-110 transition-all duration-200 shadow-lg"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Branded Status Bar */}
        <div className="bg-[#F5F5F5] border-b border-[#4A90E2]/20 px-4 py-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-[#06D6A0] rounded-full animate-pulse"></div>
                <span className="text-[#06D6A0] font-medium">System Online</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-[#4A90E2] rounded-full"></div>
                <span className="text-[#4A90E2]">AI Features Active</span>
              </div>
            </div>
            <div className="text-[#333333]">
              Welcome to ClassCast Student Portal
            </div>
              </div>
            </div>

        {/* Single Page Content - No Scrolling */}
        <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 h-full">
          {/* Video Feed - Top Left */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-3 bg-[#4A90E2]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🎬</span>
                  </div>
                  <h2 className="text-white font-bold text-sm">Trending Now</h2>
                </div>
              </div>
            </div>
            <div className="p-3 h-64">
                <VideoReels studentId={user?.id || 'unknown'} />
              </div>
            </div>

          {/* Courses - Top Center */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-3 bg-[#06D6A0]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">📚</span>
                    </div>
                    <h2 className="text-white font-bold text-sm">My Courses</h2>
                  </div>
                  <button
                    onClick={() => router.push('/student/courses')}
                    className="text-white/80 hover:text-white text-xs font-medium"
                  >
                    See All →
                  </button>
                </div>
              </div>
            <div className="p-3 h-64 overflow-y-auto">
                {isLoadingCourses ? (
                <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse">
                      <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl h-16"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                <div className="space-y-2">
                  {courses.slice(0, 3).map((course) => (
                      <div
                        key={course.id}
                        onClick={() => router.push(`/student/courses/${course.id}`)}
                      className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 hover:shadow-lg cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                      >
                        <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {course.code?.charAt(0) || 'C'}
                          </div>
                          <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-bold text-gray-900 truncate">{course.name}</h3>
                            <p className="text-xs text-gray-600">{course.code}</p>
                            <div className="flex items-center space-x-2 mt-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                <div 
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full transition-all duration-300" 
                                  style={{ width: `${course.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-bold text-gray-700">{course.progress}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          {/* Assignments - Top Right */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-3 bg-[#FFD166]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">📝</span>
                    </div>
                  <h2 className="text-white font-bold text-sm">Assignments</h2>
                  </div>
                  <button
                    onClick={() => router.push('/student/assignments')}
                    className="text-white/80 hover:text-white text-xs font-medium"
                  >
                    See All →
                  </button>
                </div>
              </div>
            <div className="p-3 h-64 overflow-y-auto">
                {isLoadingAssignments ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                      <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl h-12"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                  {/* Upcoming Assignments */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Upcoming</h3>
                    <div className="space-y-2">
                      {assignments.filter(a => a.status === 'upcoming' || a.status === 'in-progress').slice(0, 2).map((assignment) => (
                      <div
                        key={assignment.id}
                        onClick={() => router.push(`/student/assignments/${assignment.id}`)}
                          className="bg-[#F5F5F5] rounded-lg p-2 hover:shadow-md cursor-pointer transition-all duration-200 border border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-gray-900 truncate">{assignment.title}</h4>
                            <p className="text-xs text-gray-600">{assignment.course}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-[#4A90E2] text-white">
                                📅 {assignment.dueDate}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Past Due Assignments */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Past Due</h3>
                    <div className="space-y-2">
                      {assignments.filter(a => a.status === 'due-soon' || a.status === 'overdue').slice(0, 1).map((assignment) => (
                        <div
                          key={assignment.id}
                          onClick={() => router.push(`/student/assignments/${assignment.id}`)}
                          className="bg-red-50 rounded-lg p-2 hover:shadow-md cursor-pointer transition-all duration-200 border border-red-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-gray-900 truncate">{assignment.title}</h4>
                              <p className="text-xs text-gray-600">{assignment.course}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-[#FF6F61] text-white">
                                🔥 {assignment.dueDate}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>

                  {/* Completed Assignments */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Completed</h3>
                    <div className="space-y-2">
                      {assignments.filter(a => a.status === 'completed').slice(0, 1).map((assignment) => (
                        <div
                          key={assignment.id}
                          onClick={() => router.push(`/student/assignments/${assignment.id}`)}
                          className="bg-green-50 rounded-lg p-2 hover:shadow-md cursor-pointer transition-all duration-200 border border-green-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-gray-900 truncate">{assignment.title}</h4>
                              <p className="text-xs text-gray-600">{assignment.course}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-[#06D6A0] text-white">
                                ✓ {assignment.dueDate}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {assignments.length > 4 && (
                    <button 
                      onClick={() => router.push('/student/assignments')}
                      className="w-full text-center text-xs text-orange-600 hover:text-orange-800 py-2 border-t border-gray-200 mt-2"
                    >
                      View all {assignments.length} assignments
                    </button>
                  )}
                  </div>
                )}
              </div>
            </div>


          {/* AI Study Assistant - Bottom Center */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-3 bg-[#9B5DE5]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🤖</span>
                  </div>
                  <h2 className="text-white font-bold text-sm">AI Tutor Buddy</h2>
                </div>
              </div>
            </div>
            <div className="p-3 h-64 flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#9B5DE5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Tutor Buddy</h3>
                  <p className="text-sm text-gray-600 mb-4">Get instant help with your studies</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => router.push('/messaging')}
                      className="w-full bg-[#9B5DE5] text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
                    >
                      💬 Ask a Question
                    </button>
                    <button
                      onClick={() => router.push('/ai-tutoring')}
                      className="w-full bg-[#4A90E2] text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
                    >
                      🎓 Start Tutoring Session
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Analytics - Bottom Right */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-3 bg-[#4A90E2]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">📊</span>
                  </div>
                  <h2 className="text-white font-bold text-sm">Socials</h2>
                </div>
              </div>
            </div>
            <div className="h-64 overflow-y-auto">
              {/* Community Posts Section */}
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">Recent Posts</h3>
                  <button 
                    onClick={() => router.push('/community')}
                    className="text-xs text-[#4A90E2] hover:text-[#9B5DE5] font-medium"
                  >
                    View All →
                  </button>
                </div>
                <div className="space-y-2">
                  {isLoadingPosts ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#4A90E2]"></div>
                      <span className="ml-2 text-xs text-gray-500">Loading posts...</span>
                    </div>
                  ) : communityPosts.length > 0 ? (
                    communityPosts.slice(0, 3).map((post) => (
                      <div key={post.id} className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          post.isAnnouncement ? 'bg-[#4A90E2]' : 'bg-[#06D6A0]'
                        }`}>
                          {post.author.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1 mb-1">
                            <p className="text-xs font-medium text-gray-800">{post.author}</p>
                            {post.isAnnouncement && (
                              <span className="px-1 py-0.5 bg-[#4A90E2] text-white text-xs rounded-full">
                                📢
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">{post.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-400">👍 {post.likes}</span>
                          <span className="text-xs text-gray-400">💬 {post.comments}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-500">No posts yet</p>
                      <button 
                        onClick={() => router.push('/community')}
                        className="text-xs text-[#4A90E2] hover:text-[#9B5DE5] font-medium mt-1"
                      >
                        Be the first to post!
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Analytics Section */}
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Your Analytics</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">0</div>
                    <div className="text-xs text-gray-600">Videos</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">0</div>
                    <div className="text-xs text-gray-600">Views</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">0</div>
                    <div className="text-xs text-gray-600">Likes</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">0</div>
                    <div className="text-xs text-gray-600">Rating</div>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-500">Start creating content to see your analytics!</p>
                </div>
              </div>
            </div>
          </div>

                 {/* Quick Actions - Bottom Right */}
                 <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                   <div className="p-3 bg-[#FF6F61]">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-2">
                         <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                           <span className="text-white text-sm">⚡</span>
                         </div>
                         <h2 className="text-white font-bold text-sm">Quick Actions</h2>
                       </div>
                     </div>
                   </div>
            <div className="p-3 h-64">
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setShowWizard(true)}
                  className="w-full bg-[#FF6F61] text-white p-3 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
                >
                  🎯 Get Started
                </button>
                <button
                  onClick={() => router.push('/messaging')}
                  className="w-full bg-[#9B5DE5] text-white p-3 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
                >
                  💬 Messages
                </button>
                <button
                  onClick={() => router.push('/student/video-submission')}
                  className="w-full bg-[#4A90E2] text-white p-3 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
                >
                  📹 Create Video
                </button>
                <button
                  onClick={() => router.push('/student/submissions')}
                  className="w-full bg-[#06D6A0] text-white p-3 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
                >
                  📝 View Submissions
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Branded Footer */}
        <div className="bg-white/80 backdrop-blur-md border-t border-[#4A90E2]/20 px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-[#333333]">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 rounded overflow-hidden">
                  <img 
                    src="/UpdatedCCLogo.png" 
                    alt="ClassCast Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-semibold">ClassCast</span>
              </div>
              <span>•</span>
              <span>AI-Powered Learning Platform</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>© 2024 ClassCast</span>
              <span>•</span>
              <span>Version 1.0</span>
            </div>
          </div>
        </div>


        {/* Student Onboarding Wizard */}
        <StudentOnboardingWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onComplete={() => {
            setShowWizard(false);
            // Optionally refresh data or show success message
          }}
        />
      </div>
    </StudentRoute>
  );
};

export default StudentDashboard;
