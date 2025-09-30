'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CameraIcon, UserIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

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

  // Initialize profile data from user context
  useEffect(() => {
    console.log('useEffect triggered - user:', user, 'profile:', profile);
    if (user && !profile) {
      console.log('Initializing profile from user context');
      
      // Clean up any old base64 data from user avatar, but preserve S3 URLs
      let cleanAvatar = user.avatar || '';
      if (cleanAvatar && cleanAvatar.startsWith('data:image/')) {
        console.log('Found base64 avatar in user context, clearing it');
        cleanAvatar = '';
        
        // Also clean up localStorage
        const storedAuthState = localStorage.getItem('authState');
        if (storedAuthState) {
          try {
            const parsedState = JSON.parse(storedAuthState);
            if (parsedState.user && parsedState.user.avatar && parsedState.user.avatar.startsWith('data:image/')) {
              console.log('Cleaning base64 avatar from localStorage');
              parsedState.user.avatar = '';
              localStorage.setItem('authState', JSON.stringify(parsedState));
            }
          } catch (error) {
            console.error('Error cleaning localStorage:', error);
          }
        }
      } else if (cleanAvatar && cleanAvatar.startsWith('https://')) {
        console.log('Found S3 URL avatar in user context, keeping it');
      }
      
      const profileData = {
        id: user.id || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        avatar: cleanAvatar,
        bio: user.bio || '',
        careerGoals: user.careerGoals || '',
        classOf: user.classOf || '',
        funFact: user.funFact || '',
        favoriteSubject: user.favoriteSubject || '',
        hobbies: user.hobbies || '',
        schoolName: user.schoolName || ''
      };
      console.log('Profile data from user context:', profileData);
      console.log('User avatar:', user.avatar);
      console.log('Clean avatar:', cleanAvatar);
      setProfile(profileData);
      setEditedProfile(profileData);
    } else if (user && profile) {
      console.log('Profile already exists, skipping initialization');
    }
  }, [user]);

  // Handle user context updates (e.g., after profile save)
  useEffect(() => {
    if (user && profile) {
      console.log('User context updated, syncing profile state');
      console.log('User avatar:', user.avatar);
      console.log('Profile avatar:', profile.avatar);
      
      // Only update if the avatar has changed and it's a valid S3 URL
      if (user.avatar && user.avatar.startsWith('https://') && user.avatar !== profile.avatar) {
        console.log('Updating profile with new user avatar');
        const updatedProfile = {
          ...profile,
          avatar: user.avatar
        };
        setProfile(updatedProfile);
        setEditedProfile(updatedProfile);
      }
    } else if (user && !profile) {
      console.log('Profile is null but user exists, reinitializing...');
      // Reinitialize profile if it got reset to null
      const profileData = {
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
      };
      setProfile(profileData);
      setEditedProfile(profileData);
    }
  }, [user?.avatar, user, profile]);

  // Track profile state changes
  useEffect(() => {
    console.log('Profile state changed:', profile);
    if (profile?.avatar) {
      console.log('Profile avatar:', profile.avatar);
      console.log('Profile avatar type:', typeof profile.avatar);
      console.log('Profile avatar starts with data:', profile.avatar.startsWith('data:'));
      console.log('Profile avatar starts with https:', profile.avatar.startsWith('https:'));
    }
  }, [profile]);

  // Track editedProfile state changes
  useEffect(() => {
    console.log('EditedProfile state changed:', editedProfile);
    if (editedProfile?.avatar) {
      console.log('EditedProfile avatar:', editedProfile.avatar);
      console.log('EditedProfile avatar type:', typeof editedProfile.avatar);
      console.log('EditedProfile avatar starts with data:', editedProfile.avatar.startsWith('data:'));
      console.log('EditedProfile avatar starts with https:', editedProfile.avatar.startsWith('https:'));
    }
  }, [editedProfile]);

  // Note: Removed server-side profile refresh to avoid 404 errors
  // Profile data will be refreshed from AuthContext localStorage

  // Handle input changes
  const handleInputChange = (field: keyof ProfileData, value: string) => {
    if (!editedProfile) return;
    
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editedProfile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({
        ...prev,
        avatar: 'Please select a valid image file (JPG, PNG, GIF, or WebP)'
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        avatar: 'Image size must be less than 5MB'
      }));
      return;
    }

    // Convert file to base64 immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      console.log('Avatar converted to base64, length:', base64Data.length);
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
    if (!editedProfile) return false;
    
    const newErrors: Record<string, string> = {};

    if (!editedProfile.favoriteSubject?.trim()) {
      newErrors.favoriteSubject = 'Favorite subject is required';
    }

    if (!editedProfile.hobbies?.trim()) {
      newErrors.hobbies = 'Hobbies and interests are required';
    }

    if (!editedProfile.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedProfile.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!editedProfile.careerGoals?.trim()) {
      newErrors.careerGoals = 'Career goals are required';
    }

    if (!editedProfile.classOf?.trim()) {
      newErrors.classOf = 'Class of is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    if (!editedProfile || !user) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const isValid = validateForm();
      if (!isValid) {
        setIsLoading(false);
        return;
      }

      // Clean up any blob URLs before saving
      const cleanProfile = { ...editedProfile };
      if (cleanProfile.avatar && cleanProfile.avatar.startsWith('blob:')) {
        console.log('Removing blob URL from profile data');
        cleanProfile.avatar = '';
      }

      // Handle base64 avatars by uploading directly to S3
      if (cleanProfile.avatar && cleanProfile.avatar.startsWith('data:image/')) {
        console.log('Avatar is base64, uploading directly to S3...');
        try {
          const base64Data = cleanProfile.avatar.split(',')[1];
          const contentType = cleanProfile.avatar.split(';')[0].split(':')[1];
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

          console.log('Uploading avatar to S3:', { fileName, contentType, size: blob.size });

          // Use direct S3 upload with presigned URL (now that CORS is configured)
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
            console.log('Got presigned URL, uploading directly to S3...');
            
            const directUpload = await fetch(presignedData.presignedUrl, {
              method: 'PUT',
              body: blob,
              headers: { 'Content-Type': contentType }
            });

            if (directUpload.ok) {
              console.log('Direct S3 upload successful:', presignedData.fileUrl);
              cleanProfile.avatar = presignedData.fileUrl;
            } else {
              console.log('Direct S3 upload failed with status:', directUpload.status);
              cleanProfile.avatar = '';
            }
          } else {
            console.log('Failed to get presigned URL');
            cleanProfile.avatar = '';
          }
        } catch (error) {
          console.error('Avatar upload failed:', error);
          // If upload fails, clear avatar and continue without it
          cleanProfile.avatar = '';
        }
      }

      console.log('Saving profile:', cleanProfile);
      console.log('Avatar type:', typeof cleanProfile.avatar);
      console.log('Avatar starts with data:', cleanProfile.avatar?.startsWith('data:'));
      
      console.log('Sending profile save request...');
      
      const response = await fetch('/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          ...cleanProfile
        }),
      });

      console.log('Profile save response status:', response.status);
      console.log('Profile save response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = 'Failed to save profile';
        try {
          const errorText = await response.text();
          console.log('Error response text:', errorText);
          
          // Try to parse as JSON
          try {
            const errorData = JSON.parse(errorText);
            console.log('Error response data:', errorData);
            errorMessage = errorData.error?.message || errorData.message || errorMessage;
          } catch (jsonError) {
            console.log('Error response is not JSON:', errorText);
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (parseError) {
          console.log('Failed to parse error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Profile save result:', result);
      console.log('Result user data:', result.user);

      // Update local profile state with server response
      if (result.user) {
        console.log('Updating profile with result.user:', result.user);
        console.log('Result user avatar:', result.user.avatar);
        console.log('Result user avatar type:', typeof result.user.avatar);
        console.log('Result user avatar starts with data:', result.user.avatar?.startsWith('data:'));
        console.log('Result user avatar starts with https:', result.user.avatar?.startsWith('https:'));
        
        // Add cache-busting parameter to force image reload
        const updatedUser = {
          ...result.user,
          avatar: result.user.avatar ? `${result.user.avatar}?t=${Date.now()}` : result.user.avatar
        };
        
        // Update the user in AuthContext first
        console.log('Calling updateUser with:', updatedUser);
        updateUser(updatedUser);
        
        // Then update local profile states
        setProfile(updatedUser);
        setEditedProfile(updatedUser); // Also update editedProfile with the S3 URL
        setIsEditing(false);
        
        // Verify the profile state after update
        console.log('Profile state immediately after setProfile:', updatedUser);
      } else {
        console.log('No result.user found in response');
      }

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
                  {profile.avatar && (profile.avatar.startsWith('https://') || profile.avatar.startsWith('data:')) ? (
                    <img
                      key={profile.avatar} // Force re-render when avatar changes
                      src={profile.avatar}
                      alt={`${profile.firstName} ${profile.lastName}`}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-3xl font-bold text-white">
                        {profile.firstName?.charAt(0) || profile.lastName?.charAt(0) || 'U'}
                      </span>
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

        {/* Edit Profile Modal */}
        {isEditing && editedProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-gray-200">
                      {editedProfile.avatar && (editedProfile.avatar.startsWith('https://') || editedProfile.avatar.startsWith('data:')) ? (
                        <img
                          key={editedProfile.avatar} // Force re-render when avatar changes
                          src={editedProfile.avatar}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-2xl font-bold text-gray-500">
                            {editedProfile.firstName?.charAt(0) || editedProfile.lastName?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={isUploading}
                      className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg"
                      title="Change photo"
                    >
                      <CameraIcon className="h-4 w-4" />
                    </button>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editedProfile.firstName} {editedProfile.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">Click camera icon to change photo</p>
                    {errors.avatar && (
                      <p className="text-sm text-red-600 mt-1">{errors.avatar}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Supported: JPG, PNG, GIF, WebP (max 5MB)
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Favorite Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Favorite Subject *
                    </label>
                    <input
                      type="text"
                      value={editedProfile.favoriteSubject}
                      onChange={(e) => handleInputChange('favoriteSubject', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.favoriteSubject ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Math, Science, Art, History"
                    />
                    {errors.favoriteSubject && (
                      <p className="text-sm text-red-600 mt-1">{errors.favoriteSubject}</p>
                    )}
                  </div>

                  {/* Hobbies & Interests */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hobbies & Interests *
                    </label>
                    <input
                      type="text"
                      value={editedProfile.hobbies}
                      onChange={(e) => handleInputChange('hobbies', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.hobbies ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Soccer, Reading, Music, Gaming"
                    />
                    {errors.hobbies && (
                      <p className="text-sm text-red-600 mt-1">{errors.hobbies}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Career Goals */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Career Goals *
                    </label>
                    <input
                      type="text"
                      value={editedProfile.careerGoals}
                      onChange={(e) => handleInputChange('careerGoals', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.careerGoals ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="What do you want to be when you grow up?"
                    />
                    {errors.careerGoals && (
                      <p className="text-sm text-red-600 mt-1">{errors.careerGoals}</p>
                    )}
                  </div>

                  {/* Class Of */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class Of *
                    </label>
                    <select
                      value={editedProfile.classOf}
                      onChange={(e) => handleInputChange('classOf', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.classOf ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select graduation year</option>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                      <option value="2029">2029</option>
                      <option value="2030">2030</option>
                    </select>
                    {errors.classOf && (
                      <p className="text-sm text-red-600 mt-1">{errors.classOf}</p>
                    )}
                  </div>

                  {/* Fun Fact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fun Fact
                    </label>
                    <textarea
                      value={editedProfile.funFact}
                      onChange={(e) => handleInputChange('funFact', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tell us something interesting about yourself!"
                      rows={3}
                    />
                  </div>

                  {/* School Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School Name
                    </label>
                    <input
                      type="text"
                      value={editedProfile.schoolName || ''}
                      onChange={(e) => handleInputChange('schoolName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your school name"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={editedProfile.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                    Cancel
                    </button>
                    <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CheckIcon className="h-4 w-4" />
                    )}
                    <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </StudentRoute>
  );
};

export default StudentProfilePage;
