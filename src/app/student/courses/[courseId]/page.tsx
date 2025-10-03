'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'students' | 'materials' | 'sections'>('assignments');

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
          setAssignments(assignmentsData.assignments);
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
          setAssignments(transformedAssignments);
        }
      }
    } catch (assignmentError) {
      console.warn('Failed to fetch assignments:', assignmentError);
      setAssignments([]);
    }
  };

  const fetchClassmates = async () => {
    try {
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
      <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {/* Header */}
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

        {/* Navigation Tabs */}
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 flex-shrink-0">
          <div className="flex space-x-1">
            {[
              { id: 'assignments', label: 'Assignments', icon: '📝' },
              { id: 'sections', label: 'Sections', icon: '🏫' },
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {activeTab === 'assignments' && (
              <div className="space-y-6">
                {/* Assignments Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">Video Assignments</h2>
                  <div className="text-sm text-gray-600">
                    {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
                  </div>
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
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.assignmentId}
                        className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                          isOverdue(assignment.dueDate, assignment.status)
                            ? 'border-red-200 bg-red-50/50'
                            : 'border-gray-200/30'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-800">{assignment.title}</h3>
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(assignment.status)}`}>
                                {getStatusIcon(assignment.status)} {assignment.status.replace('_', ' ')}
                              </span>
                              {isOverdue(assignment.dueDate, assignment.status) && (
                                <span className="px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800">
                                  Overdue
                                </span>
                              )}
                            </div>
                            
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Instructions:</h4>
                              <p className="text-gray-600 line-clamp-3">{assignment.description}</p>
                            </div>
                            
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <span>📅</span>
                                <span>Due {formatDate(assignment.dueDate)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span>⭐</span>
                                <span>{assignment.points} points</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span>📄</span>
                                <span className="capitalize">{assignment.submissionType}</span>
                              </div>
                            </div>

                            {assignment.grade !== undefined && (
                              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-green-800">Grade: {assignment.grade}%</span>
                                  <span className="text-sm text-green-600">
                                    {assignment.feedback ? 'Feedback available' : 'No feedback'}
                                  </span>
                                </div>
                                {assignment.feedback && (
                                  <p className="mt-2 text-sm text-green-700">{assignment.feedback}</p>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            {assignment.status === 'upcoming' || assignment.status === 'past_due' ? (
                              <>
                                <button 
                                  onClick={() => router.push(`/student/assignments/${assignment.assignmentId}`)}
                                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                                >
                                  View Details
                                </button>
                                <button 
                                  onClick={() => router.push(`/student/video-submission?assignmentId=${assignment.assignmentId}&courseId=${courseId}`)}
                                  className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                                >
                                  🎥 Record Video
                                </button>
                              </>
                            ) : assignment.status === 'completed' ? (
                              <button 
                                onClick={() => router.push(`/student/assignments/${assignment.assignmentId}`)}
                                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold"
                              >
                                View Submission
                              </button>
                            ) : (
                              <button 
                                onClick={() => router.push(`/student/assignments/${assignment.assignmentId}`)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold"
                              >
                                View Details
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assignment Stats */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Assignment Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">
                        {assignments.filter(a => a.status === 'upcoming').length}
                      </div>
                      <div className="text-sm text-gray-600">Upcoming</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">
                        {assignments.filter(a => a.status === 'completed').length}
                      </div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-500">
                        {assignments.filter(a => a.status === 'past_due').length}
                      </div>
                      <div className="text-sm text-gray-600">Overdue</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500">
                        {assignments.length > 0 ? Math.round(assignments.reduce((sum, a) => sum + a.points, 0) / assignments.length) : 0}
                      </div>
                      <div className="text-sm text-gray-600">Avg Points</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sections' && (
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Course Sections</h3>
                    <div className="text-sm text-gray-600">
                      {sections.length} section{sections.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  {sections.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">🏫</div>
                      <p className="text-gray-600">No sections available for this course.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sections.map((section) => (
                        <div
                          key={section.sectionId}
                          className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border border-gray-200/30 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-800 text-lg">
                              {section.sectionName}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              section.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {section.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          {section.sectionCode && (
                            <div className="mb-2">
                              <span className="text-sm text-gray-600">Code: </span>
                              <span className="font-mono text-sm font-semibold text-blue-600">
                                {section.sectionCode}
                              </span>
                            </div>
                          )}
                          
                          {section.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {section.description}
                            </p>
                          )}
                          
                          <div className="space-y-2 text-sm text-gray-500">
                            <div className="flex items-center justify-between">
                              <span>Enrollment:</span>
                              <span className="font-medium">
                                {section.currentEnrollment}/{section.maxEnrollment}
                              </span>
                            </div>
                            
                            {section.schedule && (
                              <div>
                                <span className="text-gray-600">Schedule:</span>
                                <div className="text-xs mt-1">
                                  <div>{section.schedule.days?.join(', ')}</div>
                                  <div>{section.schedule.time}</div>
                                  <div>{section.schedule.location}</div>
                                </div>
                              </div>
                            )}
                            
                            {section.location && !section.schedule && (
                              <div>
                                <span className="text-gray-600">Location: </span>
                                <span>{section.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Course Overview</h3>
                  <p className="text-gray-600 mb-4">{course.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Course Details</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Code:</strong> {course.courseCode}</p>
                        <p><strong>Semester:</strong> {course.semester} {course.year}</p>
                        <p><strong>Credits:</strong> {course.credits}</p>
                        <p><strong>Students:</strong> {course.enrollmentCount}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Schedule</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Days:</strong> {course.schedule.days.join(', ')}</p>
                        <p><strong>Time:</strong> {course.schedule.time}</p>
                        <p><strong>Location:</strong> {course.schedule.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Course Materials</h3>
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📚</div>
                    <p className="text-gray-600">No materials uploaded yet.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Classmates</h3>
                    <div className="text-sm text-gray-600">
                      {classmates.length} classmate{classmates.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  {classmates.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">👥</div>
                      <p className="text-gray-600">No other students enrolled yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {classmates.map((classmate) => (
                        <div
                          key={classmate.userId}
                          className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border border-gray-200/30 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {classmate.firstName?.charAt(0) || '?'}
                              {classmate.lastName?.charAt(0) || ''}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-800 truncate">
                                {classmate.firstName} {classmate.lastName}
                              </h4>
                              <p className="text-sm text-gray-600 truncate">
                                {classmate.email}
                              </p>
                              <p className="text-xs text-gray-500">
                                Joined {new Date(classmate.enrolledAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentRoute>
  );
};

export default StudentCourseDetailPage;