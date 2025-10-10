'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import CourseSettingsModal from '@/components/instructor/CourseSettingsModal';
import AssignmentCreationForm from '@/components/instructor/AssignmentCreationForm';
import SectionList from '@/components/instructor/SectionList';
import { AssignmentType, AssignmentStatus } from '@/types/dynamodb';

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

interface VideoSubmission {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  courseId: string;
  videoUrl: string;
  videoTitle: string;
  videoDescription: string;
  duration: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  thumbnailUrl?: string;
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

const InstructorCourseDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [videoSubmissions, setVideoSubmissions] = useState<VideoSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [activeTab, setActiveTab] = useState<'assignments' | 'submissions' | 'students'>('assignments');

  const courseId = params.courseId as string;

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId && activeTab === 'submissions') {
      fetchVideoSubmissions();
    }
  }, [courseId, activeTab]);

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

      // Fetch sections for this course
      await fetchSections();

    } catch (err) {
      console.error('Error fetching course details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch course details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await fetch(`/api/sections?courseId=${courseId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSections(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching sections:', err);
      // Don't set error for sections as it's not critical
    }
  };

  const fetchVideoSubmissions = async () => {
    try {
      console.log('Course page: Fetching video submissions for course:', courseId);
      const url = `/api/instructor/video-submissions?courseId=${courseId}`;
      console.log('Course page API URL:', url);
      
      const response = await fetch(url, {
        credentials: 'include',
      });

      console.log('Course page video submissions API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Course page video submissions API response data:', data);
        if (data.success) {
          console.log('Course page setting video submissions:', data.submissions);
          setVideoSubmissions(data.submissions || []);
        } else {
          console.log('Course page API returned success: false, error:', data.error);
        }
      } else {
        console.log('Course page video submissions API failed with status:', response.status);
        const errorText = await response.text();
        console.log('Course page error response:', errorText);
      }
    } catch (error) {
      console.error('Course page error fetching video submissions:', error);
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

  const handleDeleteCourse = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/instructor/courses/${courseId}/delete`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Course deleted successfully! Deleted ${data.deletedAssignments} assignments and ${data.deletedSubmissions} submissions.`);
        router.push('/instructor/dashboard');
      } else {
        alert(`Failed to delete course: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <LoadingSpinner />
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
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
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
                  ⚙️ Course Settings
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${course.courseName}"? This action cannot be undone and will delete all assignments, submissions, and student data associated with this course.`)) {
                      handleDeleteCourse();
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                >
                  🗑️ Delete Course
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Section List - shows sections if they exist */}
          <SectionList
            courseId={courseId}
            sections={sections}
          />
          
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

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
              <button
                onClick={() => setActiveTab('assignments')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'assignments'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📝 Assignments
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'submissions'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🎥 Video Submissions
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'students'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                👥 Students
              </button>
            </div>

            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
              <div>
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
            )}

            {/* Video Submissions Tab */}
            {activeTab === 'submissions' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Video Submissions</h2>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      {videoSubmissions.length} submission{videoSubmissions.length !== 1 ? 's' : ''}
                    </div>
                    <button
                      onClick={() => router.push(`/instructor/grading/bulk?course=${courseId}`)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm"
                    >
                      Show All Submissions
                    </button>
                  </div>
                </div>
                
                {videoSubmissions.length > 0 ? (
                  <div className="space-y-4">
                    {videoSubmissions.map((submission) => (
                      <div
                        key={submission.submissionId}
                        className="bg-gray-50 rounded-xl p-6 border border-gray-200"
                      >
                        <div className="flex items-start space-x-4">
                          {/* Student Avatar */}
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {submission.student.name.charAt(0).toUpperCase()}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-semibold text-gray-800">
                                {submission.student.name}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                submission.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                                submission.status === 'graded' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              Assignment: {submission.assignment.title}
                            </p>
                            
                            <p className="text-sm text-gray-500 mb-4">
                              Submitted: {new Date(submission.submittedAt).toLocaleDateString()} at {new Date(submission.submittedAt).toLocaleTimeString()}
                            </p>
                            
                            {/* Video Preview with Thumbnail */}
                            <div className="bg-black rounded-lg overflow-hidden mb-4 relative group">
                              <video
                                src={submission.videoUrl}
                                controls
                                className="w-full h-64 object-cover"
                                poster={submission.thumbnailUrl || '/api/placeholder/400/300'}
                                onError={(e) => {
                                  console.error('Video load error for submission:', submission.submissionId);
                                  console.error('Video URL:', submission.videoUrl);
                                }}
                              >
                                Your browser does not support the video tag.
                              </video>
                              {/* Play overlay for better UX */}
                              <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                                <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                                  <svg className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>
                            </div>
                            
                            {/* Submission Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                              <div>
                                <span className="font-medium">File:</span> {submission.fileName}
                              </div>
                              <div>
                                <span className="font-medium">Size:</span> {(submission.fileSize / (1024 * 1024)).toFixed(2)} MB
                              </div>
                              <div>
                                <span className="font-medium">Type:</span> {submission.isRecorded ? 'Recorded' : 'Uploaded'}
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span> {submission.duration || 'Unknown'}
                              </div>
                            </div>
                            
                            {/* Grade and Feedback */}
                            {submission.status === 'graded' && (
                              <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-700">Grade:</span>
                                  <span className="text-2xl font-bold text-blue-600">
                                    {submission.grade || 'N/A'}
                                  </span>
                                </div>
                                {submission.instructorFeedback && (
                                  <div>
                                    <span className="font-medium text-gray-700">Feedback:</span>
                                    <p className="text-gray-600 mt-1">{submission.instructorFeedback}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="flex space-x-2 mt-4">
                              <button 
                                onClick={() => router.push(`/instructor/grading/bulk?assignment=${submission.assignmentId}&course=${courseId}&submission=${submission.submissionId}`)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                              >
                                Grade Submission
                              </button>
                              <button 
                                onClick={() => {
                                  // Open video in new modal or navigate to details page
                                  window.open(submission.videoUrl, '_blank');
                                }}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎥</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Video Submissions Yet</h3>
                    <p className="text-gray-600 mb-6">Students haven't submitted any videos for this course yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Students</h2>
                  <div className="text-sm text-gray-600">
                    {students.length} student{students.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                {students.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map((student) => (
                      <div
                        key={student.studentId}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{student.name}</h3>
                            <p className="text-sm text-gray-600">{student.email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Students Enrolled</h3>
                    <p className="text-gray-600 mb-6">Students will appear here once they enroll in your course.</p>
                  </div>
                )}
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

        {/* Assignment Editing Modal */}
        {editingAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Edit Assignment</h2>
                  <button
                    onClick={() => setEditingAssignment(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <AssignmentCreationForm
                  initialData={{
                    title: editingAssignment.title,
                    description: editingAssignment.description,
                    assignmentType: AssignmentType.VIDEO_ASSIGNMENT,
                    dueDate: editingAssignment.dueDate,
                    maxScore: editingAssignment.points,
                    requirements: [editingAssignment.description],
                    allowLateSubmission: true,
                    latePenalty: 10,
                    maxSubmissions: 1,
                    groupAssignment: false,
                    maxGroupSize: 4,
                    allowedFileTypes: editingAssignment.submissionType === 'file' ? ['.pdf', '.doc', '.docx'] : [],
                    maxFileSize: 10 * 1024 * 1024, // 10MB
                    enablePeerResponses: false,
                    minResponsesRequired: 0,
                    maxResponsesPerVideo: 0,
                    responseDueDate: editingAssignment.dueDate,
                    status: editingAssignment.status === 'grading' ? AssignmentStatus.PUBLISHED : editingAssignment.status === 'completed' ? AssignmentStatus.CLOSED : editingAssignment.status === 'draft' ? AssignmentStatus.DRAFT : editingAssignment.status === 'published' ? AssignmentStatus.PUBLISHED : AssignmentStatus.DRAFT
                  }}
                  onSubmit={async (assignmentData) => {
                    try {
                      // Update assignment logic would go here
                      console.log('Updating assignment:', assignmentData);
                      setEditingAssignment(null);
                      // Refresh assignments
                      await fetchCourseDetails();
                    } catch (error) {
                      console.error('Error updating assignment:', error);
                    }
                  }}
                  onCancel={() => setEditingAssignment(null)}
                  courseId={courseId}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </InstructorRoute>
  );
};

export default InstructorCourseDetailPage;
