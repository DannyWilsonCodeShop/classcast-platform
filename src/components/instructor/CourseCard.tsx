'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Course } from '@/types/course';

interface CourseCardProps {
  course: Course;
  onEdit: (course: Course) => void;
  onDelete: (courseId: string) => void;
  onArchive: (courseId: string) => void;
  onPublish: (courseId: string) => void;
  onBulkEnroll?: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onEdit,
  onDelete,
  onArchive,
  onPublish,
  onBulkEnroll,
}) => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/instructor/courses/${course.courseId}`)}
      className="w-full bg-gray-50 rounded-xl p-4 text-left active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-[#005587] line-clamp-1 flex-1">
          {course.title}
        </h3>
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ml-2 shrink-0 ${
          course.status === 'published' ? 'bg-green-100 text-green-700' :
          course.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {course.status}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>{course.code}</span>
        <span>{course.semester} {course.year}</span>
        <span className="font-medium text-[#005587]">{course.currentEnrollment || 0} students</span>
      </div>
    </button>
  );
};
