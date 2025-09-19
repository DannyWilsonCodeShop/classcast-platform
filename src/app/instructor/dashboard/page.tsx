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
            {/* Left Side - MyClassCast Logo and Dashboard */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img 
                  src="/MyClassCast (800 x 200 px).png" 
                  alt="MyClassCast" 
                  className="h-8 w-auto object-contain"
                />
                <h1 className="text-xl font-bold text-[#4A90E2]">
                  Dashboard
                </h1>
              </div>
            </div>
            
            {/* Right Side - Portal Indicator, Profile Thumbnail, and Logout */}
            <div className="flex items-center space-x-4">
              <PortalIndicator />
              
              {/* Clickable Profile Thumbnail */}
              <button
                onClick={() => router.push('/instructor/profile')}
                className="w-10 h-10 rounded-full bg-[#4A90E2] flex items-center justify-center text-white font-bold text-lg shadow-lg hover:scale-110 transition-all duration-200 cursor-pointer"
                title="View Profile"
              >
                {user?.firstName?.charAt(0) || 'I'}
              </button>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 bg-[#FF6F61] text-white rounded-full hover:scale-110 transition-all duration-200 shadow-lg"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
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
              Instructor Portal
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4">
          <div className="max-w-7xl mx-auto h-full">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                <p className="text-red-600">{error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 h-full">
                {/* Stats Overview */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden h-64">
                  <div className="p-3 bg-[#4A90E2]">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">📊</span>
                      </div>
                      <h2 className="text-white font-bold text-sm">Overview</h2>
                    </div>
                  </div>
                  <div className="p-3 h-full overflow-y-auto">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{stats.activeCourses}</div>
                        <div className="text-sm text-gray-600">Active Courses</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{stats.ungradedAssignments}</div>
                        <div className="text-sm text-gray-600">Ungraded Assignments</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{stats.messages}</div>
                        <div className="text-sm text-gray-600">Messages</div>
                      </div>
                    </div>
                  </div>
                </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Submissions */}
          <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Submissions</h3>
            {recentSubmissions.length > 0 ? (
              <div className="space-y-4">
                {recentSubmissions.slice(0, 3).map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{submission.assignmentTitle}</h4>
                      <p className="text-sm text-gray-600">by {submission.studentName}</p>
                      <p className="text-xs text-gray-500">{submission.submittedAt}</p>
                    </div>
                    <button className="bg-[#003366] text-white px-3 py-1 rounded-md text-sm hover:bg-[#002244] transition-colors">
                      Review
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="📝"
                title="No Recent Submissions"
                description="You don't have any recent submissions to review."
              />
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => router.push('/instructor/assignments/create')}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                📝 Create New Assignment
              </button>
              <button 
                onClick={() => router.push('/instructor/courses/create')}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                🎓 Create New Course
              </button>
              <button 
                onClick={() => router.push('/instructor/grading/bulk')}
                className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
              >
                ⚡ Bulk Grade
              </button>
              <button 
                onClick={() => router.push('/instructor/ai-assistant')}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                🤖 AI Assistant
              </button>
            </div>
          </div>
        </div>

        {/* Your Courses Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Your Courses</h3>
            <button
              onClick={() => setShowWizard(true)}
              className="bg-[#003366] text-white px-4 py-2 rounded-md hover:bg-[#002244] transition-colors flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Setup New Course</span>
            </button>
          </div>
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {courses.map((course) => (
                <div key={course.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-900">{course.title}</h4>
                  <p className="text-sm text-gray-600">{course.studentCount} students</p>
                  <p className="text-xs text-gray-500">{course.assignmentsDue} assignments due</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="📚"
              title="No Courses Yet"
              description="Get started by creating your first course to begin teaching."
              action={
                <button
                  onClick={() => setShowWizard(true)}
                  className="bg-[#003366] text-white px-4 py-2 rounded-md hover:bg-[#002244] transition-colors"
                >
                  Create Your First Course
                </button>
              }
            />
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
    </InstructorRoute>
  );
};

export default InstructorDashboard;

