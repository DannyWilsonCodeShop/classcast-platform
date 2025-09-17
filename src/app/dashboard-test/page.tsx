'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { testDataGenerator, TestCourse, TestAssignment, TestVideoSubmission, TestUser } from '@/lib/testDataGenerator';
import Link from 'next/link';

export default function DashboardTestPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('feed');
  const [courses, setCourses] = useState<TestCourse[]>([]);
  const [assignments, setAssignments] = useState<TestAssignment[]>([]);
  const [videos, setVideos] = useState<TestVideoSubmission[]>([]);
  const [students, setStudents] = useState<TestUser[]>([]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    try {
      // Generate test data
      testDataGenerator.generateAllData();
      
      // Get data
      setCourses(testDataGenerator.getCourses());
      setAssignments(testDataGenerator.getAssignments());
      setVideos(testDataGenerator.getVideos());
      setStudents(testDataGenerator.getUsersByRole('student'));
    } catch (error) {
      console.error('Error loading test data:', error);
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

  const recentVideos = videos.slice(0, 5);
  const recentAssignments = assignments.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.firstName || 'Student'}! 👋
              </h1>
              <p className="text-gray-600">Ready to learn and create amazing content?</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/profile/edit"
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <span>👤</span>
                <span>Edit Profile</span>
              </Link>
              <Link
                href="/profile/videos"
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-bold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <span>📹</span>
                <span>My Videos</span>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
                <span className="text-sm text-gray-600 font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Courses */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📚 My Courses</h2>
              <div className="space-y-3">
                {courses.map((course) => (
                  <div key={course.id} className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${course.color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                        {course.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{course.title}</h3>
                        <p className="text-xs text-gray-600">{course.instructor.firstName} {course.instructor.lastName}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${(course.completedAssignments / course.totalAssignments) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{course.completedAssignments}/{course.totalAssignments}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('feed')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'feed'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    📱 Social Feed
                  </button>
                  <button
                    onClick={() => setActiveTab('assignments')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'assignments'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    📝 Assignments
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'feed' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Video Submissions</h2>
                    {recentVideos.map((video) => (
                      <div key={video.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">{video.student.profilePicture}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-bold text-gray-900">{video.student.firstName} {video.student.lastName}</h3>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">{video.assignment.title}</span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">{new Date(video.submittedAt).toLocaleDateString()}</span>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-2">{video.title}</h4>
                            <p className="text-gray-600 mb-4">{video.description}</p>
                            
                            {/* Video Thumbnail */}
                            <div className="relative w-full max-w-md mb-4">
                              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                                  <div className="text-center text-gray-600">
                                    <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-2">
                                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                      </svg>
                                    </div>
                                    <p className="text-sm font-medium">{video.title}</p>
                                    <p className="text-xs">{video.duration}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                {video.duration}
                              </div>
                            </div>

                            {/* Engagement Stats */}
                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <span className="text-red-500">❤️</span>
                                <span className="font-bold">{video.likes}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="text-blue-500">💬</span>
                                <span className="font-bold">{video.comments}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="text-gray-500">👁️</span>
                                <span className="font-bold">{video.views}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="text-yellow-500">⭐</span>
                                <span className="font-bold">{video.rating}</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-4 mt-4">
                              <Link
                                href={`/assignments/${video.assignment.id}`}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors"
                              >
                                View Assignment
                              </Link>
                              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors">
                                Like
                              </button>
                              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors">
                                Comment
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'assignments' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Assignments</h2>
                    {recentAssignments.map((assignment) => (
                      <div key={assignment.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{assignment.title}</h3>
                            <p className="text-gray-600">{assignment.course.title}</p>
                            <p className="text-sm text-gray-500">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-blue-600">{assignment.points}</span>
                            <p className="text-sm text-gray-500">points</p>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-4">{assignment.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {assignment.type}
                            </span>
                            <span className="text-sm text-gray-600">
                              {assignment.submissions.length} submissions
                            </span>
                          </div>
                          <Link
                            href={`/assignments/${assignment.id}`}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                          >
                            View Assignment
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
