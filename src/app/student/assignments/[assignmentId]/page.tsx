'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import AssignmentResourcesDisplay from '@/components/common/AssignmentResourcesDisplay';
import { htmlToPlainText } from '@/lib/htmlUtils';

interface Assignment {
  assignmentId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  status: 'upcoming' | 'past_due' | 'completed';
  submissionType: 'text' | 'file' | 'video';
  assignmentType: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  instructor: string;
  createdAt: string;
  resources?: any[];
  isSubmitted: boolean;
  submittedAt?: string;
  grade?: number;
  feedback?: string;
  minResponsesRequired?: number;
  maxResponsesPerVideo?: number;
  enablePeerResponses?: boolean;
}

interface Submission {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  courseId: string;
  videoUrl: string;
  videoTitle: string;
  videoDescription: string;
  duration: number;
  fileName: string;
  fileSize: number;
  status: string;
    submittedAt: string;
  studentName: string;
  studentEmail: string;
  grade?: number;
  instructorFeedback?: string;
  gradedAt?: string;
}

interface PeerVideo {
  id: string;
  studentId: string;
  studentName: string;
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  duration: number;
  submittedAt: string;
}

const StudentAssignmentDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [peerVideos, setPeerVideos] = useState<PeerVideo[]>([]);
  const [peerResponses, setPeerResponses] = useState<any[]>([]);
  const [responsesToMySubmission, setResponsesToMySubmission] = useState<any[]>([]);
  const [showResponsesDropdown, setShowResponsesDropdown] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{[key: string]: string}>({});

  const assignmentId = params.assignmentId as string;

  const fetchAssignmentDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching assignment details for:', assignmentId);

      // First try to get assignment from student assignments API
      console.log('Trying student assignments API...');
      const response = await fetch(`/api/student/assignments?userId=${user?.id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Student assignments API response:', data);
        const foundAssignment = data.assignments?.find((a: Assignment) => a.assignmentId === assignmentId);
        
        if (foundAssignment) {
          console.log('Found assignment in student assignments:', foundAssignment);
          setAssignment(foundAssignment);
          return;
        } else {
          console.log('Assignment not found in student assignments');
        }
      } else {
        console.log('Student assignments API failed:', response.status, response.statusText);
      }

      // If not found in student assignments, try the direct assignment API
      console.log('Trying direct assignment API...');
      const directResponse = await fetch(`/api/assignments/${assignmentId}`, {
        credentials: 'include',
      });

      if (directResponse.ok) {
        const directData = await directResponse.json();
        console.log('Direct assignment API response:', directData);
        const foundAssignment = directData.success ? directData.data?.assignment : null;
        
        if (foundAssignment) {
          console.log('Found assignment via direct API:', foundAssignment);
          // Transform the assignment to match our interface
          const transformedAssignment: Assignment = {
            assignmentId: foundAssignment.assignmentId,
            title: foundAssignment.title,
            description: foundAssignment.description,
            dueDate: foundAssignment.dueDate,
            points: foundAssignment.maxScore || 100,
            status: 'upcoming',
            submissionType: foundAssignment.assignmentType === 'video' ? 'video' : 'file',
            assignmentType: foundAssignment.assignmentType,
            courseId: foundAssignment.courseId || foundAssignment.course?.id,
            courseName: foundAssignment.courseName || foundAssignment.course?.name || 'Unknown Course',
            courseCode: foundAssignment.courseCode || foundAssignment.course?.code || 'N/A',
            instructor: foundAssignment.instructor || foundAssignment.course?.instructor?.name || 'Unknown Instructor',
            createdAt: foundAssignment.createdAt,
            resources: foundAssignment.resources || [],
            isSubmitted: false,
            enablePeerResponses: foundAssignment.enablePeerResponses || false,
            minResponsesRequired: foundAssignment.minResponsesRequired || 0,
            maxResponsesPerVideo: foundAssignment.maxResponsesPerVideo || 0,
          };
          setAssignment(transformedAssignment);
          return;
        } else {
          console.log('Assignment not found via direct API');
        }
      } else {
        console.log('Direct assignment API failed:', directResponse.status, directResponse.statusText);
      }

      console.log('Assignment not found in any API');
      throw new Error(`Assignment ${assignmentId} not found`);
    } catch (err) {
      console.error('Error fetching assignment details:', err);
      setError(`Failed to load assignment details: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, user?.id]);

  const fetchSubmission = React.useCallback(async () => {
    try {
      console.log('Fetching submission for assignment:', assignmentId, 'student:', user?.id);
      const response = await fetch(`/api/assignments/${assignmentId}/submissions?studentId=${user?.id}`, {
        credentials: 'include',
      });

      console.log('Submission API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Submission API response data:', data);
        if (data.success && data.submissions && data.submissions.length > 0) {
          console.log('Found submission:', data.submissions[0]);
          setSubmission(data.submissions[0]); // Get the first (and should be only) submission for this student
        } else {
          console.log('No submissions found');
        }
      } else {
        console.log('Submission API failed:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Error fetching submission:', err);
      // Don't set error for submission fetch failure
    }
  }, [assignmentId, user?.id]);

  const fetchPeerVideos = React.useCallback(async () => {
    try {
      const response = await fetch(
        `/api/student/community/submissions?assignmentId=${assignmentId}&studentId=${user?.id}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const submissions = await response.json();
        const videos: PeerVideo[] = submissions.slice(0, 6).map((sub: any) => ({
          id: sub.submissionId || sub.id,
          studentId: sub.studentId,
          studentName: sub.studentName || 'Unknown Student',
          videoUrl: sub.videoUrl,
          thumbnailUrl: sub.thumbnailUrl || '/api/placeholder/300/200',
          title: sub.videoTitle || 'Video Submission',
          duration: sub.duration || 0,
          submittedAt: sub.submittedAt || sub.createdAt
        }));
        setPeerVideos(videos);
      }
    } catch (error) {
      console.error('Error fetching peer videos:', error);
    }
  }, [assignmentId, user?.id]);

  const fetchPeerResponses = React.useCallback(async () => {
    try {
      const response = await fetch(
        `/api/peer-responses?assignmentId=${assignmentId}&studentId=${user?.id}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setPeerResponses(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching peer responses:', error);
    }
  }, [assignmentId, user?.id]);

  const fetchResponsesToMySubmission = React.useCallback(async () => {
    if (!submission) return;
    
    try {
      const response = await fetch(
        `/api/peer-responses?videoId=${submission.submissionId}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        const allResponses = data.data || [];
        
        // Filter to only show top-level responses (threadLevel 0)
        // Replies are already nested within the responses
        const topLevelResponses = allResponses.filter((r: any) => 
          r.threadLevel === 0 || r.threadLevel === undefined
        );
        
        console.log('📊 Responses fetched:', allResponses.length, 'total,', topLevelResponses.length, 'top-level');
        setResponsesToMySubmission(topLevelResponses);
      }
    } catch (error) {
      console.error('Error fetching responses to my submission:', error);
    }
  }, [submission?.submissionId]);

  useEffect(() => {
    if (assignmentId && user?.id) {
      fetchAssignmentDetails();
      fetchSubmission();
      fetchPeerVideos();
      fetchPeerResponses();
    }
  }, [assignmentId, user?.id, fetchAssignmentDetails, fetchSubmission, fetchPeerVideos, fetchPeerResponses]);

  // Fetch responses to the student's submission when it's loaded
  useEffect(() => {
    if (submission) {
      fetchResponsesToMySubmission();
    }
  }, [submission?.submissionId, fetchResponsesToMySubmission]);

  // Compute assignment status dynamically without storing in state to avoid infinite loops
  const getComputedAssignment = React.useMemo(() => {
    if (!assignment) return null;
    
    if (submission) {
      // Check if peer responses are required
      const peerResponsesRequired = assignment.enablePeerResponses && (assignment.minResponsesRequired || 0) > 0;
      const peerResponsesComplete = !peerResponsesRequired || 
        peerResponses.length >= (assignment.minResponsesRequired || 0);
      
      // Assignment is only completed if both submission AND peer responses are done
      const isComplete = submission && peerResponsesComplete;
      const computedStatus = isComplete ? 'completed' : 'upcoming';
      
      return {
        ...assignment,
        status: computedStatus as 'upcoming' | 'past_due' | 'completed',
        isSubmitted: true,
        submittedAt: submission.submittedAt
      };
    }
    
    return assignment;
  }, [assignment, submission, peerResponses]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '📋';
      case 'past_due':
        return '⚠️';
      case 'completed':
        return '✅';
      default:
        return '📝';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReplySubmit = async (parentResponseId: string) => {
    const replyContent = replyText[parentResponseId];
    if (!replyContent || replyContent.trim().length < 20) {
      alert('Reply must be at least 20 characters.');
      return;
    }

    try {
      const response = await fetch('/api/peer-responses/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          parentResponseId,
          videoId: submission?.submissionId,
          assignmentId,
          reviewerId: user?.id,
          reviewerName: `${user?.firstName} ${user?.lastName}`,
          content: replyContent.trim(),
        })
      });

      if (response.ok) {
        // Refresh responses
        await fetchResponsesToMySubmission();
        setReplyText(prev => ({ ...prev, [parentResponseId]: '' }));
        setReplyingTo(null);
        alert('Reply posted successfully!');
      } else {
        alert('Failed to post reply. Please try again.');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Failed to post reply. Please try again.');
    }
  };

  const getTimeRemaining = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();
    
    if (diff <= 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days, ${hours} hours`;
    return `${hours} hours`;
  };

  if (loading) {
    return (
      <StudentRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading assignment...</p>
          </div>
        </div>
      </StudentRoute>
    );
  }

  // Use computed assignment for rendering
  const displayAssignment = getComputedAssignment;

  if (error || !displayAssignment) {
    return (
      <StudentRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <EmptyState
            icon="assignment"
            title="Assignment Not Found"
            description="The requested assignment could not be found or you don't have access to it."
            action={{
              label: "Go Back",
              onClick: () => router.back(),
              variant: 'primary'
            }}
          />
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Go back"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-10 h-10 bg-[#005587] rounded-full flex items-center justify-center text-white font-bold text-lg">
                📝
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">{displayAssignment.title}</h1>
                <p className="text-xs text-gray-600 truncate">
                  {displayAssignment.courseCode} • {displayAssignment.instructor}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(displayAssignment.status)}`}>
                {getStatusIcon(displayAssignment.status)} {displayAssignment.status.replace('_', ' ')}
              </span>
              <button
                onClick={() => router.push('/student/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Home Dashboard"
              >
                <span className="text-xl">🏠</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            {/* Assignment Title */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{displayAssignment.title}</h2>
              <p className="text-gray-600">
                {displayAssignment.courseCode} • {displayAssignment.courseName}
              </p>
            </div>

            {/* Assignment Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {submission?.grade !== undefined && submission?.grade !== null 
                        ? `${submission.grade}` 
                        : '—'
                      } / {displayAssignment.points}
                    </div>
                    <div className="text-sm text-gray-600">Score</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">
                      {getTimeRemaining(displayAssignment.dueDate)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Due: {new Date(displayAssignment.dueDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Time Remaining</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                  {displayAssignment.isSubmitted ? '✓' : '○'}
                    </div>
                    <div className="text-sm text-gray-600">Submission</div>
                  </div>
                  {/* Show Peer Reviews card if enabled OR if there are peer videos/responses */}
                  {((displayAssignment.enablePeerResponses && (displayAssignment.minResponsesRequired || 0) > 0) || 
                    peerVideos.length > 0 || 
                    peerResponses.length > 0) && (
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {peerResponses.length} of {displayAssignment.minResponsesRequired || peerVideos.length || 2}
                      </div>
                      <div className="text-sm text-gray-600">Peer Reviews</div>
                    </div>
                  )}
                </div>

            {/* Assignment Details */}
            <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h3>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                    {htmlToPlainText(displayAssignment.description)}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Submission Type</h3>
                    <p className="text-gray-700 capitalize">{displayAssignment.submissionType}</p>
              </div>

              {displayAssignment.resources && displayAssignment.resources.length > 0 && (
                        <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Resources</h3>
                  <AssignmentResourcesDisplay resources={displayAssignment.resources} />
            </div>
          )}

              {/* Submission Status */}
              {submission ? (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Submitted</h3>
                  <p className="text-green-700 mb-4">
                    You submitted this assignment on {formatDate(submission.submittedAt)}.
                  </p>
                  
                  {/* Video Submission Display */}
                  <div className="mt-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-2">Your Submission</h4>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="aspect-video bg-black rounded-lg overflow-hidden mb-3 relative">
                        <video
                          controls
                          className="w-full h-full object-cover"
                          src={submission.videoUrl}
                          poster={videoThumbnail || submission.thumbnailUrl || undefined}
                          preload="metadata"
                          onLoadedMetadata={(e) => {
                            const video = e.currentTarget;
                            setVideoLoaded(true);
                            if (video.duration && !isNaN(video.duration)) {
                              setVideoDuration(Math.floor(video.duration));
                            }
                            
                            // Generate thumbnail from first frame if not already generated
                            if (!videoThumbnail) {
                              video.currentTime = 0.1;
                            }
                          }}
                          onSeeked={(e) => {
                            const video = e.currentTarget;
                            if (!videoThumbnail && video.currentTime < 1) {
                              const canvas = document.createElement('canvas');
                              canvas.width = 400;
                              canvas.height = 300;
                              const ctx = canvas.getContext('2d');
                              if (ctx) {
                                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
                                setVideoThumbnail(thumbnail);
                              }
                            }
                          }}
                          onError={() => {
                            console.error('Video failed to load');
                            setVideoLoaded(false);
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                        {!videoLoaded && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="text-white text-sm">Loading video...</div>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <p><strong>Title:</strong> {submission.videoTitle}</p>
                        <p><strong>Duration:</strong> {
                          (() => {
                            const duration = videoDuration ?? submission.duration;
                            if (duration > 0) {
                              return `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
                            }
                            return 'Loading...';
                          })()
                        }</p>
                        <p><strong>File Size:</strong> {(submission.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                        {submission.videoDescription && (
                          <p><strong>Description:</strong> {submission.videoDescription}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Grade and Feedback Display */}
                  {(submission.grade !== undefined && submission.grade !== null) ? (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-[#005587]/30">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-md font-semibold text-blue-900 flex items-center">
                          <span className="mr-2">📊</span>
                          Your Grade
                        </h4>
                        <div className="text-2xl font-bold text-blue-600">
                          {submission.grade}%
                        </div>
                      </div>
                      {submission.instructorFeedback && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-blue-100">
                          <h5 className="text-sm font-semibold text-gray-700 mb-2">Instructor Feedback:</h5>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.instructorFeedback}</p>
                        </div>
                      )}
                      <div className="mt-2 text-xs text-blue-600">
                        ✅ Graded on {new Date(submission.gradedAt || submission.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center text-yellow-800">
                        <span className="mr-2">⏳</span>
                        <p className="text-sm font-medium">Waiting for instructor to grade your submission</p>
                      </div>
                    </div>
                  )}

                  {/* Peer Responses to My Submission - Threaded Discussions */}
                  {submission && responsesToMySubmission.length > 0 && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowResponsesDropdown(!showResponsesDropdown)}
                        className="w-full flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-[#005587] transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">💬</span>
                          <h4 className="text-md font-semibold text-gray-800">
                            Peer Responses to Your Video ({responsesToMySubmission.length})
                          </h4>
                        </div>
                        <svg className={`w-5 h-5 text-gray-400 transition-transform ${showResponsesDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showResponsesDropdown && (
                        <div className="mt-2 space-y-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                          {responsesToMySubmission.map((response) => (
                            <div key={response.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              {/* Main Response */}
                              <div className="p-4">
                                <div className="flex items-start space-x-3 mb-3">
                                  <div className="w-8 h-8 bg-[#005587] rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    {response.reviewerName?.charAt(0) || '?'}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <h5 className="font-semibold text-gray-900 text-sm">{response.reviewerName || 'Anonymous'}</h5>
                                      <span className="text-xs text-gray-500">
                                        {new Date(response.submittedAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{response.content}</p>
                                  </div>
                                </div>

                                {/* Reply Button */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                  <button
                                    onClick={() => setReplyingTo(replyingTo === response.id ? null : response.id)}
                                    className="text-sm text-[#005587] hover:text-[#003d5c] font-medium"
                                  >
                                    {replyingTo === response.id ? 'Cancel' : '💬 Reply'}
                                  </button>
                                  {response.replies && response.replies.length > 0 && (
                                    <span className="text-xs text-gray-500">
                                      {response.replies.length} {response.replies.length === 1 ? 'reply' : 'replies'}
                                    </span>
                                  )}
                                </div>

                                {/* Reply Form */}
                                {replyingTo === response.id && (
                                  <div className="mt-3 pt-3 border-t border-gray-100">
                                    <textarea
                                      value={replyText[response.id] || ''}
                                      onChange={(e) => setReplyText(prev => ({ ...prev, [response.id]: e.target.value }))}
                                      placeholder="Write your reply... (minimum 20 characters)"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005587] focus:border-transparent resize-none text-sm"
                                      rows={3}
                                    />
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-xs text-gray-500">
                                        {(replyText[response.id] || '').length} characters
                                      </span>
                                      <button
                                        onClick={() => handleReplySubmit(response.id)}
                                        disabled={!replyText[response.id] || replyText[response.id].length < 20}
                                        className="px-4 py-2 bg-[#005587] text-white rounded-lg hover:bg-[#003d5c] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                      >
                                        Post Reply
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Threaded Replies */}
                              {response.replies && response.replies.length > 0 && (
                                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                                  <div className="space-y-3 pl-4 border-l-2 border-[#FFC72C]/30">
                                    {response.replies.map((reply: any) => (
                                      <div key={reply.id} className="bg-white rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-start space-x-2">
                                          <div className="w-6 h-6 bg-[#FFC72C] rounded-full flex items-center justify-center text-[#003d5c] text-xs font-bold">
                                            {reply.reviewerName?.charAt(0) || '?'}
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                              <h6 className="font-semibold text-gray-900 text-xs">{reply.reviewerName || 'Anonymous'}</h6>
                                              <span className="text-xs text-gray-500">
                                                {new Date(reply.submittedAt).toLocaleDateString()}
                                              </span>
                                            </div>
                                            <p className="text-xs text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">📝 Not Submitted</h3>
                  <p className="text-yellow-700 mb-4">
                    You haven't submitted this assignment yet. Make sure to submit before the due date.
                    </p>
                    <button
                    onClick={() => router.push(`/student/video-submission?assignmentId=${assignmentId}&courseId=${displayAssignment.courseId}`)}
                      className="px-6 py-3 bg-[#005587] text-white rounded-lg hover:bg-[#003d5c] hover:shadow-lg transition-all duration-200 font-semibold"
                    >
                    <span className="mr-2">🎥</span>
                    Submit Assignment
                    </button>
                </div>
              )}
            </div>
          </div>

          {/* Peer Submission Reels - Show if submission exists and there are peer videos */}
          {submission && peerVideos.length > 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Classmate Submissions</h3>
                  <p className="text-sm text-gray-600">Watch and respond to earn full credit</p>
                </div>
                <button
                  onClick={() => router.push(`/student/peer-reviews?assignmentId=${assignmentId}`)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium cursor-pointer"
                >
                  Review & Respond →
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {peerVideos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => router.push(`/student/peer-reviews?assignmentId=${assignmentId}&videoId=${video.id}`)}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="relative bg-black rounded-t-lg overflow-hidden aspect-video">
                      <video
                        src={video.videoUrl}
                        className="w-full h-full object-cover"
                        preload="metadata"
                        poster={video.thumbnailUrl !== '/api/placeholder/300/200' ? video.thumbnailUrl : undefined}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all">
                        <div className="bg-white bg-opacity-0 group-hover:bg-opacity-90 rounded-full p-2 transition-all">
                          <svg className="w-6 h-6 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-900 truncate">{video.studentName}</p>
                      <p className="text-xs text-gray-500 truncate">{video.title}</p>
                      {peerResponses.some(r => r.videoId === video.id) && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          ✓ Reviewed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {peerResponses.length < (displayAssignment.minResponsesRequired || 0) && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Required:</strong> Review {displayAssignment.minResponsesRequired} peer submissions to complete this assignment. 
                    You've completed {peerResponses.length} of {displayAssignment.minResponsesRequired}.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </StudentRoute>
  );
};

export default StudentAssignmentDetailPage;