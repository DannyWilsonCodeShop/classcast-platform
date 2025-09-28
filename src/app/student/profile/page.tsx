'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProfileEditor from '@/components/student/ProfileEditor';
import { CameraIcon, UserIcon, PencilIcon } from '@heroicons/react/24/outline';

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  bio: string;
  careerGoals: string;
  classOf: string;
  funFact: string;
  favoriteSubject: string;
  hobbies: string;
  schoolName?: string;
}

const StudentProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize profile data from user context
  useEffect(() => {
    if (user) {
      setProfile({
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
        schoolName: user.schoolName || ''
      });
    }
  }, [user]);

  // Handle profile save
  const handleSaveProfile = async (updatedProfile: ProfileData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Saving profile:', updatedProfile);
      
      // Prepare profile data
      const profileDataToSave = { ...updatedProfile };
      
      // If avatar is still base64 data, we need to upload it to S3 first
      if (profileDataToSave.avatar && profileDataToSave.avatar.startsWith('data:image/')) {
        console.log('Avatar is base64 data, uploading to S3 first...');
        
        try {
          // Convert base64 to blob and upload
          const response = await fetch(profileDataToSave.avatar);
          const blob = await response.blob();
          const file = new File([blob], `avatar_${user.id}.jpg`, { type: 'image/jpeg' });
          
          // Upload using the upload API
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', 'profile-pictures');
          formData.append('userId', user.id);
          formData.append('metadata', JSON.stringify({
            fileType: 'avatar',
            uploadedAt: new Date().toISOString()
          }));

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            profileDataToSave.avatar = uploadResult.data.fileUrl;
            console.log('Avatar uploaded to S3:', profileDataToSave.avatar);
          } else {
            console.error('Avatar upload failed, skipping avatar save');
            delete profileDataToSave.avatar;
          }
        } catch (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          delete profileDataToSave.avatar;
        }
      }
      
      const response = await fetch('/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          ...profileDataToSave
        }),
      });

      console.log('Profile save response status:', response.status);
      console.log('Profile save response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = 'Failed to save profile';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Profile save result:', result);
      
      // Update local profile state
      setProfile(updatedProfile);
      setIsEditing(false);
      
      // Show success message
      alert('Profile updated successfully!');
      
    } catch (error) {
      console.error('Profile save error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !profile) {
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
                title="Back to Dashboard"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#4A90E2] rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {profile.firstName?.charAt(0) || 'S'}
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
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-6">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-[#4A90E2] to-[#357ABD] p-6 text-white">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={`${profile.firstName} ${profile.lastName}`}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white shadow-lg">
                      <UserIcon className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <p className="text-lg opacity-90">{profile.email}</p>
                  {profile.classOf && (
                    <p className="text-sm opacity-75">Class of {profile.classOf}</p>
                  )}
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <PencilIcon className="w-5 h-5" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Basic Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600">First Name</label>
                    <p className="text-gray-900">{profile.firstName}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Last Name</label>
                    <p className="text-gray-900">{profile.lastName}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{profile.email}</p>
                  </div>
                  
                  {profile.schoolName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">School</label>
                      <p className="text-gray-900">{profile.schoolName}</p>
                    </div>
                  )}
                </div>

                {/* Academic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Academic Information
                  </h3>
                  
                  {profile.favoriteSubject && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Favorite Subject</label>
                      <p className="text-gray-900">{profile.favoriteSubject}</p>
                    </div>
                  )}
                  
                  {profile.classOf && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Class of</label>
                      <p className="text-gray-900">{profile.classOf}</p>
                    </div>
                  )}
                  
                  {profile.careerGoals && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Career Goals</label>
                      <p className="text-gray-900">{profile.careerGoals}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              {(profile.bio || profile.hobbies || profile.funFact) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  
                  <div className="space-y-4">
                    {profile.bio && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Bio</label>
                        <p className="text-gray-900">{profile.bio}</p>
                      </div>
                    )}
                    
                    {profile.hobbies && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Hobbies & Interests</label>
                        <p className="text-gray-900">{profile.hobbies}</p>
                      </div>
                    )}
                    
                    {profile.funFact && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Fun Fact</label>
                        <p className="text-gray-900">{profile.funFact}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Profile Editor Modal */}
        {profile && (
          <ProfileEditor
            profile={profile}
            onSave={handleSaveProfile}
            onCancel={() => setIsEditing(false)}
            isOpen={isEditing}
          />
        )}
      </div>
    </StudentRoute>
  );
};

export default StudentProfilePage;