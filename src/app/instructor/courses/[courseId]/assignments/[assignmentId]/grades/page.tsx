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
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(grade => 
        (grade.studentName || '').toLowerCase().includes(term) ||
        (grade.studentEmail || '').toLowerCase().includes(term) ||
        (grade.sectionName || '').toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const nameA = a.studentName || a.studentEmail || '';
      const nameB = b.studentName || b.studentEmail || '';
      switch (sortBy) {
        case 'name':
          return nameA.localeCompare(nameB);
        case 'section':
          const sectionA = a.sectionName || 'No Section';
          const sectionB = b.sectionName || 'No Section';
          if (sectionA !== sectionB) {
            return sectionA.localeCompare(sectionB);
          }
          return nameA.localeCompare(nameB);
        case 'grade':
          if (a.grade === undefined && b.grade === undefined) return 0;
          if (a.grade === undefined) return 1;
          if (b.grade === undefined) return -1;
          return b.grade - a.grade;
        case 'status':
          const statusOrder = { 'graded': 0, 'submitted': 1, 'not_submitted': 2 };
          const statusCompare = statusOrder[a.status] - statusOrder[b.status];
          if (statusCompare !== 0) return statusCompare;
          return nameA.localeCompare(nameB);
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
      const gradesData: StudentGrade[] = (await Promise.all(
        enrolledStudents
          .filter((student: any) => student.userId) // Skip students with no userId
          .map(async (student: any) => {
          let userName = student.email || student.userId || 'Unknown';
          let userAvatar = student.avatar;
          
          // Fetch full user details (skip if no userId)
          if (student.userId) {
            try {
              const userResponse = await fetch(`/api/users/${student.userId}`, {
                credentials: 'include',
              });
              
              if (userResponse.ok) {
                const userData = await userResponse.json();
                if (userData.success && userData.user) {
                  userName = `${userData.user.firstName || ''} ${userData.user.lastName || ''}`.trim() || userData.user.email || userName;
                }
              }
            } catch (userError) {
              console.warn('Could not fetch user details for:', student.userId);
            }
          }
          
          const submission = submissionMap.get(student.userId);
          
          return {
            studentId: student.userId,
            studentName: userName,
            studentEmail: student.email || '',
            sectionId: student.sectionId,
            sectionName: student.sectionName || 'No Section',
            submissionId: submission?.submissionId,
            grade: submission?.grade,
            feedback: submission?.feedback,
            submittedAt: submission?.submittedAt,
            status: submission ? submission.status : 'not_submitted'
          };
        })
      )) as StudentGrade[];
      
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
      
      // Export from client-side data (already loaded)
      const csvHeaders = ['Student Name', 'Email', 'Section', 'Status', 'Grade'];
      const csvRows = studentGrades.map((grade) => [
        grade.studentName || '',
        grade.studentEmail || '',
        grade.sectionName || '',
        grade.status || '',
        grade.grade !== undefined && grade.grade !== null ? String(grade.grade) : '',
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map((row) => 
          row.map(cell => 
            typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          ).join(',')
        )
      ].join('\n');
      
      // Try download (works in browser, may not in WKWebView)
      try {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${assignment?.title || 'grades'}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert('✅ Grades exported!');
      } catch {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(csvContent);
        alert('✅ Grades copied to clipboard (CSV format)');
      }
      
    } catch (error) {
      console.error('Error exporting grades:', error);
      alert('Failed to export grades.');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'graded':
        return <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] font-medium rounded-full">✓</span>;
      case 'submitted':
        return <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-medium rounded-full">Pending</span>;
      case 'not_submitted':
        return <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-medium rounded-full">Missing</span>;
      default:
        return <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 text-[10px] font-medium rounded-full">—</span>;
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
      <div className="min-h-full overflow-y-auto pb-24 bg-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <img src="/ClassCastLogo.png" alt="" className="w-7 h-7 object-contain shrink-0" />
              <span className="text-sm font-bold text-[#005587] shrink-0">Assignment Details</span>
            </div>
            <button
              onClick={handleExportGrades}
              disabled={isExporting || studentGrades.length === 0}
              className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center disabled:opacity-50 shrink-0"
            >
              📊
            </button>
          </div>
        </div>

        <div className="px-4 py-3 space-y-3">
          {/* Assignment title + course */}
          <div>
            <h2 className="text-sm font-bold text-[#005587]">{assignment.title}</h2>
            <p className="text-xs text-gray-500">{assignment.courseName}</p>
          </div>

          {/* Stats Row - compact */}
          <div className="grid grid-cols-5 gap-2">
            <div className="bg-gray-50 rounded-xl p-2 text-center">
              <div className="text-lg font-bold text-[#005587]">{stats.total}</div>
              <div className="text-[9px] text-gray-500">Total</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-2 text-center">
              <div className="text-lg font-bold text-[#005587]">{stats.submitted}</div>
              <div className="text-[9px] text-gray-500">Submitted</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-2 text-center">
              <div className="text-lg font-bold text-[#005587]">{stats.graded}</div>
              <div className="text-[9px] text-gray-500">Graded</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-2 text-center">
              <div className="text-lg font-bold text-[#005587]">{stats.notSubmitted}</div>
              <div className="text-[9px] text-gray-500">Missing</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-2 text-center">
              <div className="text-lg font-bold text-[#005587]">
                {stats.averageGrade > 0 && assignment?.maxScore ? `${Math.round((stats.averageGrade / assignment.maxScore) * 100)}%` : '—'}
              </div>
              <div className="text-[9px] text-gray-500">Avg</div>
            </div>
          </div>

          {/* Filters - collapsible */}
          <details className="bg-gray-50 rounded-xl">
            <summary className="px-3 py-2 text-xs text-gray-600 font-medium cursor-pointer flex items-center justify-between">
              <span>Filters</span>
              <span className="text-[10px] text-gray-400">{filteredGrades.length}/{studentGrades.length}</span>
            </summary>
            <div className="px-3 pb-3 grid grid-cols-2 gap-2">
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
              >
                <option value="all">All Sections</option>
                {sections.map(section => (
                  <option key={section.sectionId} value={section.sectionId}>
                    {section.sectionName}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
              >
                <option value="all">All Status</option>
                <option value="graded">Graded</option>
                <option value="submitted">Submitted</option>
                <option value="not_submitted">Missing</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
              >
                <option value="section">Section</option>
                <option value="name">Name</option>
                <option value="grade">Grade</option>
                <option value="status">Status</option>
              </select>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
              />
            </div>
          </details>
          {/* Student List */}
          <div className="space-y-1">
            {filteredGrades.map((grade) => (
              <div key={grade.studentId} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0 mr-2">
                  <div className="text-xs font-medium text-gray-900 truncate">{grade.studentName}</div>
                  <div className="text-[10px] text-gray-400">{grade.sectionName}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {getStatusBadge(grade.status)}
                  <span className="text-xs font-medium text-gray-700 w-8 text-right">
                    {grade.grade !== undefined && grade.grade !== null ? grade.grade : '—'}
                  </span>
                  {grade.submissionId && (
                    <button
                      onClick={() => router.push(`/instructor/grading/assignment/${assignmentId}?submissionId=${grade.submissionId}&student=${grade.studentId}`)}
                      className="text-[10px] text-[#005587] font-bold"
                    >
                      Grade
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
            
          {filteredGrades.length === 0 && (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">{studentGrades.length === 0 ? '👥' : '🔍'}</div>
              <p className="text-sm text-gray-500">
                {studentGrades.length === 0 ? 'No students enrolled yet' : 'No results match your filters'}
              </p>
            </div>
          )}
        </div>
      </div>
    </InstructorRoute>
  );
};

export default AssignmentGradesPage;