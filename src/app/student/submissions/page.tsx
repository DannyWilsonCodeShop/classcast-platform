import React from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { SubmissionHistory } from '@/components/student/SubmissionHistory';
import Link from 'next/link';

const StudentSubmissionsPage: React.FC = () => {
  return (
    <StudentRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
        {/* Header with Back Button, Logo, and Home Button */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left Side - Back Button and Logo */}
            <div className="flex items-center space-x-4">
              <Link
                href="/student/dashboard"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                title="Back to Home"
              >
                <span className="text-xl">&lt;</span>
              </Link>
              <img
                src="/MyClassCast (800 x 200 px).png"
                alt="MyClassCast"
                className="h-8 w-auto object-contain"
              />
            </div>
            
            {/* Right Side - Home Button */}
            <div className="flex items-center">
              <Link
                href="/student/dashboard"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                title="Home Dashboard"
              >
                <span className="text-xl">🏠</span>
              </Link>
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