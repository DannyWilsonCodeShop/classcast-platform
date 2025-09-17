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
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'students' | 'materials'>('overview');

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

      // Fetch assignments for this course
      const assignmentsResponse = await fetch(`/api/courses/${courseId}/assignments`, {
        credentials: 'include',
      });

      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        if (assignmentsData.success) {
          setAssignments(assignmentsData.data);
        }
      }

      // Fetch enrolled students
      const studentsResponse = await fetch(`/api/courses/${courseId}/students`, {
        credentials: 'include',
      });

      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        if (studentsData.success) {
          setStudents(studentsData.data);
        }
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

  if (error || !course) {
    return (
      <StudentRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
          <div className="text-center">
            <div className="text-6xl mb-4">😞</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Course Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The course you are looking for does not exist.'}</p>
            <button
              onClick={() => router.push('/courses')}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-yellow-300/30 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/courses')}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="text-2xl">←</span>
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {course.courseName}
                  </h1>
                  <p className="text-gray-600">
                    {course.courseCode} • {course.instructor.name} • {course.semester} {course.year}
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
                  📚 Materials
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
                { id: 'students', label: 'Classmates', icon: '👥' },
                { id: 'materials', label: 'Materials', icon: '📚' },
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
