'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getVideoUrl } from '@/lib/videoUtils';
import { parseVideoUrl, getEmbedUrl } from '@/lib/urlUtils';
import { extractYouTubeVideoId, getYouTubeEmbedUrl, getYouTubeThumbnail } from '@/lib/youtube';
import { RubricGradingPanel } from '@/components/instructor/RubricGradingPanel';
import { PeerResponseIndicator } from '@/components/instructor/PeerResponseIndicator';
import { ProblemReferenceModal } from '@/components/instructor/ProblemReferenceModal';
import { HelpTooltip } from '@/components/common/HelpTooltip';
import { RubricCategory } from '@/types/rubric';
import { GradingResult } from '@/types/aiGrading';

const AIGradingWizard = dynamic(
  () => import('@/components/instructor/AIGradingWizard'),
  { ssr: false }
);

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
  studentAvatar?: string;
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
  maxScore?: number;
  rubricScores?: Record<string, number>;
  peerResponses?: any[];
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Remove playbackSpeed - not needed in continuous feed
  
  // Filter and search state
  const [filter, setFilter] = useState<FilterType>('ungraded');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('section');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedStudentName, setSelectedStudentName] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [fetchedSections, setFetchedSections] = useState<{id: string; name: string}[]>([]);
  
  // Grading state with auto-save
  const [grades, setGrades] = useState<Record<string, number | ''>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [savingGrades, setSavingGrades] = useState<Set<string>>(new Set());
  const [saveTimeouts, setSaveTimeouts] = useState<Record<string, NodeJS.Timeout>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [assignmentRubrics, setAssignmentRubrics] = useState<Record<string, RubricCategory[] | null>>({});
  const [assignmentDetails, setAssignmentDetails] = useState<Record<string, any>>({});
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [speedLock, setSpeedLock] = useState<boolean>(false);
  const [problemAssignments, setProblemAssignments] = useState<Record<string, any>>({});
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<any>(null);
  const [selectedProblemStudent, setSelectedProblemStudent] = useState<string>('');

  // Fetch problem assignment for a student when clip icon is clicked
  const handleShowProblem = async (submission: VideoSubmission) => {
    const cacheKey = `${submission.assignmentId}_${submission.studentId}`;
    if (problemAssignments[cacheKey] !== undefined) {
      setSelectedProblem(problemAssignments[cacheKey]);
      setSelectedProblemStudent(submission.studentName);
      setShowProblemModal(true);
      return;
    }
    try {
      const res = await fetch(`/api/problem-assignments?assignmentId=${submission.assignmentId}&studentId=${submission.studentId}`);
      const data = await res.json();
      const problem = data?.data?.problem || null;
      setProblemAssignments(prev => ({ ...prev, [cacheKey]: problem }));
      setSelectedProblem(problem);
      setSelectedProblemStudent(submission.studentName);
      setShowProblemModal(true);
    } catch (err) {
      console.error('Failed to fetch problem assignment:', err);
      setSelectedProblem(null);
      setSelectedProblemStudent(submission.studentName);
      setShowProblemModal(true);
    }
  };
  
  // Remove peer response state - not needed in continuous feed

  // Remove scroll navigation state - using continuous feed instead

  // Apply 2x speed lock to all video elements
  useEffect(() => {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.playbackRate = speedLock ? 2 : 1;
    });
    // Also set up a MutationObserver to catch newly added videos
    const observer = new MutationObserver(() => {
      const allVideos = document.querySelectorAll('video');
      allVideos.forEach(video => {
        video.playbackRate = speedLock ? 2 : 1;
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [speedLock]);

  // Get unique courses from the instructor's courses API (not from submissions)
  const [instructorCourses, setInstructorCourses] = useState<{id: string; label: string}[]>([]);
  
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/instructor/courses?instructorId=${user.id}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const coursesArray = data.data?.courses || [];
          const mapped = coursesArray.map((c: any) => ({
            id: c.id || c.courseId,
            label: c.title || c.courseName || c.code || 'Course',
          }));
          setInstructorCourses(mapped);
          // Auto-select the first (most recent) course if none selected
          if (mapped.length > 0 && selectedCourse === 'all') {
            setSelectedCourse(mapped[0].id);
          }
        }
      } catch (e) {
        console.warn('Could not fetch instructor courses:', e);
      }
    };
    fetchCourses();
  }, [user?.id]);
  
  // Get unique sections from submissions
  const uniqueSections = Array.from(new Set(
    allSubmissions
      .filter(sub => sub.sectionId && sub.sectionName)
      .map(sub => ({ id: sub.sectionId!, name: sub.sectionName! }))
      .map(section => JSON.stringify(section))
  )).map(str => JSON.parse(str)).sort((a, b) => a.name.localeCompare(b.name));
  
  // Get unique students from submissions (include sectionId for filtering)
  const students = Array.from(new Map(allSubmissions.map(sub => [sub.studentId, {
    studentId: sub.studentId,
    studentName: sub.studentName,
    sectionId: sub.sectionId || null,
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
          setFilter('all'); // Show all assignments when viewing a specific student
          if (studentNameParam) {
            setSelectedStudentName(decodeURIComponent(studentNameParam));
          }
        }
        
        // Fetch all submissions for instructor
        const submissionsResponse = await fetch(`/api/instructor/video-submissions?instructorId=${user?.id}`, {
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
            studentAvatar: sub.student?.avatar || '',
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
            courseId: sub.courseId || sub.assignment?.courseId || '',
            sectionId: sub.student?.sectionId || null,
            sectionName: sub.student?.sectionName || null,
            maxScore: sub.maxScore || sub.assignment?.maxScore || 100,
            rubricScores: sub.rubricScores || undefined,
            peerResponses: sub.peerResponses || []
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
          
          // Submissions loaded successfully
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

    // Fetch sections for the instructor's courses
    const fetchSections = async () => {
      try {
        const instructorId = user?.id;
        if (!instructorId) return;
        // Determine which courseId to use — prefer selectedCourse, fall back to first course in submissions
        let courseId = selectedCourse !== 'all' ? selectedCourse : '';
        if (!courseId && allSubmissions.length > 0) {
          // Use the first submission's courseId as default
          courseId = allSubmissions[0]?.courseId || '';
        }
        if (!courseId) return; // Don't fetch if we have no courseId yet
        const res = await fetch(`/api/sections?courseId=${courseId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.sections) {
            const mapped = data.sections
              .filter((s: any) => s.sectionName)
              .map((s: any) => ({ id: s.sectionId, name: `Section ${s.sectionName}` }))
              .sort((a: any, b: any) => a.name.localeCompare(b.name));
            setFetchedSections(mapped);
          }
        }
      } catch (e) {
        console.warn('Could not fetch sections:', e);
      }
    };
    fetchSections();
  }, [user?.id, searchParams, selectedCourse, allSubmissions.length]);

  // Default fallback rubric — matches what students see on assignment detail page
  const DEFAULT_FALLBACK_RUBRIC: RubricCategory[] = [
    { id: '1', name: 'Mathematical Accuracy', levels: [
      { score: 4, description: 'All work is correct.' },
      { score: 3, description: 'One minor error.' },
      { score: 2, description: 'Multiple errors but demonstrates understanding.' },
      { score: 1, description: 'Little or no understanding shown.' },
    ]},
    { id: '2', name: 'Work Shown', levels: [
      { score: 4, description: 'All steps are shown and easy to follow.' },
      { score: 3, description: 'Most steps shown.' },
      { score: 2, description: 'Some steps missing.' },
      { score: 1, description: 'Little or no work shown.' },
    ]},
    { id: '3', name: 'Explanation', levels: [
      { score: 4, description: 'Reasoning is clear and complete.' },
      { score: 3, description: 'Mostly clear.' },
      { score: 2, description: 'Limited explanation.' },
      { score: 1, description: 'No meaningful explanation.' },
    ]},
    { id: '4', name: 'Organization', levels: [
      { score: 4, description: 'Neat and easy to read.' },
      { score: 3, description: 'Mostly organized.' },
      { score: 2, description: 'Somewhat difficult to follow.' },
      { score: 1, description: 'Disorganized.' },
    ]},
  ];

  // Fetch rubric data for each unique assignment in submissions
  const fetchedRubricIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const uniqueAssignmentIds = [...new Set(allSubmissions.map(s => s.assignmentId))];
    uniqueAssignmentIds.forEach(async (assignmentId) => {
      if (fetchedRubricIdsRef.current.has(assignmentId)) return;
      fetchedRubricIdsRef.current.add(assignmentId);

      try {
        const res = await fetch(`/api/assignments/${assignmentId}`);
        const data = await res.json();
        const assignment = data?.data?.assignment;
        const rubric = assignment?.rubric;
        setAssignmentRubrics(prev => ({
          ...prev,
          [assignmentId]: (rubric && Array.isArray(rubric) && rubric.length > 0) ? rubric : DEFAULT_FALLBACK_RUBRIC,
        }));
        // Store full assignment details for peer response info
        if (assignment) {
          setAssignmentDetails(prev => ({ ...prev, [assignmentId]: assignment }));
        }
      } catch {
        setAssignmentRubrics(prev => ({ ...prev, [assignmentId]: DEFAULT_FALLBACK_RUBRIC }));
      }
    });
  }, [allSubmissions]);

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
      if (selectedSection === 'none') {
        filtered = filtered.filter(sub => !sub.sectionId);
      } else {
        filtered = filtered.filter(sub => sub.sectionId === selectedSection);
      }
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
                <h1 className="text-2xl font-bold text-gray-800">Grading</h1>
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
        <div className="min-h-full overflow-y-auto pb-24 bg-white">
          {/* Collapsed course title */}
          <div className="px-4 py-3 border-b border-gray-100">
            <button
              onClick={() => setShowFilters(prev => !prev)}
              className="flex items-center gap-1.5"
            >
              <span className="text-sm font-bold text-[#005587]">
                {instructorCourses.find(c => c.id === selectedCourse)?.label || 'All Courses'}
              </span>
              <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showFilters && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs">
                  <option value="all">All Courses</option>
                  {instructorCourses.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs">
                  <option value="all">All</option>
                  <option value="ungraded">Ungraded</option>
                  <option value="graded">Graded</option>
                </select>
              </div>
            )}
          </div>

          <div className="text-center py-12">
            <div className="text-4xl mb-3">📝</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">No submissions to grade</h2>
            <p className="text-sm text-gray-500 mb-4">Try selecting a different course or clearing filters.</p>
            <button
              onClick={() => { setSelectedCourse('all'); setFilter('all'); setSelectedAssignment('all'); setSelectedStudent('all'); setSelectedSection('all'); setSearchTerm(''); }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </InstructorRoute>
    );
  }

  return (
    <InstructorRoute>
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        {/* Filters - collapsible on mobile */}
        <div className="px-4 py-2 shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(prev => !prev)}
              className="flex items-center gap-1.5 min-w-0 flex-1"
            >
              <span className="text-sm font-bold text-[#005587] truncate">
                {instructorCourses.find(c => c.id === selectedCourse)?.label || 'All Courses'}
              </span>
              <svg className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => setSpeedLock(prev => !prev)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                speedLock 
                  ? 'bg-[#FFC72C] text-[#005587] font-bold' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {speedLock ? '⚡2x' : '▶️1x'}
            </button>
          </div>
          {showFilters && (
          <div className="bg-gray-50 rounded-xl p-3 mt-2">
            <p className="text-[10px] text-gray-400 mb-2">{filteredSubmissions.length} of {allSubmissions.length} submissions</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                >
                  <option value="all">All Courses</option>
                  {instructorCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Assignment</label>
                <select
                  value={selectedAssignment}
                  onChange={(e) => setSelectedAssignment(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
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
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => {
                    setSelectedSection(e.target.value);
                    setSelectedStudent('all');
                    setSelectedStudentName('');
                  }}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                >
                  <option value="all">All Sections</option>
                  <option value="none">No Section</option>
                  {fetchedSections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Student</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => {
                    setSelectedStudent(e.target.value);
                    const student = students.find(s => s.studentId === e.target.value);
                    setSelectedStudentName(student?.studentName || '');
                  }}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                >
                  <option value="all">All Students</option>
                  {students
                    .filter(student => selectedSection === 'all' || student.sectionId === selectedSection)
                    .map(student => (
                    <option key={student.studentId} value={student.studentId}>
                      {student.studentName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Status</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterType)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                >
                  <option value="all">All</option>
                  <option value="ungraded">Ungraded</option>
                  <option value="graded">Graded</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Sort</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                >
                  <option value="section">Section</option>
                  <option value="name">Name</option>
                  <option value="date">Date</option>
                  <option value="assignment">Assignment</option>
                </select>
              </div>
              
              <div className="col-span-2">
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Student or assignment..."
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Main Content - Scrollable cards */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {filteredSubmissions.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">📹</div>
                <div className="text-xl font-semibold text-gray-700 mb-2">No Video Submissions</div>
                <div className="text-gray-500">No submissions found matching your filters.</div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-6xl mx-auto pb-8">
              {filteredSubmissions.slice(0, (currentIndex + 1) * 5).map((submission, index) => {
                const videoUrlInfo = parseVideoUrl(submission.videoUrl);
                const isYouTube = videoUrlInfo?.type === 'youtube';
                const isGoogleDrive = videoUrlInfo?.type === 'google-drive';
                const videoId = isYouTube ? extractYouTubeVideoId(submission.videoUrl) : null;
                const embedUrl = getEmbedUrl(submission.videoUrl);

                return (
                  <div key={submission.submissionId} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    {/* Student Header */}
                    <div className="px-4 py-3 flex items-center justify-between bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-[#005587] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                          {(() => {
                            const avatar = submission.studentAvatar;
                            if (avatar && avatar.startsWith('http')) {
                              return <img src={avatar} alt="" className="w-full h-full object-cover" />;
                            }
                            if (avatar && avatar.length <= 4 && !avatar.startsWith('http')) {
                              return <span className="text-lg">{avatar}</span>;
                            }
                            const s = submission.studentName || '?';
                            return [...s][0]?.toUpperCase() || '?';
                          })()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{submission.studentName}</p>
                          <p className="text-xs text-gray-500">{submission.assignmentTitle} {submission.sectionName && `• ${submission.sectionName}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {assignmentDetails[submission.assignmentId]?.problemBankId && (
                          <button
                            onClick={() => handleShowProblem(submission)}
                            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-[#005587]/10 hover:text-[#005587] transition-colors"
                            title="View this student's individually assigned problem"
                          >
                            📎
                          </button>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${submission.status === 'graded' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                          {submission.status === 'graded' ? '✓ Graded' : 'Pending'}
                        </span>
                        <span className="text-xs text-gray-400">#{index + 1}</span>
                      </div>
                    </div>

                    {/* Content: Video left, Grading right */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 p-4">
                      {/* Video */}
                      <div>
                        <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: '280px' }}>
                          {isYouTube && videoId && embedUrl ? (
                            <iframe src={embedUrl} className="w-full h-full" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={`${submission.studentName}'s video`} />
                          ) : isGoogleDrive && embedUrl ? (
                            <iframe src={embedUrl} className="w-full h-full" allow="autoplay" allowFullScreen title={`${submission.studentName}'s video`} />
                          ) : (
                            <video key={submission.submissionId} src={getVideoUrl(submission.videoUrl)} className="w-full h-full object-contain" controls playsInline preload="none" crossOrigin="anonymous" />
                          )}
                        </div>
                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-3">
                          <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
                          {submission.courseCode && submission.courseCode !== 'N/A' && <span>{submission.courseCode}</span>}
                          {submission.grade && <span className="text-green-700 font-medium">{submission.grade}/{submission.maxScore}</span>}
                        </div>
                        <div className="mt-1">
                          <PeerResponseIndicator
                            enablePeerResponses={assignmentDetails[submission.assignmentId]?.enablePeerResponses || false}
                            minResponsesRequired={assignmentDetails[submission.assignmentId]?.minResponsesRequired || 0}
                            completedCount={submission.peerResponses?.length || 0}
                          />
                        </div>
                      </div>

                      {/* Grading + Peer Responses */}
                      <div className="space-y-3">
                        {/* Grade & Feedback */}
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100" data-grading-card>
                          <h4 className="text-xs font-semibold text-gray-700 mb-2">Grade & Feedback</h4>
                          
                          {assignmentRubrics[submission.assignmentId] ? (
                            <RubricGradingPanel
                              rubric={assignmentRubrics[submission.assignmentId]!}
                              submissionId={submission.submissionId}
                              initialScores={submission.rubricScores}
                              onScoresChange={(scores, total) => {
                                setGrades(prev => ({ ...prev, [submission.submissionId]: total }));
                              }}
                            />
                          ) : (
                            <div className="flex items-center gap-2 mb-2">
                              <input
                                type="number"
                                min="0"
                                max={submission.maxScore || 100}
                                value={grades[submission.submissionId] ?? submission.grade ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : Number(e.target.value);
                                  setGrades(prev => ({ ...prev, [submission.submissionId]: val }));
                                }}
                                className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm font-medium text-center"
                                placeholder="0"
                              />
                              <span className="text-xs text-gray-500">/ {submission.maxScore || 100}</span>
                              {savingGrades.has(submission.submissionId) && <span className="text-xs text-blue-600 animate-pulse">Saving...</span>}
                            </div>
                          )}
                          
                          <textarea
                            data-feedback-input
                            value={feedback[submission.submissionId] ?? submission.feedback ?? ''}
                            onChange={(e) => setFeedback(prev => ({ ...prev, [submission.submissionId]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveGrade(submission.submissionId);
                                // Advance to next student's first rubric input
                                const allCards = document.querySelectorAll('[data-grading-card]');
                                const currentCard = (e.target as Element).closest('[data-grading-card]');
                                const currentIdx = Array.from(allCards).indexOf(currentCard as Element);
                                const nextCard = allCards[currentIdx + 1] as HTMLElement;
                                if (nextCard) {
                                  const firstInput = nextCard.querySelector('[data-rubric-input]') as HTMLElement;
                                  if (firstInput) {
                                    setTimeout(() => firstInput.focus(), 100);
                                  }
                                }
                              }
                            }}
                            placeholder="Feedback..."
                            rows={2}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm resize-none mt-2"
                          />
                          <button
                            onClick={() => handleSaveGrade(submission.submissionId)}
                            disabled={savingGrades.has(submission.submissionId)}
                            className="mt-2 px-3 py-1.5 bg-[#005587] text-white text-xs font-medium rounded hover:bg-[#004470] disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>

                        {/* Peer Responses */}
                        {submission.peerResponses && submission.peerResponses.length > 0 && (
                          <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                            <h4 className="text-xs font-semibold text-purple-800 mb-2">Peer Responses ({submission.peerResponses.length})</h4>
                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                              {submission.peerResponses.map((peer: any, i: number) => (
                                <div key={i} className="text-xs bg-white p-2 rounded border border-purple-50">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-gray-700">{peer.studentName || peer.reviewerName || 'Peer'}</span>
                                    {peer.submittedAt && (
                                      <span className="text-gray-400 text-[10px]">{new Date(peer.submittedAt).toLocaleDateString()}</span>
                                    )}
                                  </div>
                                  <p className="text-gray-600 leading-relaxed">{peer.response || peer.content || peer.comment || '—'}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Load More Button */}
              {(currentIndex + 1) * 5 < filteredSubmissions.length && (
                <div className="text-center py-4">
                  <button
                    onClick={() => setCurrentIndex(prev => prev + 1)}
                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-50 shadow-sm"
                  >
                    Load More ({filteredSubmissions.length - (currentIndex + 1) * 5} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Grading Wizard */}
        {showAIWizard && (
          <AIGradingWizard
            isOpen={showAIWizard}
            onClose={() => setShowAIWizard(false)}
            assignmentId={selectedAssignment !== 'all' ? selectedAssignment : (assignments[0]?.assignmentId || '')}
            assignmentTitle={selectedAssignment !== 'all'
              ? (assignments.find(a => a.assignmentId === selectedAssignment)?.title || 'Assignment')
              : (assignments[0]?.title || 'Assignment')
            }
            rubric={(() => {
              const targetId = selectedAssignment !== 'all' ? selectedAssignment : (assignments[0]?.assignmentId || '');
              return assignmentRubrics[targetId] || [];
            })()}
            ungradedCount={filteredSubmissions.filter(s => s.status === 'submitted').length}
            onGradingComplete={async () => {
              setShowAIWizard(false);
              // Re-fetch all submissions to reflect new grades
              if (user?.id) {
                try {
                  const submissionsResponse = await fetch(`/api/instructor/video-submissions?instructorId=${user.id}`, {
                    credentials: 'include',
                  });
                  if (submissionsResponse.ok) {
                    const submissionsData = await submissionsResponse.json();
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
                        courseId: sub.courseId || sub.assignment?.courseId || '',
                        sectionId: sub.student?.sectionId || null,
                        sectionName: sub.student?.sectionName || null,
                        maxScore: sub.maxScore,
                        rubricScores: sub.rubricScores,
                        peerResponses: sub.peerResponses,
                      }));
                      setAllSubmissions(transformedSubmissions);
                      // Re-initialize grades and feedback
                      const initialGrades: Record<string, number | ''> = {};
                      const initialFeedback: Record<string, string> = {};
                      transformedSubmissions.forEach(sub => {
                        initialGrades[sub.submissionId] = sub.grade || '';
                        initialFeedback[sub.submissionId] = sub.feedback || '';
                      });
                      setGrades(initialGrades);
                      setFeedback(initialFeedback);
                    }
                  }
                } catch (err) {
                  console.error('Error refreshing submissions after AI grading:', err);
                }
              }
            }}
          />
        )}
      </div>

      {/* Problem Reference Modal */}
      <ProblemReferenceModal
        isOpen={showProblemModal}
        onClose={() => setShowProblemModal(false)}
        problem={selectedProblem}
        studentName={selectedProblemStudent}
      />
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