'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import CourseSettingsModal from '@/components/instructor/CourseSettingsModal';

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
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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

      // Fetch real assignments from API
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
            createdAt: assignment.createdAt
          }));
          setAssignments(transformedAssignments);
        }
      }

      // Fetch real students from API
      const students: Student[] = [];
      setStudents(students);

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-6xl mb-4">😞</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Course Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The course you are looking for does not exist.'}</p>
            <button
              onClick={() => router.push('/instructor/courses')}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
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
                <button 
                  onClick={() => setShowSettingsModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
                >
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
                <div className="text-3xl font-bold text-indigo-600 mb-2">{assignments.length}</div>
                <div className="text-sm text-gray-600">Total Assignments</div>
              </div>
              <div className="text-center">
                <button
                  onClick={() => router.push(`/instructor/courses/${courseId}/students`)}
                  className="group cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                >
                  <div className="text-3xl font-bold text-purple-600 mb-2 group-hover:text-purple-700 transition-colors">{course.enrollmentCount}</div>
                  <div className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">Students Enrolled</div>
                </button>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-rose-500 mb-2">
                  {assignments.reduce((sum, assignment) => sum + assignment.submissionsCount, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Submissions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-2">
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
              <button 
                onClick={() => router.push(`/instructor/courses/${courseId}/assignments/create`)}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
              >
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
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
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
                        onClick={() => setEditingAssignment(assignment)}
                        className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => router.push(`/instructor/submissions?assignment=${assignment.assignmentId}&course=${courseId}`)}
                        className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm"
                      >
                        Submissions
                      </button>
                      <button
                        onClick={() => router.push(`/instructor/grading/bulk?assignment=${assignment.assignmentId}&course=${courseId}`)}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm"
                      >
                        Grade
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
                <button 
                  onClick={() => router.push(`/instructor/courses/${courseId}/assignments/create`)}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
                >
                  Create Your First Assignment
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Course Settings Modal */}
        <CourseSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          course={course}
          onUpdate={handleCourseUpdate}
        />
      </div>
    </InstructorRoute>
  );
};

export default InstructorCourseDetailPage;
