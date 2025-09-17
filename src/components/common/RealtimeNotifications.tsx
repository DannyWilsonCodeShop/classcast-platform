'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
}

export const RealtimeNotifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after duration
    const duration = notification.duration || 5000;
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, duration);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // WebSocket handlers
  const handleAssignmentCreated = (assignment: any) => {
    addNotification({
      type: 'info',
      title: 'New Assignment',
      message: `"${assignment.title}" has been posted for ${assignment.courseName}`,
      duration: 8000,
    });
  };

  const handleAssignmentUpdated = (assignment: any) => {
    addNotification({
      type: 'info',
      title: 'Assignment Updated',
      message: `"${assignment.title}" has been updated`,
      duration: 6000,
    });
  };

  const handleSubmissionGraded = (submission: any) => {
    addNotification({
      type: 'success',
      title: 'Grade Received',
      message: `You received ${submission.grade}/${submission.maxScore} (${submission.letterGrade}) for "${submission.assignmentTitle}"`,
      duration: 10000,
    });
  };

  const handleGradeUpdated = (submission: any) => {
    addNotification({
      type: 'info',
      title: 'Grade Updated',
      message: `Your grade for "${submission.assignmentTitle}" has been updated to ${submission.grade}/${submission.maxScore}`,
      duration: 8000,
    });
  };

  const handleAnnouncement = (announcement: any) => {
    addNotification({
      type: 'warning',
      title: 'Announcement',
      message: announcement.message || announcement.title,
      duration: 12000,
    });
  };

  // Initialize WebSocket connection
  useWebSocket({
    onAssignmentCreated: handleAssignmentCreated,
    onAssignmentUpdated: handleAssignmentUpdated,
    onSubmissionGraded: handleSubmissionGraded,
    onGradeUpdated: handleGradeUpdated,
    onAnnouncement: handleAnnouncement,
  });

  // Get notification icon based on type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Get notification background color based on type
  const getNotificationBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getNotificationBgColor(notification.type)} border rounded-lg p-4 shadow-lg transform transition-all duration-300 ease-in-out`}
          style={{
            animation: 'slideInRight 0.3s ease-out',
          }}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                {notification.title}
              </h4>
              <p className="mt-1 text-sm text-gray-600">
                {notification.message}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => removeNotification(notification.id)}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
