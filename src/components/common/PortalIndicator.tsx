'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

interface PortalIndicatorProps {
  className?: string;
}

const PortalIndicator: React.FC<PortalIndicatorProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  // Determine portal type based on pathname
  const getPortalInfo = () => {
    if (pathname.startsWith('/admin')) {
      return {
        type: 'admin',
        label: 'Admin Portal',
        icon: '👑',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        description: 'System Administration'
      };
    } else if (pathname.startsWith('/instructor')) {
      return {
        type: 'instructor',
        label: 'Instructor Portal',
        icon: '🎓',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        description: 'Teaching Dashboard'
      };
    } else if (pathname.startsWith('/student')) {
      return {
        type: 'student',
        label: 'Student Portal',
        icon: '📚',
        color: 'bg-green-100 text-green-800 border-green-200',
        description: 'Learning Dashboard'
      };
    } else {
      // Default based on user role
      switch (user.role) {
        case 'admin':
          return {
            type: 'admin',
            label: 'Admin Portal',
            icon: '👑',
            color: 'bg-purple-100 text-purple-800 border-purple-200',
            description: 'System Administration'
          };
        case 'instructor':
          return {
            type: 'instructor',
            label: 'Instructor Portal',
            icon: '🎓',
            color: 'bg-blue-100 text-blue-800 border-blue-200',
            description: 'Teaching Dashboard'
          };
        case 'student':
        default:
          return {
            type: 'student',
            label: 'Student Portal',
            icon: '📚',
            color: 'bg-green-100 text-green-800 border-green-200',
            description: 'Learning Dashboard'
          };
      }
    }
  };

  const portalInfo = getPortalInfo();

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border text-sm font-medium ${portalInfo.color} ${className}`}>
      <span className="text-lg" role="img" aria-label={portalInfo.type}>
        {portalInfo.icon}
      </span>
      <div className="flex flex-col">
        <span className="font-semibold">{portalInfo.label}</span>
        <span className="text-xs opacity-75">{portalInfo.description}</span>
      </div>
    </div>
  );
};

export default PortalIndicator;
