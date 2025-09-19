import React from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { SubmissionHistory } from '@/components/student/SubmissionHistory';
import Link from 'next/link';

const StudentSubmissionsPage: React.FC = () => {
  return (
    <StudentRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
        {/* Header with Back Button */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/student/dashboard"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                title="Back to Dashboard"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  📝
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">My Submissions</h1>
                  <p className="text-xs text-gray-600">View your video submission history</p>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              ClassCast
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 overflow-hidden">
            <div className="p-6">
              <SubmissionHistory />
            </div>
          </div>
        </div>
      </div>
    </StudentRoute>
  );
};

export default StudentSubmissionsPage;