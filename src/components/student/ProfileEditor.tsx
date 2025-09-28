'use client';

import React, { useState, useRef } from 'react';
import { CameraIcon, UserIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { uploadAvatarToS3 } from '@/lib/s3-upload';

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
      
      // Upload file directly to S3
      const uploadResult = await uploadAvatarToS3(file, editedProfile.id);
      
      if (uploadResult.success && uploadResult.url) {
        // Update profile with S3 URL
        setEditedProfile(prev => ({
          ...prev,
          avatar: uploadResult.url
        }));
        console.log('Avatar uploaded to S3:', uploadResult.url);
      } else {
        // Show error but don't update profile
        setErrors(prev => ({
          ...prev,
          avatar: uploadResult.error || 'Upload failed'
        }));
      }
      
    } catch (error) {
      console.error('Avatar upload error:', error);
      setErrors(prev => ({
        ...prev,
        avatar: 'Failed to upload avatar. Please try again.'
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

    if (!editedProfile.favoriteSubject.trim()) {
      newErrors.favoriteSubject = 'Favorite subject is required';
    }

    if (!editedProfile.hobbies.trim()) {
      newErrors.hobbies = 'Hobbies and interests are required';
    }

    if (!editedProfile.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedProfile.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!editedProfile.careerGoals.trim()) {
      newErrors.careerGoals = 'Career goals are required';
    }

    if (!editedProfile.classOf.trim()) {
      newErrors.classOf = 'Class of is required';
    }

    console.log('Validation errors:', newErrors);
    console.log('Current profile data:', editedProfile);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    console.log('ProfileEditor handleSave clicked');
    console.log('Edited profile data:', editedProfile);
    
    const isValid = validateForm();
    console.log('Form validation result:', isValid);
    console.log('Current errors:', errors);
    
    if (isValid) {
      console.log('Validation passed, calling onSave');
      onSave(editedProfile);
    } else {
      console.log('Validation failed, not calling onSave');
      console.log('Required fields missing:', {
        favoriteSubject: !editedProfile.favoriteSubject.trim(),
        hobbies: !editedProfile.hobbies.trim(),
        email: !editedProfile.email.trim(),
        careerGoals: !editedProfile.careerGoals.trim(),
        classOf: !editedProfile.classOf.trim()
      });
    }
  };

  if (!isOpen) return null;

  console.log('ProfileEditor rendering, isOpen:', isOpen);

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
          {/* Save/Cancel Buttons - Moved to Top */}
          <div className="flex justify-end space-x-4 mb-6 pb-4 border-b border-gray-200">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                console.log('Save button clicked!');
                handleSave();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              style={{ pointerEvents: 'auto' }}
              disabled={false}
            >
              <CheckIcon className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
          </div>
          
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
        </div>

      </div>
    </div>
  );
};

export default ProfileEditor;
