'use client';

import { useEffect, useState } from 'react';
import { testDataGenerator, TestUser, TestCourse, TestAssignment, TestVideoSubmission } from '@/lib/testDataGenerator';

export default function TestDataPage() {
  const [data, setData] = useState<{
    users: TestUser[];
    courses: TestCourse[];
    assignments: TestAssignment[];
    videos: TestVideoSubmission[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const generateData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-data/populate', {
        method: 'POST',
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        console.error('Failed to generate test data:', result.error);
      }
    } catch (error) {
      console.error('Error generating test data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-data/populate');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        console.error('Failed to load test data:', result.error);
      }
    } catch (error) {
      console.error('Error loading test data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🧪 Test Data Generator</h1>
              <p className="text-gray-600 mt-2">Comprehensive test data for all ClassCast features</p>
            </div>
            <button
              onClick={generateData}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate New Data'}
            </button>
          </div>

          {data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{data.users.length}</div>
                <div className="text-sm text-gray-600">Users</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{data.courses.length}</div>
                <div className="text-sm text-gray-600">Courses</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{data.assignments.length}</div>
                <div className="text-sm text-gray-600">Assignments</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{data.videos.length}</div>
                <div className="text-sm text-gray-600">Videos</div>
              </div>
            </div>
          )}
        </div>

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Users */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">👥 Users ({data.users.length})</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{user.profilePicture || user.firstName.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{user.firstName} {user.lastName}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role} • {user.grade || user.major}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-blue-600">{user.videoStats.totalVideos}</div>
                      <div className="text-xs text-gray-500">videos</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Courses */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📚 Courses ({data.courses.length})</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.courses.map((course) => (
                  <div key={course.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold ${course.color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                        {course.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-600">{course.instructor.firstName} {course.instructor.lastName}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{course.students.length} students</span>
                      <span className="text-xs text-gray-500">{course.completedAssignments}/{course.totalAssignments} assignments</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assignments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📝 Assignments ({data.assignments.length})</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.assignments.map((assignment) => (
                  <div key={assignment.id} className="p-3 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{assignment.course.title}</p>
                    <p className="text-xs text-gray-500 mb-2">{assignment.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-600 font-bold">{assignment.points} points</span>
                      <span className="text-xs text-gray-500">{assignment.submissions.length} submissions</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Videos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📹 Videos ({data.videos.length})</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.videos.map((video) => (
                  <div key={video.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{video.student.profilePicture}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{video.title}</h3>
                        <p className="text-xs text-gray-600">{video.student.firstName} {video.student.lastName}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{video.assignment.title}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span>❤️ {video.likes}</span>
                        <span>💬 {video.comments}</span>
                        <span>👁️ {video.views}</span>
                      </div>
                      <span className="text-xs text-gray-500">{video.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🔗 Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/dashboard-test"
              className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors"
            >
              <div className="text-2xl mb-2">🏠</div>
              <div className="font-semibold text-gray-900">Test Dashboard</div>
              <div className="text-sm text-gray-600">Full dashboard with test data</div>
            </a>
            <a
              href="/mobile-test"
              className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors"
            >
              <div className="text-2xl mb-2">📱</div>
              <div className="font-semibold text-gray-900">Mobile Test</div>
              <div className="text-sm text-gray-600">Mobile interface with test data</div>
            </a>
            <a
              href="/assignments"
              className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors"
            >
              <div className="text-2xl mb-2">📝</div>
              <div className="font-semibold text-gray-900">Assignments</div>
              <div className="text-sm text-gray-600">Assignment pages</div>
            </a>
            <a
              href="/community"
              className="p-4 bg-orange-50 rounded-lg text-center hover:bg-orange-100 transition-colors"
            >
              <div className="text-2xl mb-2">👥</div>
              <div className="font-semibold text-gray-900">Community</div>
              <div className="text-sm text-gray-600">Community features</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
