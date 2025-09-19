'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { CompactAssignmentList } from '@/components/student/CompactAssignmentList';
import VideoReels from '@/components/student/VideoReels';
import CourseCard from '@/components/student/CourseCard';
import ProfileEditor from '@/components/student/ProfileEditor';
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
  const [showProfileEditor, setShowProfileEditor] = useState(false);
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
              <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent mb-2">
              ClassCast
            </h2>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
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
              <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent mb-2">
              ClassCast
            </h2>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
        {/* Branded Header */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left Side - Logo and User Info */}
            <div className="flex items-center space-x-4">
              {/* ClassCast Logo */}
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent">
                    ClassCast
                  </h1>
                  <p className="text-xs text-gray-500">Student Portal</p>
                </div>
              </div>
              
              {/* User Welcome */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-slate-500 to-gray-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {user?.firstName?.charAt(0) || 'S'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Hey {user?.firstName || 'Student'}! 👋</h2>
                  <div className="flex items-center space-x-2">
                    {isOnline ? (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 font-medium">Live</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-500">Offline</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowProfileEditor(true)}
                className="p-2 bg-gradient-to-r from-slate-500 to-gray-600 text-white rounded-full hover:scale-110 transition-all duration-200 shadow-lg"
                title="Edit Profile"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-full hover:scale-110 transition-all duration-200 shadow-lg"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <PortalIndicator />
            </div>
          </div>
        </div>

        {/* Branded Status Bar */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-white/20 px-4 py-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-medium">System Online</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                <span className="text-slate-600">AI Features Active</span>
              </div>
            </div>
            <div className="text-gray-500">
              Welcome to ClassCast Student Portal
            </div>
          </div>
        </div>

        {/* Single Page Content - No Scrolling */}
        <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 h-full">
          {/* Video Feed - Top Left */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-3 bg-gradient-to-r from-slate-500 to-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🎬</span>
                  </div>
                  <h2 className="text-white font-bold text-sm">Trending Now</h2>
                </div>
                <div className="text-white/80 text-xs">
                  ClassCast
                </div>
              </div>
            </div>
            <div className="p-3 h-64">
              <VideoReels studentId={user?.id || 'unknown'} />
            </div>
          </div>

          {/* Courses - Top Center */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500">
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
            <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500">
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
                          className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-2 hover:shadow-md cursor-pointer transition-all duration-200 border border-slate-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-gray-900 truncate">{assignment.title}</h4>
                              <p className="text-xs text-gray-600">{assignment.course}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-slate-500 text-white">
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
                          className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-2 hover:shadow-md cursor-pointer transition-all duration-200 border border-red-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-gray-900 truncate">{assignment.title}</h4>
                              <p className="text-xs text-gray-600">{assignment.course}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
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
                          className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-2 hover:shadow-md cursor-pointer transition-all duration-200 border border-emerald-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-gray-900 truncate">{assignment.title}</h4>
                              <p className="text-xs text-gray-600">{assignment.course}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white">
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
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🤖</span>
                  </div>
                  <h2 className="text-white font-bold text-sm">AI Study Assistant</h2>
                </div>
                <div className="text-white/80 text-xs">
                  ClassCast
                </div>
              </div>
            </div>
            <div className="p-3 h-64 flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Study Assistant</h3>
                  <p className="text-sm text-gray-600 mb-4">Get instant help with your studies</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => router.push('/messaging')}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
                    >
                      💬 Ask a Question
                    </button>
                    <button
                      onClick={() => router.push('/ai-tutoring')}
                      className="w-full bg-gradient-to-r from-slate-500 to-gray-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
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
            <div className="p-3 bg-gradient-to-r from-slate-500 to-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">📊</span>
                  </div>
                  <h2 className="text-white font-bold text-sm">Social Analytics</h2>
                </div>
                <div className="text-white/80 text-xs">
                  ClassCast
                </div>
              </div>
            </div>
            <div className="p-3 h-64 overflow-y-auto">
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

                 {/* Quick Actions - Bottom Right */}
                 <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                   <div className="p-3 bg-gradient-to-r from-rose-400 to-pink-500">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-2">
                         <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                           <span className="text-white text-sm">⚡</span>
                         </div>
                         <h2 className="text-white font-bold text-sm">Quick Actions</h2>
                       </div>
                       <div className="text-white/80 text-xs">
                         ClassCast
                       </div>
                     </div>
                   </div>
            <div className="p-3 h-64">
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => router.push('/student/video-submission')}
                  className="w-full bg-gradient-to-r from-slate-500 to-gray-600 text-white p-3 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
                >
                  📹 Create Video
                </button>
                <button
                  onClick={() => router.push('/student/submissions')}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-3 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
                >
                  📝 View Submissions
                </button>
                <button
                  onClick={() => setShowProfileEditor(true)}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
                >
                  👤 Edit Profile
                </button>
                <button
                  onClick={() => router.push('/messaging')}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
                >
                  💬 Messages
                </button>
                <button
                  onClick={() => setShowWizard(true)}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white p-3 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
                >
                  🎯 Get Started
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Branded Footer */}
        <div className="bg-white/80 backdrop-blur-md border-t border-white/20 px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-gradient-to-br from-slate-600 to-gray-700 rounded flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
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

        {/* Profile Editor Modal */}
        <ProfileEditor
          profile={{
            id: user?.id || '',
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            avatar: user?.avatar || '',
            bio: user?.bio || '',
            major: user?.major || '',
            year: user?.year || '',
            phone: user?.phone || '',
            location: user?.location || '',
          }}
          onSave={(updatedProfile) => {
            setShowProfileEditor(false);
            // TODO: Update user data in context
            console.log('Profile updated:', updatedProfile);
          }}
          onCancel={() => setShowProfileEditor(false)}
          isOpen={showProfileEditor}
        />

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
