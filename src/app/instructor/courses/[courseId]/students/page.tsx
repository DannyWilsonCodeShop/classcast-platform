'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Avatar from '@/components/common/Avatar';

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
  submissionsCount: number;
  averageGrade: number;
  sectionId?: string;
  sectionName?: string;
}

const InstructorStudentsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'dropped' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'grade' | 'enrollment' | 'activity' | 'section'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const courseId = params.courseId as string;

  useEffect(() => {
    if (courseId) {
      fetchCourseAndStudents();
    }
  }, [courseId]);

  const fetchCourseAndStudents = async () => {
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

      // Fetch enrolled students
      const enrollmentResponse = await fetch(`/api/courses/enrollment?courseId=${courseId}`, {
        credentials: 'include',
      });

      if (enrollmentResponse.ok) {
        const enrollmentData = await enrollmentResponse.json();
        if (enrollmentData.success && enrollmentData.data.students) {
          // Transform enrolled students to Student interface
          const transformedStudents: Student[] = await Promise.all(
            enrollmentData.data.students.map(async (enrolledStudent: any) => {
              // Fetch user details
              let userName = `${enrolledStudent.firstName || ''} ${enrolledStudent.lastName || ''}`.trim() || 'Unknown';
              let userEmail = enrolledStudent.email || 'N/A';
              let userAvatar = '/api/placeholder/40/40';

              try {
                const userResponse = await fetch(`/api/users/${enrolledStudent.userId}`, {
                  credentials: 'include',
                });
                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  if (userData.success && userData.user) {
                    userName = `${userData.user.firstName || ''} ${userData.user.lastName || ''}`.trim() || userName;
                    userEmail = userData.user.email || userEmail;
                    userAvatar = userData.user.avatar || userAvatar;
                  }
                }
              } catch (err) {
                console.warn('Could not fetch user details for:', enrolledStudent.userId);
              }

              // Fetch submission stats for this student in this course
              let submissionsCount = 0;
              let assignmentsTotal = 0;
              let averageGrade = 0;

              try {
                const submissionsResponse = await fetch(
                  `/api/video-submissions?studentId=${enrolledStudent.userId}&courseId=${courseId}`,
                  { credentials: 'include' }
                );
                if (submissionsResponse.ok) {
                  const submissionsData = await submissionsResponse.json();
                  if (submissionsData.success && submissionsData.submissions) {
                    submissionsCount = submissionsData.submissions.length;
                    const grades = submissionsData.submissions
                      .filter((s: any) => s.grade !== null && s.grade !== undefined)
                      .map((s: any) => s.grade);
                    if (grades.length > 0) {
                      averageGrade = grades.reduce((sum: number, g: number) => sum + g, 0) / grades.length;
                    }
                  }
                }
              } catch (err) {
                console.warn('Could not fetch submissions for:', enrolledStudent.userId);
              }

              return {
                studentId: enrolledStudent.userId,
                name: userName,
                email: userEmail,
                avatar: userAvatar,
                enrollmentDate: enrolledStudent.enrolledAt,
                status: (enrolledStudent.status as 'active' | 'dropped' | 'completed') || 'active',
                currentGrade: averageGrade > 0 ? averageGrade : undefined,
                assignmentsSubmitted: submissionsCount,
                assignmentsTotal: assignmentsTotal,
                lastActivity: enrolledStudent.enrolledAt, // Default to enrollment date
                submissionsCount: submissionsCount,
                averageGrade: averageGrade,
                sectionId: enrolledStudent.sectionId || null,
                sectionName: enrolledStudent.sectionName || null,
              };
            })
          );

          setStudents(transformedStudents);
        } else {
          setStudents([]);
        }
      } else {
        console.warn('Failed to fetch enrollment data');
        setStudents([]);
      }

    } catch (err) {
      console.error('Error fetching course and students:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch course and students');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedStudents = students
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'grade':
          comparison = (a.currentGrade || 0) - (b.currentGrade || 0);
          break;
        case 'enrollment':
          comparison = new Date(a.enrollmentDate).getTime() - new Date(b.enrollmentDate).getTime();
          break;
        case 'activity':
          comparison = new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime();
          break;
        case 'section':
          // Sort by section name, with students without sections at the end
          const aSectionName = a.sectionName || 'zzz_no_section';
          const bSectionName = b.sectionName || 'zzz_no_section';
          comparison = aSectionName.localeCompare(bSectionName);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'dropped':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-yellow-600';
    if (grade >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleViewStudentSubmissions = (studentId: string, studentName: string) => {
    // Navigate to bulk grading page filtered for this specific student
    router.push(`/instructor/grading/bulk?course=${courseId}&student=${studentId}&studentName=${encodeURIComponent(studentName)}`);
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${studentName} from this course?\n\n` +
      `This will:\n` +
      `• Remove them from the course enrollment\n` +
      `• Delete all their video submissions\n` +
      `• Delete all their peer responses\n` +
      `• Delete all their community posts and comments\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
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
        
        alert(
          `✅ ${studentName} has been removed from the course.\n\n` +
          `Removed:\n` +
          `• ${data.report.submissionsDeleted} video submissions\n` +
          `• ${data.report.peerResponsesDeleted} peer responses\n` +
          `• ${data.report.communityPostsDeleted} community posts\n` +
          `• ${data.report.communityCommentsDeleted} community comments\n` +
          `• ${data.report.s3ObjectsDeleted} files from storage`
        );
      } else {
        const errorData = await response.json();
        console.error('❌ Student removal failed:', errorData);
        alert(`❌ Failed to remove student: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error removing student:', error);
      alert('❌ Failed to remove student. Please try again.');
    }
  };

  if (loading) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading students...</p>
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
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
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
                  onClick={() => router.push(`/instructor/courses/${courseId}`)}
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
                      Students - {course.courseName}
                    </h1>
                    <p className="text-gray-600">
                      {course.courseCode} • {course.semester} {course.year} • {students.length} students
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                  📊 Export Grades
                </button>
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">
                  📧 Send Message
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">{students.length}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {students.filter(s => s.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Active Students</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {students.filter(s => s.status === 'dropped').length}
                </div>
                <div className="text-sm text-gray-600">Dropped</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-rose-500 mb-2">
                  {(() => {
                    const studentsWithGrades = students.filter(s => s.currentGrade !== undefined && s.currentGrade > 0);
                    if (studentsWithGrades.length === 0) return 'N/A';
                    const avg = studentsWithGrades.reduce((sum, s) => sum + (s.currentGrade || 0), 0) / studentsWithGrades.length;
                    return Math.round(avg) + '%';
                  })()}
                </div>
                <div className="text-sm text-gray-600">Average Grade</div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search students by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="dropped">Dropped</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                >
                  <option value="name">Sort by Name</option>
                  <option value="grade">Sort by Grade</option>
                  <option value="enrollment">Sort by Enrollment</option>
                  <option value="activity">Sort by Activity</option>
                  <option value="section">Sort by Section</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Students List */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {filteredAndSortedStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Section
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Grade
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submissions
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Activity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedStudents.map((student) => (
                      <tr key={student.studentId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <Avatar
                                src={student.avatar}
                                name={student.name}
                                size="lg"
                                className="h-10 w-10"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{student.name}</div>
                              <div className="text-sm text-gray-500">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.status)}`}>
                            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.sectionName ? (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {student.sectionName}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">No section</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">
                            {student.currentGrade ? (
                              <span className={getGradeColor(student.currentGrade)}>
                                {student.currentGrade.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-gray-400">No grade yet</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => handleViewStudentSubmissions(student.studentId, student.name)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors font-medium"
                            title={`View ${student.name}'s submissions`}
                          >
                            {student.assignmentsSubmitted}/{student.assignmentsTotal}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(student.lastActivity).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => router.push(`/instructor/students/${student.studentId}/profile`)}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            >
                              View Profile
                            </button>
                            <button className="text-emerald-600 hover:text-emerald-900 transition-colors">
                              Message
                            </button>
                            <button 
                              onClick={() => handleRemoveStudent(student.studentId, student.name)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title={`Remove ${student.name} from course`}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Students Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No students match your current filters.' 
                    : 'No students are enrolled in this course yet.'}
                </p>
                {searchTerm || statusFilter !== 'all' ? (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default InstructorStudentsPage;
