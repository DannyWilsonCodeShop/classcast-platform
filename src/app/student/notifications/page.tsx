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
    if (user?.id) loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${user?.id}&role=${user?.role || 'student'}`);
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
      case 'like': return <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>;
      case 'comment': return <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" /></svg>;
      case 'assignment': return <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
      case 'grade': return <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
      default: return <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'like': return 'bg-red-400';
      case 'comment': return 'bg-[#005587]';
      case 'assignment': return 'bg-purple-500';
      case 'grade': return 'bg-[#FFC72C]';
      default: return 'bg-gray-400';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <StudentRoute>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;700&display=swap" rel="stylesheet" />
      <div className="h-full flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-3 py-2.5 border-b border-gray-100 shrink-0">
          <button onClick={() => router.back()} className="p-1.5 -ml-1 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 mx-2">
            <h1 className="text-base font-bold uppercase text-[#005587] tracking-normal" style={{ fontFamily: "'Oswald', sans-serif" }}>Notifications</h1>
          </div>
          {unreadCount > 0 && (
            <span className="text-[10px] bg-[#005587] text-white px-2 py-0.5 rounded-full font-medium">{unreadCount} new</span>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
          {loading ? (
            <div className="space-y-3 pt-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-start gap-3 p-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                    <div className="h-2.5 w-48 bg-gray-50 rounded animate-pulse mt-2" />
                    <div className="h-2 w-16 bg-gray-50 rounded animate-pulse mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">All Caught Up!</h3>
              <p className="text-xs text-gray-400">No new notifications</p>
            </div>
          ) : (
            <div className="space-y-1.5 pt-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => notification.link && router.push(notification.link)}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                    notification.read ? 'bg-white' : 'bg-blue-50/50'
                  } ${notification.link ? 'cursor-pointer active:bg-gray-50' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-full ${getIconBg(notification.type)} flex items-center justify-center shrink-0`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 leading-tight">{notification.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
                    <p className="text-[10px] text-gray-300 mt-1">{formatTimestamp(notification.timestamp)}</p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-[#005587] rounded-full shrink-0 mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Nav */}
        <nav className="shrink-0 bg-white border-t border-gray-200 px-2 py-2 native-bottom-nav">
          <div className="flex items-center justify-around">
            <button className="flex flex-col items-center" onClick={() => router.push('/student/dashboard')}>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="text-[10px] text-gray-400 mt-0.5">Home</span>
            </button>
            <button className="flex flex-col items-center" onClick={() => router.push('/student/assignments')}>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <span className="text-[10px] text-gray-400 mt-0.5">Assignments</span>
            </button>
            <button className="-mt-6" onClick={() => router.push('/student/record')}>
              <div className="w-14 h-14 bg-gradient-to-br from-[#005587] to-[#0088cc] rounded-full flex items-center justify-center shadow-xl border-4 border-white ring-2 ring-[#FFC72C]">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              </div>
            </button>
            <button className="flex flex-col items-center">
              <svg className="w-6 h-6 text-[#005587]" fill="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="text-[10px] text-[#005587] font-medium mt-0.5">Alerts</span>
            </button>
            <button className="flex flex-col items-center" onClick={() => router.push('/student/profile')}>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <span className="text-[10px] text-gray-400 mt-0.5">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </StudentRoute>
  );
};

export default NotificationsPage;
