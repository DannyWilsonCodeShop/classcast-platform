import React from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { AssignmentList } from '@/components/student/AssignmentList';

interface CourseAssignmentsPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

const CourseAssignmentsPage: React.FC<CourseAssignmentsPageProps> = async ({ params }) => {
  const { courseId } = await params;

  return (
    <StudentRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Course Assignments
              </h1>
              <p className="mt-2 text-gray-600">
                Assignments for {courseId}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                View Course
              </button>
            </div>
          </div>
        </div>

        {/* Assignment List */}
        <AssignmentList
          courseId={courseId}
          showFilters={true}
          showSort={true}
          showPagination={true}
          maxItems={50}
        />
      </div>
    </StudentRoute>
  );
};

export default CourseAssignmentsPage;






