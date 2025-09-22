'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
// Removed unused component imports since we're using a grid layout instead of tabs

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
        const apiCourse = courseData.data;
        // Transform API response to match expected interface
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
          credits: apiCourse.credits || 3,
          schedule: apiCourse.schedule || {
            days: ['Monday', 'Wednesday', 'Friday'],
            time: '10:00 AM - 11:00 AM',
            location: 'TBD'
          },
          prerequisites: apiCourse.prerequisites || [],
          learningObjectives: apiCourse.learningObjectives || [],
          gradingPolicy: apiCourse.gradingPolicy || {
            assignments: 40,
            exams: 30,
            participation: 10,
            final: 20
          },
          createdAt: apiCourse.createdAt || new Date().toISOString(),
          updatedAt: apiCourse.updatedAt || new Date().toISOString()
        };
        setCourse(transformedCourse);
      } else {
        throw new Error(courseData.error || 'Failed to fetch course');
      }

      // Comprehensive mock assignments data with detailed video submission information
      const mockAssignments: Assignment[] = [
        {
          assignmentId: 'assignment_1',
          title: 'Derivatives and Limits - Video Lesson',
          description: 'Create a 5-minute video explaining the concept of derivatives and limits. Use visual aids and work through 3 example problems step by step.',
          dueDate: '2024-01-25T23:59:59Z',
          points: 100,
          status: 'published',
          submissionType: 'video',
          submissionsCount: 24,
          gradedCount: 18,
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
          submissionsCount: 28,
          gradedCount: 28,
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
          submissionsCount: 19,
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
          gradedCount: 15,
          averageGrade: 89.1,
          createdAt: '2024-01-22T10:30:00Z'
        },
        {
          assignmentId: 'assignment_5',
          title: 'Series Convergence - Video Lesson',
          description: 'Create a comprehensive video lesson explaining different tests for series convergence with examples.',
          dueDate: '2024-02-10T23:59:59Z',
          points: 130,
          status: 'published',
          submissionType: 'video',
          submissionsCount: 16,
          gradedCount: 8,
          averageGrade: 87.2,
          createdAt: '2024-01-25T16:45:00Z'
        },
        {
          assignmentId: 'assignment_6',
          title: 'L\'Hôpital\'s Rule - Video Assessment',
          description: 'Demonstrate L\'Hôpital\'s Rule with 5 different limit problems. Show your work clearly and explain each step.',
          dueDate: '2024-02-15T23:59:59Z',
          points: 110,
          status: 'published',
          submissionType: 'video',
          submissionsCount: 21,
          gradedCount: 14,
          averageGrade: 91.4,
          createdAt: '2024-01-28T11:20:00Z'
        },
        {
          assignmentId: 'assignment_7',
          title: 'Related Rates Problems - Video Discussion',
          description: 'Choose 3 related rates problems and create a video explaining your solution process and reasoning.',
          dueDate: '2024-02-20T23:59:59Z',
          points: 95,
          status: 'grading',
          submissionType: 'video',
          submissionsCount: 17,
          gradedCount: 9,
          averageGrade: 86.8,
          createdAt: '2024-01-30T14:15:00Z'
        },
        {
          assignmentId: 'assignment_8',
          title: 'Fundamental Theorem of Calculus - Video Lesson',
          description: 'Create an educational video explaining both parts of the Fundamental Theorem of Calculus with visual examples.',
          dueDate: '2024-02-25T23:59:59Z',
          points: 125,
          status: 'published',
          submissionType: 'video',
          submissionsCount: 13,
          gradedCount: 6,
          averageGrade: 89.7,
          createdAt: '2024-02-01T09:45:00Z'
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/instructor/dashboard')}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="text-2xl">&lt;</span>
                </button>
                <div className="flex items-center space-x-4">
                  <img 
                    src="/MyClassCast (800 x 200 px).png" 
                    alt="ClassCast Logo" 
                    className="h-8 w-auto"
                  />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                      {course.courseName}
                    </h1>
                    <p className="text-gray-600">
                      {course.courseCode} • {course.semester} {course.year} • {course.enrollmentCount} students
                    </p>
                  </div>
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
          {/* Course Stats */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#4A90E2] mb-2">{assignments.length}</div>
                <div className="text-sm text-gray-600">Total Assignments</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#9B5DE5] mb-2">{course.enrollmentCount}</div>
                <div className="text-sm text-gray-600">Students Enrolled</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#FF6F61] mb-2">
                  {assignments.reduce((sum, assignment) => sum + assignment.submissionsCount, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Submissions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#06D6A0] mb-2">
                  {assignments.reduce((sum, assignment) => sum + assignment.gradedCount, 0)}
                </div>
                <div className="text-sm text-gray-600">Graded Submissions</div>
              </div>
            </div>
          </div>

          {/* Assignments Grid */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Assignments</h2>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors">
                + Create Assignment
              </button>
            </div>
            
            {assignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.assignmentId}
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{assignment.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <span>📅 Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                          <span>⭐ {assignment.points} pts</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-[#4A90E2] rounded-full flex items-center justify-center text-white text-sm font-bold">
                        📝
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{assignment.description}</p>
                    
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
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/instructor/submissions?assignment=${assignment.assignmentId}&course=${courseId}`)}
                        className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm"
                      >
                        View Submissions
                      </button>
                      <button
                        onClick={() => router.push(`/instructor/grading/bulk?assignment=${assignment.assignmentId}&course=${courseId}`)}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm"
                      >
                        Start Grading
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Assignments Yet</h3>
                <p className="text-gray-600 mb-6">Create your first assignment to get started with this course.</p>
                <button className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors">
                  Create Your First Assignment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default InstructorCourseDetailPage;
