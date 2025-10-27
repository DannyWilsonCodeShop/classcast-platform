'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Avatar from '@/components/common/Avatar';

interface Post {
  id: string;
  title: string;
  content: string;
  userId: string;
  userName: string;
  userAvatar: string;
  timestamp: string;
  likes: number;
  comments: number;
  courseId?: string;
  courseName?: string;
}

const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadPosts();
    }
  }, [user]);

  const loadPosts = async () => {
    try {
      const response = await fetch('/api/community/posts');
      const data = await response.json();
      
      if (data.success && data.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async () => {
    if (!postContent.trim() || submitting || !user) return;
    
    try {
      setSubmitting(true);
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: postContent.substring(0, 100),
          content: postContent,
          userId: user.id
        })
      });

      if (response.ok) {
        setPostContent('');
        setShowComposer(false);
        loadPosts();
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/community/posts/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          userId: user?.id
        })
      });

      if (response.ok) {
        loadPosts();
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-r from-purple-600 to-blue-600 border-b-2 border-white/20 shadow-lg">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-3 p-2 hover:bg-white/20 rounded-full"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">Community</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4">
          {/* Post Composer */}
          {showComposer ? (
            <div className="bg-white rounded-xl p-4 shadow-lg mb-4">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                autoFocus
              />
              <div className="flex items-center justify-end space-x-2 mt-3">
                <button
                  onClick={() => {
                    setShowComposer(false);
                    setPostContent('');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePostSubmit}
                  disabled={!postContent.trim() || submitting}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowComposer(true)}
              className="w-full bg-white rounded-xl p-4 shadow-lg mb-4 text-left flex items-center space-x-3 hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center flex-shrink-0">
                {user?.avatar && !user.avatar.includes('placeholder') ? (
                  <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                  </span>
                )}
              </div>
              <span className="text-gray-500">Share something with your classmates...</span>
            </button>
          )}

          {/* Posts List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-gradient-to-r from-purple-500 via-blue-500 to-pink-500"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-xl shadow-lg">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Yet</h3>
              <p className="text-sm text-gray-600">Be the first to share with your classmates!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl p-4 shadow-lg">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {post.userAvatar && !post.userAvatar.includes('placeholder') ? (
                        <img src={post.userAvatar} alt={post.userName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-semibold text-sm">
                          {post.userName.split(' ').map(n => n[0]).join('')}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{post.userName}</p>
                      <p className="text-xs text-gray-500">{formatTimestamp(post.timestamp)}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap">{post.content}</p>

                  {/* Actions */}
                  <div className="flex items-center space-x-4 text-gray-600 border-t pt-3">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className="flex items-center space-x-2 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="text-sm">{post.likes}</span>
                    </button>
                    <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-sm">{post.comments} comments</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentRoute>
  );
};

export default CommunityPage;

