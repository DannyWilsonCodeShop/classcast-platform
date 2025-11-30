'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface Assignment {
  assignmentId: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  courseId: string;
  courseName: string;
  courseCode: string;
}

interface StudentGrade {
  studentId: string;
  studentName: string;
  studentEmail: string;
  sectionId?: string;
  sectionName?: string;
  submissionId?: string;
  grade?: number;
  feedback?: string;
  submittedAt?: string;
  status: 'not_submitted' | 'submitted' | 'graded';
}

interface Section {
  sectionId: string;
  sectionName: string;
  studentCount: number;
}

type SortType = 'name' | 'section' | 'grade' | 'status';

const AssignmentGradesPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const courseId = params.courseId as string;
  const assignmentId = params.assignmentId as string;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [filteredGrades, setFilteredGrades] = useState<StudentGrade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filter and sort state
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortType>('section');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'graded' | 'not_submitted'>('all');

  useEffect(() => {
    if (courseId && assignmentId) {
      fetchData();
    }
  }, [courseId, assignmentId]);

  useEffect(() => {
    // Apply filters and sorting
    let filtered = [...studentGrades];
    
    // Apply section filter
    if (selectedSection !== 'all') {
      filtered = filtered.filter(grade => grade.sectionId === selectedSection);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(grade => grade.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(grade => 
        grade.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grade.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (grade.sectionName && grade.sectionName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.studentName.localeCompare(b.studentName);
        case 'section':
          const sectionA = a.sectionName || 'No Section';
          const sectionB = b.sectionName || 'No Section';
          if (sectionA !== sectionB) {
            return sectionA.localeCompare(sectionB);
          }
          return a.studentName.localeCompare(b.studentName);
        case 'grade':
          if (a.grade === undefined && b.grade === undefined) return 0;
          if (a.grade === undefined) return 1;
          if (b.grade === undefined) return -1;
          return b.grade - a.grade;
        case 'status':
          const statusOrder = { 'graded': 0, 'submitted': 1, 'not_submitted': 2 };
          const statusCompare = statusOrder[a.status] - statusOrder[b.status];
          if (statusCompare !== 0) return statusCompare;
          return a.studentName.localeCompare(b.studentName);
        default:
          return 0;
      }
    });
    
    setFilteredGrades(filtered);
  }, [studentGrades, selectedSection, sortBy, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch assignment details
      const assignmentResponse = await fetch(`/api/assignments/${assignmentId}`, {
        credentials: 'include',
      });
      
      if (!assignmentResponse.ok) {
        throw new Error('Failed to fetch assignment details');
      }
      
      const assignmentData = await assignmentResponse.json();
      console.log('Assignment API response:', assignmentData); // Debug log
      
      if (assignmentData.success && assignmentData.data?.assignment) {
        const assignment = assignmentData.data.assignment;
        setAssignment({
          assignmentId: assignment.assignmentId,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate,
          maxScore: assignment.points || assignment.maxScore || 100,
          courseId: assignment.courseId,
          courseName: assignment.courseName || assignment.course?.name || 'Course',
          courseCode: assignment.courseCode || assignment.course?.code || 'N/A'
        });
      }
      
      // Fetch enrolled students
      const studentsResponse = await fetch(`/api/courses/enrollment?courseId=${courseId}`, {
        credentials: 'include',
      });
      
      if (!studentsResponse.ok) {
        throw new Error('Failed to fetch students');
      }
      
      const studentsData = await studentsResponse.json();
      console.log('Students API response:', studentsData); // Debug log
      const enrolledStudents = studentsData.success ? studentsData.data?.students || [] : [];
      
      // Fetch submissions for this assignment
      const submissionsResponse = await fetch(`/api/instructor/video-submissions?assignmentId=${assignmentId}`, {
        credentials: 'include',
      });
      
      const submissionsData = submissionsResponse.ok ? await submissionsResponse.json() : { success: false };
      console.log('Submissions API response:', submissionsData); // Debug log
      const submissions = submissionsData.success ? submissionsData.submissions || [] : [];
      
      // Create a map of submissions by student ID
      const submissionMap = new Map();
      submissions.forEach((sub: any) => {
        submissionMap.set(sub.studentId, {
          submissionId: sub.submissionId,
          grade: sub.grade,
          feedback: sub.instructorFeedback || sub.feedback,
          submittedAt: sub.submittedAt,
          status: sub.grade !== null && sub.grade !== undefined ? 'graded' : 'submitted'
        });
      });
      
      console.log('Enrolled students:', enrolledStudents.length);
      console.log('Submissions:', submissions.length);
      
      // If no students are enrolled, show a message
      if (enrolledStudents.length === 0) {
        console.warn('No students enrolled in this course');
        setStudentGrades([]);
        return;
      }
      
      // Combine student data with submission data
      const gradesData: StudentGrade[] = await Promise.all(
        enrolledStudents.map(async (student: any) => {
          let userName = student.email;
          let userAvatar = student.avatar;
          
          // Fetch full user details
          try {
            const userResponse = await fetch(`/api/users/${student.userId}`, {
              credentials: 'include',
            });
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              if (userData.success && userData.user) {
                userName = `${userData.user.firstName || ''} ${userData.user.lastName || ''}`.trim() || userData.user.email;
              }
            }
          } catch (userError) {
            console.warn('Could not fetch user details for:', student.userId);
          }
          
          const submission = submissionMap.get(student.userId);
          
          return {
            studentId: student.userId,
            studentName: userName,
            studentEmail: student.email,
            sectionId: student.sectionId,
            sectionName: student.sectionName || 'No Section',
            submissionId: submission?.submissionId,
            grade: submission?.grade,
            feedback: submission?.feedback,
            submittedAt: submission?.submittedAt,
            status: submission ? submission.status : 'not_submitted'
          };
        })
      );
      
      console.log('Final grades data:', gradesData.length);
      setStudentGrades(gradesData);
      
      // Extract unique sections
      const uniqueSections = Array.from(new Set(
        gradesData
          .filter(grade => grade.sectionId && grade.sectionName)
          .map(grade => JSON.stringify({ sectionId: grade.sectionId, sectionName: grade.sectionName }))
      )).map(str => JSON.parse(str));
      
      const sectionsWithCounts = uniqueSections.map(section => ({
        sectionId: section.sectionId,
        sectionName: section.sectionName,
        studentCount: gradesData.filter(grade => grade.sectionId === section.sectionId).length
      }));
      
      setSections(sectionsWithCounts);
      
    } catch (err) {
      console.error('Error fetching grades data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load grades data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportGrades = async () => {
    try {
      setIsExporting(true);
      
      const response = await fetch(`/api/instructor/courses/${courseId}/assignments/${assignmentId}/export-grades`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to export grades');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to export grades');
      }
      
      // Convert JSON to CSV on the frontend
      const csvHeaders = ['Student Name', 'Email', 'Section', 'Grade', 'Max Score', 'Status', 'Submitted At', 'Feedback'];
      const csvRows = data.data.grades.map((grade: any) => [
        grade.studentName,
        grade.studentEmail,
        grade.sectionName,
        grade.grade,
        grade.maxScore,
        grade.status,
        grade.submittedAt,
        grade.feedback.replace(/"/g, '""') // Escape quotes
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map((row: any[]) => 
          row.map(cell => 
            typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))
              ? `"${cell}"`
              : cell
          ).join(',')
        )
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${assignment?.title || 'assignment'}_grades.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('✅ Grades exported successfully!');
      
    } catch (error) {
      console.error('Error exporting grades:', error);
      alert('Failed to export grades. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'graded':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Graded</span>;
      case 'submitted':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Submitted</span>;
      case 'not_submitted':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Not Submitted</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">Unknown</span>;
    }
  };

  const getGradeDisplay = (grade?: number, maxScore?: number) => {
    if (grade === undefined || grade === null) {
      return <span className="text-gray-400">—</span>;
    }
    
    const percentage = maxScore && maxScore > 0 ? Math.round((grade / maxScore) * 100) : null;
    
    return (
      <div className="font-medium">
        <div>{grade}{maxScore ? `/${maxScore}` : ''}</div>
        {percentage !== null && (
          <div className="text-xs text-gray-500">({percentage}%)</div>
        )}
      </div>
    );
  };

  const calculateStats = () => {
    const total = filteredGrades.length;
    const submitted = filteredGrades.filter(g => g.status === 'submitted' || g.status === 'graded').length;
    const graded = filteredGrades.filter(g => g.status === 'graded').length;
    const notSubmitted = filteredGrades.filter(g => g.status === 'not_submitted').length;
    
    const gradedSubmissions = filteredGrades.filter(g => g.grade !== undefined && g.grade !== null);
    const averageGrade = gradedSubmissions.length > 0 
      ? gradedSubmissions.reduce((sum, g) => sum + (g.grade || 0), 0) / gradedSubmissions.length 
      : 0;
    
    return { total, submitted, graded, notSubmitted, averageGrade };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <LoadingSpinner />
        </div>
      </InstructorRoute>
    );
  }

  if (error || !assignment) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-6xl mb-4">😞</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Assignment Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The assignment you are looking for does not exist.'}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
            >
              Go Back
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
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{assignment.title} - Grades</h1>
                <p className="text-gray-600">{assignment.courseName} ({assignment.courseCode})</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Refreshing...' : '🔄 Refresh'}
              </button>
              <button
                onClick={handleExportGrades}
                disabled={isExporting || studentGrades.length === 0}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isExporting ? 'Exporting...' : '📊 Export Grades'}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.submitted}</div>
              <div className="text-sm text-gray-600">Submitted</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">{stats.graded}</div>
              <div className="text-sm text-gray-600">Graded</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-red-600">{stats.notSubmitted}</div>
              <div className="text-sm text-gray-600">Not Submitted</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-purple-600">
                {stats.averageGrade > 0 && assignment?.maxScore ? 
                  `${Math.round((stats.averageGrade / assignment.maxScore) * 100)}%` : 
                  '—'
                }
              </div>
              <div className="text-sm text-gray-600">Average Grade</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Sections ({studentGrades.length})</option>
                  {sections.map(section => (
                    <option key={section.sectionId} value={section.sectionId}>
                      {section.sectionName} ({section.studentCount})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="graded">Graded</option>
                  <option value="submitted">Submitted</option>
                  <option value="not_submitted">Not Submitted</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="section">Section + Name</option>
                  <option value="name">Name</option>
                  <option value="grade">Grade</option>
                  <option value="status">Status</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Grades Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGrades.map((grade) => (
                    <tr key={grade.studentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{grade.studentName}</div>
                          <div className="text-sm text-gray-500">{grade.studentEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{grade.sectionName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(grade.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getGradeDisplay(grade.grade, assignment.maxScore)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {grade.submittedAt ? new Date(grade.submittedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {grade.submissionId && (
                          <button
                            onClick={() => router.push(`/instructor/grading/assignment/${assignmentId}?submissionId=${grade.submissionId}&student=${grade.studentId}`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Grade
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredGrades.length === 0 && (
              <div className="text-center py-12">
                {studentGrades.length === 0 ? (
                  <div>
                    <div className="text-6xl mb-4">👥</div>
                    <div className="text-gray-500 text-lg font-medium mb-2">No Students Enrolled</div>
                    <div className="text-gray-400 text-sm">
                      This course doesn't have any enrolled students yet.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-6xl mb-4">🔍</div>
                    <div className="text-gray-500 text-lg font-medium mb-2">No Results Found</div>
                    <div className="text-gray-400 text-sm">
                      No students match the current filters. Try adjusting your search criteria.
                    </div>
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

export default AssignmentGradesPage;