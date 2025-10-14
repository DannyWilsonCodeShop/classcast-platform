'use client';

import React, { useState, useEffect } from 'react';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import PortalIndicator from '@/components/common/PortalIndicator';
import InstructorOnboardingWizard from '@/components/wizards/InstructorOnboardingWizard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/common/Avatar';
import NotificationBell from '@/components/common/NotificationBell';

interface DashboardStats {
  activeCourses: number;
  ungradedAssignments: number;
  messages: number;
}

interface Course {
  id: string;
  title: string;
  studentCount: number;
  assignmentsDue: number;
  icon?: string;
  subject?: string;
  ungradedSubmissions?: number;
}

interface RecentSubmission {
  id: string;
  assignmentTitle: string;
  studentName: string;
  submittedAt: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentDate: string;
  lastActive: string;
  submissionsCount: number;
  averageGrade: number;
}

const InstructorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(false);
  const [showFirstTimeWizard, setShowFirstTimeWizard] = useState(false);
  const [isFirstTimeWizard, setIsFirstTimeWizard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    activeCourses: 0,
    ungradedAssignments: 0,
    messages: 0,
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showStudentList, setShowStudentList] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get appropriate icon for course based on subject or title
  const getCourseIcon = (course: Course): string => {
    if (course.icon) {
      return course.icon;
    }

    const title = course.title.toLowerCase();
    const subject = course.subject?.toLowerCase() || '';
    
    // Subject-based icons
    if (subject.includes('computer') || subject.includes('programming') || subject.includes('software')) {
      return '⚙️';
    } else if (subject.includes('math') || subject.includes('calculus') || subject.includes('algebra')) {
      return '🔢';
    } else if (subject.includes('english') || subject.includes('writing') || subject.includes('literature')) {
      return '📖';
    } else if (subject.includes('physics') || subject.includes('science')) {
      return '🔬';
    } else if (subject.includes('biology') || subject.includes('chemistry')) {
      return '🧬';
    } else if (subject.includes('history') || subject.includes('social')) {
      return '📚';
    } else if (subject.includes('art') || subject.includes('design')) {
      return '🎨';
    } else if (subject.includes('music')) {
      return '🎵';
    } else if (subject.includes('business') || subject.includes('economics')) {
      return '💼';
    } else if (subject.includes('psychology')) {
      return '🧠';
    } else if (subject.includes('language') || subject.includes('foreign')) {
      return '🌍';
    }
    
    // Title-based fallback icons
    if (title.includes('computer') || title.includes('programming') || title.includes('software') || title.includes('cs-')) {
      return '💻';
    } else if (title.includes('math') || title.includes('calculus') || title.includes('algebra') || title.includes('math-')) {
      return '🔢';
    } else if (title.includes('english') || title.includes('writing') || title.includes('literature') || title.includes('eng-')) {
      return '📝';
    } else if (title.includes('physics') || title.includes('science') || title.includes('phy-')) {
      return '⚛️';
    } else if (title.includes('biology') || title.includes('chemistry') || title.includes('bio-')) {
      return '🧬';
    } else if (title.includes('history') || title.includes('social') || title.includes('hist-')) {
      return '📜';
    }
    
    // Default icon
    return '📚';
  };

  // State for course students
  const [courseStudents, setCourseStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Fetch students for a course
  const fetchCourseStudents = async (courseId: string) => {
    try {
      setLoadingStudents(true);
      const response = await fetch(`/api/instructor/courses/${courseId}/students?instructorId=${user?.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setCourseStudents(data.students || []);
      } else {
        console.error('Failed to fetch students:', response.statusText);
        setCourseStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setCourseStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };


  // Check for first-time instructor
  useEffect(() => {
    const checkFirstTimeInstructor = () => {
      const hasSeenWizard = localStorage.getItem('instructor-wizard-seen');
      const isFirstTime = !hasSeenWizard && courses.length === 0;
      
      if (isFirstTime) {
        setShowFirstTimeWizard(true);
      }
    };

    // Check after courses are loaded
    if (!loading && courses.length >= 0) {
      checkFirstTimeInstructor();
    }
  }, [loading, courses.length]);

  // Fetch students when a course is selected
  useEffect(() => {
    if (selectedCourse) {
      fetchCourseStudents(selectedCourse.id);
    }
  }, [selectedCourse]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch stats, courses, and recent submissions
        const instructorId = user?.id || 'default-instructor';
        const [statsResponse, coursesResponse, submissionsResponse] = await Promise.all([
          fetch(`/api/instructor/dashboard/stats?instructorId=${instructorId}`),
          fetch(`/api/instructor/courses?instructorId=${instructorId}`),
          fetch('/api/instructor/submissions/recent')
        ]);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          console.log('Courses API response:', coursesData);
          // Handle backend API format: data.courses array
          const coursesArray = coursesData.data?.courses || [];
          console.log('Courses array from API:', coursesArray);
          // Ensure coursesArray is an array before mapping
          if (Array.isArray(coursesArray)) {
            // Map courseId to id for compatibility
            const mappedCourses = coursesArray.map((course: any) => ({
              ...course,
              id: course.id || course.courseId,
              courseId: course.id || course.courseId
            }));
            console.log('Mapped courses for dashboard:', mappedCourses);
            
            // Fetch ungraded submission counts for each course
            const coursesWithSubmissionCounts = await Promise.all(
              mappedCourses.map(async (course: any) => {
                try {
                  const submissionsResponse = await fetch(`/api/instructor/video-submissions?courseId=${course.id}`);
                  if (submissionsResponse.ok) {
                    const submissionsData = await submissionsResponse.json();
                    const submissions = submissionsData.submissions || [];
                    // Count submissions without a grade
                    const ungradedCount = submissions.filter((sub: any) => 
                      sub.grade === null || sub.grade === undefined
                    ).length;
                    return {
                      ...course,
                      ungradedSubmissions: ungradedCount
                    };
                  }
                } catch (error) {
                  console.error(`Error fetching submissions for course ${course.id}:`, error);
                }
                return {
                  ...course,
                  ungradedSubmissions: 0
                };
              })
            );
            
            setCourses(coursesWithSubmissionCounts);
          } else {
            console.error('Courses data is not an array:', coursesArray);
            setCourses([]);
          }
        } else {
          console.error('Courses API failed:', coursesResponse.status, coursesResponse.statusText);
          const errorText = await coursesResponse.text();
          console.error('Courses API error response:', errorText);
          setCourses([]);
        }

        if (submissionsResponse.ok) {
          const submissionsData = await submissionsResponse.json();
          // Ensure submissionsData is an array
          if (Array.isArray(submissionsData)) {
            setRecentSubmissions(submissionsData);
          } else {
            console.error('Submissions data is not an array:', submissionsData);
            setRecentSubmissions([]);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <InstructorRoute>
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
            
            {/* Right Side - Notifications, Create Class Buttons and Profile Thumbnail */}
            <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
              {/* Notification Bell */}
              {user?.id && (
                <NotificationBell 
                  userId={user.id} 
                  userRole="instructor" 
                  className="flex-shrink-0"
                />
              )}
              
              <button
                onClick={() => router.push('/instructor/classes/create')}
                className="flex items-center space-x-1 sm:space-x-2 bg-indigo-600 text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors shadow-lg hover:shadow-xl"
                title="Create a new class using the form"
              >
                <span className="text-base sm:text-lg">+</span>
                <span className="font-medium text-xs sm:text-sm hidden sm:inline">Create</span>
              </button>
              <button
                onClick={() => setShowWizard(true)}
                className="flex items-center space-x-1 sm:space-x-2 bg-purple-600 text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
                title="Create a new class using the wizard"
              >
                <span className="text-base sm:text-lg">🧙</span>
                <span className="font-medium text-xs sm:text-sm hidden sm:inline">Wizard</span>
              </button>
              <Avatar
                user={user}
                size="lg"
                onClick={() => router.push('/instructor/profile')}
                className="shadow-lg hover:scale-110 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Status Bar with School Logo */}
        <div className="bg-gray-50 border-b border-indigo-600/20 px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-800 font-medium">
              Instructor Portal
            </div>
            {/* School Logo - Right Side */}
            {user?.schoolLogo && (
              <img
                src={user.schoolLogo}
                alt="School Logo"
                className="h-6 w-auto object-contain"
              />
            )}
          </div>
        </div>

        {/* Main Content Layout - Mobile Optimized */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Quick Actions and Recent Submissions - Hidden on Mobile */}
          <div className="hidden lg:block w-80 bg-white/90 backdrop-blur-sm border-r border-indigo-600/20 flex flex-col">
            {/* Quick Actions */}
            <div className="flex-1 p-4 border-b border-gray-200">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-indigo-600 mb-2">Quick Actions</h3>
              </div>
              <div className="h-64 overflow-y-auto">
                <div className="space-y-2">
                  <button 
                    onClick={() => router.push('/instructor/assignments/create')}
                    className="w-full text-left p-3 bg-indigo-600 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                  >
                    📝 Create Assignment
                  </button>
                  <button 
                    onClick={() => router.push('/instructor/grading/bulk')}
                    className="w-full text-left p-3 bg-rose-500 text-white rounded-lg hover:bg-rose-400 transition-colors text-sm font-medium"
                  >
                    ⚡ Bulk Grade
                  </button>
                  <button 
                    onClick={() => router.push('/instructor/ai-assistant')}
                    className="w-full text-left p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-400 transition-colors text-sm font-medium"
                  >
                    🤖 AI Assistant
                  </button>
                  <button 
                    onClick={() => router.push('/instructor/analytics')}
                    className="w-full text-left p-3 bg-emerald-600 text-white rounded-lg hover:bg-teal-500 transition-colors text-sm font-medium"
                  >
                    📊 Analytics
                  </button>
              </div>
            </div>
          </div>

            {/* Recent Submissions */}
            <div className="flex-1 p-4">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-indigo-600 mb-2">Recent Submissions</h3>
              </div>
              <div className="h-64 overflow-y-auto">
                {recentSubmissions.length > 0 ? (
                  <div className="space-y-3">
                    {recentSubmissions.slice(0, 5).map((submission) => (
                      <div key={submission.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-start space-x-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                            {submission.studentName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{submission.studentName}</p>
                            <p className="text-xs text-gray-600 line-clamp-2">{submission.assignmentTitle}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <button 
                                onClick={() => router.push(`/instructor/grading/bulk?assignment=${submission.assignmentId}&course=${submission.courseId}&submission=${submission.id}`)}
                                className="text-xs text-indigo-600 hover:text-purple-600 font-medium"
                              >
                                Review →
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => router.push('/instructor/submissions')}
                      className="w-full text-center text-xs text-indigo-600 hover:text-purple-600 font-medium py-2 border border-indigo-600 rounded-lg hover:bg-indigo-600/5 transition-colors"
                    >
                      View All Submissions →
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-gray-400 text-2xl mb-2">📝</div>
                    <p className="text-xs text-gray-500 mb-2">No recent submissions</p>
                    <p className="text-xs text-gray-400 mb-3">Student submissions will appear here</p>
                    <button 
                      onClick={() => router.push('/instructor/assignments')}
                      className="text-xs text-indigo-600 hover:text-purple-600 font-medium"
                    >
                      Create assignments to get started!
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Courses - Mobile Optimized */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4">
            <div className="max-w-6xl mx-auto">
              {/* Courses Header - Mobile Optimized */}
              <div className="mb-3 sm:mb-4">
                <h1 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">My Classes</h1>
                <p className="text-sm sm:text-base text-gray-600 hidden sm:block">Manage your courses and track student progress</p>
              </div>

              {/* Mobile Quick Actions - Only visible on mobile */}
              <div className="lg:hidden mb-4">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => router.push('/instructor/assignments/create')}
                    className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                  >
                    📝 Create Assignment
                  </button>
                  <button 
                    onClick={() => router.push('/instructor/grading/bulk')}
                    className="p-3 bg-rose-500 text-white rounded-lg hover:bg-rose-400 transition-colors text-sm font-medium"
                  >
                    ⚡ Bulk Grade
                  </button>
                </div>
              </div>

              {/* Loading State - Mobile Optimized */}
              {loading ? (
                <div className="flex justify-center items-center h-32 sm:h-48">
                  <LoadingSpinner size="md" />
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <p className="text-red-600 text-sm sm:text-base">{error}</p>
                </div>
              ) : (
                /* Classes Grid - Mobile Optimized */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => router.push(`/instructor/courses/${course.id}`)}
                        className={`w-full text-left bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border p-3 sm:p-4 hover:shadow-lg hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 ${
                          (course.ungradedSubmissions || 0) > 0
                            ? 'border-orange-400 ring-1 ring-orange-200 bg-gradient-to-br from-orange-50/50 to-white focus:ring-orange-300/50'
                            : 'border-white/20 focus:ring-indigo-600/20'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{course.title}</h3>
                              {(course.ungradedSubmissions || 0) > 0 && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full animate-pulse flex-shrink-0">
                                  <span>🔔</span>
                                  <span>{course.ungradedSubmissions}</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-600 mb-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCourse(course);
                                  setShowStudentList(true);
                                }}
                                className="hover:text-indigo-600 transition-colors"
                              >
                                👥 {course.studentCount} students
                              </button>
                            </div>
                          </div>
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                            📚
                          </div>
                        </div>
                        
                        {(course.ungradedSubmissions || 0) > 0 && (
                          <div className="mb-3 p-2 bg-orange-100 border border-orange-200 rounded-lg">
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <span className="text-orange-600 font-semibold">
                                ⚠️ {course.ungradedSubmissions} ungraded {course.ungradedSubmissions === 1 ? 'submission' : 'submissions'}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-gray-600">
                              {(course.ungradedSubmissions || 0) > 0 ? 'Click to grade submissions' : 'Click to manage class'}
                            </span>
                            <span className="text-indigo-600 font-medium">→</span>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full">
                      <EmptyState
                        title="No Classes Found"
                        description="It looks like you haven't created any classes yet. Start by creating your first class to begin teaching!"
                        icon="course"
                        action={{ 
                          label: 'Start Setup Wizard', 
                          onClick: () => setShowWizard(true) 
                        }}
                      />
                    </div>
                  )}
              </div>
              )}
            </div>
          </div>
        </div>


        {/* Course Setup Wizard */}
        <InstructorOnboardingWizard
          isOpen={showWizard}
          onClose={() => {
            setShowWizard(false);
            setIsFirstTimeWizard(false);
          }}
          onComplete={() => {
            setShowWizard(false);
            setIsFirstTimeWizard(false);
            localStorage.setItem('instructor-wizard-seen', 'true');
            // Optionally refresh course data or show success message
          }}
          isFirstTime={isFirstTimeWizard}
        />

        {/* First-Time Instructor Wizard */}
        {showFirstTimeWizard && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">🎓</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to ClassCast!</h2>
                <p className="text-gray-600">
                  Let's get you started by creating your first class. We'll guide you through the process step by step.
                </p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setShowFirstTimeWizard(false);
                    setIsFirstTimeWizard(true);
                    setShowWizard(true);
                  }}
                  className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-purple-600 transition-colors font-medium"
                >
                  Start Setup Wizard
                </button>
                
                <button
                  onClick={() => {
                    setShowFirstTimeWizard(false);
                    router.push('/instructor/classes/create');
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Create Class Manually
                </button>
                
                <div className="flex items-center justify-center pt-4">
                  <label className="flex items-center text-sm text-gray-600">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          localStorage.setItem('instructor-wizard-seen', 'true');
                        }
                      }}
                      className="mr-2"
                    />
                    Don't show this again
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student List Modal */}
        {showStudentList && selectedCourse && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Students Enrolled</h2>
                  <p className="text-gray-600">{selectedCourse.title}</p>
                </div>
                <button
                  onClick={() => setShowStudentList(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Student List */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingStudents ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-gray-600">Loading students...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courseStudents.map((student) => (
                    <div key={student.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                          {student.name.charAt(0)}
            </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">{student.name}</h3>
                          <p className="text-sm text-gray-600 truncate">{student.email}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>📅 Enrolled: {new Date(student.enrollmentDate).toLocaleDateString()}</span>
                            <span>📊 {student.submissionsCount} submissions</span>
          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              Last active: {new Date(student.lastActive).toLocaleDateString()}
                            </span>
                            {student.averageGrade > 0 && (
                              <span className="text-xs font-medium text-indigo-600">
                                Avg: {student.averageGrade}%
                              </span>
                            )}
            </div>
          </div>
                      </div>
                    </div>
                    ))}
                  </div>
                )}

                {courseStudents.length === 0 && !loadingStudents && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">👥</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Students Enrolled</h3>
                    <p className="text-gray-600">This class doesn't have any enrolled students yet.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Total: {courseStudents.length} students
                  </span>
            <button
                    onClick={() => setShowStudentList(false)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
                    Close
            </button>
          </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </InstructorRoute>
  );
};

export default InstructorDashboard;

