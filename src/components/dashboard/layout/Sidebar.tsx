'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/common/Avatar';
import {
  HomeIcon,
  BookOpenIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/student/dashboard',
      icon: HomeIcon,
      description: 'Overview & progress'
    },
    {
      name: 'Study Modules',
      href: '/student/study-modules',
      icon: AcademicCapIcon,
      description: 'Interactive learning'
    },
    {
      name: 'My Courses',
      href: '/student/courses',
      icon: BookOpenIcon,
      description: 'All enrolled courses'
    },
    {
      name: 'Assignments',
      href: '/student/assignments',
      icon: ClipboardDocumentListIcon,
      description: 'Tasks & submissions'
    },
    {
      name: 'Videos',
      href: '/student/videos',
      icon: VideoCameraIcon,
      description: 'Video library'
    },
    {
      name: 'Discussions',
      href: '/student/discussions',
      icon: ChatBubbleLeftRightIcon,
      description: 'Class discussions'
    },
    {
      name: 'Peer Reviews',
      href: '/student/peer-reviews',
      icon: UserGroupIcon,
      description: 'Review classmates'
    },
    {
      name: 'Grades',
      href: '/student/submissions',
      icon: ChartBarIcon,
      description: 'Performance & grades'
    },
    {
      name: 'Notifications',
      href: '/student/notifications',
      icon: BellIcon,
      description: 'Updates & alerts'
    }
  ];

  const quickActions = [
    {
      name: 'Submit Assignment',
      href: '/student/upload',
      icon: AcademicCapIcon,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'Join Discussion',
      href: '/student/community',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-green-500 hover:bg-green-600'
    }
  ];

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
        {/* Header */}
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
          {/* User Profile */}
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
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
                <div className="flex items-center mt-1">
                  <StarIcon className="w-3 h-3 text-yellow-400 mr-1" />
                  <span className="text-xs text-gray-500">Level 2 Learner</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <button
                  key={action.name}
                  onClick={() => handleNavigation(action.href)}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm font-medium text-white rounded-lg
                    ${action.color} transition-colors
                  `}
                >
                  <action.icon className="w-4 h-4 mr-2" />
                  {action.name}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-6 space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Navigation
            </h3>
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isActive(item.href)
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <item.icon className={`
                  w-5 h-5 mr-3 flex-shrink-0
                  ${isActive(item.href) ? 'text-blue-500' : 'text-gray-400'}
                `} />
                <div className="text-left">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 mt-auto">
            <button
              onClick={() => handleNavigation('/student/profile')}
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