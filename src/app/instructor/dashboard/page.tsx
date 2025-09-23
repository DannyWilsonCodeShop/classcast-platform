'use client';

import React, { useState, useEffect } from 'react';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import PortalIndicator from '@/components/common/PortalIndicator';
import InstructorOnboardingWizard from '@/components/wizards/InstructorOnboardingWizard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

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
      return '💻';
    } else if (subject.includes('math') || subject.includes('calculus') || subject.includes('algebra')) {
      return '🔢';
    } else if (subject.includes('english') || subject.includes('writing') || subject.includes('literature')) {
      return '📝';
    } else if (subject.includes('physics') || subject.includes('science')) {
      return '⚛️';
    } else if (subject.includes('biology') || subject.includes('chemistry')) {
      return '🧬';
    } else if (subject.includes('history') || subject.includes('social')) {
      return '📜';
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

  // Mock student data for each course
  const getMockStudentsForCourse = (courseId: string): Student[] => {
    const studentsByCourse: { [key: string]: Student[] } = {
      'cs-101': [
        { id: 's1', name: 'Alice Johnson', email: 'alice.johnson@email.com', enrollmentDate: '2024-01-15', lastActive: '2024-01-20', submissionsCount: 3, averageGrade: 87 },
        { id: 's2', name: 'Bob Smith', email: 'bob.smith@email.com', enrollmentDate: '2024-01-15', lastActive: '2024-01-19', submissionsCount: 2, averageGrade: 92 },
        { id: 's3', name: 'Carol Davis', email: 'carol.davis@email.com', enrollmentDate: '2024-01-16', lastActive: '2024-01-20', submissionsCount: 4, averageGrade: 78 },
        { id: 's4', name: 'David Wilson', email: 'david.wilson@email.com', enrollmentDate: '2024-01-15', lastActive: '2024-01-18', submissionsCount: 1, averageGrade: 85 },
        { id: 's5', name: 'Eva Brown', email: 'eva.brown@email.com', enrollmentDate: '2024-01-17', lastActive: '2024-01-20', submissionsCount: 3, averageGrade: 90 }
      ],
      'math-201': [
        { id: 's6', name: 'Frank Miller', email: 'frank.miller@email.com', enrollmentDate: '2024-01-10', lastActive: '2024-01-20', submissionsCount: 2, averageGrade: 88 },
        { id: 's7', name: 'Grace Lee', email: 'grace.lee@email.com', enrollmentDate: '2024-01-10', lastActive: '2024-01-19', submissionsCount: 3, averageGrade: 95 },
        { id: 's8', name: 'Henry Taylor', email: 'henry.taylor@email.com', enrollmentDate: '2024-01-12', lastActive: '2024-01-20', submissionsCount: 1, averageGrade: 82 }
      ],
      'eng-102': [
        { id: 's9', name: 'Ivy Chen', email: 'ivy.chen@email.com', enrollmentDate: '2024-01-08', lastActive: '2024-01-20', submissionsCount: 2, averageGrade: 91 },
        { id: 's10', name: 'Jack Anderson', email: 'jack.anderson@email.com', enrollmentDate: '2024-01-08', lastActive: '2024-01-19', submissionsCount: 1, averageGrade: 76 }
      ],
      'phy-301': [
        { id: 's11', name: 'Kate Rodriguez', email: 'kate.rodriguez@email.com', enrollmentDate: '2024-01-05', lastActive: '2024-01-20', submissionsCount: 1, averageGrade: 89 }
      ],
      'bio-150': [
        { id: 's12', name: 'Liam Thompson', email: 'liam.thompson@email.com', enrollmentDate: '2024-01-14', lastActive: '2024-01-18', submissionsCount: 0, averageGrade: 0 }
      ],
      'hist-201': [
        { id: 's13', name: 'Maya Patel', email: 'maya.patel@email.com', enrollmentDate: '2024-01-12', lastActive: '2024-01-20', submissionsCount: 1, averageGrade: 93 },
        { id: 's14', name: 'Noah Garcia', email: 'noah.garcia@email.com', enrollmentDate: '2024-01-12', lastActive: '2024-01-19', submissionsCount: 1, averageGrade: 87 }
      ]
    };
    
    return studentsByCourse[courseId] || [];
  };

  // Mock assignments data for each course
  const getMockAssignmentsForCourse = (courseId: string) => {
    const assignmentsByCourse: { [key: string]: any[] } = {
      'cs-101': [
        {
          id: 'assign1',
          title: 'Introduction Video Assignment',
          dueDate: '2024-01-25T23:59:59Z',
          status: 'published',
          submissionsCount: 42
        },
        {
          id: 'assign2',
          title: 'Algorithm Analysis Project',
          dueDate: '2024-02-01T23:59:59Z',
          status: 'grading',
          submissionsCount: 38
        },
        {
          id: 'assign3',
          title: 'Data Structures Lab',
          dueDate: '2024-02-08T23:59:59Z',
          status: 'draft',
          submissionsCount: 0
        }
      ],
      'math-201': [
        {
          id: 'assign4',
          title: 'Integration Techniques Quiz',
          dueDate: '2024-01-28T23:59:59Z',
          status: 'published',
          submissionsCount: 35
        },
        {
          id: 'assign5',
          title: 'Series Convergence Problems',
          dueDate: '2024-02-05T23:59:59Z',
          status: 'grading',
          submissionsCount: 32
        }
      ],
      'eng-102': [
        {
          id: 'assign6',
          title: 'Creative Writing Exercise',
          dueDate: '2024-01-30T23:59:59Z',
          status: 'published',
          submissionsCount: 28
        },
        {
          id: 'assign7',
          title: 'Poetry Analysis Essay',
          dueDate: '2024-02-10T23:59:59Z',
          status: 'draft',
          submissionsCount: 0
        }
      ],
      'phy-301': [
        {
          id: 'assign8',
          title: 'Quantum Mechanics Problem Set',
          dueDate: '2024-02-02T23:59:59Z',
          status: 'published',
          submissionsCount: 22
        }
      ],
      'bio-150': [
        {
          id: 'assign9',
          title: 'Cell Structure Lab Report',
          dueDate: '2024-02-03T23:59:59Z',
          status: 'draft',
          submissionsCount: 0
        }
      ],
      'hist-201': [
        {
          id: 'assign10',
          title: 'Historical Analysis Paper',
          dueDate: '2024-02-07T23:59:59Z',
          status: 'published',
          submissionsCount: 40
        }
      ]
    };
    
    return assignmentsByCourse[courseId] || [];
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

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch stats, courses, and recent submissions
        const [statsResponse, coursesResponse, submissionsResponse] = await Promise.all([
          fetch('/api/instructor/dashboard/stats'),
          fetch('/api/courses'),
          fetch('/api/instructor/submissions/recent')
        ]);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          console.log('Courses API response:', coursesData);
          // Handle both formats: direct courses array or nested data.courses
          const coursesArray = coursesData.courses || coursesData.data?.courses || [];
          // Map courseId to id for compatibility
          const mappedCourses = coursesArray.map((course: any) => ({
            ...course,
            id: course.courseId || course.id
          }));
          setCourses(mappedCourses);
        } else {
          console.error('Courses API failed:', coursesResponse.status, coursesResponse.statusText);
        }

        if (submissionsResponse.ok) {
          const submissionsData = await submissionsResponse.json();
          setRecentSubmissions(submissionsData || []);
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
            
            {/* Right Side - Create Class Button and Profile Thumbnail */}
            <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
              <button
                onClick={() => router.push('/instructor/classes/create')}
                className="flex items-center space-x-1 sm:space-x-2 bg-[#4A90E2] text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-[#9B5DE5] transition-colors shadow-lg hover:shadow-xl"
                title="Create a new class"
              >
                <span className="text-base sm:text-lg">+</span>
                <span className="font-medium text-xs sm:text-sm hidden sm:inline">Create Class</span>
              </button>
              <button
                onClick={() => router.push('/instructor/profile')}
                className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#4A90E2] flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg hover:scale-110 transition-all duration-200 cursor-pointer"
                title="View Profile"
              >
                {user?.firstName?.charAt(0) || 'I'}
              </button>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-[#F5F5F5] border-b border-[#4A90E2]/20 px-4 py-2">
          <div className="flex items-center text-sm">
            <div className="text-[#333333] font-medium">
              Instructor Portal
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Recent Submissions and Community */}
          <div className="hidden lg:block w-80 bg-white/90 backdrop-blur-sm border-r border-[#4A90E2]/20 flex flex-col">
            {/* Recent Submissions */}
            <div className="flex-1 p-4 border-b border-gray-200">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-[#4A90E2] mb-2">Recent Submissions</h3>
                <p className="text-sm text-gray-600">Latest student work to review</p>
              </div>
              <div className="h-64 overflow-y-auto">
                {recentSubmissions.length > 0 ? (
                  <div className="space-y-3">
                    {recentSubmissions.slice(0, 5).map((submission) => (
                      <div key={submission.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-start space-x-2">
                          <div className="w-6 h-6 rounded-full bg-[#4A90E2] flex items-center justify-center text-white text-xs font-bold">
                            {submission.studentName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{submission.studentName}</p>
                            <p className="text-xs text-gray-600 line-clamp-2">{submission.assignmentTitle}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <button className="text-xs text-[#4A90E2] hover:text-[#9B5DE5] font-medium">
                                Review →
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => router.push('/instructor/submissions')}
                      className="w-full text-center text-xs text-[#4A90E2] hover:text-[#9B5DE5] font-medium py-2 border border-[#4A90E2] rounded-lg hover:bg-[#4A90E2]/5 transition-colors"
                    >
                      View All Submissions →
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-500 mb-2">No recent submissions</p>
                    <button 
                      onClick={() => router.push('/instructor/assignments')}
                      className="text-xs text-[#4A90E2] hover:text-[#9B5DE5] font-medium"
                    >
                      Create assignments to get started!
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex-1 p-4">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-[#4A90E2] mb-2">Quick Actions</h3>
                <p className="text-sm text-gray-600">Common instructor tasks</p>
              </div>
              <div className="h-64 overflow-y-auto">
                <div className="space-y-2">
                  <button 
                    onClick={() => router.push('/instructor/assignments/create')}
                    className="w-full text-left p-3 bg-[#4A90E2] text-white rounded-lg hover:bg-[#9B5DE5] transition-colors text-sm font-medium"
                  >
                    📝 Create Assignment
                  </button>
                  <button 
                    onClick={() => router.push('/instructor/grading/bulk')}
                    className="w-full text-left p-3 bg-[#FF6F61] text-white rounded-lg hover:bg-[#FF8A80] transition-colors text-sm font-medium"
                  >
                    ⚡ Bulk Grade
                  </button>
                  <button 
                    onClick={() => router.push('/instructor/ai-assistant')}
                    className="w-full text-left p-3 bg-[#9B5DE5] text-white rounded-lg hover:bg-[#B794F6] transition-colors text-sm font-medium"
                  >
                    🤖 AI Assistant
                  </button>
                  <button 
                    onClick={() => router.push('/instructor/analytics')}
                    className="w-full text-left p-3 bg-[#06D6A0] text-white rounded-lg hover:bg-[#4ECDC4] transition-colors text-sm font-medium"
                  >
                    📊 Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Courses */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-6xl mx-auto">
              {/* Courses Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#333333] mb-2">My Classes</h1>
                <p className="text-gray-600">Manage your courses and track student progress</p>
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <LoadingSpinner size="lg" />
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : (
                /* Classes Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => router.push(`/instructor/courses/${course.id}`)}
                        className="w-full text-left bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#4A90E2]/20"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCourse(course);
                                  setShowStudentList(true);
                                }}
                                className="hover:text-[#4A90E2] transition-colors"
                              >
                                👥 {course.studentCount} students
                              </button>
                            </div>
                          </div>
                          <div className="w-8 h-8 bg-[#4A90E2] rounded-full flex items-center justify-center text-white text-sm font-bold">
                            📚
                          </div>
                        </div>
                        
                        {/* Assignments List */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Assignments</h4>
                          <div className="space-y-2">
                            {getMockAssignmentsForCourse(course.id).slice(0, 3).map((assignment) => (
                              <div key={assignment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">{assignment.title}</p>
                                  <p className="text-xs text-gray-500">
                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    assignment.status === 'published' ? 'bg-green-100 text-green-800' :
                                    assignment.status === 'grading' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {assignment.status}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {assignment.submissionsCount} submissions
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Click to manage class</span>
                            <span className="text-[#4A90E2] font-medium">→</span>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full">
                      <EmptyState
                        title="No Classes Found"
                        description="It looks like you haven't created any classes yet. Start by creating your first class to begin teaching!"
                        icon="📚"
                        action={{ 
                          label: 'Create Your First Class', 
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
                <div className="w-16 h-16 bg-[#4A90E2] rounded-full flex items-center justify-center mx-auto mb-4">
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
                  className="w-full bg-[#4A90E2] text-white py-3 px-6 rounded-lg hover:bg-[#9B5DE5] transition-colors font-medium"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getMockStudentsForCourse(selectedCourse.id).map((student) => (
                    <div key={student.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-[#4A90E2] rounded-full flex items-center justify-center text-white font-bold">
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
                              <span className="text-xs font-medium text-[#4A90E2]">
                                Avg: {student.averageGrade}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {getMockStudentsForCourse(selectedCourse.id).length === 0 && (
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
                    Total: {getMockStudentsForCourse(selectedCourse.id).length} students
                  </span>
                  <button
                    onClick={() => setShowStudentList(false)}
                    className="px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#9B5DE5] transition-colors"
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

