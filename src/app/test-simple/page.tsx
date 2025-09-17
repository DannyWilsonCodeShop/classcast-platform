'use client';

import { useEffect, useState } from 'react';
import { testDataGenerator } from '@/lib/testDataGenerator';

export default function TestSimplePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Generate test data
      testDataGenerator.generateAllData();
      
      // Get some basic data
      const users = testDataGenerator.getUsers();
      const courses = testDataGenerator.getCourses();
      const assignments = testDataGenerator.getAssignments();
      const videos = testDataGenerator.getVideos();
      
      setData({
        users: users.length,
        courses: courses.length,
        assignments: assignments.length,
        videos: videos.length,
        sampleUser: users[0],
        sampleCourse: courses[0],
        sampleAssignment: assignments[0],
        sampleVideo: videos[0]
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error in test page:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Test Data</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-8">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-gray-900">Test Data Generator Working!</h1>
            <p className="text-gray-600 mt-2">The test data system is functioning correctly</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{data.users}</div>
              <div className="text-sm text-gray-600">Users</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{data.courses}</div>
              <div className="text-sm text-gray-600">Courses</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{data.assignments}</div>
              <div className="text-sm text-gray-600">Assignments</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{data.videos}</div>
              <div className="text-sm text-gray-600">Videos</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-2">Sample User</h3>
              <p className="text-sm text-gray-600">
                <strong>Name:</strong> {data.sampleUser.firstName} {data.sampleUser.lastName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Role:</strong> {data.sampleUser.role}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Email:</strong> {data.sampleUser.email}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-2">Sample Course</h3>
              <p className="text-sm text-gray-600">
                <strong>Title:</strong> {data.sampleCourse.title}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Instructor:</strong> {data.sampleCourse.instructor.firstName} {data.sampleCourse.instructor.lastName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Students:</strong> {data.sampleCourse.students.length}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-2">Sample Assignment</h3>
              <p className="text-sm text-gray-600">
                <strong>Title:</strong> {data.sampleAssignment.title}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Points:</strong> {data.sampleAssignment.points}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Submissions:</strong> {data.sampleAssignment.submissions.length}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-2">Sample Video</h3>
              <p className="text-sm text-gray-600">
                <strong>Title:</strong> {data.sampleVideo.title}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Author:</strong> {data.sampleVideo.student.firstName} {data.sampleVideo.student.lastName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Likes:</strong> {data.sampleVideo.likes}
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Links</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/test-data"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Full Test Data Page
              </a>
              <a
                href="/dashboard-test"
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Test Dashboard
              </a>
              <a
                href="/mobile-test"
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Mobile Test
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
