'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  bio: string;
  department: string;
  title: string;
  officeLocation: string;
  officeHours: string;
  phoneNumber: string;
  website: string;
  researchInterests: string;
  education: string;
  experience: string;
  certifications: string;
}

const InstructorProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    id: user?.id || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    avatar: user?.avatar || '/api/placeholder/150/150',
    bio: user?.bio || '',
    department: user?.department || '',
    title: user?.title || '',
    officeLocation: user?.officeLocation || '',
    officeHours: user?.officeHours || '',
    phoneNumber: user?.phoneNumber || '',
    website: user?.website || '',
    researchInterests: user?.researchInterests || '',
    education: user?.education || '',
    experience: user?.experience || '',
    certifications: user?.certifications || ''
  });

  const [editedProfile, setEditedProfile] = useState<ProfileData>(profile);

  // Update profile when user data changes
  React.useEffect(() => {
    if (user) {
      const updatedProfile = {
        id: user.id || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        avatar: user.avatar || '/api/placeholder/150/150',
        bio: user.bio || '',
        department: user.department || '',
        title: user.title || '',
        officeLocation: user.officeLocation || '',
        officeHours: user.officeHours || '',
        phoneNumber: user.phoneNumber || '',
        website: user.website || '',
        researchInterests: user.researchInterests || '',
        education: user.education || '',
        experience: user.experience || '',
        certifications: user.certifications || ''
      };
      setProfile(updatedProfile);
      setEditedProfile(updatedProfile);
    }
  }, [user]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      // Save profile to backend
      const response = await fetch('/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          firstName: editedProfile.firstName,
          lastName: editedProfile.lastName,
          email: editedProfile.email,
          avatar: editedProfile.avatar,
          bio: editedProfile.bio,
          department: editedProfile.department,
          title: editedProfile.title,
          officeLocation: editedProfile.officeLocation,
          officeHours: editedProfile.officeHours,
          phoneNumber: editedProfile.phoneNumber,
          website: editedProfile.website,
          researchInterests: editedProfile.researchInterests,
          education: editedProfile.education,
          experience: editedProfile.experience,
          certifications: editedProfile.certifications,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(result.data);
        setIsEditing(false);
        
        // Update user context with new avatar
        if (user && result.data.avatar) {
          // This would typically update the user context
          console.log('Profile saved successfully:', result.data);
        }
      } else {
        const error = await response.json();
        console.error('Failed to save profile:', error);
        alert('Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      // Upload to S3 first
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'profile-pictures');
      formData.append('userId', user?.id || 'anonymous');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Upload response:', result);
        
        if (result.success && result.data && result.data.fileUrl) {
          // Update with the S3 URL immediately
          handleInputChange('avatar', result.data.fileUrl);
          console.log('Avatar uploaded successfully:', result.data.fileUrl);
        } else {
          console.error('Invalid upload response structure:', result);
          alert('Invalid response from upload service. Please try again.');
        }
      } else {
        const error = await response.json();
        console.error('Avatar upload failed:', error);
        alert(`Failed to upload avatar: ${error.error || 'Unknown error'}. Please try again.`);
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert('Error uploading avatar. Please try again.');
    }
  };

  return (
    <InstructorRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="text-2xl">&lt;</span>
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Instructor Profile</h1>
                  <p className="text-gray-600 mt-1">Manage your profile information</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sticky top-8">
                <div className="text-center">
                  <div className="relative inline-block">
                    <img
                      src={isEditing ? editedProfile.avatar : profile.avatar}
                      alt="Profile"
                      className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
                    />
                    {isEditing && (
                      <label className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-2 cursor-pointer hover:bg-purple-600 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                        <span className="text-sm">📷</span>
                      </label>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {isEditing ? editedProfile.firstName : profile.firstName} {isEditing ? editedProfile.lastName : profile.lastName}
                  </h2>
                  <p className="text-gray-600">
                    {isEditing ? editedProfile.title : profile.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isEditing ? editedProfile.department : profile.department}
                  </p>
                </div>

                {isEditing ? (
                  <div className="mt-6 space-y-4">
                    {/* Save/Cancel Buttons - Moved to Top */}
                    <div className="flex justify-end space-x-4 mb-6 pb-4 border-b border-gray-200">
                      <button
                        onClick={handleCancel}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                      >
                        Save Changes
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={editedProfile.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={editedProfile.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editedProfile.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={editedProfile.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-5 h-5 mr-2">📧</span>
                      <span>{profile.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-5 h-5 mr-2">🏢</span>
                      <span>{profile.officeLocation}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-5 h-5 mr-2">⏰</span>
                      <span>{profile.officeHours}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-5 h-5 mr-2">📞</span>
                      <span>{profile.phoneNumber}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-5 h-5 mr-2">🌐</span>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                        Website
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bio */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">About</h3>
                {isEditing ? (
                  <textarea
                    value={editedProfile.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-gray-700">{profile.bio}</p>
                )}
              </div>

              {/* Research Interests */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Research Interests</h3>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.researchInterests}
                    onChange={(e) => handleInputChange('researchInterests', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="e.g., Machine Learning, Data Structures, Algorithms"
                  />
                ) : (
                  <p className="text-gray-700">{profile.researchInterests}</p>
                )}
              </div>

              {/* Education */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Education</h3>
                {isEditing ? (
                  <textarea
                    value={editedProfile.education}
                    onChange={(e) => handleInputChange('education', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="List your educational background..."
                  />
                ) : (
                  <div className="text-gray-700 whitespace-pre-line">{profile.education}</div>
                )}
              </div>

              {/* Experience */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Experience</h3>
                {isEditing ? (
                  <textarea
                    value={editedProfile.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="List your work experience..."
                  />
                ) : (
                  <div className="text-gray-700 whitespace-pre-line">{profile.experience}</div>
                )}
              </div>

              {/* Contact Information */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Office Location</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.officeLocation}
                        onChange={(e) => handleInputChange('officeLocation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-700">{profile.officeLocation}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Office Hours</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.officeHours}
                        onChange={(e) => handleInputChange('officeHours', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-700">{profile.officeHours}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-700">{profile.phoneNumber}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editedProfile.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      />
                    ) : (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                        {profile.website}
                      </a>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default InstructorProfilePage;
