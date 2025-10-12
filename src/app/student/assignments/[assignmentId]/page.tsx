'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import AssignmentResourcesDisplay from '@/components/common/AssignmentResourcesDisplay';

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
  const [peerVideos, setPeerVideos] = useState<PeerVideo[]>([]);
  const [peerResponses, setPeerResponses] = useState<any[]>([]);

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
            courseId: foundAssignment.courseId,
            courseName: 'Unknown Course',
            courseCode: 'N/A',
            instructor: 'Unknown Instructor',
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

  useEffect(() => {
    if (assignmentId && user?.id) {
      fetchAssignmentDetails();
      fetchSubmission();
      fetchPeerVideos();
      fetchPeerResponses();
    }
  }, [assignmentId, user?.id, fetchAssignmentDetails, fetchSubmission, fetchPeerVideos, fetchPeerResponses]);

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
          <EmptyState
            icon="assignment"
            title="Assignment Not Found"
            description="The requested assignment could not be found or you don't have access to it."
            action={{
              label: "Back to Assignments",
              onClick: () => router.push('/student/assignments'),
              variant: 'primary'
            }}
          />
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/student/assignments')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
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
            {/* Assignment Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{displayAssignment.points}</div>
                    <div className="text-sm text-gray-600">Points</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {getTimeRemaining(displayAssignment.dueDate)}
                    </div>
                    <div className="text-sm text-gray-600">Time Remaining</div>
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
                    {displayAssignment.description}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Due Date</h3>
                    <p className="text-gray-700">{formatDate(displayAssignment.dueDate)}</p>
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

                  {displayAssignment.grade && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-blue-700 font-medium">Grade: {displayAssignment.grade}/{displayAssignment.points}</p>
                      {displayAssignment.feedback && (
                        <p className="text-blue-700 mt-1">Feedback: {displayAssignment.feedback}</p>
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
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
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
                  onClick={() => router.push(`/student/assignments/${assignmentId}/submissions`)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium cursor-pointer"
                >
                  View All Submissions →
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {peerVideos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => router.push(`/student/assignments/${assignmentId}/submissions?videoId=${video.id}`)}
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