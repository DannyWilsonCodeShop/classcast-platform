'use client';

import React, { useState, useEffect } from 'react';
import { SocialAnalytics, ActivityItem } from '@/types/social-analytics';
import { 
  EyeIcon, 
  HeartIcon, 
  ChatBubbleLeftIcon, 
  ShareIcon, 
  StarIcon,
  UserGroupIcon,
  ChartBarIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';

interface SocialAnalyticsProps {
  userId: string;
  className?: string;
}

const SocialAnalytics: React.FC<SocialAnalyticsProps> = ({ userId, className = '' }) => {
  const [analytics, setAnalytics] = useState<SocialAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [userId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student/social-analytics?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching social analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Unable to load analytics</p>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getEngagementColor = (rate: number): string => {
    if (rate >= 0.1) return 'text-green-600';
    if (rate >= 0.05) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
          Social Analytics
        </h3>
        <span className="text-sm text-gray-500">
          Updated {new Date(analytics.updatedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <VideoCameraIcon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
          <div className="text-2xl font-bold text-gray-900">{analytics.totalVideos}</div>
          <div className="text-sm text-gray-600">Videos</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <EyeIcon className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalViews)}</div>
          <div className="text-sm text-gray-600">Views</div>
        </div>
        
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <HeartIcon className="h-8 w-8 mx-auto mb-2 text-red-600" />
          <div className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalLikes)}</div>
          <div className="text-sm text-gray-600">Likes</div>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <StarIcon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
          <div className="text-2xl font-bold text-gray-900">
            {analytics.averageRating > 0 ? analytics.averageRating.toFixed(1) : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Avg Rating</div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <ChatBubbleLeftIcon className="h-6 w-6 mx-auto mb-1 text-gray-600" />
          <div className="text-lg font-semibold text-gray-900">{formatNumber(analytics.totalComments)}</div>
          <div className="text-xs text-gray-600">Comments</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <ShareIcon className="h-6 w-6 mx-auto mb-1 text-gray-600" />
          <div className="text-lg font-semibold text-gray-900">{formatNumber(analytics.totalShares)}</div>
          <div className="text-xs text-gray-600">Shares</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <UserGroupIcon className="h-6 w-6 mx-auto mb-1 text-gray-600" />
          <div className="text-lg font-semibold text-gray-900">{formatNumber(analytics.followers)}</div>
          <div className="text-xs text-gray-600">Followers</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <ChartBarIcon className="h-6 w-6 mx-auto mb-1 text-gray-600" />
          <div className={`text-lg font-semibold ${getEngagementColor(analytics.engagementRate)}`}>
            {(analytics.engagementRate * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600">Engagement</div>
        </div>
      </div>

      {/* Top Performing Video */}
      {analytics.topPerformingVideo && (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
            <StarIcon className="h-4 w-4 mr-1 text-yellow-600" />
            Top Performing Video
          </h4>
          <div className="text-sm text-gray-700">
            <p className="font-medium">{analytics.topPerformingVideo.title}</p>
            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
              <span>{formatNumber(analytics.topPerformingVideo.views)} views</span>
              <span>{formatNumber(analytics.topPerformingVideo.likes)} likes</span>
              <span>{analytics.topPerformingVideo.rating.toFixed(1)}★</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {analytics.recentActivity.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {analytics.recentActivity.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">{activity.description}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {analytics.totalVideos === 0 && (
        <div className="text-center py-8">
          <VideoCameraIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Content Yet</h4>
          <p className="text-gray-600 mb-4">Start creating videos to see your analytics here!</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Create Your First Video
          </button>
        </div>
      )}
    </div>
  );
};

export default SocialAnalytics;
