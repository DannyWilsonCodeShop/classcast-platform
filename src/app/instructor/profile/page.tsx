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
    firstName: user?.firstName || 'John',
    lastName: user?.lastName || 'Doe',
    email: user?.email || 'john.doe@university.edu',
    avatar: user?.avatar || '/api/placeholder/150/150',
    bio: 'Experienced computer science instructor with a passion for teaching and research.',
    department: 'Computer Science',
    title: 'Associate Professor',
    officeLocation: 'Building A, Room 205',
    officeHours: 'Mon/Wed 2:00-4:00 PM',
    phoneNumber: '(555) 123-4567',
    website: 'https://johndoe.university.edu',
    researchInterests: 'Machine Learning, Data Structures, Algorithms',
    education: 'Ph.D. in Computer Science, Stanford University (2015)\nM.S. in Computer Science, MIT (2012)\nB.S. in Computer Science, UC Berkeley (2010)',
    experience: 'Associate Professor, University of Technology (2015-Present)\nResearch Scientist, Google (2013-2015)\nSoftware Engineer, Microsoft (2010-2013)',
    certifications: 'AWS Certified Solutions Architect\nGoogle Cloud Professional\nCertified Scrum Master'
  });

  const [editedProfile, setEditedProfile] = useState<ProfileData>(profile);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
    // In a real app, this would save to the backend
    console.log('Profile updated:', editedProfile);
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

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, this would upload to a server
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        handleInputChange('avatar', result);
      };
      reader.readAsDataURL(file);
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
                  className="px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#9B5DE5] transition-colors"
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
                      <label className="absolute bottom-0 right-0 bg-[#4A90E2] text-white rounded-full p-2 cursor-pointer hover:bg-[#9B5DE5] transition-colors">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={editedProfile.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
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
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-[#4A90E2] hover:underline">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      />
                    ) : (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-[#4A90E2] hover:underline">
                        {profile.website}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Save/Cancel Buttons */}
              {isEditing && (
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-3 bg-[#4A90E2] text-white rounded-lg hover:bg-[#9B5DE5] transition-colors font-medium"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default InstructorProfilePage;
