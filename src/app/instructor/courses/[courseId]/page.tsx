'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { InstructorCourseDetails } from '@/components/instructor/InstructorCourseDetails';
import { InstructorCourseAssignments } from '@/components/instructor/InstructorCourseAssignments';
import { InstructorCourseStudents } from '@/components/instructor/InstructorCourseStudents';
import { InstructorCourseAnalytics } from '@/components/instructor/InstructorCourseAnalytics';

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
  credits: number;
  schedule: {
    days: string[];
    time: string;
    location: string;
  };
  prerequisites: string[];
  learningObjectives: string[];
  gradingPolicy: {
    assignments: number;
    exams: number;
    participation: number;
    final: number;
  };
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
}

const InstructorCourseDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'students' | 'analytics'>('overview');

  const courseId = params.courseId as string;

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  const fetchCourseDetails = async () => {
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
        setCourse(courseData.data);
      } else {
        throw new Error(courseData.error || 'Failed to fetch course');
      }

      // Comprehensive mock assignments data for demonstration
      const mockAssignments: Assignment[] = [
        {
          assignmentId: 'assignment_1',
          title: 'Derivatives and Limits - Video Lesson',
          description: 'Create a 5-minute video explaining the concept of derivatives and limits. Use visual aids and work through 3 example problems step by step.',
          dueDate: '2024-01-25T23:59:59Z',
          points: 100,
          status: 'published',
          submissionType: 'video',
          submissionsCount: 28,
          gradedCount: 25,
          averageGrade: 88.5,
          createdAt: '2024-01-15T09:00:00Z'
        },
        {
          assignmentId: 'assignment_2',
          title: 'Integration Techniques - Video Assessment',
          description: 'Solve the integration problems using substitution and integration by parts. Record yourself explaining your solution process.',
          dueDate: '2024-01-20T23:59:59Z',
          points: 120,
          status: 'completed',
          submissionType: 'video',
          submissionsCount: 30,
          gradedCount: 30,
          averageGrade: 92.3,
          createdAt: '2024-01-10T09:00:00Z'
        },
        {
          assignmentId: 'assignment_3',
          title: 'Chain Rule Discussion - Video Discussion',
          description: 'Record a 3-minute video discussing when and how to apply the chain rule. Include examples from different contexts.',
          dueDate: '2024-01-30T23:59:59Z',
          points: 80,
          status: 'published',
          submissionType: 'video',
          submissionsCount: 15,
          gradedCount: 12,
          averageGrade: 85.7,
          createdAt: '2024-01-18T14:00:00Z'
        },
        {
          assignmentId: 'assignment_4',
          title: 'Optimization Problems - Video Assessment',
          description: 'Solve 5 optimization problems and create a video walkthrough of your solutions with clear explanations.',
          dueDate: '2024-02-05T23:59:59Z',
          points: 150,
          status: 'grading',
          submissionType: 'video',
          submissionsCount: 22,
          gradedCount: 18,
          averageGrade: 89.1,
          createdAt: '2024-01-22T10:30:00Z'
        },
        {
          assignmentId: 'assignment_5',
          title: 'Series Convergence - Video Lesson',
          description: 'Create a comprehensive video lesson explaining different tests for series convergence with examples.',
          dueDate: '2024-02-10T23:59:59Z',
          points: 130,
          status: 'draft',
          submissionType: 'video',
          submissionsCount: 0,
          gradedCount: 0,
          averageGrade: undefined,
          createdAt: '2024-01-25T16:45:00Z'
        }
      ];
      
      setAssignments(mockAssignments);

      // Comprehensive mock students data for demonstration
      const mockStudents: Student[] = [
        {
          studentId: 'student_001',
          name: 'Alex Thompson',
          email: 'alex.thompson@university.edu',
          avatar: '/api/placeholder/40/40',
          enrollmentDate: '2024-01-15T10:00:00Z',
          status: 'active',
          currentGrade: 88.5,
          assignmentsSubmitted: 4,
          assignmentsTotal: 5,
          lastActivity: '2024-01-22T14:30:00Z'
        },
        {
          studentId: 'student_002',
          name: 'Maria Rodriguez',
          email: 'maria.rodriguez@university.edu',
          avatar: '/api/placeholder/40/40',
          enrollmentDate: '2024-01-15T10:30:00Z',
          status: 'active',
          currentGrade: 91.2,
          assignmentsSubmitted: 5,
          assignmentsTotal: 5,
          lastActivity: '2024-01-22T12:15:00Z'
        },
        {
          studentId: 'student_003',
          name: 'James Wilson',
          email: 'james.wilson@university.edu',
          avatar: '/api/placeholder/40/40',
          enrollmentDate: '2024-01-16T09:15:00Z',
          status: 'active',
          currentGrade: 85.8,
          assignmentsSubmitted: 4,
          assignmentsTotal: 5,
          lastActivity: '2024-01-21T10:45:00Z'
        },
        {
          studentId: 'student_004',
          name: 'Sarah Kim',
          email: 'sarah.kim@university.edu',
          avatar: '/api/placeholder/40/40',
          enrollmentDate: '2024-01-16T11:00:00Z',
          status: 'active',
          currentGrade: 89.3,
          assignmentsSubmitted: 5,
          assignmentsTotal: 5,
          lastActivity: '2024-01-21T16:20:00Z'
        },
        {
          studentId: 'student_005',
          name: 'David Chen',
          email: 'david.chen@university.edu',
          avatar: '/api/placeholder/40/40',
          enrollmentDate: '2024-01-17T14:20:00Z',
          status: 'active',
          currentGrade: 87.1,
          assignmentsSubmitted: 5,
          assignmentsTotal: 5,
          lastActivity: '2024-01-20T14:10:00Z'
        },
        {
          studentId: 'student_006',
          name: 'Emma Johnson',
          email: 'emma.johnson@university.edu',
          avatar: '/api/placeholder/40/40',
          enrollmentDate: '2024-01-17T16:45:00Z',
          status: 'active',
          currentGrade: 84.6,
          assignmentsSubmitted: 4,
          assignmentsTotal: 5,
          lastActivity: '2024-01-20T11:30:00Z'
        },
        {
          studentId: 'student_007',
          name: 'Michael Brown',
          email: 'michael.brown@university.edu',
          avatar: '/api/placeholder/40/40',
          enrollmentDate: '2024-01-18T09:15:00Z',
          status: 'active',
          currentGrade: 82.9,
          assignmentsSubmitted: 4,
          assignmentsTotal: 5,
          lastActivity: '2024-01-19T15:45:00Z'
        },
        {
          studentId: 'student_008',
          name: 'Lisa Garcia',
          email: 'lisa.garcia@university.edu',
          avatar: '/api/placeholder/40/40',
          enrollmentDate: '2024-01-18T11:30:00Z',
          status: 'active',
          currentGrade: 90.1,
          assignmentsSubmitted: 5,
          assignmentsTotal: 5,
          lastActivity: '2024-01-19T13:20:00Z'
        },
        {
          studentId: 'student_009',
          name: 'Ryan Davis',
          email: 'ryan.davis@university.edu',
          avatar: '/api/placeholder/40/40',
          enrollmentDate: '2024-01-19T14:20:00Z',
          status: 'active',
          currentGrade: 79.8,
          assignmentsSubmitted: 3,
          assignmentsTotal: 5,
          lastActivity: '2024-01-18T09:15:00Z'
        },
        {
          studentId: 'student_010',
          name: 'Jessica Lee',
          email: 'jessica.lee@university.edu',
          avatar: '/api/placeholder/40/40',
          enrollmentDate: '2024-01-19T16:45:00Z',
          status: 'dropped',
          currentGrade: 75.2,
          assignmentsSubmitted: 2,
          assignmentsTotal: 5,
          lastActivity: '2024-01-17T16:30:00Z'
        }
      ];
      
      setStudents(mockStudents);

    } catch (err) {
      console.error('Error fetching course details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch course details');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseUpdate = async (updateData: Partial<Course>) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        setCourse(prev => prev ? { ...prev, ...updateData } : null);
        return { success: true, message: 'Course updated successfully' };
      } else {
        return { success: false, message: data.error || 'Failed to update course' };
      }
    } catch (error) {
      console.error('Error updating course:', error);
      return { success: false, message: 'Failed to update course' };
    }
  };

  const handleAssignmentUpdate = async (assignmentId: string, updateData: Partial<Assignment>) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        setAssignments(prev => prev.map(assignment => 
          assignment.assignmentId === assignmentId 
            ? { ...assignment, ...updateData }
            : assignment
        ));
        return { success: true, message: 'Assignment updated successfully' };
      } else {
        return { success: false, message: data.error || 'Failed to update assignment' };
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      return { success: false, message: 'Failed to update assignment' };
    }
  };

  if (loading) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
          <div className="text-center">
            <LoadingSpinner text="Loading course details..." />
          </div>
        </div>
      </InstructorRoute>
    );
  }

  if (error || !course) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
          <div className="text-center">
            <div className="text-6xl mb-4">😞</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Course Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The course you are looking for does not exist.'}</p>
            <button
              onClick={() => router.push('/instructor/courses')}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Courses
            </button>
          </div>
        </div>
      </InstructorRoute>
    );
  }

  return (
    <InstructorRoute>
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-yellow-300/30 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/instructor/courses')}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="text-2xl">←</span>
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {course.courseName}
                  </h1>
                  <p className="text-gray-600">
                    {course.courseCode} • {course.semester} {course.year} • {course.enrollmentCount} students
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  course.status === 'published' ? 'bg-green-100 text-green-800' :
                  course.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                </span>
                <button className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300">
                  ⚙️ Settings
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation Tabs */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border-2 border-gray-200/30 mb-8">
            <div className="flex space-x-1">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'assignments', label: 'Assignments', icon: '📝' },
                { id: 'students', label: 'Students', icon: '👥' },
                { id: 'analytics', label: 'Analytics', icon: '📈' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-yellow-400 to-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            {activeTab === 'overview' && (
              <InstructorCourseDetails
                course={course}
                assignments={assignments}
                students={students}
                onCourseUpdate={handleCourseUpdate}
              />
            )}
            {activeTab === 'assignments' && (
              <InstructorCourseAssignments
                courseId={courseId}
                assignments={assignments}
                onAssignmentUpdate={handleAssignmentUpdate}
                onAssignmentCreate={() => fetchCourseDetails()}
              />
            )}
            {activeTab === 'students' && (
              <InstructorCourseStudents
                students={students}
                course={course}
                onStudentUpdate={() => fetchCourseDetails()}
              />
            )}
            {activeTab === 'analytics' && (
              <InstructorCourseAnalytics
                course={course}
                assignments={assignments}
                students={students}
              />
            )}
          </div>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default InstructorCourseDetailPage;
