'use client';

import React, { useState, useEffect } from 'react';
import { NotificationPreferences as NotificationPrefs } from '@/lib/notificationPreferences';

interface NotificationPreferencesProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  userId,
  isOpen,
  onClose,
}) => {
  const [preferences, setPreferences] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadPreferences();
    }
  }, [isOpen, userId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notification-preferences?userId=${userId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreferences(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setMessage({ type: 'error', text: 'Failed to load preferences' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          preferences,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreferences(data.data);
          setMessage({ type: 'success', text: 'Preferences saved successfully!' });
          setTimeout(() => setMessage(null), 3000);
        }
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (category: keyof NotificationPrefs['emailNotifications']) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      emailNotifications: {
        ...preferences.emailNotifications,
        [category]: !preferences.emailNotifications[category],
      },
    });
  };

  const handleUnsubscribeAll = async () => {
    if (!confirm('Are you sure you want to unsubscribe from all email notifications?')) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        credentials: 'include',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Unsubscribed from all notifications' });
        await loadPreferences();
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setMessage({ type: 'error', text: 'Failed to unsubscribe' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Notification Preferences</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading preferences...</p>
            </div>
          ) : preferences ? (
            <>
              {/* Email Notifications */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Email Notifications</h3>
                <div className="space-y-3">
                  {[
                    { key: 'newAssignments' as const, label: '📚 New Assignments', desc: 'Get notified when instructors post new assignments' },
                    { key: 'gradedAssignments' as const, label: '✅ Graded Assignments', desc: 'Receive notifications when your work is graded' },
                    { key: 'peerFeedback' as const, label: '💬 Peer Feedback', desc: 'Get notified when peers comment on your videos' },
                    { key: 'courseAnnouncements' as const, label: '📢 Course Announcements', desc: 'Receive important course updates' },
                    { key: 'discussionReplies' as const, label: '💭 Discussion Replies', desc: 'Get notified when someone replies to you' },
                    { key: 'upcomingDeadlines' as const, label: '⏰ Upcoming Deadlines', desc: 'Reminders for assignment due dates' },
                  ].map(({ key, label, desc }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{label}</div>
                        <div className="text-sm text-gray-600">{desc}</div>
                      </div>
                      <button
                        onClick={() => handleToggle(key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences.emailNotifications[key]
                            ? 'bg-blue-600'
                            : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.emailNotifications[key]
                              ? 'translate-x-6'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unsubscribe Status */}
              {preferences.isUnsubscribed && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ You are currently unsubscribed from all email notifications.
                    Enable individual notifications above to start receiving emails again.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
                <button
                  onClick={handleUnsubscribeAll}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                >
                  Unsubscribe from All
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Failed to load preferences</p>
              <button
                onClick={loadPreferences}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

