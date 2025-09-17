'use client';

import React, { useState, useEffect } from 'react';
import { AdminRoute } from '@/components/auth/ProtectedRoute';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { UserManagement } from '@/components/admin/UserManagement';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { RoleManagement } from '@/components/admin/RoleManagement';

type AdminView = 'overview' | 'users' | 'settings' | 'analytics' | 'roles';

const AdminDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeView) {
      case 'overview':
        return <AdminOverview />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <SystemSettings />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'roles':
        return <RoleManagement />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <AdminSidebar 
          activeView={activeView}
          onViewChange={setActiveView}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <div className="lg:pl-64">
          {/* Header */}
          <AdminHeader 
            onMenuClick={() => setSidebarOpen(true)}
            currentView={activeView}
          />

          {/* Page Content */}
          <main className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {renderActiveView()}
            </div>
          </main>
        </div>
      </div>
    </AdminRoute>
  );
};

export default AdminDashboard;
