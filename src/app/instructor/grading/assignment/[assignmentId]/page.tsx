'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getVideoUrl } from '@/lib/videoUtils';
import { getYouTubeEmbedUrl, isValidYouTubeUrl, getYouTubeThumbnail } from '@/lib/youtube';
import { getGoogleDrivePreviewUrl, isValidGoogleDriveUrl, getGoogleDriveThumbnailUrl } from '@/lib/googleDrive';
import { useSmartVideoLoading } from '@/hooks/useSmartVideoLoading';
import { LazyVideoPlayer } from '@/components/instructor/LazyVideoPlayer';
import { VirtualizedGradingFeed } from '@/components/instructor/VirtualizedGradingFeed';

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
  
  const assignmentId = params.assignmentId as string;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<VideoSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<VideoSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and search state
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('section');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  
  // Peer response state
  const [peerResponsesData, setPeerResponsesData] = useState<{[studentId: string]: PeerResponse[]}>({});
  const [collapsedPeerResponses, setCollapsedPeerResponses] = useState<Set<string>>(new Set());
  const [peerResponsesLoading, setPeerResponsesLoading] = useState(false);

  // Grading state with auto-save
  const [grades, setGrades] = useState<Record<string, number | ''>>({});
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>({});
  const [savingGrades, setSavingGrades] = useState<Set<string>>(new Set());
  const [saveTimeouts, setSaveTimeouts] = useState<Record<string, NodeJS.Timeout>>({});

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
            maxScore: assignmentInfo.maxScore || assignmentInfo.points || 100,
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
          
          // Initialize grades and feedback state for all submissions
          const initialGrades: Record<string, number | ''> = {};
          const initialFeedback: Record<string, string> = {};
          transformedSubmissions.forEach(sub => {
            initialGrades[sub.submissionId] = sub.grade || '';
            initialFeedback[sub.submissionId] = sub.feedback || '';
          });
          setGrades(initialGrades);
          setFeedbackState(initialFeedback);
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

  // Smart video loading with optimized ordering
  const {
    orderedSubmissions,
    getLoadingStrategy,
    markVideoLoaded,
    isVideoLoaded
  } = useSmartVideoLoading(allSubmissions, {
    prioritizeUngraded: true,
    varietyFactor: 0.3, // 30% randomness for variety
    cacheAwareness: true
  });

  // Filter and sort submissions (now using smart-ordered submissions)
  useEffect(() => {
    let filtered = [...orderedSubmissions];
    
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
    
    // Apply additional sort if needed (smart ordering is primary)
    if (sortBy !== 'section') {
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
          default:
            return 0;
        }
      });
    }
    
    setFilteredSubmissions(filtered);
  }, [orderedSubmissions, filter, searchTerm, sortBy, selectedSection]);

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

  // Auto-save grade function
  const handleAutoSave = async (submissionId: string, grade: number, feedback: string) => {
    setSavingGrades(prev => new Set(prev).add(submissionId));
    
    try {
      const response = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          grade: Number(grade),
          feedback: feedback || '',
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
            ? { ...sub, grade: Number(grade), feedback, status: 'graded' as const }
            : sub
        ));
      } else {
        throw new Error(data.error || 'Failed to save grade');
      }
    } catch (error) {
      console.error('Error saving grade:', error);
      alert('Failed to save grade. Please try again.');
    } finally {
      setSavingGrades(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
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
                    <option value="all">All Sections ({allSubmissions.length})</option>
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
              <div className="text-sm text-gray-600">
                Scrollable Feed • Auto-save • v2.0
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
                  <option value="all">All Sections ({allSubmissions.length})</option>
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

        {/* Main Content - Scrollable Feed */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4 text-sm text-gray-600 flex items-center justify-between">
            <div>
              🚀 Virtualized grading • Only renders visible videos • Ultra-fast scrolling • v4.0
            </div>
            <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              ⚡ Performance Mode: Virtualized
            </div>
          </div>
          
          {/* Virtualized Grading Feed */}
          <VirtualizedGradingFeed
            submissions={filteredSubmissions}
            assignment={assignment}
            grades={grades}
            feedbackState={feedbackState}
            savingGrades={savingGrades}
            onGradeChange={(submissionId, value) => {
              const numValue = value === '' ? '' : Number(value);
              setGrades(prev => ({ ...prev, [submissionId]: numValue }));
              // Auto-save after 1 second of no typing
              if (saveTimeouts[submissionId]) {
                clearTimeout(saveTimeouts[submissionId]);
              }
              const timeout = setTimeout(() => {
                if (numValue !== '') {
                  handleAutoSave(submissionId, numValue, feedbackState[submissionId] || '');
                }
              }, 1000);
              setSaveTimeouts(prev => ({ ...prev, [submissionId]: timeout }));
            }}
            onFeedbackChange={(submissionId, value) => {
              setFeedbackState(prev => ({ ...prev, [submissionId]: value }));
              // Auto-save after 2 seconds of no typing
              if (saveTimeouts[submissionId]) {
                clearTimeout(saveTimeouts[submissionId]);
              }
              const timeout = setTimeout(() => {
                const grade = grades[submissionId] ?? filteredSubmissions.find(s => s.submissionId === submissionId)?.grade;
                if (grade !== undefined && grade !== '') {
                  handleAutoSave(submissionId, Number(grade), value);
                }
              }, 2000);
              setSaveTimeouts(prev => ({ ...prev, [submissionId]: timeout }));
            }}
          />
        </div>
      </div>
    </InstructorRoute>
  );
};

export default NewAssignmentGradingPage;
