'use client';

import React, { useState } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const StudentProfilePage: React.FC = () => {
  console.log('StudentProfilePage component starting - SIMPLE VERSION');
  
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  
  console.log('StudentProfilePage rendering, user:', user, 'isEditing:', isEditing);

  if (!user) {
    return (
      <StudentRoute>
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A90E2] mx-auto mb-4"></div>
            <p className="text-[#333333]">Loading profile...</p>
          </div>
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <div className="min-h-screen bg-[#F5F5F5]">
        {/* Header with Back Button */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-[#4A90E2]/20 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/student/dashboard"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                title="Back to Home"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#4A90E2] rounded-full flex items-center justify-center text-white font-bold text-lg">
                  👤
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#333333]">My Profile</h1>
                  <p className="text-xs text-[#333333]">View and edit your profile information</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <img
                src="/MyClassCast (800 x 200 px).png"
                alt="MyClassCast"
                className="h-6 w-auto object-contain"
              />
              <button
                onClick={logout}
                className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Simple Profile Test</h2>
              
              <button
                onClick={() => {
                  alert('Button clicked!');
                  console.log('Button clicked, setting isEditing to true');
                  setIsEditing(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-4"
              >
                Test Button
              </button>
              
              <p>isEditing state: {isEditing ? 'true' : 'false'}</p>
              
              {isEditing && (
                <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800">Edit Mode Active!</h3>
                  <p className="text-green-700">The button click worked and isEditing is now true.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentRoute>
  );
};

export default StudentProfilePage;