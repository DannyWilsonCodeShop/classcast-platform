'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MobileAdminSidebar from './MobileAdminSidebar';

interface AdminSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeView,
  onViewChange,
  isOpen,
  onClose
}) => {
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Overview',
      id: 'overview',
      icon: '📊',
      description: 'System overview and statistics'
    },
    {
      name: 'User Management',
      id: 'users',
      icon: '👥',
      description: 'Manage users and permissions'
    },
    {
      name: 'Role Management',
      id: 'roles',
      icon: '🔐',
      description: 'Configure roles and access levels'
    },
    {
      name: 'Analytics',
      id: 'analytics',
      icon: '📈',
      description: 'System analytics and reports'
    },
    {
      name: 'System Settings',
      id: 'settings',
      icon: '⚙️',
      description: 'Configure system settings'
    }
  ];

  return (
    <>
      {/* Mobile sidebar */}
      <MobileAdminSidebar
        activeView={activeView}
        onViewChange={onViewChange}
        isOpen={isOpen}
        onClose={onClose}
      />

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:shadow-lg">
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
              <p className="text-xs text-gray-500">ClassCast Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  onClose();
                }}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                  ${activeView === item.id
                    ? 'bg-red-50 text-red-700 border-r-2 border-red-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <span className="text-lg mr-3">{item.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                </div>
              </button>
            ))}
          </div>
        </nav>

        {/* Admin Status */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Admin Access</p>
              <p className="text-xs text-gray-500">Full permissions</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
