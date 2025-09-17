import React from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { AssignmentList } from '@/components/student/AssignmentList';

const StudentAssignmentsPage: React.FC = () => {
  return (
    <StudentRoute>
      <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {/* Social Media Style Header */}
        <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              📝
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">My Tasks</h1>
              <p className="text-xs text-gray-600">
                Stay on top of your assignments! 🚀
              </p>
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





