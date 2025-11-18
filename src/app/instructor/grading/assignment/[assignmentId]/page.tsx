'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  videoUrl: string;
  thumbnailUrl?: string;
  submittedAt: string;
  duration: number;
  fileSize: number;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
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
type SortType = 'name' | 'date' | 'grade' | 'section';

const NewAssignmentGradingPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const assignmentId = params.assignmentId as string;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
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
  const [selectedSection, setSelectedSection] = useState<string>('all');
  
  // Grading state
  const [currentGrade, setCurrentGrade] = useState<number | ''>('');
  const [currentFeedback, setCurrentFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  
  // Peer response state
  const [peerResponsesData, setPeerResponsesData] = useState<{[studentId: string]: PeerResponse[]}>({});
  const [collapsedPeerResponses, setCollapsedPeerResponses] = useState<Set<string>>(new Set());
  const [peerResponsesLoading, setPeerResponsesLoading] = useState(false);

  // Fetch assignment and submissions
  useEffect(() => {
    const fetchData = async () => {
      if (!assignmentId || !user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('🎯 NEW GRADING PAGE: Fetching assignment data for:', assignmentId);
        
        // Fetch assignment details
        const assignmentResponse = await fetch(`/api/assignments/${assignmentId}`, {
          credentials: 'include',
        });
        
        console.log('🎯 NEW GRADING PAGE: Assignment API response status:', assignmentResponse.status);
        
        if (!assignmentResponse.ok) {
          const errorText = await assignmentResponse.text();
          console.log('🎯 NEW GRADING PAGE: Assignment API error:', errorText);
          throw new Error(`Failed to fetch assignment details: ${assignmentResponse.status}`);
        }
        
        const assignmentData = await assignmentResponse.json();
        console.log('🎯 NEW GRADING PAGE: Assignment API response data:', assignmentData);
        console.log('🎯 NEW GRADING PAGE: Assignment API success:', assignmentData.success);
        console.log('🎯 NEW GRADING PAGE: Assignment API assignment:', assignmentData.assignment);
        console.log('🎯 NEW GRADING PAGE: Assignment API data keys:', Object.keys(assignmentData));
        
        // Try different response structures
        let assignmentInfo = null;
        if (assignmentData.success && assignmentData.assignment) {
          assignmentInfo = assignmentData.assignment;
        } else if (assignmentData.data) {
          assignmentInfo = assignmentData.data;
        } else if (assignmentData.assignmentId || assignmentData.title) {
          assignmentInfo = assignmentData;
        }
        
        if (assignmentInfo) {
          console.log('🎯 NEW GRADING PAGE: Using assignment info:', assignmentInfo);
          setAssignment({
            assignmentId: assignmentInfo.assignmentId || assignmentId,
            title: assignmentInfo.title || 'Assignment',
            description: assignmentInfo.description || '',
            dueDate: assignmentInfo.dueDate || '',
            maxScore: assignmentInfo.maxScore || 100,
            courseId: assignmentInfo.courseId || '',
            courseName: assignmentInfo.courseName || 'Unknown Course',
            courseCode: assignmentInfo.courseCode || 'N/A',
            enablePeerResponses: assignmentInfo.enablePeerResponses || false,
            responseDueDate: assignmentInfo.responseDueDate,
            minResponsesRequired: assignmentInfo.minResponsesRequired || 2,
            maxResponsesPerVideo: assignmentInfo.maxResponsesPerVideo || 3,
            responseWordLimit: assignmentInfo.responseWordLimit,
            responseCharacterLimit: assignmentInfo.responseCharacterLimit
          });
        } else {
          console.log('🎯 NEW GRADING PAGE: Assignment API failed, will try to get data from submissions');
        }
        
        // Fetch submissions SPECIFICALLY for this assignment
        const submissionsResponse = await fetch(`/api/instructor/video-submissions?assignmentId=${assignmentId}`, {
          credentials: 'include',
        });
        
        if (!submissionsResponse.ok) {
          throw new Error('Failed to fetch submissions');
        }
        
        const submissionsData = await submissionsResponse.json();
        console.log('🎯 NEW GRADING PAGE: Assignment submissions response:', submissionsData);
        
        if (submissionsData.success && submissionsData.submissions) {
          const transformedSubmissions: VideoSubmission[] = submissionsData.submissions
            // CRITICAL: Filter by assignmentId to ensure we only get submissions for THIS assignment
            .filter((sub: any) => sub.assignmentId === assignmentId)
            .map((sub: any) => ({
              submissionId: sub.submissionId || sub.id,
              studentId: sub.studentId,
              studentName: sub.student?.name || 'Unknown Student',
              studentEmail: sub.student?.email || '',
              videoUrl: sub.videoUrl,
              thumbnailUrl: sub.thumbnailUrl,
              submittedAt: sub.submittedAt || sub.createdAt,
              duration: sub.duration || 0,
              fileSize: sub.fileSize || 0,
              grade: sub.grade,
              feedback: sub.instructorFeedback || sub.feedback,
              status: sub.grade !== null && sub.grade !== undefined ? 'graded' : 'submitted',
              sectionId: sub.student?.sectionId || null,
              sectionName: sub.student?.sectionName || null
            }));
          
          console.log('🎯 NEW GRADING PAGE: Filtered submissions for assignment:', transformedSubmissions.length);
          setAllSubmissions(transformedSubmissions);
          
          // If assignment data wasn't fetched successfully, try to extract it from submissions
          if (!assignmentInfo && transformedSubmissions.length > 0) {
            const firstSubmission = submissionsData.submissions.find((sub: any) => sub.assignmentId === assignmentId);
            if (firstSubmission?.assignment) {
              console.log('🎯 NEW GRADING PAGE: Using assignment data from submissions');
              setAssignment({
                assignmentId: assignmentId,
                title: firstSubmission.assignment.title || 'Assignment',
                description: firstSubmission.assignment.description || '',
                dueDate: firstSubmission.assignment.dueDate || '',
                maxScore: firstSubmission.assignment.maxScore || 100,
                courseId: firstSubmission.assignment.courseId || '',
                courseName: firstSubmission.assignment.courseName || 'Unknown Course',
                courseCode: firstSubmission.assignment.courseCode || 'N/A'
              });
            }
          }
          
          // Load first submission's grade and feedback if available
          if (transformedSubmissions.length > 0) {
            const firstSubmission = transformedSubmissions[0];
            setCurrentGrade(firstSubmission.grade || '');
            setCurrentFeedback(firstSubmission.feedback || '');
          }
        } else {
          console.log('🎯 NEW GRADING PAGE: No submissions found for assignment');
          setAllSubmissions([]);
        }
        
        // Final fallback: if we still don't have assignment data but we have submissions, create a minimal assignment
        setTimeout(() => {
          if (!assignment && allSubmissions.length > 0) {
            console.log('🎯 NEW GRADING PAGE: Creating minimal assignment data as final fallback');
            setAssignment({
              assignmentId: assignmentId,
              title: 'Assignment',
              description: '',
              dueDate: '',
              maxScore: 100,
              courseId: '',
              courseName: 'Course',
              courseCode: 'N/A'
            });
          }
        }, 100);
        
      } catch (err) {
        console.error('NEW GRADING PAGE: Error fetching assignment grading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assignment data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [assignmentId, user?.id]);

  // Filter and sort submissions
  useEffect(() => {
    let filtered = [...allSubmissions];
    
    // Apply filter
    if (filter === 'graded') {
      filtered = filtered.filter(sub => sub.status === 'graded');
    } else if (filter === 'ungraded') {
      filtered = filtered.filter(sub => sub.status === 'submitted');
    }
    
    // Apply section filter
    if (selectedSection !== 'all') {
      filtered = filtered.filter(sub => sub.sectionId === selectedSection);
    }
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.sectionName && sub.sectionName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          // Sort by last name, then first name
          const getLastName = (fullName: string) => {
            const parts = fullName.trim().split(' ');
            return parts.length > 1 ? parts[parts.length - 1] : fullName;
          };
          const lastNameCompare = getLastName(a.studentName).localeCompare(getLastName(b.studentName));
          if (lastNameCompare !== 0) return lastNameCompare;
          return a.studentName.localeCompare(b.studentName);
        case 'date':
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        case 'grade':
          if (a.grade === undefined && b.grade === undefined) return 0;
          if (a.grade === undefined) return 1;
          if (b.grade === undefined) return -1;
          return b.grade - a.grade;
        case 'section':
          // Sort by section first, then by last name within section
          const sectionA = a.sectionName || 'No Section';
          const sectionB = b.sectionName || 'No Section';
          const sectionCompare = sectionA.localeCompare(sectionB);
          if (sectionCompare !== 0) return sectionCompare;
          const getLastNameForSection = (fullName: string) => {
            const parts = fullName.trim().split(' ');
            return parts.length > 1 ? parts[parts.length - 1] : fullName;
          };
          const lastNameCompareSection = getLastNameForSection(a.studentName).localeCompare(getLastNameForSection(b.studentName));
          if (lastNameCompareSection !== 0) return lastNameCompareSection;
          return a.studentName.localeCompare(b.studentName);
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
  }, [allSubmissions, filter, searchTerm, sortBy, selectedSection, currentIndex]);

  // Fetch peer responses for all students
  useEffect(() => {
    const fetchPeerResponses = async () => {
      if (allSubmissions.length === 0) return;
      
      console.log('🔍 PEER RESPONSES: Checking if should fetch peer responses');
      console.log('🔍 PEER RESPONSES: Assignment:', assignment);
      console.log('🔍 PEER RESPONSES: enablePeerResponses:', assignment?.enablePeerResponses);
      console.log('🔍 PEER RESPONSES: All submissions count:', allSubmissions.length);
      
      // Always try to fetch peer responses - let the API handle filtering
      try {
        setPeerResponsesLoading(true);
        const responsesMap: {[studentId: string]: PeerResponse[]} = {};
        
        console.log('🔍 PEER RESPONSES: Fetching for assignment:', assignmentId);
        
        // Fetch peer responses for each student
        await Promise.all(allSubmissions.map(async (submission) => {
          try {
            console.log(`🔍 PEER RESPONSES: Fetching for student ${submission.studentId} (${submission.studentName})`);
            
            const response = await fetch(
              `/api/peer-responses?assignmentId=${assignmentId}&studentId=${submission.studentId}`,
              { credentials: 'include' }
            );
            
            console.log(`🔍 PEER RESPONSES: API response status for ${submission.studentName}:`, response.status);
            
            if (response.ok) {
              const data = await response.json();
              console.log(`🔍 PEER RESPONSES: API data for ${submission.studentName}:`, data);
              
              if (data.success && data.data) {
                // Enrich each response with the reviewed student's info
                const enrichedResponses = data.data.map((resp: any) => {
                  // Find the submission that this response is about
                  const reviewedSubmission = allSubmissions.find(sub => sub.submissionId === resp.videoId);
                  
                  return {
                    ...resp,
                    reviewedStudentName: reviewedSubmission?.studentName || 'Unknown Student',
                    reviewedStudentId: reviewedSubmission?.studentId || 'unknown',
                    videoTitle: reviewedSubmission?.videoUrl || 'Peer Video'
                  };
                });
                
                responsesMap[submission.studentId] = enrichedResponses;
                console.log(`✅ PEER RESPONSES: Found ${enrichedResponses.length} responses for ${submission.studentName}`);
              } else {
                responsesMap[submission.studentId] = [];
                console.log(`📝 PEER RESPONSES: No responses for ${submission.studentName}`);
              }
            } else {
              const errorText = await response.text();
              console.log(`❌ PEER RESPONSES: API error for ${submission.studentName}:`, errorText);
              responsesMap[submission.studentId] = [];
            }
          } catch (error) {
            console.error(`❌ PEER RESPONSES: Error fetching for student ${submission.studentId}:`, error);
            responsesMap[submission.studentId] = [];
          }
        }));
        
        console.log('🔍 PEER RESPONSES: Final responses map:', responsesMap);
        setPeerResponsesData(responsesMap);
      } catch (error) {
        console.error('❌ PEER RESPONSES: Error fetching peer responses:', error);
      } finally {
        setPeerResponsesLoading(false);
      }
    };
    
    fetchPeerResponses();
  }, [allSubmissions.length, assignmentId]);

  // Current submission
  const currentSubmission = filteredSubmissions[currentIndex];

  // Get unique sections for filtering
  const uniqueSections = Array.from(new Set(
    allSubmissions
      .filter(sub => sub.sectionId && sub.sectionName)
      .map(sub => ({ id: sub.sectionId!, name: sub.sectionName! }))
      .map(section => JSON.stringify(section))
  )).map(str => JSON.parse(str)).sort((a, b) => a.name.localeCompare(b.name));

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

  // Video controls
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
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

  if (allSubmissions.length === 0) {
    return (
      <InstructorRoute>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => router.back()}
                  className="text-gray-500 hover:text-gray-700 transition-colors mb-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-800">{assignment.title}</h1>
                <p className="text-gray-600">{assignment.courseName} ({assignment.courseCode})</p>
              </div>
            </div>
          </div>

          {/* No submissions message */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">No Submissions Yet</h2>
              <p className="text-gray-600 mb-6">Students haven't submitted any videos for this assignment yet.</p>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
              >
                Back to Course
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
                  onClick={() => router.back()}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">{assignment.title}</h1>
                  <p className="text-sm text-gray-600">{assignment.courseName} • {allSubmissions.length} total submissions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Filter:</label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as FilterType)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All ({allSubmissions.length})</option>
                    <option value="ungraded">Ungraded ({allSubmissions.filter(s => s.status === 'submitted').length})</option>
                    <option value="graded">Graded ({allSubmissions.filter(s => s.status === 'graded').length})</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Section:</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All Sections</option>
                    {uniqueSections.map(section => (
                      <option key={section.id} value={section.id}>
                        {section.name} ({allSubmissions.filter(s => s.sectionId === section.id).length})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Search:</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Student name, email, or section..."
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm w-56"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortType)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="section">Section + Name</option>
                    <option value="name">Name</option>
                    <option value="date">Submission Date</option>
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
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{assignment.title}</h1>
                <p className="text-sm text-gray-600">
                  {assignment.courseName} • Showing {filteredSubmissions.length} of {allSubmissions.length} submissions
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation */}
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
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Filter:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterType)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All ({allSubmissions.length})</option>
                  <option value="ungraded">Ungraded ({allSubmissions.filter(s => s.status === 'submitted').length})</option>
                  <option value="graded">Graded ({allSubmissions.filter(s => s.status === 'graded').length})</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Section:</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Sections</option>
                  {uniqueSections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.name} ({allSubmissions.filter(s => s.sectionId === section.id).length})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Search:</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Student name, email, or section..."
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm w-56"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="section">Section + Name</option>
                  <option value="name">Name</option>
                  <option value="date">Submission Date</option>
                  <option value="grade">Grade</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">{currentSubmission.studentName}</h2>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span>Submitted: {new Date(currentSubmission.submittedAt).toLocaleDateString()}</span>
                        {currentSubmission.sectionName && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {currentSubmission.sectionName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      Student {currentIndex + 1} of {filteredSubmissions.length}
                    </div>
                  </div>
                  {assignment?.enablePeerResponses && (
                    <div className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded">
                      Peer Responses: {assignment.minResponsesRequired || 2} required, max {assignment.maxResponsesPerVideo || 3} per video
                      {assignment.responseDueDate && (
                        <> • Due: {new Date(assignment.responseDueDate).toLocaleDateString()}</>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="bg-black rounded-lg overflow-hidden mb-4">
                  <video
                    ref={videoRef}
                    src={currentSubmission.videoUrl}
                    className="w-full h-96 object-contain"
                    controls
                    preload="none"
                    muted
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
                {console.log('🔍 RENDERING: Current submission:', currentSubmission.studentId, currentSubmission.studentName)}
                {console.log('🔍 RENDERING: Peer responses for student:', getPeerResponsesForStudent(currentSubmission.studentId))}
                {console.log('🔍 RENDERING: Assignment enablePeerResponses:', assignment?.enablePeerResponses)}
                
                {/* Always show peer responses section if there are any responses, regardless of enablePeerResponses setting */}
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
                    // Show different messages based on loading state and whether responses exist
                    peerResponsesLoading ? (
                      // Still loading peer responses
                      <div className="border border-blue-200 rounded-lg overflow-hidden mt-4 bg-blue-50">
                        <div className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-blue-800 mb-1">
                                💬 Loading Peer Responses...
                              </h3>
                              <p className="text-xs text-blue-700">
                                Checking for peer response data for this student.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // No peer responses found
                      <div className="border border-gray-200 rounded-lg overflow-hidden mt-4 bg-gray-50">
                        <div className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                                📝 No Peer Responses
                              </h3>
                              <p className="text-xs text-gray-700">
                                This student has not submitted any peer responses for this assignment.
                                {assignment?.enablePeerResponses && assignment?.minResponsesRequired && (
                                  <> Required: {assignment.minResponsesRequired} response{assignment.minResponsesRequired > 1 ? 's' : ''}</>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )
                }
              </div>
            </div>

            {/* Grading Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Grade Submission</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade (0-{assignment.maxScore})
                    </label>
                    <input
                      type="number"
                      value={currentGrade}
                      onChange={(e) => setCurrentGrade(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max={assignment.maxScore}
                      placeholder={`Enter grade (max: ${assignment.maxScore})`}
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
                  
                  <button
                    onClick={saveGrade}
                    disabled={isSaving || !currentGrade}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Grade'}
                  </button>
                  
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

export default NewAssignmentGradingPage;