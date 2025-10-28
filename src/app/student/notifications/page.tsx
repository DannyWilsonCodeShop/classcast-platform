'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'mention' | 'assignment' | 'grade';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      
      if (data.success && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'mention':
        return '@';
      case 'assignment':
        return '📝';
      case 'grade':
        return '⭐';
      default:
        return '🔔';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'like':
        return 'from-red-400 to-pink-500';
      case 'comment':
        return 'from-blue-400 to-cyan-500';
      case 'assignment':
        return 'from-purple-400 to-indigo-500';
      case 'grade':
        return 'from-yellow-400 to-orange-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-r from-purple-100/80 via-blue-100/80 to-pink-100/80 backdrop-blur-sm border-b-2 border-purple-300/50 shadow-lg">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-3 p-2 hover:bg-purple-200/50 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-white">Notifications</h1>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-gradient-to-r from-purple-500 via-blue-500 to-pink-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-xl shadow-lg">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22c5.421 0 10-4.579 10-10h-2c0 4.337-3.663 8-8 8s-8-3.663-8-8c0-4.337 3.663-8 8-8V2C6.579 2 2 6.579 2 12c0 5.421 4.579 10 10 10z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-sm text-gray-600">No new notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl p-4 shadow-lg border-l-4 ${
                    notification.read 
                      ? 'border-gray-300 opacity-75' 
                      : 'border-blue-500'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getColor(notification.type)} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <span className="text-2xl">{getIcon(notification.type)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatTimestamp(notification.timestamp)}</p>
                    </div>
                    {!notification.read && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentRoute>
  );
};

export default NotificationsPage;

