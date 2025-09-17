'use client';

import React, { useState, useEffect } from 'react';
import { apiHelpers } from '@/lib/apiConfig';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalAssignments: number;
  totalSubmissions: number;
  totalCourses: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalAssignments: 0,
    totalSubmissions: 0,
    totalCourses: 0,
    systemHealth: 'healthy'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      setLoading(true);
      
      // Load data from API
      const [usersResponse, assignmentsResponse, submissionsResponse, coursesResponse] = await Promise.all([
        apiHelpers.getUserRoles(),
        apiHelpers.getAssignments(),
        apiHelpers.getSubmissions(),
        // Add courses API call when available
        Promise.resolve({ data: { courses: [] } })
      ]);

      setStats({
        totalUsers: usersResponse.data?.count || 0,
        activeUsers: usersResponse.data?.count || 0, // Simplified for now
        totalAssignments: assignmentsResponse.data?.count || 0,
        totalSubmissions: submissionsResponse.data?.count || 0,
        totalCourses: coursesResponse.data?.courses?.length || 0,
        systemHealth: 'healthy'
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
      setStats(prev => ({ ...prev, systemHealth: 'warning' }));
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: '👥',
      color: 'blue',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: '🟢',
      color: 'green',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Total Assignments',
      value: stats.totalAssignments,
      icon: '📝',
      color: 'purple',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Total Submissions',
      value: stats.totalSubmissions,
      icon: '📤',
      color: 'orange',
      change: '+23%',
      changeType: 'positive'
    },
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      icon: '📚',
      color: 'indigo',
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: 'System Health',
      value: stats.systemHealth,
      icon: stats.systemHealth === 'healthy' ? '✅' : '⚠️',
      color: stats.systemHealth === 'healthy' ? 'green' : 'yellow',
      change: '99.9%',
      changeType: 'positive'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'user_signup',
      message: 'New user registered: john.doe@example.com',
      timestamp: '2 minutes ago',
      icon: '👤'
    },
    {
      id: 2,
      type: 'assignment_created',
      message: 'Assignment "Math Quiz 3" created by Dr. Smith',
      timestamp: '15 minutes ago',
      icon: '📝'
    },
    {
      id: 3,
      type: 'submission_graded',
      message: '15 submissions graded in "Physics Lab Report"',
      timestamp: '1 hour ago',
      icon: '📊'
    },
    {
      id: 4,
      type: 'system_alert',
      message: 'High server load detected - monitoring',
      timestamp: '2 hours ago',
      icon: '⚠️'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
        <p className="mt-1 text-sm text-gray-600">
          Monitor your ClassCast platform performance and user activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg bg-${card.color}-100`}>
                <span className="text-2xl">{card.icon}</span>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">
                    {typeof card.value === 'string' ? card.value : card.value.toLocaleString()}
                  </p>
                  <p className={`ml-2 text-sm font-medium text-${card.changeType === 'positive' ? 'green' : 'red'}-600`}>
                    {card.change}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-lg">{activity.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <div className="font-medium text-blue-900">Add New User</div>
                    <div className="text-sm text-blue-700">Create a new user account</div>
                  </div>
                </div>
              </button>
              
              <button className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <div className="font-medium text-green-900">Generate Report</div>
                    <div className="text-sm text-green-700">Create system analytics report</div>
                  </div>
                </div>
              </button>
              
              <button className="w-full text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⚙️</span>
                  <div>
                    <div className="font-medium text-purple-900">System Settings</div>
                    <div className="text-sm text-purple-700">Configure platform settings</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
