'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/common/Avatar';
import {
  Bars3Icon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface TopBarProps {
  onMenuClick: () => void;
  title: string;
  subtitle: string;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick, title, subtitle }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Left side - Logo (bigger) */}
            <div className="flex items-center">
              <img 
                src="/MyClassCast (800 x 200 px).png" 
                alt="MyClassCast" 
                className="h-10 w-auto object-contain lg:hidden cursor-pointer"
                onClick={() => router.push('/student/dashboard')}
              />

              {/* Page title - desktop only */}
              <div className="hidden lg:block">
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                <p className="text-xs text-gray-500">{subtitle}</p>
              </div>
            </div>

            {/* Right side - notification + hamburger */}
            <div className="flex items-center space-x-2">
              {/* Desktop actions */}
              <div className="hidden md:flex items-center space-x-2">
                <button
                  onClick={() => router.push('/student/messages')}
                  className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg"
                  title="Messages"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg relative"
                    title="Notifications"
                  >
                    <BellIcon className="w-5 h-5" />
                    <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        <div className="p-4 text-center text-gray-500">
                          <BellIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p>No new notifications</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* User avatar - desktop */}
                <button
                  onClick={() => router.push('/student/profile')}
                  className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Avatar user={user} size="sm" className="w-7 h-7" />
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                  </div>
                </button>
              </div>

              {/* Mobile: hamburger on the RIGHT */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                aria-label="Open menu"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu dropdown */}
      {showMobileMenu && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed top-0 right-0 z-50 w-72 h-full bg-white shadow-xl lg:hidden" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <span className="text-lg font-bold text-[#005587]">Menu</span>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              <button
                onClick={() => { router.push('/student/dashboard'); setShowMobileMenu(false); }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-[#005587] rounded-lg transition-colors"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                <span className="font-medium">Search</span>
              </button>
              <button
                onClick={() => { router.push('/student/dashboard'); setShowMobileMenu(false); }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-[#005587] rounded-lg transition-colors"
              >
                <AcademicCapIcon className="w-5 h-5" />
                <span className="font-medium">Courses</span>
              </button>
              <button
                onClick={() => { router.push('/student/profile'); setShowMobileMenu(false); }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-[#005587] rounded-lg transition-colors"
              >
                <UserCircleIcon className="w-5 h-5" />
                <span className="font-medium">Profile</span>
              </button>
              <button
                onClick={() => { router.push('/student/settings'); setShowMobileMenu(false); }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-[#005587] rounded-lg transition-colors"
              >
                <Cog6ToothIcon className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </button>
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default TopBar;
