import React from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { AssignmentList } from '@/components/student/AssignmentList';

const StudentAssignmentsPage: React.FC = () => {
  return (
    <StudentRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="mt-2 text-gray-600">
            View and manage your course assignments
          </p>
        </div>

        {/* Assignment List */}
        <AssignmentList
          showFilters={true}
          showSort={true}
          showPagination={true}
          maxItems={50}
        />
      </div>
    </StudentRoute>
  );
};

export default StudentAssignmentsPage;





