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
}

interface RecentSubmission {
  id: string;
  assignmentTitle: string;
  studentName: string;
  submittedAt: string;
}

const InstructorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    activeCourses: 0,
    ungradedAssignments: 0,
    messages: 0,
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
          setCourses(coursesData.courses || []);
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
        <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-[#4A90E2]/20 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left Side - MyClassCast Logo */}
            <div className="flex items-center">
              <img
                src="/MyClassCast (800 x 200 px).png"
                alt="MyClassCast"
                className="h-8 w-auto object-contain"
              />
            </div>
            
            {/* Right Side - Create Class Button and Profile Thumbnail */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowWizard(true)}
                className="flex items-center space-x-2 bg-[#4A90E2] text-white px-4 py-2 rounded-lg hover:bg-[#9B5DE5] transition-colors shadow-lg hover:shadow-xl"
                title="Create a new class"
              >
                <span className="text-lg">+</span>
                <span className="font-medium text-sm">Create Class</span>
              </button>
              <button
                onClick={() => router.push('/instructor/profile')}
                className="w-12 h-12 rounded-full bg-[#4A90E2] flex items-center justify-center text-white font-bold text-lg shadow-lg hover:scale-110 transition-all duration-200 cursor-pointer"
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
                /* Courses Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <div key={course.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>👥 {course.studentCount} students</span>
                              <span>📝 {course.assignmentsDue} due</span>
                            </div>
                          </div>
                          <div className="w-8 h-8 bg-[#4A90E2] rounded-full flex items-center justify-center text-white text-sm font-bold">
                            📚
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => router.push(`/instructor/courses/${course.id}`)}
                            className="flex-1 bg-[#4A90E2] text-white px-3 py-2 rounded-lg hover:bg-[#9B5DE5] transition-colors text-sm font-medium"
                          >
                            Manage
                          </button>
                          <button 
                            onClick={() => router.push(`/instructor/courses/${course.id}/assignments`)}
                            className="flex-1 bg-[#06D6A0] text-white px-3 py-2 rounded-lg hover:bg-[#4ECDC4] transition-colors text-sm font-medium"
                          >
                            Assignments
                          </button>
                        </div>
                      </div>
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
          onClose={() => setShowWizard(false)}
          onComplete={() => {
            setShowWizard(false);
            // Optionally refresh course data or show success message
          }}
        />
      </div>
    </InstructorRoute>
  );
};

export default InstructorDashboard;

