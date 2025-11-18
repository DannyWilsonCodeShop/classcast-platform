'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Avatar from '@/components/common/Avatar';
import CourseSettingsModal from '@/components/instructor/CourseSettingsModal';
import AssignmentCreationForm from '@/components/instructor/AssignmentCreationForm';
import AssignmentDetailsModal from '@/components/instructor/AssignmentDetailsModal';
import SectionList from '@/components/instructor/SectionList';
import { AssignmentType, AssignmentStatus } from '@/types/dynamodb';
import RichTextRenderer from '@/components/common/RichTextRenderer';

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
  // Peer Review Settings
  enablePeerResponses?: boolean;
  minResponsesRequired?: number;
  maxResponsesPerVideo?: number;
  responseDueDate?: string;
  responseWordLimit?: number;
  responseCharacterLimit?: number;
  hidePeerVideosUntilInstructorPosts?: boolean;
  peerReviewScope?: 'section' | 'course';
  // Video Settings
  requireLiveRecording?: boolean;
  allowYouTubeUrl?: boolean;
  // Other Settings
  allowLateSubmission?: boolean;
  latePenalty?: number;
  maxSubmissions?: number;
  groupAssignment?: boolean;
  maxGroupSize?: number;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  resources?: any[];
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
  sectionName?: string;
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

interface PeerResponse {
  id: string;
  reviewerId: string;
  reviewerName: string;
  videoId: string;
  reviewedStudentId: string;
  reviewedStudentName: string;
  assignmentId: string;
  assignmentTitle: string;
  content: string;
  submittedAt: string;
  isSubmitted: boolean;
  wordCount: number;
  characterCount: number;
}

const InstructorCourseDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Get tab from URL parameters
  const tabParam = searchParams.get('tab') as 'assignments' | 'submissions' | 'students' | null;
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [videoSubmissions, setVideoSubmissions] = useState<VideoSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [activeTab, setActiveTab] = useState<'assignments' | 'submissions' | 'students'>(tabParam || 'assignments');
  const [globalPlaybackSpeed, setGlobalPlaybackSpeed] = useState(1.0);
  const [gradingSubmission, setGradingSubmission] = useState<string | null>(null);
  const [grades, setGrades] = useState<{[key: string]: { grade: number | '', feedback: string }}>({});
  const [peerResponses, setPeerResponses] = useState<PeerResponse[]>([]);
  const [removingStudent, setRemovingStudent] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<{studentId: string, studentName: string} | null>(null);
  const [expandedPeerResponses, setExpandedPeerResponses] = useState<Set<string>>(new Set());
  const [collapsedVideos, setCollapsedVideos] = useState<Set<string>>(new Set());

  const courseId = params.courseId as string;

  // Calculate submission counts per student and sort by section
  const studentsWithSubmissionCounts = useMemo(() => {
    console.log('🔢 STUDENTS TAB: Calculating student submission counts');
    console.log('🔢 STUDENTS TAB: Total video submissions:', videoSubmissions.length);
    console.log('🔢 STUDENTS TAB: Total students:', students.length);
    console.log('🔢 STUDENTS TAB: Course ID:', courseId);
    
    const counts: Record<string, number> = {};
    
    // Count submissions per student for THIS course only
    videoSubmissions.forEach(submission => {
      // Ensure we're only counting submissions for this course
      if (submission.courseId === courseId) {
        const studentId = submission.studentId;
        counts[studentId] = (counts[studentId] || 0) + 1;
        console.log(`🔢 STUDENTS TAB: Student ${studentId} (${submission.student?.name}): ${counts[studentId]} submissions`);
      } else {
        console.log(`🔢 STUDENTS TAB: Skipping submission from different course: ${submission.courseId}`);
      }
    });
    
    console.log('🔢 STUDENTS TAB: Final student submission counts:', counts);
    
    // Update students with submission counts and sort by section
    const updatedStudents = students.map(student => {
      const submissionCount = counts[student.studentId] || 0;
      console.log(`🔢 STUDENTS TAB: Student ${student.name} (${student.studentId}): ${submissionCount} submissions`);
      
      return {
        ...student,
        assignmentsSubmitted: submissionCount
      };
    });
    
    // Sort by section name, then by student name
    return updatedStudents.sort((a, b) => {
      const sectionA = a.sectionName || 'No Section';
      const sectionB = b.sectionName || 'No Section';
      
      if (sectionA !== sectionB) {
        return sectionA.localeCompare(sectionB);
      }
      return a.name.localeCompare(b.name);
    });
  }, [students, videoSubmissions, courseId]);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      // Always fetch video submissions for accurate counts in Students tab
      fetchVideoSubmissions();
      
      if (activeTab === 'submissions') {
        fetchPeerResponses();
      }
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
            gradedCount: assignment.gradedCount || 0,
            createdAt: assignment.createdAt,
            // Peer Review Settings
            enablePeerResponses: assignment.enablePeerResponses || false,
            minResponsesRequired: assignment.minResponsesRequired || 0,
            maxResponsesPerVideo: assignment.maxResponsesPerVideo || 0,
            responseDueDate: assignment.responseDueDate,
            responseWordLimit: assignment.responseWordLimit,
            responseCharacterLimit: assignment.responseCharacterLimit,
            hidePeerVideosUntilInstructorPosts: assignment.hidePeerVideosUntilInstructorPosts || false,
            peerReviewScope: assignment.peerReviewScope || 'course',
            // Video Settings
            requireLiveRecording: assignment.requireLiveRecording || false,
            allowYouTubeUrl: assignment.allowYouTubeUrl || false,
            // Other Settings
            allowLateSubmission: assignment.allowLateSubmission || false,
            latePenalty: assignment.latePenalty || 10,
            maxSubmissions: assignment.maxSubmissions || 1,
            groupAssignment: assignment.groupAssignment || false,
            maxGroupSize: assignment.maxGroupSize || 4,
            allowedFileTypes: assignment.allowedFileTypes || [],
            maxFileSize: assignment.maxFileSize || 10 * 1024 * 1024,
            resources: assignment.resources || []
          }));
          setAssignments(transformedAssignments);
        }
      }

      // Fetch enrolled students from the course enrollment
      await fetchEnrolledStudents();

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

  const fetchEnrolledStudents = async () => {
    try {
      const response = await fetch(`/api/courses/enrollment?courseId=${courseId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const enrolledStudents = data.data?.students || [];
          console.log('Enrolled students from API:', enrolledStudents);
          
          // Fetch full user details for each enrolled student
          const transformedStudents: Student[] = await Promise.all(
            enrolledStudents.map(async (student: any) => {
              let userName = student.email;
              let userAvatar = student.avatar || '/api/placeholder/40/40';
              let sectionName = student.sectionName || 'No Section';
              
              // Fetch full user details
              try {
                const userResponse = await fetch(`/api/users/${student.userId}`, {
                  credentials: 'include',
                });
                
                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  if (userData.success && userData.user) {
                    userName = `${userData.user.firstName || ''} ${userData.user.lastName || ''}`.trim() || userData.user.email;
                    userAvatar = userData.user.avatar || userAvatar;
                  }
                }
              } catch (userError) {
                console.warn('Could not fetch user details for:', student.userId);
              }
              
              return {
                studentId: student.userId,
                name: userName,
                email: student.email,
                avatar: userAvatar,
                enrollmentDate: student.enrolledAt,
                status: student.status || 'active',
                currentGrade: 0, // TODO: Calculate from submissions
                assignmentsSubmitted: 0, // Will be calculated from videoSubmissions
                assignmentsTotal: assignments.length,
                lastActivity: student.enrolledAt, // TODO: Get actual last activity
                sectionName: sectionName,
              };
            })
          );
          
          setStudents(transformedStudents);
          console.log('Set students with details:', transformedStudents);
        }
      }
    } catch (err) {
      console.error('Error fetching enrolled students:', err);
      // Don't set error as it's not critical
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

  const fetchPeerResponses = async () => {
    try {
      // Fetch all peer responses for all assignments in this course
      const assignmentIds = assignments.map(a => a.assignmentId);
      const allResponses: PeerResponse[] = [];
      
      for (const assignmentId of assignmentIds) {
        const response = await fetch(`/api/peer-responses?assignmentId=${assignmentId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            allResponses.push(...data.data);
          }
        }
      }
      
      setPeerResponses(allResponses);
    } catch (error) {
      console.error('Error fetching peer responses:', error);
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

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    try {
      setRemovingStudent(studentId);
      
      const response = await fetch(`/api/instructor/courses/${courseId}/students/${studentId}/remove`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Student removal report:', data.report);
        
        // Remove student from local state
        setStudents(prev => prev.filter(student => student.studentId !== studentId));
        
        // Update course enrollment count
        if (course) {
          setCourse(prev => prev ? {
            ...prev,
            enrollmentCount: Math.max(0, prev.enrollmentCount - 1)
          } : null);
        }
        
        alert(`✅ ${studentName} has been removed from the course.\n\nRemoved:\n• ${data.report.submissionsDeleted} video submissions\n• ${data.report.peerResponsesDeleted} peer responses\n• ${data.report.communityPostsDeleted} community posts\n• ${data.report.communityCommentsDeleted} community comments\n• ${data.report.s3ObjectsDeleted} files from storage`);
        
        setShowRemoveConfirm(null);
      } else {
        const errorData = await response.json();
        console.error('❌ Student removal failed:', errorData);
        alert(`❌ Failed to remove student: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error removing student:', error);
      alert('❌ Failed to remove student. Please try again.');
    } finally {
      setRemovingStudent(null);
    }
  };



  const handleGradeSubmission = async (submissionId: string) => {
    try {
      const gradeData = grades[submissionId];
      if (!gradeData || !gradeData.grade) {
        alert('Please enter a grade before submitting.');
        return;
      }

      console.log('🎯 Submitting grade for submission:', { submissionId, grade: gradeData.grade, feedback: gradeData.feedback });

      const response = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: Number(gradeData.grade),
          feedback: gradeData.feedback || '',
          status: 'graded'
        }),
        credentials: 'include',
      });

      const data = await response.json();
      console.log('📊 Grade submission response:', data);
      
      if (data.success) {
        // Update local state
        setVideoSubmissions(prev => prev.map(sub =>
          sub.submissionId === submissionId
            ? { ...sub, grade: Number(gradeData.grade), instructorFeedback: gradeData.feedback, status: 'graded' as const }
            : sub
        ));
        setGradingSubmission(null);
        alert('Grade submitted successfully!');
      } else {
        alert(`Failed to submit grade: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting grade:', error);
      alert('Failed to submit grade. Please try again.');
    }
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    setGlobalPlaybackSpeed(speed);
    // Apply to all video elements on the page
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.playbackRate = speed;
    });
  };

  const getPeerResponsesForStudent = (studentId: string): PeerResponse[] => {
    return peerResponses.filter(response => response.reviewerId === studentId);
  };

  const togglePeerResponses = (submissionId: string) => {
    setExpandedPeerResponses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  const getVideoOwnerName = (videoId: string): string => {
    const submission = videoSubmissions.find(s => s.submissionId === videoId);
    return submission?.student.name || 'Unknown Student';
  };

  const toggleVideoCollapse = (submissionId: string) => {
    setCollapsedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
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
                    
                    <RichTextRenderer 
                      content={assignment.description}
                      className="text-gray-600 mb-4 text-sm"
                      maxLines={2}
                    />
                    
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
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setViewingAssignment(assignment)}
                          className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm"
                        >
                          👁️ View Details
                        </button>
                        <button
                          onClick={() => setEditingAssignment(assignment)}
                          className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors text-sm"
                        >
                          ✏️ Edit
                        </button>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            console.log('🎯 Navigating to NEW assignment grading page:', assignment.assignmentId);
                            router.push(`/instructor/grading/assignment/${assignment.assignmentId}`);
                          }}
                          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm"
                        >
                          📊 Grade Submissions ({assignment.submissionsCount || 0})
                        </button>
                        <button
                          onClick={() => {
                            router.push(`/instructor/courses/${courseId}/assignments/${assignment.assignmentId}/grades`);
                          }}
                          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors text-sm"
                        >
                          📋 View Grades
                        </button>
                      </div>
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
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-gray-600">
                      {videoSubmissions.length} submission{videoSubmissions.length !== 1 ? 's' : ''}
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCollapsedVideos(new Set(videoSubmissions.map(s => s.submissionId)))}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        ▲ Collapse All
                      </button>
                      <button
                        onClick={() => setCollapsedVideos(new Set())}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        ▼ Expand All
                      </button>
                    </div>
                    
                    {/* Global Playback Speed Control */}
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">Speed:</label>
                      <select
                        value={globalPlaybackSpeed}
                        onChange={(e) => handlePlaybackSpeedChange(Number(e.target.value))}
                        className="px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1.0}>1x</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={1.75}>1.75x</option>
                        <option value={2.0}>2x</option>
                      </select>
                    </div>
                    
                    <button
                      onClick={() => router.push(`/instructor/grading/bulk?course=${courseId}`)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm"
                    >
                      Bulk Grading
                    </button>
                  </div>
                </div>
                
                {videoSubmissions.length > 0 ? (
                  <div className="space-y-4">
                    {videoSubmissions.map((submission) => (
                      <div
                        key={submission.submissionId}
                        id={`submission-${submission.submissionId}`}
                        className="bg-gray-50 rounded-xl p-6 border border-gray-200 scroll-mt-24"
                      >
                        <div className="flex items-start space-x-4">
                          {/* Student Avatar */}
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {submission.student.name.charAt(0).toUpperCase()}
                          </div>
                          
                          <div className="flex-1">
                            {/* Header with Student Name and Status */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <h3 className="text-lg font-semibold text-gray-800">
                                    {submission.student.name}
                                  </h3>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    submission.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                                    submission.status === 'graded' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {submission.status === 'graded' ? `✓ ${submission.grade || 'Graded'}` : 'Pending'}
                                  </span>
                                  {getPeerResponsesForStudent(submission.studentId).length > 0 && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      💬 {getPeerResponsesForStudent(submission.studentId).length}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                  <span>📝 {submission.assignment.title}</span>
                                  <span>📅 {new Date(submission.submittedAt).toLocaleDateString()}</span>
                                  <span>⏱️ {submission.duration || 'N/A'}</span>
                                  <span>📦 {(submission.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                                </div>
                              </div>
                              <button
                                onClick={() => toggleVideoCollapse(submission.submissionId)}
                                className="ml-3 px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                              >
                                {collapsedVideos.has(submission.submissionId) ? '▶ Show Video' : '▼ Hide Video'}
                              </button>
                            </div>
                            
                            {/* Collapsible Video Preview */}
                            {!collapsedVideos.has(submission.submissionId) && (
                              <div className="bg-black rounded-lg overflow-hidden mb-4 aspect-video">
                                <video
                                  src={submission.videoUrl}
                                  controls
                                  className="w-full h-full object-contain"
                                  preload="metadata"
                                  onLoadedMetadata={(e) => {
                                    // Apply global playback speed when video loads
                                    const video = e.currentTarget;
                                    video.playbackRate = globalPlaybackSpeed;
                                  }}
                                  onError={(e) => {
                                    console.error('Video load error for submission:', submission.submissionId);
                                    console.error('Video URL:', submission.videoUrl);
                                  }}
                                >
                                  Your browser does not support the video tag.
                                </video>
                              </div>
                            )}
                            
                            {/* Peer Responses Section - Minimalistic */}
                            {getPeerResponsesForStudent(submission.studentId).length > 0 && (
                              <div className="mb-4">
                                <button
                                  onClick={() => togglePeerResponses(submission.submissionId)}
                                  className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors text-sm"
                                >
                                  <span className="flex items-center space-x-2">
                                    <span>💬</span>
                                    <span className="font-medium text-blue-700">
                                      {getPeerResponsesForStudent(submission.studentId).length} Peer Response{getPeerResponsesForStudent(submission.studentId).length !== 1 ? 's' : ''}
                                    </span>
                                  </span>
                                  <svg
                                    className={`w-5 h-5 text-blue-600 transition-transform ${expandedPeerResponses.has(submission.submissionId) ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                                
                                {expandedPeerResponses.has(submission.submissionId) && (
                                  <div className="mt-2 space-y-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    {getPeerResponsesForStudent(submission.studentId).map((response) => (
                                      <div key={response.id} className="bg-white rounded-md p-3 border border-gray-200 text-sm">
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                              <span className="text-xs font-medium text-gray-700">
                                                → {getVideoOwnerName(response.videoId)}'s video
                                              </span>
                                              {response.assignmentTitle && (
                                                <span className="text-xs text-gray-500">
                                                  ({response.assignmentTitle})
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                              {new Date(response.submittedAt).toLocaleDateString()}
                                            </p>
                                          </div>
                                          <span className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${
                                            response.isSubmitted 
                                              ? 'bg-green-100 text-green-700' 
                                              : 'bg-yellow-100 text-yellow-700'
                                          }`}>
                                            {response.isSubmitted ? '✓' : '○'}
                                          </span>
                                        </div>
                                        <p className="text-gray-700 text-xs leading-relaxed line-clamp-3 mb-2">
                                          {response.content}
                                        </p>
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                          <span className="text-xs text-gray-500">
                                            {response.wordCount} words
                                          </span>
                                          <button
                                            onClick={() => {
                                              // Navigate to the video this response is about
                                              const targetSubmission = videoSubmissions.find(s => s.submissionId === response.videoId);
                                              if (targetSubmission) {
                                                document.getElementById(`submission-${response.videoId}`)?.scrollIntoView({ behavior: 'smooth' });
                                              }
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                          >
                                            View Video →
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Inline Grading Form */}
                            {submission.status === 'graded' ? (
                              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-green-700">✅ Grade:</span>
                                  <span className="text-2xl font-bold text-green-600">
                                    {submission.grade || 'N/A'}
                                  </span>
                                </div>
                                {submission.instructorFeedback && (
                                  <div>
                                    <span className="font-medium text-green-700">Feedback:</span>
                                    <p className="text-green-600 mt-1">{submission.instructorFeedback}</p>
                                  </div>
                                )}
                                <button
                                  onClick={() => {
                                    setGradingSubmission(submission.submissionId);
                                    setGrades(prev => ({
                                      ...prev,
                                      [submission.submissionId]: {
                                        grade: submission.grade || '',
                                        feedback: submission.instructorFeedback || ''
                                      }
                                    }));
                                  }}
                                  className="mt-3 w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                                >
                                  Edit Grade
                                </button>
                              </div>
                            ) : gradingSubmission === submission.submissionId ? (
                              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <h4 className="font-semibold text-gray-800 mb-3">Grade This Submission</h4>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Grade (0-100)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={grades[submission.submissionId]?.grade || ''}
                                      onChange={(e) => setGrades(prev => ({
                                        ...prev,
                                        [submission.submissionId]: {
                                          ...prev[submission.submissionId],
                                          grade: e.target.value === '' ? '' : Number(e.target.value),
                                          feedback: prev[submission.submissionId]?.feedback || ''
                                        }
                                      }))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Enter grade..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Feedback (Optional)
                                    </label>
                                    <textarea
                                      value={grades[submission.submissionId]?.feedback || ''}
                                      onChange={(e) => setGrades(prev => ({
                                        ...prev,
                                        [submission.submissionId]: {
                                          grade: prev[submission.submissionId]?.grade || '',
                                          feedback: e.target.value
                                        }
                                      }))}
                                      rows={3}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Enter feedback for the student..."
                                    />
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleGradeSubmission(submission.submissionId)}
                                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                                    >
                                      Submit Grade
                                    </button>
                                    <button
                                      onClick={() => setGradingSubmission(null)}
                                      className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setGradingSubmission(submission.submissionId);
                                  setGrades(prev => ({
                                    ...prev,
                                    [submission.submissionId]: {
                                      grade: submission.grade || '',
                                      feedback: submission.instructorFeedback || ''
                                    }
                                  }));
                                }}
                                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                              >
                                📝 Grade This Submission
                              </button>
                            )}
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
                    {studentsWithSubmissionCounts.length} student{studentsWithSubmissionCounts.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                {studentsWithSubmissionCounts.length > 0 ? (
                  <div className="space-y-6">
                    {/* Group students by section */}
                    {Array.from(new Set(studentsWithSubmissionCounts.map(s => s.sectionName || 'No Section'))).map(sectionName => {
                      const sectionStudents = studentsWithSubmissionCounts.filter(s => (s.sectionName || 'No Section') === sectionName);
                      
                      return (
                        <div key={sectionName}>
                          <h3 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
                            {sectionName} ({sectionStudents.length} student{sectionStudents.length !== 1 ? 's' : ''})
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {sectionStudents.map((student) => (
                              <div
                                key={student.studentId}
                                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-white hover:shadow-sm transition-all"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                                    <Avatar
                                      src={student.avatar}
                                      name={student.name}
                                      size="sm"
                                      className="w-8 h-8 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-gray-800 text-sm truncate">{student.name}</h4>
                                      <p className="text-xs text-gray-500 truncate">{student.email}</p>
                                    </div>
                                  </div>
                                  
                                  {/* Remove Student Button */}
                                  <button
                                    onClick={() => setShowRemoveConfirm({studentId: student.studentId, studentName: student.name})}
                                    disabled={removingStudent === student.studentId}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                    title="Remove student from course"
                                  >
                                    {removingStudent === student.studentId ? (
                                      <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                                
                                {/* Student Stats - Compact */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      student.status === 'active' ? 'bg-green-100 text-green-700' :
                                      student.status === 'dropped' ? 'bg-red-100 text-red-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {student.status}
                                    </span>
                                    
                                    {/* Video Submissions Count with Link */}
                                    <button
                                      onClick={() => {
                                        console.log('🔗 STUDENTS TAB: Grade Videos clicked for student:', {
                                          studentId: student.studentId,
                                          studentName: student.name,
                                          courseId: courseId,
                                          submissionCount: student.assignmentsSubmitted
                                        });
                                        
                                        if (student.assignmentsSubmitted === 0) {
                                          alert(`${student.name} has not submitted any videos yet.`);
                                          return;
                                        }
                                        
                                        router.push(`/instructor/grading/bulk?course=${courseId}&student=${student.studentId}&studentName=${encodeURIComponent(student.name)}`);
                                      }}
                                      className={`inline-flex items-center px-2 py-1 text-xs rounded transition-colors ${
                                        student.assignmentsSubmitted > 0
                                          ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 cursor-pointer'
                                          : 'bg-gray-50 text-gray-400 cursor-default'
                                      }`}
                                      title={
                                        student.assignmentsSubmitted > 0
                                          ? `Grade ${student.name}'s ${student.assignmentsSubmitted} video submission${student.assignmentsSubmitted !== 1 ? 's' : ''}`
                                          : `${student.name} has no video submissions yet`
                                      }
                                    >
                                      <span className="mr-1">🎥</span>
                                      <span className="font-semibold">{student.assignmentsSubmitted}</span>
                                    </button>
                                  </div>
                                  
                                  <div className="text-xs text-gray-500">
                                    Enrolled {new Date(student.enrollmentDate).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
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

          {/* Section List - shows sections if they exist */}
          <SectionList
            courseId={courseId}
            sections={sections}
          />
        </div>

        {/* Course Settings Modal */}
        <CourseSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          course={course}
          onUpdate={handleCourseUpdate}
          instructorId={user?.id}
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
                    allowLateSubmission: editingAssignment.allowLateSubmission ?? true,
                    latePenalty: editingAssignment.latePenalty ?? 10,
                    maxSubmissions: editingAssignment.maxSubmissions ?? 1,
                    groupAssignment: editingAssignment.groupAssignment ?? false,
                    maxGroupSize: editingAssignment.maxGroupSize ?? 4,
                    allowedFileTypes: editingAssignment.allowedFileTypes ?? (editingAssignment.submissionType === 'file' ? ['.pdf', '.doc', '.docx'] : []),
                    maxFileSize: editingAssignment.maxFileSize ?? 10 * 1024 * 1024,
                    enablePeerResponses: editingAssignment.enablePeerResponses ?? false,
                    minResponsesRequired: editingAssignment.minResponsesRequired ?? 0,
                    maxResponsesPerVideo: editingAssignment.maxResponsesPerVideo ?? 0,
                    responseDueDate: editingAssignment.responseDueDate ?? editingAssignment.dueDate,
                    responseWordLimit: editingAssignment.responseWordLimit,
                    responseCharacterLimit: editingAssignment.responseCharacterLimit,
                    hidePeerVideosUntilInstructorPosts: editingAssignment.hidePeerVideosUntilInstructorPosts ?? false,
                    peerReviewScope: editingAssignment.peerReviewScope ?? 'course',
                    requireLiveRecording: editingAssignment.requireLiveRecording ?? false,
                    allowYouTubeUrl: editingAssignment.allowYouTubeUrl ?? false,
                    resources: editingAssignment.resources ?? [],
                    status: editingAssignment.status === 'grading' ? AssignmentStatus.PUBLISHED : editingAssignment.status === 'completed' ? AssignmentStatus.CLOSED : editingAssignment.status === 'draft' ? AssignmentStatus.DRAFT : editingAssignment.status === 'published' ? AssignmentStatus.PUBLISHED : AssignmentStatus.DRAFT
                  }}
                  onSubmit={async (assignmentData) => {
                    try {
                      console.log('Updating assignment:', editingAssignment.assignmentId, assignmentData);
                      
                      // Call the assignment update API
                      const response = await fetch(`/api/assignments/${editingAssignment.assignmentId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          ...assignmentData,
                          assignmentId: editingAssignment.assignmentId
                        })
                      });
                      
                      if (!response.ok) {
                        throw new Error('Failed to update assignment');
                      }
                      
                      const result = await response.json();
                      console.log('Assignment updated successfully:', result);
                      
                      setEditingAssignment(null);
                      // Refresh assignments to show changes
                      await fetchCourseDetails();
                      alert('Assignment updated successfully!');
                    } catch (error) {
                      console.error('Error updating assignment:', error);
                      alert('Failed to update assignment. Please try again.');
                    }
                  }}
                  onCancel={() => setEditingAssignment(null)}
                  courseId={courseId}
                  isEditing={true}
                  assignmentId={editingAssignment.assignmentId}
                />
              </div>
            </div>
          </div>
        )}

        {/* Remove Student Confirmation Modal */}
        {showRemoveConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Remove Student</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to remove <strong>{showRemoveConfirm.studentName}</strong> from this course?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">⚠️ This will permanently delete:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• All video submissions and files</li>
                    <li>• All peer responses they wrote</li>
                    <li>• All community posts and comments</li>
                    <li>• All associated data and files</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowRemoveConfirm(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={removingStudent === showRemoveConfirm.studentId}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveStudent(showRemoveConfirm.studentId, showRemoveConfirm.studentName)}
                  disabled={removingStudent === showRemoveConfirm.studentId}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
                >
                  {removingStudent === showRemoveConfirm.studentId ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Removing...</span>
                    </div>
                  ) : (
                    'Remove Student'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Details Modal */}
        {viewingAssignment && (
          <AssignmentDetailsModal
            assignment={viewingAssignment}
            isOpen={!!viewingAssignment}
            onClose={() => setViewingAssignment(null)}
            onEdit={() => {
              setEditingAssignment(viewingAssignment);
              setViewingAssignment(null);
            }}
          />
        )}

        {/* Course Settings Modal */}
        <CourseSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          course={course}
          onUpdate={handleCourseUpdate}
          instructorId={user?.id}
        />
      </div>
    </InstructorRoute>
  );
};

export default InstructorCourseDetailPage;
