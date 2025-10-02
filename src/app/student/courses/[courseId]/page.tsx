'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { CourseDetails } from '@/components/student/CourseDetails';
import { CourseAssignments } from '@/components/student/CourseAssignments';
import { CourseStudents } from '@/components/student/CourseStudents';
import { CourseMaterials } from '@/components/student/CourseMaterials';

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
  status: 'not-started' | 'in-progress' | 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
  submissionType: 'text' | 'file' | 'video';
  createdAt: string;
}

interface Student {
  studentId: string;
  name: string;
  email: string;
  avatar?: string;
  enrollmentDate: string;
  status: 'active' | 'dropped' | 'completed';
  grade?: string;
}

const StudentCourseDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'students' | 'materials'>('assignments');

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

      // Fetch real course data from API
      const courseResponse = await fetch(`/api/courses/${courseId}`, {
        credentials: 'include',
      });

      if (!courseResponse.ok) {
        throw new Error(`Failed to fetch course: ${courseResponse.statusText}`);
      }

      const courseData = await courseResponse.json();
      
      if (!courseData.success || !courseData.data) {
        throw new Error('Course not found or invalid response');
      }

      const apiCourse = courseData.data;
      
      // Transform API data to match component interface
      const course: Course = {
        courseId: apiCourse.courseId || apiCourse.id,
        courseName: apiCourse.courseName || apiCourse.title,
        courseCode: apiCourse.courseCode || apiCourse.code,
        description: apiCourse.description || '',
        instructor: {
          name: apiCourse.instructorName || 'Unknown Instructor',
          email: apiCourse.instructorEmail || '',
          avatar: apiCourse.instructorAvatar || '/api/placeholder/40/40'
        },
        semester: apiCourse.semester || 'Fall',
        year: apiCourse.year || 2024,
        status: apiCourse.status || 'published',
        enrollmentCount: apiCourse.enrollment?.students?.length || 0,
        maxEnrollment: apiCourse.maxEnrollment || apiCourse.maxStudents,
        credits: apiCourse.credits || 3,
        schedule: {
          days: apiCourse.schedule?.days || ['Monday', 'Wednesday', 'Friday'],
          time: apiCourse.schedule?.time || 'TBD',
          location: apiCourse.schedule?.location || 'TBD'
        },
        prerequisites: apiCourse.prerequisites || [],
        learningObjectives: apiCourse.learningObjectives || [],
        gradingPolicy: {
          assignments: apiCourse.gradingPolicy?.assignments || 40,
          exams: apiCourse.gradingPolicy?.exams || 30,
          participation: apiCourse.gradingPolicy?.participation || 10,
          final: apiCourse.gradingPolicy?.final || 20
        },
        createdAt: apiCourse.createdAt || new Date().toISOString(),
        updatedAt: apiCourse.updatedAt || new Date().toISOString()
      };

      setCourse(course);

      // Fetch assignments for this course
      try {
        const assignmentsResponse = await fetch(`/api/student/assignments?courseId=${courseId}`, {
          credentials: 'include',
        });

        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json();
          if (assignmentsData.assignments) {
            setAssignments(assignmentsData.assignments);
          }
        }
      } catch (assignmentError) {
        console.warn('Failed to fetch assignments:', assignmentError);
        setAssignments([]);
      }

      // Fetch students for this course (if user has permission)
      try {
        const studentsResponse = await fetch(`/api/courses/${courseId}/students`, {
          credentials: 'include',
        });

        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          if (studentsData.success && studentsData.data) {
            setStudents(studentsData.data);
          }
        }
      } catch (studentError) {
        console.warn('Failed to fetch students:', studentError);
        setStudents([]);
      }

    } catch (err) {
      console.error('Error fetching course details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch course details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
          <div className="text-center">
            <LoadingSpinner text="Loading course details..." />
          </div>
        </div>
      </StudentRoute>
    );
  }

  if (error) {
    return (
      <StudentRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Course</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-4">
              <button
                onClick={fetchCourseDetails}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300 mr-4"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/student/courses')}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Courses
              </button>
            </div>
          </div>
        </div>
      </StudentRoute>
    );
  }

  if (!course) {
    return (
      <StudentRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
          <LoadingSpinner text="Loading course details..." />
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {/* Social Media Style Header */}
        <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <span className="text-xl">&lt;</span>
            </button>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              📚
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {course.courseName}
              </h1>
              <p className="text-xs text-gray-600 truncate">
                {course.courseCode} • {course.instructor.name}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <img
                src="/MyClassCast (800 x 200 px).png"
                alt="MyClassCast"
                className="h-6 w-auto object-contain"
              />
              <button
                onClick={() => router.push('/student/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Home Dashboard"
              >
                <span className="text-xl">🏠</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 flex-shrink-0">
          <div className="flex space-x-1">
            {[
              { id: 'assignments', label: 'Assignments', icon: '📝' },
              { id: 'materials', label: 'Files', icon: '📚' },
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'students', label: 'Classmates', icon: '👥' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-3 py-2 rounded-xl font-bold text-xs transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {activeTab === 'overview' && (
              <CourseDetails
                course={course}
                assignments={assignments}
                students={students}
              />
            )}
            {activeTab === 'assignments' && (
              <CourseAssignments
                courseId={courseId}
                assignments={assignments}
                onAssignmentUpdate={fetchCourseDetails}
              />
            )}
            {activeTab === 'students' && (
              <CourseStudents
                students={students}
                course={course}
              />
            )}
            {activeTab === 'materials' && (
              <CourseMaterials
                courseId={courseId}
                course={course}
              />
            )}
          </div>
        </div>
      </div>
    </StudentRoute>
  );
};

export default StudentCourseDetailPage;
