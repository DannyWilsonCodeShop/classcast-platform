'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCircle, MessageCircle, FileText, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: 'graded' | 'peer_response' | 'new_assignment' | 'ungraded' | 'peer_review';
  title: string;
  message: string;
  url: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  senderName?: string;
}

interface NotificationBellProps {
  userId: string;
  userRole: 'student' | 'instructor';
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId, userRole, className = '' }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const popupRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load dismissed notifications from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`dismissed_notifications_${userId}`);
      if (stored) {
        setDismissedNotifications(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('Error loading dismissed notifications:', error);
    }
  }, [userId]);

  // Save dismissed notifications to localStorage
  const saveDismissedNotifications = (dismissed: Set<string>) => {
    try {
      localStorage.setItem(`dismissed_notifications_${userId}`, JSON.stringify(Array.from(dismissed)));
    } catch (error) {
      console.error('Error saving dismissed notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      // Add to dismissed set
      const newDismissed = new Set(dismissedNotifications);
      newDismissed.add(notificationId);
      setDismissedNotifications(newDismissed);
      saveDismissedNotifications(newDismissed);

      // Remove from current notifications
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Try to mark as read on server (if endpoint exists)
      try {
        await fetch(`/api/notifications/${notificationId}/read`, {
          method: 'PUT',
          credentials: 'include'
        });
      } catch (error) {
        // Silently fail if endpoint doesn't exist
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/notifications?userId=${userId}&role=${userRole}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter out dismissed notifications
          const filteredNotifications = (data.notifications || []).filter(
            (n: Notification) => !dismissedNotifications.has(n.id)
          );
          setNotifications(filteredNotifications);
          setLastFetch(Date.now());
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and periodic updates
  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [userId, userRole, dismissedNotifications]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'graded':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'peer_response':
      case 'peer_review':
        return <MessageCircle className="w-4 h-4 text-blue-600" />;
      case 'new_assignment':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'ungraded':
        return <Users className="w-4 h-4 text-orange-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if it's from the notifications table (has senderName)
    if (notification.senderName) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
    router.push(notification.url);
  };

  const hasNotifications = notifications.length > 0;
  const highPriorityCount = notifications.filter(n => n.priority === 'high').length;

  return (
    <div className={`relative ${className}`} ref={popupRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
        title="Notifications"
      >
        <Bell className="w-6 h-6" />
        
        {/* Notification Indicator */}
        {hasNotifications && (
          <div className="absolute -top-1 -right-1">
            <div className={`w-3 h-3 rounded-full ${
              highPriorityCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
            }`} />
            {notifications.length > 1 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-gray-800">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              </div>
            )}
          </div>
        )}
      </button>

      {/* Notification Popup */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications {hasNotifications && `(${notifications.length})`}
            </h3>
            <div className="flex items-center space-x-2">
              {hasNotifications && (
                <button
                  onClick={() => {
                    // Mark all as read
                    const newDismissed = new Set(dismissedNotifications);
                    notifications.forEach(n => newDismissed.add(n.id));
                    setDismissedNotifications(newDismissed);
                    saveDismissedNotifications(newDismissed);
                    setNotifications([]);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear All
                </button>
              )}
              {isLoading && (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No new notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-4 border-l-4 hover:bg-gray-50 transition-colors ${getPriorityColor(notification.priority)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      {notification.senderName && (
                        <p className="text-xs text-blue-600 mt-1">
                          From: {notification.senderName}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {hasNotifications && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push(userRole === 'student' ? '/student/notifications' : '/instructor/notifications');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
