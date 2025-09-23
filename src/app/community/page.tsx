'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface CommunityPost {
  id: string;
  author: string;
  authorRole: 'student' | 'instructor';
  title: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  tags: string[];
  reactions: {
    like: number;
    love: number;
    helpful: number;
    celebrate: number;
  };
  isLiked: boolean;
  isBookmarked: boolean;
  trending: boolean;
  pinned: boolean;
  isAnnouncement?: boolean;
}

export default function CommunityPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState({ title: '', content: '' });

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    // Load community posts
    loadPosts();
  }, [user, isAuthenticated, isLoading, router]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      
      // Load posts from API
      const response = await fetch('/api/community/posts');
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;

    try {
      // Create post via API
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content,
        }),
      });

      if (response.ok) {
        const createdPost = await response.json();
        setPosts([createdPost, ...posts]);
        setNewPost({ title: '', content: '' });
      } else {
        console.error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleReaction = (postId: string, reactionType: keyof CommunityPost['reactions']) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          reactions: {
            ...post.reactions,
            [reactionType]: post.reactions[reactionType] + 1
          }
        };
      }
      return post;
    }));
  };

  const handleBookmark = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isBookmarked: !post.isBookmarked
        };
      }
      return post;
    }));
  };

  const trendingTopics = [
    { tag: 'ai-tools', count: 23, trend: 'up' },
    { tag: 'study-group', count: 18, trend: 'up' },
    { tag: 'assignments', count: 15, trend: 'down' },
    { tag: 'feedback', count: 12, trend: 'up' },
    { tag: 'research', count: 9, trend: 'up' }
  ];

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading community..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Branded Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-[#4A90E2]/20 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Left Side - Back Button and MyClassCast Logo */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Go back"
            >
              <span className="text-xl">&lt;</span>
            </button>
            <img
              src="/MyClassCast (800 x 200 px).png"
              alt="MyClassCast"
              className="h-8 w-auto object-contain"
            />
          </div>
          
          {/* Right Side - Home Button */}
          <div className="flex items-center">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Home Dashboard"
            >
              <span className="text-xl">🏠</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Community</h1>
          <p className="text-gray-600 mt-2">Stay updated with announcements from instructors and connect with fellow students</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Create Post Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Create a Post</h2>
              <form onSubmit={handleSubmitPost}>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Post title..."
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <textarea
                    placeholder="What's on your mind?"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Post
                </button>
              </form>
            </div>

            {/* Posts Feed */}
            <div className="space-y-8">
              {/* Announcements Section */}
              {posts.filter(post => post.isAnnouncement).length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">📢</span>
                    Instructor Announcements
                  </h2>
                  <div className="space-y-4">
                    {posts.filter(post => post.isAnnouncement).map((post) => (
                      <div key={post.id} className="bg-white rounded-xl shadow-sm border border-blue-300 p-6 hover:shadow-md transition-shadow bg-gradient-to-r from-blue-50 to-indigo-50">
                        {/* Post Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold bg-blue-600">
                              {post.author.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900">{post.author}</h3>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                  📢 Announcement
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">{post.timestamp}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {post.authorRole}
                            </span>
                            <button
                              onClick={() => handleBookmark(post.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                post.isBookmarked 
                                  ? 'text-yellow-600 bg-yellow-100' 
                                  : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                              }`}
                            >
                              <svg className="w-4 h-4" fill={post.isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        {/* Post Content */}
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h4>
                        <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>
                        
                        {/* Tags */}
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map((tag, index) => (
                              <span key={index} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 cursor-pointer transition-colors">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Reactions and Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleReaction(post.id, 'like')}
                                className="flex items-center space-x-1 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
                              >
                                <span>👍</span>
                                <span className="text-sm text-gray-600">{post.reactions.like}</span>
                              </button>
                              <button
                                onClick={() => handleReaction(post.id, 'love')}
                                className="flex items-center space-x-1 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
                              >
                                <span>❤️</span>
                                <span className="text-sm text-gray-600">{post.reactions.love}</span>
                              </button>
                              <button
                                onClick={() => handleReaction(post.id, 'helpful')}
                                className="flex items-center space-x-1 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
                              >
                                <span>💡</span>
                                <span className="text-sm text-gray-600">{post.reactions.helpful}</span>
                              </button>
                              <button
                                onClick={() => handleReaction(post.id, 'celebrate')}
                                className="flex items-center space-x-1 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
                              >
                                <span>🎉</span>
                                <span className="text-sm text-gray-600">{post.reactions.celebrate}</span>
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                              <span>💬</span>
                              <span>{post.comments}</span>
                            </button>
                            <button className="hover:text-blue-600 transition-colors">Share</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Posts Section */}
              {posts.filter(post => !post.isAnnouncement).length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">💬</span>
                    Student Posts
                  </h2>
                  <div className="space-y-4">
                    {posts.filter(post => !post.isAnnouncement).map((post) => (
                      <div key={post.id} className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${
                        post.pinned 
                          ? 'ring-2 ring-blue-200 bg-blue-50 border-gray-200' 
                          : 'border-gray-200'
                      }`}>
                        {/* Post Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                              post.authorRole === 'instructor' ? 'bg-blue-600' : 'bg-green-600'
                            }`}>
                              {post.author.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900">{post.author}</h3>
                                {post.trending && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                                    🔥 Trending
                                  </span>
                                )}
                                {post.pinned && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                    📌 Pinned
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{post.timestamp}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              post.authorRole === 'instructor' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {post.authorRole}
                            </span>
                            <button
                              onClick={() => handleBookmark(post.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                post.isBookmarked 
                                  ? 'text-yellow-600 bg-yellow-100' 
                                  : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                              }`}
                            >
                              <svg className="w-4 h-4" fill={post.isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        {/* Post Content */}
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h4>
                        <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>
                        
                        {/* Tags */}
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map((tag, index) => (
                              <span key={index} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 cursor-pointer transition-colors">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Reactions and Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleReaction(post.id, 'like')}
                                className="flex items-center space-x-1 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
                              >
                                <span>👍</span>
                                <span className="text-sm text-gray-600">{post.reactions.like}</span>
                              </button>
                              <button
                                onClick={() => handleReaction(post.id, 'love')}
                                className="flex items-center space-x-1 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
                              >
                                <span>❤️</span>
                                <span className="text-sm text-gray-600">{post.reactions.love}</span>
                              </button>
                              <button
                                onClick={() => handleReaction(post.id, 'helpful')}
                                className="flex items-center space-x-1 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
                              >
                                <span>💡</span>
                                <span className="text-sm text-gray-600">{post.reactions.helpful}</span>
                              </button>
                              <button
                                onClick={() => handleReaction(post.id, 'celebrate')}
                                className="flex items-center space-x-1 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
                              >
                                <span>🎉</span>
                                <span className="text-sm text-gray-600">{post.reactions.celebrate}</span>
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                              <span>💬</span>
                              <span>{post.comments}</span>
                            </button>
                            <button className="hover:text-blue-600 transition-colors">Share</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Posts</span>
                  <span className="font-semibold text-2xl text-gray-900">{posts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Users</span>
                  <span className="font-semibold text-2xl text-gray-900">1,247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">This Week</span>
                  <span className="font-semibold text-2xl text-gray-900">89</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Online Now</span>
                  <span className="font-semibold text-2xl text-green-600">23</span>
                </div>
              </div>
            </div>

            {/* Trending Topics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔥 Trending Topics</h3>
              <div className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">#{topic.tag}</span>
                      <span className="text-xs text-gray-500">{topic.count} posts</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className={`text-xs ${
                        topic.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {topic.trend === 'up' ? '↗️' : '↘️'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  <span className="text-lg">📝</span>
                  <span className="font-medium">Create Study Group</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                  <span className="text-lg">❓</span>
                  <span className="font-medium">Ask a Question</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                  <span className="text-lg">💡</span>
                  <span className="font-medium">Share a Resource</span>
                </button>
              </div>
            </div>

            {/* Online Users */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Online Now</h3>
              <div className="flex flex-wrap gap-2">
                {['Alex', 'Maria', 'John', 'Sarah', 'Mike', 'Emma', 'David', 'Lisa'].map((name, index) => (
                  <div key={index} className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
