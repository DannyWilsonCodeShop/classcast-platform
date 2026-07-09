'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
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
      <div className="min-h-full overflow-y-auto pb-24 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-2 pb-1 shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push(`/instructor/courses/${courseId}`)} className="p-1 text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <img src="/ClassCastLogo.png" alt="" className="w-7 h-7 object-contain" />
            <div>
              <span className="text-sm font-bold text-[#005587]">{section.sectionName}</span>
              <p className="text-[10px] text-gray-500">{course.courseName}</p>
            </div>
          </div>
          <img src="/CristoReyLogo.png" alt="" className="w-10 h-10 object-contain" />
        </div>

        <div className="px-4 py-3 space-y-3">
          {/* Section Info */}
          <div className="bg-gray-50 rounded-2xl p-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {section.classCode && <div><span className="text-gray-500">Class Code:</span> <span className="font-mono font-bold text-[#005587]">{section.classCode}</span></div>}
              <div><span className="text-gray-500">Students:</span> <span className="font-medium">{section.currentEnrollment}/{section.maxEnrollment}</span></div>
              {section.schedule && <div><span className="text-gray-500">Schedule:</span> <span className="font-medium">{section.schedule.days.join(', ')} {section.schedule.time}</span></div>}
              {section.location && <div><span className="text-gray-500">Location:</span> <span className="font-medium">{section.location}</span></div>}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setActiveTab('students')} className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'students' ? 'bg-[#005587] text-white' : 'text-gray-600'}`}>
              👥 Students ({students.length})
            </button>
            <button onClick={() => setActiveTab('assignments')} className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'assignments' ? 'bg-[#005587] text-white' : 'text-gray-600'}`}>
              📝 Assignments ({assignments.length})
            </button>
          </div>

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-2">
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-3xl block mb-2">👥</span>
                  <p className="text-sm text-gray-500">No students in this section</p>
                </div>
              ) : (
                students.map((student) => (
                  <div key={student.userId} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <div className="w-9 h-9 rounded-full bg-[#005587] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {student.avatar && student.avatar.length <= 4 && !student.avatar?.startsWith('http') ? (
                        <span className="text-base">{student.avatar}</span>
                      ) : student.avatar?.startsWith('http') ? (
                        <img src={student.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span>{(student.firstName || '?')[0]}{(student.lastName || '')[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{student.firstName} {student.lastName}</p>
                      <p className="text-[10px] text-gray-400 truncate">{student.email}</p>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{student.status}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="space-y-2">
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-3xl block mb-2">📝</span>
                  <p className="text-sm text-gray-500">No assignments yet</p>
                </div>
              ) : (
                assignments.map((assignment) => (
                  <div key={assignment.assignmentId} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xs font-bold text-[#005587]">{assignment.title}</h3>
                      <span className="text-[10px] text-gray-500">{assignment.points} pts</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span>Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      <span className="text-green-600">{assignment.gradedCount}/{assignment.submissionsCount} graded</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </InstructorRoute>
  );
};

export default InstructorSectionDetailPage;