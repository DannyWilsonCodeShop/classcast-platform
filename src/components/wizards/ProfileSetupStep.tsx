'use client';

import React, { useState, useRef } from 'react';

interface ProfileSetupStepProps {
  userRole: 'student' | 'instructor' | 'admin';
  profileData: Partial<UserProfile>;
  onChange: (data: Partial<UserProfile>) => void;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  profilePicture?: string;
  phone?: string;
  department?: string;
  institution?: string;
  yearOfStudy?: number;
  interests: string[];
  timezone: string;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacySettings: {
    profileVisibility: 'public' | 'private' | 'course-members';
    showEmail: boolean;
    showPhone: boolean;
  };
}

const ProfileSetupStep: React.FC<ProfileSetupStepProps> = ({
  userRole,
  profileData,
  onChange
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof UserProfile, value: any) => {
    onChange({ ...profileData, [field]: value });
  };

  const handleNestedChange = (parent: keyof UserProfile, field: string, value: any) => {
    onChange({
      ...profileData,
      [parent]: {
        ...(profileData[parent] as any),
        [field]: value
      }
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB for profile pictures)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Upload to S3
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'profile-pictures');
      formData.append('userId', profileData.email || 'anonymous');
      formData.append('metadata', JSON.stringify({
        type: 'profile-picture',
        uploadedAt: new Date().toISOString()
      }));

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (result.success) {
        // Store the S3 URL instead of base64
        handleChange('profilePicture', result.data.fileUrl);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const addInterest = (interest: string) => {
    if (interest.trim() && !profileData.interests?.includes(interest.trim())) {
      handleChange('interests', [...(profileData.interests || []), interest.trim()]);
    }
  };

  const removeInterest = (index: number) => {
    const newInterests = [...(profileData.interests || [])];
    newInterests.splice(index, 1);
    handleChange('interests', newInterests);
  };

  const getRoleSpecificFields = () => {
    switch (userRole) {
      case 'instructor':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <select
                value={profileData.department || ''}
                onChange={(e) => handleChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="English">English</option>
                <option value="History">History</option>
                <option value="Business">Business</option>
                <option value="Engineering">Engineering</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution *
              </label>
              <input
                type="text"
                value={profileData.institution || ''}
                onChange={(e) => handleChange('institution', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Stanford University"
              />
            </div>
          </>
        );

      case 'student':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year of Study
              </label>
              <select
                value={profileData.yearOfStudy || ''}
                onChange={(e) => handleChange('yearOfStudy', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Year</option>
                <option value="1">Freshman (1st Year)</option>
                <option value="2">Sophomore (2nd Year)</option>
                <option value="3">Junior (3rd Year)</option>
                <option value="4">Senior (4th Year)</option>
                <option value="5">Graduate Student</option>
                <option value="6">PhD Student</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution
              </label>
              <input
                type="text"
                value={profileData.institution || ''}
                onChange={(e) => handleChange('institution', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Stanford University"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Complete Your Profile</h4>
        <p className="text-blue-800 text-sm">
          Set up your profile to help others connect with you and personalize your ClassCast experience.
        </p>
      </div>

      {/* Profile Picture */}
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {profileData.profilePicture ? (
              <img
                src={profileData.profilePicture}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <p className="text-sm text-gray-600 mt-2">
          {isUploading ? 'Uploading...' : 'Click to upload profile picture'}
        </p>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            value={profileData.firstName || ''}
            onChange={(e) => handleChange('firstName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your first name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            value={profileData.lastName || ''}
            onChange={(e) => handleChange('lastName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your last name"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          value={profileData.email || ''}
          onChange={(e) => handleChange('email', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="your.email@example.com"
        />
      </div>

      {/* Role-specific fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {getRoleSpecificFields()}
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bio
        </label>
        <textarea
          value={profileData.bio || ''}
          onChange={(e) => handleChange('bio', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={`Tell us about yourself... ${userRole === 'instructor' ? 'What subjects do you teach?' : 'What are you studying?'}`}
        />
      </div>

      {/* Interests */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Interests & Skills
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            placeholder="Add an interest or skill"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addInterest(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[placeholder="Add an interest or skill"]') as HTMLInputElement;
              if (input) {
                addInterest(input.value);
                input.value = '';
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(profileData.interests || []).map((interest, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {interest}
              <button
                onClick={() => removeInterest(index)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number (Optional)
        </label>
        <input
          type="tel"
          value={profileData.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="+1 (555) 123-4567"
        />
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Timezone
        </label>
        <select
          value={profileData.timezone || 'America/New_York'}
          onChange={(e) => handleChange('timezone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="America/New_York">Eastern Time (ET)</option>
          <option value="America/Chicago">Central Time (CT)</option>
          <option value="America/Denver">Mountain Time (MT)</option>
          <option value="America/Los_Angeles">Pacific Time (PT)</option>
          <option value="Europe/London">Greenwich Mean Time (GMT)</option>
          <option value="Europe/Paris">Central European Time (CET)</option>
          <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
          <option value="Asia/Shanghai">China Standard Time (CST)</option>
        </select>
      </div>

      {/* Notification Preferences */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-semibold text-gray-900 mb-3">Notification Preferences</h5>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={profileData.notificationPreferences?.email ?? true}
              onChange={(e) => handleNestedChange('notificationPreferences', 'email', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Email notifications</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={profileData.notificationPreferences?.push ?? true}
              onChange={(e) => handleNestedChange('notificationPreferences', 'push', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Push notifications</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={profileData.notificationPreferences?.sms ?? false}
              onChange={(e) => handleNestedChange('notificationPreferences', 'sms', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">SMS notifications</span>
          </label>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-semibold text-gray-900 mb-3">Privacy Settings</h5>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Visibility
            </label>
            <select
              value={profileData.privacySettings?.profileVisibility || 'course-members'}
              onChange={(e) => handleNestedChange('privacySettings', 'profileVisibility', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="public">Public - Anyone can see your profile</option>
              <option value="course-members">Course Members - Only people in your courses</option>
              <option value="private">Private - Only you can see your profile</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={profileData.privacySettings?.showEmail ?? false}
                onChange={(e) => handleNestedChange('privacySettings', 'showEmail', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show email address on profile</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={profileData.privacySettings?.showPhone ?? false}
                onChange={(e) => handleNestedChange('privacySettings', 'showPhone', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show phone number on profile</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupStep;
