'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import RichTextRenderer from '../common/RichTextRenderer';

interface Assignment {
  assignmentId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  status: 'draft' | 'published' | 'grading' | 'completed';
  submissionType: 'text' | 'file' | 'video';
  submissionsCount: number;
  gradedCount: number;
  averageGrade?: number;
  createdAt: string;
}

interface Student {
  studentId: string;
  name: string;
  email: string;
  avatar?: string;
  enrollmentDate: string;
  status: 'active' | 'dropped' | 'completed';
  currentGrade?: number;
  assignmentsSubmitted: number;
  assignmentsTotal: number;
  lastActivity: string;
  sectionName?: string;
}

interface AssignmentManagementProps {
  courseId: string;
  courseName: string;
}

export const AssignmentManagement: React.FC<AssignmentManagementProps> = ({ courseId, courseName }) => {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'assignments' | 'students'>('assignments');

  // Fetch assignments and students
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assignments
      const assignmentsResponse = await fetch(`/api/assignments?courseId=${courseId}`, {
        credentials: 'include',
      });

      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        if (assignmentsData.success) {
          const apiAssignments = assignmentsData.data.assignments || [];
          const transformedAssignments = apiAssignments.map((assignment: any) => ({
            assignmentId: assignment.assignmentId || assignment.id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate,
            points: assignment.maxScore || assignment.points || 100,
            status: assignment.status || 'draft',
            submissionType: assignment.assignmentType === 'video' ? 'video' : 
                           assignment.assignmentType === 'text' ? 'text' : 'file',
            submissionsCount: assignment.submissionsCount || 0,
            gradedCount: assignment.gradedCount || 0,
            averageGrade: assignment.averageGrade,
            createdAt: assignment.createdAt,
          }));
          setAssignments(transformedAssignments);
        }
      }

      // Fetch students
      const studentsResponse = await fetch(`/api/courses/enrollment?courseId=${courseId}`, {
        credentials: 'include',
      });

      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        if (studentsData.success) {
          const enrolledStudents = studentsData.data?.students || [];
          
          // Fetch full user details for each enrolled student
          const transformedStudents: Student[] = await Promise.all(
            enrolledStudents.map(async (student: any) => {
              let userName = student.email;
              let userAvatar = student.avatar || '/api/placeholder/40/40';
              let sectionName = student.sectionName || 'No Section';
              
              // Fetch full user details
              try {
                const userResponse = await fetch(`/api/users/${student.userId}`, {
                  credentials: 'include',
                });
                
                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  if (userData.success && userData.user) {
                    userName = `${userData.user.firstName || ''} ${userData.user.lastName || ''}`.trim() || userData.user.email;
                    userAvatar = userData.user.avatar || userAvatar;
                  }
                }
              } catch (userError) {
                console.warn('Could not fetch user details for:', student.userId);
              }
              
              return {
                studentId: student.userId,
                name: userName,
                email: student.email,
                avatar: userAvatar,
                enrollmentDate: student.enrolledAt,
                status: student.status || 'active',
                currentGrade: 0, // TODO: Calculate from submissions
                assignmentsSubmitted: 0, // Will be calculated from videoSubmissions
                assignmentsTotal: assignments.length,
                lastActivity: student.enrolledAt, // TODO: Get actual last activity
                sectionName: sectionName,
              };
            })
          );
          
          setStudents(transformedStudents);
        }
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [courseId, assignments.length]);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  // Filter assignments and students based on search
  const filteredAssignments = assignments.filter(assignment =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.sectionName && student.sectionName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Error Loading Data"
        description={error}
        icon="error"
        action={{
          label: 'Try Again',
          onClick: fetchData,
          variant: 'primary',
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Course Info */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{courseName}</h1>
            <p className="text-gray-600 mt-1">
              {assignments.length} assignments • {students.length} students
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`/instructor/courses/${courseId}/assignments/create`)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              + Create Assignment
            </button>
            <button
              onClick={() => router.push(`/instructor/courses/${courseId}`)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              View Full Course
            </button>
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder={`Search ${activeView}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView('assignments')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'assignments'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📝 Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setActiveView('students')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'students'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              👥 Students ({students.length})
            </button>
          </div>
        </div>
      </div>

      {/* Assignments View */}
      {activeView === 'assignments' && (
        <div>
          {filteredAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment.assignmentId}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {assignment.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span>📅 Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        <span>⭐ {assignment.points} pts</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {assignment.submissionType === 'video' ? '🎥' : assignment.submissionType === 'file' ? '📎' : '📝'}
                    </div>
                  </div>
                  
                  <RichTextRenderer 
                    content={assignment.description}
                    className="text-gray-600 mb-4 text-sm"
                    maxLines={2}
                  />
                  
                  {/* Submission Stats */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Submissions</span>
                      <span className="font-medium">{assignment.submissionsCount} total</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Graded</span>
                      <span className="font-medium text-green-600">{assignment.gradedCount}</span>
                    </div>
                    {assignment.submissionsCount > assignment.gradedCount && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Pending</span>
                        <span className="font-medium text-orange-600">
                          {assignment.submissionsCount - assignment.gradedCount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      assignment.status === 'published' ? 'bg-green-100 text-green-800' :
                      assignment.status === 'grading' ? 'bg-yellow-100 text-yellow-800' :
                      assignment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/instructor/courses/${courseId}?tab=assignments`)}
                        className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm"
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => router.push(`/instructor/courses/${courseId}?tab=assignments`)}
                        className="flex-1 px-3 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors text-sm"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                    <button
                      onClick={() => router.push(`/instructor/grading/assignment/${assignment.assignmentId}`)}
                      className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm"
                    >
                      📊 Grade ({assignment.submissionsCount || 0})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {searchQuery ? 'No assignments found' : 'No assignments yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? `No assignments match "${searchQuery}"`
                  : 'Create your first assignment to get started.'
                }
              </p>
              {!searchQuery && (
                <button 
                  onClick={() => router.push(`/instructor/courses/${courseId}/assignments/create`)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                >
                  Create Your First Assignment
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Students View */}
      {activeView === 'students' && (
        <div>
          {filteredStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <div
                  key={student.studentId}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {student.name}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">{student.email}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Section</span>
                      <span className="text-sm font-medium text-gray-900">
                        {student.sectionName || 'No Section'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.status === 'active' ? 'bg-green-100 text-green-700' :
                        student.status === 'dropped' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {student.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Submissions</span>
                      <span className="text-sm font-medium text-gray-900">
                        {student.assignmentsSubmitted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Enrolled</span>
                      <span className="text-sm text-gray-600">
                        {new Date(student.enrollmentDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => router.push(`/instructor/courses/${courseId}?tab=students`)}
                      className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm"
                    >
                      👁️ View Details
                    </button>
                    {student.assignmentsSubmitted > 0 && (
                      <button
                        onClick={() => router.push(`/instructor/grading/bulk?course=${courseId}&student=${student.studentId}&studentName=${encodeURIComponent(student.name)}`)}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm"
                      >
                        📊 Grade Submissions ({student.assignmentsSubmitted})
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {searchQuery ? 'No students found' : 'No students enrolled'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? `No students match "${searchQuery}"`
                  : 'Students will appear here once they enroll in your course.'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};