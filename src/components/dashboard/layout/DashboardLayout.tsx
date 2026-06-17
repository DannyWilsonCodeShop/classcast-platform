'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import DemoModeBanner from '@/components/common/DemoModeBanner';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  title = "Dashboard",
  subtitle = "Welcome back! Continue your learning journey"
}) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Blurred background image */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/pexels-yankrukov-8197532.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(10px)',
          transform: 'scale(1.05)',
        }}
      />
      {/* Semi-transparent overlay */}
      <div className="fixed inset-0 z-[1] bg-white/40" />

      {/* Demo Mode Banner */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DemoModeBanner />
      </div>
      
      <div className="relative z-10 flex">
        {/* Sidebar - Fixed positioning for desktop, overlay for mobile */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <Sidebar isOpen={true} onClose={() => {}} />
        </div>
        
        {/* Mobile Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content - Account for sidebar width on desktop */}
        <div className="flex-1 lg:ml-64 flex flex-col h-screen">
          {/* Top Bar - fixed */}
          <TopBar 
            onMenuClick={() => setSidebarOpen(true)}
            title={title}
            subtitle={subtitle}
          />
          
          {/* Page Content - fills remaining space, no page-level scroll on mobile */}
          <main className="flex-1 overflow-hidden px-2 sm:px-6 lg:px-8 py-1 lg:py-4 lg:overflow-y-auto lg:pb-6">
            <div className="max-w-7xl mx-auto h-full">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Fixed Bottom Navigation Bar - Mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-14 px-2">
          <a
            href="/student/assignments"
            className="flex flex-col items-center justify-center flex-1 py-1 text-[#005587] font-medium"
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-[10px]">Assignments</span>
          </a>
          <a
            href="/student/grades"
            className="flex flex-col items-center justify-center flex-1 py-1 text-gray-600 hover:text-[#005587]"
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-[10px]">Grades</span>
          </a>
          <a
            href="/student/study-modules"
            className="flex flex-col items-center justify-center flex-1 py-1 text-gray-600 hover:text-[#005587]"
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-[10px]">Modules</span>
          </a>
          <a
            href="/student/notifications"
            className="flex flex-col items-center justify-center flex-1 py-1 text-gray-600 hover:text-[#005587] relative"
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-0.5 right-1/4 block h-2 w-2 rounded-full bg-red-400"></span>
            <span className="text-[10px]">Alerts</span>
          </a>
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;