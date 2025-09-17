'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [showQuickAccess, setShowQuickAccess] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    // Show quick access for a moment before redirecting
    setShowQuickAccess(true);
    const timer = setTimeout(() => {
      // Redirect to role-specific dashboard
      switch (user.role) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'instructor':
          router.push('/instructor/dashboard');
          break;
        case 'student':
          router.push('/student/dashboard');
          break;
        default:
          router.push('/auth/login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <LoadingSpinner text="Loading your personalized dashboard..." />
        </div>
      </div>
    );
  }

  if (!showQuickAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <LoadingSpinner text="Redirecting to your dashboard..." />
        </div>
      </div>
    );
  }

  const quickActions = {
    admin: [
      { title: 'System Analytics', description: 'View platform usage and performance', icon: '📊', href: '/admin/dashboard' },
      { title: 'User Management', description: 'Manage users and permissions', icon: '👥', href: '/admin/dashboard' },
      { title: 'System Settings', description: 'Configure platform settings', icon: '⚙️', href: '/admin/dashboard' }
    ],
    instructor: [
      { title: 'Create Assignment', description: 'Set up new assignments quickly', icon: '📝', href: '/instructor/dashboard' },
      { title: 'Grade Submissions', description: 'Review and grade student work', icon: '✅', href: '/instructor/dashboard' },
      { title: 'Course Analytics', description: 'Track student progress and engagement', icon: '📈', href: '/instructor/dashboard' }
    ],
    student: [
      { title: 'View Assignments', description: 'See your upcoming and past assignments', icon: '📚', href: '/student/assignments' },
      { title: 'Submit Work', description: 'Upload your assignments and projects', icon: '📤', href: '/student/submissions' },
      { title: 'Check Grades', description: 'Review your grades and feedback', icon: '🎯', href: '/student/dashboard' }
    ]
  };

  const currentActions = quickActions[user?.role as keyof typeof quickActions] || quickActions.student;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6">
            <span className="text-2xl font-bold text-white">
              {user?.firstName?.charAt(0) || 'U'}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Ready to continue your learning journey?
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Account
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {currentActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-200 hover:border-blue-300"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                    {action.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {action.description}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <span className="text-sm text-gray-500">Last 7 days</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Assignment submitted</p>
                <p className="text-xs text-gray-500">CS 101 - Project Proposal</p>
              </div>
              <span className="text-xs text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">📝</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New assignment available</p>
                <p className="text-xs text-gray-500">Math 201 - Calculus Problem Set</p>
              </div>
              <span className="text-xs text-gray-400">1 day ago</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm">💬</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Community post liked</p>
                <p className="text-xs text-gray-500">Study group for Physics 101</p>
              </div>
              <span className="text-xs text-gray-400">3 days ago</span>
            </div>
          </div>
        </div>

        {/* Redirect Notice */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Redirecting to your {user?.role} dashboard in a moment...
          </div>
        </div>
      </div>
    </div>
  );
}
