'use client';

import React from 'react';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { CourseManagement } from '@/components/instructor/CourseManagement';

const InstructorCoursesPage: React.FC = () => {
  return (
    <InstructorRoute>
      <div className="min-h-full overflow-y-auto pb-24 px-4">
        <CourseManagement />
      </div>
    </InstructorRoute>
  );
};

export default InstructorCoursesPage;
