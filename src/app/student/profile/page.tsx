'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import Avatar from '@/components/common/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, User } from '@/lib/api';

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Popular emojis for avatars
  const emojiOptions = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '🤧', '🥵', '🥶', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐',
    '👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧓', '👴', '👵',
    '👱', '👱‍♀️', '👱‍♂️', '🧔', '👨‍🦰', '👩‍🦰', '👨‍🦱', '👩‍🦱', '👨‍🦳', '👩‍🦳',
    '👨‍🦲', '👩‍🦲', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸',
    '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '💆', '💇',
    '🚶', '🏃', '💃', '🕺', '👯', '🧖', '🧗', '🤺', '🏇', '⛷️',
    '🏂', '🏌️', '🏄', '🚣', '🏊', '⛹️', '🏋️', '🚴', '🚵', '🤸',
    '🤼', '🤽', '🤾', '🤹', '🧘', '🛀', '🛌', '👭', '👫', '👬',
    '💏', '💑', '👪', '🗣️', '👤', '👥', '🫂', '👋', '🤚', '🖐️',
    '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈',
    '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛',
    '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳',
    '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷',
    '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'
  ];

  // Initialize profile with clean data
  useEffect(() => {
    if (user && !profile) {
      const profileData: ProfileData = {
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

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setEditedProfile(prev => ({
      ...prev,
      avatar: emoji
    }));
    setShowEmojiPicker(false);
    setErrors(prev => ({ ...prev, avatar: '' }));
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

  // Save profile using new clean API
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

      // Use the new clean API to update profile
      const updatedUser = await api.updateUserProfile(user.id!, editedProfile);

      // Update user in AuthContext
      updateUser(updatedUser);
      
      // Update local state
      setProfile(editedProfile);
      setIsEditing(false);

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
                className="text-[#4A90E2] hover:text-[#357ABD] transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-[#333333]">Profile</h1>
            </div>
            <div className="flex items-center space-x-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors duration-200 font-medium"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-[#4A90E2] to-[#357ABD] p-8 text-white">
              <div className="flex items-center space-x-6">
                {/* Avatar */}
                <div className="relative">
                  {isEditing ? (
                    <Avatar
                      user={editedProfile || {}}
                      size="xl"
                      showBorder={true}
                      className="border-white"
                    />
                  ) : (
                    <Avatar
                      user={profile || {}}
                      size="xl"
                      showBorder={true}
                      className="border-white"
                    />
                  )}
                  
                  {/* Emoji Picker Button (only in edit mode) */}
                  {isEditing && (
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors duration-200 shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Name and Title */}
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editedProfile?.firstName || ''}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="text-3xl font-bold bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                        placeholder="First Name"
                      />
                      <input
                        type="text"
                        value={editedProfile?.lastName || ''}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="text-3xl font-bold bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                        placeholder="Last Name"
                      />
                      {errors.firstName && <p className="text-red-200 text-sm">{errors.firstName}</p>}
                      {errors.lastName && <p className="text-red-200 text-sm">{errors.lastName}</p>}
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-3xl font-bold">
                        {profile?.firstName} {profile?.lastName}
                      </h2>
                      <p className="text-white/80 text-lg">Student</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedProfile?.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      placeholder="Email address"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.email}</p>
                  )}
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* School Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile?.schoolName || ''}
                      onChange={(e) => handleInputChange('schoolName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      placeholder="School name"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.schoolName || 'Not specified'}</p>
                  )}
                </div>

                {/* Class of */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class of</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile?.classOf || ''}
                      onChange={(e) => handleInputChange('classOf', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      placeholder="Graduation year"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.classOf || 'Not specified'}</p>
                  )}
                </div>

                {/* Favorite Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Subject</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile?.favoriteSubject || ''}
                      onChange={(e) => handleInputChange('favoriteSubject', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      placeholder="Favorite subject"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.favoriteSubject || 'Not specified'}</p>
                  )}
                </div>

                {/* Bio */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  {isEditing ? (
                    <textarea
                      value={editedProfile?.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      placeholder="Tell us about yourself"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.bio || 'No bio provided'}</p>
                  )}
                </div>

                {/* Career Goals */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Career Goals</label>
                  {isEditing ? (
                    <textarea
                      value={editedProfile?.careerGoals || ''}
                      onChange={(e) => handleInputChange('careerGoals', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      placeholder="What are your career goals?"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.careerGoals || 'No career goals specified'}</p>
                  )}
                </div>

                {/* Hobbies */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hobbies</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile?.hobbies || ''}
                      onChange={(e) => handleInputChange('hobbies', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      placeholder="What are your hobbies?"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.hobbies || 'No hobbies specified'}</p>
                  )}
                </div>

                {/* Fun Fact */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fun Fact</label>
                  {isEditing ? (
                    <textarea
                      value={editedProfile?.funFact || ''}
                      onChange={(e) => handleInputChange('funFact', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      placeholder="Share a fun fact about yourself"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.funFact || 'No fun fact provided'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Emoji Picker Modal */}
        {showEmojiPicker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Choose an Avatar</h3>
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-8 gap-2">
                {emojiOptions.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="w-10 h-10 text-2xl hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors duration-200"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentRoute>
  );
};

export default StudentProfilePage;