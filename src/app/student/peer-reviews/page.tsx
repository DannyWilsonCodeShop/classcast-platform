'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import YouTubePlayer from '@/components/common/YouTubePlayer';
import { getVideoUrl } from '@/lib/videoUtils';

interface PeerVideo {
  id: string;
  studentId: string;
  studentName: string;
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  submittedAt: string;
  duration: number;
  assignmentId: string;
  assignmentTitle: string;
  likes: number;
  averageRating: number;
  userLiked: boolean;
  userRating: number | null;
}

interface PeerResponse {
  responseId: string;
  videoId: string;
  reviewerId: string;
  reviewerName: string;
  content: string;
  submittedAt: string;
  isSubmitted: boolean;
}

const PeerReviewsContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [peerVideos, setPeerVideos] = useState<PeerVideo[]>([]);
  const [responses, setResponses] = useState<Map<string, PeerResponse>>(new Map()); // Current user's responses
  const [allResponses, setAllResponses] = useState<Map<string, PeerResponse[]>>(new Map()); // All peer responses per video
  const [responseTexts, setResponseTexts] = useState<Map<string, string>>(new Map());
  const [showResponseForms, setShowResponseForms] = useState<Set<string>>(new Set());
  const [collapsedResponses, setCollapsedResponses] = useState<Set<string>>(new Set()); // Track which peer response sections are collapsed
  const [collapsedMyResponses, setCollapsedMyResponses] = useState<Set<string>>(new Set()); // Track which of my response sections are collapsed
  const [generatedThumbnails, setGeneratedThumbnails] = useState<Map<string, string>>(new Map()); // Video thumbnails from 2-second mark
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const assignmentId = searchParams.get('assignmentId');
  const videoId = searchParams.get('videoId');

  // Load ALL videos across all assignments
  useEffect(() => {
    const loadAllVideos = async () => {
      try {
        console.log('🎥 [Peer Reviews] Starting video load...', { userId: user?.id, assignmentId, videoId });
        setIsLoading(true);
        
        let allVideos: PeerVideo[] = [];
        
        // Strategy 1: If assignmentId is provided, start from that assignment
        if (assignmentId) {
          console.log('🎥 [Peer Reviews] Loading videos starting from assignment:', assignmentId);
          
          // Load videos for the current assignment first
          try {
            const videosResponse = await fetch(
              `/api/student/community/submissions?studentId=${user?.id}&assignmentId=${assignmentId}`
            );
        
        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
              console.log('🎥 [Peer Reviews] Loaded', videosData.length, 'videos for current assignment');
              allVideos = [...videosData];
            }
          } catch (err) {
            console.error('Error loading videos for current assignment:', err);
          }
        }
        
        // Strategy 2: Load ALL videos from community submissions without assignment filter
        console.log('🎥 [Peer Reviews] Fetching all community videos...');
        try {
          const allVideosResponse = await fetch(
            `/api/student/community/submissions?studentId=${user?.id}`,
        { credentials: 'include' }
      );
      
          if (allVideosResponse.ok) {
            const allVideosData = await allVideosResponse.json();
            console.log('🎥 [Peer Reviews] Loaded', allVideosData.length, 'total videos from community');
            
        if (assignmentId) {
              // If we loaded current assignment first, append other videos
              const otherVideos = allVideosData.filter((v: PeerVideo) => v.assignmentId !== assignmentId);
              allVideos = [...allVideos, ...otherVideos];
          } else {
              // Otherwise, use all videos
              allVideos = allVideosData;
          }
        } else {
            console.error('🎥 [Peer Reviews] Failed to fetch all videos:', allVideosResponse.status);
          }
        } catch (err) {
          console.error('Error loading all community videos:', err);
        }
        
        console.log('🎥 [Peer Reviews] Total videos loaded:', allVideos.length);
        setPeerVideos(allVideos);
        
        // Scroll to specific video if videoId is provided
        if (videoId && allVideos.length > 0) {
          setTimeout(() => {
            const element = document.getElementById(`video-${videoId}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 500);
        }
        
        // Load existing responses for all videos
        if (user?.id && allVideos.length > 0) {
          const responsesMap = new Map();
          const allResponsesMap = new Map();
          
          // Fetch responses for each video individually
          for (const video of allVideos) {
            try {
              const responsesResponse = await fetch(
                `/api/peer-responses?assignmentId=${video.assignmentId}&videoId=${video.id}`, 
                { credentials: 'include' }
              );
              
              if (responsesResponse.ok) {
                const responsesData = await responsesResponse.json();
                if (responsesData.success && responsesData.data) {
                  const allVideoResponses = Array.isArray(responsesData.data) ? responsesData.data : [];
                  
                  // Find responses by this reviewer
                  const myResponse = allVideoResponses.find((r: any) => r.reviewerId === user.id);
                  
                  if (myResponse) {
                    responsesMap.set(video.id, myResponse);
                  }
                  
                  // Store all responses for this video (excluding the current user's)
                  const otherResponses = allVideoResponses.filter((r: any) => r.reviewerId !== user.id);
                  if (otherResponses.length > 0) {
                    allResponsesMap.set(video.id, otherResponses);
                  }
                }
              }
            } catch (err) {
              console.error('Error loading responses for video:', video.id, err);
            }
          }
          
          setResponses(responsesMap);
          setAllResponses(allResponsesMap);
        }
      } catch (error) {
        console.error('Error loading videos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      console.log('🎥 [Peer Reviews] User authenticated, loading videos...', { userId: user.id });
      loadAllVideos();
        } else {
      console.log('🎥 [Peer Reviews] No user ID, skipping video load', { user });
      setIsLoading(false);
    }
  }, [user?.id, assignmentId, videoId]);

  const handleLike = async (videoId: string) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          isLiked: !peerVideos.find(v => v.id === videoId)?.userLiked
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setPeerVideos(prev => prev.map(v => 
          v.id === videoId 
            ? { ...v, userLiked: data.isLiked, likes: data.likes }
            : v
        ));
      }
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleRating = async (videoId: string, rating: number) => {
    if (!user?.id) return;
    
    try {
      const currentVideo = peerVideos.find(v => v.id === videoId);
      const response = await fetch(`/api/videos/${videoId}/interactions`, {
        method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        body: JSON.stringify({
          type: 'rating',
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          userAvatar: user.avatar,
          rating: rating,
          contentCreatorId: currentVideo?.studentId
          })
        });

      if (response.ok) {
        setPeerVideos(prev => prev.map(v => 
          v.id === videoId 
            ? { ...v, userRating: rating }
            : v
        ));
      }
    } catch (error) {
      console.error('Error rating video:', error);
    }
  };

  const toggleResponseForm = (videoId: string) => {
    setShowResponseForms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const toggleResponsesCollapse = (videoId: string) => {
    setCollapsedResponses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const toggleMyResponseCollapse = (videoId: string) => {
    setCollapsedMyResponses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
        } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const updateResponseText = (videoId: string, text: string) => {
    setResponseTexts(new Map(responseTexts.set(videoId, text)));
  };

  // Generate thumbnail from video at 2-second mark
  const generateThumbnail = (videoElement: HTMLVideoElement, videoId: string) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      
        if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        setGeneratedThumbnails(prev => {
          const newMap = new Map(prev);
          newMap.set(videoId, thumbnailUrl);
          return newMap;
        });
        
        console.log('🎬 Generated 2-second thumbnail for:', videoId);
      }
    } catch (error) {
      console.error('Error generating thumbnail for:', videoId, error);
    }
  };

  const handleSubmitResponse = async (videoId: string) => {
    const responseText = responseTexts.get(videoId);
    if (!responseText || responseText.trim().length < 50) {
      setShowNotification({ message: 'Response must be at least 50 characters', type: 'error' });
      return;
    }
    
    try {
      setSubmitting(videoId);
      const video = peerVideos.find(v => v.id === videoId);
      
      const response = await fetch('/api/peer-responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
          videoId,
          assignmentId: video?.assignmentId,
          reviewerId: user?.id,
          reviewerName: `${user?.firstName} ${user?.lastName}`,
          content: responseText.trim(),
          isSubmitted: true,
          responseType: 'text'
          })
        });

      if (response.ok) {
        const data = await response.json();
        setResponses(new Map(responses.set(videoId, data.data || { responseId: 'temp', videoId, content: responseText, submittedAt: new Date().toISOString(), isSubmitted: true })));
        toggleResponseForm(videoId);
        setShowNotification({ message: '✅ Response submitted successfully!', type: 'success' });
      } else {
        setShowNotification({ message: '❌ Failed to submit response', type: 'error' });
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      setShowNotification({ message: '❌ Error submitting response', type: 'error' });
    } finally {
      setSubmitting(null);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading peer videos...</p>
        </div>
      </div>
    );
  }

  if (peerVideos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Peer Videos Available</h2>
          <p className="text-gray-600 mb-6">
            There are currently no peer submissions available for review.
          </p>
            <button
              onClick={() => router.push('/student/dashboard')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            ← Back to Dashboard
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Peer Video Reviews</h1>
              <p className="text-sm text-gray-600">{peerVideos.length} videos to review</p>
              </div>
            </div>
              <img
                src="/MyClassCast (800 x 200 px).png"
                alt="MyClassCast"
            className="h-8 w-auto object-contain"
              />
            </div>
          </div>

      {/* All Videos in Continuous Vertical Scroll */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {peerVideos.map((video, index) => (
          <div key={video.id} id={`video-${video.id}`} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden scroll-mt-24">
            {/* Assignment Header - Show when assignment changes */}
            {(index === 0 || video.assignmentId !== peerVideos[index - 1].assignmentId) && (
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3">
                <h3 className="text-white font-semibold text-lg">{video.assignmentTitle}</h3>
        </div>
            )}

          {/* Video Player */}
            <div className="bg-black relative aspect-video w-full">
              {video.videoUrl?.includes('youtube.com') || video.videoUrl?.includes('youtu.be') ? (
              <YouTubePlayer
                  url={video.videoUrl}
                  title={video.title}
                className="w-full h-full"
              />
            ) : (
              <video
                className="w-full h-full object-contain"
                  controls
                preload="metadata"
                crossOrigin="anonymous"
                playsInline
                webkit-playsinline="true"
                poster={
                  generatedThumbnails.get(video.id) || 
                  (video.thumbnailUrl !== '/api/placeholder/300/200' ? video.thumbnailUrl : undefined)
                }
                onLoadedMetadata={(e) => {
                  const videoElement = e.currentTarget;
                  if (!generatedThumbnails.has(video.id) && videoElement.duration >= 2) {
                    // Seek to 2 seconds to generate thumbnail
                    videoElement.currentTime = Math.min(2.0, videoElement.duration * 0.1);
                  }
                }}
                onSeeked={(e) => {
                  const videoElement = e.currentTarget;
                  if (!generatedThumbnails.has(video.id) && videoElement.currentTime >= 1.5) {
                    generateThumbnail(videoElement, video.id);
                    videoElement.currentTime = 0; // Reset to start
                  }
                }}
                >
                  <source src={getVideoUrl(video.videoUrl)} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
                </div>
                
            {/* Video Info and Actions */}
            <div className="p-6">
              {/* Video Details */}
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{video.title}</h2>
                <p className="text-gray-600 mb-3">{video.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span>👤 {video.studentName}</span>
                  <span>📅 {new Date(video.submittedAt).toLocaleDateString()}</span>
                  <span>⏱️ {formatTime(video.duration)}</span>
            </div>
          </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                {/* Like Button */}
                <button
                  onClick={() => handleLike(video.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    video.userLiked
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xl">{video.userLiked ? '❤️' : '🤍'}</span>
                  <span className="font-medium">{video.likes || 0}</span>
                </button>

                {/* Rating Stars */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Rate:</span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                        onClick={() => handleRating(video.id, star)}
                        className={`text-2xl transition-colors ${
                          video.userRating && star <= video.userRating
                          ? 'text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    >
                        {video.userRating && star <= video.userRating ? '★' : '☆'}
                    </button>
                  ))}
                  </div>
                  <span className="text-sm text-gray-500 ml-2">
                    ({(video.averageRating || 0).toFixed(1)})
                  </span>
                </div>

                {/* Response Button */}
                <button
                  onClick={() => toggleResponseForm(video.id)}
                  className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                    responses.has(video.id)
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {responses.has(video.id) ? '✓ Responded' : 'Write Response'}
                </button>
          </div>

          {/* Response Form */}
              {showResponseForms.has(video.id) && !responses.has(video.id) && (
                <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Response to {video.studentName}'s Video
                </label>
                    <textarea
                    value={responseTexts.get(video.id) || ''}
                    onChange={(e) => updateResponseText(video.id, e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={6}
                    placeholder="Write a thoughtful response (minimum 50 characters)..."
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-sm ${
                      (responseTexts.get(video.id)?.length || 0) >= 50 
                        ? 'text-green-600' 
                        : 'text-gray-500'
                    }`}>
                      {responseTexts.get(video.id)?.length || 0} / 50 characters minimum
                      </span>
                      <div className="flex items-center space-x-2">
                          <button
                        onClick={() => toggleResponseForm(video.id)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                          </button>
                            <button
                        onClick={() => handleSubmitResponse(video.id)}
                        disabled={!responseTexts.get(video.id) || responseTexts.get(video.id)!.length < 50 || submitting === video.id}
                              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                        {submitting === video.id ? 'Submitting...' : 'Submit Response'}
                            </button>
                              </div>
                          </div>
                      </div>
                    )}

              {/* Your Response Display (Collapsible) */}
              {responses.has(video.id) && (
                <div className="border border-green-200 rounded-lg overflow-hidden mb-4">
                  {/* Collapsible Header */}
                <button
                    onClick={() => toggleMyResponseCollapse(video.id)}
                    className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-semibold text-green-700">
                        ✓ Your Response
                      </span>
              </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500">
                        {new Date(responses.get(video.id)!.submittedAt).toLocaleDateString()}
                </span>
                      <svg
                        className={`w-5 h-5 text-green-600 transition-transform ${
                          collapsedMyResponses.has(video.id) ? '' : 'rotate-180'
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
                  {!collapsedMyResponses.has(video.id) && (
                    <div className="p-4 bg-white">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {responses.get(video.id)!.content}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Peer Responses Section (Collapsible) */}
              {allResponses.has(video.id) && allResponses.get(video.id)!.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Collapsible Header */}
              <button
                    onClick={() => toggleResponsesCollapse(video.id)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-semibold text-gray-700">
                        💬 Peer Responses
                </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {allResponses.get(video.id)!.length}
                </span>
            </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        collapsedResponses.has(video.id) ? '' : 'rotate-180'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Collapsible Content */}
                  {!collapsedResponses.has(video.id) && (
                    <div className="divide-y divide-gray-200">
                      {allResponses.get(video.id)!.map((response) => (
                        <div key={response.responseId} className="p-4 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {response.reviewerName}
                        </span>
                        <span className="text-xs text-gray-500">
                              {new Date(response.submittedAt).toLocaleDateString()}
                        </span>
                        </div>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                            {response.content}
                          </p>
                      </div>
                      ))}
                    </div>
                      )}
                    </div>
              )}
                </div>
              </div>
            ))}
      </div>

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className={`px-6 py-4 rounded-lg shadow-2xl border-l-4 ${
            showNotification.type === 'success' 
              ? 'bg-green-50 border-green-400 text-green-800' 
              : 'bg-red-50 border-red-400 text-red-800'
          }`}>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">
                {showNotification.type === 'success' ? '✅' : '❌'}
              </span>
              <span className="font-semibold">{showNotification.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PeerReviewsPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading peer reviews...</p>
        </div>
      </div>
    }>
      <PeerReviewsContent />
    </Suspense>
  );
};

export default PeerReviewsPage;

