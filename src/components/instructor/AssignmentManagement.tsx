'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import RichTextRenderer from '../common/RichTextRenderer';

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
  sectionName?: string;
}

interface AssignmentManagementProps {
  courseId: string;
  courseName: string;
}

export const AssignmentManagement: React.FC<AssignmentManagementProps> = ({ courseId, courseName }) => {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'assignments' | 'students'>('assignments');
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null);

  // Fetch assignments and students
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assignments
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
            averageGrade: assignment.averageGrade,
            createdAt: assignment.createdAt,
          })).sort((a: Assignment, b: Assignment) => {
            // Sort by creation date, most recent first
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          setAssignments(transformedAssignments);
        }
      }

      // Fetch students
      const studentsResponse = await fetch(`/api/courses/enrollment?courseId=${courseId}`, {
        credentials: 'include',
      });

      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        if (studentsData.success) {
          const enrolledStudents = studentsData.data?.students || [];
          
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
        }
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [courseId, assignments.length]);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const handleDropStudent = async (studentId: string, targetSectionName: string | null) => {
    const student = students.find(s => s.studentId === studentId);
    if (!student || student.sectionName === targetSectionName) return;

    try {
      // In a real implementation, you would call an API to move the student
      // For now, we'll just update the local state
      setStudents(prev => prev.map(s => 
        s.studentId === studentId 
          ? { ...s, sectionName: targetSectionName || 'No Section' }
          : s
      ));
      
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successMsg.textContent = `✅ ${student.name} moved to ${targetSectionName || 'No Section'}`;
      document.body.appendChild(successMsg);
      setTimeout(() => document.body.removeChild(successMsg), 3000);
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

  const handleViewStudentSubmissions = (studentId: string, studentName: string) => {
    router.push(`/instructor/grading/bulk?course=${courseId}&student=${studentId}&studentName=${encodeURIComponent(studentName)}`);
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    const confirmed = window.confirm(`Are you sure you want to remove ${studentName} from this course?`);
    if (!confirmed) return;

    try {
      // In a real implementation, you would call an API to remove the student
      setStudents(prev => prev.filter(student => student.studentId !== studentId));
      
      alert(`✅ ${studentName} has been removed from the course.`);
    } catch (error) {
      console.error('Error removing student:', error);
      alert('❌ Failed to remove student. Please try again.');
    }
  };

  // Filter assignments and students based on search
  const filteredAssignments = assignments.filter(assignment =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.sectionName && student.sectionName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Error Loading Data"
        description={error}
        icon="error"
        action={{
          label: 'Try Again',
          onClick: fetchData,
          variant: 'primary',
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Course Info */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{courseName}</h1>
            <p className="text-gray-600 mt-1">
              {assignments.length} assignments • {students.length} students
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`/instructor/courses/${courseId}/assignments/create`)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              + Create Assignment
            </button>
            <button
              onClick={() => router.push(`/instructor/courses/${courseId}`)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              View Full Course
            </button>
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder={`Search ${activeView}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView('assignments')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'assignments'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📝 Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setActiveView('students')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'students'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              👥 Students ({students.length})
            </button>
          </div>
        </div>
      </div>

      {/* Assignments View */}
      {activeView === 'assignments' && (
        <div>
          {filteredAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment.assignmentId}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {assignment.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span>📅 Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        <span>⭐ {assignment.points} pts</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {assignment.submissionType === 'video' ? '🎥' : assignment.submissionType === 'file' ? '📎' : '📝'}
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
                        onClick={() => router.push(`/instructor/courses/${courseId}?tab=assignments&viewAssignment=${assignment.assignmentId}`)}
                        className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm"
                      >
                        👁️ View Details
                      </button>
                      <button
                        onClick={() => router.push(`/instructor/courses/${courseId}?tab=assignments&editAssignment=${assignment.assignmentId}`)}
                        className="flex-1 px-3 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors text-sm"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/instructor/grading/assignment/${assignment.assignmentId}`)}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm"
                      >
                        📊 Grade Submissions ({assignment.submissionsCount || 0})
                      </button>
                      <button
                        onClick={() => router.push(`/instructor/courses/${courseId}/assignments/${assignment.assignmentId}/grades`)}
                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors text-sm"
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
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {searchQuery ? 'No assignments found' : 'No assignments yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? `No assignments match "${searchQuery}"`
                  : 'Create your first assignment to get started.'
                }
              </p>
              {!searchQuery && (
                <button 
                  onClick={() => router.push(`/instructor/courses/${courseId}/assignments/create`)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                >
                  Create Your First Assignment
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Students View - Sections with Drag and Drop */}
      {activeView === 'students' && (
        <div>
          {filteredStudents.length > 0 ? (
            <div className="space-y-6">
              {(() => {
                // Group students by section
                const studentsBySection = new Map<string, Student[]>();
                const noSectionStudents: Student[] = [];
                
                filteredStudents.forEach(student => {
                  if (student.sectionName && student.sectionName !== 'No Section') {
                    const key = student.sectionName;
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
                        onDragStart={setDraggedStudent}
                        onDragEnd={() => setDraggedStudent(null)}
                        onViewSubmissions={handleViewStudentSubmissions}
                        onRemoveStudent={handleRemoveStudent}
                      />
                    )}
                    
                    {/* Students grouped by sections */}
                    {sectionEntries.map(([sectionName, sectionStudents]) => (
                      <SectionColumn
                        key={sectionName}
                        title={sectionName}
                        sectionId={sectionName}
                        students={sectionStudents}
                        onDrop={handleDropStudent}
                        draggedStudent={draggedStudent}
                        onDragStart={setDraggedStudent}
                        onDragEnd={() => setDraggedStudent(null)}
                        onViewSubmissions={handleViewStudentSubmissions}
                        onRemoveStudent={handleRemoveStudent}
                      />
                    ))}
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {searchQuery ? 'No students found' : 'No students enrolled'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? `No students match "${searchQuery}"`
                  : 'Students will appear here once they enroll in your course.'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Section Column Component for drag-and-drop
const SectionColumn: React.FC<{
  title: string;
  sectionId: string | null;
  students: Student[];
  onDrop: (studentId: string, sectionId: string | null) => void;
  draggedStudent: Student | null;
  onDragStart: (student: Student) => void;
  onDragEnd: () => void;
  onViewSubmissions: (studentId: string, studentName: string) => void;
  onRemoveStudent: (studentId: string, studentName: string) => void;
}> = ({ title, sectionId, students, onDrop, draggedStudent, onDragStart, onDragEnd, onViewSubmissions, onRemoveStudent }) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedStudent && draggedStudent.sectionName !== title) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (draggedStudent && draggedStudent.sectionName !== title) {
      onDrop(draggedStudent.studentId, title === 'No Section' ? null : title);
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
                onDragStart={() => onDragStart(student)}
                onDragEnd={onDragEnd}
                onViewSubmissions={() => onViewSubmissions(student.studentId, student.name)}
                onRemoveStudent={() => onRemoveStudent(student.studentId, student.name)}
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
  onRemoveStudent: () => void;
}> = ({ student, onDragStart, onDragEnd, onViewSubmissions, onRemoveStudent }) => {
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
  
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200 cursor-move hover:bg-gray-100"
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {student.name.charAt(0).toUpperCase()}
        </div>
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
          <span className="font-medium text-gray-900">{student.assignmentsSubmitted}</span>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={onViewSubmissions}
          className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
        >
          View Work
        </button>
        <button
          onClick={onRemoveStudent}
          className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
          title="Remove student"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};