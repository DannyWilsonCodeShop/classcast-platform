'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDemoModeDisplay } from '@/lib/demo-mode-utils';
import { EyeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DemoModeBannerProps {
  className?: string;
}

export const DemoModeBanner: React.FC<DemoModeBannerProps> = ({ 
  className = '' 
}) => {
  const { user, logout } = useAuth();
  const demoDisplay = getDemoModeDisplay(user);

  if (!demoDisplay) return null;

  const handleExitDemo = async () => {
    await logout();
  };

  return (
    <div className={`${demoDisplay.bannerColor} border-l-4 p-4 mb-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <EyeIcon className="h-5 w-5 mr-2" />
          <div>
            <p className="font-medium">
              {demoDisplay.message}
            </p>
            <p className="text-sm opacity-75 mt-1">
              You are in read-only mode. No changes can be made.
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-sm">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            Read Only
          </div>
          
          <button
            onClick={handleExitDemo}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Exit Demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoModeBanner;