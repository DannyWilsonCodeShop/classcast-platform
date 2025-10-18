'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { communityService, CommunityStats, TrendingTopic, OnlineUser } from '@/services/communityService';
import { EmptyCommunityState } from '@/components/common/EmptyStateAdvanced';
import Avatar from '@/components/common/Avatar';

interface CommunityPost {
  id: string;
  author: string;
  authorAvatar?: string;
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
  const [newPost, setNewPost] = useState({ title: '', content: '', courseId: '' });
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [userCourses, setUserCourses] = useState<any[]>([]);
  const [showQuickActionModal, setShowQuickActionModal] = useState(false);
  const [quickActionData, setQuickActionData] = useState<{title: string, content: string, color: string} | null>(null);
  const [editableQuickActionContent, setEditableQuickActionContent] = useState('');

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    // Load community data
    loadCommunityData();
  }, [user, isAuthenticated, isLoading, router]);

  const loadUserCourses = async () => {
    try {
      const response = await fetch(`/api/student/courses?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserCourses(data.courses || []);
        return data.courses || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading user courses:', error);
      return [];
    }
  };

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      setStatsLoading(true);
      
      // Load posts, courses, and community data in parallel
      const [postsData, courses, stats, topics, users] = await Promise.all([
        loadPosts(),
        loadUserCourses(),
        communityService.getCommunityStats(),
        communityService.getTrendingTopics(),
        communityService.getOnlineUsers()
      ]);

      setCommunityStats(stats);
      setTrendingTopics(topics);
      setOnlineUsers(users);
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      // Load posts from API with userId to filter by enrolled courses
      const response = await fetch(`/api/community/posts?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.posts) {
          setPosts(data.posts);
          return data.posts;
        } else {
          console.error('API returned error:', data.error);
          setPosts([]);
          return [];
        }
      } else {
        console.error('Failed to fetch posts:', response.status);
        setPosts([]);
        return [];
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
      return [];
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('Please enter both a title and content for your post');
      return;
    }

    if (!user?.id) {
      alert('You must be logged in to create a post');
      return;
    }

    try {
      console.log('Creating post:', { title: newPost.title, userId: user.id });
      
      // Create post via API
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content,
          userId: user.id,
          courseId: newPost.courseId || null,
          isAnnouncement: false
        }),
      });

      console.log('Post creation response status:', response.status);
      const data = await response.json();
      console.log('Post creation response data:', data);

      if (response.ok && data.success) {
        console.log('✅ Post created successfully!');
        // Reload all posts to get the updated list
        await loadPosts();
        // Clear form
        setNewPost({ title: '', content: '', courseId: '' });
        // Show success message
        alert('Post created successfully!');
      } else {
        console.error('Failed to create post:', data.error || response.statusText);
        alert(`Failed to create post: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('An error occurred while creating your post. Please try again.');
    }
  };

  const handleReaction = async (postId: string, reactionType: keyof CommunityPost['reactions']) => {
    if (!user?.id) {
      console.error('No user ID available for reaction');
      return;
    }

    try {
      console.log('🎯 Adding reaction:', { postId, reactionType, userId: user.id });
      
      const response = await fetch('/api/community/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          postId,
          userId: user.id,
          reactionType
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Reaction added successfully:', data);
        
        // Update local state with new reaction counts
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              reactions: {
                ...post.reactions,
                ...data.reactions
              }
            };
          }
          return post;
        }));
      } else {
        const errorData = await response.text();
        console.error('❌ Reaction API failed:', response.status, errorData);
        alert('Failed to add reaction. Please try again.');
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      alert('Failed to add reaction. Please try again.');
    }
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

  const handleQuickAction = (title: string, content: string, color: string) => {
    setQuickActionData({ title, content, color });
    setEditableQuickActionContent(content); // Initialize with template content
    setShowQuickActionModal(true);
  };

  const handleComment = async (postId: string) => {
    if (!user?.id) {
      console.error('No user ID available for comment');
      return;
    }

    const commentContent = prompt('Write your comment:');
    if (!commentContent || commentContent.trim().length === 0) {
      return;
    }

    try {
      console.log('💬 Adding comment:', { postId, userId: user.id, content: commentContent });
      
      const response = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          postId,
          userId: user.id,
          content: commentContent.trim(),
          authorName: `${user.firstName} ${user.lastName}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Comment added successfully:', data);
        
        // Update local state with new comment count
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: (post.comments || 0) + 1
            };
          }
          return post;
        }));
      } else {
        const errorData = await response.text();
        console.error('❌ Comment API failed:', response.status, errorData);
        alert('Failed to add comment. Please try again.');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };


  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
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
                  <select
                    value={newPost.courseId}
                    onChange={(e) => setNewPost({ ...newPost, courseId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a course (optional - for class-specific posts)</option>
                    {userCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name} ({course.code})
                      </option>
                    ))}
                  </select>
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
              {posts.length === 0 ? (
                <EmptyCommunityState
                  onCreatePost={() => {
                    // Focus on the create post form
                    const titleInput = document.querySelector('input[placeholder="Post title..."]') as HTMLInputElement;
                    if (titleInput) {
                      titleInput.focus();
                    }
                  }}
                />
              ) : (
                <>
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
                            <Avatar
                              src={post.authorAvatar}
                              name={post.author}
                              size="md"
                              className="w-10 h-10"
                            />
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
                        {post.tags && post.tags.length > 0 && (
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
                                <span className="text-sm text-gray-600">{post.reactions?.like || 0}</span>
                              </button>
                              <button
                                onClick={() => handleReaction(post.id, 'love')}
                                className="flex items-center space-x-1 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
                              >
                                <span>❤️</span>
                                <span className="text-sm text-gray-600">{post.reactions?.love || 0}</span>
                              </button>
                              <button
                                onClick={() => handleReaction(post.id, 'helpful')}
                                className="flex items-center space-x-1 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
                              >
                                <span>💡</span>
                                <span className="text-sm text-gray-600">{post.reactions?.helpful || 0}</span>
                              </button>
                              <button
                                onClick={() => handleReaction(post.id, 'celebrate')}
                                className="flex items-center space-x-1 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
                              >
                                <span>🎉</span>
                                <span className="text-sm text-gray-600">{post.reactions?.celebrate || 0}</span>
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <button 
                              onClick={() => handleComment(post.id)}
                              className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                            >
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
                            <div className={`w-10 h-10 rounded-full overflow-hidden ${
                              post.authorRole === 'instructor' 
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                                : 'bg-gradient-to-br from-green-500 to-emerald-600'
                            }`}>
                              {post.authorAvatar ? (
                                <img 
                                  src={post.authorAvatar} 
                                  alt={post.author}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-semibold">${post.author.charAt(0).toUpperCase()}</div>`;
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                                  {post.author.charAt(0).toUpperCase()}
                                </div>
                              )}
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
                        {post.tags && post.tags.length > 0 && (
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
                                <span className="text-sm text-gray-600">{post.reactions?.like || 0}</span>
                              </button>
                              <button
                                onClick={() => handleReaction(post.id, 'love')}
                                className="flex items-center space-x-1 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
                              >
                                <span>❤️</span>
                                <span className="text-sm text-gray-600">{post.reactions?.love || 0}</span>
                              </button>
                              <button
                                onClick={() => handleReaction(post.id, 'helpful')}
                                className="flex items-center space-x-1 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
                              >
                                <span>💡</span>
                                <span className="text-sm text-gray-600">{post.reactions?.helpful || 0}</span>
                              </button>
                              <button
                                onClick={() => handleReaction(post.id, 'celebrate')}
                                className="flex items-center space-x-1 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
                              >
                                <span>🎉</span>
                                <span className="text-sm text-gray-600">{post.reactions?.celebrate || 0}</span>
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <button 
                              onClick={() => handleComment(post.id)}
                              className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                            >
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
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Stats</h3>
              {statsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : communityStats ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Posts</span>
                    <span className="font-semibold text-2xl text-gray-900">{communityStats.totalPosts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Users</span>
                    <span className="font-semibold text-2xl text-gray-900">{communityStats.activeUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">This Week</span>
                    <span className="font-semibold text-2xl text-gray-900">{communityStats.postsThisWeek}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Online Now</span>
                    <span className="font-semibold text-2xl text-green-600">{communityStats.onlineNow}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No stats available</p>
                </div>
              )}
            </div>

            {/* Trending Topics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔥 Trending Topics</h3>
              {statsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-4 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : trendingTopics.length > 0 ? (
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
                        <span className="text-xs text-gray-500">{topic.changePercent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No trending topics yet</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => handleQuickAction(
                    'Create Study Group', 
                    'Looking to form a study group for this topic. Who\'s interested in joining?', 
                    'blue'
                  )}
                  className="w-full flex items-center space-x-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <span className="text-lg">📝</span>
                  <span className="font-medium">Create Study Group</span>
                </button>
                <button 
                  onClick={() => handleQuickAction(
                    'Ask a Question', 
                    'I have a question about this topic. Can anyone help me understand?', 
                    'green'
                  )}
                  className="w-full flex items-center space-x-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <span className="text-lg">❓</span>
                  <span className="font-medium">Ask a Question</span>
                </button>
                <button 
                  onClick={() => handleQuickAction(
                    'Share a Resource', 
                    'Found a helpful resource that might benefit everyone studying this topic.', 
                    'purple'
                  )}
                  className="w-full flex items-center space-x-3 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <span className="text-lg">💡</span>
                  <span className="font-medium">Share a Resource</span>
                </button>
              </div>
            </div>

            {/* Online Users */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Online Now</h3>
              {statsLoading ? (
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : onlineUsers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {onlineUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{user.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No users online</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Modal */}
      {showQuickActionModal && quickActionData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                quickActionData.color === 'blue' ? 'bg-blue-500' :
                quickActionData.color === 'green' ? 'bg-green-500' :
                'bg-purple-500'
              }`}>
                {quickActionData.color === 'blue' ? '📝' :
                 quickActionData.color === 'green' ? '❓' : '💡'}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{quickActionData.title}</h3>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <textarea
                value={editableQuickActionContent}
                onChange={(e) => setEditableQuickActionContent(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={5}
                placeholder="Write your message here..."
              />
              <div className={`mt-3 p-3 rounded-lg border-l-4 ${
                quickActionData.color === 'blue' ? 'bg-blue-50 border-blue-400' :
                quickActionData.color === 'green' ? 'bg-green-50 border-green-400' :
                'bg-purple-50 border-purple-400'
              }`}>
                <p className="text-xs text-gray-600">
                  This will create a highlighted community post. Other students will be able to see and respond to it.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowQuickActionModal(false);
                  setQuickActionData(null);
                  setEditableQuickActionContent('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!editableQuickActionContent.trim()) {
                    alert('Please enter a message');
                    return;
                  }

                  try {
                    // Create the post with the quick action data
                    const response = await fetch('/api/community/posts', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        title: quickActionData.title,
                        content: editableQuickActionContent, // Use the edited content
                        userId: user?.id,
                        courseId: newPost.courseId || null,
                        isAnnouncement: false,
                        tags: [quickActionData.color], // Use color as tag for highlighting
                        pinned: true // Make it highlighted/pinned
                      }),
                      credentials: 'include'
                    });

                    if (response.ok) {
                      const data = await response.json();
                      console.log('✅ Quick action post created:', data);
                      
                      // Refresh posts
                      await loadCommunityData();
                      
                      // Close modal
                      setShowQuickActionModal(false);
                      setQuickActionData(null);
                      setEditableQuickActionContent('');
                      
                      alert(`✅ ${quickActionData.title} post created successfully!`);
                    } else {
                      const errorData = await response.json();
                      console.error('❌ Failed to create quick action post:', errorData);
                      alert(`❌ Failed to create post: ${errorData.error || 'Unknown error'}`);
                    }
                  } catch (error) {
                    console.error('Error creating quick action post:', error);
                    alert('❌ Failed to create post. Please try again.');
                  }
                }}
                className={`px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors ${
                  quickActionData.color === 'blue' ? 'bg-blue-600' :
                  quickActionData.color === 'green' ? 'bg-green-600' :
                  'bg-purple-600'
                }`}
              >
                Create Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
