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
  };
}

const PeerProfilePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<PeerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                  <img
                    src={profile.avatar}
                    alt={fullName}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
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

            {/* Stats Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Activity & Engagement</h2>
                
                {/* Video Stats */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">📹 Video Contributions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{profile.stats.videoStats.totalVideos}</div>
                      <div className="text-sm text-gray-600">Videos</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{profile.stats.videoStats.totalViews}</div>
                      <div className="text-sm text-gray-600">Views</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{profile.stats.videoStats.totalLikes}</div>
                      <div className="text-sm text-gray-600">Likes</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {profile.stats.videoStats.totalRatings > 0 
                          ? profile.stats.videoStats.averageRating.toFixed(1)
                          : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">Avg Rating</div>
                    </div>
                  </div>
                </div>

                {/* Peer Review Stats */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">💬 Peer Reviews</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-indigo-600">{profile.stats.peerReviewStats.totalResponses}</div>
                      <div className="text-sm text-gray-600">Responses Given</div>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-pink-600">
                        {profile.stats.peerReviewStats.averageResponseLength > 0
                          ? Math.round(profile.stats.peerReviewStats.averageResponseLength)
                          : 0}
                      </div>
                      <div className="text-sm text-gray-600">Avg Words/Response</div>
                    </div>
                  </div>
                </div>

                {/* Engagement Stats */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">🌟 Total Engagement</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-rose-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-rose-600">{profile.stats.engagementStats.totalLikesReceived}</div>
                      <div className="text-sm text-gray-600">Likes Received</div>
                    </div>
                    <div className="bg-teal-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-teal-600">{profile.stats.engagementStats.totalViewsReceived}</div>
                      <div className="text-sm text-gray-600">Video Views</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 This is a peer's public profile. You can see their contributions and engagement stats.
                  To view more details or their videos, check the community feed or peer review sections.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentRoute>
  );
};

export default PeerProfilePage;
