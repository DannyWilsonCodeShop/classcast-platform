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
    <div className="min-h-screen bg-gray-50">
      {/* Demo Mode Banner */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DemoModeBanner />
      </div>
      
      <div className="flex">
        {/* Sidebar - Fixed positioning for desktop, overlay for mobile */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <Sidebar isOpen={true} onClose={() => {}} />
        </div>
        
        {/* Mobile Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content - Account for sidebar width on desktop */}
        <div className="flex-1 lg:ml-64">
          {/* Top Bar */}
          <TopBar 
            onMenuClick={() => setSidebarOpen(true)}
            title={title}
            subtitle={subtitle}
          />
          
          {/* Page Content */}
          <main className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;