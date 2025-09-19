'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Link from 'next/link';

export default function AssignmentsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  
  // State for live assignment data
  const [assignmentStats, setAssignmentStats] = useState({
    total: 0,
    pending: 0,
    graded: 0,
    overdue: 0
  });
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    // Show quick access for a moment before redirecting
    setShowQuickAccess(true);
    const timer = setTimeout(() => {
      // Redirect to role-specific assignments page
      switch (user.role) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'instructor':
          router.push('/instructor/courses');
          break;
        case 'student':
          router.push('/student/assignments');
          break;
        default:
          router.push('/auth/login');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <LoadingSpinner text="Loading your assignments..." />
        </div>
      </div>
    );
  }

  if (!showQuickAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <LoadingSpinner text="Redirecting to assignments..." />
        </div>
      </div>
    );
  }

  // Load assignment data
  useEffect(() => {
    const loadAssignmentData = async () => {
      try {
        setIsLoadingData(true);
        
        // TODO: Replace with actual API calls
        // const statsResponse = await fetch(`/api/assignments/stats?role=${user?.role}`);
        // const assignmentsResponse = await fetch(`/api/assignments/recent?role=${user?.role}`);
        
        // For now, set empty data until APIs are implemented
        setAssignmentStats({ total: 0, pending: 0, graded: 0, overdue: 0 });
        setRecentAssignments([]);
        
      } catch (error) {
        console.error('Error loading assignment data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (isAuthenticated && user) {
      loadAssignmentData();
    }
  }, [isAuthenticated, user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'graded': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full mb-6">
            <span className="text-2xl">📚</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Assignment Center
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Manage and track all your assignments in one place
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} View
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">📝</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{currentStats.total}</p>
                <p className="text-sm text-gray-600">Total Assignments</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">⏳</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{currentStats.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{currentStats.graded}</p>
                <p className="text-sm text-gray-600">Graded</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{currentStats.overdue}</p>
                <p className="text-sm text-gray-600">Overdue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link
            href={user?.role === 'instructor' ? '/instructor/courses' : '/student/assignments'}
            className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-200 hover:border-green-300"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                {user?.role === 'instructor' ? '📝' : '👀'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                  {user?.role === 'instructor' ? 'Create Assignment' : 'View Assignments'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {user?.role === 'instructor' ? 'Set up new assignments for your courses' : 'See all your current assignments'}
                </p>
              </div>
            </div>
          </Link>

          <Link
            href={user?.role === 'instructor' ? '/instructor/dashboard' : '/student/submissions'}
            className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-200 hover:border-green-300"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                {user?.role === 'instructor' ? '📊' : '📤'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                  {user?.role === 'instructor' ? 'Grade Submissions' : 'Submit Work'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {user?.role === 'instructor' ? 'Review and grade student work' : 'Upload your assignments and projects'}
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/community"
            className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-200 hover:border-green-300"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                💬
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                  Community Help
                </h3>
                <p className="text-gray-600 text-sm">
                  Get help from peers and instructors
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Assignments Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Assignments</h2>
            <Link
              href={user?.role === 'instructor' ? '/instructor/courses' : '/student/assignments'}
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentAssignments.map((assignment) => (
              <Link key={assignment.id} href={`/assignments/${assignment.id}`}>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-lg">
                        {assignment.type === 'Project' ? '🎯' : assignment.type === 'Homework' ? '📝' : '📄'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                      <p className="text-sm text-gray-600">{assignment.course} • {assignment.points} points</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                      {assignment.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(assignment.priority)}`}>
                      {assignment.priority}
                    </span>
                    <span className="text-sm text-gray-500">
                      Due {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Redirect Notice */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Redirecting to your {user?.role} assignments in a moment...
          </div>
        </div>
      </div>
    </div>
  );
}
