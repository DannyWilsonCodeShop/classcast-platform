'use client';

import React, { useState, useEffect } from 'react';

export interface PeerInteractionStats {
  totalLikes: number;
  averageRating: number;
  totalVideos: number;
  totalResponses: number;
  recentActivity: {
    date: string;
    type: 'like' | 'rating' | 'video' | 'response';
    description: string;
  }[];
}

export interface PeerInteractionStatsProps {
  studentId: string;
  className?: string;
}

export const PeerInteractionStats: React.FC<PeerInteractionStatsProps> = ({
  studentId,
  className = '',
}) => {
  const [stats, setStats] = useState<PeerInteractionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/student/peer-profile?studentId=${studentId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch peer stats: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success && data.stats) {
          setStats(data.stats);
        } else {
          throw new Error(data.error || 'Failed to fetch peer stats');
        }
      } catch (err) {
        console.error('Error fetching peer stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch peer stats');
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchStats();
    }
  }, [studentId]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 rounded-lg h-32"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <span className="text-red-400 mr-2">⚠️</span>
          <span className="text-red-800 text-sm">
            {error || 'Unable to load peer interaction stats'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">👥</span>
        Peer Interaction Stats
      </h3>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{stats.totalLikes}</div>
          <div className="text-sm text-gray-600">Total Likes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {stats.averageRating.toFixed(1)}⭐
          </div>
          <div className="text-sm text-gray-600">Avg Rating</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalVideos}</div>
          <div className="text-sm text-gray-600">Videos Posted</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.totalResponses}</div>
          <div className="text-sm text-gray-600">Peer Responses</div>
        </div>
      </div>

      {/* Recent Activity */}
      {stats.recentActivity && stats.recentActivity.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {stats.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <span className="mr-2">
                  {activity.type === 'like' && '❤️'}
                  {activity.type === 'rating' && '⭐'}
                  {activity.type === 'video' && '🎥'}
                  {activity.type === 'response' && '💬'}
                </span>
                <span className="flex-1">{activity.description}</span>
                <span className="text-xs text-gray-500">
                  {new Date(activity.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engagement Level Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Engagement Level</span>
          <div className="flex items-center space-x-2">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  stats.averageRating >= 4.5 ? 'bg-green-500' :
                  stats.averageRating >= 3.5 ? 'bg-yellow-500' :
                  stats.averageRating >= 2.5 ? 'bg-orange-500' :
                  'bg-red-500'
                }`}
                style={{ 
                  width: `${Math.min((stats.averageRating / 5) * 100, 100)}%` 
                }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">
              {stats.averageRating >= 4.5 ? 'Excellent' :
               stats.averageRating >= 3.5 ? 'Good' :
               stats.averageRating >= 2.5 ? 'Fair' :
               'Needs Improvement'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
