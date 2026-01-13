'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PlayIcon, ClockIcon, StarIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface CourseProgressCardProps {
  course: {
    id: string;
    title: string;
    instructor: string;
    progress?: number; // 0-100, calculated based on time
    nextLesson?: string;
    timeRemaining?: string;
    thumbnail: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    rating: number;
    totalLessons?: number;
    completedLessons?: number;
    lastAccessed?: string;
    startDate?: string; // Course start date
    endDate?: string; // Course end date (defaults to May 1st, 2025)
  };
  size?: 'small' | 'medium' | 'large';
}

const CourseProgressCard: React.FC<CourseProgressCardProps> = ({ 
  course, 
  size = 'medium' 
}) => {
  const router = useRouter();

  // Calculate progress based on time elapsed from start to May 1st, 2025
  const calculateTimeBasedProgress = () => {
    const now = new Date();
    const courseEndDate = course.endDate ? new Date(course.endDate) : new Date('2025-05-01');
    const courseStartDate = course.startDate ? new Date(course.startDate) : new Date('2024-08-15'); // Assume fall semester start
    
    // If we're past the end date, course is complete
    if (now >= courseEndDate) {
      return 100;
    }
    
    // If we're before the start date, course hasn't started
    if (now < courseStartDate) {
      return 0;
    }
    
    // Calculate progress based on time elapsed
    const totalDuration = courseEndDate.getTime() - courseStartDate.getTime();
    const elapsed = now.getTime() - courseStartDate.getTime();
    const progress = Math.round((elapsed / totalDuration) * 100);
    
    return Math.min(Math.max(progress, 0), 100);
  };

  // Calculate time remaining until May 1st, 2025
  const calculateTimeRemaining = () => {
    const now = new Date();
    const courseEndDate = course.endDate ? new Date(course.endDate) : new Date('2025-05-01');
    
    if (now >= courseEndDate) {
      return 'Course completed';
    }
    
    const timeDiff = courseEndDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    if (daysRemaining > 30) {
      const monthsRemaining = Math.floor(daysRemaining / 30);
      return `${monthsRemaining} month${monthsRemaining !== 1 ? 's' : ''} remaining`;
    } else if (daysRemaining > 7) {
      const weeksRemaining = Math.floor(daysRemaining / 7);
      return `${weeksRemaining} week${weeksRemaining !== 1 ? 's' : ''} remaining`;
    } else if (daysRemaining > 0) {
      return `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;
    } else {
      return 'Due today';
    }
  };

  const progress = course.progress ?? calculateTimeBasedProgress();
  const timeRemaining = course.timeRemaining ?? calculateTimeRemaining();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  const cardSizes = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  return (
    <div 
      onClick={() => router.push(`/student/courses/${course.id}`)}
      className={`
        bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md 
        transition-all duration-200 cursor-pointer group
        ${cardSizes[size]}
      `}
    >
      {/* Course Header */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="relative flex-shrink-0">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-16 h-16 rounded-lg object-cover"
          />
          {progress === 100 && (
            <div className="absolute -top-1 -right-1">
              <CheckCircleIcon className="w-6 h-6 text-green-500 bg-white rounded-full" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2">by {course.instructor}</p>
          
          <div className="flex items-center space-x-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(course.difficulty)}`}>
              {course.difficulty}
            </span>
            <div className="flex items-center space-x-1">
              <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">{course.rating}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Course Progress (Time-based)
          </span>
          <span className="text-sm font-bold text-gray-900">
            {progress}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Next Lesson or Completion */}
      {progress === 100 ? (
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-green-800">Course Completed!</span>
          </div>
          <button className="text-sm text-green-600 hover:text-green-700 font-medium">
            View Final Grade
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 mb-1">
              Course ends May 1st, 2025
            </p>
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-600">{timeRemaining}</span>
            </div>
          </div>
          <button className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <PlayIcon className="w-4 h-4" />
            <span>Continue</span>
          </button>
        </div>
      )}

      {/* Last Accessed */}
      {course.lastAccessed && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Last accessed {course.lastAccessed}
          </p>
        </div>
      )}
    </div>
  );
};

export default CourseProgressCard;