'use client';

import React, { useState, useEffect } from 'react';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { CameraIcon, UserIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { PasswordReset } from '@/components/PasswordReset';

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
  schoolLogo?: string;
  department?: string;
  yearsExperience?: number;
}

const InstructorProfilePage: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editedProfile, setEditedProfile] = useState<ProfileData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  // Initialize profile data from user context
  useEffect(() => {
    if (user && !profile) {
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
        schoolLogo: user.schoolLogo || '',
        department: (user as any).department || '',
        yearsExperience: (user as any).yearsExperience || 0
      };
      setProfile(profileData);
      setEditedProfile(profileData);
    }
  }, [user, profile]);

  // Handle input changes
  const handleInputChange = (field: keyof ProfileData, value: string | number) => {
    if (!editedProfile) return;
    setEditedProfile(prev => prev ? { ...prev, [field]: value } : null);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editedProfile) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, avatar: 'Please select a valid image file (JPG, PNG, GIF, or WebP)' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, avatar: 'Image size must be less than 5MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      setEditedProfile(prev => prev ? { ...prev, avatar: base64Data } : null);
      setErrors(prev => ({ ...prev, avatar: '' }));
    };
    reader.readAsDataURL(file);
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!editedProfile) return false;
    const newErrors: Record<string, string> = {};

    if (!editedProfile.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!editedProfile.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!editedProfile.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedProfile.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!editedProfile.department?.trim()) newErrors.department = 'Department is required';
    if (!editedProfile.schoolName?.trim()) newErrors.schoolName = 'School name is required';

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

      const cleanProfile = { ...editedProfile };
      if (cleanProfile.avatar && cleanProfile.avatar.startsWith('blob:')) {
        cleanProfile.avatar = '';
      }

      // Handle base64 avatars by uploading directly to S3 with presigned URL
      if (cleanProfile.avatar && cleanProfile.avatar.startsWith('data:image/')) {
        const originalAvatar = cleanProfile.avatar;
        try {
          const base64Data = cleanProfile.avatar.split(',')[1];
          const contentType = cleanProfile.avatar.split(';')[0].split(':')[1];
          const fileExtension = contentType.split('/')[1] || 'jpg';
          const fileName = `avatar_${user.id}_${Date.now()}.${fileExtension}`;

          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: contentType });

          const presignedResponse = await fetch('/api/upload/presigned', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName,
              contentType,
              folder: 'profile-pictures',
              userId: user.id
            })
          });

          if (presignedResponse.ok) {
            const presignedData = await presignedResponse.json();
            if (presignedData.success && presignedData.data) {
              const { presignedUrl, fileUrl } = presignedData.data;
              const directUpload = await fetch(presignedUrl, {
                method: 'PUT',
                body: blob,
                headers: { 'Content-Type': contentType }
              });
              if (directUpload.ok) {
                cleanProfile.avatar = fileUrl;
              } else {
                cleanProfile.avatar = originalAvatar;
              }
            } else {
              cleanProfile.avatar = originalAvatar;
            }
          } else {
            cleanProfile.avatar = originalAvatar;
          }
        } catch (uploadError) {
          console.error('S3 upload error:', uploadError);
          cleanProfile.avatar = originalAvatar;
        }
      }

      const response = await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...cleanProfile }),
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
      if (result.user) {
        setProfile(result.user);
        setIsEditing(false);
        updateUser(result.user);
      }
      alert('Profile updated successfully!');
    } catch (saveError) {
      console.error('Profile save error:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.push('/auth/login');
  };

  if (!user || !profile) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005587] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </InstructorRoute>
    );
  }

  return (
    <InstructorRoute>
      <div className="min-h-full overflow-y-auto pb-24 bg-white px-4 py-6">
        {/* Profile Header - Centered Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={`${profile.firstName} ${profile.lastName}`}
                className="w-24 h-24 rounded-full object-cover border-4 border-[#FFC72C]"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-[#FFC72C]">
                <UserIcon className="w-12 h-12 text-[#005587]" />
              </div>
            )}
          </div>
          <h1
            className="text-2xl font-bold text-[#005587]"
          >
            {profile.firstName} {profile.lastName}
          </h1>
          <p className="text-gray-600 text-sm">{profile.email}</p>
          <span className="mt-2 px-3 py-1 bg-[#FFC72C]/20 text-[#005587] text-xs font-semibold rounded-full uppercase">
            Instructor
          </span>
        </div>

        {/* Profile Info Card */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-4">
          <h2
            className="text-lg font-bold text-[#005587] mb-3"
          >
            Basic Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase">Name</label>
              <p className="text-gray-900">{profile.firstName} {profile.lastName}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase">Email</label>
              <p className="text-gray-900">{profile.email}</p>
            </div>
            {profile.department && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Department</label>
                <p className="text-gray-900">{profile.department}</p>
              </div>
            )}
            {profile.schoolName && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">School</label>
                <p className="text-gray-900">{profile.schoolName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Professional Info Card */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-4">
          <h2
            className="text-lg font-bold text-[#005587] mb-3"
          >
            Professional
          </h2>
          <div className="space-y-3">
            {profile.favoriteSubject && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Subject Area</label>
                <p className="text-gray-900">{profile.favoriteSubject}</p>
              </div>
            )}
            {profile.yearsExperience ? (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Experience</label>
                <p className="text-gray-900">{profile.yearsExperience} years</p>
              </div>
            ) : null}
            {profile.careerGoals && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Teaching Philosophy</label>
                <p className="text-gray-900">{profile.careerGoals}</p>
              </div>
            )}
          </div>
        </div>

        {/* Personal Info Card */}
        {(profile.bio || profile.hobbies || profile.funFact) && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <h2
              className="text-lg font-bold text-[#005587] mb-3"
            >
              Personal
            </h2>
            <div className="space-y-3">
              {profile.bio && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Bio</label>
                  <p className="text-gray-900">{profile.bio}</p>
                </div>
              )}
              {profile.hobbies && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Hobbies</label>
                  <p className="text-gray-900">{profile.hobbies}</p>
                </div>
              )}
              {profile.funFact && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Fun Fact</label>
                  <p className="text-gray-900">{profile.funFact}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mt-6">
          {/* Admin Tools - only visible to admin users */}
          {(user as any).isAdmin && (
            <div className="bg-gray-50 rounded-2xl p-4 mb-3">
              <h2 className="text-lg font-bold text-[#005587] mb-3">Admin Tools</h2>
              <button
                onClick={() => router.push('/instructor/admin/analytics')}
                className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 active:scale-[0.98] transition-transform"
              >
                <div className="w-9 h-9 bg-[#005587]/10 rounded-full flex items-center justify-center">
                  <span className="text-lg">📊</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-[#005587]">Platform Analytics</p>
                  <p className="text-[10px] text-gray-500">Submissions, engagement, grades</p>
                </div>
              </button>
            </div>
          )}

          <button
            onClick={() => setIsEditing(true)}
            className="w-full py-3 bg-[#005587] text-white font-semibold rounded-2xl text-sm"
          >
            Edit Profile
          </button>
          <button
            onClick={() => setShowPasswordReset(true)}
            className="w-full py-3 bg-gray-50 text-[#005587] font-semibold rounded-2xl text-sm border border-gray-200"
          >
            Change Password
          </button>
          <button
            onClick={handleSignOut}
            className="w-full py-3 bg-[#FFC72C] text-[#005587] font-bold rounded-2xl text-sm"
          >
            Sign Out
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mt-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Edit Profile Modal */}
        {isEditing && editedProfile && (
          <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-[env(safe-area-inset-top,0px)] overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full my-4" style={{ marginBottom: '2rem' }}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
                <h2
                  className="text-xl font-bold text-[#005587]"
                >
                  Edit Profile
                </h2>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-[#FFC72C]">
                      {editedProfile.avatar ? (
                        <img
                          src={editedProfile.avatar}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <UserIcon className="w-10 h-10 text-[#005587]" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={isUploading}
                      className="absolute -bottom-2 -right-2 bg-[#FFC72C] text-[#005587] p-2 rounded-full hover:bg-[#e6b326] transition-colors disabled:opacity-50"
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={editedProfile.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#005587] focus:border-[#005587] ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={editedProfile.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#005587] focus:border-[#005587] ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#005587] focus:border-[#005587] ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter your email"
                    />
                    {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                    <input
                      type="text"
                      value={editedProfile.department || ''}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#005587] focus:border-[#005587] ${errors.department ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="e.g., Mathematics, Science, English"
                    />
                    {errors.department && <p className="text-sm text-red-600 mt-1">{errors.department}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
                    <input
                      type="text"
                      value={editedProfile.schoolName || ''}
                      onChange={(e) => handleInputChange('schoolName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#005587] focus:border-[#005587] ${errors.schoolName ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter your school name"
                    />
                    {errors.schoolName && <p className="text-sm text-red-600 mt-1">{errors.schoolName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={editedProfile.yearsExperience || 0}
                      onChange={(e) => handleInputChange('yearsExperience', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject Area</label>
                    <input
                      type="text"
                      value={editedProfile.favoriteSubject || ''}
                      onChange={(e) => handleInputChange('favoriteSubject', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                      placeholder="e.g., Mathematics, Science, English"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teaching Philosophy</label>
                    <textarea
                      value={editedProfile.careerGoals || ''}
                      onChange={(e) => handleInputChange('careerGoals', e.target.value)}
                      onFocus={(e) => { setTimeout(() => { e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300); }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                      placeholder="Describe your teaching approach and philosophy"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hobbies & Interests</label>
                    <input
                      type="text"
                      value={editedProfile.hobbies || ''}
                      onChange={(e) => handleInputChange('hobbies', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                      placeholder="e.g., Reading, Hiking, Music"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fun Fact</label>
                    <textarea
                      value={editedProfile.funFact || ''}
                      onChange={(e) => handleInputChange('funFact', e.target.value)}
                      onFocus={(e) => { setTimeout(() => { e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300); }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                      placeholder="Tell us something interesting about yourself!"
                      rows={2}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      value={editedProfile.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      onFocus={(e) => { setTimeout(() => { e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300); }}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>

                {/* Modal Action Buttons */}
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
                    className="px-4 py-2 bg-[#005587] text-white rounded-lg hover:bg-[#004470] transition-colors flex items-center space-x-2 disabled:opacity-50"
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

        {/* Password Reset Modal */}
        {showPasswordReset && (
          <PasswordReset onClose={() => setShowPasswordReset(false)} />
        )}
      </div>
    </InstructorRoute>
  );
};

export default InstructorProfilePage;
