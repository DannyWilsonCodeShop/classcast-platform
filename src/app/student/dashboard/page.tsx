'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { CompactAssignmentList } from '@/components/student/CompactAssignmentList';
import VideoReels from '@/components/student/VideoReels';
import CourseCard from '@/components/student/CourseCard';
import StudentOnboardingWizard from '@/components/wizards/StudentOnboardingWizard';
import ClassEnrollmentModal from '@/components/student/ClassEnrollmentModal';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Wifi, WifiOff, Plus } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ai-tutor'>('ai-tutor');
  const [showWizard, setShowWizard] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
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
  const [todoStats, setTodoStats] = useState({
    pendingAssignments: 0,
    pendingReviews: 0,
    nextDueAssignment: null
  });
  const [isLoadingTodoStats, setIsLoadingTodoStats] = useState(true);

  useEffect(() => {
    // Only load data if user is authenticated
    console.log('Auth state:', { isAuthenticated, user, isLoading });
    if (!isAuthenticated || !user || isLoading) {
      console.log('Not loading data - not authenticated or still loading');
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

        // Try to fetch real data
        try {
          const [statsResponse, coursesResponse, assignmentsResponse] = await Promise.all([
            fetch('/api/student/stats', { credentials: 'include' }),
            fetch('/api/student/courses', { credentials: 'include' }),
            fetch('/api/student/assignments', { credentials: 'include' })
          ]);

          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setStats(statsData);
          }

          if (coursesResponse.ok) {
            const coursesData = await coursesResponse.json();
            console.log('Courses API response:', coursesData);
            setCourses(coursesData.courses || []);
          } else {
            console.error('Courses API failed:', coursesResponse.status, coursesResponse.statusText);
          }

          if (assignmentsResponse.ok) {
            const assignmentsData = await assignmentsResponse.json();
            setAssignments(assignmentsData.assignments || []);
          }
        } catch (apiError) {
          console.warn('API calls failed, using fallback data:', apiError);
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

  // Load community posts
  useEffect(() => {
    const loadCommunityPosts = async () => {
      setIsLoadingPosts(true);
      try {
        const response = await fetch('/api/community/posts', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setCommunityPosts(data || []);
        }
      } catch (error) {
        console.warn('Failed to load community posts:', error);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    if (isAuthenticated && user) {
      loadCommunityPosts();
    }
  }, [isAuthenticated, user]);

  // Load todo stats
  useEffect(() => {
    const loadTodoStats = async () => {
      setIsLoadingTodoStats(true);
      try {
        // Mock data for now - in real implementation, this would come from APIs
        const mockTodoStats = {
          pendingAssignments: 3,
          pendingReviews: 2,
          nextDueAssignment: {
            title: 'Video Presentation Assignment',
            dueDate: 'Jan 25'
          }
        };
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setTodoStats(mockTodoStats);
      } catch (error) {
        console.warn('Failed to load todo stats:', error);
        setTodoStats({
          pendingAssignments: 0,
          pendingReviews: 0,
          nextDueAssignment: null
        });
      } finally {
        setIsLoadingTodoStats(false);
      }
    };

    if (isAuthenticated && user) {
      loadTodoStats();
    }
  }, [isAuthenticated, user]);

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

  // Handle class enrollment
  const handleClassEnrollment = async (classCode: string) => {
    try {
      const response = await fetch('/api/student/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ classCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll in class');
      }

      // Add the new class to the courses list
      setCourses(prevCourses => [...prevCourses, data.class]);
      
      // Show success message (you could add a toast notification here)
      console.log('Successfully enrolled in class:', data.class.name);
      
    } catch (error) {
      console.error('Enrollment error:', error);
      throw error;
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
            <p className="text-[#333333]">Loading your home...</p>
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
        <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-[#4A90E2]/20 px-2 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left Side - MyClassCast Logo */}
            <div className="flex items-center min-w-0 flex-1">
              <img
                src="/MyClassCast (800 x 200 px).png"
                alt="MyClassCast"
                className="h-6 sm:h-8 w-auto object-contain max-w-[200px] sm:max-w-none"
              />
            </div>
            
            {/* Right Side - Join Class Button and Profile Thumbnail */}
            <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
              <button
                onClick={() => setShowEnrollmentModal(true)}
                className="text-[#4A90E2] hover:text-[#9B5DE5] transition-colors p-1 sm:p-2"
                title="Join a new class"
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => router.push('/student/profile')}
                className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#4A90E2] flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg hover:scale-110 transition-all duration-200 cursor-pointer"
                title="View Profile"
              >
                {user?.firstName?.charAt(0) || 'S'}
              </button>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-[#F5F5F5] border-b border-[#4A90E2]/20 px-4 py-2">
          <div className="flex items-center text-sm">
            <div className="text-[#333333] font-medium">
              Student Portal
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Sidebar - Videos and Socials */}
          <div className="hidden lg:block w-80 bg-white/90 backdrop-blur-sm border-r border-[#4A90E2]/20 flex flex-col">
            {/* Recently Posted Videos */}
            <div className="flex-1 p-4 border-b border-gray-200">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-[#4A90E2] mb-2">Recently Posted</h3>
                <p className="text-sm text-gray-600">Latest videos from your peers</p>
              </div>
              <div className="h-64 overflow-y-auto">
                <VideoReels studentId={user?.id || 'unknown'} />
              </div>
            </div>
            
            {/* Socials/Community */}
            <div className="flex-1 p-4">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-[#4A90E2] mb-2">Community</h3>
                <p className="text-sm text-gray-600">Connect with classmates</p>
              </div>
              <div className="h-64 overflow-y-auto">
                {isLoadingPosts ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#4A90E2]"></div>
                    <span className="ml-2 text-xs text-gray-500">Loading posts...</span>
                  </div>
                ) : communityPosts.length > 0 ? (
                  <div className="space-y-3">
                    {communityPosts.slice(0, 5).map((post) => (
                      <div key={post.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-start space-x-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            post.isAnnouncement ? 'bg-[#4A90E2]' : 'bg-[#06D6A0]'
                          }`}>
                            {post.author.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1 mb-1">
                              <p className="text-xs font-medium text-gray-800 truncate">{post.author}</p>
                              {post.isAnnouncement && (
                                <span className="px-1 py-0.5 bg-[#4A90E2] text-white text-xs rounded-full flex-shrink-0">
                                  📢
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{post.title}</p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-400">👍 {post.likes}</span>
                                <span className="text-xs text-gray-400">💬 {post.comments}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => router.push('/community')}
                      className="w-full text-center text-xs text-[#4A90E2] hover:text-[#9B5DE5] font-medium py-2 border border-[#4A90E2] rounded-lg hover:bg-[#4A90E2]/5 transition-colors"
                    >
                      View All Posts →
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-500 mb-2">No posts yet</p>
                    <button 
                      onClick={() => router.push('/community')}
                      className="text-xs text-[#4A90E2] hover:text-[#9B5DE5] font-medium"
                    >
                      Be the first to post!
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Classes */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-6xl mx-auto">
              {/* Classes Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#333333] mb-2">My Classes</h1>
                <p className="text-gray-600">Manage your courses and track your progress</p>
              </div>

              {/* To-Do List */}
              <div className="mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">📋</span>
                      To-Do List
                    </h2>
                    <span className="text-sm text-gray-500">Quick overview</span>
                  </div>
                  
                  {isLoadingTodoStats ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                          <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-300 rounded mb-2"></div>
                            <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                          </div>
                          <div className="w-4 h-4 bg-gray-300 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Pending Assignments */}
                      <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer"
                           onClick={() => router.push('/student/assignments')}>
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-lg">📝</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-800">Pending Assignments</h3>
                            <span className="text-lg font-bold text-orange-600">{todoStats.pendingAssignments}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">Due this week</p>
                        </div>
                        <div className="flex-shrink-0">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>

                      {/* Pending Reviews */}
                      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                           onClick={() => router.push('/student/peer-reviews')}>
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-lg">👥</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-800">Pending Reviews</h3>
                            <span className="text-lg font-bold text-blue-600">{todoStats.pendingReviews}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">Peer videos to review</p>
                        </div>
                        <div className="flex-shrink-0">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Quick Actions */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {todoStats.nextDueAssignment 
                          ? `Next due: ${todoStats.nextDueAssignment.title} - ${todoStats.nextDueAssignment.dueDate}`
                          : 'No upcoming assignments'
                        }
                      </span>
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => router.push('/student/assignments')}
                          className="text-orange-600 hover:text-orange-700 font-medium"
                        >
                          View All Assignments
                        </button>
                        <button 
                          onClick={() => router.push('/student/peer-reviews')}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Start Reviewing
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Classes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoadingCourses ? (
                  // Loading state for classes
                  <div className="col-span-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 animate-pulse">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 bg-gray-300 rounded-xl"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-300 rounded mb-2"></div>
                              <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="h-3 bg-gray-300 rounded"></div>
                            <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                            <div className="h-2 bg-gray-300 rounded"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : courses.length > 0 ? (
                  // Display classes
                  courses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => router.push(`/student/courses/${course.id}`)}
                      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] group"
                      style={{ borderLeftColor: course.color, borderLeftWidth: '4px' }}
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                          style={{ backgroundColor: course.color }}
                        >
                          {course.code?.charAt(0) || 'C'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-[#4A90E2] transition-colors">
                            {course.name}
                          </h3>
                          <p className="text-sm text-gray-600">Class Code: {course.code}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {course.description || 'No description available'}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Status</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              course.status === 'up-to-date' ? 'bg-green-100 text-green-800' :
                              course.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                              course.status === 'past-due' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {course.status === 'up-to-date' ? '✅ Up To Date' :
                               course.status === 'upcoming' ? '⏰ Upcoming Assignments' :
                               course.status === 'past-due' ? '⚠️ Past Due' :
                               '📚 Active'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>📚 {course.assignmentCount || 0} assignments</span>
                          </div>
                          <div className="text-[#4A90E2] group-hover:text-[#9B5DE5] transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Empty state for classes
                  <div className="col-span-full">
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Classes Yet</h3>
                      <p className="text-gray-600 mb-6">You haven't enrolled in any classes yet. Contact your instructor to get started!</p>
                      <button
                        onClick={() => router.push('/student/courses')}
                        className="bg-[#4A90E2] text-white px-6 py-3 rounded-lg hover:bg-[#9B5DE5] transition-colors font-medium"
                      >
                        Browse Available Classes
                      </button>
                    </div>
                  </div>
                )}
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

        {/* Class Enrollment Modal */}
        <ClassEnrollmentModal
          isOpen={showEnrollmentModal}
          onClose={() => setShowEnrollmentModal(false)}
          onEnroll={handleClassEnrollment}
        />
      </div>
    </StudentRoute>
  );
};

export default StudentDashboard;