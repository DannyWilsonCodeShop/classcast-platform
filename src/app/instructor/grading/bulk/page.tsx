'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import YouTubePlayer from '@/components/common/YouTubePlayer';
import { getVideoUrl } from '@/lib/videoUtils';
import { useAuth } from '@/contexts/AuthContext';

interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  sectionId?: string;
  sectionName?: string;
  assignmentTitle: string;
  assignmentId: string;
  courseName: string;
  courseCode: string;
  submittedAt: string;
  status: 'pending' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  fileUrl: string;
  youtubeUrl?: string;
  isYouTube?: boolean;
  googleDriveUrl?: string;
  isGoogleDrive?: boolean;
  thumbnailUrl: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  assignment?: {
    enablePeerResponses?: boolean;
    responseDueDate?: string;
    minResponsesRequired?: number;
    maxResponsesPerVideo?: number;
    responseWordLimit?: number;
    responseCharacterLimit?: number;
    maxPoints?: number;
    maxScore?: number;
    dueDate?: string;
    title?: string;
    description?: string;
  };
  isPinned?: boolean;
  isHighlighted?: boolean;
  pinnedAt?: string;
  highlightedAt?: string;
  peerResponses?: {
    totalResponses: number;
    submittedResponses: number;
    averageResponseLength: number;
    responseQuality: 'excellent' | 'good' | 'adequate' | 'needs_improvement';
    lastResponseDate?: string;
  };
}

const BulkGradingPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGrading, setIsGrading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedStudentName, setSelectedStudentName] = useState<string>('');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoThumbnails, setVideoThumbnails] = useState<{[key: string]: string}>({});
  
  // Current submission being graded
  const [currentGrade, setCurrentGrade] = useState<number | ''>('');
  const [currentFeedback, setCurrentFeedback] = useState('');
  const [isAutoAdvance, setIsAutoAdvance] = useState(false);
  
  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // AI Grading state
  const [isAIAnalyzing, setIsAIAnalyzing] = useState<{[key: string]: boolean}>({});
  const [aiSuggestions, setAiSuggestions] = useState<{[key: string]: {
    suggestedGrade: number | null;
    suggestedFeedback: string;
    rubric: {
      contentQuality: { earned: number; possible: number };
      presentation: { earned: number; possible: number };
      technicalAspects: { earned: number; possible: number };
      engagement: { earned: number; possible: number };
    };
    strengths: string[];
    improvements: string[];
  }}>({});
  const [showAIPanel, setShowAIPanel] = useState<{[key: string]: boolean}>({});
  
  // Pin/Highlight state
  const [pinnedSubmissions, setPinnedSubmissions] = useState<Set<string>>(new Set());
  const [highlightedSubmissions, setHighlightedSubmissions] = useState<Set<string>>(new Set());
  
  // Peer responses collapse state
  const [collapsedPeerResponses, setCollapsedPeerResponses] = useState<Set<string>>(new Set());
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{submissionId: string, studentName: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bulk selection state
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [showBulkGrading, setShowBulkGrading] = useState(false);
  const [bulkGrade, setBulkGrade] = useState<number | ''>('');
  const [bulkFeedback, setBulkFeedback] = useState('');
  const [isBulkGrading, setIsBulkGrading] = useState(false);

  useEffect(() => {
    // Get filters from URL params - only run on client side
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const courseFilter = urlParams.get('course');
      const assignmentFilter = urlParams.get('assignment');
      const studentFilter = urlParams.get('student');
      const studentNameFilter = urlParams.get('studentName');
      const submissionFilter = urlParams.get('submission');
      
      console.log('URL Parameters:', { courseFilter, assignmentFilter, studentFilter, studentNameFilter, submissionFilter });
      
      if (courseFilter) {
        setSelectedCourse(courseFilter);
      }
      if (assignmentFilter) {
        setSelectedAssignment(assignmentFilter);
      }
      if (studentFilter) {
        setSelectedStudent(studentFilter);
      }
      if (studentNameFilter) {
        setSelectedStudentName(decodeURIComponent(studentNameFilter));
      }
    }
  }, []);

  // Function to determine if submission is late
  const isSubmissionLate = (submission: Submission, assignmentDueDate?: string) => {
    if (!assignmentDueDate) return false;
    
    const dueDate = new Date(assignmentDueDate);
    const submittedDate = new Date(submission.submittedAt);
    
    return submittedDate > dueDate;
  };

  // Function to get submission timing status
  const getSubmissionTimingStatus = (submission: Submission, assignmentDueDate?: string) => {
    if (!assignmentDueDate) return { status: 'unknown', color: 'gray', text: 'No due date' };
    
    const isLate = isSubmissionLate(submission, assignmentDueDate);
    
    if (isLate) {
      return { status: 'late', color: 'yellow', text: 'Late' };
    } else {
      return { status: 'ontime', color: 'green', text: 'On Time' };
    }
  };

  // State for peer responses
  const [peerResponsesData, setPeerResponsesData] = useState<{[studentId: string]: any[]}>({});

  // Function to fetch and get peer responses for a specific student
  const getPeerResponsesForStudent = (studentId: string) => {
    return peerResponsesData[studentId] || [];
  };

  // Fetch peer responses for all students
  useEffect(() => {
    const fetchPeerResponses = async () => {
      if (submissions.length === 0) return;
      
      try {
        const responsesMap: {[studentId: string]: any[]} = {};
        
        // Fetch peer responses for each student
        await Promise.all(submissions.map(async (submission) => {
          try {
            const response = await fetch(
              `/api/peer-responses?assignmentId=${submission.assignmentId}&studentId=${submission.studentId}`,
              { credentials: 'include' }
            );
            
            if (response.ok) {
              const data = await response.json();
              const responses = data.data || [];
              
              // Enrich each response with the reviewed student's info
              const enrichedResponses = await Promise.all(responses.map(async (resp: any) => {
                // Find the submission that this response is about
                const reviewedSubmission = submissions.find(sub => sub.id === resp.videoId);
                
                return {
                  ...resp,
                  reviewedStudentName: reviewedSubmission?.studentName || 'Unknown Student',
                  reviewedStudentId: reviewedSubmission?.studentId || 'unknown',
                  videoTitle: reviewedSubmission?.assignmentTitle || resp.videoTitle || 'Peer Video',
                  // Use existing wordCount and characterCount from API, or calculate if missing
                  wordCount: resp.wordCount || (resp.content ? resp.content.split(/\s+/).length : 0),
                  characterCount: resp.characterCount || (resp.content ? resp.content.length : 0),
                  qualityScore: resp.qualityScore || null,
                  // Ensure we have a date to display
                  displayDate: resp.submittedAt || resp.lastSavedAt || resp.createdAt
                };
              }));
              
              responsesMap[submission.studentId] = enrichedResponses;
              console.log(`Fetched ${enrichedResponses.length} responses for student ${submission.studentId}`);
            }
          } catch (error) {
            console.error(`Error fetching peer responses for student ${submission.studentId}:`, error);
          }
        }));
        
        setPeerResponsesData(responsesMap);
      } catch (error) {
        console.error('Error fetching peer responses:', error);
      }
    };
    
    fetchPeerResponses();
  }, [submissions.length]);

  // Legacy function for compatibility - DEPRECATED
  const getMockPeerResponsesForStudent = (studentId: string) => {
    const mockResponses = [
      {
        id: 'response_1',
        reviewerId: 'student_001',
        reviewerName: 'Alex Thompson',
        reviewedStudentId: 'student_002',
        reviewedStudentName: 'Sarah Chen',
        videoId: 'video_2',
        assignmentId: 'assignment_1',
        content: 'Great explanation of the data structures! I really liked how you broke down the complexity analysis step by step. One suggestion would be to add more examples of real-world applications where these structures are used.',
        wordCount: 35,
        characterCount: 245,
        isSubmitted: true,
        submittedAt: '2024-01-23T10:15:00Z',
        qualityScore: 4,
        aiGrade: {
          overallGrade: 85,
          rubricScores: {
            contentQuality: { earned: 4, possible: 5, feedback: 'Good content analysis' },
            engagement: { earned: 4, possible: 5, feedback: 'Engaging and helpful' },
            criticalThinking: { earned: 3, possible: 5, feedback: 'Could be more critical' },
            communication: { earned: 4, possible: 5, feedback: 'Clear communication' }
          }
        }
      },
      {
        id: 'response_2',
        reviewerId: 'student_001',
        reviewerName: 'Alex Thompson',
        reviewedStudentId: 'student_003',
        reviewedStudentName: 'Michael Rodriguez',
        videoId: 'video_3',
        assignmentId: 'assignment_1',
        content: 'Your presentation was very clear and well-structured. The visual aids really helped me understand the concepts. However, I think you could have gone deeper into the practical implementation details.',
        wordCount: 28,
        characterCount: 198,
        isSubmitted: true,
        submittedAt: '2024-01-22T14:30:00Z',
        qualityScore: 4,
        aiGrade: {
          overallGrade: 82,
          rubricScores: {
            contentQuality: { earned: 4, possible: 5, feedback: 'Good structure' },
            engagement: { earned: 4, possible: 5, feedback: 'Engaging presentation' },
            criticalThinking: { earned: 3, possible: 5, feedback: 'Needs more depth' },
            communication: { earned: 4, possible: 5, feedback: 'Clear delivery' }
          }
        }
      },
      {
        id: 'response_3',
        reviewerId: 'student_001',
        reviewerName: 'Alex Thompson',
        reviewedStudentId: 'student_004',
        reviewedStudentName: 'Emily Davis',
        videoId: 'video_4',
        assignmentId: 'assignment_1',
        content: 'Excellent work on the algorithm explanation! I particularly appreciated the step-by-step walkthrough. One area for improvement could be discussing the time and space complexity more thoroughly.',
        wordCount: 32,
        characterCount: 220,
        isSubmitted: false,
        submittedAt: '2024-01-24T09:45:00Z',
        qualityScore: 5,
        aiGrade: null
      },
      {
        id: 'response_4',
        reviewerId: 'student_002',
        reviewerName: 'Sarah Chen',
        reviewedStudentId: 'student_001',
        reviewedStudentName: 'Alex Thompson',
        videoId: 'video_1',
        assignmentId: 'assignment_1',
        content: 'Really impressive work on the machine learning concepts! Your explanation of neural networks was very clear and easy to follow. I especially liked the visual diagrams you used.',
        wordCount: 28,
        characterCount: 195,
        isSubmitted: true,
        submittedAt: '2024-01-23T11:20:00Z',
        qualityScore: 5,
        aiGrade: {
          overallGrade: 92,
          rubricScores: {
            contentQuality: { earned: 5, possible: 5, feedback: 'Excellent content' },
            engagement: { earned: 5, possible: 5, feedback: 'Very engaging' },
            criticalThinking: { earned: 4, possible: 5, feedback: 'Good analysis' },
            communication: { earned: 5, possible: 5, feedback: 'Clear communication' }
          }
        }
      },
      {
        id: 'response_5',
        reviewerId: 'student_003',
        reviewerName: 'Michael Rodriguez',
        reviewedStudentId: 'student_001',
        reviewedStudentName: 'Alex Thompson',
        videoId: 'video_1',
        assignmentId: 'assignment_1',
        content: 'Good job overall! The technical content was solid, but I think you could have provided more practical examples or code snippets to illustrate the concepts.',
        wordCount: 25,
        characterCount: 180,
        isSubmitted: true,
        submittedAt: '2024-01-22T16:45:00Z',
        qualityScore: 3,
        aiGrade: {
          overallGrade: 75,
          rubricScores: {
            contentQuality: { earned: 3, possible: 5, feedback: 'Good but needs examples' },
            engagement: { earned: 3, possible: 5, feedback: 'Could be more engaging' },
            criticalThinking: { earned: 3, possible: 5, feedback: 'Basic analysis' },
            communication: { earned: 4, possible: 5, feedback: 'Clear but basic' }
          }
        }
      }
    ];

    // Return responses for the specific student, or empty array if no responses
    return mockResponses.filter(response => response.reviewerId === studentId);
  };

  // Fetch submissions from API
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setIsLoading(true);
        
        // Don't fetch if user is not loaded yet
        if (!user?.id) {
          console.log('🔍 Bulk grading: Waiting for user to load...');
          setIsLoading(false);
          return;
        }
        
        console.log('🔍 Bulk grading: User loaded, proceeding with API call. User ID:', user.id);
        console.log('🔍 Bulk grading: User object:', user);
        
        // Get URL parameters for filtering
        const urlParams = new URLSearchParams(window.location.search);
        const assignmentId = urlParams.get('assignment');
        const courseId = urlParams.get('course');
        const studentId = urlParams.get('student');
        
        console.log('🔍 Bulk grading: URL parameters:', { assignmentId, courseId, studentId });
        
        let apiUrl = '/api/instructor/video-submissions';
        const params = new URLSearchParams();
        
        // Try different approaches based on what parameters we have
        if (assignmentId) {
          params.append('assignmentId', assignmentId);
        }
        if (courseId) {
          params.append('courseId', courseId);
        }
        if (studentId) {
          params.append('studentId', studentId);
        }
        
        // Don't add instructorId when we have specific assignment/course parameters
        // The API should validate instructor access through the assignment/course ownership
        // Commenting out for now to fix the issue where no submissions are showing
        // if (!assignmentId && !courseId && !studentId) {
        //   params.append('instructorId', user.id);
        // }
        
        if (params.toString()) {
          apiUrl += `?${params.toString()}`;
        }
        
        console.log('🔍 Bulk grading: Fetching submissions from:', apiUrl);
        
        const response = await fetch(apiUrl, {
          credentials: 'include',
        });
        
        console.log('🔍 Bulk grading: API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Bulk grading: API response data:', data);
          console.log('🔍 Bulk grading: Submissions count:', data.submissions?.length || 0);
          
          if (data.success && data.submissions) {
            // Transform API response to match expected interface
            const transformedSubmissions: Submission[] = data.submissions.map((sub: any) => ({
              id: sub.submissionId,
              studentName: sub.student?.name || 'Unknown Student',
              studentId: sub.studentId,
              sectionId: sub.student?.sectionId || null,
              sectionName: sub.student?.sectionName || null,
              assignmentTitle: sub.assignment?.title || 'Unknown Assignment',
              assignmentId: sub.assignmentId,
              courseName: sub.courseName || 'Unknown Course',
              courseCode: sub.courseCode || 'N/A',
              submittedAt: sub.submittedAt || sub.createdAt,
              status: sub.status === 'graded' ? 'graded' : 'pending',
              grade: sub.grade,
              feedback: sub.instructorFeedback,
              fileUrl: sub.videoUrl,
              youtubeUrl: sub.youtubeUrl || null,
              isYouTube: sub.isYouTube || false,
              googleDriveUrl: sub.googleDriveUrl || null,
              isGoogleDrive: sub.isGoogleDrive || false,
              thumbnailUrl: sub.thumbnailUrl || '/api/placeholder/300/200',
              duration: sub.duration || 0,
              fileSize: sub.fileSize || 0,
              assignment: sub.assignment,
              isPinned: sub.isPinned || false,
              isHighlighted: sub.isHighlighted || false,
              pinnedAt: sub.pinnedAt,
              highlightedAt: sub.highlightedAt,
              peerResponses: sub.peerResponses
            }));
            
            setSubmissions(transformedSubmissions);
            console.log('🔍 Bulk grading: Set submissions count:', transformedSubmissions.length);
            
            // Debug: Also call the debug endpoint to see instructor data
            if (transformedSubmissions.length === 0) {
              console.log('🔍 No submissions found, calling debug endpoint...');
              try {
                const debugResponse = await fetch(`/api/debug/instructor-data?instructorId=${user.id}`, {
                  credentials: 'include',
                });
                if (debugResponse.ok) {
                  const debugData = await debugResponse.json();
                  console.log('🔍 Debug instructor data:', debugData);
                  
                  // Try calling the API without instructorId filter
                  if (assignmentId) {
                    console.log('🔍 Testing API call without instructorId filter...');
                    const testResponse = await fetch(`/api/instructor/video-submissions?assignmentId=${assignmentId}`, {
                      credentials: 'include',
                    });
                    if (testResponse.ok) {
                      const testData = await testResponse.json();
                      console.log('🔍 Test API call without instructorId succeeded:', testData);
                      
                      if (testData.success && testData.submissions?.length > 0) {
                        console.log('🔍 Found submissions without instructorId filter, using those...');
                        const testTransformedSubmissions: Submission[] = testData.submissions.map((sub: any) => ({
                          id: sub.submissionId,
                          studentName: sub.student?.name || 'Unknown Student',
                          studentId: sub.studentId,
                          sectionId: sub.student?.sectionId || null,
                          sectionName: sub.student?.sectionName || null,
                          assignmentTitle: sub.assignment?.title || 'Unknown Assignment',
                          assignmentId: sub.assignmentId,
                          courseName: sub.courseName || 'Unknown Course',
                          courseCode: sub.courseCode || 'N/A',
                          submittedAt: sub.submittedAt || sub.createdAt,
                          status: sub.status === 'graded' ? 'graded' : 'pending',
                          grade: sub.grade,
                          feedback: sub.instructorFeedback,
                          fileUrl: sub.videoUrl,
                          youtubeUrl: sub.youtubeUrl || null,
                          isYouTube: sub.isYouTube || false,
                          googleDriveUrl: sub.googleDriveUrl || null,
                          isGoogleDrive: sub.isGoogleDrive || false,
                          thumbnailUrl: sub.thumbnailUrl || '/api/placeholder/300/200',
                          duration: sub.duration || 0,
                          fileSize: sub.fileSize || 0,
                          assignment: sub.assignment,
                          isPinned: sub.isPinned || false,
                          isHighlighted: sub.isHighlighted || false,
                          pinnedAt: sub.pinnedAt,
                          highlightedAt: sub.highlightedAt,
                          peerResponses: sub.peerResponses
                        }));
                        setSubmissions(testTransformedSubmissions);
                      }
                    } else {
                      console.log('🔍 Test API call without instructorId failed:', testResponse.status);
                    }
                  }
                } else {
                  console.log('🔍 Debug endpoint failed:', debugResponse.status);
                }
              } catch (debugError) {
                console.log('🔍 Debug endpoint error:', debugError);
              }
            }
          } else {
            console.log('🔍 Bulk grading: No submissions found or API error:', data.error);
            setSubmissions([]);
          }
        } else {
          console.error('🔍 Bulk grading: Failed to fetch submissions:', response.status);
          const errorText = await response.text();
          console.error('🔍 Bulk grading: Error response:', errorText);
          setSubmissions([]);
        }
      } catch (error) {
        console.error('Error fetching submissions:', error);
        setSubmissions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubmissions();
  }, [user?.id]);

  // Debug: Log when user changes
  useEffect(() => {
    console.log('🔍 Bulk grading: User state changed:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email
    });
  }, [user]);

  // Navigate to specific submission if provided in URL
  useEffect(() => {
    if (typeof window !== 'undefined' && submissions.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const submissionFilter = urlParams.get('submission');
      
      if (submissionFilter) {
        const submissionIndex = submissions.findIndex(sub => sub.id === submissionFilter);
        if (submissionIndex !== -1) {
          setCurrentSubmissionIndex(submissionIndex);
        }
      }
    }
  }, [submissions.length]);

  // Video controls
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const applyPlaybackSpeedToAllVideos = (speed: number) => {
    // Apply to main video ref
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    
    // Apply to all video elements on the page
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach((video) => {
      video.playbackRate = speed;
    });
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    applyPlaybackSpeedToAllVideos(speed);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      
      // Generate thumbnail from frame at 2 seconds if not already generated
      const currentSubmission = filteredSubmissions[currentSubmissionIndex];
      if (currentSubmission && !videoThumbnails[currentSubmission.id]) {
        videoRef.current.currentTime = 2.0;
      }
    }
  };

  const generateThumbnail = (video: HTMLVideoElement, submissionId: string) => {
    if (videoThumbnails[submissionId]) return; // Already generated
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        setVideoThumbnails(prev => ({
          ...prev,
          [submissionId]: thumbnail
        }));
        console.log('✅ Thumbnail generated for:', submissionId);
      }
    } catch (error) {
      // CORS error when trying to export canvas - this is expected for proxied videos
      // Just skip thumbnail generation, video will still play fine
      console.log('ℹ️ Could not generate thumbnail (CORS restriction):', submissionId);
    }
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

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Navigation between submissions
  const goToNextSubmission = () => {
    if (currentSubmissionIndex < filteredSubmissions.length - 1) {
      setCurrentSubmissionIndex(currentSubmissionIndex + 1);
      setCurrentGrade('');
      setCurrentFeedback('');
      setIsPlaying(false);
    }
  };

  // Navigate to specific submission if provided in URL
  useEffect(() => {
    if (typeof window !== 'undefined' && submissions.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const submissionFilter = urlParams.get('submission');
      
      if (submissionFilter) {
        // Find submission by ID
        const submissionIndex = submissions.findIndex(sub => sub.id === submissionFilter);
        if (submissionIndex !== -1) {
          setCurrentSubmissionIndex(submissionIndex);
        }
      }
    }
  }, [submissions.length]);

  const goToPreviousSubmission = () => {
    if (currentSubmissionIndex > 0) {
      setCurrentSubmissionIndex(currentSubmissionIndex - 1);
      setCurrentGrade('');
      setCurrentFeedback('');
      setIsPlaying(false);
    }
  };

  const goToSubmission = (index: number) => {
    setCurrentSubmissionIndex(index);
    
    // Load existing grade and feedback if available
    const submission = filteredSubmissions[index];
    if (submission) {
      setCurrentGrade(submission.grade || '');
      setCurrentFeedback(submission.feedback || '');
    } else {
      setCurrentGrade('');
      setCurrentFeedback('');
    }
    
    setIsPlaying(false);
    setSaveStatus('saved'); // Reset save status when switching
  };

  // Auto-save function
  const autoSave = async (submissionId: string, grade: number | '', feedback: string) => {
    if (!grade) return; // Don't save if no grade is provided
    
    setSaveStatus('saving');
    try {
      // Save to API
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
      
      // Update submission with grade in local state
      setSubmissions(prev => prev.map(sub => 
        sub.id === submissionId
          ? {
              ...sub,
              status: 'graded' as const,
              grade: Number(grade),
              feedback: feedback || 'Graded'
            }
          : sub
      ));
      
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      setSaveStatus('error');
      console.error('Error auto-saving:', error);
    }
  };

  // Debounced auto-save
  const debouncedAutoSave = (submissionId: string, grade: number | '', feedback: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(submissionId, grade, feedback);
    }, 1000); // Save after 1 second of inactivity
  };

  // Handle grade change with auto-save
  const handleGradeChange = (grade: number | '') => {
    setCurrentGrade(grade);
    if (currentSubmission && grade) {
      debouncedAutoSave(currentSubmission.id, grade, currentFeedback);
    }
  };

  // Handle feedback change with auto-save
  const handleFeedbackChange = (feedback: string) => {
    setCurrentFeedback(feedback);
    if (currentSubmission && currentGrade) {
      debouncedAutoSave(currentSubmission.id, currentGrade, feedback);
    }
  };

  // AI Analysis function
  const analyzeWithAI = async (submission: Submission) => {
    // Show subscription modal
    alert('🤖 AI Auto-Grading\n\nAI-powered video grading requires a ClassCast AI subscription.\n\nFeatures include:\n• Automated rubric-based grading\n• Detailed feedback generation\n• Strengths and improvement suggestions\n• Save hours of grading time\n\nContact your administrator for subscription details.');
  };

  // Generate AI feedback based on submission
  const generateAIFeedback = (submission: Submission): string => {
    const feedbackTemplates = [
      `Great work on ${submission.assignmentTitle}! Your explanation was clear and well-structured. The video quality is excellent and your presentation skills are strong. Consider adding more examples to further illustrate your points.`,
      `Solid submission for ${submission.assignmentTitle}. You demonstrated good understanding of the concepts. The technical aspects were well-executed. To improve, try to engage more with the audience and provide more detailed explanations.`,
      `Excellent presentation of ${submission.assignmentTitle}! Your content was comprehensive and your delivery was engaging. The video production quality is professional. Keep up the great work!`,
      `Good effort on ${submission.assignmentTitle}. You covered the main points well. The presentation was clear and your understanding of the material is evident. Consider adding more visual aids to enhance the learning experience.`,
      `Outstanding work on ${submission.assignmentTitle}! Your explanation was thorough and your presentation was very engaging. The technical execution was flawless. This is exactly what we're looking for in video submissions.`
    ];
    
    return feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)];
  };

  const generateStrengths = (): string[] => {
    const allStrengths = [
      "Clear and articulate presentation",
      "Excellent video quality and production",
      "Well-structured content organization",
      "Strong understanding of the material",
      "Engaging delivery style",
      "Good use of visual aids",
      "Comprehensive coverage of topics",
      "Professional presentation skills",
      "Clear audio quality",
      "Effective time management"
    ];
    
    return allStrengths
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 3);
  };

  const generateImprovements = (): string[] => {
    const allImprovements = [
      "Add more specific examples to illustrate concepts",
      "Consider using more visual aids or diagrams",
      "Practice speaking at a slightly slower pace",
      "Include more interactive elements",
      "Provide more detailed explanations for complex topics",
      "Consider adding a summary or conclusion",
      "Improve lighting for better video quality",
      "Add captions or subtitles for accessibility",
      "Include more real-world applications",
      "Practice more before recording"
    ];
    
    return allImprovements
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 2);
  };

  // Apply AI suggestions
  const applyAISuggestions = (submissionId: string) => {
    const suggestions = aiSuggestions[submissionId];
    if (suggestions) {
      setCurrentGrade(suggestions.suggestedGrade || '');
      setCurrentFeedback(suggestions.suggestedFeedback);
      
      // Auto-save the AI suggestions
      if (suggestions.suggestedGrade) {
        debouncedAutoSave(submissionId, suggestions.suggestedGrade, suggestions.suggestedFeedback);
      }
    }
  };

  // AI Analysis for Peer Responses
  const analyzePeerResponsesWithAI = async (submission: Submission) => {
    alert('🤖 AI Peer Response Analysis\n\nAI-powered peer response quality analysis requires a ClassCast AI subscription.\n\nFeatures include:\n• Analyze peer response quality and depth\n• Identify engagement patterns\n• Suggest intervention opportunities\n• Track collaboration metrics\n\nContact your administrator for subscription details.');
  };

  // Pin/Highlight functions
  const togglePin = (submissionId: string) => {
    setPinnedSubmissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
    
    // Update submission in state
    setSubmissions(prev => prev.map(sub => 
      sub.id === submissionId 
        ? { 
            ...sub, 
            isPinned: !sub.isPinned,
            pinnedAt: !sub.isPinned ? new Date().toISOString() : undefined
          }
        : sub
    ));
  };

  const toggleHighlight = (submissionId: string) => {
    setHighlightedSubmissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
    
    // Update submission in state
    setSubmissions(prev => prev.map(sub => 
      sub.id === submissionId 
        ? { 
            ...sub, 
            isHighlighted: !sub.isHighlighted,
            highlightedAt: !sub.isHighlighted ? new Date().toISOString() : undefined
          }
        : sub
    ));
  };

  // Delete submission function
  const handleDeleteSubmission = async () => {
    if (!deleteConfirm) return;
    
    setIsDeleting(true);
    try {
      console.log('🗑️ Deleting submission:', deleteConfirm.submissionId);
      
      const response = await fetch('/api/delete-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          submissionId: deleteConfirm.submissionId
        }),
      });

      const data = await response.json();
      console.log('Delete response:', response.status, data);

      if (response.ok && data.success) {
        console.log('✅ Submission deleted successfully');
        
        // Remove submission from local state
        setSubmissions(prev => prev.filter(sub => sub.id !== deleteConfirm.submissionId));
        
        // Adjust current submission index if needed
        const deletedIndex = filteredSubmissions.findIndex(sub => sub.id === deleteConfirm.submissionId);
        if (deletedIndex !== -1 && deletedIndex <= currentSubmissionIndex && currentSubmissionIndex > 0) {
          setCurrentSubmissionIndex(prev => Math.max(0, prev - 1));
        }
        
        setDeleteConfirm(null);
        alert(`✅ Video submission by ${deleteConfirm.studentName} has been deleted successfully!`);
      } else {
        console.error('Failed to delete submission:', response.status, data);
        const errorMessage = data.error || data.message || 'Failed to delete submission. Please try again.';
        alert(`❌ ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('❌ An error occurred while deleting. Please check your connection and try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk selection functions
  const toggleSubmissionSelection = (submissionId: string) => {
    setSelectedSubmissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  const selectAllSubmissions = () => {
    setSelectedSubmissions(new Set(filteredSubmissions.map(sub => sub.id)));
  };

  const clearAllSelections = () => {
    setSelectedSubmissions(new Set());
  };

  // Bulk grading function
  const handleBulkGrading = async () => {
    if (selectedSubmissions.size === 0) {
      alert('Please select at least one submission to grade.');
      return;
    }

    if (!bulkGrade && !bulkFeedback.trim()) {
      alert('Please enter a grade and/or feedback to apply.');
      return;
    }

    setIsBulkGrading(true);
    try {
      console.log('🎯 Bulk grading submissions:', Array.from(selectedSubmissions));
      
      const promises = Array.from(selectedSubmissions).map(async (submissionId) => {
        const response = await fetch(`/api/submissions/${submissionId}/grade`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            grade: bulkGrade ? Number(bulkGrade) : undefined,
            feedback: bulkFeedback.trim() || undefined,
            status: 'graded'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to grade submission ${submissionId}: ${errorData.error || 'Unknown error'}`);
        }

        return response.json();
      });

      await Promise.all(promises);

      // Update local state for all graded submissions
      setSubmissions(prev => prev.map(sub => {
        if (!selectedSubmissions.has(sub.id)) {
          return sub;
        }
        
        const updates: any = { ...sub, status: 'graded' as const };
        
        // Update grade if provided
        if (bulkGrade) {
          updates.grade = Number(bulkGrade);
        }
        
        // Update feedback if provided
        if (bulkFeedback.trim()) {
          updates.instructorFeedback = bulkFeedback.trim();
          updates.feedback = bulkFeedback.trim(); // For backward compatibility
        }
        
        return updates;
      }));

      console.log('✅ Bulk grading completed successfully');
      alert(`✅ Successfully graded ${selectedSubmissions.size} submissions!`);
      
      // Reset bulk grading state
      setSelectedSubmissions(new Set());
      setShowBulkGrading(false);
      setBulkGrade('');
      setBulkFeedback('');
      
    } catch (error) {
      console.error('❌ Error in bulk grading:', error);
      alert(`❌ Bulk grading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsBulkGrading(false);
    }
  };

  // Use submissions for filtering
  const submissionsToFilter = submissions;
  
  const filteredSubmissions = submissionsToFilter.filter(submission => {
    const courseMatch = selectedCourse === 'all' || 
      submission.courseName.toLowerCase().includes(selectedCourse.toLowerCase()) ||
      submission.courseCode.toLowerCase().includes(selectedCourse.toLowerCase()) ||
      submission.courseCode.toLowerCase().replace('-', '').includes(selectedCourse.toLowerCase().replace('-', ''));
    const assignmentMatch = selectedAssignment === 'all' || submission.assignmentId === selectedAssignment;
    const studentMatch = selectedStudent === 'all' || submission.studentId === selectedStudent;
    
    return courseMatch && assignmentMatch && studentMatch;
  });
  
  console.log('Filtered submissions count:', filteredSubmissions.length);
  console.log('Selected course:', selectedCourse);
  console.log('Selected assignment:', selectedAssignment);
  console.log('Selected student:', selectedStudent, selectedStudentName);
  console.log('Total submissions:', submissionsToFilter.length);

  const currentSubmission = filteredSubmissions[currentSubmissionIndex];

  // Format time helper
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format file size helper
  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'returned':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'graded':
        return 'Graded';
      case 'returned':
        return 'Returned';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005587] mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading submissions...</p>
          </div>
        </div>
      </InstructorRoute>
    );
  }

  if (filteredSubmissions.length === 0) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-6xl mb-4">📹</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">No Submissions Found</h1>
            <p className="text-gray-600 mb-4">No video submissions are available for grading.</p>
            <div className="text-sm text-gray-500 mb-6">
              <p>This could mean:</p>
              <ul className="list-disc list-inside text-left max-w-md mx-auto mt-2">
                <li>No students have submitted videos yet</li>
                <li>The assignment doesn't have any submissions</li>
                <li>There may be a filter applied</li>
              </ul>
            </div>
            <div className="space-x-4">
              <button
                onClick={() => {
                  setSelectedCourse('all');
                  setSelectedAssignment('all');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Show All Submissions
              </button>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-[#005587] text-white rounded-xl font-bold hover:bg-[#003d5c] hover:shadow-lg transition-all duration-300"
              >
                ← Back to Dashboard
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
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/instructor/dashboard')}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="text-2xl">&lt;</span>
                </button>
                <div className="flex items-center space-x-4">
                  <img 
                    src="/MyClassCast (800 x 200 px).png" 
                    alt="ClassCast Logo" 
                    className="h-8 w-auto"
                  />
                  <div>
                    <p className="text-gray-600 text-sm">
                      {currentSubmissionIndex + 1} of {filteredSubmissions.length} submissions
                      {selectedStudentName && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          👤 {selectedStudentName}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Back to Students Button - Show when filtering by specific student */}
                {selectedStudent !== 'all' && selectedStudentName && (
                  <button
                    onClick={() => {
                      const urlParams = new URLSearchParams(window.location.search);
                      const courseId = urlParams.get('course');
                      if (courseId) {
                        router.push(`/instructor/courses/${courseId}/students`);
                      } else {
                        router.back();
                      }
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    👥 Back to Students
                  </button>
                )}
                
                {/* View All Submissions Button */}
                <button
                  onClick={() => {
                    const urlParams = new URLSearchParams(window.location.search);
                    const assignmentId = urlParams.get('assignment');
                    const courseId = urlParams.get('course');
                    let submissionsUrl = '/instructor/submissions';
                    if (assignmentId && courseId) {
                      submissionsUrl += `?assignment=${assignmentId}&course=${courseId}`;
                    } else if (courseId) {
                      submissionsUrl += `?course=${courseId}`;
                    }
                    router.push(submissionsUrl);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  📋 View All Submissions
                </button>
                
                {/* Course Filter */}
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Courses</option>
                  <option value="calculus">Introduction to Calculus (MATH101)</option>
                  <option value="computer">Data Structures & Algorithms (CS301)</option>
                  <option value="physics">Physics for Engineers (PHYS201)</option>
                  <option value="history">World History (HIST201)</option>
                  <option value="biology">Cell Biology (BIO150)</option>
                  <option value="english">Technical Writing (ENG101)</option>
                  <option value="psychology">Introduction to Psychology (PSYC101)</option>
                  <option value="science">Introduction to Computer Science (CS101)</option>
                  <option value="data">Data Science Fundamentals (DS201)</option>
                </select>
                
                {/* Assignment Filter */}
                <select
                  value={selectedAssignment}
                  onChange={(e) => setSelectedAssignment(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Assignments</option>
                  <option value="assignment_1">Derivatives and Limits - Video Lesson</option>
                  <option value="assignment_2">Integration Techniques - Video Assessment</option>
                  <option value="assignment_3">Basic Programming Concepts - Video Assessment</option>
                  <option value="assignment_4">Data Visualization Techniques - Video Lesson</option>
                  <option value="assignment_5">Thermodynamics Concepts - Video Lesson</option>
                  <option value="assignment_6">Binary Tree Implementation - Video Assessment</option>
                  <option value="assignment_8">Technical Documentation - Video Lesson</option>
                  <option value="assignment_10">Renaissance Period Analysis - Video Discussion</option>
                  <option value="assignment_11">Mitosis Process - Video Lesson</option>
                  <option value="assignment_12">Memory Systems - Video Discussion</option>
                  <option value="assignment_13">Integration by Parts - Video Assessment</option>
                  <option value="assignment_14">Machine Learning Algorithms - Video Discussion</option>
                </select>
                
                {/* Auto-advance toggle */}
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isAutoAdvance}
                    onChange={(e) => setIsAutoAdvance(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span>Auto-advance</span>
                </label>
              </div>
            </div>
          </div>
        </div>

            {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex flex-col">
              {/* Global Playback Speed Control */}
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Playback Speed:</span>
                  <div className="flex items-center space-x-1">
                    {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                      <button
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
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

              {/* Page Title */}
              <div className="mb-3">
                <h1 className="text-xl font-bold text-gray-800">Bulk Grading Interface</h1>
                <p className="text-xs text-gray-600 mt-1">Review and grade video submissions</p>
              </div>

              {/* Submissions Header with Select All */}
              {filteredSubmissions.length > 0 && (
                <div className="flex items-center justify-between mb-2 p-2 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSubmissions.size === filteredSubmissions.length && filteredSubmissions.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllSubmissions();
                          } else {
                            clearAllSelections();
                          }
                        }}
                        className="w-4 h-4 text-[#005587] bg-gray-100 border-gray-300 rounded focus:ring-[#005587] focus:ring-2"
                      />
                      <span className="text-xs font-medium text-gray-700">
                        Select All ({filteredSubmissions.length})
                      </span>
                    </label>
                  </div>
                  <div className="text-xs text-gray-600">
                    {selectedSubmissions.size > 0 && (
                      <span>{selectedSubmissions.size} selected</span>
                    )}
                  </div>
                </div>
              )}

              {/* Bulk Actions Toolbar */}
              {selectedSubmissions.size > 0 && (
                <div className="bg-[#005587] text-white p-2 rounded-lg mb-2 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium">
                        {selectedSubmissions.size} selected
                      </span>
                      <button
                        onClick={selectAllSubmissions}
                        className="text-xs text-blue-200 hover:text-white underline"
                      >
                        Select All ({filteredSubmissions.length})
                      </button>
                      <button
                        onClick={clearAllSelections}
                        className="text-xs text-blue-200 hover:text-white underline"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowBulkGrading(true)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        📝 Bulk Grade
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Video List - Vertical Scrolling */}
              <div className="overflow-y-auto space-y-3 max-h-[calc(100vh-300px)]">
                {filteredSubmissions.map((submission, index) => (
                  <div
                    key={submission.id}
                    className={`p-4 rounded-lg border transition-all duration-300 ${
                      index === currentSubmissionIndex
                        ? 'border-[#005587] bg-blue-50 shadow-lg ring-2 ring-[#005587]/20'
                        : submission.isPinned && submission.isHighlighted
                        ? 'border-[#FFC72C] bg-amber-50/40 shadow-lg'
                        : submission.isPinned
                        ? 'border-[#005587]/40 bg-blue-50/50 shadow-md'
                        : submission.isHighlighted
                        ? 'border-[#FFC72C]/60 bg-amber-50/30 shadow-md'
                        : (() => {
                            const timingStatus = getSubmissionTimingStatus(submission, submission.assignment?.dueDate);
                            if (timingStatus.status === 'late') {
                              return 'border-red-200 bg-red-50/50 hover:border-red-300 hover:shadow-md';
                            } else if (timingStatus.status === 'ontime') {
                              return 'border-green-200 bg-green-50/30 hover:border-green-300 hover:shadow-md';
                            }
                            return 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md';
                          })()
                    }`}
                  >
                    {/* Selection Checkbox and Pin/Highlight Indicators */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {/* Selection Checkbox */}
                        <label className="flex items-center space-x-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedSubmissions.has(submission.id)}
                            onChange={() => toggleSubmissionSelection(submission.id)}
                            className="w-4 h-4 text-[#005587] bg-gray-100 border-gray-300 rounded focus:ring-[#005587] focus:ring-2"
                          />
                          <span className="text-xs text-gray-600">Select</span>
                        </label>
                        
                        {/* Pin/Highlight Indicators */}
                        {(submission.isPinned || submission.isHighlighted) && (
                          <div className="flex items-center space-x-1">
                            {submission.isPinned && (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-[#005587]/10 text-[#005587] rounded text-xs font-semibold border border-[#005587]/20">
                                <span>📌</span>
                                <span>Pinned</span>
                              </div>
                            )}
                            {submission.isHighlighted && (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-[#FFC72C]/15 text-[#CC9900] rounded text-xs font-semibold border border-[#FFC72C]/30">
                                <span>⭐</span>
                                <span>Featured</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                      {/* Video Player */}
                      <div className="xl:col-span-1">
                        <div className="bg-black rounded-lg overflow-hidden mb-2 relative group">
                          {(() => {
                            const isYouTubeSubmission =
                              submission.isYouTube ||
                              submission.youtubeUrl ||
                              submission.fileUrl?.includes('youtube.com') ||
                              submission.fileUrl?.includes('youtu.be');
                            const isGoogleDriveSubmission =
                              submission.isGoogleDrive ||
                              submission.googleDriveUrl ||
                              submission.fileUrl?.includes('drive.google.com');
                            const externalUrl = isYouTubeSubmission
                              ? submission.youtubeUrl || submission.fileUrl
                              : isGoogleDriveSubmission
                                ? submission.googleDriveUrl || submission.fileUrl
                                : null;
                            const resolvedExternalUrl = externalUrl ? getVideoUrl(externalUrl) : null;

                            if (isYouTubeSubmission && externalUrl) {
                              return (
                                <YouTubePlayer
                                  url={externalUrl}
                                  title={submission.assignmentTitle}
                                  className="w-full h-40"
                                  playbackSpeed={playbackSpeed}
                                />
                              );
                            }

                            if (isGoogleDriveSubmission && resolvedExternalUrl) {
                              return (
                                <iframe
                                  src={resolvedExternalUrl}
                                  title={submission.assignmentTitle || 'Google Drive video'}
                                  className="w-full h-40"
                                  allow="autoplay"
                                  allowFullScreen
                                />
                              );
                            }

                            return (
                              <video
                              ref={index === currentSubmissionIndex ? videoRef : null}
                              src={getVideoUrl(submission.fileUrl)}
                              className="w-full h-40 object-cover"
                              poster={videoThumbnails[submission.id] || submission.thumbnailUrl || '/api/placeholder/400/300'}
                              preload="metadata"
                              playsInline
                              webkit-playsinline="true"
                              crossOrigin="anonymous"
                              controls
                              onLoadedMetadata={(e) => {
                                const video = e.currentTarget;
                                video.playbackRate = playbackSpeed;
                                
                                // Call the main metadata handler for current submission
                                if (index === currentSubmissionIndex) {
                                  handleLoadedMetadata();
                                }
                                
                                // Generate thumbnail for ALL videos at 2-second mark
                                if (!videoThumbnails[submission.id] && video.duration >= 2) {
                                  video.currentTime = Math.min(2.0, video.duration * 0.1);
                                }
                              }}
                              onError={(e) => {
                                console.error('Video load error for submission:', submission.id, submission.fileUrl);
                                // Fallback to placeholder if video fails to load
                                const target = e.target as HTMLVideoElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="w-full h-40 bg-gray-800 flex items-center justify-center">
                                      <div class="text-center text-white">
                                        <div class="text-2xl mb-1">🎥</div>
                                        <div class="text-xs">Video Preview</div>
                                        <div class="text-xs text-gray-400 mt-1">Click to view</div>
                                      </div>
                                    </div>
                                  `;
                                }
                              }}
                              onTimeUpdate={index === currentSubmissionIndex ? handleTimeUpdate : undefined}
                              onSeeked={(e) => {
                                const video = e.currentTarget;
                                
                                // Generate thumbnail when seek to 2 seconds completes
                                if (!videoThumbnails[submission.id] && video.currentTime >= 1.5 && video.currentTime <= 3.0) {
                                  generateThumbnail(video, submission.id);
                                  // Reset to start after thumbnail generation
                                  if (index !== currentSubmissionIndex) {
                                    video.currentTime = 0;
                                  }
                                }
                              }}
                              onPlay={() => index === currentSubmissionIndex && setIsPlaying(true)}
                              onPause={() => index === currentSubmissionIndex && setIsPlaying(false)}
                              onEnded={() => index === currentSubmissionIndex && setIsPlaying(false)}
                            />
                            );
                          })()}
                        </div>
                      </div>

                      {/* Submission Info and Grading Form */}
                      <div className="xl:col-span-2 space-y-2">
                        {/* Submission Info */}
                        <div>
                          <h2 className="text-lg font-bold text-gray-800 mb-1">
                            {submission.studentName}
                          </h2>
                          <p className="text-sm text-gray-600 mb-1">
                            {submission.assignmentTitle}
                          </p>
                          <p className="text-xs text-gray-500 mb-1">
                            {submission.courseName} ({submission.courseCode})
                          </p>
                          {submission.sectionName && (
                            <p className="text-xs text-blue-600 mb-1 font-medium">
                              Section: {submission.sectionName}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mb-2">
                            <p className="text-xs text-gray-500">
                              {submission.assignment?.dueDate ? (
                                <>Video Due: {new Date(submission.assignment.dueDate).toLocaleDateString()}</>
                              ) : (
                                <>No due date set</>
                              )}
                              {submission.assignment?.enablePeerResponses && submission.assignment?.responseDueDate && (
                                <> • Responses Due: {new Date(submission.assignment.responseDueDate).toLocaleDateString()}</>
                              )}
                            </p>
                            
                            {/* Timing Status with Icon */}
                            {(() => {
                              const timingStatus = getSubmissionTimingStatus(submission, submission.assignment?.dueDate);
                              return (
                                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  timingStatus.color === 'green' 
                                    ? 'bg-green-100 text-green-800' 
                                    : timingStatus.color === 'yellow'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  <span>{timingStatus.color === 'green' ? '✓' : timingStatus.color === 'yellow' ? '⚠️' : '?'}</span>
                                  <span>{timingStatus.text}</span>
                                </div>
                              );
                            })()}
                          </div>
                          {submission.assignment?.enablePeerResponses && (
                            <div className="text-xs text-blue-600 mb-2 bg-blue-50 px-2 py-1 rounded">
                              Peer Responses: {submission.assignment.minResponsesRequired || 2} required, max {submission.assignment.maxResponsesPerVideo || 3} per video
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => analyzeWithAI(submission)}
                                disabled={isAIAnalyzing[submission.id]}
                                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                title="AI Analysis"
                              >
                                {isAIAnalyzing[submission.id] ? (
                                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <span>🤖</span>
                                )}
                                <span>AI</span>
                              </button>
                              
                              {/* Pin Button */}
                              <button
                                onClick={() => togglePin(submission.id)}
                                className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center space-x-1 ${
                                  submission.isPinned 
                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title={submission.isPinned ? 'Unpin submission' : 'Pin submission to top'}
                              >
                                <span>{submission.isPinned ? '📌' : '📍'}</span>
                                <span>{submission.isPinned ? 'Pinned' : 'Pin'}</span>
                              </button>
                              
                              {/* Highlight Button */}
                              <button
                                onClick={() => toggleHighlight(submission.id)}
                                className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center space-x-1 ${
                                  submission.isHighlighted 
                                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title={submission.isHighlighted ? 'Remove highlight' : 'Highlight submission'}
                              >
                                <span>{submission.isHighlighted ? '⭐' : '☆'}</span>
                                <span>{submission.isHighlighted ? 'Highlighted' : 'Highlight'}</span>
                              </button>
                              
                              {/* Delete Button */}
                              <button
                                onClick={() => setDeleteConfirm({ submissionId: submission.id, studentName: submission.studentName })}
                                className="px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors flex items-center space-x-1"
                                title="Delete this video submission"
                              >
                                <span>🗑️</span>
                                <span>Delete</span>
                              </button>
                              
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                                {getStatusText(submission.status)}
                              </span>
                              
                              {/* Timing Status Indicator */}
                              {(() => {
                                const timingStatus = getSubmissionTimingStatus(submission, submission.assignment?.dueDate);
                                return (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    timingStatus.color === 'green' 
                                      ? 'bg-green-100 text-green-800' 
                                      : timingStatus.color === 'yellow'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {timingStatus.text}
                                  </span>
                                );
                              })()}
                            </div>
                            {submission.grade && (
                              <span className="text-sm font-bold text-green-600">
                                Grade: {submission.grade}%
                              </span>
                            )}
                          </div>
                        </div>


                        {/* AI Grading Section - Compact */}
                        {index === currentSubmissionIndex && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center">
                                  <span className="text-white text-xs">🤖</span>
                                </div>
                                <span className="text-sm font-medium text-gray-700">AI Assistant</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => analyzeWithAI(submission)}
                                  disabled={isAIAnalyzing[submission.id]}
                                  className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                >
                                  {isAIAnalyzing[submission.id] ? (
                                    <>
                                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                      <span>Analyzing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>🤖</span>
                                      <span>Analyze</span>
                                    </>
                                  )}
                                </button>
                                
                                {aiSuggestions[submission.id] && (
                                  <button
                                    onClick={() => applyAISuggestions(submission.id)}
                                    className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center space-x-1"
                                  >
                                    <span>✓</span>
                                    <span>Apply</span>
                                  </button>
                                )}
                                
                                {aiSuggestions[submission.id] && (
                                  <button
                                    onClick={() => setShowAIPanel(prev => ({ ...prev, [submission.id]: !prev[submission.id] }))}
                                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                                  >
                                    {showAIPanel[submission.id] ? '▼' : '▶'}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Compact AI Analysis Panel */}
                            {showAIPanel[submission.id] && aiSuggestions[submission.id] && (
                              <div className="space-y-3">
                                {/* Compact Rubric Scores */}
                                <div className="grid grid-cols-4 gap-2">
                                  <div className="text-center p-2 bg-white rounded border">
                                    <div className="text-lg font-bold text-blue-600">
                                      {aiSuggestions[submission.id].rubric.contentQuality.earned}/{aiSuggestions[submission.id].rubric.contentQuality.possible}
                                    </div>
                                    <div className="text-xs text-gray-500">Content</div>
                                  </div>
                                  <div className="text-center p-2 bg-white rounded border">
                                    <div className="text-lg font-bold text-green-600">
                                      {aiSuggestions[submission.id].rubric.presentation.earned}/{aiSuggestions[submission.id].rubric.presentation.possible}
                                    </div>
                                    <div className="text-xs text-gray-500">Presentation</div>
                                  </div>
                                  <div className="text-center p-2 bg-white rounded border">
                                    <div className="text-lg font-bold text-purple-600">
                                      {aiSuggestions[submission.id].rubric.technicalAspects.earned}/{aiSuggestions[submission.id].rubric.technicalAspects.possible}
                                    </div>
                                    <div className="text-xs text-gray-500">Technical</div>
                                  </div>
                                  <div className="text-center p-2 bg-white rounded border">
                                    <div className="text-lg font-bold text-orange-600">
                                      {aiSuggestions[submission.id].rubric.engagement.earned}/{aiSuggestions[submission.id].rubric.engagement.possible}
                                    </div>
                                    <div className="text-xs text-gray-500">Engagement</div>
                                  </div>
                                </div>

                                {/* Compact Grade Suggestion */}
                                <div className="p-2 bg-white rounded border-l-2 border-blue-500">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Suggested Grade:</span>
                                    <span className="text-lg font-bold text-blue-600">{aiSuggestions[submission.id].suggestedGrade}%</span>
                                  </div>
                                </div>

                                {/* Compact Strengths and Improvements */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <h4 className="text-xs font-medium text-green-700 mb-1">Strengths</h4>
                                    <ul className="space-y-1">
                                      {aiSuggestions[submission.id].strengths.slice(0, 3).map((strength, idx) => (
                                        <li key={idx} className="text-xs text-gray-600 flex items-start space-x-1">
                                          <span className="text-green-500 mt-0.5">✓</span>
                                          <span>{strength}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-medium text-orange-700 mb-1">Improvements</h4>
                                    <ul className="space-y-1">
                                      {aiSuggestions[submission.id].improvements.slice(0, 3).map((improvement, idx) => (
                                        <li key={idx} className="text-xs text-gray-600 flex items-start space-x-1">
                                          <span className="text-orange-500 mt-0.5">•</span>
                                          <span>{improvement}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>

                                {/* Compact Feedback Preview */}
                                <div className="p-2 bg-gray-100 rounded">
                                  <h4 className="text-xs font-medium text-gray-700 mb-1">AI Feedback:</h4>
                                  <p className="text-xs text-gray-600 italic line-clamp-2">"{aiSuggestions[submission.id].suggestedFeedback}"</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Grading Form */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Grade (0-{submission.assignment?.maxPoints || submission.assignment?.maxScore || 100})
                            </label>
                            <input
                              type="number"
                              value={index === currentSubmissionIndex ? currentGrade : (submission.grade || '')}
                              onChange={(e) => {
                                // Allow editing for current submission
                                if (index === currentSubmissionIndex) {
                                  handleGradeChange(e.target.value ? Number(e.target.value) : '');
                                } else {
                                  // If they click on a non-current submission's input, select it
                                  setCurrentSubmissionIndex(index);
                                }
                              }}
                              onFocus={() => {
                                // When focusing an input, make sure this submission is selected
                                if (index !== currentSubmissionIndex) {
                                  setCurrentSubmissionIndex(index);
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              min="0"
                              max={submission.assignment?.maxPoints || submission.assignment?.maxScore || 100}
                              placeholder={`Enter grade (max: ${submission.assignment?.maxPoints || submission.assignment?.maxScore || 100})`}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Feedback
                            </label>
                            <textarea
                              value={index === currentSubmissionIndex ? currentFeedback : ''}
                              onChange={(e) => {
                                if (index === currentSubmissionIndex) {
                                  handleFeedbackChange(e.target.value);
                                }
                              }}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter detailed feedback for the student..."
                            />
                          </div>
                          
                          {/* Save Status Indicator */}
                          {index === currentSubmissionIndex && (
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                {saveStatus === 'saving' && (
                                  <>
                                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-blue-600">Saving...</span>
                                  </>
                                )}
                                {saveStatus === 'saved' && (
                                  <>
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-green-600">Saved</span>
                                  </>
                                )}
                                {saveStatus === 'error' && (
                                  <>
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <span className="text-red-600">Save failed</span>
                                  </>
                                )}
                              </div>
                              {lastSaved && (
                                <span className="text-gray-500 text-xs">
                                  Last saved: {lastSaved.toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Selection Button for Non-Active Submissions */}
                          {index !== currentSubmissionIndex && (
                            <button
                              onClick={() => goToSubmission(index)}
                              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                            >
                              Select This Submission
                            </button>
                          )}
                        </div>

                        {/* Student's Peer Responses (What THEY wrote to others) */}
                        {submission.assignment?.enablePeerResponses ? (
                          getPeerResponsesForStudent(submission.studentId).length > 0 ? (
                          <div className="border border-indigo-200 rounded-lg overflow-hidden mb-4">
                            {/* Collapsible Header */}
                            <button
                              onClick={() => togglePeerResponsesCollapse(submission.id)}
                              className="w-full flex items-center justify-between p-4 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-semibold text-indigo-700">
                                  💬 Student's Peer Responses
                                </span>
                                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                                  {getPeerResponsesForStudent(submission.studentId).length}
                                </span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-xs text-gray-500">
                                  Part of assignment rubric
                                </span>
                                <svg
                                  className={`w-5 h-5 text-indigo-600 transition-transform ${
                                    collapsedPeerResponses.has(submission.id) ? '' : 'rotate-180'
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </button>

                            {/* Collapsible Content */}
                            {!collapsedPeerResponses.has(submission.id) && (
                              <div className="divide-y divide-indigo-100">
                                {getPeerResponsesForStudent(submission.studentId).map((response: any, idx: number) => (
                                  <div key={response.responseId || idx} className="p-4 bg-white">
                                    {/* Response Header with Video Link */}
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <span className="text-xs font-medium text-gray-700">
                                            Response #{idx + 1}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {new Date(response.submittedAt).toLocaleDateString()}
                                          </span>
                                        </div>
                                        
                                        {/* Video Link - Compact */}
                                        {response.videoId && (
                                          <a
                                            href={`#video-${response.videoId}`}
                                            className="inline-flex items-center space-x-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                                            title="View the video this response is about"
                                          >
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                                            </svg>
                                            <span>
                                              Responding to: {response.videoTitle || 'Peer Video'}
                                            </span>
                                          </a>
                                        )}
                                      </div>
                                      
                                      {/* Word/Char Count */}
                                      <div className="text-xs text-gray-500 text-right">
                                        <div>{response.wordCount || 0} words</div>
                                        <div>{response.characterCount || 0} chars</div>
                                      </div>
                                    </div>
                                    
                                    {/* Response Content */}
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {response.content}
                                      </p>
                                    </div>
                                    
                                    {/* Response Quality Indicators */}
                                    <div className="flex items-center space-x-3 mt-3">
                                      {/* Meets minimum requirement */}
                                      {submission.assignment?.responseWordLimit && (
                                        <span className={`text-xs px-2 py-1 rounded ${
                                          (response.wordCount || 0) >= (submission.assignment.responseWordLimit || 50)
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                          {(response.wordCount || 0) >= (submission.assignment.responseWordLimit || 50) ? '✓' : '✗'} Word count
                                        </span>
                                      )}
                                      
                                      {response.isSubmitted && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                          ✓ Submitted
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                
                                {/* Summary Stats */}
                                <div className="p-4 bg-indigo-50">
                                  <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                      <div className="text-lg font-bold text-indigo-700">
                                        {getPeerResponsesForStudent(submission.studentId).length}
                                      </div>
                                      <div className="text-xs text-gray-600">Total Responses</div>
                                    </div>
                                    <div>
                                      <div className="text-lg font-bold text-green-700">
                                        {getPeerResponsesForStudent(submission.studentId).filter((r: any) => r.isSubmitted).length}
                                      </div>
                                      <div className="text-xs text-gray-600">Submitted</div>
                                    </div>
                                    <div>
                                      <div className="text-lg font-bold text-blue-700">
                                        {Math.round(
                                          getPeerResponsesForStudent(submission.studentId)
                                            .reduce((sum: number, r: any) => sum + (r.wordCount || 0), 0) / 
                                          Math.max(1, getPeerResponsesForStudent(submission.studentId).length)
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
                            // Student has NOT submitted any peer responses (but they were required)
                            <div className="border border-red-200 rounded-lg overflow-hidden mb-4 bg-red-50">
                              <div className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-red-800 mb-1">
                                      ⚠️ No Peer Responses Submitted
                                    </h3>
                                    <p className="text-xs text-red-700">
                                      This student has not submitted any peer responses yet.
                                      {submission.assignment?.minResponsesRequired && (
                                        <> Required: {submission.assignment.minResponsesRequired} response{submission.assignment.minResponsesRequired > 1 ? 's' : ''}</>
                                      )}
                                    </p>
                                  </div>
                                  <div className="flex-shrink-0">
                                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                                      Incomplete
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        ) : (
                          // Peer responses NOT required for this assignment
                          <div className="border border-gray-200 rounded-lg overflow-hidden mb-4 bg-gray-50">
                            <div className="p-3">
                              <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs text-gray-600">
                                  Peer responses not required for this assignment
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Peer Response Analytics - Only show for current submission */}
                        {index === currentSubmissionIndex && submission.peerResponses && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-blue-800 flex items-center">
                                <span className="mr-2">👥</span>
                                Peer Response Analytics
                              </h3>
                              <button
                                onClick={() => analyzePeerResponsesWithAI(submission)}
                                disabled={isAIAnalyzing[`peer-${submission.id}`]}
                                className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                title="AI Analysis for Peer Responses"
                              >
                                {isAIAnalyzing[`peer-${submission.id}`] ? (
                                  <>
                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Analyzing...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>🤖</span>
                                    <span>AI Assist</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-blue-700 font-medium">Responses Given:</span>
                                <span className="ml-2 text-blue-900">
                                  {submission.peerResponses.submittedResponses}/{submission.peerResponses.totalResponses}
                                </span>
                              </div>
                              <div>
                                <span className="text-blue-700 font-medium">Avg. Length:</span>
                                <span className="ml-2 text-blue-900">
                                  {submission.peerResponses.averageResponseLength} words
                                </span>
                              </div>
                              <div>
                                <span className="text-blue-700 font-medium">Quality:</span>
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                  submission.peerResponses.responseQuality === 'excellent' 
                                    ? 'bg-green-100 text-green-800'
                                    : submission.peerResponses.responseQuality === 'good'
                                    ? 'bg-blue-100 text-blue-800'
                                    : submission.peerResponses.responseQuality === 'adequate'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {submission.peerResponses.responseQuality.replace('_', ' ')}
                                </span>
                              </div>
                              <div>
                                <span className="text-blue-700 font-medium">Last Response:</span>
                                <span className="ml-2 text-blue-900">
                                  {submission.peerResponses.lastResponseDate 
                                    ? new Date(submission.peerResponses.lastResponseDate).toLocaleDateString()
                                    : 'N/A'
                                  }
                                </span>
                              </div>
                            </div>
                            {submission.peerResponses.submittedResponses < 2 && (
                              <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
                                ⚠️ Student needs to complete more peer responses (minimum 2 required)
                              </div>
                            )}
                          </div>
                        )}

                        {/* Student's Peer Responses - Only show for current submission */}
                        {index === currentSubmissionIndex && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                              <span className="mr-2">💬</span>
                              Student's Peer Responses
                            </h3>
                            <div className="space-y-3">
                              {getPeerResponsesForStudent(submission.studentId).map((response, responseIndex) => (
                                <div key={response.id} className="bg-white rounded-lg p-3 border border-gray-200">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs font-medium text-gray-600">
                                        Response to: {response.reviewedStudentName}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(response.displayDate || response.submittedAt || response.createdAt).toLocaleDateString()}
                                      </span>
                                      {/* Video Link */}
                                      <a
                                        href={`/instructor/grading/bulk?assignment=${submission.assignmentId}&course=${submission.courseCode}&submission=${response.videoId}`}
                                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                                        title="View the video this response is about"
                                      >
                                        📹 View Video
                                      </a>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      response.isSubmitted 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {response.isSubmitted ? 'Submitted' : 'Draft'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    {response.content}
                                  </p>
                                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                      <span>{response.wordCount} words</span>
                                      <span>{response.characterCount} characters</span>
                                      {response.qualityScore && (
                                        <span className="font-medium">
                                          Quality: {response.qualityScore}/5
                                        </span>
                                      )}
                                    </div>
                                    {response.aiGrade && (
                                      <div className="flex items-center space-x-1 text-xs">
                                        <span className="text-gray-500">AI Grade:</span>
                                        <span className="font-medium text-blue-600">
                                          {response.aiGrade.overallGrade}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                              
                              {getPeerResponsesForStudent(submission.studentId).length === 0 && (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                  <span className="mr-2">📝</span>
                                  No peer responses submitted yet
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Grading Modal */}
      {showBulkGrading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Bulk Grade Submissions</h3>
                <p className="text-sm text-gray-600">
                  Apply grade and/or feedback to {selectedSubmissions.size} selected submission{selectedSubmissions.size !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="bulkGrade" className="block text-sm font-medium text-gray-700 mb-1">
                  Grade (0-100)
                </label>
                <input
                  type="number"
                  id="bulkGrade"
                  min="0"
                  max="100"
                  value={bulkGrade}
                  onChange={(e) => setBulkGrade(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005587] focus:border-transparent"
                  placeholder="Enter grade (optional)"
                />
              </div>

              <div>
                <label htmlFor="bulkFeedback" className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback
                </label>
                <textarea
                  id="bulkFeedback"
                  value={bulkFeedback}
                  onChange={(e) => setBulkFeedback(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005587] focus:border-transparent resize-y"
                  placeholder="Enter feedback to apply to all selected submissions (optional)"
                />
              </div>

              <div className="text-xs text-gray-500">
                Note: Only fields with values will be applied. Empty fields will leave existing values unchanged.
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowBulkGrading(false);
                  setBulkGrade('');
                  setBulkFeedback('');
                }}
                disabled={isBulkGrading}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkGrading}
                disabled={isBulkGrading || (!bulkGrade && !bulkFeedback.trim())}
                className="flex-1 px-4 py-2 bg-[#005587] text-white rounded-lg hover:bg-[#003d5c] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulkGrading ? 'Applying...' : 'Apply to All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Video Submission?</h3>
                <p className="text-sm text-gray-600">
                  Delete {deleteConfirm.studentName}'s video submission
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-4">
              This action cannot be undone. The video file and all associated data will be permanently removed.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmission}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </InstructorRoute>
  );
};

export default BulkGradingPage;

