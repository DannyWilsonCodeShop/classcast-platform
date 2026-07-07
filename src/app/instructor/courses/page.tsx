'use client';

import React from 'react';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { CourseManagement } from '@/components/instructor/CourseManagement';

const InstructorCoursesPage: React.FC = () => {
  return (
    <InstructorRoute>
      <div className="absolute inset-0 overflow-y-auto px-4">
        <CourseManagement />
      </div>
    </InstructorRoute>
  );
};

export default InstructorCoursesPage;
