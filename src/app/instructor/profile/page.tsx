'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const InstructorProfilePage: React.FC = () => {
  console.log('InstructorProfilePage component starting - SIMPLE VERSION');
  
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  
  console.log('InstructorProfilePage rendering, user:', user, 'isEditing:', isEditing);

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
                    const profileData = {
                      userId: user?.id || user?.userId || 'test-user-123',
                      firstName: formData.get('firstName') as string || '',
                      lastName: formData.get('lastName') as string || '',
                      email: formData.get('email') as string || '',
                      bio: formData.get('bio') as string || '',
                      favoriteSubject: formData.get('favoriteSubject') as string || '',
                      hobbies: formData.get('hobbies') as string || '',
                      careerGoals: formData.get('careerGoals') as string || '',
                      classOf: formData.get('classOf') as string || '',
                      funFact: formData.get('funFact') as string || '',
                      schoolName: formData.get('schoolName') as string || '',
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          defaultValue={user.firstName || ''}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          defaultValue={user.lastName || ''}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          name="email"
                          defaultValue={user.email || ''}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                      <label className="block text-sm font-medium text-gray-700">Favorite Subject</label>
                      <input
                        type="text"
                        name="favoriteSubject"
                        defaultValue={user.favoriteSubject || ''}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hobbies & Interests</label>
                      <input
                        type="text"
                        name="hobbies"
                        defaultValue={user.hobbies || ''}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Career Goals</label>
                      <textarea
                        name="careerGoals"
                        defaultValue={user.careerGoals || ''}
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Class Of</label>
                        <input
                          type="text"
                          name="classOf"
                          defaultValue={user.classOf || ''}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#4A90E2] font-bold text-2xl shadow-lg">
                      {user.firstName?.charAt(0) || 'I'}{user.lastName?.charAt(0) || ''}
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