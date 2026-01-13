'use client';

import React, { useState } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/layout/DashboardLayout';
import DemoModeBanner from '@/components/common/DemoModeBanner';
import Avatar from '@/components/common/Avatar';
import { 
  UserIcon,
  BellIcon,
  EyeIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const StudentSettings: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    assignmentReminders: true,
    gradeNotifications: true,
    discussionUpdates: false
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'classmates',
    videoVisibility: 'course',
    allowStudyBuddyRequests: true
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePrivacyChange = (key: string, value: string | boolean) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <StudentRoute>
      <DemoModeBanner />
      <DashboardLayout 
        title="Settings" 
        subtitle="Manage your account preferences and privacy settings"
      >
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center space-x-6 mb-6">
                <Avatar 
                  user={user}
                  size="xl"
                  className="w-20 h-20"
                />
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h4>
                  <p className="text-gray-600">{user?.email}</p>
                  <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Change Profile Picture
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={user?.firstName || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={user?.lastName || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <BellIcon className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-600">Receive updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.emailNotifications}
                    onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
                  <p className="text-sm text-gray-600">Receive notifications on your device</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.pushNotifications}
                    onChange={(e) => handleNotificationChange('pushNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Assignment Reminders</h4>
                  <p className="text-sm text-gray-600">Get reminded about upcoming due dates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.assignmentReminders}
                    onChange={(e) => handleNotificationChange('assignmentReminders', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Grade Notifications</h4>
                  <p className="text-sm text-gray-600">Be notified when grades are posted</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.gradeNotifications}
                    onChange={(e) => handleNotificationChange('gradeNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Discussion Updates</h4>
                  <p className="text-sm text-gray-600">Get notified about new discussion posts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.discussionUpdates}
                    onChange={(e) => handleNotificationChange('discussionUpdates', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <EyeIcon className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Privacy Settings</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Profile Visibility</h4>
                <p className="text-sm text-gray-600 mb-3">Who can see your profile information</p>
                <select
                  value={privacy.profileVisibility}
                  onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="everyone">Everyone</option>
                  <option value="classmates">Classmates Only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Video Visibility</h4>
                <p className="text-sm text-gray-600 mb-3">Who can see your video submissions</p>
                <select
                  value={privacy.videoVisibility}
                  onChange={(e) => handlePrivacyChange('videoVisibility', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="public">Public</option>
                  <option value="course">Course Members Only</option>
                  <option value="instructor">Instructor Only</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Study Buddy Requests</h4>
                  <p className="text-sm text-gray-600">Allow other students to send you study buddy requests</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacy.allowStudyBuddyRequests}
                    onChange={(e) => handlePrivacyChange('allowStudyBuddyRequests', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Save Changes
            </button>
          </div>
        </div>
      </DashboardLayout>
    </StudentRoute>
  );
};

export default StudentSettings;