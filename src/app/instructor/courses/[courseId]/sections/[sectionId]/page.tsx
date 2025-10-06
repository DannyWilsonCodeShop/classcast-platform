'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
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
  createdAt: string;
  updatedAt: string;
}

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
  instructorId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Student {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  enrolledAt: string;
  status: 'active' | 'dropped' | 'completed';
  avatar?: string;
  sectionId?: string;
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

interface VideoSubmission {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  courseId: string;
  sectionId: string;
  videoUrl: string;
  videoTitle: string;
  videoDescription: string;
  duration: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  isRecorded: boolean;
  isUploaded: boolean;
  status: 'submitted' | 'graded' | 'returned';
  grade?: number;
  instructorFeedback?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  gradedAt?: string;
  student: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  assignment: {
    id: string;
    title: string;
    description: string;
    dueDate?: string;
  };
}

const InstructorSectionDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [videoSubmissions, setVideoSubmissions] = useState<VideoSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'assignments' | 'submissions'>('students');

  const courseId = params.courseId as string;
  const sectionId = params.sectionId as string;

  useEffect(() => {
    if (courseId && sectionId) {
      fetchSectionDetails();
    }
  }, [courseId, sectionId]);

  useEffect(() => {
    if (courseId && sectionId && activeTab === 'submissions') {
      fetchVideoSubmissions();
    }
  }, [courseId, sectionId, activeTab]);

  const fetchSectionDetails = async () => {
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

      // Fetch students in this section
      await fetchSectionStudents();

      // Fetch assignments for this course
      await fetchAssignments();

    } catch (err) {
      console.error('Error fetching section details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch section details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionStudents = async () => {
    try {
      const response = await fetch(`/api/sections/${sectionId}/enrollments`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStudents(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching section students:', err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/assignments?courseId=${courseId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const apiAssignments = data.data.assignments || [];
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
            createdAt: assignment.createdAt
          }));
          setAssignments(transformedAssignments);
        }
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  };

  const fetchVideoSubmissions = async () => {
    try {
      console.log('Fetching video submissions for course:', courseId, 'section:', sectionId);
      const url = `/api/instructor/video-submissions?courseId=${courseId}&sectionId=${sectionId}`;
      console.log('API URL:', url);
      
      const response = await fetch(url, {
        credentials: 'include',
      });

      console.log('Video submissions API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Video submissions API response data:', data);
        if (data.success) {
          console.log('Setting video submissions:', data.submissions);
          setVideoSubmissions(data.submissions || []);
        } else {
          console.log('API returned success: false, error:', data.error);
        }
      } else {
        console.log('Video submissions API failed with status:', response.status);
        const errorText = await response.text();
        console.log('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching video submissions:', error);
    }
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
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading section details...</p>
          </div>
        </div>
      </InstructorRoute>
    );
  }

  if (error) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Section</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-4">
              <button
                onClick={fetchSectionDetails}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300 mr-4"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push(`/instructor/courses/${courseId}`)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300"
              >
                Back to Course
              </button>
            </div>
          </div>
        </div>
      </InstructorRoute>
    );
  }

  if (!course || !section) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
          <LoadingSpinner size="lg" />
        </div>
      </InstructorRoute>
    );
  }

  return (
    <InstructorRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push(`/instructor/courses/${courseId}`)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="text-xl">&lt;</span>
              </button>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                🏫
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {section.sectionName}
                </h1>
                <p className="text-xs text-gray-600 truncate">
                  {course.courseName} • {section.classCode}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <img
                  src="/MyClassCast (800 x 200 px).png"
                  alt="MyClassCast"
                  className="h-6 w-auto object-contain"
                />
                <button
                  onClick={() => router.push('/instructor/dashboard')}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Dashboard"
                >
                  <span className="text-xl">🏠</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Section Info Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Section Details</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Section Code:</strong> {section.sectionCode || 'N/A'}</p>
                  <p><strong>Class Code:</strong> <span className="font-mono bg-blue-100 px-2 py-1 rounded">{section.classCode}</span></p>
                  <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs font-medium ${section.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{section.isActive ? 'Active' : 'Inactive'}</span></p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Enrollment</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Current:</strong> {section.currentEnrollment} students</p>
                  <p><strong>Maximum:</strong> {section.maxEnrollment} students</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((section.currentEnrollment / section.maxEnrollment) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Schedule</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  {section.schedule ? (
                    <>
                      <p><strong>Days:</strong> {section.schedule.days.join(', ')}</p>
                      <p><strong>Time:</strong> {section.schedule.time}</p>
                      <p><strong>Location:</strong> {section.schedule.location}</p>
                    </>
                  ) : section.location ? (
                    <p><strong>Location:</strong> {section.location}</p>
                  ) : (
                    <p className="text-gray-500">No schedule set</p>
                  )}
                </div>
              </div>
            </div>
            {section.description && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Description</h4>
                <p className="text-gray-600 text-sm">{section.description}</p>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30 mb-8">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('students')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'students'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                👥 Students ({students.length})
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'assignments'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📝 Assignments ({assignments.length})
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'submissions'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🎥 Submissions ({videoSubmissions.length})
              </button>
            </div>

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Students in this Section</h2>
                  <div className="text-sm text-gray-600">
                    {section.currentEnrollment} of {section.maxEnrollment} enrolled
                  </div>
                </div>
                
                {students.length === 0 ? (
                  <EmptyState
                    title="No Students Enrolled"
                    description="No students have enrolled in this section yet. Students can join using the class code."
                    icon="👥"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map((student) => (
                      <div
                        key={student.userId}
                        className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border border-gray-200/30 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {student.firstName?.charAt(0) || '?'}
                            {student.lastName?.charAt(0) || ''}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-800 truncate">
                              {student.firstName} {student.lastName}
                            </h4>
                            <p className="text-sm text-gray-600 truncate">
                              {student.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              Joined {formatDate(student.enrolledAt)}
                            </p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                              student.status === 'active' ? 'bg-green-100 text-green-800' :
                              student.status === 'dropped' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {student.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Course Assignments</h2>
                  <button 
                    onClick={() => router.push(`/instructor/courses/${courseId}/assignments/create`)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
                  >
                    + Create Assignment
                  </button>
                </div>
                
                {assignments.length === 0 ? (
                  <EmptyState
                    title="No Assignments"
                    description="No assignments have been created for this course yet."
                    icon="📝"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.assignmentId}
                        className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-md border border-gray-200/30 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">{assignment.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            assignment.status === 'published' ? 'bg-green-100 text-green-800' :
                            assignment.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                            assignment.status === 'grading' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {assignment.status}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{assignment.description}</p>
                        
                        <div className="space-y-2 text-sm text-gray-500">
                          <div className="flex items-center justify-between">
                            <span>Due Date:</span>
                            <span>{formatDate(assignment.dueDate)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Points:</span>
                            <span>{assignment.points}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Submissions:</span>
                            <span>{assignment.submissionsCount}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Graded:</span>
                            <span>{assignment.gradedCount}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Submissions Tab */}
            {activeTab === 'submissions' && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Video Submissions</h2>
                  <div className="text-sm text-gray-600">
                    {videoSubmissions.length} submission{videoSubmissions.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                {videoSubmissions.length === 0 ? (
                  <EmptyState
                    title="No Submissions"
                    description="No video submissions have been made for this section yet."
                    icon="🎥"
                  />
                ) : (
                  <div className="space-y-4">
                    {videoSubmissions.map((submission) => (
                      <div
                        key={submission.submissionId}
                        className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-md border border-gray-200/30 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">{submission.videoTitle}</h3>
                            <p className="text-gray-600 text-sm mb-3">{submission.videoDescription}</p>
                            
                            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                              <div className="flex items-center space-x-1">
                                <span>👤</span>
                                <span>{submission.student.name}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span>📝</span>
                                <span>{submission.assignment.title}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span>⏱️</span>
                                <span>{Math.floor(submission.duration / 60)}:{(submission.duration % 60).toString().padStart(2, '0')}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span>📅</span>
                                <span>{formatDate(submission.submittedAt)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                              submission.status === 'graded' ? 'bg-green-100 text-green-800' :
                              submission.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {submission.status}
                            </span>
                            {submission.grade !== undefined && (
                              <span className="text-lg font-bold text-gray-800">
                                {submission.grade}%
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {submission.instructorFeedback && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-1">Instructor Feedback:</h4>
                            <p className="text-gray-600 text-sm">{submission.instructorFeedback}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default InstructorSectionDetailPage;