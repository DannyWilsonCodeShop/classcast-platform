'use client';

import React, { useState, useRef } from 'react';
import { CameraIcon, UserIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  bio: string;
  major: string;
  year: string;
  phone?: string;
  location?: string;
}

interface ProfileEditorProps {
  profile: ProfileData;
  onSave: (updatedProfile: ProfileData) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({
  profile,
  onSave,
  onCancel,
  isOpen
}) => {
  const [editedProfile, setEditedProfile] = useState<ProfileData>(profile);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    try {
      setIsUploading(true);
      setErrors(prev => ({ ...prev, avatar: '' }));
      
      // For now, create a local preview URL as a fallback
      // In production, this would upload to S3
      const previewUrl = URL.createObjectURL(file);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to upload to S3 first
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'profile-pictures');
        formData.append('userId', profile.id);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          setEditedProfile(prev => ({
            ...prev,
            avatar: result.data.fileUrl
          }));
        } else {
          // Try fallback upload service
          console.warn('S3 upload failed, trying fallback service');
          const fallbackResponse = await fetch('/api/upload-fallback', {
            method: 'POST',
            body: formData,
          });
          
          if (fallbackResponse.ok) {
            const fallbackResult = await fallbackResponse.json();
            setEditedProfile(prev => ({
              ...prev,
              avatar: fallbackResult.data.fileUrl
            }));
          } else {
            // Final fallback to local preview
            console.warn('All upload services failed, using local preview');
            setEditedProfile(prev => ({
              ...prev,
              avatar: previewUrl
            }));
          }
        }
      } catch (uploadError) {
        // Try fallback upload service if S3 is not available
        console.warn('S3 upload error, trying fallback service:', uploadError);
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', 'profile-pictures');
          formData.append('userId', profile.id);
          
          const fallbackResponse = await fetch('/api/upload-fallback', {
            method: 'POST',
            body: formData,
          });
          
          if (fallbackResponse.ok) {
            const fallbackResult = await fallbackResponse.json();
            setEditedProfile(prev => ({
              ...prev,
              avatar: fallbackResult.data.fileUrl
            }));
          } else {
            throw new Error('Fallback service also failed');
          }
        } catch (fallbackError) {
          // Final fallback to local preview
          console.warn('All upload services failed, using local preview:', fallbackError);
          setEditedProfile(prev => ({
            ...prev,
            avatar: previewUrl
          }));
        }
      }
      
      setErrors(prev => ({
        ...prev,
        avatar: ''
      }));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setErrors(prev => ({
        ...prev,
        avatar: 'Failed to upload image. Using local preview for now.'
      }));
      
      // Still set a local preview even if upload fails
      const previewUrl = URL.createObjectURL(file);
      setEditedProfile(prev => ({
        ...prev,
        avatar: previewUrl
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = (): boolean => {
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


    if (!editedProfile.major.trim()) {
      newErrors.major = 'Major is required';
    }

    if (!editedProfile.year.trim()) {
      newErrors.year = 'Academic year is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(editedProfile);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
          <button
            onClick={onCancel}
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
                       {isUploading && (
                         <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                           <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                         </div>
                       )}
                     </div>
                     <button
                       onClick={() => fileInputRef.current?.click()}
                       disabled={isUploading}
                       className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg"
                       title={isUploading ? 'Uploading...' : 'Change photo'}
                     >
                       {isUploading ? (
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       ) : (
                         <CameraIcon className="h-4 w-4" />
                       )}
                     </button>
                     <input
                       ref={fileInputRef}
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
                     <p className="text-sm text-gray-600">
                       {isUploading ? 'Uploading photo...' : 'Click camera icon to change photo'}
                     </p>
                     {errors.avatar && (
                       <p className="text-sm text-red-600 mt-1">{errors.avatar}</p>
                     )}
                     {!errors.avatar && !isUploading && (
                       <p className="text-xs text-gray-500 mt-1">
                         Supported: JPG, PNG, GIF, WebP (max 5MB)
                       </p>
                     )}
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


            {/* Major */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Major *
              </label>
              <input
                type="text"
                value={editedProfile.major}
                onChange={(e) => handleInputChange('major', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.major ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your major"
              />
              {errors.major && (
                <p className="text-sm text-red-600 mt-1">{errors.major}</p>
              )}
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year *
              </label>
              <select
                value={editedProfile.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.year ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select year</option>
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Graduate">Graduate</option>
              </select>
              {errors.year && (
                <p className="text-sm text-red-600 mt-1">{errors.year}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={editedProfile.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your phone number"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={editedProfile.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your location"
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <CheckIcon className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;
