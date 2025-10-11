'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface VideoSubmission {
  submissionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  videoUrl: string;
  thumbnailUrl: string;
  videoTitle: string;
  videoDescription: string;
  duration: number;
  submittedAt: string;
  courseId: string;
  assignmentId: string;
}

interface Assignment {
  assignmentId: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  minResponsesRequired?: number;
  enablePeerResponses?: boolean;
  peerReviewScope?: 'section' | 'course';
}

interface PeerResponse {
  id: string;
  reviewerId: string;
  videoId: string;
  content: string;
  submittedAt: string;
  isSubmitted: boolean;
  wordCount: number;
}

const AssignmentSubmissionsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const videoRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<VideoSubmission[]>([]);
  const [responses, setResponses] = useState<{[videoId: string]: PeerResponse}>({});
  const [currentResponses, setCurrentResponses] = useState<{[videoId: string]: string}>({});
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<{[videoId: string]: 'saved' | 'saving'}>({});

  const assignmentId = params.assignmentId as string;
  const highlightVideoId = searchParams.get('videoId');

  useEffect(() => {
    if (assignmentId && user?.id) {
      fetchAssignmentAndSubmissions();
    }
  }, [assignmentId, user?.id]);

  // Scroll to highlighted video
  useEffect(() => {
    if (highlightVideoId && videoRefs.current[highlightVideoId]) {
      setTimeout(() => {
        videoRefs.current[highlightVideoId]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        setExpandedVideoId(highlightVideoId);
      }, 500);
    }
  }, [highlightVideoId, submissions]);

  const fetchAssignmentAndSubmissions = async () => {
    try {
      setLoading(true);

      // Fetch assignment details
      const assignmentResponse = await fetch(`/api/assignments/${assignmentId}`, {
        credentials: 'include'
      });

      if (assignmentResponse.ok) {
        const assignmentData = await assignmentResponse.json();
        const foundAssignment = assignmentData.success ? assignmentData.data?.assignment : null;
        if (foundAssignment) {
          setAssignment({
            assignmentId: foundAssignment.assignmentId,
            title: foundAssignment.title,
            description: foundAssignment.description,
            courseId: foundAssignment.courseId,
            courseName: 'Course',
            minResponsesRequired: foundAssignment.minResponsesRequired || 0,
            enablePeerResponses: foundAssignment.enablePeerResponses || false,
            peerReviewScope: foundAssignment.peerReviewScope || 'course'
          });
        }
      }

      // Fetch all submissions for this assignment
      const submissionsResponse = await fetch(
        `/api/student/community/submissions?assignmentId=${assignmentId}&studentId=${user?.id}`,
        { credentials: 'include' }
      );

      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json();
        // Sort by submission time (oldest first)
        const sorted = submissionsData.sort((a: any, b: any) => 
          new Date(a.submittedAt || a.createdAt).getTime() - 
          new Date(b.submittedAt || b.createdAt).getTime()
        );
        setSubmissions(sorted);
      }

      // Fetch existing peer responses
      const responsesResponse = await fetch(
        `/api/peer-responses?assignmentId=${assignmentId}&studentId=${user?.id}`,
        { credentials: 'include' }
      );

      if (responsesResponse.ok) {
        const responsesData = await responsesResponse.json();
        const responseMap: {[videoId: string]: PeerResponse} = {};
        (responsesData.data || []).forEach((r: any) => {
          responseMap[r.videoId] = r;
        });
        setResponses(responseMap);
        
        // Pre-populate response text for editing
        Object.entries(responseMap).forEach(([videoId, response]) => {
          if (!response.isSubmitted) {
            setCurrentResponses(prev => ({ ...prev, [videoId]: response.content }));
          }
        });
      }

    } catch (error) {
      console.error('Error loading assignment submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (videoId: string, content: string) => {
    setCurrentResponses(prev => ({ ...prev, [videoId]: content }));
    
    // Auto-save after 1 second of no typing
    setSavingStatus(prev => ({ ...prev, [videoId]: 'saving' }));
    
    setTimeout(async () => {
      try {
        await fetch('/api/peer-responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            videoId,
            assignmentId,
            reviewerId: user?.id,
            reviewerName: `${user?.firstName} ${user?.lastName}`,
            content,
            isSubmitted: false
          })
        });
        setSavingStatus(prev => ({ ...prev, [videoId]: 'saved' }));
      } catch (error) {
        console.error('Error auto-saving response:', error);
      }
    }, 1000);
  };

  const handleSubmitResponse = async (videoId: string) => {
    const content = currentResponses[videoId];
    if (!content || content.trim().length < 50) {
      alert('Response must be at least 50 characters.');
      return;
    }

    try {
      const response = await fetch('/api/peer-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          videoId,
          assignmentId,
          reviewerId: user?.id,
          reviewerName: `${user?.firstName} ${user?.lastName}`,
          content: content.trim(),
          isSubmitted: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResponses(prev => ({
          ...prev,
          [videoId]: {
            id: data.id || `response_${videoId}`,
            reviewerId: user?.id || '',
            videoId,
            content: content.trim(),
            submittedAt: new Date().toISOString(),
            isSubmitted: true,
            wordCount: content.trim().split(/\s+/).length
          }
        }));
        alert('Response submitted successfully!');
        setExpandedVideoId(null);
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response. Please try again.');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <StudentRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Loading submissions...</p>
          </div>
        </div>
      </StudentRoute>
    );
  }

  const responsesSubmitted = Object.values(responses).filter(r => r.isSubmitted).length;
  const responsesRequired = assignment?.minResponsesRequired || 0;

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push(`/student/assignments/${assignmentId}`)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{assignment?.title || 'Assignment Submissions'}</h1>
                  <p className="text-sm text-gray-600">{submissions.length} student submissions</p>
                </div>
              </div>
              {assignment?.enablePeerResponses && (
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className="text-gray-600">Your Progress: </span>
                    <span className={`font-bold ${responsesSubmitted >= responsesRequired ? 'text-green-600' : 'text-orange-600'}`}>
                      {responsesSubmitted} of {responsesRequired} reviews
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    responsesSubmitted >= responsesRequired 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {responsesSubmitted >= responsesRequired ? '✓ Complete' : 'In Progress'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          {submissions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="text-6xl mb-4">🎥</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Submissions Yet</h3>
              <p className="text-gray-600">Be the first to submit your video!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {submissions.map((video, index) => {
                const hasResponse = responses[video.submissionId]?.isSubmitted;
                const isExpanded = expandedVideoId === video.submissionId;
                
                return (
                  <div
                    key={video.submissionId}
                    ref={(el) => { videoRefs.current[video.submissionId] = el; }}
                    id={`video-${video.submissionId}`}
                    className={`bg-white rounded-xl shadow-lg border-2 transition-all ${
                      highlightVideoId === video.submissionId 
                        ? 'border-blue-400 ring-2 ring-blue-200' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="p-6">
                      {/* Student Info Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {video.studentName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{video.studentName}</h3>
                            <p className="text-sm text-gray-500">
                              Submitted {new Date(video.submittedAt).toLocaleDateString()} at {new Date(video.submittedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">#{index + 1}</span>
                          {hasResponse && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              ✓ Reviewed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Video Title */}
                      <h4 className="text-lg font-medium text-gray-900 mb-3">{video.videoTitle}</h4>
                      {video.videoDescription && (
                        <p className="text-sm text-gray-600 mb-4">{video.videoDescription}</p>
                      )}

                      {/* Video Player */}
                      <div className="bg-black rounded-lg overflow-hidden aspect-video mb-4">
                        <video
                          controls
                          className="w-full h-full object-contain"
                          preload="metadata"
                          poster={video.thumbnailUrl !== '/api/placeholder/300/200' ? video.thumbnailUrl : undefined}
                        >
                          <source src={video.videoUrl} type="video/mp4" />
                          <source src={video.videoUrl} type="video/webm" />
                          Your browser does not support the video tag.
                        </video>
                      </div>

                      {/* Video Metadata */}
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                        <span>⏱️ {formatDuration(video.duration)}</span>
                      </div>

                      {/* Response Section */}
                      {assignment?.enablePeerResponses && (
                        <div className="border-t border-gray-200 pt-4">
                          {hasResponse ? (
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-green-800">Your Review</h4>
                                <button
                                  onClick={() => {
                                    setCurrentResponses(prev => ({ 
                                      ...prev, 
                                      [video.submissionId]: responses[video.submissionId]?.content || '' 
                                    }));
                                    setExpandedVideoId(video.submissionId);
                                  }}
                                  className="text-sm text-green-700 hover:text-green-900 underline"
                                >
                                  Edit
                                </button>
                              </div>
                              <p className="text-green-700 text-sm whitespace-pre-wrap">
                                {responses[video.submissionId]?.content}
                              </p>
                              <p className="text-xs text-green-600 mt-2">
                                Submitted {new Date(responses[video.submissionId]?.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <button
                                onClick={() => setExpandedVideoId(isExpanded ? null : video.submissionId)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                              >
                                <span className="font-medium text-blue-700">
                                  {isExpanded ? '▼ Hide Response Form' : '▶ Write Your Review'}
                                </span>
                                <span className="text-xs text-blue-600">
                                  {currentResponses[video.submissionId]?.length || 0} / 50 min characters
                                </span>
                              </button>

                              {isExpanded && (
                                <div className="mt-3 space-y-3">
                                  <textarea
                                    value={currentResponses[video.submissionId] || ''}
                                    onChange={(e) => handleResponseChange(video.submissionId, e.target.value)}
                                    placeholder="Write your thoughtful response here... (minimum 50 characters)"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    rows={4}
                                  />
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-500">
                                      {savingStatus[video.submissionId] === 'saving' && '💾 Saving...'}
                                      {savingStatus[video.submissionId] === 'saved' && '✓ Auto-saved'}
                                    </div>
                                    <button
                                      onClick={() => handleSubmitResponse(video.submissionId)}
                                      disabled={!currentResponses[video.submissionId] || currentResponses[video.submissionId].length < 50}
                                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                                    >
                                      Submit Review
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentRoute>
  );
};

export default AssignmentSubmissionsPage;

