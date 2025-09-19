import React from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { AssignmentList } from '@/components/student/AssignmentList';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const StudentAssignmentsPage: React.FC = () => {
  return (
    <StudentRoute>
      <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
        {/* Header with Back Button */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
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
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
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
            <div className="text-xs text-gray-500">
              ClassCast
            </div>
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





