'use client';

import React, { useState, useEffect } from 'react';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CameraIcon, UserIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
  department?: string;
  yearsExperience?: number;
}

const InstructorProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
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
    if (user) {
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
        schoolName: user.schoolName || '',
        department: user.department || '',
        yearsExperience: user.yearsExperience || 0
      };
      setProfile(profileData);
      setEditedProfile(profileData);
    }
  }, [user]);

  // Handle input changes
  const handleInputChange = (field: keyof ProfileData, value: string | number) => {
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

    // Convert file to base64
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
    if (!editedProfile) return false;
    
    const newErrors: Record<string, string> = {};

    if (!editedProfile.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!editedProfile.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!editedProfile.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedProfile.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!editedProfile.department?.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!editedProfile.schoolName?.trim()) {
      newErrors.schoolName = 'School name is required';
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

      // Temporarily skip avatar upload to avoid CloudFront issues
      if (cleanProfile.avatar && cleanProfile.avatar.startsWith('data:image/')) {
        console.log('Avatar is base64, skipping S3 upload for now to avoid CloudFront issues');
        // Keep the base64 data but note it's temporary
        cleanProfile.avatar = cleanProfile.avatar.substring(0, 100) + '... (truncated for CloudFront)';
      }

      console.log('Saving instructor profile:', cleanProfile);
      console.log('Avatar type:', typeof cleanProfile.avatar);
      console.log('Avatar starts with data:', cleanProfile.avatar?.startsWith('data:'));
      
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

      if (!response.ok) {
        let errorMessage = 'Failed to save profile';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Profile save result:', result);
      
      // Update local profile state
      setProfile(cleanProfile);
      setIsEditing(false);

      // Update AuthContext with new user data
      if (result.user) {
        // Update the user in AuthContext
        const updatedUser = {
          ...user,
          ...result.user,
          id: user.id, // Keep the original id
          role: user.role // Keep the original role
        };
        
        // Update localStorage
        const storedAuthState = localStorage.getItem('authState');
        if (storedAuthState) {
          const parsedState = JSON.parse(storedAuthState);
          const updatedAuthState = {
            ...parsedState,
            user: updatedUser
          };
          localStorage.setItem('authState', JSON.stringify(updatedAuthState));
        }
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
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A90E2] mx-auto mb-4"></div>
            <p className="text-[#333333]">Loading profile...</p>
          </div>
        </div>
      </InstructorRoute>
    );
  }

  return (
    <InstructorRoute>
      <div className="min-h-screen bg-[#F5F5F5]">
        {/* Header with Back Button */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-[#4A90E2]/20 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/instructor/dashboard"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                title="Back to Dashboard"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#4A90E2] rounded-full flex items-center justify-center text-white font-bold text-lg">
                  👨‍🏫
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#333333]">Instructor Profile</h1>
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
                  {profile.department && (
                    <p className="text-sm opacity-75">{profile.department} Department</p>
                  )}
                  {profile.schoolName && (
                    <p className="text-sm opacity-75">{profile.schoolName}</p>
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
                  
                  {profile.department && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Department</label>
                      <p className="text-gray-900">{profile.department}</p>
                    </div>
                  )}
                  
                  {profile.schoolName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">School</label>
                      <p className="text-gray-900">{profile.schoolName}</p>
                    </div>
                  )}
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Professional Information
                  </h3>
                  
                  {profile.favoriteSubject && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Subject Area</label>
                      <p className="text-gray-900">{profile.favoriteSubject}</p>
                    </div>
                  )}
                  
                  {profile.yearsExperience && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Years of Experience</label>
                      <p className="text-gray-900">{profile.yearsExperience} years</p>
                    </div>
                  )}
                  
                  {profile.careerGoals && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Teaching Philosophy</label>
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
                      <img
                        src={editedProfile.avatar || '/api/placeholder/100/100'}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
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
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={editedProfile.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={editedProfile.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
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

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department *
                    </label>
                    <input
                      type="text"
                      value={editedProfile.department || ''}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.department ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Mathematics, Science, English"
                    />
                    {errors.department && (
                      <p className="text-sm text-red-600 mt-1">{errors.department}</p>
                    )}
                  </div>

                  {/* School Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School Name *
                    </label>
                    <input
                      type="text"
                      value={editedProfile.schoolName || ''}
                      onChange={(e) => handleInputChange('schoolName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.schoolName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your school name"
                    />
                    {errors.schoolName && (
                      <p className="text-sm text-red-600 mt-1">{errors.schoolName}</p>
                    )}
                  </div>

                  {/* Years of Experience */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={editedProfile.yearsExperience || 0}
                      onChange={(e) => handleInputChange('yearsExperience', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>

                  {/* Subject Area */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Area
                    </label>
                    <input
                      type="text"
                      value={editedProfile.favoriteSubject || ''}
                      onChange={(e) => handleInputChange('favoriteSubject', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Mathematics, Science, English"
                    />
                  </div>

                  {/* Teaching Philosophy */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teaching Philosophy
                    </label>
                    <textarea
                      value={editedProfile.careerGoals || ''}
                      onChange={(e) => handleInputChange('careerGoals', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe your teaching approach and philosophy"
                      rows={3}
                    />
                  </div>

                  {/* Hobbies */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hobbies & Interests
                    </label>
                    <input
                      type="text"
                      value={editedProfile.hobbies || ''}
                      onChange={(e) => handleInputChange('hobbies', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Reading, Hiking, Music"
                    />
                  </div>

                  {/* Fun Fact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fun Fact
                    </label>
                    <textarea
                      value={editedProfile.funFact || ''}
                      onChange={(e) => handleInputChange('funFact', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tell us something interesting about yourself!"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={editedProfile.bio || ''}
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
    </InstructorRoute>
  );
};

export default InstructorProfilePage;
