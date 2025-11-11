'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
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
  editCount?: number;
  updatedAt?: string;
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
  const [editingResponse, setEditingResponse] = useState<string | null>(null); // Track which response is being edited
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null); // Track which response to delete

  const assignmentId = searchParams.get('assignmentId');
  const videoId = searchParams.get('videoId');

  // Load ALL videos across all assignments
  useEffect(() => {
    const loadAllVideos = async () => {
      try {
        console.log('🎥 [Peer Reviews] Starting video load...', { userId: user?.id, assignmentId, videoId });
        setIsLoading(true);
        
        let allVideos: PeerVideo[] = [];
        
        // If assignmentId is provided, ONLY load videos for that assignment
        if (assignmentId) {
          console.log('🎥 [Peer Reviews] Loading videos for specific assignment:', assignmentId);
          
          try {
            const videosResponse = await fetch(
              `/api/student/community/submissions?studentId=${user?.id}&assignmentId=${assignmentId}`,
              { credentials: 'include' }
            );
        
            if (videosResponse.ok) {
              const videosData = await videosResponse.json();
              console.log('🎥 [Peer Reviews] Loaded', videosData.length, 'videos for assignment', assignmentId);
              allVideos = videosData;
            } else {
              console.error('🎥 [Peer Reviews] Failed to fetch assignment videos:', videosResponse.status);
            }
          } catch (err) {
            console.error('Error loading videos for assignment:', err);
          }
        } else {
          // No specific assignment - load ALL videos from community submissions
          console.log('🎥 [Peer Reviews] Loading all community videos...');
          try {
            const allVideosResponse = await fetch(
              `/api/student/community/submissions?studentId=${user?.id}`,
              { credentials: 'include' }
            );
        
            if (allVideosResponse.ok) {
              const allVideosData = await allVideosResponse.json();
              console.log('🎥 [Peer Reviews] Loaded', allVideosData.length, 'total videos from community');
              allVideos = allVideosData;
            } else {
              console.error('🎥 [Peer Reviews] Failed to fetch all videos:', allVideosResponse.status);
            }
          } catch (err) {
            console.error('Error loading all community videos:', err);
          }
        }
        
        console.log('🎥 [Peer Reviews] Total videos loaded:', allVideos.length);
        setPeerVideos(allVideos);
        
        // Initialize all dropdowns as collapsed by default
        const allVideoIds = new Set(allVideos.map(v => v.id));
        setCollapsedResponses(allVideoIds);
        setCollapsedMyResponses(allVideoIds);
        console.log('🔽 [Peer Reviews] All dropdowns initialized as collapsed');
        
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
          
          // Fetch user's rating for each video
          console.log('⭐ [Peer Reviews] Fetching user ratings for', allVideos.length, 'videos');
          for (const video of allVideos) {
            try {
              const ratingResponse = await fetch(
                `/api/videos/${video.id}/interactions?userId=${user.id}&type=rating`,
                { credentials: 'include' }
              );
              
              if (ratingResponse.ok) {
                const ratingData = await ratingResponse.json();
                if (ratingData.success && ratingData.interactions) {
                  // Find this user's rating
                  const userRatingInteraction = ratingData.interactions.find(
                    (i: any) => i.userId === user.id && i.type === 'rating'
                  );
                  
                  if (userRatingInteraction) {
                    console.log('⭐ Found rating for video', video.id, ':', userRatingInteraction.rating);
                    setPeerVideos(prev => prev.map(v => 
                      v.id === video.id 
                        ? { ...v, userRating: userRatingInteraction.rating }
                        : v
                    ));
                  }
                }
              }
            } catch (err) {
              console.error('Error loading rating for video:', video.id, err);
            }
          }
          console.log('⭐ [Peer Reviews] Finished loading user ratings');
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
        const data = await response.json();
        console.log('✅ Rating saved successfully:', data);
        setPeerVideos(prev => prev.map(v => 
          v.id === videoId 
            ? { 
                ...v, 
                userRating: rating,
                averageRating: data.averageRating || v.averageRating
              }
            : v
        ));
      } else {
        console.error('❌ Failed to save rating:', response.status);
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
    const wordCount = responseText?.trim().split(/\s+/).filter(w => w.length > 0).length || 0;
    
    if (!responseText || wordCount < 50) {
      setShowNotification({ message: `Response must be at least 50 words (currently ${wordCount} words)`, type: 'error' });
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

  const handleEditResponse = (videoId: string) => {
    const response = responses.get(videoId);
    if (response) {
      setResponseTexts(new Map(responseTexts.set(videoId, response.content)));
      setEditingResponse(videoId);
      setShowResponseForms(new Set(showResponseForms).add(videoId));
    }
  };

  const handleUpdateResponse = async (videoId: string) => {
    const responseText = responseTexts.get(videoId);
    const wordCount = responseText?.trim().split(/\s+/).filter(w => w.length > 0).length || 0;
    
    if (!responseText || wordCount < 50) {
      setShowNotification({ message: `Response must be at least 50 words (currently ${wordCount} words)`, type: 'error' });
      return;
    }
    
    try {
      setSubmitting(videoId);
      const response = responses.get(videoId);
      
      const apiResponse = await fetch('/api/peer-responses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          responseId: response?.responseId,
          content: responseText.trim(),
          isSubmitted: true
        })
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        // Update local state
        const updatedResponse = { ...response!, content: responseText.trim(), updatedAt: new Date().toISOString() };
        setResponses(new Map(responses.set(videoId, updatedResponse as PeerResponse)));
        setEditingResponse(null);
        toggleResponseForm(videoId);
        setShowNotification({ message: '✅ Response updated successfully!', type: 'success' });
      } else {
        setShowNotification({ message: '❌ Failed to update response', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating response:', error);
      setShowNotification({ message: '❌ Error updating response', type: 'error' });
    } finally {
      setSubmitting(null);
    }
  };

  const handleDeleteResponse = async (videoId: string) => {
    const response = responses.get(videoId);
    if (!response) return;
    
    try {
      const apiResponse = await fetch(`/api/peer-responses?responseId=${response.responseId}&userId=${user?.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (apiResponse.ok) {
        // Remove from local state
        const newResponses = new Map(responses);
        newResponses.delete(videoId);
        setResponses(newResponses);
        setDeleteConfirm(null);
        setShowNotification({ message: '✅ Response deleted successfully!', type: 'success' });
      } else {
        setShowNotification({ message: '❌ Failed to delete response', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting response:', error);
      setShowNotification({ message: '❌ Error deleting response', type: 'error' });
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <StudentRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading peer videos...</p>
          </div>
        </div>
      </StudentRoute>
    );
  }

  if (peerVideos.length === 0) {
    return (
      <StudentRoute>
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
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
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
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-blue-800">
                      <strong>📝 Requirement:</strong> Your response must be at least <strong>50 words</strong> to provide meaningful feedback to your peer.
                    </p>
                  </div>
                    <textarea
                    value={responseTexts.get(video.id) || ''}
                    onChange={(e) => updateResponseText(video.id, e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={6}
                    placeholder="Write a thoughtful response to your peer's video. Be specific about what they did well and offer constructive suggestions..."
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-4">
                      <span className={`text-sm font-medium ${
                        (responseTexts.get(video.id)?.trim().split(/\s+/).filter(w => w.length > 0).length || 0) >= 50 
                          ? 'text-green-600' 
                          : 'text-gray-600'
                      }`}>
                        {responseTexts.get(video.id)?.trim().split(/\s+/).filter(w => w.length > 0).length || 0} / 50 words minimum
                      </span>
                      <span className="text-xs text-gray-500">
                        ({responseTexts.get(video.id)?.length || 0} characters)
                      </span>
                    </div>
                      <div className="flex items-center space-x-2">
                          <button
                        onClick={() => toggleResponseForm(video.id)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                          </button>
                            <button
                        onClick={() => handleSubmitResponse(video.id)}
                        disabled={!responseTexts.get(video.id) || (responseTexts.get(video.id)?.trim().split(/\s+/).filter(w => w.length > 0).length || 0) < 50 || submitting === video.id}
                              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                        {submitting === video.id ? 'Submitting...' : 'Submit Response'}
                            </button>
                              </div>
                          </div>
                      </div>
                    )}

              {/* Your Response Display (Collapsible) */}
              {responses.has(video.id) && !editingResponse && (
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
                      {responses.get(video.id)!.editCount && responses.get(video.id)!.editCount! > 0 && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          Edited {responses.get(video.id)!.editCount} time{responses.get(video.id)!.editCount! > 1 ? 's' : ''}
                        </span>
                      )}
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
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">
                        {responses.get(video.id)!.content}
                      </p>
                      <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleEditResponse(video.id)}
                          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(video.id)}
                          className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Edit Response Form */}
              {editingResponse === video.id && (
                <div className="mb-6 border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Edit Your Response
                  </label>
                  <textarea
                    value={responseTexts.get(video.id) || ''}
                    onChange={(e) => updateResponseText(video.id, e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={6}
                    placeholder="Write a thoughtful response to your peer's video..."
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-sm font-medium ${
                      (responseTexts.get(video.id)?.trim().split(/\s+/).filter(w => w.length > 0).length || 0) >= 50 
                        ? 'text-green-600' 
                        : 'text-gray-600'
                    }`}>
                      {responseTexts.get(video.id)?.trim().split(/\s+/).filter(w => w.length > 0).length || 0} / 50 words minimum
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingResponse(null);
                          setResponseTexts(new Map(responseTexts.set(video.id, responses.get(video.id)!.content)));
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateResponse(video.id)}
                        disabled={!responseTexts.get(video.id) || (responseTexts.get(video.id)?.trim().split(/\s+/).filter(w => w.length > 0).length || 0) < 50 || submitting === video.id}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {submitting === video.id ? 'Updating...' : 'Update Response'}
                      </button>
                    </div>
                  </div>
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
                <h3 className="font-bold text-gray-900">Delete Response?</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to delete your response? This will permanently remove your feedback.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteResponse(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </StudentRoute>
  );
};

const PeerReviewsPage: React.FC = () => {
  return (
    <Suspense fallback={
      <StudentRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading peer reviews...</p>
          </div>
        </div>
      </StudentRoute>
    }>
      <PeerReviewsContent />
    </Suspense>
  );
};

export default PeerReviewsPage;

