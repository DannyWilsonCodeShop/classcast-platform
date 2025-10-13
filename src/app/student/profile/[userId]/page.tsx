'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import Avatar from '@/components/common/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  bio?: string;
  careerGoals?: string;
  classOf?: string;
  funFact?: string;
  favoriteSubject?: string;
  hobbies?: string;
  schoolName?: string;
  schoolLogo?: string;
  enrollmentDate?: string;
  lastActive?: string;
  courses?: Array<{
    id: string;
    name: string;
    code: string;
    instructor: string;
  }>;
  stats?: {
    totalSubmissions: number;
    averageGrade: number;
    completedAssignments: number;
  };
}

const StudentProfileViewPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/students/${userId}/profile`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setProfile(data.profile);
          } else {
            setError(data.error || 'Failed to load profile');
          }
        } else if (response.status === 404) {
          setError('Student profile not found');
        } else {
          setError('Failed to load profile');
        }
      } catch (error) {
        console.error('Error fetching student profile:', error);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentProfile();
  }, [userId]);

  if (isLoading) {
    return (
      <StudentRoute>
        <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </StudentRoute>
    );
  }

  if (error) {
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
                
                {/* ClassCast Logo */}
                <div className="flex items-center">
                  <img 
                    src="/ClassCast Logo.png" 
                    alt="ClassCast" 
                    className="h-8 w-auto object-contain"
                  />
                </div>
                <h1 className="text-2xl font-bold text-[#333333]">Student Profile</h1>
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-6xl mb-4">😕</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors font-medium"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </StudentRoute>
    );
  }

  if (!profile) {
    return (
      <StudentRoute>
        <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">👤</div>
            <p className="text-gray-600">No profile data available</p>
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
              
              {/* ClassCast Logo */}
              <div className="flex items-center">
                <img 
                  src="/ClassCast Logo.png" 
                  alt="ClassCast" 
                  className="h-8 w-auto object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-[#333333]">Student Profile</h1>
            </div>
          </div>
        </div>

        {/* Main Content - Mobile Optimized */}
        <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
          {/* Profile Card - Mobile Optimized */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Profile Header - Mobile Optimized */}
            <div className="bg-gradient-to-r from-[#4A90E2] to-[#357ABD] p-4 sm:p-6 text-white">
              <div className="flex items-center space-x-3 sm:space-x-4">
                {/* Avatar */}
                <div className="relative">
                  <Avatar
                    user={profile}
                    size="lg"
                    showBorder={true}
                    className="border-white"
                  />
                </div>

                {/* Name and Info - Mobile Optimized */}
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-bold">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <p className="text-white/80 text-sm sm:text-base">Student</p>
                  {profile.classOf && (
                    <p className="text-white/70 text-xs sm:text-sm">Class of {profile.classOf}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Details - Mobile Optimized */}
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* School */}
                {profile.schoolName && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">School</label>
                    <div className="flex items-center space-x-2">
                      {profile.schoolLogo && (
                        <img 
                          src={profile.schoolLogo} 
                          alt="School Logo" 
                          className="w-4 h-4 object-contain"
                        />
                      )}
                      <p className="text-gray-900 text-sm sm:text-base">{profile.schoolName}</p>
                    </div>
                  </div>
                )}

                {/* Favorite Subject */}
                {profile.favoriteSubject && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Favorite Subject</label>
                    <p className="text-gray-900 text-sm sm:text-base">{profile.favoriteSubject}</p>
                  </div>
                )}

                {/* Bio */}
                {profile.bio && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Bio</label>
                    <p className="text-gray-900 text-sm sm:text-base">{profile.bio}</p>
                  </div>
                )}

                {/* Career Goals */}
                {profile.careerGoals && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Career Goals</label>
                    <p className="text-gray-900 text-sm sm:text-base">{profile.careerGoals}</p>
                  </div>
                )}

                {/* Hobbies */}
                {profile.hobbies && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Hobbies</label>
                    <p className="text-gray-900 text-sm sm:text-base">{profile.hobbies}</p>
                  </div>
                )}

                {/* Fun Fact */}
                {profile.funFact && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Fun Fact</label>
                    <p className="text-gray-900 text-sm sm:text-base">{profile.funFact}</p>
                  </div>
                )}
              </div>

              {/* Stats Section */}
              {profile.stats && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-4">Activity Stats</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-[#4A90E2]">{profile.stats.totalSubmissions}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Submissions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-[#4A90E2]">{profile.stats.completedAssignments}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-[#4A90E2]">{profile.stats.averageGrade}%</div>
                      <div className="text-xs sm:text-sm text-gray-600">Average</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Courses Section */}
              {profile.courses && profile.courses.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-4">Enrolled Courses</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {profile.courses.map((course) => (
                      <div key={course.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-sm text-gray-900">{course.name}</div>
                        <div className="text-xs text-gray-600">{course.code}</div>
                        <div className="text-xs text-gray-500">Instructor: {course.instructor}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentRoute>
  );
};

export default StudentProfileViewPage;
