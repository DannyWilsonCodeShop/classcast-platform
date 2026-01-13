'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PlayIcon, ClockIcon, BookOpenIcon } from '@heroicons/react/24/outline';

interface LearningItem {
  id: string;
  type: 'course' | 'assignment' | 'video';
  title: string;
  subtitle: string;
  progress: number;
  timeLeft?: string;
  dueDate?: string;
  thumbnail: string;
  courseTitle?: string;
  lastAccessed: string;
}

interface ContinueLearningProps {
  items: LearningItem[];
  maxItems?: number;
}

const ContinueLearning: React.FC<ContinueLearningProps> = ({ 
  items, 
  maxItems = 4 
}) => {
  const router = useRouter();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course': return BookOpenIcon;
      case 'assignment': return ClockIcon;
      case 'video': return PlayIcon;
      default: return BookOpenIcon;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'course': return 'bg-blue-100 text-blue-600';
      case 'assignment': return 'bg-orange-100 text-orange-600';
      case 'video': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleItemClick = (item: LearningItem) => {
    switch (item.type) {
      case 'course':
        router.push(`/student/courses/${item.id}`);
        break;
      case 'assignment':
        router.push(`/student/assignments/${item.id}`);
        break;
      case 'video':
        router.push(`/student/videos/${item.id}`);
        break;
    }
  };

  const displayItems = items.slice(0, maxItems);

  if (displayItems.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to start learning?</h3>
          <p className="text-gray-500 mb-4">Explore your courses and begin your learning journey.</p>
          <button
            onClick={() => router.push('/student/courses')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Continue Learning</h2>
            <p className="text-sm text-gray-600 mt-1">Pick up where you left off</p>
          </div>
          <button
            onClick={() => router.push('/student/courses')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </button>
        </div>
      </div>

      {/* Learning Items */}
      <div className="p-6 space-y-4">
        {displayItems.map((item) => {
          const IconComponent = getTypeIcon(item.type);
          
          return (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
            >
              {/* Thumbnail */}
              <div className="relative flex-shrink-0">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-16 h-12 rounded-lg object-cover"
                />
                <div className={`absolute -top-1 -right-1 p-1 rounded-full ${getTypeColor(item.type)}`}>
                  <IconComponent className="w-3 h-3" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-600 truncate">{item.subtitle}</p>
                {item.courseTitle && (
                  <p className="text-xs text-gray-500 mt-1">in {item.courseTitle}</p>
                )}
                
                {/* Progress bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Progress</span>
                    <span className="text-xs font-medium text-gray-700">{item.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Meta info */}
              <div className="flex-shrink-0 text-right">
                {item.dueDate && (
                  <div className="flex items-center space-x-1 text-orange-600 mb-1">
                    <ClockIcon className="w-3 h-3" />
                    <span className="text-xs font-medium">Due {item.dueDate}</span>
                  </div>
                )}
                {item.timeLeft && (
                  <p className="text-xs text-gray-500">{item.timeLeft} left</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{item.lastAccessed}</p>
                
                {/* Continue button */}
                <button className="mt-2 flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors">
                  <PlayIcon className="w-3 h-3" />
                  <span>Continue</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {items.length > maxItems && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={() => router.push('/student/courses')}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View {items.length - maxItems} more items
          </button>
        </div>
      )}
    </div>
  );
};

export default ContinueLearning;