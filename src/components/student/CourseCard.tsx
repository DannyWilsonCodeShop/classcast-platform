'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BookOpenIcon, UsersIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  instructor: {
    name: string;
    avatar: string;
  };
  thumbnail?: string;
  progress: number;
  totalAssignments: number;
  completedAssignments: number;
  upcomingDeadlines: number;
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

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusText = (progress: number) => {
    if (progress >= 80) return 'Excellent';
    if (progress >= 60) return 'Good';
    if (progress >= 40) return 'Needs Attention';
    return 'Behind';
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group"
    >
      {/* Course Header */}
      <div className={`h-24 rounded-t-lg bg-gradient-to-r ${course.color} p-4 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">
                {course.name}
              </h3>
              <p className="text-sm text-white text-opacity-90">
                {course.code}
              </p>
            </div>
            {course.thumbnail && (
              <img
                src={course.thumbnail}
                alt={course.name}
                className="w-12 h-12 rounded-lg object-cover border-2 border-white"
              />
            )}
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="p-4">
        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {course.description}
        </p>

        {/* Instructor */}
        <div className="flex items-center space-x-2 mb-4">
          <img
            src={course.instructor.avatar}
            alt={course.instructor.name}
            className="w-6 h-6 rounded-full"
          />
          <span className="text-sm text-gray-600">
            Prof. {course.instructor.name}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">{course.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(course.progress)}`}
              style={{ width: `${course.progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {getStatusText(course.progress)}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <BookOpenIcon className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Assignments</p>
              <p className="text-sm font-medium text-gray-900">
                {course.completedAssignments}/{course.totalAssignments}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Due Soon</p>
              <p className="text-sm font-medium text-gray-900">
                {course.upcomingDeadlines}
              </p>
            </div>
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
