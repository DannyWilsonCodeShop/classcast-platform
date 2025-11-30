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
  const [viewMode, setViewMode] = useState<'table' | 'sections'>('table');
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null);
  
  // Move student state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [studentToMove, setStudentToMove] = useState<Student | null>(null);
  const [availableSections, setAvailableSections] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [moveDestination, setMoveDestination] = useState<{type: 'section' | 'course', id: string, name: string} | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // Export grades state
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

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

  const handleMoveStudent = async (student: Student) => {
    setStudentToMove(student);
    setShowMoveModal(true);
    
    // Fetch available sections for this course
    try {
      const sectionsResponse = await fetch(`/api/sections?courseId=${courseId}`, {
        credentials: 'include'
      });
      if (sectionsResponse.ok) {
        const sectionsData = await sectionsResponse.json();
        setAvailableSections(sectionsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
    
    // Fetch available courses for this instructor
    try {
      const coursesResponse = await fetch(`/api/instructor/courses?instructorId=${user?.id}`, {
        credentials: 'include'
      });
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        // Filter out current course
        const otherCourses = (coursesData.courses || []).filter((c: any) => c.courseId !== courseId);
        setAvailableCourses(otherCourses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const confirmMoveStudent = async () => {
    if (!studentToMove || !moveDestination) return;
    
    setIsMoving(true);
    try {
      const endpoint = moveDestination.type === 'section' 
        ? `/api/instructor/students/move-section`
        : `/api/instructor/students/move-course`;
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentId: studentToMove.studentId,
          fromCourseId: courseId,
          toCourseId: moveDestination.type === 'course' ? moveDestination.id : courseId,
          toSectionId: moveDestination.type === 'section' ? moveDestination.id : null,
          studentName: studentToMove.name,
          studentEmail: studentToMove.email
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        if (moveDestination.type === 'course') {
          // Remove student from current course list
          setStudents(prev => prev.filter(s => s.studentId !== studentToMove.studentId));
          alert(`✅ ${studentToMove.name} has been moved to ${moveDestination.name} successfully!`);
        } else {
          // Update student's section in current list
          setStudents(prev => prev.map(s => 
            s.studentId === studentToMove.studentId 
              ? { ...s, sectionId: moveDestination.id, sectionName: moveDestination.name }
              : s
          ));
          alert(`✅ ${studentToMove.name} has been moved to section ${moveDestination.name} successfully!`);
        }
        
        setShowMoveModal(false);
        setStudentToMove(null);
        setMoveDestination(null);
      } else {
        alert(`❌ Failed to move student: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error moving student:', error);
      alert('❌ Failed to move student. Please try again.');
    } finally {
      setIsMoving(false);
    }
  };

  const handleExportGrades = async (format: 'json' | 'csv' = 'csv') => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/export-grades?format=${format}`, {
        credentials: 'include'
      });

      if (response.ok) {
        if (format === 'csv') {
          // Download CSV file
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${course?.courseName || 'course'}_grades_${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          alert('✅ Grade report exported successfully!');
        } else {
          // Handle JSON response
          const data = await response.json();
          console.log('Grade report data:', data);
          // You could show this in a modal or process it further
        }
        
        setShowExportModal(false);
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to export grades: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error exporting grades:', error);
      alert('❌ Failed to export grades. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickExport = () => {
    handleExportGrades('csv');
  };

  const handleDropStudent = async (studentId: string, targetSectionId: string | null) => {
    const student = students.find(s => s.studentId === studentId);
    if (!student || student.sectionId === targetSectionId) return;

    try {
      const response = await fetch('/api/instructor/students/move-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentId: studentId,
          fromCourseId: courseId,
          toCourseId: courseId,
          toSectionId: targetSectionId,
          studentName: student.name,
          studentEmail: student.email
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update student's section in local state
        setStudents(prev => prev.map(s => 
          s.studentId === studentId 
            ? { 
                ...s, 
                sectionId: targetSectionId, 
                sectionName: targetSectionId ? 
                  availableSections.find(sec => sec.sectionId === targetSectionId)?.sectionName || 'Unknown Section' :
                  null
              }
            : s
        ));
        
        const targetSectionName = targetSectionId ? 
          availableSections.find(sec => sec.sectionId === targetSectionId)?.sectionName || 'Unknown Section' :
          'No Section';
        
        // Show success message briefly
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        successMsg.textContent = `✅ ${student.name} moved to ${targetSectionName}`;
        document.body.appendChild(successMsg);
        setTimeout(() => document.body.removeChild(successMsg), 3000);
      } else {
        throw new Error(data.error || 'Failed to move student');
      }
    } catch (error) {
      console.error('Error moving student:', error);
      // Show error message
      const errorMsg = document.createElement('div');
      errorMsg.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorMsg.textContent = `❌ Failed to move ${student.name}`;
      document.body.appendChild(errorMsg);
      setTimeout(() => document.body.removeChild(errorMsg), 3000);
    }
  };

  // Section Column Component
  const SectionColumn: React.FC<{
    title: string;
    sectionId: string | null;
    students: Student[];
    onDrop: (studentId: string, sectionId: string | null) => void;
    draggedStudent: Student | null;
  }> = ({ title, sectionId, students, onDrop, draggedStudent }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (draggedStudent && draggedStudent.sectionId !== sectionId) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = () => {
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (draggedStudent && draggedStudent.sectionId !== sectionId) {
        onDrop(draggedStudent.studentId, sectionId);
      }
    };

    return (
      <div 
        className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 ${
          isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              📚 {title}
            </h3>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
              {students.length} student{students.length !== 1 ? 's' : ''}
            </span>
          </div>
          {isDragOver && (
            <div className="mt-2 text-sm text-blue-600 font-medium">
              Drop here to move student to {title}
            </div>
          )}
        </div>
        
        <div className="p-6">
          {students.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <StudentCard
                  key={student.studentId}
                  student={student}
                  onDragStart={() => setDraggedStudent(student)}
                  onDragEnd={() => setDraggedStudent(null)}
                  onViewSubmissions={() => handleViewStudentSubmissions(student.studentId, student.name)}
                  onMoveStudent={() => handleMoveStudent(student)}
                  onRemoveStudent={() => handleRemoveStudent(student.studentId, student.name)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">👤</div>
              <p className="text-sm">No students in this section</p>
              {isDragOver && (
                <p className="text-xs text-blue-600 mt-1">Drop a student here</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Student Card Component
  const StudentCard: React.FC<{
    student: Student;
    onDragStart: () => void;
    onDragEnd: () => void;
    onViewSubmissions: () => void;
    onMoveStudent: () => void;
    onRemoveStudent: () => void;
  }> = ({ student, onDragStart, onDragEnd, onViewSubmissions, onMoveStudent, onRemoveStudent }) => {
    const [showQuickMove, setShowQuickMove] = useState(false);
    
    const handleQuickMove = async (targetSectionId: string | null) => {
      setShowQuickMove(false);
      await handleDropStudent(student.studentId, targetSectionId);
    };
    
    return (
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200 cursor-move hover:bg-gray-100 relative"
      >
        <div className="flex items-center space-x-3 mb-3">
          <Avatar
            src={student.avatar}
            name={student.name}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">{student.name}</h4>
            <p className="text-sm text-gray-500 truncate">{student.email}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
            {student.status}
          </span>
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Grade:</span>
            <span className={`font-medium ${student.currentGrade ? getGradeColor(student.currentGrade) : 'text-gray-400'}`}>
              {student.currentGrade ? `${Math.round(student.currentGrade)}%` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Submissions:</span>
            <span className="font-medium text-gray-900">{student.submissionsCount}</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={onViewSubmissions}
            className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
          >
            View Work
          </button>
          <div className="relative">
            <button
              onClick={() => setShowQuickMove(!showQuickMove)}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
              title="Quick move to section"
            >
              ↔️
            </button>
            {showQuickMove && (
              <div className="absolute bottom-full right-0 mb-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-50 min-w-[200px]">
                <div className="p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                  <p className="text-xs font-semibold text-gray-700">Move to Section:</p>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {availableSections
                    .filter(sec => sec.sectionId !== student.sectionId)
                    .map(section => (
                      <button
                        key={section.sectionId}
                        onClick={() => handleQuickMove(section.sectionId)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{section.sectionName}</div>
                        <div className="text-xs text-gray-500">{section.studentCount || 0} students</div>
                      </button>
                    ))}
                  {!student.sectionId && availableSections.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">No other sections available</div>
                  )}
                </div>
                <button
                  onClick={() => setShowQuickMove(false)}
                  className="w-full px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 border-t border-gray-200 rounded-b-lg"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onRemoveStudent}
            className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
            title="Remove student"
          >
            🗑️
          </button>
        </div>
        
        {/* Click outside to close dropdown */}
        {showQuickMove && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowQuickMove(false)}
          />
        )}
      </div>
    );
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
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleQuickExport}
                    disabled={isExporting || students.length === 0}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={students.length === 0 ? 'No students to export' : 'Quick export grade report as CSV'}
                  >
                    {isExporting ? '⏳ Exporting...' : '📊 Export Grades'}
                  </button>
                  <button
                    onClick={() => setShowExportModal(true)}
                    disabled={isExporting || students.length === 0}
                    className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="More export options"
                  >
                    ⚙️
                  </button>
                </div>
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

          {/* View Toggle */}
          <div className="mb-6 flex justify-center">
            <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📋 Table View
              </button>
              <button
                onClick={() => setViewMode('sections')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'sections' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📚 Sections View
              </button>
            </div>
          </div>

          {/* Students List */}
          {viewMode === 'table' ? (
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
                            className="inline-flex items-center px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-lg transition-colors font-semibold border border-blue-200 hover:border-blue-300"
                            title={`Click to grade ${student.name}'s ${student.submissionsCount} video submissions`}
                          >
                            <span className="text-lg mr-2">🎥</span>
                            <span className="text-lg font-bold">{student.submissionsCount}</span>
                            <span className="ml-1 text-sm">videos</span>
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
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
                              onClick={() => handleMoveStudent(student)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title={`Move ${student.name} to another section or course`}
                            >
                              Move
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
          ) : (
            /* Sections View with Drag and Drop */
            <div className="space-y-6">
              {(() => {
                // Group students by section
                const studentsBySection = new Map<string, Student[]>();
                const noSectionStudents: Student[] = [];
                
                filteredAndSortedStudents.forEach(student => {
                  if (student.sectionId && student.sectionName) {
                    const key = `${student.sectionId}-${student.sectionName}`;
                    if (!studentsBySection.has(key)) {
                      studentsBySection.set(key, []);
                    }
                    studentsBySection.get(key)!.push(student);
                  } else {
                    noSectionStudents.push(student);
                  }
                });

                const sectionEntries = Array.from(studentsBySection.entries());
                
                return (
                  <>
                    {/* Students without sections */}
                    {noSectionStudents.length > 0 && (
                      <SectionColumn
                        title="No Section"
                        sectionId={null}
                        students={noSectionStudents}
                        onDrop={handleDropStudent}
                        draggedStudent={draggedStudent}
                      />
                    )}
                    
                    {/* Students grouped by sections */}
                    {sectionEntries.map(([key, sectionStudents]) => {
                      const sectionName = key.split('-').slice(1).join('-');
                      const sectionId = key.split('-')[0];
                      return (
                        <SectionColumn
                          key={key}
                          title={sectionName}
                          sectionId={sectionId}
                          students={sectionStudents}
                          onDrop={handleDropStudent}
                          draggedStudent={draggedStudent}
                        />
                      );
                    })}
                    
                    {filteredAndSortedStudents.length === 0 && (
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
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Move Student Modal */}
        {showMoveModal && studentToMove && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Move Student</h3>
                  <p className="text-sm text-gray-600">Move {studentToMove.name} to a different section or course</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Move to:
                  </label>
                  
                  {/* Move to Different Section */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">📚 Move to Different Section (Same Course)</h4>
                      {availableSections.length > 0 ? (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {availableSections
                            .filter(section => section.sectionId !== studentToMove.sectionId)
                            .map((section) => (
                            <label key={section.sectionId} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="moveDestination"
                                value={`section-${section.sectionId}`}
                                onChange={() => setMoveDestination({
                                  type: 'section',
                                  id: section.sectionId,
                                  name: section.sectionName
                                })}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-700">
                                {section.sectionName} 
                                {section.sectionCode && ` (${section.sectionCode})`}
                                <span className="text-xs text-gray-500 ml-1">
                                  ({section.currentEnrollment}/{section.maxEnrollment || '∞'} students)
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No other sections available in this course</p>
                      )}
                    </div>

                    {/* Move to Different Course */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">🏫 Move to Different Course</h4>
                      {availableCourses.length > 0 ? (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {availableCourses.map((course) => (
                            <label key={course.courseId} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="moveDestination"
                                value={`course-${course.courseId}`}
                                onChange={() => setMoveDestination({
                                  type: 'course',
                                  id: course.courseId,
                                  name: `${course.courseName} (${course.courseCode})`
                                })}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-700">
                                {course.courseName} ({course.courseCode})
                                <span className="text-xs text-gray-500 ml-1">
                                  {course.semester} {course.year}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No other courses available</p>
                      )}
                    </div>
                  </div>
                </div>

                {moveDestination && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Selected:</strong> Move to {moveDestination.name}
                      {moveDestination.type === 'course' && (
                        <span className="block text-xs text-blue-600 mt-1">
                          ⚠️ Moving to a different course will transfer all student data including submissions and grades.
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowMoveModal(false);
                    setStudentToMove(null);
                    setMoveDestination(null);
                  }}
                  disabled={isMoving}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmMoveStudent}
                  disabled={isMoving || !moveDestination}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMoving ? 'Moving...' : 'Move Student'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Grades Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Export Grade Report</h3>
                  <p className="text-sm text-gray-600">Download grades for {course?.courseName}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export Format:
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleExportGrades('csv')}
                      disabled={isExporting}
                      className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                          <span className="text-green-600 text-xs font-bold">CSV</span>
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900">CSV Spreadsheet</div>
                          <div className="text-xs text-gray-500">Compatible with Excel, Google Sheets</div>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Report includes:</strong>
                  </p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                    <li>• All students in alphabetical order</li>
                    <li>• Individual assignment grades</li>
                    <li>• Overall course percentage and letter grade</li>
                    <li>• Section information</li>
                  </ul>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowExportModal(false)}
                  disabled={isExporting}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </InstructorRoute>
  );
};

export default InstructorStudentsPage;
