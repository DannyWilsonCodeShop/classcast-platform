'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface PeerProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  bio?: string;
  schoolName?: string;
  classOf?: string;
  favoriteSubject?: string;
  hobbies?: string;
  stats: {
    videoStats: {
      totalVideos: number;
      totalViews: number;
      totalLikes: number;
      averageRating: number;
      totalRatings: number;
    };
    peerReviewStats: {
      totalResponses: number;
      averageResponseLength: number;
    };
    engagementStats: {
      totalLikesReceived: number;
      totalViewsReceived: number;
    };
    studyBuddyStats?: {
      totalStudyBuddies: number;
      studyBuddyIds: string[];
    };
  };
}

const PeerProfilePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<PeerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState<any[]>([]);

  const userId = params.userId as string;

  useEffect(() => {
    // If viewing own profile, redirect to main profile page
    if (currentUser && userId === currentUser.id) {
      router.push('/student/profile');
      return;
    }

    if (userId) {
      fetchPeerProfile();
    }
  }, [userId, currentUser]);

  const fetchPeerProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user details
      const userResponse = await fetch(`/api/users/${userId}`, {
        credentials: 'include',
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const userData = await userResponse.json();
      if (!userData.success) {
        throw new Error(userData.error || 'Failed to fetch user profile');
      }

      // Fetch peer stats
      const statsResponse = await fetch(`/api/student/peer-profile?studentId=${userId}`, {
        credentials: 'include',
      });

      let stats = {
        videoStats: { totalVideos: 0, totalViews: 0, totalLikes: 0, averageRating: 0, totalRatings: 0 },
        peerReviewStats: { totalResponses: 0, averageResponseLength: 0 },
        engagementStats: { totalLikesReceived: 0, totalViewsReceived: 0 },
      };

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success && statsData.stats) {
          stats = statsData.stats;
        }
      }

      const peerProfile: PeerProfile = {
        userId: userData.user.userId,
        firstName: userData.user.firstName || '',
        lastName: userData.user.lastName || '',
        email: userData.user.email || '',
        avatar: userData.user.avatar || '',
        bio: userData.user.bio || '',
        schoolName: userData.user.schoolName || '',
        classOf: userData.user.classOf || '',
        favoriteSubject: userData.user.favoriteSubject || '',
        hobbies: userData.user.hobbies || '',
        stats,
      };

      setProfile(peerProfile);

      // Fetch user's videos
      try {
        const videosResponse = await fetch(`/api/submissions?studentId=${userId}`, {
          credentials: 'include',
        });
        
        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          if (videosData.success && videosData.data) {
            setVideos(videosData.data.slice(0, 6)); // Show up to 6 videos
          }
        }
      } catch (videoErr) {
        console.warn('Failed to fetch videos:', videoErr);
      }
    } catch (err) {
      console.error('Error fetching peer profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </StudentRoute>
    );
  }

  if (error || !profile) {
    return (
      <StudentRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">😞</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'Could not load this student\'s profile'}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </StudentRoute>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || 'Student';

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="relative">
                {profile.avatar && !profile.avatar.includes('placeholder') ? (
                  // Check if avatar is an emoji
                  /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(profile.avatar) ? (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-6xl">{profile.avatar}</span>
                    </div>
                  ) : (
                    <img
                      src={profile.avatar}
                      alt={fullName}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        const target = e.target as HTMLImageElement;
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg">${profile.firstName?.[0] || profile.email[0].toUpperCase()}</div>`;
                        }
                      }}
                    />
                  )
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg">
                    {profile.firstName?.[0] || profile.email[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{fullName}</h1>
                {profile.bio && (
                  <p className="text-gray-600 mb-3">{profile.bio}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {profile.schoolName && (
                    <span>🏫 {profile.schoolName}</span>
                  )}
                  {profile.classOf && (
                    <span>🎓 Class of {profile.classOf}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* About Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">About</h2>
                <div className="space-y-4">
                  {profile.favoriteSubject && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Favorite Subject</div>
                      <div className="text-gray-900">{profile.favoriteSubject}</div>
                    </div>
                  )}
                  {profile.hobbies && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Hobbies</div>
                      <div className="text-gray-900">{profile.hobbies}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Section - 5 Categories including Study Buddies */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Activity & Engagement</h2>
                
                {/* 5 Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center border border-blue-200">
                    <div className="text-2xl md:text-3xl font-bold text-blue-600">{profile.stats.videoStats.totalVideos}</div>
                    <div className="text-xs md:text-sm text-gray-700 font-medium mt-1">Videos</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center border border-green-200">
                    <div className="text-2xl md:text-3xl font-bold text-green-600">{profile.stats.videoStats.totalViews}</div>
                    <div className="text-xs md:text-sm text-gray-700 font-medium mt-1">Views</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 text-center border border-red-200">
                    <div className="text-2xl md:text-3xl font-bold text-red-600">{profile.stats.videoStats.totalLikes}</div>
                    <div className="text-xs md:text-sm text-gray-700 font-medium mt-1">Likes</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 text-center border border-yellow-200">
                    <div className="text-2xl md:text-3xl font-bold text-yellow-600">
                      {profile.stats.videoStats.averageRating > 0 
                        ? profile.stats.videoStats.averageRating.toFixed(1) 
                        : '0.0'}
                    </div>
                    <div className="text-xs md:text-sm text-gray-700 font-medium mt-1">Avg Rating</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center border border-purple-200">
                    <div className="text-2xl md:text-3xl font-bold text-purple-600">
                      {profile.stats.studyBuddyStats?.totalStudyBuddies || 0}
                    </div>
                    <div className="text-xs md:text-sm text-gray-700 font-medium mt-1">Study Buddies</div>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 This is a peer's public profile. You can see their contributions and engagement stats.
                </p>
              </div>
            </div>
          </div>

          {/* Videos Section */}
          {videos.length > 0 && (
            <div className="mt-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">🎬 Recent Videos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {videos.map((video) => (
                    <div
                      key={video.submissionId}
                      className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        if (video.assignmentId) {
                          router.push(`/student/peer-reviews?assignmentId=${video.assignmentId}&videoId=${video.submissionId}`);
                        }
                      }}
                    >
                      <div className="aspect-video bg-gray-900 relative">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.videoTitle || 'Video'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white">
                            <span className="text-4xl">🎥</span>
                          </div>
                        )}
                        {video.duration && (
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                          {video.videoTitle || 'Untitled Video'}
                        </h3>
                        {video.submittedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(video.submittedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentRoute>
  );
};

export default PeerProfilePage;
