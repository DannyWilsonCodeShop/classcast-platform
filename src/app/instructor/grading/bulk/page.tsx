'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  enablePeerResponses?: boolean;
  responseDueDate?: string;
  minResponsesRequired?: number;
  maxResponsesPerVideo?: number;
  responseWordLimit?: number;
  responseCharacterLimit?: number;
}

interface VideoSubmission {
  submissionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  assignmentId: string;
  assignmentTitle: string;
  videoUrl: string;
  thumbnailUrl?: string;
  submittedAt: string;
  duration: number;
  fileSize: number;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
  courseName: string;
  courseCode: string;
  courseId: string;
  sectionId?: string;
  sectionName?: string;
}

interface PeerResponse {
  responseId: string;
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

type FilterType = 'all' | 'graded' | 'ungraded';
type SortType = 'name' | 'date' | 'assignment' | 'course' | 'grade' | 'section';

const BulkGradingContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  // Remove videoRef - not needed in continuous feed
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<VideoSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<VideoSubmission[]>([]);
  // Remove currentIndex - using continuous feed instead
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Remove playbackSpeed - not needed in continuous feed
  
  // Filter and search state
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('section');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedStudentName, setSelectedStudentName] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  
  // Grading state with auto-save
  const [grades, setGrades] = useState<Record<string, number | ''>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [savingGrades, setSavingGrades] = useState<Set<string>>(new Set());
  const [saveTimeouts, setSaveTimeouts] = useState<Record<string, NodeJS.Timeout>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Remove peer response state - not needed in continuous feed

  // Remove scroll navigation state - using continuous feed instead

  // Get unique courses from submissions
  const courses = Array.from(new Set(allSubmissions.map(sub => `${sub.courseCode} - ${sub.courseName}`)));
  
  // Get unique sections from submissions
  const uniqueSections = Array.from(new Set(
    allSubmissions
      .filter(sub => sub.sectionId && sub.sectionName)
      .map(sub => ({ id: sub.sectionId!, name: sub.sectionName! }))
      .map(section => JSON.stringify(section))
  )).map(str => JSON.parse(str)).sort((a, b) => a.name.localeCompare(b.name));
  
  // Get unique students from submissions
  const students = Array.from(new Map(allSubmissions.map(sub => [sub.studentId, {
    studentId: sub.studentId,
    studentName: sub.studentName
  }])).values());

  // Fetch all submissions for instructor
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('🎯 BULK GRADING: Fetching all submissions for instructor');
        
        // Get filters from URL params
        const courseParam = searchParams.get('course');
        console.log('🔍 BULK GRADING: URL courseParam:', courseParam);
        if (courseParam && courseParam !== 'all') {
          setSelectedCourse(courseParam);
        }
        
        const studentParam = searchParams.get('student');
        const studentNameParam = searchParams.get('studentName');
        if (studentParam && studentParam !== 'all') {
          setSelectedStudent(studentParam);
          if (studentNameParam) {
            setSelectedStudentName(decodeURIComponent(studentNameParam));
          }
        }
        
        // Fetch all submissions for instructor
        const submissionsResponse = await fetch(`/api/instructor/video-submissions`, {
          credentials: 'include',
        });
        
        if (!submissionsResponse.ok) {
          throw new Error('Failed to fetch submissions');
        }
        
        const submissionsData = await submissionsResponse.json();
        console.log('🎯 BULK GRADING: All submissions response:', submissionsData);
        
        if (submissionsData.success && submissionsData.submissions) {
          const transformedSubmissions: VideoSubmission[] = submissionsData.submissions.map((sub: any) => ({
            submissionId: sub.submissionId || sub.id,
            studentId: sub.studentId,
            studentName: sub.student?.name || 'Unknown Student',
            studentEmail: sub.student?.email || '',
            assignmentId: sub.assignmentId,
            assignmentTitle: sub.assignment?.title || 'Unknown Assignment',
            videoUrl: sub.videoUrl,
            thumbnailUrl: sub.thumbnailUrl,
            submittedAt: sub.submittedAt || sub.createdAt,
            duration: sub.duration || 0,
            fileSize: sub.fileSize || 0,
            grade: sub.grade,
            feedback: sub.instructorFeedback || sub.feedback,
            status: sub.grade !== null && sub.grade !== undefined ? 'graded' : 'submitted',
            courseName: sub.assignment?.courseName || 'Unknown Course',
            courseCode: sub.assignment?.courseCode || 'N/A',
            courseId: sub.courseId || sub.assignment?.courseId || '', // Add courseId
            sectionId: sub.student?.sectionId || null,
            sectionName: sub.student?.sectionName || null
          }));
          
          console.log('🎯 BULK GRADING: Transformed submissions:', transformedSubmissions.length);
          setAllSubmissions(transformedSubmissions);
          
          // Initialize grades and feedback state
          const initialGrades: Record<string, number | ''> = {};
          const initialFeedback: Record<string, string> = {};
          
          transformedSubmissions.forEach(sub => {
            initialGrades[sub.submissionId] = sub.grade || '';
            initialFeedback[sub.submissionId] = sub.feedback || '';
          });
          
          setGrades(initialGrades);
          setFeedback(initialFeedback);
          
          // Extract unique assignments
          const uniqueAssignments = Array.from(
            new Map(transformedSubmissions.map(sub => [
              sub.assignmentId,
              {
                assignmentId: sub.assignmentId,
                title: sub.assignmentTitle,
                description: '',
                dueDate: '',
                maxScore: 100,
                courseId: '',
                courseName: sub.courseName,
                courseCode: sub.courseCode
              }
            ])).values()
          );
          setAssignments(uniqueAssignments);
          
          // Load first submission's grade and feedback if available
          if (transformedSubmissions.length > 0) {
            const firstSubmission = transformedSubmissions[0];
            setCurrentGrade(firstSubmission.grade || '');
            setCurrentFeedback(firstSubmission.feedback || '');
          }
        } else {
          console.log('🎯 BULK GRADING: No submissions found');
          setAllSubmissions([]);
        }
        
      } catch (err) {
        console.error('BULK GRADING: Error fetching submissions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user?.id, searchParams]);

  // Filter and sort submissions
  useEffect(() => {
    let filtered = [...allSubmissions];
    
    console.log('🔍 BULK GRADING: Filtering submissions');
    console.log('🔍 BULK GRADING: selectedCourse:', selectedCourse);
    console.log('🔍 BULK GRADING: allSubmissions count:', allSubmissions.length);
    
    // Apply course filter - handle both courseId and "courseCode - courseName" format
    if (selectedCourse !== 'all') {
      const courseFilter = selectedCourse;
      console.log('🔍 BULK GRADING: Applying course filter:', courseFilter);
      
      // Check if it's a courseId (starts with "course_") or formatted string
      if (courseFilter.startsWith('course_')) {
        // Filter by courseId
        filtered = filtered.filter(sub => {
          const matches = sub.courseId === courseFilter;
          console.log(`🔍 BULK GRADING: Checking submission ${sub.submissionId} courseId ${sub.courseId} vs ${courseFilter}:`, matches);
          return matches;
        });
      } else {
        // Filter by "courseCode - courseName" format
        filtered = filtered.filter(sub => `${sub.courseCode} - ${sub.courseName}` === courseFilter);
      }
      
      console.log('🔍 BULK GRADING: After course filter:', filtered.length, 'submissions');
    }
    
    // Apply assignment filter
    if (selectedAssignment !== 'all') {
      filtered = filtered.filter(sub => sub.assignmentId === selectedAssignment);
    }
    
    // Apply student filter
    if (selectedStudent !== 'all') {
      filtered = filtered.filter(sub => sub.studentId === selectedStudent);
    }
    
    // Apply section filter
    if (selectedSection !== 'all') {
      filtered = filtered.filter(sub => sub.sectionId === selectedSection);
    }
    
    // Apply status filter
    if (filter === 'graded') {
      filtered = filtered.filter(sub => sub.status === 'graded');
    } else if (filter === 'ungraded') {
      filtered = filtered.filter(sub => sub.status === 'submitted');
    }
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.sectionName && sub.sectionName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.studentName.localeCompare(b.studentName);
        case 'date':
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        case 'assignment':
          return a.assignmentTitle.localeCompare(b.assignmentTitle);
        case 'course':
          return a.courseName.localeCompare(b.courseName);
        case 'section':
          // Sort by section first, then by name within section
          const sectionA = a.sectionName || 'No Section';
          const sectionB = b.sectionName || 'No Section';
          const sectionCompare = sectionA.localeCompare(sectionB);
          if (sectionCompare !== 0) return sectionCompare;
          return a.studentName.localeCompare(b.studentName);
        case 'grade':
          if (a.grade === undefined && b.grade === undefined) return 0;
          if (a.grade === undefined) return 1;
          if (b.grade === undefined) return -1;
          return b.grade - a.grade;
        default:
          return 0;
      }
    });
    
    setFilteredSubmissions(filtered);
    
    // Remove currentIndex logic - using continuous feed instead
    
    // Update current grade and feedback for the new current submission
  }, [allSubmissions, selectedCourse, selectedAssignment, selectedStudent, selectedSection, filter, searchTerm, sortBy]);

  // Remove peer responses fetch - not needed in continuous feed

  // Remove currentSubmission - using continuous feed instead

  // Remove peer response functions - not needed in continuous feed

  // Remove old navigation functions - using continuous feed instead

  // Auto-save handlers
  const handleGradeChange = (submissionId: string, value: string) => {
    const numValue = value === '' ? '' : Number(value);
    setGrades(prev => ({ ...prev, [submissionId]: numValue }));
    
    // Clear existing timeout
    if (saveTimeouts[submissionId]) {
      clearTimeout(saveTimeouts[submissionId]);
    }
    
    // Set new timeout for auto-save
    const timeoutId = setTimeout(() => {
      handleSaveGrade(submissionId);
    }, 1000); // 1 second delay
    
    setSaveTimeouts(prev => ({ ...prev, [submissionId]: timeoutId }));
  };

  const handleFeedbackChange = (submissionId: string, value: string) => {
    setFeedback(prev => ({ ...prev, [submissionId]: value }));
    
    // Clear existing timeout
    if (saveTimeouts[submissionId]) {
      clearTimeout(saveTimeouts[submissionId]);
    }
    
    // Set new timeout for auto-save
    const timeoutId = setTimeout(() => {
      handleSaveGrade(submissionId);
    }, 1000); // 1 second delay
    
    setSaveTimeouts(prev => ({ ...prev, [submissionId]: timeoutId }));
  };

  const handleSaveGrade = async (submissionId: string) => {
    const grade = grades[submissionId];
    const feedbackText = feedback[submissionId] || '';
    
    // Don't save if no grade is entered
    if (grade === '' || grade === undefined) {
      return;
    }
    
    setSavingGrades(prev => new Set([...prev, submissionId]));
    
    try {
      const response = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          grade: Number(grade),
          feedback: feedbackText,
          status: 'graded'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save grade');
      }

      const data = await response.json();
      if (data.success) {
        // Update local state
        setAllSubmissions(prev => prev.map(sub =>
          sub.submissionId === submissionId
            ? { ...sub, grade: Number(grade), feedback: feedbackText, status: 'graded' as const }
            : sub
        ));
      } else {
        throw new Error(data.error || 'Failed to save grade');
      }
    } catch (error) {
      console.error('Error saving grade:', error);
      // Could add toast notification here
    } finally {
      setSavingGrades(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
      
      // Clear timeout
      if (saveTimeouts[submissionId]) {
        clearTimeout(saveTimeouts[submissionId]);
        setSaveTimeouts(prev => {
          const newTimeouts = { ...prev };
          delete newTimeouts[submissionId];
          return newTimeouts;
        });
      }
    }
  };

  // Remove old saveGrade function - using auto-save instead

  // Delete submission function
  const handleDeleteSubmission = async (submissionId: string) => {
    const submission = allSubmissions.find(sub => sub.submissionId === submissionId);
    if (!submission) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${submission.studentName}'s video submission? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/video-submissions/${submissionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete submission');
      }

      const data = await response.json();
      if (data.success) {
        // Remove from local state
        setAllSubmissions(prev => prev.filter(sub => sub.submissionId !== submissionId));
        
        // Clean up grades and feedback state
        setGrades(prev => {
          const newGrades = { ...prev };
          delete newGrades[submissionId];
          return newGrades;
        });
        
        setFeedback(prev => {
          const newFeedback = { ...prev };
          delete newFeedback[submissionId];
          return newFeedback;
        });
        
        alert('Submission deleted successfully');
      } else {
        throw new Error(data.error || 'Failed to delete submission');
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('Failed to delete submission. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Remove video controls - not needed in continuous feed

  // Remove scroll navigation - using continuous feed instead

  if (loading) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <LoadingSpinner />
        </div>
      </InstructorRoute>
    );
  }

  if (error) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-6xl mb-4">😞</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Submissions</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </InstructorRoute>
    );
  }

  if (allSubmissions.length === 0) {
    return (
      <InstructorRoute>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => {
                    // If we came from a specific course and student, go back to that course's Students tab
                    const courseParam = searchParams.get('course');
                    const studentParam = searchParams.get('student');
                    
                    if (courseParam && courseParam.startsWith('course_') && studentParam) {
                      // Navigate back to the course page with Students tab active
                      router.push(`/instructor/courses/${courseParam}?tab=students`);
                    } else {
                      // Default back behavior
                      router.back();
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors mb-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Bulk Grading</h1>
                <p className="text-gray-600">Grade multiple assignments at once</p>
              </div>
            </div>
          </div>

          {/* No submissions message */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">No Submissions Found</h2>
              <p className="text-gray-600 mb-6">There are no video submissions to grade at this time.</p>
              <button
                onClick={() => router.push('/instructor/dashboard')}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </InstructorRoute>
    );
  }

  if (filteredSubmissions.length === 0) {
    return (
      <InstructorRoute>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    // If we came from a specific course and student, go back to that course's Students tab
                    const courseParam = searchParams.get('course');
                    const studentParam = searchParams.get('student');
                    
                    if (courseParam && courseParam.startsWith('course_') && studentParam) {
                      // Navigate back to the course page with Students tab active
                      router.push(`/instructor/courses/${courseParam}?tab=students`);
                    } else {
                      // Default back behavior
                      router.back();
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Bulk Grading</h1>
                  <p className="text-sm text-gray-600">{allSubmissions.length} total submissions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All Courses ({allSubmissions.length})</option>
                    {courses.map(course => (
                      <option key={course} value={course}>
                        {course} ({allSubmissions.filter(s => `${s.courseCode} - ${s.courseName}` === course).length})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignment</label>
                  <select
                    value={selectedAssignment}
                    onChange={(e) => setSelectedAssignment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All Assignments</option>
                    {assignments.map(assignment => (
                      <option key={assignment.assignmentId} value={assignment.assignmentId}>
                        {assignment.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => {
                      setSelectedStudent(e.target.value);
                      const student = students.find(s => s.studentId === e.target.value);
                      setSelectedStudentName(student?.studentName || '');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All Students</option>
                    {students.map(student => (
                      <option key={student.studentId} value={student.studentId}>
                        {student.studentName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All Sections ({allSubmissions.length})</option>
                    {uniqueSections.map(section => (
                      <option key={section.id} value={section.id}>
                        {section.name} ({allSubmissions.filter(s => s.sectionId === section.id).length})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as FilterType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All ({allSubmissions.length})</option>
                    <option value="ungraded">Ungraded ({allSubmissions.filter(s => s.status === 'submitted').length})</option>
                    <option value="graded">Graded ({allSubmissions.filter(s => s.status === 'graded').length})</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Student or assignment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="section">Section + Name</option>
                    <option value="name">Student Name</option>
                    <option value="date">Submission Date</option>
                    <option value="assignment">Assignment</option>
                    <option value="course">Course</option>
                    <option value="grade">Grade</option>
                  </select>
                </div>
              </div>
            </div>

            {/* No results message */}
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">No Matching Submissions</h2>
              <p className="text-gray-600 mb-6">Try adjusting your filters or search terms.</p>
              <button
                onClick={() => {
                  setSelectedCourse('all');
                  setSelectedAssignment('all');
                  setSelectedStudent('all');
                  setSelectedStudentName('');
                  setSelectedSection('all');
                  setFilter('all');
                  setSearchTerm('');
                }}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </InstructorRoute>
    );
  }

  return (
    <InstructorRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  // If we came from a specific course and student, go back to that course's Students tab
                  const courseParam = searchParams.get('course');
                  const studentParam = searchParams.get('student');
                  
                  if (courseParam && courseParam.startsWith('course_') && studentParam) {
                    // Navigate back to the course page with Students tab active
                    router.push(`/instructor/courses/${courseParam}?tab=students`);
                  } else {
                    // Default back behavior
                    router.back();
                  }
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {selectedStudent !== 'all' ? `${selectedStudentName}'s Videos` : 'Bulk Grading'}
                </h1>
                <p className="text-sm text-gray-600">
                  Showing {filteredSubmissions.length} of {allSubmissions.length} submissions
                  {selectedStudent !== 'all' && ` for ${selectedStudentName}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                    className="px-3 py-1 bg-gray-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    {currentIndex + 1} of {filteredSubmissions.length}
                  </span>
                  <button
                    onClick={goToNext}
                    disabled={currentIndex === filteredSubmissions.length - 1}
                    className="px-3 py-1 bg-gray-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
                
                {/* Scroll Navigation Hint */}
                <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  <span>💡</span>
                  <span>Scroll ↑ next, ↓ previous</span>
                </div>
              </div>
              
              {/* Playback Speed */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Speed:</span>
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-2 py-1 rounded text-xs ${
                      playbackSpeed === speed
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Courses ({allSubmissions.length})</option>
                  {courses.map(course => (
                    <option key={course} value={course}>
                      {course} ({allSubmissions.filter(s => `${s.courseCode} - ${s.courseName}` === course).length})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignment</label>
                <select
                  value={selectedAssignment}
                  onChange={(e) => setSelectedAssignment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Assignments</option>
                  {assignments.map(assignment => (
                    <option key={assignment.assignmentId} value={assignment.assignmentId}>
                      {assignment.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => {
                    setSelectedStudent(e.target.value);
                    const student = students.find(s => s.studentId === e.target.value);
                    setSelectedStudentName(student?.studentName || '');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Students</option>
                  {students.map(student => (
                    <option key={student.studentId} value={student.studentId}>
                      {student.studentName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Sections ({allSubmissions.length})</option>
                  {uniqueSections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.name} ({allSubmissions.filter(s => s.sectionId === section.id).length})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All ({allSubmissions.length})</option>
                  <option value="ungraded">Ungraded ({allSubmissions.filter(s => s.status === 'submitted').length})</option>
                  <option value="graded">Graded ({allSubmissions.filter(s => s.status === 'graded').length})</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Student or assignment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="section">Section + Name</option>
                  <option value="name">Student Name</option>
                  <option value="date">Submission Date</option>
                  <option value="assignment">Assignment</option>
                  <option value="course">Course</option>
                  <option value="grade">Grade</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Continuous Feed */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {filteredSubmissions.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-6xl mb-4">📹</div>
                <div className="text-xl font-semibold text-gray-700 mb-2">No Video Submissions</div>
                <div className="text-gray-500">
                  No submissions found across all assignments.
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="mb-6">
                <div className="text-sm text-gray-600 mb-2">
                  Showing {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''} across all assignments
                </div>
                <div className="text-xs text-gray-500">
                  💡 Scroll through all submissions in one continuous feed • Auto-save enabled
                </div>
              </div>

              {/* Continuous Feed of All Submissions */}
              <div className="space-y-8">
                {filteredSubmissions.map((submission, index) => (
                  <div key={submission.submissionId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Student Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {submission.studentName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{submission.studentName}</h3>
                            <p className="text-sm text-gray-600">{submission.studentEmail}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            #{index + 1} of {filteredSubmissions.length}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            submission.status === 'graded' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {submission.status === 'graded' ? 'Graded' : 'Submitted'}
                          </span>
                          
                          {submission.submittedAt && (
                            <span className="text-xs text-gray-500">
                              {new Date(submission.submittedAt).toLocaleDateString()}
                            </span>
                          )}
                          
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {submission.assignmentTitle}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Video Player */}
                    <div className="p-6">
                      <div className="mb-6">
                        <video
                          src={submission.videoUrl}
                          className="w-full h-96 object-contain"
                          controls
                          preload="metadata"
                        />
                      </div>

                      {/* Grading Form */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Grading */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Grade (out of 100)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={grades[submission.submissionId] || ''}
                              onChange={(e) => handleGradeChange(submission.submissionId, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter grade"
                            />
                            {savingGrades.has(submission.submissionId) && (
                              <p className="text-xs text-blue-600 mt-1">Auto-saving...</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Feedback
                            </label>
                            <textarea
                              rows={4}
                              value={feedback[submission.submissionId] || ''}
                              onChange={(e) => handleFeedbackChange(submission.submissionId, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter feedback for the student..."
                            />
                          </div>
                          
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleDeleteSubmission(submission.submissionId)}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        
                        {/* Right Column - Submission Details */}
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Submission Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Submitted:</span>
                                <span className="font-medium">
                                  {submission.submittedAt 
                                    ? new Date(submission.submittedAt).toLocaleString()
                                    : 'Not submitted'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className="font-medium capitalize">{submission.status}</span>
                              </div>
                              {submission.grade !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Current Grade:</span>
                                  <span className="font-medium">{submission.grade}/100</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {submission.feedback && (
                            <div className="bg-blue-50 rounded-lg p-4">
                              <h4 className="font-medium text-blue-900 mb-2">Previous Feedback</h4>
                              <p className="text-sm text-blue-800">{submission.feedback}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </InstructorRoute>
  );
};

const NewBulkGradingPage: React.FC = () => {
  return (
    <Suspense fallback={
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <LoadingSpinner />
        </div>
      </InstructorRoute>
    }>
      <BulkGradingContent />
    </Suspense>
  );
};

export default NewBulkGradingPage;