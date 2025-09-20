'use client';

import React, { useState } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProfileEditor from '@/components/student/ProfileEditor';

const StudentProfilePage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

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
            <div className="text-xs text-[#333333]">
              ClassCast
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto p-6">
          {isEditing ? (
            <ProfileEditor
              profile={{
                id: user.id || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                avatar: user.avatar || '',
                bio: user.bio || '',
                careerGoals: user.careerGoals || '',
                classOf: user.classOf || '',
                funFact: user.funFact || '',
                favoriteSubject: user.favoriteSubject || '',
                hobbies: user.hobbies || '',
                location: user.location || '',
              }}
              onSave={(updatedProfile) => {
                setIsEditing(false);
                // TODO: Update user data in context
                console.log('Profile updated:', updatedProfile);
              }}
              onCancel={() => setIsEditing(false)}
              isOpen={true}
            />
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              {/* Profile Header */}
              <div className="bg-[#4A90E2] p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#4A90E2] font-bold text-2xl shadow-lg">
                      {user.firstName?.charAt(0) || 'S'}{user.lastName?.charAt(0) || ''}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {user.firstName} {user.lastName}
                      </h2>
                      <p className="text-white/80">{user.email}</p>
                      <p className="text-white/60 text-sm">Student</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-white text-[#4A90E2] rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>

              {/* Profile Details */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#333333] mb-4">Personal Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Favorite Subject</label>
                        <p className="text-[#333333]">{user.favoriteSubject || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Hobbies & Interests</label>
                        <p className="text-[#333333]">{user.hobbies || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-[#333333]">{user.email || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Fun Fact</label>
                        <p className="text-[#333333]">{user.funFact || 'No fun fact shared yet'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Academic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#333333] mb-4">Academic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Major</label>
                        <p className="text-[#333333]">{user.major || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Year</label>
                        <p className="text-[#333333]">{user.year || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Location</label>
                        <p className="text-[#333333]">{user.location || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                {user.bio && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-[#333333] mb-4">About Me</h3>
                    <p className="text-[#333333] leading-relaxed">{user.bio}</p>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-[#333333] mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button
                      onClick={() => router.push('/student/dashboard')}
                      className="p-4 bg-[#4A90E2] text-white rounded-lg hover:bg-[#3a7bc8] transition-colors text-center"
                    >
                      <div className="text-2xl mb-2">🏠</div>
                      <div className="font-medium">Dashboard</div>
                    </button>
                    <button
                      onClick={() => router.push('/student/submissions')}
                      className="p-4 bg-[#06D6A0] text-white rounded-lg hover:bg-[#05c191] transition-colors text-center"
                    >
                      <div className="text-2xl mb-2">📝</div>
                      <div className="font-medium">My Submissions</div>
                    </button>
                    <button
                      onClick={() => router.push('/messaging')}
                      className="p-4 bg-[#9B5DE5] text-white rounded-lg hover:bg-[#8a4fd1] transition-colors text-center"
                    >
                      <div className="text-2xl mb-2">💬</div>
                      <div className="font-medium">Messages</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentRoute>
  );
};

export default StudentProfilePage;
