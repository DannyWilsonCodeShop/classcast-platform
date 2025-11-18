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
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<VideoSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<VideoSubmission[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  
  // Filter and search state
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('section');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedStudentName, setSelectedStudentName] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  
  // Grading state
  const [currentGrade, setCurrentGrade] = useState<number | ''>('');
  const [currentFeedback, setCurrentFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Peer response state
  const [peerResponsesData, setPeerResponsesData] = useState<{[studentId: string]: PeerResponse[]}>({});
  const [collapsedPeerResponses, setCollapsedPeerResponses] = useState<Set<string>>(new Set());
  const [peerResponsesLoading, setPeerResponsesLoading] = useState(false);

  // Scroll navigation state
  const [lastScrollTime, setLastScrollTime] = useState(0);
  const scrollCooldown = 500; // 500ms cooldown between scroll navigations

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
    
    // Reset current index if it's out of bounds
    if (currentIndex >= filtered.length) {
      setCurrentIndex(0);
    }
    
    // Update current grade and feedback for the new current submission
    if (filtered.length > 0) {
      const currentSubmission = filtered[Math.min(currentIndex, filtered.length - 1)];
      setCurrentGrade(currentSubmission.grade || '');
      setCurrentFeedback(currentSubmission.feedback || '');
    }
  }, [allSubmissions, selectedCourse, selectedAssignment, selectedStudent, selectedSection, filter, searchTerm, sortBy, currentIndex]);

  // Fetch peer responses for current assignment
  useEffect(() => {
    const fetchPeerResponses = async () => {
      if (filteredSubmissions.length === 0) return;
      
      try {
        setPeerResponsesLoading(true);
        const responsesMap: {[studentId: string]: PeerResponse[]} = {};
        
        // Get unique assignment IDs from filtered submissions
        const assignmentIds = Array.from(new Set(filteredSubmissions.map(sub => sub.assignmentId)));
        
        // Fetch peer responses for each student in each assignment
        await Promise.all(filteredSubmissions.map(async (submission) => {
          try {
            const response = await fetch(
              `/api/peer-responses?assignmentId=${submission.assignmentId}&studentId=${submission.studentId}`,
              { credentials: 'include' }
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data) {
                // Enrich each response with the reviewed student's info
                const enrichedResponses = data.data.map((resp: any) => {
                  // Find the submission that this response is about
                  const reviewedSubmission = filteredSubmissions.find(sub => sub.submissionId === resp.videoId);
                  
                  return {
                    ...resp,
                    reviewedStudentName: reviewedSubmission?.studentName || 'Unknown Student',
                    reviewedStudentId: reviewedSubmission?.studentId || 'unknown',
                    videoTitle: reviewedSubmission?.videoUrl || 'Peer Video'
                  };
                });
                
                responsesMap[submission.studentId] = enrichedResponses;
              } else {
                responsesMap[submission.studentId] = [];
              }
            } else {
              responsesMap[submission.studentId] = [];
            }
          } catch (error) {
            console.error(`Error fetching peer responses for student ${submission.studentId}:`, error);
            responsesMap[submission.studentId] = [];
          }
        }));
        
        setPeerResponsesData(responsesMap);
      } catch (error) {
        console.error('Error fetching peer responses:', error);
      } finally {
        setPeerResponsesLoading(false);
      }
    };
    
    fetchPeerResponses();
  }, [filteredSubmissions.length]);

  // Current submission
  const currentSubmission = filteredSubmissions[currentIndex];

  // Helper functions for peer responses
  const getPeerResponsesForStudent = (studentId: string): PeerResponse[] => {
    return peerResponsesData[studentId] || [];
  };

  const togglePeerResponsesCollapse = (submissionId: string) => {
    setCollapsedPeerResponses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  // Navigation functions
  const goToNext = () => {
    if (currentIndex < filteredSubmissions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      const nextSubmission = filteredSubmissions[nextIndex];
      setCurrentGrade(nextSubmission.grade || '');
      setCurrentFeedback(nextSubmission.feedback || '');
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      const prevSubmission = filteredSubmissions[prevIndex];
      setCurrentGrade(prevSubmission.grade || '');
      setCurrentFeedback(prevSubmission.feedback || '');
    }
  };

  const goToSubmission = (index: number) => {
    setCurrentIndex(index);
    const submission = filteredSubmissions[index];
    setCurrentGrade(submission.grade || '');
    setCurrentFeedback(submission.feedback || '');
  };

  // Save grade function
  const saveGrade = async () => {
    if (!currentSubmission || !currentGrade) {
      alert('Please enter a grade before saving.');
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      const response = await fetch(`/api/submissions/${currentSubmission.submissionId}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          grade: Number(currentGrade),
          feedback: currentFeedback || '',
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
          sub.submissionId === currentSubmission.submissionId
            ? { ...sub, grade: Number(currentGrade), feedback: currentFeedback, status: 'graded' as const }
            : sub
        ));
        
        setSaveStatus('saved');
      } else {
        throw new Error(data.error || 'Failed to save grade');
      }
    } catch (error) {
      console.error('Error saving grade:', error);
      setSaveStatus('error');
      alert('Failed to save grade. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete submission function
  const deleteSubmission = async () => {
    if (!currentSubmission) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${currentSubmission.studentName}'s video submission? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/video-submissions/${currentSubmission.submissionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete submission');
      }

      const data = await response.json();
      if (data.success) {
        // Remove from local state
        setAllSubmissions(prev => prev.filter(sub => sub.submissionId !== currentSubmission.submissionId));
        
        // Navigate to next submission or previous if this was the last one
        if (currentIndex >= filteredSubmissions.length - 1 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        } else if (filteredSubmissions.length === 1) {
          // If this was the only submission, we'll handle this in the UI
          setCurrentIndex(0);
        }
        
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

  // Video controls
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Scroll navigation handler
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    
    // Check if we're in cooldown period
    if (now - lastScrollTime < scrollCooldown) {
      return;
    }
    
    // Only handle scroll if we're not scrolling within a scrollable element
    const target = e.target as HTMLElement;
    const isScrollableElement = target.closest('.overflow-y-auto, .overflow-auto, textarea, input');
    
    if (isScrollableElement) {
      return;
    }
    
    e.preventDefault();
    
    if (e.deltaY < 0) {
      // Scrolling up - go to next video
      if (currentIndex < filteredSubmissions.length - 1) {
        goToNext();
        setLastScrollTime(now);
      }
    } else if (e.deltaY > 0) {
      // Scrolling down - go to previous video
      if (currentIndex > 0) {
        goToPrevious();
        setLastScrollTime(now);
      }
    }
  };

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

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" onWheel={handleWheel}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">{currentSubmission.studentName}</h2>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{currentSubmission.assignmentTitle}</span>
                        <span>•</span>
                        <span>{currentSubmission.courseName}</span>
                        {currentSubmission.sectionName && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {currentSubmission.sectionName}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(currentSubmission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      Student {currentIndex + 1} of {filteredSubmissions.length}
                    </div>
                  </div>
                </div>
                
                <div className="bg-black rounded-lg overflow-hidden mb-4">
                  <video
                    ref={videoRef}
                    src={currentSubmission.videoUrl}
                    className="w-full h-96 object-contain"
                    controls
                    preload="none"
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        videoRef.current.playbackRate = playbackSpeed;
                      }
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                {/* Peer Responses Section */}
                {getPeerResponsesForStudent(currentSubmission.studentId).length > 0 ? (
                  <div className="border border-indigo-200 rounded-lg overflow-hidden mt-4">
                    {/* Collapsible Header */}
                    <button
                      onClick={() => togglePeerResponsesCollapse(currentSubmission.submissionId)}
                      className="w-full flex items-center justify-between p-4 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-indigo-700">
                          💬 Student's Peer Responses
                        </span>
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                          {getPeerResponsesForStudent(currentSubmission.studentId).length}
                        </span>
                      </div>
                      <svg
                        className={`w-5 h-5 text-indigo-600 transition-transform ${
                          collapsedPeerResponses.has(currentSubmission.submissionId) ? '' : 'rotate-180'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Collapsible Content */}
                    {!collapsedPeerResponses.has(currentSubmission.submissionId) && (
                      <div className="divide-y divide-indigo-100">
                        {getPeerResponsesForStudent(currentSubmission.studentId).map((response: PeerResponse, idx: number) => (
                          <div key={response.responseId || idx} className="p-4 bg-white">
                            {/* Response Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    Response to: {response.reviewedStudentName}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                                    response.isSubmitted 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {response.isSubmitted ? '✓ Submitted' : '○ Draft'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {new Date(response.submittedAt).toLocaleDateString()} • {response.wordCount} words
                                </p>
                              </div>
                            </div>

                            {/* Response Content */}
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {response.content}
                              </p>
                            </div>
                          </div>
                        ))}

                        {/* Summary Stats */}
                        <div className="bg-indigo-50 p-4">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-lg font-bold text-indigo-700">
                                {getPeerResponsesForStudent(currentSubmission.studentId).length}
                              </div>
                              <div className="text-xs text-gray-600">Total Responses</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-green-700">
                                {getPeerResponsesForStudent(currentSubmission.studentId).filter((r: PeerResponse) => r.isSubmitted).length}
                              </div>
                              <div className="text-xs text-gray-600">Submitted</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-blue-700">
                                {Math.round(
                                  getPeerResponsesForStudent(currentSubmission.studentId)
                                    .reduce((sum: number, r: PeerResponse) => sum + (r.wordCount || 0), 0) / 
                                  Math.max(1, getPeerResponsesForStudent(currentSubmission.studentId).length)
                                )}
                              </div>
                              <div className="text-xs text-gray-600">Avg Words</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden mt-4 bg-gray-50">
                    <div className="p-3">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-gray-600">
                          No peer responses found for this student
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Grading Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Grade Submission</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade (0-100)
                    </label>
                    <input
                      type="number"
                      value={currentGrade}
                      onChange={(e) => setCurrentGrade(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                      placeholder="Enter grade"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback
                    </label>
                    <textarea
                      value={currentFeedback}
                      onChange={(e) => setCurrentFeedback(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter feedback for the student..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={saveGrade}
                      disabled={isSaving || !currentGrade}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Saving...' : 'Save Grade'}
                    </button>
                    
                    <button
                      onClick={deleteSubmission}
                      disabled={isDeleting}
                      className="w-full px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? 'Deleting...' : '🗑️ Delete Submission'}
                    </button>
                  </div>
                  
                  {/* Save Status */}
                  <div className="flex items-center justify-center text-sm">
                    {saveStatus === 'saving' && (
                      <span className="text-blue-600">Saving...</span>
                    )}
                    {saveStatus === 'saved' && (
                      <span className="text-green-600">✓ Saved</span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="text-red-600">✗ Save failed</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Submission List */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtered Submissions</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredSubmissions.map((submission, index) => (
                    <button
                      key={submission.submissionId}
                      onClick={() => goToSubmission(index)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        index === currentIndex
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{submission.studentName}</p>
                          <p className="text-xs text-gray-500">
                            {submission.assignmentTitle}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {submission.status === 'graded' ? (
                            <span className="text-green-600 font-medium">{submission.grade}</span>
                          ) : (
                            <span className="text-gray-400 text-sm">Not graded</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
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