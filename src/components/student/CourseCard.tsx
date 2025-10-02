'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BookOpenIcon, UsersIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import Avatar from '@/components/common/Avatar';

interface Course {
  id: string;
  name: string;
  code: string;
  instructor: {
    name: string;
    avatar: string;
  };
  assignmentsDue: number;
  nextDeadline?: string;
  color: string;
}

interface CourseCardProps {
  course: Course;
  onClick?: (course: Course) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick }) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick(course);
    } else {
      router.push(`/student/courses/${course.id}`);
    }
  };


  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group"
    >
      {/* Course Header */}
      <div className={`h-20 rounded-t-lg p-4 relative overflow-hidden`} style={{ backgroundColor: course.color }}>
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">
                {course.name}
              </h3>
              <p className="text-sm text-white text-opacity-90">
                {course.code}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="p-4">
        {/* Instructor */}
        <div className="flex items-center space-x-2 mb-4">
          <Avatar
            user={{
              firstName: course.instructor.name.split(' ')[0] || '',
              lastName: course.instructor.name.split(' ')[1] || '',
              avatar: course.instructor.avatar
            }}
            size="sm"
          />
          <span className="text-sm text-gray-600">
            Prof. {course.instructor.name}
          </span>
        </div>

        {/* Assignments Due */}
        <div className="flex items-center space-x-2 mb-4">
          <ClockIcon className="h-4 w-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Assignments Due</p>
            <p className="text-sm font-medium text-gray-900">
              {course.assignmentsDue}
            </p>
          </div>
        </div>

        {/* Next Deadline */}
        {course.nextDeadline && (
          <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-lg mb-4">
            <CalendarIcon className="h-4 w-4 text-yellow-600" />
            <div>
              <p className="text-xs text-yellow-800 font-medium">Next Deadline</p>
              <p className="text-sm text-yellow-700">
                {new Date(course.nextDeadline).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors group-hover:bg-blue-50 group-hover:text-blue-700"
        >
          View Course Details
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
