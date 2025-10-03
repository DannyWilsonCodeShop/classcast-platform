'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface Section {
  sectionId: string;
  sectionName: string;
  sectionCode?: string;
  classCode?: string;
  description?: string;
  maxEnrollment: number;
  currentEnrollment: number;
  schedule?: {
    days: string[];
    time: string;
    location: string;
  };
  location?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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

interface Course {
  courseId: string;
  courseName: string;
  courseCode: string;
  description: string;
  instructor: {
    name: string;
    email: string;
    avatar?: string;
  };
  semester: string;
  year: number;
  status: 'draft' | 'published' | 'archived';
  enrollmentCount: number;
  maxEnrollment?: number;
  createdAt: string;
  updatedAt: string;
}

const SectionAssignmentsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assignments' | 'students' | 'settings'>('assignments');

  const courseId = params.courseId as string;
  const sectionId = params.sectionId as string;

  useEffect(() => {
    if (courseId && sectionId) {
      fetchData();
    }
  }, [courseId, sectionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course details
      const courseResponse = await fetch(`/api/courses/${courseId}`, {
        credentials: 'include',
      });

      if (!courseResponse.ok) {
        throw new Error('Failed to fetch course details');
      }

      const courseData = await courseResponse.json();
      if (courseData.success) {
        const apiCourse = courseData.data;
        const transformedCourse = {
          courseId: apiCourse.courseId || apiCourse.id,
          courseName: apiCourse.courseName || apiCourse.title,
          courseCode: apiCourse.courseCode || apiCourse.code,
          description: apiCourse.description,
          instructor: apiCourse.instructor,
          semester: apiCourse.semester || 'Fall',
          year: apiCourse.year || 2024,
          status: apiCourse.status || 'published',
          enrollmentCount: apiCourse.currentEnrollment || apiCourse.enrollmentCount || 0,
          maxEnrollment: apiCourse.maxStudents || apiCourse.maxEnrollment,
          createdAt: apiCourse.createdAt || new Date().toISOString(),
          updatedAt: apiCourse.updatedAt || new Date().toISOString()
        };
        setCourse(transformedCourse);
      } else {
        throw new Error(courseData.error || 'Failed to fetch course');
      }

      // Fetch section details
      const sectionResponse = await fetch(`/api/sections/${sectionId}`, {
        credentials: 'include',
      });

      if (!sectionResponse.ok) {
        throw new Error('Failed to fetch section details');
      }

      const sectionData = await sectionResponse.json();
      if (sectionData.success) {
        setSection(sectionData.data);
      } else {
        throw new Error(sectionData.error || 'Failed to fetch section');
      }

      // Fetch assignments for the course (filtered by section if needed)
      const assignmentsResponse = await fetch(`/api/assignments?courseId=${courseId}`, {
        credentials: 'include',
      });

      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        if (assignmentsData.success) {
          setAssignments(assignmentsData.data || []);
        }
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'grading':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubmissionTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return '🎥';
      case 'file':
        return '📁';
      case 'text':
        return '📝';
      default:
        return '📄';
    }
  };

  if (loading) {
    return (
      <InstructorRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </InstructorRoute>
    );
  }

  if (error) {
    return (
      <InstructorRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center max-w-md">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </InstructorRoute>
    );
  }

  if (!course || !section) {
    return (
      <InstructorRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center max-w-md">
            <div className="text-gray-500 text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Not Found</h2>
            <p className="text-gray-600 mb-6">Course or section not found.</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </InstructorRoute>
    );
  }

  return (
    <InstructorRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push(`/instructor/courses/${courseId}`)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{section.sectionName}</h1>
                  <p className="text-gray-600">
                    {course.courseName} • {course.courseCode}
                  </p>
                  {section.classCode && (
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-500">Class Code:</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded font-mono font-semibold">
                        {section.classCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Enrollment</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {section.currentEnrollment} / {section.maxEnrollment}
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/instructor/courses/${courseId}/assignments/create`)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create Assignment
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'assignments', label: 'Assignments', count: assignments.length },
                  { id: 'students', label: 'Students', count: section.currentEnrollment },
                  { id: 'settings', label: 'Section Settings', count: null }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== null && (
                      <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                        activeTab === tab.id
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'assignments' && (
            <div className="space-y-6">
              {assignments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Assignments Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Create your first assignment for this section to get started.
                  </p>
                  <button
                    onClick={() => router.push(`/instructor/courses/${courseId}/assignments/create`)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Create Assignment
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.assignmentId}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/instructor/courses/${courseId}/assignments/${assignment.assignmentId}`)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{getSubmissionTypeIcon(assignment.submissionType)}</span>
                          <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                          {assignment.status}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{assignment.description}</p>

                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex justify-between">
                          <span>Due Date:</span>
                          <span className="font-medium">{formatDate(assignment.dueDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Points:</span>
                          <span className="font-medium">{assignment.points}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Submissions:</span>
                          <span className="font-medium">{assignment.submissionsCount}</span>
                        </div>
                        {assignment.gradedCount > 0 && (
                          <div className="flex justify-between">
                            <span>Graded:</span>
                            <span className="font-medium">{assignment.gradedCount}</span>
                          </div>
                        )}
                        {assignment.averageGrade && (
                          <div className="flex justify-between">
                            <span>Avg Grade:</span>
                            <span className="font-medium">{assignment.averageGrade}%</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-indigo-600 font-medium">View Details</span>
                          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'students' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Students in {section.sectionName}</h3>
              <p className="text-gray-600">
                Student management for this section will be available soon. 
                For now, you can manage all students from the main course page.
              </p>
              <button
                onClick={() => router.push(`/instructor/courses/${courseId}/students`)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                View All Students
              </button>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Settings</h3>
              <p className="text-gray-600">
                Section management will be available soon. 
                For now, you can manage course settings from the main course page.
              </p>
              <button
                onClick={() => router.push(`/instructor/courses/${courseId}/settings`)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Course Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </InstructorRoute>
  );
};

export default SectionAssignmentsPage;
