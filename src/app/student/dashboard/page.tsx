'use client';

import React from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { CompactAssignmentList } from '@/components/student/CompactAssignmentList';

const StudentDashboard: React.FC = () => {
  return (
    <StudentRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#003366]">Student Dashboard</h1>
          <p className="mt-2 text-gray-600">Track your progress and manage your assignments</p>
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
                <p className="text-2xl font-semibold text-gray-900">5</p>
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
                <p className="text-2xl font-semibold text-gray-900">3</p>
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
                <p className="text-2xl font-semibold text-gray-900">24</p>
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
                <p className="text-2xl font-semibold text-gray-900">3.8</p>
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
      </div>
    </StudentRoute>
  );
};

export default StudentDashboard;
