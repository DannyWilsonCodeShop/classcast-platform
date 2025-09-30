'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProfileData {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  careerGoals?: string;
  classOf?: string;
  funFact?: string;
  favoriteSubject?: string;
  hobbies?: string;
  schoolName?: string;
}

const StudentProfilePage: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editedProfile, setEditedProfile] = useState<ProfileData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add aggressive cache-busting on component mount
  useEffect(() => {
    // Clear ALL cached data immediately
    const clearAllCache = () => {
      // Clear localStorage completely
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear any cached data in memory
      if (window.caches) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      
      // Force a hard reload
      window.location.href = window.location.pathname + '?v=' + Date.now();
    };

    // Check if we need to clear cache
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('v')) {
      // We're in a refreshed state, continue normally
      return;
    }

    // Check for any base64 data anywhere
    const hasBase64Data = () => {
      // Check localStorage
      const storedAuthState = localStorage.getItem('authState');
      if (storedAuthState && storedAuthState.includes('data:image/')) {
        return true;
      }
      
      // Check if user object has base64 data
      if (user && user.avatar && user.avatar.startsWith('data:image/')) {
        return true;
      }
      
      return false;
    };

    if (hasBase64Data()) {
      clearAllCache();
      return;
    }
  }, [user]);

  // Simple profile initialization - only run once
  useEffect(() => {
    if (user && !profile) {
      // Aggressively clean up any base64 data
      const cleanUserData = (userData: any) => {
        if (userData.avatar && userData.avatar.startsWith('data:image/')) {
          userData.avatar = '';
        }
        return userData;
      };

      // Clean user object
      const cleanUser = cleanUserData({ ...user });
      
      // Clean localStorage
      const storedAuthState = localStorage.getItem('authState');
      if (storedAuthState) {
        try {
          const parsedState = JSON.parse(storedAuthState);
          if (parsedState.user) {
            parsedState.user = cleanUserData(parsedState.user);
            localStorage.setItem('authState', JSON.stringify(parsedState));
          }
        } catch (error) {
          console.error('Error cleaning localStorage:', error);
        }
      }

      const profileData: ProfileData = {
        id: cleanUser.id || '',
        firstName: cleanUser.firstName || '',
        lastName: cleanUser.lastName || '',
        email: cleanUser.email || '',
        avatar: cleanUser.avatar || '',
        bio: cleanUser.bio || '',
        careerGoals: cleanUser.careerGoals || '',
        classOf: cleanUser.classOf || '',
        funFact: cleanUser.funFact || '',
        favoriteSubject: cleanUser.favoriteSubject || '',
        hobbies: cleanUser.hobbies || '',
        schoolName: cleanUser.schoolName || ''
      };
      
      setProfile(profileData);
      setEditedProfile(profileData);
    }
  }, [user, profile]);

  // Handle input changes
  const handleInputChange = (field: keyof ProfileData, value: string) => {
    if (!editedProfile) return;
    
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        avatar: 'Image size must be less than 5MB'
      }));
      return;
    }

    // Convert to base64 and update immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      setEditedProfile(prev => ({
        ...prev,
        avatar: base64Data
      }));
      setErrors(prev => ({ ...prev, avatar: '' }));
    };
    
    reader.readAsDataURL(file);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editedProfile?.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!editedProfile?.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!editedProfile?.email?.trim()) {
      newErrors.email = 'Email is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save profile
  const handleSave = async () => {
    if (!editedProfile || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      const isValid = validateForm();
      if (!isValid) {
        setIsLoading(false);
        return;
      }

      // Handle avatar upload if it's base64
      let finalAvatar = editedProfile.avatar;
      
      if (editedProfile.avatar && editedProfile.avatar.startsWith('data:image/')) {
        try {
          const base64Data = editedProfile.avatar.split(',')[1];
          const contentType = editedProfile.avatar.split(';')[0].split(':')[1];
          const fileExtension = contentType.split('/')[1] || 'jpg';
          const fileName = `avatar_${user.id}_${Date.now()}.${fileExtension}`;
          
          // Convert base64 to blob
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: contentType });

          // Get presigned URL
          const presignedResponse = await fetch('/api/upload/presigned', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName,
              fileType: contentType,
              folder: 'profile-pictures',
              userId: user.id
            })
          });

          if (presignedResponse.ok) {
            const presignedData = await presignedResponse.json();
            
            // Upload to S3
            const directUpload = await fetch(presignedData.presignedUrl, {
              method: 'PUT',
              body: blob,
              headers: { 'Content-Type': contentType }
            });

            if (directUpload.ok) {
              finalAvatar = presignedData.fileUrl;
            } else {
              finalAvatar = '';
            }
          } else {
            finalAvatar = '';
          }
        } catch (error) {
          console.error('Avatar upload failed:', error);
          finalAvatar = '';
        }
      }

      // Save profile data
      const response = await fetch('/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          ...editedProfile,
          avatar: finalAvatar
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      const result = await response.json();

      if (result.user) {
        // Update user in AuthContext
        updateUser(result.user);
        
        // Update local state
        const updatedProfile = {
          ...editedProfile,
          avatar: finalAvatar
        };
        setProfile(updatedProfile);
        setEditedProfile(updatedProfile);
        setIsEditing(false);
      }

    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditedProfile(profile);
    setErrors({});
    setIsEditing(false);
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
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/student/dashboard"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Back to Dashboard"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-[#333333]">Profile</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors text-sm"
                title="Clear all cached data"
              >
                Clear Cache
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-6">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-[#4A90E2] to-[#357ABD] p-6 text-white">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {/* Avatar Display */}
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white/20 flex items-center justify-center">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={`${profile.firstName} ${profile.lastName}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Hide image and show initials if it fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full items-center justify-center ${profile.avatar ? 'hidden' : 'flex'}`}
                      style={{ display: profile.avatar ? 'none' : 'flex' }}
                    >
                      <span className="text-3xl font-bold text-white">
                        {profile.firstName?.charAt(0) || profile.lastName?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <p className="text-white/90 text-lg">{profile.email}</p>
                  <p className="text-white/80">{profile.schoolName || 'Student'}</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors font-medium"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">About Me</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Bio</label>
                      <p className="text-gray-800 mt-1">{profile.bio || 'No bio provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Career Goals</label>
                      <p className="text-gray-800 mt-1">{profile.careerGoals || 'No career goals provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fun Fact</label>
                      <p className="text-gray-800 mt-1">{profile.funFact || 'No fun fact provided'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Academic Info</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Class of</label>
                      <p className="text-gray-800 mt-1">{profile.classOf || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Favorite Subject</label>
                      <p className="text-gray-800 mt-1">{profile.favoriteSubject || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Hobbies</label>
                      <p className="text-gray-800 mt-1">{profile.hobbies || 'No hobbies listed'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Modal */}
          {isEditing && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-800">Edit Profile</h3>
                    <button
                      onClick={handleCancel}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-gray-200">
                        {editedProfile?.avatar ? (
                          <img
                            src={editedProfile.avatar}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-full h-full bg-gray-200 items-center justify-center ${editedProfile?.avatar ? 'hidden' : 'flex'}`}
                          style={{ display: editedProfile?.avatar ? 'none' : 'flex' }}
                        >
                          <span className="text-2xl font-bold text-gray-500">
                            {editedProfile?.firstName?.charAt(0) || editedProfile?.lastName?.charAt(0) || 'U'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        disabled={isUploading}
                        className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Profile Picture</h4>
                      <p className="text-sm text-gray-600">Click the + button to upload a new photo</p>
                      {errors.avatar && (
                        <p className="text-red-500 text-sm mt-1">{errors.avatar}</p>
                      )}
                    </div>
                  </div>

                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={editedProfile?.firstName || ''}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your first name"
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={editedProfile?.lastName || ''}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your last name"
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={editedProfile?.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={editedProfile?.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tell us about yourself"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Career Goals
                    </label>
                    <textarea
                      value={editedProfile?.careerGoals || ''}
                      onChange={(e) => handleInputChange('careerGoals', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="What are your career aspirations?"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Class of
                      </label>
                      <input
                        type="text"
                        value={editedProfile?.classOf || ''}
                        onChange={(e) => handleInputChange('classOf', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 2025"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Favorite Subject
                      </label>
                      <input
                        type="text"
                        value={editedProfile?.favoriteSubject || ''}
                        onChange={(e) => handleInputChange('favoriteSubject', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Mathematics"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hobbies
                    </label>
                    <input
                      type="text"
                      value={editedProfile?.hobbies || ''}
                      onChange={(e) => handleInputChange('hobbies', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Reading, Sports, Music"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fun Fact
                    </label>
                    <input
                      type="text"
                      value={editedProfile?.funFact || ''}
                      onChange={(e) => handleInputChange('funFact', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Share something interesting about yourself"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-6 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
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