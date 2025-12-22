import React from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { AssignmentList } from '@/components/student/AssignmentList';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DemoModeBanner from '@/components/common/DemoModeBanner';

const StudentAssignmentsPage: React.FC = () => {
  return (
    <StudentRoute>
      <div className="h-screen overflow-hidden flex flex-col bg-gray-50">
        {/* Demo Mode Banner */}
        <DemoModeBanner />
        
        {/* Header with Back Button */}
        <div className="bg-gradient-to-r from-purple-100/80 via-blue-100/80 to-pink-100/80 backdrop-blur-sm border-b-2 border-purple-300/50 shadow-lg px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/student/dashboard"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                title="Back to Home"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#005587] rounded-full flex items-center justify-center text-white font-bold text-lg">
                  📝
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">My Assignments</h1>
                  <p className="text-xs text-gray-600">
                    Stay on top of your assignments! 🚀
                  </p>
                </div>
              </div>
            </div>
            <img
              src="/MyClassCast (800 x 200 px).png"
              alt="MyClassCast"
              className="h-6 w-auto object-contain"
            />
          </div>
        </div>

        {/* Mobile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <AssignmentList
              showFilters={true}
              showSort={true}
              showPagination={true}
              maxItems={20}
            />
          </div>
        </div>
      </div>
    </StudentRoute>
  );
};

export default StudentAssignmentsPage;






