'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { CompactAssignmentList } from '@/components/student/CompactAssignmentList';
import VideoReels from '@/components/student/VideoReels';
import CourseCard from '@/components/student/CourseCard';
import StudentOnboardingWizard from '@/components/wizards/StudentOnboardingWizard';
import ClassEnrollmentModal from '@/components/student/ClassEnrollmentModal';
import Avatar from '@/components/common/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Wifi, WifiOff, Plus } from 'lucide-react';

interface DashboardStats {
  activeCourses: number;
  assignmentsDue: number;
  completed: number;
}

interface TodoStats {
  pendingAssignments: number;
  pendingReviews: number;
  nextDueAssignment: { title: string; dueDate: string } | null;
}

interface Course {
  id: string;
  name: string;
  code: string;
  color: string;
  instructor?: {
    name: string;
    avatar: string;
  };
  assignmentsDue: number;
  nextDeadline?: string;
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  courseId: string;
  status: string;
  points: number;
}

interface CommunityPost {
  id: string;
  title: string;
  author: string | {
    name: string;
    avatar: string;
  };
  isAnnouncement: boolean;
  likes: number;
  comments: number;
  timestamp: string;
}

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
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [todoStats, setTodoStats] = useState<TodoStats>({
    pendingAssignments: 0,
    pendingReviews: 0,
    nextDueAssignment: null
  });
  const [isLoadingTodoStats, setIsLoadingTodoStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load data if user is authenticated
    console.log('Auth state:', { isAuthenticated, user, isLoading });
    if (!isAuthenticated || !user || isLoading) {
      console.log('Not loading data - not authenticated or still loading');
      return;
    }

    const loadDashboardData = async () => {
      try {
        setError(null);
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
            fetch(`/api/student/stats?userId=${user.id}`, { credentials: 'include' }),
            fetch(`/api/student/courses?userId=${user.id}`, { credentials: 'include' }),
            fetch(`/api/student/assignments?userId=${user.id}`, { credentials: 'include' })
          ]);

          // Handle stats response
          if (statsResponse.ok) {
            try {
              const statsData = await statsResponse.json();
              setStats(statsData);
            } catch (parseError) {
              console.error('Error parsing stats response:', parseError);
              setError('Failed to load statistics');
            }
          } else {
            console.error('Stats API failed:', statsResponse.status, statsResponse.statusText);
            setError('Failed to load statistics');
          }

          // Handle courses response
          if (coursesResponse.ok) {
            try {
              const coursesData = await coursesResponse.json();
              console.log('Courses API response:', coursesData);
              setCourses(coursesData.courses || []);
            } catch (parseError) {
              console.error('Error parsing courses response:', parseError);
              setError('Failed to load courses');
            }
          } else {
            console.error('Courses API failed:', coursesResponse.status, coursesResponse.statusText);
            setError('Failed to load courses');
          }

          // Handle assignments response
          if (assignmentsResponse.ok) {
            try {
              const assignmentsData = await assignmentsResponse.json();
              setAssignments(assignmentsData.assignments || []);
            } catch (parseError) {
              console.error('Error parsing assignments response:', parseError);
              setError('Failed to load assignments');
            }
          } else {
            console.error('Assignments API failed:', assignmentsResponse.status, assignmentsResponse.statusText);
            setError('Failed to load assignments');
          }
        } catch (apiError) {
          console.error('API calls failed:', apiError);
          setError('Failed to load dashboard data. Please try again later.');
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
        const response = await fetch(`/api/community/posts?userId=${user?.id}`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.posts) {
            setCommunityPosts(data.posts);
          } else {
            setCommunityPosts([]);
          }
        }
      } catch (error) {
        console.warn('Failed to load community posts:', error);
        setCommunityPosts([]);
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
        const response = await fetch(`/api/student/todo-stats?userId=${user?.id}`, { credentials: 'include' });
        
        if (response.ok) {
          const data = await response.json();
          setTodoStats(data);
        } else {
          console.warn('Failed to load todo stats:', response.statusText);
          setTodoStats({
            pendingAssignments: 0,
            pendingReviews: 0,
            nextDueAssignment: null
          });
        }
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

  // Refresh data when user returns to the page (e.g., from video submission)
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && user) {
        // Refresh todo stats when user returns to the page
        const refreshTodoStats = async () => {
          try {
            const response = await fetch(`/api/student/todo-stats?userId=${user.id}`, { credentials: 'include' });
            if (response.ok) {
              const data = await response.json();
              setTodoStats(data);
            }
          } catch (error) {
            console.warn('Failed to refresh todo stats:', error);
          }
        };
        
        refreshTodoStats();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, user]);

  // Handle class enrollment
  const handleClassEnrollment = async (classCode: string, sectionId?: string) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Starting enrollment process for class:', classCode, 'section:', sectionId);

      const response = await fetch('/api/student/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ classCode, userId: user.id, sectionId }),
      });

      const data = await response.json();
      console.log('Enrollment API response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll in class');
      }

      console.log('Enrollment successful, updating UI...');

      // Add the new class to the courses list
      setCourses(prevCourses => [...prevCourses, data.class]);

      // Refresh dashboard data to ensure everything is up to date
      if (isAuthenticated && user) {
        try {
          console.log('Refreshing dashboard data...');
          const [statsResponse, coursesResponse] = await Promise.all([
            fetch(`/api/student/stats?userId=${user.id}`, { credentials: 'include' }),
            fetch(`/api/student/courses?userId=${user.id}`, { credentials: 'include' })
          ]);

          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            if (statsData.success) {
              setStats(statsData.data);
            }
          }

          if (coursesResponse.ok) {
            const coursesData = await coursesResponse.json();
            setCourses(coursesData.courses || []);
          }
          
          console.log('Dashboard data refreshed successfully');
        } catch (refreshError) {
          console.warn('Failed to refresh dashboard data after enrollment:', refreshError);
          // Don't throw here - enrollment was successful, just refresh failed
        }
      }
      
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
            <h2 className="text-display text-indigo-600 mb-2">
              ClassCast
            </h2>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-800">Loading your home...</p>
          </div>
        </div>
      </StudentRoute>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <StudentRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
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
            <h2 className="text-2xl font-bold text-indigo-600 mb-2">
              ClassCast
            </h2>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-800">Redirecting to login...</p>
          </div>
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <div className="h-screen overflow-hidden flex flex-col bg-gray-50">
        {/* Branded Header */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-indigo-600/20 px-2 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left Side - MyClassCast Logo */}
            <div className="flex items-center min-w-0 flex-1">
              <img
                src="/MyClassCast (800 x 200 px).png"
                alt="MyClassCast"
                className="h-6 sm:h-8 w-auto object-contain max-w-[200px] sm:max-w-none"
              />
            </div>
            
            {/* Center - School Logo */}
            <div className="flex items-center justify-center flex-1">
              {user?.schoolLogo && (
                <img
                  src={user.schoolLogo}
                  alt="School Logo"
                  className="h-8 sm:h-10 w-auto object-contain max-h-10"
                />
              )}
            </div>
            
            {/* Right Side - Join Class Button and Profile Thumbnail */}
            <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
              <button
                onClick={() => setShowEnrollmentModal(true)}
                className="text-indigo-600 hover:text-purple-600 transition-colors p-1 sm:p-2"
                title="Join a new class"
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
        <Avatar
          user={user}
          size="lg"
          onClick={() => router.push('/student/profile')}
          className="shadow-lg"
        />
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-gray-50 border-b border-indigo-600/20 px-4 py-2">
          <div className="flex items-center text-sm">
            <div className="text-gray-800 font-medium">
              Student Portal
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4">
            
            {/* Recently Posted Videos - Main Feature */}
            <div className="mb-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white flex items-center">
                      <span className="mr-2">🎥</span>
                      Recently Posted Videos
                    </h2>
                    <button 
                      onClick={() => router.push('/student/peer-reviews')}
                      className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
                    >
                      View All
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <VideoReels studentId={user?.id || 'unknown'} />
                </div>
              </div>
            </div>

            {/* Two Column Layout for Classes and Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* My Classes - Left Column (2/3 width) */}
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <h1 className="text-heading text-gray-800 mb-2">My Classes</h1>
                </div>

                {/* Classes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {isLoadingCourses ? (
                    // Loading state for classes
                    <>
                      {[1, 2, 3, 4].map((i) => (
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
                    </>
                  ) : courses.length > 0 ? (
                    // Display classes
                    courses.map((course) => (
                      <CourseCard
                        key={course.id}
                        id={course.id}
                        name={course.name}
                        code={course.code}
                        color={course.color}
                        instructor={course.instructor}
                        assignmentsDue={course.assignmentsDue}
                        nextDeadline={course.nextDeadline}
                      />
                    ))
                  ) : (
                    // Empty state for classes
                    <div className="col-span-full">
                      <div className="bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-300">
                        <div className="text-5xl mb-4">📚</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                          No Classes Yet
                        </h3>
                        <p className="text-gray-500 mb-6">
                          Join your first class to get started!
                        </p>
                        <button
                          onClick={() => setShowEnrollmentModal(true)}
                          className="inline-flex items-center px-6 py-3 bg-[#005587] text-white rounded-lg hover:bg-[#003d5c] transition-colors font-medium"
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Join a Class
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Sidebar - To-Do List & Community */}
              <div className="lg:col-span-1 space-y-6">
                {/* To-Do List */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* To-Do List Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2">
                    <h2 className="text-base font-semibold text-white flex items-center">
                      <span className="mr-2">📋</span>
                      To-Do List
                    </h2>
                  </div>
                  <div className="p-4">
                    {isLoadingTodoStats ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                          <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-300 rounded mb-2"></div>
                            <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Pending Assignments */}
                      <div className="flex items-center space-x-3 p-3 bg-blue-50/50 rounded-lg border border-[#005587]/20 hover:bg-blue-50 transition-colors cursor-pointer"
                           onClick={() => router.push('/student/assignments')}>
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-[#005587] rounded-lg flex items-center justify-center">
                            <span className="text-white text-lg">📝</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-800">Pending Assignments</h3>
                            <span className="text-lg font-bold text-[#005587]">{todoStats.pendingAssignments}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>

                      {/* Pending Reviews - More Prominent */}
                      <div className="flex items-center space-x-3 p-3 bg-[#FFC72C]/10 rounded-lg border-2 border-[#FFC72C]/30 hover:border-[#FFC72C]/50 hover:shadow-md transition-all cursor-pointer group"
                           onClick={() => router.push('/student/peer-reviews')}>
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-[#FFC72C] rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                            <span className="text-[#003d5c] text-lg font-bold">🎥</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-800">Videos to Review</h3>
                            {todoStats.pendingReviews > 0 ? (
                              <span className="px-2 py-0.5 bg-[#005587] text-white text-xs font-bold rounded-full animate-pulse">
                                {todoStats.pendingReviews} NEW
                              </span>
                            ) : (
                              <span className="text-lg font-bold text-[#CC9900]">{todoStats.pendingReviews}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">Watch & respond to peer videos</p>
                        </div>
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-[#CC9900] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                  
                    {/* Quick Actions */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button 
                        onClick={() => router.push('/student/assignments')}
                        className="w-full text-center text-xs text-[#005587] hover:text-[#003d5c] font-medium"
                      >
                        View All Assignments →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Community Section */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-white flex items-center">
                        <span className="mr-2">💬</span>
                        Community
                      </h3>
                      <button 
                        onClick={() => router.push('/community')}
                        className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors text-xs font-medium"
                      >
                        View All
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="h-48 overflow-y-auto">
                      {isLoadingPosts ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                          <span className="ml-2 text-xs text-gray-500">Loading posts...</span>
                        </div>
                      ) : communityPosts.length > 0 ? (
                        <div className="space-y-3">
                          {communityPosts.slice(0, 5).map((post) => (
                            <div key={post.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                                 onClick={() => router.push(`/community#post-${post.id}`)}>
                              <div className="flex items-start space-x-2">
                                <img
                                  src={typeof post.author === 'object' && post.author?.avatar 
                                    ? post.author.avatar 
                                    : '/api/placeholder/40/40'}
                                  alt={typeof post.author === 'string' ? post.author : post.author?.name || 'Unknown'}
                                  className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-gray-200"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-1 mb-1">
                                    <p className="text-xs font-medium text-gray-800 truncate">{typeof post.author === 'string' ? post.author : post.author?.name || 'Unknown'}</p>
                                    {post.isAnnouncement && (
                                      <span className="px-1 py-0.5 bg-indigo-600 text-white text-xs rounded-full flex-shrink-0">
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
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-2xl mb-2">💬</div>
                          <p className="text-xs text-gray-500">No posts yet</p>
                          <button 
                            onClick={() => router.push('/community')}
                            className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            Be the first to post!
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Assignments with Grades */}
              {!isLoadingAssignments && assignments.length > 0 && (
                <div className="mb-8">
                  <CompactAssignmentList 
                    maxItems={6}
                    showFilters={false}
                    showSort={true}
                    title="Recent Assignments"
                    className="shadow-lg"
                  />
                </div>
              )}
          </div>
        </div>

        {/* Branded Footer */}
        <div className="bg-white/80 backdrop-blur-md border-t border-indigo-600/20 px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-800">
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
              <span>© 2025 ClassCast</span>
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