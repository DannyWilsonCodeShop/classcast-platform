'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const InstructorDebugPage: React.FC = () => {
  const { user } = useAuth();
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugData = async () => {
    if (!user?.userId) {
      setError('No user ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/debug/instructor-data?instructorId=${user.userId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setDebugData(data);
      } else {
        const errorText = await response.text();
        setError(`API Error: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      setError(`Network Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userId) {
      fetchDebugData();
    }
  }, [user?.userId]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-2xl mb-4">🔐</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Authentication Required</h1>
          <p className="text-gray-600">Please log in to view debug information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🔍 Instructor Debug Information</h1>
              <p className="text-gray-600 mt-1">Debug data for instructor: {user.email}</p>
            </div>
            <button
              onClick={fetchDebugData}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
            >
              {loading ? 'Loading...' : '🔄 Refresh'}
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading debug data...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-red-500 mr-2">❌</div>
                <div>
                  <h3 className="font-medium text-red-800">Error</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {debugData && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-blue-900 mb-3">📊 Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{debugData.debug.summary.coursesCount}</div>
                    <div className="text-sm text-blue-700">Courses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{debugData.debug.summary.assignmentsCount}</div>
                    <div className="text-sm text-green-700">Assignments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{debugData.debug.summary.submissionsCount}</div>
                    <div className="text-sm text-purple-700">Submissions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{debugData.debug.summary.studentsCount}</div>
                    <div className="text-sm text-orange-700">Students</div>
                  </div>
                </div>
              </div>

              {/* Instructor Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">👤 Instructor Information</h2>
                {debugData.debug.instructor ? (
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {debugData.debug.instructor.name}</p>
                    <p><strong>Email:</strong> {debugData.debug.instructor.email}</p>
                    <p><strong>Role:</strong> {debugData.debug.instructor.role}</p>
                    <p><strong>User ID:</strong> {debugData.debug.instructor.userId}</p>
                  </div>
                ) : (
                  <p className="text-red-600">❌ Instructor not found in database</p>
                )}
              </div>

              {/* Courses */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">📚 Courses ({debugData.debug.courses.length})</h2>
                {debugData.debug.courses.length > 0 ? (
                  <div className="space-y-2">
                    {debugData.debug.courses.map((course: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <p><strong>{course.courseName}</strong> ({course.courseCode})</p>
                        <p className="text-sm text-gray-600">ID: {course.courseId}</p>
                        <p className="text-sm text-gray-600">Students: {course.studentsCount}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-orange-600">⚠️ No courses found for this instructor</p>
                )}
              </div>

              {/* Assignments */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">📝 Assignments ({debugData.debug.assignments.length})</h2>
                {debugData.debug.assignments.length > 0 ? (
                  <div className="space-y-2">
                    {debugData.debug.assignments.map((assignment: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <p><strong>{assignment.title}</strong></p>
                        <p className="text-sm text-gray-600">ID: {assignment.assignmentId}</p>
                        <p className="text-sm text-gray-600">Course: {assignment.courseId}</p>
                        <p className="text-sm text-gray-600">Status: {assignment.status}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-orange-600">⚠️ No assignments found</p>
                )}
              </div>

              {/* Submissions */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">📹 Submissions ({debugData.debug.submissions.length})</h2>
                {debugData.debug.submissions.length > 0 ? (
                  <div className="space-y-2">
                    {debugData.debug.submissions.map((submission: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <p><strong>Submission ID:</strong> {submission.submissionId}</p>
                        <p className="text-sm text-gray-600">Assignment: {submission.assignmentId}</p>
                        <p className="text-sm text-gray-600">Course: {submission.courseId}</p>
                        <p className="text-sm text-gray-600">Student: {submission.studentId}</p>
                        <p className="text-sm text-gray-600">Status: {submission.status}</p>
                        <p className="text-sm text-gray-600">Has Video: {submission.hasVideo ? '✅ Yes' : '❌ No'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-orange-600">⚠️ No submissions found</p>
                )}
              </div>

              {/* Students */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">👥 Enrolled Students ({debugData.debug.enrolledStudents.length})</h2>
                {debugData.debug.enrolledStudents.length > 0 ? (
                  <div className="space-y-2">
                    {debugData.debug.enrolledStudents.map((student: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <p><strong>{student.email}</strong></p>
                        <p className="text-sm text-gray-600">User ID: {student.userId}</p>
                        <p className="text-sm text-gray-600">Course: {student.courseName} ({student.courseId})</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-orange-600">⚠️ No enrolled students found</p>
                )}
              </div>

              {/* Raw Data */}
              <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="text-lg font-semibold text-gray-900 cursor-pointer">🔧 Raw Debug Data</summary>
                <pre className="mt-3 text-xs bg-gray-800 text-green-400 p-4 rounded overflow-auto">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorDebugPage;