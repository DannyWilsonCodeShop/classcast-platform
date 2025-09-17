'use client';

import React, { useState } from 'react';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import PortalIndicator from '@/components/common/PortalIndicator';
import InstructorOnboardingWizard from '@/components/wizards/InstructorOnboardingWizard';

const InstructorDashboard: React.FC = () => {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <InstructorRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#003366]">Instructor Dashboard</h1>
              <p className="mt-2 text-gray-600">Manage your courses and student progress</p>
            </div>
            <PortalIndicator />
          </div>
        </div>

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
                <p className="text-2xl font-semibold text-gray-900">4</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-[#D4AF37]/20 rounded-lg">
                <svg className="h-6 w-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-semibold text-gray-900">127</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-[#003366]/20 rounded-lg">
                <svg className="h-6 w-6 text-[#003366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-semibold text-gray-900">23</p>
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
                <p className="text-sm font-medium text-gray-600">Avg. Rating</p>
                <p className="text-2xl font-semibold text-gray-900">4.8</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Submissions */}
          <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Submissions</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">React Component Design</h4>
                  <p className="text-sm text-gray-600">by Sarah Johnson</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
                <button className="bg-[#003366] text-white px-3 py-1 rounded-md text-sm hover:bg-[#002244] transition-colors">
                  Review
                </button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">API Documentation</h4>
                  <p className="text-sm text-gray-600">by Mike Chen</p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
                <button className="bg-[#003366] text-white px-3 py-1 rounded-md text-sm hover:bg-[#002244] transition-colors">
                  Review
                </button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Database Schema</h4>
                  <p className="text-sm text-gray-600">by Emily Davis</p>
                  <p className="text-xs text-gray-500">6 hours ago</p>
                </div>
                <button className="bg-[#003366] text-white px-3 py-1 rounded-md text-sm hover:bg-[#002244] transition-colors">
                  Review
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Create New Assignment
              </button>
              <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                View All Submissions
              </button>
              <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
                Community Feed
              </button>
              <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors">
                Bulk Grade
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-gray-900">React Development</h4>
              <p className="text-sm text-gray-600">32 students</p>
              <p className="text-xs text-gray-500">4 assignments due</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-gray-900">Backend Development</h4>
              <p className="text-sm text-gray-600">28 students</p>
              <p className="text-xs text-gray-500">2 assignments due</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-gray-900">Database Design</h4>
              <p className="text-sm text-gray-600">25 students</p>
              <p className="text-xs text-gray-500">1 assignment due</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-gray-900">DevOps Fundamentals</h4>
              <p className="text-sm text-gray-600">42 students</p>
              <p className="text-xs text-gray-500">3 assignments due</p>
            </div>
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

