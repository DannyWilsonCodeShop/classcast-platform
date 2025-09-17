'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { CompactAssignmentList } from '@/components/student/CompactAssignmentList';
import AITutoringChat from '@/components/ai/AITutoringChat';
import VideoReels from '@/components/student/VideoReels';
import CourseCard from '@/components/student/CourseCard';
import ProfileEditor from '@/components/student/ProfileEditor';
import PortalIndicator from '@/components/common/PortalIndicator';
import StudentOnboardingWizard from '@/components/wizards/StudentOnboardingWizard';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, Wifi, WifiOff } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ai-tutor'>('ai-tutor');
  const [showWizard, setShowWizard] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState({
    activeCourses: 0,
    assignmentsDue: 0,
    completed: 0,
    averageGrade: 0
  });
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoadingStats(true);
        setIsLoadingCourses(true);
        setIsLoadingAssignments(true);
        
        // Load stats
        // TODO: Replace with actual API calls
        setStats({
          activeCourses: 3,
          assignmentsDue: 5,
          completed: 12,
          averageGrade: 88
        });
        
        // Load courses
        const mockCourses = [
          {
            id: 'cs-101',
            name: 'Introduction to Computer Science',
            code: 'CS 101',
            description: 'Fundamental concepts of computer science and programming',
            instructor: {
              name: 'Dr. Smith',
              avatar: '/api/placeholder/40/40'
            },
            thumbnail: '/api/placeholder/300/200',
            progress: 75,
            totalAssignments: 8,
            completedAssignments: 6,
            upcomingDeadlines: 2,
            nextDeadline: '2024-12-20',
            color: 'from-blue-500 to-blue-600'
          },
          {
            id: 'cs-201',
            name: 'Data Structures and Algorithms',
            code: 'CS 201',
            description: 'Advanced programming concepts and algorithm design',
            instructor: {
              name: 'Prof. Johnson',
              avatar: '/api/placeholder/40/40'
            },
            thumbnail: '/api/placeholder/300/200',
            progress: 60,
            totalAssignments: 10,
            completedAssignments: 6,
            upcomingDeadlines: 3,
            nextDeadline: '2024-12-18',
            color: 'from-green-500 to-green-600'
          },
          {
            id: 'cs-301',
            name: 'Software Engineering',
            code: 'CS 301',
            description: 'Software development methodologies and practices',
            instructor: {
              name: 'Dr. Williams',
              avatar: '/api/placeholder/40/40'
            },
            thumbnail: '/api/placeholder/300/200',
            progress: 45,
            totalAssignments: 6,
            completedAssignments: 3,
            upcomingDeadlines: 1,
            nextDeadline: '2024-12-22',
            color: 'from-purple-500 to-purple-600'
          }
        ];
        setCourses(mockCourses);
        
        // Load assignments
        const mockAssignments = [
          {
            id: '1',
            title: 'React Component Design',
            course: 'CS 101',
            dueDate: '2024-12-15',
            status: 'due-soon',
            priority: 'high'
          },
          {
            id: '2',
            title: 'API Documentation',
            course: 'CS 201',
            dueDate: '2024-12-20',
            status: 'in-progress',
            priority: 'medium'
          },
          {
            id: '3',
            title: 'Database Schema',
            course: 'CS 301',
            dueDate: '2024-12-25',
            status: 'not-started',
            priority: 'low'
          }
        ];
        setAssignments(mockAssignments);
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoadingStats(false);
        setIsLoadingCourses(false);
        setIsLoadingAssignments(false);
      }
    };

    loadDashboardData();
  }, []);

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

  return (
    <StudentRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#003366]">Student Dashboard</h1>
              <p className="mt-2 text-gray-600">Track your progress and manage your assignments</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Online Status */}
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
                <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              {/* Profile Editor Button */}
              <button
                onClick={() => setShowProfileEditor(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
              
              <PortalIndicator />
            </div>
          </div>
        </div>

        {/* Video Reels Section */}
        <div className="mb-8">
          <VideoReels />
        </div>

        {/* Courses Section */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">📚 Your Courses</h2>
              <button
                onClick={() => router.push('/student/courses')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Courses
              </button>
            </div>
            
            {isLoadingCourses ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onClick={() => router.push(`/student/courses/${course.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Assignments Section */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">📝 Pending Assignments</h2>
              <button
                onClick={() => router.push('/student/assignments')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Assignments
              </button>
            </div>
            
            {isLoadingAssignments ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-lg h-20"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    onClick={() => router.push(`/student/assignments/${assignment.id}`)}
                    className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                        <p className="text-sm text-gray-600">{assignment.course}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Due: {assignment.dueDate}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assignment.status === 'due-soon' ? 'bg-red-100 text-red-800' :
                          assignment.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {assignment.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Tutor Section */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🤖 AI Learning Assistant</h2>
            <AITutoringChat />
          </div>
        </div>

        {/* Get Started Section */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">🎓 Welcome to ClassCast!</h3>
              <p className="text-blue-700">Complete your setup to get the most out of your learning experience.</p>
            </div>
            <button
              onClick={() => setShowWizard(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <span>🚀</span>
              <span>Get Started</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Stats Cards */}
              <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-[#003366]/20 rounded-lg">
                <svg className="h-6 w-6 text-[#003366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoadingStats ? '...' : stats.activeCourses}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-[#D4AF37]/20 rounded-lg">
                <svg className="h-6 w-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assignments Due</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoadingStats ? '...' : stats.assignmentsDue}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-[#003366]/20 rounded-lg">
                <svg className="h-6 w-6 text-[#003366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoadingStats ? '...' : stats.completed}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-[#D4AF37]/20 rounded-lg">
                <svg className="h-6 w-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">GPA</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoadingStats ? '...' : stats.averageGrade.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Assignments */}
          <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Assignments</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">React Component Design</h4>
                  <p className="text-sm text-gray-600">Due: Dec 15, 2024</p>
                  <p className="text-xs text-gray-500">Computer Science 101</p>
                </div>
                <span className="bg-[#003366] text-white px-3 py-1 rounded-md text-sm">
                  Due Soon
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">API Documentation</h4>
                  <p className="text-sm text-gray-600">Due: Dec 20, 2024</p>
                  <p className="text-xs text-gray-500">Software Engineering</p>
                </div>
                <span className="bg-[#D4AF37] text-white px-3 py-1 rounded-md text-sm">
                  In Progress
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Database Schema</h4>
                  <p className="text-sm text-gray-600">Due: Dec 25, 2024</p>
                  <p className="text-xs text-gray-500">Database Systems</p>
                </div>
                <span className="bg-gray-500 text-white px-3 py-1 rounded-md text-sm">
                  Not Started
                </span>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Deadlines</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Advanced React Patterns</h4>
                  <p className="text-sm text-gray-600">Course: React Development</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-red-600 font-medium">Due in 2 days</p>
                  <p className="text-xs text-gray-500">Dec 15, 2024</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">API Integration Project</h4>
                  <p className="text-sm text-gray-600">Course: Backend Development</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-yellow-600 font-medium">Due in 5 days</p>
                  <p className="text-xs text-gray-500">Dec 18, 2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
        )}

        {activeTab === 'ai-tutor' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">🤖 AI Tutoring Assistant</h3>
            <p className="text-gray-600 mb-6">
              Get personalized help with your studies. Ask questions about any subject and get instant, intelligent responses.
            </p>
            <AITutoringChat
              userId="student-123"
              courseId="course-456"
              context={{
                subject: "Computer Science",
                difficulty: "intermediate",
                learningGoals: ["Master React", "Understand APIs", "Learn Database Design"]
              }}
            />
          </div>
        )}

        {activeTab === 'plagiarism-check' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">🔍 Plagiarism Detection</h3>
            <p className="text-gray-600 mb-6">
              Check your written work for originality and ensure academic integrity before submitting.
            </p>
            <PlagiarismChecker
              submissionId="student-submission-123"
              assignmentId="assignment-456"
              text="Enter your essay or assignment text here to check for plagiarism..."
              onCheckComplete={(result) => {
                console.log('Plagiarism check completed:', result);
              }}
            />
          </div>
        )}

        {/* Profile Editor Modal */}
        {showProfileEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <ProfileEditor
                user={user}
                onClose={() => setShowProfileEditor(false)}
                onSave={() => {
                  setShowProfileEditor(false);
                  // Refresh user data if needed
                }}
              />
            </div>
          </div>
        )}

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
