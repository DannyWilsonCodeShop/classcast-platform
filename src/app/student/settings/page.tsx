'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    assignmentReminders: true,
    gradeNotifications: true,
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'classmates',
    videoVisibility: 'course',
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handlePrivacyChange = (key: string, value: string) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
  };

  return (
    <StudentRoute>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;700&display=swap" rel="stylesheet" />
      <div className="h-full flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-3 py-2.5 border-b border-gray-100 shrink-0">
          <button onClick={() => router.push('/student/dashboard')} className="p-1.5 -ml-1 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="flex-1 text-base font-bold uppercase text-[#005587] mx-2 tracking-normal" style={{ fontFamily: "'Oswald', sans-serif" }}>Settings</h1>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
          {/* Notifications Section */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-normal mb-3">Notifications</h2>
            <div className="space-y-0 border border-gray-100 rounded-xl overflow-hidden">
              {/* Email Notifications */}
              <div className="flex items-center justify-between px-3 py-3 border-b border-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                  <p className="text-xs text-gray-500">Receive updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={notifications.emailNotifications}
                    onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#005587]" style={{ width: 40, height: 22 }}>
                    <div className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white border border-gray-300 transition-transform ${notifications.emailNotifications ? 'translate-x-[18px]' : ''}`} />
                  </div>
                </label>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between px-3 py-3 border-b border-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                  <p className="text-xs text-gray-500">Receive on your device</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={notifications.pushNotifications}
                    onChange={(e) => handleNotificationChange('pushNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#005587]" style={{ width: 40, height: 22 }}>
                    <div className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white border border-gray-300 transition-transform ${notifications.pushNotifications ? 'translate-x-[18px]' : ''}`} />
                  </div>
                </label>
              </div>

              {/* Assignment Reminders */}
              <div className="flex items-center justify-between px-3 py-3 border-b border-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">Assignment Reminders</p>
                  <p className="text-xs text-gray-500">Upcoming due dates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={notifications.assignmentReminders}
                    onChange={(e) => handleNotificationChange('assignmentReminders', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#005587]" style={{ width: 40, height: 22 }}>
                    <div className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white border border-gray-300 transition-transform ${notifications.assignmentReminders ? 'translate-x-[18px]' : ''}`} />
                  </div>
                </label>
              </div>

              {/* Grade Notifications */}
              <div className="flex items-center justify-between px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Grade Notifications</p>
                  <p className="text-xs text-gray-500">When grades are posted</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={notifications.gradeNotifications}
                    onChange={(e) => handleNotificationChange('gradeNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#005587]" style={{ width: 40, height: 22 }}>
                    <div className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white border border-gray-300 transition-transform ${notifications.gradeNotifications ? 'translate-x-[18px]' : ''}`} />
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-normal mb-3">Privacy</h2>
            <div className="space-y-0 border border-gray-100 rounded-xl overflow-hidden">
              {/* Profile Visibility */}
              <div className="px-3 py-3 border-b border-gray-50">
                <p className="text-sm font-medium text-gray-900 mb-1">Profile Visibility</p>
                <p className="text-xs text-gray-500 mb-2">Who can see your profile</p>
                <select
                  value={privacy.profileVisibility}
                  onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#005587] focus:border-transparent"
                >
                  <option value="everyone">Everyone</option>
                  <option value="classmates">Classmates Only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              {/* Video Visibility */}
              <div className="px-3 py-3">
                <p className="text-sm font-medium text-gray-900 mb-1">Video Visibility</p>
                <p className="text-xs text-gray-500 mb-2">Who can see your submissions</p>
                <select
                  value={privacy.videoVisibility}
                  onChange={(e) => handlePrivacyChange('videoVisibility', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#005587] focus:border-transparent"
                >
                  <option value="public">Public</option>
                  <option value="course">Course Members Only</option>
                  <option value="instructor">Instructor Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Account info */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-normal mb-3">Account</h2>
            <div className="border border-gray-100 rounded-xl px-3 py-3">
              <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Bottom Nav - 3 buttons: Home | Courses | Profile */}
        <nav className="shrink-0 bg-white border-t border-gray-200 px-2 py-2">
          <div className="flex items-center justify-around">
            <button className="flex flex-col items-center" onClick={() => router.push('/student/dashboard')}>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="text-[10px] text-gray-400 mt-0.5">Home</span>
            </button>
            <button className="flex flex-col items-center" onClick={() => router.push('/student/courses')}>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              <span className="text-[10px] text-gray-400 mt-0.5">Courses</span>
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
}
