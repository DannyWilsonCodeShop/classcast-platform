'use client';

import React, { useState, useEffect } from 'react';
import { Star, Eye, Heart, MessageCircle, Users, Video, TrendingUp } from 'lucide-react';
import { ContentCreatorProfile as CreatorProfile } from '@/types/video-interactions';

interface ContentCreatorProfileProps {
  userId: string;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
}

const ContentCreatorProfile: React.FC<ContentCreatorProfileProps> = ({
  userId,
  onFollow,
  onUnfollow
}) => {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    loadCreatorProfile();
  }, [userId]);

  const loadCreatorProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/creator-profile`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setIsFollowing(data.isFollowing || false);
      }
    } catch (error) {
      console.error('Error loading creator profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        if (isFollowing) {
          onUnfollow?.(userId);
          setProfile(prev => prev ? { ...prev, followers: prev.followers - 1 } : null);
        } else {
          onFollow?.(userId);
          setProfile(prev => prev ? { ...prev, followers: prev.followers + 1 } : null);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 text-center">
        <div className="text-6xl mb-4">👤</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Creator Not Found</h3>
        <p className="text-gray-600">This content creator's profile is not available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
      {/* Profile Header */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
          {profile.userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{profile.userName}</h2>
          <p className="text-sm text-gray-600">Content Creator</p>
          {profile.bio && (
            <p className="text-sm text-gray-700 mt-1">{profile.bio}</p>
          )}
        </div>
        <button
          onClick={handleFollowToggle}
          className={`px-4 py-2 rounded-xl font-bold transition-all duration-200 ${
            isFollowing
              ? 'bg-gray-500 text-white hover:bg-gray-600'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
          }`}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 text-center">
          <Video className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-900">{profile.totalVideos}</div>
          <div className="text-xs text-blue-700">Videos</div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 text-center">
          <Eye className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-900">{profile.totalViews.toLocaleString()}</div>
          <div className="text-xs text-green-700">Views</div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 text-center">
          <Heart className="w-6 h-6 text-red-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-red-900">{profile.totalLikes.toLocaleString()}</div>
          <div className="text-xs text-red-700">Likes</div>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4 text-center">
          <Star className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-yellow-900">{profile.averageRating.toFixed(1)}</div>
          <div className="text-xs text-yellow-700">Rating</div>
        </div>
      </div>

      {/* Social Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 text-center">
          <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <div className="text-xl font-bold text-purple-900">{profile.followers}</div>
          <div className="text-xs text-purple-700">Followers</div>
        </div>

        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-4 text-center">
          <Users className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
          <div className="text-xl font-bold text-indigo-900">{profile.following}</div>
          <div className="text-xs text-indigo-700">Following</div>
        </div>
      </div>

      {/* Rating Breakdown */}
      {profile.totalRatings > 0 && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Content Quality Rating</h3>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="font-bold text-gray-900">{profile.averageRating.toFixed(1)}</span>
              <span className="text-sm text-gray-600">({profile.totalRatings} ratings)</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(profile.averageRating / 5) * 100}%` }}
              ></div>
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
        </div>
      )}

      {/* Join Date */}
      <div className="text-center text-sm text-gray-500 mt-4">
        Joined {new Date(profile.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
};

export default ContentCreatorProfile;