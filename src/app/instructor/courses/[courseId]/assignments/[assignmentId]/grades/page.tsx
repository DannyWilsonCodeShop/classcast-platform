'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { AssignmentEditModal, AssignmentEditData } from '@/components/instructor/AssignmentEditModal';
import { FormattingTextarea } from '@/components/common/FormattingTextarea';

interface Assignment {
  assignmentId: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  courseId: string;
  courseName: string;
  courseCode: string;
  assignmentType?: string;
  instructionalVideoUrl?: string;
  responseDueDate?: string;
  allowLateSubmission?: boolean;
  latePenalty?: number;
  maxSubmissions?: number;
  enablePeerResponses?: boolean;
  minResponsesRequired?: number;
  maxResponsesPerVideo?: number;
  responseWordLimit?: number;
  peerReviewScope?: string;
  requireLiveRecording?: boolean;
  allowYouTubeUrl?: boolean;
  groupAssignment?: boolean;
  maxGroupSize?: number;
  choices?: ChoiceBoardOption[];
}

interface ChoiceBoardOption {
  choiceId: string;
  title: string;
  description: string;
  color?: string;
  maxSlotsPerSection?: number;
  slotsBySection?: Record<string, number>;
}

interface SectionEnrollment {
  sectionId: string;
  sectionName: string;
  classCode?: string | null;
  enrolledCount: number;
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
  const [showEditModal, setShowEditModal] = useState(false);

  // Choice board inline editing
  const [editingChoices, setEditingChoices] = useState(false);
  const [choicesDraft, setChoicesDraft] = useState<ChoiceBoardOption[]>([]);
  const [savingChoices, setSavingChoices] = useState(false);
  const [sectionEnrollment, setSectionEnrollment] = useState<SectionEnrollment[]>([]);
  const choiceColors = ['#4A90E2', '#7B61FF', '#38A169', '#E53E3E'];

  const startEditingChoices = () => {
    const existing = assignment?.choices || [];
    const numChoices = Math.max(1, existing.length);
    // Seed slotsBySection for any section that doesn't already have an explicit value,
    // defaulting to an even split of that section's enrollment across the choices.
    const draft = existing.map(c => {
      const sbs: Record<string, number> = { ...(c.slotsBySection || {}) };
      for (const sec of sectionEnrollment) {
        if (typeof sbs[sec.sectionId] !== 'number') {
          sbs[sec.sectionId] = Math.max(1, Math.ceil((sec.enrolledCount || 0) / numChoices)) || (c.maxSlotsPerSection ?? 5);
        }
      }
      return { ...c, slotsBySection: sbs };
    });
    setChoicesDraft(draft);
    setEditingChoices(true);
  };

  const saveChoices = async () => {
    if (!assignment) return;
    setSavingChoices(true);
    try {
      const cleaned = choicesDraft.filter(c => c.title.trim()).map(c => {
        const sbs = c.slotsBySection || {};
        const vals = Object.values(sbs).filter(v => typeof v === 'number');
        // Keep maxSlotsPerSection as a fallback (largest per-section value) for students
        // whose section isn't explicitly listed.
        const fallback = vals.length ? Math.max(...vals) : (c.maxSlotsPerSection ?? 5);
        return { ...c, maxSlotsPerSection: fallback };
      });
      const res = await fetch(`/api/assignments/${assignment.assignmentId}?t=${Date.now()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ choices: cleaned }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAssignment(prev => prev ? { ...prev, choices: cleaned } : prev);
        setEditingChoices(false);
      } else {
        alert(data.error || 'Failed to save choices');
      }
    } catch (e: any) {
      alert(e?.message || 'Network error saving choices');
    } finally {
      setSavingChoices(false);
    }
  };
  
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
          courseCode: assignment.courseCode || assignment.course?.code || 'N/A',
          assignmentType: assignment.assignmentType || assignment.type,
          instructionalVideoUrl: assignment.instructionalVideoUrl || assignment.videoUrl,
          choices: assignment.choices,
        });
      }
      
      // Fetch enrolled students AND sections for filtering
      const [studentsResponse, sectionsResponse] = await Promise.all([
        fetch(`/api/courses/enrollment?courseId=${courseId}`, { credentials: 'include' }),
        fetch(`/api/sections?courseId=${courseId}`, { credentials: 'include' }),
      ]);

      // Per-section enrollment counts (for choice-board slot defaults)
      fetch(`/api/courses/${courseId}/section-enrollment`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.success) setSectionEnrollment(d.sections || []); })
        .catch(() => {});
      
      if (!studentsResponse.ok) {
        throw new Error('Failed to fetch students');
      }
      
      const studentsData = await studentsResponse.json();
      console.log('Students API response:', studentsData); // Debug log
      const enrolledStudents = studentsData.success ? studentsData.data?.students || [] : [];
      
      // Get sections from sections table (these have proper names like "Section A", "Section B")
      const sectionsData = sectionsResponse.ok ? await sectionsResponse.json() : { data: [] };
      const courseSections = (sectionsData.data || []).map((s: any) => ({
        sectionId: s.sectionId,
        sectionName: s.sectionName,
      }));
      
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
          
          // Resolve section name from sections table if not on student record
          let resolvedSectionName = student.sectionName || 'No Section';
          if (student.sectionId && (!student.sectionName || student.sectionName === 'No Section')) {
            const matchedSection = courseSections.find((s: any) => s.sectionId === student.sectionId);
            if (matchedSection) resolvedSectionName = matchedSection.sectionName;
          }
          
          return {
            studentId: student.userId,
            studentName: userName,
            studentEmail: student.email || '',
            sectionId: student.sectionId,
            sectionName: resolvedSectionName,
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
      
      // Use sections from sections table (more reliable than deriving from student data)
      if (courseSections.length > 0) {
        const sectionsWithCounts = courseSections.map((section: any) => ({
          sectionId: section.sectionId,
          sectionName: section.sectionName,
          studentCount: gradesData.filter(grade => grade.sectionId === section.sectionId).length
        }));
        setSections(sectionsWithCounts);
      } else {
        // Fallback: derive from student data
        const uniqueSections = Array.from(new Set(
          gradesData
            .filter(grade => grade.sectionId && grade.sectionName && grade.sectionName !== 'No Section')
            .map(grade => JSON.stringify({ sectionId: grade.sectionId, sectionName: grade.sectionName }))
        )).map(str => JSON.parse(str));
        
        const sectionsWithCounts = uniqueSections.map(section => ({
          sectionId: section.sectionId,
          sectionName: section.sectionName,
          studentCount: gradesData.filter(grade => grade.sectionId === section.sectionId).length
        }));
        setSections(sectionsWithCounts);
      }
      
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
      case 'not_submitted': {
        const isPastDue = assignment?.dueDate && new Date(assignment.dueDate) < new Date();
        if (isPastDue) {
          return <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-medium rounded-full">Missing</span>;
        }
        return <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full">Pending</span>;
      }
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
      <div className="min-h-full overflow-y-auto pb-24 bg-[#faf9f7]">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <img src="/ClassCastLogo.png" alt="" className="w-7 h-7 object-contain shrink-0" />
              <span className="text-sm font-bold text-[#005587] shrink-0">Assignment Details</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowEditModal(true)}
                className="px-3 py-1 bg-gray-50 rounded-full text-[10px] font-bold text-[#005587]"
              >
                Edit
              </button>
              <button
                onClick={async () => {
                  if (!confirm('Delete this assignment? This cannot be undone.')) return;
                  try {
                    const res = await fetch(`/api/assignments/${assignmentId}`, { method: 'DELETE' });
                    if (res.ok) {
                      router.push(`/instructor/courses/${courseId}`);
                    } else {
                      alert('Failed to delete assignment');
                    }
                  } catch {
                    alert('Error deleting assignment');
                  }
                }}
                className="px-3 py-1 bg-red-50 rounded-full text-[10px] font-bold text-red-600"
              >
                Delete
              </button>
              <button
                onClick={handleExportGrades}
                disabled={isExporting || studentGrades.length === 0}
                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center disabled:opacity-50 shrink-0"
              >
                📊
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 space-y-3">
          {/* Assignment Info Section */}
          <div className="bg-gray-50 rounded-2xl p-3 space-y-2">
            <h2 className="text-sm font-bold text-[#005587]">{assignment.title}</h2>
            <p className="text-xs text-gray-500">{assignment.courseName} · {assignment.courseCode}</p>
            {assignment.description && (
              <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap [&_strong]:font-semibold [&_em]:italic" dangerouslySetInnerHTML={{ __html: assignment.description.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/^## (.+)$/gm, '<h3 class="font-bold text-sm text-gray-900 mt-2 mb-1">$1</h3>').replace(/^---$/gm, '<hr class="my-2 border-gray-200">') }} />
            )}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-gray-600">
                📅 Due: {new Date(assignment.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-600">🎯 Max Score: {assignment.maxScore}</span>
              {assignment.assignmentType && (
                <span className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-[10px] font-medium text-[#005587]">
                  {assignment.assignmentType}
                </span>
              )}
            </div>
            {assignment.instructionalVideoUrl && (
              <div className="pt-1">
                <p className="text-[10px] text-gray-500 mb-1 font-medium">Instructional Video</p>
                <div
                  className="w-32 h-20 bg-white border border-gray-200 rounded-xl flex items-center justify-center cursor-pointer"
                  onClick={() => window.open(assignment.instructionalVideoUrl, '_blank')}
                >
                  <div className="text-center">
                    <div className="text-2xl">🎬</div>
                    <div className="text-[9px] text-gray-400 mt-0.5">Watch</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Choice Board Options */}
          {assignment.assignmentType === 'choice-board' && (
            <div className="bg-gray-50 rounded-2xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#005587]">Choice Board Options</p>
                {!editingChoices ? (
                  <button
                    onClick={startEditingChoices}
                    className="text-xs font-medium text-[#005587] bg-white border border-[#005587]/30 rounded-full px-3 py-1 hover:bg-[#005587]/5"
                  >
                    Edit Choices
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingChoices(false)}
                      className="text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full px-3 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveChoices}
                      disabled={savingChoices}
                      className="text-xs font-bold text-white bg-[#005587] rounded-full px-3 py-1 disabled:opacity-50"
                    >
                      {savingChoices ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {/* READ-ONLY VIEW */}
              {!editingChoices && (
                <div className="space-y-2">
                  {(assignment.choices && assignment.choices.length > 0) ? (
                    assignment.choices.map((choice, idx) => (
                      <div
                        key={choice.choiceId || idx}
                        className="bg-white border rounded-xl p-3"
                        style={{ borderColor: (choice.color || '#e5e7eb') + '55', borderLeftWidth: 4, borderLeftColor: choice.color || '#005587' }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="text-sm font-bold text-gray-900">{choice.title || `Choice ${idx + 1}`}</h3>
                        </div>
                        {choice.description ? (
                          <div
                            className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap [&_strong]:font-semibold [&_em]:italic"
                            dangerouslySetInnerHTML={{ __html: choice.description.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/^## (.+)$/gm, '<h4 class="font-bold text-xs text-gray-900 mt-2 mb-1">$1</h4>').replace(/^---$/gm, '<hr class="my-2 border-gray-200">') }}
                          />
                        ) : (
                          <p className="text-xs text-gray-400 italic">No directions yet. Click Edit Choices to add.</p>
                        )}
                        {/* Per-section slot limits */}
                        {choice.slotsBySection && Object.keys(choice.slotsBySection).length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {sectionEnrollment.map(sec => {
                              const v = choice.slotsBySection?.[sec.sectionId];
                              if (typeof v !== 'number') return null;
                              return (
                                <span key={sec.sectionId} className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-medium text-gray-600 whitespace-nowrap">
                                  {sec.sectionName}: {v}
                                </span>
                              );
                            })}
                          </div>
                        ) : typeof choice.maxSlotsPerSection === 'number' ? (
                          <div className="mt-2">
                            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-medium text-gray-600 whitespace-nowrap">
                              {choice.maxSlotsPerSection} slot{choice.maxSlotsPerSection === 1 ? '' : 's'} / section
                            </span>
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No choices set up yet. Click Edit Choices to add them.</p>
                  )}
                </div>
              )}

              {/* EDIT VIEW */}
              {editingChoices && (
                <div className="space-y-3">
                  {choicesDraft.map((choice, index) => (
                    <div key={choice.choiceId || index} className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: choice.color || choiceColors[index] || '#4A90E2' }} />
                        <input
                          type="text"
                          value={choice.title}
                          onChange={(e) => setChoicesDraft(prev => prev.map((c, i) => i === index ? { ...c, title: e.target.value } : c))}
                          placeholder={`Choice ${index + 1} title`}
                          className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
                        />
                        {choicesDraft.length > 2 && (
                          <button onClick={() => setChoicesDraft(prev => prev.filter((_, i) => i !== index))} className="text-gray-300 hover:text-red-400 text-sm px-1 shrink-0">✕</button>
                        )}
                      </div>
                      <FormattingTextarea
                        value={choice.description}
                        onChange={(val) => setChoicesDraft(prev => prev.map((c, i) => i === index ? { ...c, description: val } : c))}
                        placeholder="Directions for this choice. Use the toolbar for bold, headings, lists, and paragraphs..."
                        rows={4}
                      />
                      {/* Per-section slot limits */}
                      {sectionEnrollment.length > 0 ? (
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-[10px] font-medium text-gray-600 mb-1.5">Max students per section who can pick this choice</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {sectionEnrollment.map(sec => (
                              <div key={sec.sectionId} className="flex items-center justify-between gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                                <span className="text-[10px] text-gray-600 truncate" title={`${sec.sectionName} (${sec.enrolledCount} enrolled)`}>
                                  {sec.sectionName}
                                  <span className="text-gray-300"> /{sec.enrolledCount}</span>
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  value={choice.slotsBySection?.[sec.sectionId] ?? ''}
                                  onChange={(e) => {
                                    const v = e.target.value === '' ? undefined : Number(e.target.value);
                                    setChoicesDraft(prev => prev.map((c, i) => {
                                      if (i !== index) return c;
                                      const sbs = { ...(c.slotsBySection || {}) };
                                      if (v === undefined) delete sbs[sec.sectionId]; else sbs[sec.sectionId] = v;
                                      return { ...c, slotsBySection: sbs };
                                    }));
                                  }}
                                  className="w-10 px-1 py-0.5 border border-gray-200 rounded text-[11px] text-center focus:border-[#005587] focus:outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-gray-500">Max per section</label>
                          <input
                            type="number"
                            value={choice.maxSlotsPerSection ?? 10}
                            onChange={(e) => setChoicesDraft(prev => prev.map((c, i) => i === index ? { ...c, maxSlotsPerSection: Number(e.target.value) } : c))}
                            min={1}
                            className="w-14 px-1 py-1 border border-gray-200 rounded-lg text-xs text-center focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  {choicesDraft.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setChoicesDraft(prev => {
                        const n = prev.length + 1;
                        const sbs: Record<string, number> = {};
                        for (const sec of sectionEnrollment) sbs[sec.sectionId] = Math.max(1, Math.ceil((sec.enrolledCount || 0) / n)) || 5;
                        return [...prev, { choiceId: `c${prev.length + 1}_${Date.now()}`, title: '', description: '', color: choiceColors[prev.length] || '#4A90E2', maxSlotsPerSection: 10, slotsBySection: sbs }];
                      })}
                      className="w-full py-2 border border-dashed border-[#005587]/40 rounded-xl text-xs text-[#005587] hover:bg-[#005587]/5"
                    >
                      + Add Choice
                    </button>
                  )}
                  {choicesDraft.length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const mk = (id: string, color: string) => {
                          const sbs: Record<string, number> = {};
                          for (const sec of sectionEnrollment) sbs[sec.sectionId] = Math.max(1, Math.ceil((sec.enrolledCount || 0) / 3)) || 5;
                          return { choiceId: `${id}_${Date.now()}`, title: '', description: '', color, maxSlotsPerSection: 10, slotsBySection: sbs };
                        };
                        setChoicesDraft([mk('c1', '#4A90E2'), mk('c2', '#7B61FF'), mk('c3', '#38A169')]);
                      }}
                      className="w-full py-2 border border-dashed border-[#005587]/40 rounded-xl text-xs text-[#005587] hover:bg-[#005587]/5"
                    >
                      + Add Choices
                    </button>
                  )}
                  <p className="text-[10px] text-gray-400">
                    Each number is how many students in that section may pick the choice. Defaults split each section&apos;s enrollment evenly across the choices; adjust any as needed.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Video Submissions Grid */}
          {studentGrades.filter(g => (g.status === 'submitted' || g.status === 'graded') && g.submissionId).length > 0 && (
            <div>
              <p className="text-sm font-bold text-[#005587] mb-2">Video Submissions</p>
              <div className="flex overflow-x-auto gap-2 pb-2 -mx-1 px-1">
                {studentGrades
                  .filter(g => (g.status === 'submitted' || g.status === 'graded') && g.submissionId)
                  .map((grade) => (
                    <button
                      key={grade.studentId}
                      onClick={() => router.push(`/instructor/grading/assignment/${assignmentId}?submissionId=${grade.submissionId}&student=${grade.studentId}`)}
                      className="flex-shrink-0 w-[120px] bg-gray-50 rounded-2xl p-2 text-center"
                    >
                      <div className="w-full h-16 bg-white border border-gray-200 rounded-xl flex items-center justify-center mb-1.5">
                        <div className="text-xl">🎥</div>
                      </div>
                      <p className="text-[10px] text-gray-700 font-medium truncate">{grade.studentName}</p>
                      <p className="text-[9px] text-gray-400">
                        {grade.status === 'graded' ? `${grade.grade}/${assignment.maxScore}` : 'Pending'}
                      </p>
                    </button>
                  ))}
              </div>
            </div>
          )}

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
            <summary className="px-3 py-2 text-xs text-gray-600 font-medium cursor-pointer flex items-center justify-between list-none [&::-webkit-details-marker]:hidden">
              <span>Filters</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400">{filteredGrades.length}/{studentGrades.length}</span>
                <svg className="w-3.5 h-3.5 text-gray-400 transition-transform [[open]>&]:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
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
                  <span className="text-xs font-medium text-gray-700 w-12 text-right">
                    {grade.grade !== undefined && grade.grade !== null ? `${grade.grade}/${assignment.maxScore}` : '—'}
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

        {/* Edit Modal */}
        {assignment && (
          <AssignmentEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={(data: AssignmentEditData) => {
              setAssignment(prev => prev ? { ...prev, ...data } : prev);
            }}
            courseId={courseId}
            assignment={assignment}
          />
        )}
      </div>
    </InstructorRoute>
  );
};

export default AssignmentGradesPage;