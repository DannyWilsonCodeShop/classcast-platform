'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const InstructorProfilePage: React.FC = () => {
  console.log('InstructorProfilePage component starting - SIMPLE VERSION');
  
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isUploading, setIsUploading] = useState(false);
  
  // Update avatar state when user context changes
  React.useEffect(() => {
    if (user?.avatar && user.avatar !== avatar) {
      setAvatar(user.avatar);
    }
  }, [user?.avatar, avatar]);
  
  console.log('InstructorProfilePage rendering, user:', user, 'isEditing:', isEditing);

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Convert to base64 for immediate preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          setAvatar(dataUrl);
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert('Error uploading avatar');
      setIsUploading(false);
    }
  };

  // Form validation
  const validateForm = (formData: FormData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const favoriteSubject = formData.get('favoriteSubject') as string;
    const hobbies = formData.get('hobbies') as string;
    const classOf = formData.get('classOf') as string;

    if (!firstName?.trim()) errors.push('First name is required');
    if (!lastName?.trim()) errors.push('Last name is required');
    if (!email?.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please enter a valid email address');
    }
    if (!favoriteSubject?.trim()) errors.push('Favorite subject is required');
    if (!hobbies?.trim()) errors.push('Hobbies and interests are required');
    if (!classOf?.trim()) errors.push('Class of is required');

    return { isValid: errors.length === 0, errors };
  };

  if (!user) {
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
              <button
                onClick={() => router.push('/instructor/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                title="Back to Dashboard"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
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
          {isEditing ? (
            <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  console.log('Form submitted!');
                  
                  try {
                    const formData = new FormData(e.currentTarget);
                    
                    // Validate form
                    const validation = validateForm(formData);
                    if (!validation.isValid) {
                      alert('Please fix the following errors:\n' + validation.errors.join('\n'));
                      return;
                    }
                    const profileData = {
                      userId: user?.id || user?.userId || 'test-user-123',
                      firstName: formData.get('firstName') as string || '',
                      lastName: formData.get('lastName') as string || '',
                      email: formData.get('email') as string || '',
                      bio: formData.get('bio') as string || '',
                      favoriteSubject: formData.get('favoriteSubject') as string || '',
                      hobbies: formData.get('hobbies') as string || '',
                      classOf: formData.get('classOf') as string || '',
                      funFact: formData.get('funFact') as string || '',
                      schoolName: formData.get('schoolName') as string || '',
                      avatar: avatar, // Include the avatar
                    };
                    
                    console.log('Saving profile:', profileData);
                    
                    const response = await fetch('/api/profile/save', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(profileData),
                    });
                    
                    console.log('Response status:', response.status);
                    
                    if (response.ok) {
                      const result = await response.json();
                      console.log('Profile saved successfully:', result);
                      
                      // Update user context with new data
                      console.log('Updating user context with:', {
                        firstName: profileData.firstName,
                        lastName: profileData.lastName,
                        email: profileData.email,
                        bio: profileData.bio,
                        favoriteSubject: profileData.favoriteSubject,
                        hobbies: profileData.hobbies,
                        classOf: profileData.classOf,
                        funFact: profileData.funFact,
                        schoolName: profileData.schoolName,
                        avatar: result.data.avatar || profileData.avatar,
                      });
                      
                      try {
                        updateUser({
                          firstName: profileData.firstName,
                          lastName: profileData.lastName,
                          email: profileData.email,
                          bio: profileData.bio,
                          favoriteSubject: profileData.favoriteSubject,
                          hobbies: profileData.hobbies,
                          classOf: profileData.classOf,
                          funFact: profileData.funFact,
                          schoolName: profileData.schoolName,
                          avatar: result.data.avatar || profileData.avatar,
                        });
                        console.log('User context updated successfully');
                      } catch (updateError) {
                        console.error('Error updating user context:', updateError);
                      }
                      
                      alert('Profile saved successfully!');
                      setIsEditing(false);
                    } else {
                      const errorText = await response.text();
                      console.error('Save failed:', response.status, errorText);
                      alert(`Failed to save profile (${response.status}). Please try again.`);
                    }
                  } catch (error) {
                    console.error('Error saving profile:', error);
                    alert('Error saving profile. Please try again.');
                  }
                }}>
                  <div className="space-y-4">
                    {/* Avatar Upload Section */}
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-gray-200">
                          <img
                            src={avatar || '/api/placeholder/100/100'}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <input
                          type="file"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          id="avatar-upload"
                        />
                        <label
                          htmlFor="avatar-upload"
                          className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 text-xs shadow-md hover:bg-blue-600 transition-colors cursor-pointer"
                          title="Change Profile Picture"
                        >
                          📷
                        </label>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Profile Picture</h3>
                        <p className="text-sm text-gray-500">JPG, PNG, GIF, or WebP. Max 5MB.</p>
                        {isUploading && (
                          <div className="flex items-center mt-2 text-blue-600 text-sm">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          defaultValue={user.firstName || ''}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          defaultValue={user.lastName || ''}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          defaultValue={user.email || ''}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">School Name</label>
                        <input
                          type="text"
                          name="schoolName"
                          defaultValue={user.schoolName || ''}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bio</label>
                      <textarea
                        name="bio"
                        defaultValue={user.bio || ''}
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Favorite Subject <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="favoriteSubject"
                        defaultValue={user.favoriteSubject || ''}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Hobbies & Interests <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="hobbies"
                        defaultValue={user.hobbies || ''}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Class Of <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="classOf"
                          defaultValue={user.classOf || ''}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Fun Fact</label>
                        <input
                          type="text"
                          name="funFact"
                          defaultValue={user.funFact || ''}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              {/* Profile Header */}
              <div className="bg-[#4A90E2] p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                      <img
                        src={avatar || user.avatar || '/api/placeholder/100/100'}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {user.firstName} {user.lastName}
                      </h2>
                      <p className="text-white/80">{user.email}</p>
                      <p className="text-white/60 text-sm">Instructor</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-white text-[#4A90E2] rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>

              {/* Profile Details */}
              <div className="p-6">
                <div className="space-y-4">
                  {user.bio && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Bio</p>
                      <p className="text-lg text-gray-900">{user.bio}</p>
                    </div>
                  )}
                  {user.schoolName && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">School</p>
                      <p className="text-lg text-gray-900">{user.schoolName}</p>
                    </div>
                  )}
                  {user.favoriteSubject && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Favorite Subject</p>
                      <p className="text-lg text-gray-900">{user.favoriteSubject}</p>
                    </div>
                  )}
                  {user.hobbies && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Hobbies & Interests</p>
                      <p className="text-lg text-gray-900">{user.hobbies}</p>
                    </div>
                  )}
                  {user.careerGoals && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Career Goals</p>
                      <p className="text-lg text-gray-900">{user.careerGoals}</p>
                    </div>
                  )}
                  {user.classOf && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Class Of</p>
                      <p className="text-lg text-gray-900">{user.classOf}</p>
                    </div>
                  )}
                  {user.funFact && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Fun Fact</p>
                      <p className="text-lg text-gray-900">{user.funFact}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </InstructorRoute>
  );
};

export default InstructorProfilePage;