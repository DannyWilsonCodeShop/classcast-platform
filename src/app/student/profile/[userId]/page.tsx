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
  engagementStats?: {
    videoStats: {
      totalVideos: number;
      totalViews: number;
      totalLikes: number;
      totalComments: number;
      totalRatings: number;
      averageRating: number;
    };
    communityStats: {
      totalPosts: number;
      totalPostLikes: number;
      totalPostComments: number;
      totalPostReactions: number;
      totalComments: number;
      totalCommentLikes: number;
    };
    peerReviewStats: {
      totalResponses: number;
      totalResponseLikes: number;
      totalResponseComments: number;
      averageResponseLength: number;
    };
    engagementStats: {
      totalInteractions: number;
      totalLikesReceived: number;
      totalCommentsReceived: number;
      totalViewsReceived: number;
      totalReactionsReceived: number;
    };
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
        
        // Fetch profile and engagement stats in parallel
        const [profileResponse, statsResponse] = await Promise.all([
          fetch(`/api/students/${userId}/profile`, {
            credentials: 'include'
          }),
          fetch(`/api/users/${userId}/stats`, {
            credentials: 'include'
          })
        ]);
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.success) {
            let profile = profileData.profile;
            
            // Add engagement stats if available
            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              if (statsData.success) {
                profile.engagementStats = statsData.stats;
              }
            }
            
            setProfile(profile);
          } else {
            setError(profileData.error || 'Failed to load profile');
          }
        } else if (profileResponse.status === 404) {
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
                
                <h1 className="text-2xl font-bold text-[#333333]">Student Profile</h1>
                
                {/* MyClassCast Logo */}
                <div className="flex items-center">
                  <img 
                    src="/MyClassCast (800 x 200 px).png" 
                    alt="MyClassCast" 
                    className="h-6 w-auto object-contain"
                  />
                </div>
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
              
              <h1 className="text-2xl font-bold text-[#333333]">Student Profile</h1>
              
              {/* MyClassCast Logo */}
              <div className="flex items-center">
                <img 
                  src="/MyClassCast (800 x 200 px).png" 
                  alt="MyClassCast" 
                  className="h-6 w-auto object-contain"
                />
              </div>
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

            {/* Profile Details - Balanced Layout */}
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Basic Info */}
                <div className="lg:col-span-1 space-y-4">
                  {/* School */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
                    <div className="flex items-center space-x-2">
                      {profile.schoolLogo && (
                        <img 
                          src={profile.schoolLogo} 
                          alt="School Logo" 
                          className="w-4 h-4 object-contain"
                        />
                      )}
                      <p className="text-gray-900 text-sm">{profile.schoolName || 'Not specified'}</p>
                    </div>
                  </div>

                  {/* Favorite Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Subject</label>
                    <p className="text-gray-900 text-sm">{profile.favoriteSubject || 'Not specified'}</p>
                  </div>

                  {/* Hobbies */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hobbies</label>
                    <p className="text-gray-900 text-sm">{profile.hobbies || 'Not specified'}</p>
                  </div>
                </div>

                {/* Right Column - Extended Info */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    <p className="text-gray-900 text-sm">{profile.bio || 'No bio provided'}</p>
                  </div>

                  {/* Career Goals */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Career Goals</label>
                    <p className="text-gray-900 text-sm">{profile.careerGoals || 'No career goals specified'}</p>
                  </div>

                  {/* Fun Fact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fun Fact</label>
                    <p className="text-gray-900 text-sm">{profile.funFact || 'No fun fact provided'}</p>
                  </div>
                </div>
              </div>

              {/* Academic Stats Section */}
              {profile.stats && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-4">📚 Academic Performance</h3>
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

              {/* Engagement Stats Section - Simplified */}
              {profile.engagementStats && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-4">🌟 Total Engagement</h3>
                  
                  {/* Total Engagement Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="text-center">
                        <div className="text-lg sm:text-xl font-bold text-blue-600">{profile.engagementStats.engagementStats.totalInteractions}</div>
                        <div className="text-xs text-gray-600">Total Interactions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-xl font-bold text-red-600">{profile.engagementStats.engagementStats.totalLikesReceived}</div>
                        <div className="text-xs text-gray-600">Total Likes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-xl font-bold text-green-600">{profile.engagementStats.engagementStats.totalViewsReceived}</div>
                        <div className="text-xs text-gray-600">Total Views</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-xl font-bold text-purple-600">{profile.engagementStats.engagementStats.totalCommentsReceived}</div>
                        <div className="text-xs text-gray-600">Total Comments</div>
                      </div>
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
