'use client';

import React from 'react';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { CourseManagement } from '@/components/instructor/CourseManagement';

const InstructorCoursesPage: React.FC = () => {
  return (
    <InstructorRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CourseManagement />
      </div>
    </InstructorRoute>
  );
};

export default InstructorCoursesPage;
