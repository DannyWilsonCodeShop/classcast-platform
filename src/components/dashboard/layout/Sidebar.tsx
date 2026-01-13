'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/common/Avatar';
import {
  ChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon,
  AcademicCapIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

interface Course {
  courseId: string;
  name: string;
  initials: string;
  code: string;
  unreadCount: number;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchUserCourses();
    }
  }, [user?.id]);

  const fetchUserCourses = async () => {
    try {
      const response = await fetch(`/api/student/feed?userId=${user?.id}&includeAllPublic=false`);
      const data = await response.json();
      
      if (data.success && data.courses) {
        setCourses(data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    onClose();
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Header with ClassCast Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CC</span>
            </div>
            <span className="text-xl font-bold text-gray-900">ClassCast</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex flex-col h-full overflow-y-auto">
          {/* User Profile - With School Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Avatar 
                user={user}
                size="lg"
                className="w-12 h-12"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <div className="flex items-center mt-2">
                  <img 
                    src="/logos/cristo-rey-atlanta.png" 
                    alt="Cristo Rey Atlanta" 
                    className="w-12 h-12 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Search for New Courses */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Discover Courses
            </h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for new courses..."
                className="w-full px-3 py-2 pl-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Enrolled Courses */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              My Courses
            </h3>
            {loading ? (
              <div className="space-y-2">
                <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
                <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
              </div>
            ) : courses.length > 0 ? (
              <div className="space-y-1">
                {courses.map((course) => (
                  <button
                    key={course.courseId}
                    onClick={() => handleNavigation(`/student/courses/${course.courseId}`)}
                    className={`
                      w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                      ${isActive(`/student/courses/${course.courseId}`)
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-xs font-bold text-white
                      ${isActive(`/student/courses/${course.courseId}`) ? 'bg-blue-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'}
                    `}>
                      {course.initials || course.code?.substring(0, 2) || course.name?.substring(0, 2) || 'C'}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-medium text-sm leading-tight break-words">{course.name}</div>
                      {course.code && (
                        <div className="text-xs text-gray-500 mt-0.5">{course.code}</div>
                      )}
                    </div>
                    {course.unreadCount > 0 && (
                      <div className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {course.unreadCount}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <BookOpenIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No courses enrolled</p>
              </div>
            )}
          </div>

          {/* Navigation - Simplified */}
          <nav className="flex-1 px-6 py-4 space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Access
            </h3>
            
            {/* Recent Grades */}
            <button
              onClick={() => handleNavigation('/student/grades')}
              className={`
                w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${isActive('/student/grades')
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <ChartBarIcon className={`
                w-5 h-5 mr-3 flex-shrink-0
                ${isActive('/student/grades') ? 'text-blue-500' : 'text-gray-400'}
              `} />
              <div className="text-left">
                <div className="font-medium">Recent Grades</div>
                <div className="text-xs text-gray-500">View your performance</div>
              </div>
            </button>

            {/* Study Modules */}
            <button
              onClick={() => handleNavigation('/student/study-modules')}
              className={`
                w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${isActive('/student/study-modules')
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <AcademicCapIcon className={`
                w-5 h-5 mr-3 flex-shrink-0
                ${isActive('/student/study-modules') ? 'text-blue-500' : 'text-gray-400'}
              `} />
              <div className="text-left">
                <div className="font-medium">Study Modules</div>
                <div className="text-xs text-gray-500">Interactive learning</div>
              </div>
            </button>
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 mt-auto">
            <button
              onClick={() => handleNavigation('/student/settings')}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 mb-2"
            >
              <Cog6ToothIcon className="w-5 h-5 mr-3 text-gray-400" />
              Settings
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;