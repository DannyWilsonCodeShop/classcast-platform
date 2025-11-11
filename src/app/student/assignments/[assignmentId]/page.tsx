'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import AssignmentResourcesDisplay from '@/components/common/AssignmentResourcesDisplay';
import RichTextRenderer from '@/components/common/RichTextRenderer';
import { getVideoUrl } from '@/lib/videoUtils';

// Helper function to extract YouTube video ID
function extractYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Handle youtube.com/watch?v=... format
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    }
    // Handle youtu.be/... format
    if (urlObj.hostname === 'youtu.be') {
      // Extract video ID from pathname and strip any trailing query params
      const videoId = urlObj.pathname.substring(1).split('?')[0];
      return videoId || null;
    }
    return null;
  } catch {
    return null;
  }
}

// Helper function to check if URL is a YouTube URL
function isYouTubeUrl(url: string): boolean {
  return url?.includes('youtube.com') || url?.includes('youtu.be');
}

// VideoThumbnail component for better thumbnail handling
const VideoThumbnail: React.FC<{
  videoUrl: string;
  thumbnailUrl?: string;
  studentName: string;
  className?: string;
}> = ({ videoUrl, thumbnailUrl, studentName, className = "" }) => {
  const [showFallback, setShowFallback] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // If we have a valid thumbnail URL, try to use it first
  if (thumbnailUrl && thumbnailUrl !== '/api/placeholder/300/200' && !showFallback) {
    return (
      <div className="relative w-full h-full">
        <img
          src={thumbnailUrl}
          alt={`${studentName}'s video`}
          className={className}
          onError={() => setShowFallback(true)}
          onLoad={() => setImageLoaded(true)}
        />
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-lg mb-1">📷</div>
              <div className="text-xs">Loading...</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback to video element with poster frame
  return (
    <div className="relative w-full h-full">
      <video
        src={`${getVideoUrl(videoUrl)}#t=2`}
        className={className}
        preload="metadata"
        playsInline
        webkit-playsinline="true"
        muted
        onLoadedData={(e) => {
          const videoEl = e.target as HTMLVideoElement;
          if (videoEl.duration > 2) {
            videoEl.currentTime = 2;
          }
          setVideoLoaded(true);
        }}
        onError={() => {
          console.log('Video failed to load for', studentName);
          setVideoLoaded(false);
        }}
      />
      
      {/* Loading state and fallback gradient */}
      {!videoLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-2xl mb-1">🎥</div>
            <div className="text-xs font-medium">{studentName}</div>
          </div>
        </div>
      )}
    </div>
  );
};

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
  hidePeerVideosUntilInstructorPosts?: boolean; // Hide peer videos until student submits
  instructionalVideoUrl?: string; // NEW: Instructor's explanation video
}

interface Submission {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  courseId: string;
  videoUrl: string;
  youtubeUrl?: string;
  isYouTube?: boolean;
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
  thumbnailUrl?: string;
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
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [nextAssignment, setNextAssignment] = useState<Assignment | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        
        // Store all assignments for next assignment functionality
        if (data.assignments) {
          setAllAssignments(data.assignments);
          
          // Find current assignment index and determine next assignment
          const currentIndex = data.assignments.findIndex((a: Assignment) => a.assignmentId === assignmentId);
          if (currentIndex !== -1 && currentIndex < data.assignments.length - 1) {
            setNextAssignment(data.assignments[currentIndex + 1]);
          } else {
            setNextAssignment(null);
          }
        }
        
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
            hidePeerVideosUntilInstructorPosts: foundAssignment.hidePeerVideosUntilInstructorPosts || false,
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
        `/api/student/community/submissions?assignmentId=${assignmentId}&studentId=${user?.id}&excludeCurrentUser=true`,
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

  // Delete submission handler - using simple POST endpoint to avoid params issues
  const handleDeleteSubmission = async () => {
    if (!submission?.submissionId) {
      console.error('No submission ID available for deletion');
      alert('Unable to delete: No submission found.');
      return;
    }
    
    setIsDeleting(true);
    try {
      console.log('🗑️ Deleting submission:', submission.submissionId);
      const response = await fetch('/api/delete-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          submissionId: submission.submissionId
        }),
      });

      const data = await response.json();
      console.log('Delete response:', response.status, data);

      if (response.ok && data.success) {
        console.log('✅ Submission deleted successfully');
        // Clear the submission state immediately
        setSubmission(null);
        setShowDeleteConfirm(false);
        setResponsesToMySubmission([]);
        
        // Refresh the page data
        await Promise.all([
          fetchSubmission(),
          fetchPeerVideos(),
          fetchPeerResponses()
        ]);
        
        // Show success message
        alert('Submission deleted successfully!');
      } else {
        console.error('Failed to delete submission:', response.status, data);
        const errorMessage = data.error || data.message || 'Failed to delete submission. Please try again.';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('An error occurred while deleting. Please check your connection and try again.');
    } finally {
      setIsDeleting(false);
    }
  };

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

            {/* Submit Assignment Section - Moved to Top */}
            {!submission && (
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-blue-900 mb-2 flex items-center">
                      <span className="mr-2">🎥</span>
                      Ready to Submit?
                    </h3>
                    <p className="text-blue-700 mb-4">
                      You haven't submitted this assignment yet. Click below to record and submit your video.
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-blue-600">
                      <span className="flex items-center">
                        📅 Due: {new Date(displayAssignment.dueDate).toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="flex items-center">
                        ⭐ Worth: {displayAssignment.points} points
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/student/video-submission?assignmentId=${assignmentId}&courseId=${displayAssignment.courseId}`)}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl transition-all duration-200 font-bold text-lg flex items-center space-x-2"
                  >
                    <span>🎥</span>
                    <span>Submit Assignment</span>
                  </button>
                </div>
              </div>
            )}

            {/* Assignment Details */}
            <div className="space-y-6">
                  {/* Instructional Video */}
                  {displayAssignment.instructionalVideoUrl && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="mr-2">🎬</span>
                        Watch This First: Assignment Explanation
                      </h3>
                      <div className="bg-purple-50 border-2 border-purple-200 rounded-xl overflow-hidden">
                        <div className="aspect-video bg-black">
                          {displayAssignment.instructionalVideoUrl.includes('youtube.com') || displayAssignment.instructionalVideoUrl.includes('youtu.be') ? (
                            <iframe
                              src={displayAssignment.instructionalVideoUrl.replace('watch?v=', 'embed/')}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <video
                              controls
                              className="w-full h-full"
                              preload="metadata"
                              playsInline
                              webkit-playsinline="true"
                              crossOrigin="anonymous"
                            >
                              <source src={getVideoUrl(displayAssignment.instructionalVideoUrl)} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          )}
                        </div>
                        <div className="p-4 bg-purple-100">
                          <p className="text-sm text-purple-800 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            Your instructor created this video to explain the assignment requirements
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h3>
                    <RichTextRenderer 
                      content={displayAssignment.description}
                      className="prose prose-sm max-w-none"
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Submission Type</h3>
                    <p className="text-gray-700 capitalize">{displayAssignment.submissionType}</p>
                  </div>

                  {/* Peer Video Policy Notice */}
                  {displayAssignment.enablePeerResponses && displayAssignment.hidePeerVideosUntilInstructorPosts && !submission && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-blue-800">Peer Video Access</h4>
                          <p className="mt-1 text-sm text-blue-700">
                            You'll be able to view and respond to your classmates' videos after you submit your own work. 
                            This ensures everyone completes their assignment before seeing peer submissions.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

              {displayAssignment.resources && displayAssignment.resources.length > 0 && (
                        <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Resources</h3>
                  <AssignmentResourcesDisplay resources={displayAssignment.resources} />
            </div>
          )}

              {/* Submission Status */}
              {submission && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Submitted</h3>
                  <p className="text-green-700 mb-4">
                    You submitted this assignment on {formatDate(submission.submittedAt)}.
                  </p>
                  
                  {/* Video Submission Display */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-md font-semibold text-gray-800">Your Submission</h4>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isDeleting}
                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 hover:border-red-300 transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete submission"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                      </button>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="aspect-video bg-black rounded-lg overflow-hidden mb-3 relative">
                        {isYouTubeUrl(submission.videoUrl) || submission.youtubeUrl || submission.isYouTube ? (
                          // YouTube iframe for YouTube videos
                          <>
                            <iframe
                              className="w-full h-full"
                              src={`https://www.youtube-nocookie.com/embed/${extractYouTubeVideoId(submission.youtubeUrl || submission.videoUrl)}`}
                              title={submission.videoTitle || 'YouTube video'}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              onLoad={() => {
                                setVideoLoaded(true);
                                console.log('✅ YouTube iframe loaded');
                              }}
                            />
                          </>
                        ) : (
                          // Regular video element for uploaded videos
                          <video
                            controls
                            className="w-full h-full object-cover"
                            src={getVideoUrl(submission.videoUrl)}
                            poster={submission.thumbnailUrl || undefined}
                            preload="metadata"
                            playsInline
                            webkit-playsinline="true"
                            onLoadedMetadata={(e) => {
                              const video = e.currentTarget;
                              setVideoLoaded(true);
                              if (video.duration && !isNaN(video.duration)) {
                                setVideoDuration(Math.floor(video.duration));
                              }
                            }}
                            onError={() => {
                              console.error('Video failed to load');
                              setVideoLoaded(false);
                            }}
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
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
                </div>
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
                    <div className="relative bg-gray-900 rounded-t-lg overflow-hidden aspect-video">
                      {/* Enhanced video thumbnail with better fallback handling */}
                      <VideoThumbnail 
                        videoUrl={video.videoUrl}
                        thumbnailUrl={video.thumbnailUrl}
                        studentName={video.studentName}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all">
                        <div className="bg-white bg-opacity-0 group-hover:bg-opacity-90 rounded-full p-2 transition-all">
                          <svg className="w-6 h-6 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Duration badge */}
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
                  <p className="text-sm text-blue-700 mb-2">
                    💡 <strong>Required:</strong> Review {displayAssignment.minResponsesRequired} peer submissions to complete this assignment. 
                    You've completed {peerResponses.length} of {displayAssignment.minResponsesRequired}.
                  </p>
                  <p className="text-xs text-blue-600">
                    📝 Each response must be at least <strong>50 words</strong> to provide meaningful feedback.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Next Assignment Button */}
          {nextAssignment && (
            <div className="mt-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Ready for the next challenge?</h3>
                  <p className="text-sm text-gray-600">
                    Next: <span className="font-medium">{nextAssignment.title}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Due: {new Date(nextAssignment.dueDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/student/assignments/${nextAssignment.assignmentId}`)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Next Assignment →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Submission?</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
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
    </StudentRoute>
  );
};

export default StudentAssignmentDetailPage;