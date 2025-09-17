'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { testDataGenerator, TestCourse, TestAssignment, TestVideoSubmission } from '@/lib/testDataGenerator';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('feed');

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <LoadingSpinner text="Loading your learning hub..." />
        </div>
      </div>
    );
  }

  // Mock data for social media style content
  const posts = [
    {
      id: 1,
      author: 'Sarah Johnson',
      role: 'Student',
      avatar: 'SJ',
      time: '2 hours ago',
      content: 'Just finished my math assignment! The video tutorial really helped me understand calculus better. Thanks @prof_wilson! 🎉',
      likes: 12,
      comments: 5,
      shares: 2,
      isLiked: false,
      type: 'assignment_complete'
    },
    {
      id: 2,
      author: 'Mike Chen',
      role: 'Student',
      avatar: 'MC',
      time: '4 hours ago',
      content: 'Working on the group project for CS 101. Anyone want to collaborate on the database design? 🤝',
      likes: 8,
      comments: 3,
      shares: 1,
      isLiked: true,
      type: 'collaboration'
    },
    {
      id: 3,
      author: 'Dr. Wilson',
      role: 'Instructor',
      avatar: 'DW',
      time: '6 hours ago',
      content: 'Great job on the recent assignments everyone! I\'ve posted some additional resources in the course materials. Keep up the excellent work! 📚',
      likes: 25,
      comments: 8,
      shares: 4,
      isLiked: false,
      type: 'instructor_update'
    }
  ];

  const assignments = [
    {
      id: 1,
      title: 'Math 201 - Calculus Problem Set',
      dueDate: 'Tomorrow',
      status: 'pending',
      progress: 60,
      course: 'Calculus II',
      instructor: 'Dr. Smith'
    },
    {
      id: 2,
      title: 'CS 101 - Database Design Project',
      dueDate: '3 days',
      status: 'in_progress',
      progress: 30,
      course: 'Computer Science',
      instructor: 'Prof. Johnson'
    },
    {
      id: 3,
      title: 'Physics Lab Report',
      dueDate: '1 week',
      status: 'not_started',
      progress: 0,
      course: 'Physics 101',
      instructor: 'Dr. Brown'
    }
  ];

  const courses = [
    {
      id: 1,
      name: 'Calculus II',
      code: 'MATH 201',
      instructor: 'Dr. Smith',
      progress: 75,
      nextClass: 'Tomorrow 10:00 AM',
      color: 'blue'
    },
    {
      id: 2,
      name: 'Computer Science 101',
      code: 'CS 101',
      instructor: 'Prof. Johnson',
      progress: 45,
      nextClass: 'Wednesday 2:00 PM',
      color: 'green'
    },
    {
      id: 3,
      name: 'Physics 101',
      code: 'PHYS 101',
      instructor: 'Dr. Brown',
      progress: 30,
      nextClass: 'Friday 11:00 AM',
      color: 'purple'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-yellow-300/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-lg">
                  {user?.firstName?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                  Welcome back, {user?.firstName}! 👋
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Ready to learn and have fun today? 🌟
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex space-x-2 sm:space-x-4">
                <Link
                  href="/profile/edit"
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  <span>👤</span>
                  <span className="hidden sm:inline">Edit Profile</span>
                </Link>
                <Link
                  href="/profile/videos"
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-bold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  <span>📹</span>
                  <span className="hidden sm:inline">My Videos</span>
                </Link>
              </div>
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce flex-shrink-0"></div>
                <span className="text-sm text-gray-600 font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Quick Stats & Courses */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-yellow-300/30">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Your Progress</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Assignments Completed</span>
                  <span className="font-bold text-blue-500">8/12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Grade</span>
                  <span className="font-bold text-green-500">A-</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Study Streak</span>
                  <span className="font-bold text-yellow-500">7 days 🔥</span>
                </div>
              </div>
            </div>

            {/* Courses */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-blue-300/30">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🎓 Your Courses</h3>
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-800">{course.name}</h4>
                      <span className="text-sm text-gray-500">{course.progress}%</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{course.code} • {course.instructor}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className={`h-2 rounded-full bg-gradient-to-r ${
                          course.color === 'blue' ? 'from-blue-400 to-blue-500' :
                          course.color === 'green' ? 'from-green-400 to-green-500' :
                          'from-purple-400 to-purple-500'
                        }`}
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">Next: {course.nextClass}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Social Feed */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border-2 border-purple-300/30 mb-6">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('feed')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
                    activeTab === 'feed'
                      ? 'bg-gradient-to-r from-yellow-400 to-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  📱 Feed
                </button>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
                    activeTab === 'assignments'
                      ? 'bg-gradient-to-r from-yellow-400 to-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  📚 Assignments
                </button>
              </div>
            </div>

            {/* Feed Content */}
            {activeTab === 'feed' && (
              <div className="space-y-6">
                {/* Create Post */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-yellow-300/30">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {user?.firstName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="What's on your mind? Share your learning journey! 🌟"
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-4">
                      <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors">
                        <span>📹</span>
                        <span className="text-sm font-medium">Video</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors">
                        <span>📸</span>
                        <span className="text-sm font-medium">Photo</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-600 hover:text-purple-500 transition-colors">
                        <span>📝</span>
                        <span className="text-sm font-medium">Assignment</span>
                      </button>
                    </div>
                    <button className="bg-gradient-to-r from-yellow-400 to-blue-500 text-white px-6 py-2 rounded-xl font-bold hover:shadow-lg transition-all duration-300">
                      Post 🚀
                    </button>
                  </div>
                </div>

                {/* Posts */}
                {posts.map((post) => (
                  <div key={post.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{post.avatar}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-bold text-gray-800">{post.author}</h4>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{post.role}</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{post.time}</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{post.content}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-6">
                        <button className={`flex items-center space-x-2 transition-colors ${
                          post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                        }`}>
                          <span className="text-xl">{post.isLiked ? '❤️' : '🤍'}</span>
                          <span className="text-sm font-medium">{post.likes}</span>
                        </button>
                        <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
                          <span className="text-xl">💬</span>
                          <span className="text-sm font-medium">{post.comments}</span>
                        </button>
                        <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
                          <span className="text-xl">🔄</span>
                          <span className="text-sm font-medium">{post.shares}</span>
                        </button>
                      </div>
                      <button className="text-gray-500 hover:text-gray-700 transition-colors">
                        <span className="text-xl">🔗</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Assignments Content */}
            {activeTab === 'assignments' && (
              <div className="space-y-6">
                {assignments.map((assignment) => (
                  <Link key={assignment.id} href={`/assignments/${assignment.id}`}>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30 hover:border-blue-300/50 transition-all duration-300 cursor-pointer">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 mb-2">{assignment.title}</h3>
                          <p className="text-gray-600 mb-2">{assignment.course} • {assignment.instructor}</p>
                          <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                              assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {assignment.status === 'pending' ? '⏰ Due Soon' :
                               assignment.status === 'in_progress' ? '🔄 In Progress' :
                               '📋 Not Started'}
                            </span>
                            <span className="text-gray-500">Due: {assignment.dueDate}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-500">{assignment.progress}%</div>
                          <div className="text-sm text-gray-500">Complete</div>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                        <div 
                          className="h-3 rounded-full bg-gradient-to-r from-yellow-400 to-blue-500"
                          style={{ width: `${assignment.progress}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <button 
                            onClick={(e) => e.preventDefault()}
                            className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300"
                          >
                            {assignment.status === 'not_started' ? 'Start Assignment' : 'Continue'}
                          </button>
                          <button 
                            onClick={(e) => e.preventDefault()}
                            className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300"
                          >
                            View Details
                          </button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={(e) => e.preventDefault()}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <span className="text-xl">📎</span>
                          </button>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
