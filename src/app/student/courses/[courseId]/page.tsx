'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import RichTextRenderer from '@/components/common/RichTextRenderer';
import { EmptyState } from '@/components/common/EmptyState';

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
  status: 'upcoming' | 'past_due' | 'completed';
  submissionType: 'text' | 'file' | 'video';
  assignmentType: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  instructor: string;
  createdAt: string;
  resources?: any[];
  isSubmitted: boolean;
  submittedAt?: string;
  grade?: number;
  feedback?: string;
}

interface Classmate {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  enrolledAt: string;
  status: string;
  avatar?: string;
}

interface Section {
  sectionId: string;
  sectionName: string;
  sectionCode?: string;
  description?: string;
  maxEnrollment: number;
  currentEnrollment: number;
  schedule?: {
    days: string[];
    time: string;
    location: string;
  };
  location?: string;
  instructorId: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

const StudentCourseDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showClassmates, setShowClassmates] = useState(false);

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

      // Fetch course data
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
      await fetchAssignments();
      
      // Fetch classmates for this course
      await fetchClassmates();
      
      // Fetch sections for this course
      await fetchSections();

    } catch (err) {
      console.error('Error fetching course details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch course details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      // Try student assignments API first
      const assignmentsResponse = await fetch(`/api/student/assignments?courseId=${courseId}&userId=${user?.id}`, {
        credentials: 'include',
      });

      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        if (assignmentsData.assignments) {
          // Sort by createdAt descending (newest first)
          const sortedAssignments = assignmentsData.assignments.sort((a: Assignment, b: Assignment) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          setAssignments(sortedAssignments);
          return;
        }
      }

      // Fallback to general assignments API
      const generalResponse = await fetch(`/api/assignments?courseId=${courseId}`, {
        credentials: 'include',
      });

      if (generalResponse.ok) {
        const generalData = await generalResponse.json();
        if (generalData.success && generalData.data?.assignments) {
          // Transform assignments to match our interface
          const transformedAssignments = generalData.data.assignments.map((assignment: any) => ({
            assignmentId: assignment.assignmentId,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate,
            points: assignment.maxScore || 100,
            status: 'upcoming' as const,
            submissionType: assignment.assignmentType === 'video' ? 'video' as const : 'file' as const,
            assignmentType: assignment.assignmentType,
            courseId: assignment.courseId,
            courseName: course?.courseName || 'Unknown Course',
            courseCode: course?.courseCode || 'N/A',
            instructor: course?.instructor.name || 'Unknown Instructor',
            createdAt: assignment.createdAt,
            resources: assignment.resources || [],
            isSubmitted: false,
          }));
          // Sort by createdAt descending (newest first)
          const sortedAssignments = transformedAssignments.sort((a: Assignment, b: Assignment) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          setAssignments(sortedAssignments);
        }
      }
    } catch (assignmentError) {
      console.warn('Failed to fetch assignments:', assignmentError);
      setAssignments([]);
    }
  };

  const fetchClassmates = async () => {
    try {
      // First, get the user's section information
      const userResponse = await fetch(`/api/student/courses?userId=${user?.id}`, {
        credentials: 'include',
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.success && userData.data) {
          // Find the current course and get the user's section
          const userCourse = userData.data.find((course: any) => course.courseId === courseId);
          const userSectionId = userCourse?.sectionId;

          if (userSectionId) {
            // Fetch students from the same section
            const sectionResponse = await fetch(`/api/sections/${userSectionId}/enrollments`, {
              credentials: 'include',
            });

            if (sectionResponse.ok) {
              const sectionData = await sectionResponse.json();
              if (sectionData.success && sectionData.data) {
                // Filter out the current user from classmates list
                const classmatesList = sectionData.data.filter(
                  (student: Classmate) => student.userId !== user?.id
                );
                setClassmates(classmatesList);
                return;
              }
            }
          }
        }
      }

      // Fallback to course-level enrollment if section-specific fails
      const response = await fetch(`/api/courses/enrollment?courseId=${courseId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.students) {
          // Filter out the current user from classmates list
          const classmatesList = data.data.students.filter(
            (student: Classmate) => student.userId !== user?.id
          );
          setClassmates(classmatesList);
        }
      }
    } catch (classmatesError) {
      console.warn('Failed to fetch classmates:', classmatesError);
      setClassmates([]);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await fetch(`/api/sections?courseId=${courseId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSections(data.data);
        }
      }
    } catch (sectionsError) {
      console.warn('Failed to fetch sections:', sectionsError);
      setSections([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '📋';
      case 'past_due':
        return '⚠️';
      case 'completed':
        return '✅';
      default:
        return '📝';
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'completed';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <StudentRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
          <div className="text-center">
            <LoadingSpinner />
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
          <LoadingSpinner />
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Clean Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* ClassCast Logo */}
                <div className="flex-shrink-0">
                  <img 
                    src="/UpdatedCCLogo.png" 
                    alt="ClassCast Logo" 
                    className="h-8 w-auto object-contain cursor-pointer"
                    onClick={() => router.push('/student/dashboard')}
                    title="Go to Dashboard"
                  />
                </div>
                
                <button
                  onClick={() => router.push('/student/dashboard')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Back to Dashboard"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{course.courseName}</h1>
                  <p className="text-sm text-gray-500">{course.courseCode} • {course.instructor.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowClassmates(!showClassmates)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                👥 {classmates.length} Classmates
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - Assignments Only */}
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Assignments Heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-2">📝</span>
              Assignments
            </h2>
            <p className="text-gray-600 mt-1">Your course assignments and due dates</p>
          </div>

          {/* Assignments List */}
          {assignments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Assignments Found</h3>
                    <p className="text-gray-600 mb-4">
                      No assignments have been posted for this course yet.
                    </p>
                    <button
                      onClick={fetchAssignments}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.assignmentId}
                        className="bg-white rounded-lg p-5 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Left: Assignment Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                              {assignment.grade !== undefined && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                                  {assignment.grade}%
                                </span>
                              )}
                            </div>
                            
                            {assignment.description && (
                              <RichTextRenderer 
                                content={assignment.description}
                                className="text-sm text-gray-600 mb-3"
                                maxLines={2}
                              />
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                📅 {new Date(assignment.dueDate).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                ⭐ {assignment.points} pts
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                                {assignment.status === 'completed' ? '✓' : assignment.status === 'past_due' ? '!' : '○'} 
                                {assignment.status.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                              </span>
                            </div>
                          </div>

                          {/* Right: Action Buttons */}
                          <div className="flex-shrink-0 flex flex-col gap-2">
                            <button 
                              onClick={() => router.push(`/student/assignments/${assignment.assignmentId}`)}
                              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                            >
                              {assignment.status === 'completed' ? 'View' : 'Open'}
                            </button>
                            <button 
                              onClick={() => router.push(`/student/peer-reviews?assignmentId=${assignment.assignmentId}`)}
                              className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium whitespace-nowrap flex items-center justify-center gap-1"
                            >
                              <span>💬</span>
                              <span>Peer Responses</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

          {/* Collapsible Classmates Section */}
          {showClassmates && classmates.length > 0 && (
            <div className="bg-white rounded-lg p-5 border border-gray-200 mt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Classmates ({classmates.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {classmates.map((classmate) => (
                  <div
                    key={classmate.userId}
                    onClick={() => router.push(`/student/profile/${classmate.userId}`)}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    {classmate.avatar ? (
                      <img
                        src={classmate.avatar}
                        alt={`${classmate.firstName} ${classmate.lastName}`}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${classmate.avatar ? 'hidden' : ''}`}>
                      {classmate.firstName?.charAt(0)}{classmate.lastName?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {classmate.firstName} {classmate.lastName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentRoute>
  );
};

export default StudentCourseDetailPage;
