'use client';

import React, { useState, useEffect } from 'react';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface ModerationPost {
  id: string;
  type: 'community_post' | 'community_comment' | 'peer_response' | 'video_submission';
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  courseId?: string;
  postId?: string;
  videoId?: string;
  assignmentId?: string;
}

const InstructorModerationPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<ModerationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'posts' | 'comments' | 'responses' | 'submissions'>('all');
  const [removingPost, setRemovingPost] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/instructor/moderation/posts?type=${filter}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPosts(data.posts || []);
        } else {
          setError(data.error || 'Failed to fetch posts');
        }
      } else {
        setError('Failed to fetch posts for moderation');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to fetch posts for moderation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePost = async (post: ModerationPost, reason: string) => {
    try {
      setRemovingPost(post.id);
      
      const response = await fetch('/api/instructor/moderation/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          postId: post.id,
          postType: post.type,
          reason: reason
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Post removed:', data);
        
        // Remove post from local state
        setPosts(prev => prev.filter(p => p.id !== post.id));
        
        alert(`✅ ${post.type.replace('_', ' ')} has been removed.\n\nReason: ${reason}`);
      } else {
        const errorData = await response.json();
        console.error('❌ Post removal failed:', errorData);
        alert(`❌ Failed to remove post: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error removing post:', error);
      alert('❌ Failed to remove post. Please try again.');
    } finally {
      setRemovingPost(null);
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'community_post':
        return '📝';
      case 'community_comment':
        return '💬';
      case 'peer_response':
        return '🤝';
      case 'video_submission':
        return '🎥';
      default:
        return '📄';
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'community_post':
        return 'Community Post';
      case 'community_comment':
        return 'Comment';
      case 'peer_response':
        return 'Peer Response';
      case 'video_submission':
        return 'Video Submission';
      default:
        return 'Post';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <InstructorRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </InstructorRoute>
    );
  }

  return (
    <InstructorRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-indigo-600/20 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/instructor/dashboard')}
                className="text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Content Moderation</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {[
                { key: 'all', label: 'All Content' },
                { key: 'posts', label: 'Posts' },
                { key: 'comments', label: 'Comments' },
                { key: 'responses', label: 'Responses' },
                { key: 'submissions', label: 'Videos' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === tab.key
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Posts List */}
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛡️</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Content to Moderate</h3>
              <p className="text-gray-600">All content appears to be appropriate.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">{getPostTypeIcon(post.type)}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{post.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{getPostTypeLabel(post.type)}</span>
                            <span>by {post.authorName}</span>
                            <span>{formatDate(post.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          const reason = prompt('Reason for removal:');
                          if (reason && reason.trim()) {
                            handleRemovePost(post, reason.trim());
                          }
                        }}
                        disabled={removingPost === post.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        {removingPost === post.id ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Removing...</span>
                          </div>
                        ) : (
                          'Remove'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </InstructorRoute>
  );
};

export default InstructorModerationPage;
