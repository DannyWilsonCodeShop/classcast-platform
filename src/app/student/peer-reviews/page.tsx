'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import YouTubePlayer from '@/components/common/YouTubePlayer';
import { getVideoUrl } from '@/lib/videoUtils';

interface PeerVideo {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  submittedAt: string;
  duration: number;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  sectionId?: string;
  sectionName?: string;
  likes: number;
  averageRating: number;
  userLiked: boolean;
  userRating: number | null;
}

interface PeerResponse {
  id: string;
  reviewerId: string;
  reviewerName: string;
  videoId: string;
  content: string;
  submittedAt: string;
  lastSavedAt: string;
  isSubmitted: boolean;
  wordCount: number;
  characterCount: number;
  responseType: 'text' | 'video' | 'mixed';
  videoResponse?: {
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
    fileSize: number;
  };
  parentResponseId?: string;
  threadLevel: number;
  replies?: PeerResponse[];
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  courseId: string;
  courseName: string;
  assignmentType: 'video_presentation' | 'discussion_thread' | 'mixed_review';
  peerReviewRequired: boolean;
  minResponsesRequired: number;
  maxResponsesAllowed?: number;
  allowVideoResponses: boolean;
  allowThreadedDiscussions: boolean;
  maxThreadDepth?: number;
  responseWordLimit?: number;
  responseCharacterLimit?: number;
  rubric: {
    contentQuality: { possible: number; description: string };
    engagement: { possible: number; description: string };
    criticalThinking: { possible: number; description: string };
    communication: { possible: number; description: string };
  };
  instructions?: string;
  responseGuidelines?: string[];
}

const PeerReviewsContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [peerVideos, setPeerVideos] = useState<PeerVideo[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, PeerResponse>>(new Map());
  const [currentResponse, setCurrentResponse] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const autoScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [autoscrollCountdown, setAutoscrollCountdown] = useState<number | null>(null);
  const [videoThumbnails, setVideoThumbnails] = useState<{[key: string]: string}>({});
  const [showNotification, setShowNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [lastScrollTime, setLastScrollTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseType, setResponseType] = useState<'text' | 'video' | 'mixed'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [responseStats, setResponseStats] = useState({
    totalResponses: 0,
    submittedResponses: 0,
    remainingRequired: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserSection, setCurrentUserSection] = useState<string | null>(null);
  const [peerReviewScope, setPeerReviewScope] = useState<'section' | 'course'>('section');

  // Like and rating functions
  const handleLike = async (videoId: string) => {
    if (!user?.id) {
      console.error('No user ID available for liking video');
      return;
    }
    
    try {
      console.log('👍 Liking video:', videoId, 'user:', user.id);
      
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
        console.log('✅ Like response:', data);
        setPeerVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { 
                ...video, 
                userLiked: data.isLiked,
                likes: data.likes
              }
            : video
        ));
      } else {
        const errorData = await response.text();
        console.error('Like API failed:', response.status, errorData);
        showNotificationMessage('Failed to like video. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error liking video:', error);
      showNotificationMessage('Failed to like video. Please try again.', 'error');
    }
  };

  const showNotificationMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setShowNotification({ message, type });
    setTimeout(() => setShowNotification(null), 3000); // Auto-hide after 3 seconds
  };

  const handleRating = async (videoId: string, rating: number) => {
    if (!user?.id) {
      console.error('No user ID available for rating video');
      return;
    }
    
    try {
      console.log('⭐ Rating video:', videoId, 'rating:', rating, 'user:', user.id);
      
      // Find the current video to get the content creator ID
      const currentVideo = peerVideos.find(v => v.id === videoId);
      if (!currentVideo) {
        console.error('Video not found for rating:', videoId);
        return;
      }

      const response = await fetch(`/api/videos/${videoId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'rating',
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          userAvatar: user.avatar || '/api/placeholder/40/40',
          rating: rating,
          contentCreatorId: currentVideo.studentId // Add the content creator ID
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Rating response:', data);
        setPeerVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { 
                ...video, 
                userRating: rating,
                averageRating: calculateNewAverageRating(video.averageRating, video.userRating, rating)
              }
            : video
        ));
      } else {
        const errorData = await response.text();
        console.error('Rating API failed:', response.status, errorData);
        showNotificationMessage('Failed to rate video. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error rating video:', error);
      showNotificationMessage('Failed to rate video. Please try again.', 'error');
    }
  };

  const calculateNewAverageRating = (currentAverage: number, oldRating: number | null, newRating: number): number => {
    // This is a simplified calculation - in production, you'd want to track total ratings and count
    if (oldRating === null) {
      return (currentAverage + newRating) / 2; // Simplified for demo
    }
    return currentAverage + (newRating - oldRating) / 10; // Simplified for demo
  };

  const assignmentId = searchParams.get('assignmentId') || searchParams.get('assignment');
  const courseId = searchParams.get('course');
  
  // Advanced debugging
  console.log('🔍 URL Parameters:', {
    assignmentId,
    courseId,
    videoId: searchParams.get('videoId'),
    allParams: Object.fromEntries(searchParams.entries())
  });

  // Cleanup media recorder on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        if ((mediaRecorder as any).durationInterval) {
          clearInterval((mediaRecorder as any).durationInterval);
        }
      }
    };
  }, [mediaRecorder, isRecording]);

  // Load data from backend API
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // If specific assignment provided, load that assignment's details
        console.log('🔍 Loading assignment details for:', assignmentId);
        if (assignmentId) {
          console.log('🔍 Fetching assignment from API...');
          const assignmentResponse = await fetch(`/api/assignments/${assignmentId}`);
          if (assignmentResponse.ok) {
            const assignmentData = await assignmentResponse.json();
            console.log('🔍 Assignment data loaded:', assignmentData);
            setAssignment(assignmentData);
            setPeerReviewScope(assignmentData.peerReviewScope || 'section');
          } else {
            console.error('🔍 Failed to fetch assignment:', assignmentResponse.status);
          }
        } else {
          console.warn('🔍 No assignmentId provided, cannot load assignment details');
        }
        
        // Load current user's section
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setCurrentUserSection(userData.sectionId || null);
        }
        
        // Build API URL - if no assignment/course specified, load ALL peer videos
        let apiUrl = '/api/student/community/submissions';
        const params = new URLSearchParams();
        if (user?.id) params.append('studentId', user.id);
        if (assignmentId) params.append('assignmentId', assignmentId);
        if (courseId) params.append('courseId', courseId);
        
        if (params.toString()) {
          apiUrl += '?' + params.toString();
        }
        
        const videosResponse = await fetch(apiUrl);
        
        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          let filteredVideos = videosData;
          
          // Filter videos based on peer review scope (only if we have an assignment with scope)
          if (assignmentId && peerReviewScope === 'section' && currentUserSection) {
            filteredVideos = videosData.filter((video: PeerVideo) => 
              video.sectionId === currentUserSection
            );
          }
          
          setPeerVideos(filteredVideos);
        } else {
          console.error('Failed to fetch peer videos. Status:', videosResponse.status);
          setPeerVideos([]);
        }
        
        // Load existing responses (only if assignmentId is provided)
        if (assignmentId) {
          await loadExistingResponses(assignmentId);
        }
        
        setResponseStats({
          totalResponses: 0,
          submittedResponses: 0,
          remainingRequired: 0
        });
      } catch (error) {
        console.error('Error loading peer reviews:', error);
        // Fallback to empty data
        setAssignment(null);
        setPeerVideos([]);
        setResponses(new Map());
        setResponseStats({
          totalResponses: 0,
          submittedResponses: 0,
          remainingRequired: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      loadData();
    }
  }, [assignmentId, courseId, peerReviewScope, currentUserSection, user?.id]);

  const loadExistingResponses = async (assignmentId: string) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(
        `/api/peer-responses?assignmentId=${assignmentId}&studentId=${user.id}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        const responsesData = data.data || [];
        
        // Convert array to Map keyed by videoId
        const responsesMap = new Map<string, PeerResponse>();
        responsesData.forEach((resp: PeerResponse) => {
          responsesMap.set(resp.videoId, resp);
        });
        
        setResponses(responsesMap);
        updateResponseStats(responsesMap);
      }
    } catch (error) {
      console.error('Error loading existing responses:', error);
    }
  };

  const updateResponseStats = (responses: Map<string, PeerResponse>) => {
    const total = responses.size;
    const submitted = Array.from(responses.values()).filter(r => r.isSubmitted).length;
    const remaining = Math.max(0, (assignment?.minResponsesRequired || 0) - submitted);
    
    setResponseStats({
      totalResponses: total,
      submittedResponses: submitted,
      remainingRequired: remaining
    });
  };

  const currentVideo = peerVideos[currentVideoIndex];

  const handleVideoLoad = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const trackView = async (videoId: string) => {
    if (!videoId || !user?.id) {
      console.log('Skipping view tracking - missing videoId or userId');
      return;
    }
    
    try {
      const response = await fetch('/api/videos/track-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: videoId,
          userId: user.id
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.log('View tracking failed:', response.status, response.statusText);
      } else {
        console.log('✅ View tracked successfully for:', videoId);
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
        // Track view when video starts playing
        if (currentVideo) {
          trackView(currentVideo.id);
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Video recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }, 
        audio: true 
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideo(videoUrl);
        setRecordedChunks(chunks);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start(1000); // Collect data every second
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration timer
      const durationInterval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      // Store interval ID for cleanup
      (recorder as any).durationInterval = durationInterval;
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access camera and microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      
      // Clear duration interval
      if ((mediaRecorder as any).durationInterval) {
        clearInterval((mediaRecorder as any).durationInterval);
      }
    }
  };

  const generateThumbnailFromVideo = async (video: HTMLVideoElement, videoId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          console.error('🎬 Cannot get canvas context for thumbnail generation');
          resolve('');
          return;
        }
        
        canvas.width = 400;
        canvas.height = 300;
        
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          console.log('🎬 Thumbnail generated successfully for:', videoId);
          resolve(thumbnail);
        } catch (canvasError) {
          console.error('🎬 Canvas security error for video:', videoId, canvasError);
          // This is likely a CORS issue with S3 videos
          resolve('');
        }
      } catch (error) {
        console.error('🎬 Error generating thumbnail for video:', videoId, error);
        resolve('');
      }
    });
  };

  const generateThumbnail = async (videoBlob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadedmetadata = () => {
        // Set canvas dimensions for thumbnail (16:9 aspect ratio, max 320px width)
        const maxWidth = 320;
        const maxHeight = 180;
        let { videoWidth, videoHeight } = video;
        
        const ratio = Math.min(maxWidth / videoWidth, maxHeight / videoHeight);
        const thumbWidth = videoWidth * ratio;
        const thumbHeight = videoHeight * ratio;
        
        canvas.width = thumbWidth;
        canvas.height = thumbHeight;
        
        // Seek to 2 seconds for better thumbnail (avoid black first frame)
        video.currentTime = Math.min(2.0, video.duration * 0.1); // Use 2 seconds or 10% of duration, whichever is smaller
      };
      
      video.onseeked = () => {
        if (ctx) {
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(thumbnailDataUrl);
          } catch (error) {
            console.error('Canvas security error:', error);
            // Fallback to a placeholder or empty string
            resolve('');
          }
        } else {
          resolve('');
        }
      };
      
      video.onerror = () => resolve('');
      video.src = URL.createObjectURL(videoBlob);
    });
  };

  const compressVideo = async (videoBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadedmetadata = () => {
        // Set canvas dimensions (max 720p for compression)
        const maxWidth = 1280;
        const maxHeight = 720;
        let { videoWidth, videoHeight } = video;
        
        if (videoWidth > maxWidth || videoHeight > maxHeight) {
          const ratio = Math.min(maxWidth / videoWidth, maxHeight / videoHeight);
          videoWidth *= ratio;
          videoHeight *= ratio;
        }
        
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        video.currentTime = 0;
        video.play();
      };
      
      video.onseeked = () => {
        if (ctx) {
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((compressedBlob) => {
              if (compressedBlob) {
                // If compression resulted in larger file, use original
                const compressionRatio = compressedBlob.size / videoBlob.size;
                if (compressionRatio < 0.9) {
                  resolve(compressedBlob);
              } else {
                resolve(videoBlob);
              }
            } else {
              resolve(videoBlob);
            }
            }, 'video/webm', 0.8); // 80% quality
          } catch (error) {
            console.error('Canvas compression error:', error);
            resolve(videoBlob);
          }
        } else {
          resolve(videoBlob);
        }
      };
      
      video.onerror = () => resolve(videoBlob);
      video.src = URL.createObjectURL(videoBlob);
    });
  };

  const uploadRecordedVideo = async (videoBlob: Blob): Promise<{videoUrl: string, thumbnailUrl: string}> => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Generate thumbnail
      setUploadProgress(5);
      const thumbnailDataUrl = await generateThumbnail(videoBlob);
      setUploadProgress(10);
      
      // Compress video if it's larger than 10MB
      let finalBlob = videoBlob;
      if (videoBlob.size > 10 * 1024 * 1024) {
        setUploadProgress(15);
        finalBlob = await compressVideo(videoBlob);
        setUploadProgress(35);
      }
      
      // Upload video
      const videoFormData = new FormData();
      videoFormData.append('file', finalBlob, `peer-response-${Date.now()}.webm`);
      videoFormData.append('folder', 'peer-responses');
      videoFormData.append('userId', 'current_student_id'); // In production, get from auth context
      videoFormData.append('metadata', JSON.stringify({
        assignmentId: assignmentId,
        courseId: courseId,
        responseType: 'video',
        recordedAt: new Date().toISOString(),
        originalSize: videoBlob.size,
        compressedSize: finalBlob.size,
        compressionRatio: (finalBlob.size / videoBlob.size).toFixed(2)
      }));

      setUploadProgress(40);

      const videoResponse = await fetch('/api/upload', {
        method: 'POST',
        body: videoFormData,
      });

      if (!videoResponse.ok) {
        throw new Error('Video upload failed');
      }

      const videoResult = await videoResponse.json();
      setUploadProgress(70);
      
      // Upload thumbnail if generated
      let thumbnailUrl = '';
      if (thumbnailDataUrl) {
        const thumbnailBlob = await fetch(thumbnailDataUrl).then(r => r.blob());
        const thumbnailFormData = new FormData();
        thumbnailFormData.append('file', thumbnailBlob, `thumbnail-${Date.now()}.jpg`);
        thumbnailFormData.append('folder', 'peer-responses/thumbnails');
        thumbnailFormData.append('userId', 'current_student_id');
        thumbnailFormData.append('metadata', JSON.stringify({
          assignmentId: assignmentId,
          courseId: courseId,
          responseType: 'thumbnail',
          generatedAt: new Date().toISOString()
        }));

        setUploadProgress(80);

        const thumbnailResponse = await fetch('/api/upload', {
          method: 'POST',
          body: thumbnailFormData,
        });

        if (thumbnailResponse.ok) {
          const thumbnailResult = await thumbnailResponse.json();
          thumbnailUrl = thumbnailResult.data.fileUrl;
        }
      }

      setUploadProgress(100);
      return {
        videoUrl: videoResult.data.fileUrl,
        thumbnailUrl: thumbnailUrl
      };
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoResponseSubmit = async () => {
    if (!recordedVideo || recordedChunks.length === 0) return;

    try {
      const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
      const { videoUrl, thumbnailUrl } = await uploadRecordedVideo(videoBlob);
      
      // Create response with video
      const response: PeerResponse = {
        id: `response_${currentVideo.id}_${Date.now()}`,
        reviewerId: 'current_student_id',
        reviewerName: 'Current Student',
        videoId: currentVideo.id,
        content: currentResponse,
        submittedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        isSubmitted: true,
        wordCount: currentResponse.trim().split(/\s+/).length,
        characterCount: currentResponse.length,
        responseType: responseType,
        threadLevel: 0,
        videoResponse: {
          videoUrl: videoUrl,
          thumbnailUrl: thumbnailUrl,
          duration: recordingDuration,
          fileSize: videoBlob.size
        }
      };

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setResponses(prev => {
        const newResponses = new Map(prev);
        newResponses.set(currentVideo.id, response);
        updateResponseStats(newResponses);
        return newResponses;
      });

      setCurrentResponse('');
      setRecordedVideo(null);
      setRecordedChunks([]);
      setShowResponseForm(false);
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error submitting video response:', error);
      alert('Failed to upload video. Please try again.');
    }
  };

  const handleResponseChange = (content: string) => {
    setCurrentResponse(content);
    debouncedAutoSave(content);
  };

  const debouncedAutoSave = (() => {
    let timeoutId: NodeJS.Timeout;
    return (content: string) => {
      clearTimeout(timeoutId);
      setSaveStatus('saving');
      timeoutId = setTimeout(() => {
        autoSaveResponse(content);
      }, 1000);
    };
  })();

  const autoSaveResponse = async (content: string) => {
    const effectiveAssignmentId = assignmentId || currentVideo?.assignmentId;
    if (!currentVideo || !user || !effectiveAssignmentId) return;
    if (content.trim().length === 0) return;

    try {
      const existingResponse = responses.get(currentVideo.id);
      
      const responseData = {
        reviewerId: user.id,
        reviewerName: `${user.firstName} ${user.lastName}`,
        videoId: currentVideo.id,
        assignmentId: effectiveAssignmentId,
        content: content,
        isSubmitted: false
      };

      let savedResponse;
      if (existingResponse && existingResponse.id) {
        // Update existing draft
        const updateResponse = await fetch('/api/peer-responses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: existingResponse.id,
            content: content,
            isSubmitted: false
          })
        });

        if (!updateResponse.ok) throw new Error('Failed to update response');
        savedResponse = existingResponse;
      } else {
        // Create new draft
        const postResponse = await fetch('/api/peer-responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(responseData)
        });

        if (!postResponse.ok) throw new Error('Failed to save response');
        const data = await postResponse.json();
        savedResponse = data.data;
      }
      
      setResponses(prev => {
        const newResponses = new Map(prev);
        newResponses.set(currentVideo.id, savedResponse);
        updateResponseStats(newResponses);
        return newResponses;
      });

      setSaveStatus('saved');
      setLastSaved(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error auto-saving response:', error);
      setSaveStatus('error');
    }
  };

  const handleSubmitResponse = async () => {
    // Use assignmentId from URL or fallback to currentVideo's assignmentId
    const effectiveAssignmentId = assignmentId || currentVideo?.assignmentId;
    
    console.log('🔍 Submit Response Debug:', {
      currentVideo: !!currentVideo,
      currentVideoId: currentVideo?.id,
      currentVideoAssignmentId: currentVideo?.assignmentId,
      user: !!user,
      userId: user?.id,
      urlAssignmentId: assignmentId,
      effectiveAssignmentId,
      currentResponse: currentResponse.length,
      recordedVideo: !!recordedVideo
    });
    
    if (!currentVideo || !user || !effectiveAssignmentId) {
      console.error('Missing required data:', { 
        currentVideo: !!currentVideo, 
        user: !!user, 
        urlAssignmentId: assignmentId,
        videoAssignmentId: currentVideo?.assignmentId,
        effectiveAssignmentId 
      });
      showNotificationMessage('Missing required data. Please refresh the page and try again.', 'error');
      return;
    }
    
    // Check if we have content to submit
    const hasTextContent = currentResponse.trim().length > 0;
    const hasVideoContent = recordedVideo && recordedChunks.length > 0;
    
    if (!hasTextContent && !hasVideoContent) {
      showNotificationMessage('Please write a response or record a video before submitting.', 'error');
      return;
    }

    console.log('🚀 Submitting response:', { 
      videoId: currentVideo.id, 
      assignmentId: effectiveAssignmentId, 
      hasTextContent, 
      hasVideoContent,
      textLength: currentResponse.trim().length 
    });

    setIsSubmitting(true);
    try {
      let videoUrl = '';
      let thumbnailUrl = '';
      
      // Upload video if present
      if (hasVideoContent && recordedChunks.length > 0) {
        const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
        const uploadResult = await uploadRecordedVideo(videoBlob);
        videoUrl = uploadResult.videoUrl;
        thumbnailUrl = uploadResult.thumbnailUrl;
      }

      const existingResponse = responses.get(currentVideo.id);
      
      const responseData = {
        reviewerId: user.id,
        reviewerName: `${user.firstName} ${user.lastName}`,
        videoId: currentVideo.id,
        assignmentId: effectiveAssignmentId,
        content: currentResponse,
        isSubmitted: true
      };

      let savedResponse;
      if (existingResponse && existingResponse.id) {
        // Update existing draft to submitted
        const updateResponse = await fetch('/api/peer-responses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: existingResponse.id,
            content: currentResponse,
            isSubmitted: true
          })
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.text();
          console.error('Update response failed:', updateResponse.status, errorData);
          throw new Error(`Failed to submit response: ${updateResponse.status} ${errorData}`);
        }
        const data = await updateResponse.json();
        console.log('✅ Response updated successfully:', data);
        savedResponse = { ...existingResponse, isSubmitted: true, submittedAt: new Date().toISOString() };
      } else {
        // Create new submitted response
        const postResponse = await fetch('/api/peer-responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(responseData)
        });

        if (!postResponse.ok) {
          const errorData = await postResponse.text();
          console.error('Post response failed:', postResponse.status, errorData);
          throw new Error(`Failed to submit response: ${postResponse.status} ${errorData}`);
        }
        const data = await postResponse.json();
        console.log('✅ Response created successfully:', data);
        savedResponse = data.data;
      }
      
      setResponses(prev => {
        const newResponses = new Map(prev);
        newResponses.set(currentVideo.id, savedResponse);
        updateResponseStats(newResponses);
        return newResponses;
      });

      setCurrentResponse('');
      setRecordedVideo(null);
      setRecordedChunks([]);
      setShowResponseForm(false);
      setSaveStatus('saved');
      showNotificationMessage('Response submitted successfully!', 'success');
    } catch (error) {
      console.error('Error submitting response:', error);
      showNotificationMessage('Failed to submit response. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToVideo = (index: number) => {
    // Clear autoscroll timer when user manually navigates
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
    }
    
    // Clear countdown
    setAutoscrollCountdown(null);
    
    setCurrentVideoIndex(index);
    setCurrentResponse(responses.get(peerVideos[index]?.id)?.content || '');
    setShowResponseForm(false);
    setSaveStatus('saved');
  };

  const nextVideo = () => {
    if (currentVideoIndex < peerVideos.length - 1) {
      goToVideo(currentVideoIndex + 1);
    }
  };

  const prevVideo = () => {
    if (currentVideoIndex > 0) {
      goToVideo(currentVideoIndex - 1);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Debounce scroll events to avoid rapid navigation
    const now = Date.now();
    if (now - lastScrollTime < 500) return; // 500ms debounce
    
    // Use a threshold to avoid accidental navigation
    if (Math.abs(e.deltaY) < 100) return;
    
    setLastScrollTime(now);
    
    // Navigate based on scroll direction
    if (e.deltaY > 0) {
      // Scrolling down - go to next video
      if (currentVideoIndex < peerVideos.length - 1) {
        console.log('🖱️ Scroll navigation: Next video');
        nextVideo();
      }
    } else {
      // Scrolling up - go to previous video
      if (currentVideoIndex > 0) {
        console.log('🖱️ Scroll navigation: Previous video');
        prevVideo();
      }
    }
  };

  // Auto-scroll to next video after video starts playing
  useEffect(() => {
    if (isPlaying && autoScrollEnabled && currentVideoIndex < peerVideos.length - 1) {
      console.log('🎬 Autoscroll active for video:', currentVideoIndex, 'next in 10 seconds');
      
      // Clear any existing timeout
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
      
      // Start countdown
      setAutoscrollCountdown(10);
      
      // Set timer to advance to next video (10 seconds for peer review videos)
      autoScrollTimeoutRef.current = setTimeout(() => {
        console.log('⏭️ Auto-advancing to next video:', currentVideoIndex + 1);
        setAutoscrollCountdown(null);
        nextVideo();
      }, 10000); // 10 seconds for peer review videos
      
      // Update countdown every second
      const countdownInterval = setInterval(() => {
        setAutoscrollCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        clearInterval(countdownInterval);
      };
    } else {
      setAutoscrollCountdown(null);
      console.log('🎬 Autoscroll conditions:', {
        isPlaying,
        autoScrollEnabled,
        currentVideoIndex,
        totalVideos: peerVideos.length,
        hasNext: currentVideoIndex < peerVideos.length - 1
      });
    }
    
    // Cleanup timeout on unmount or when video stops playing
    return () => {
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
    };
  }, [isPlaying, autoScrollEnabled, currentVideoIndex, peerVideos.length]);

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

  // Show empty state only if there are truly no videos
  if (peerVideos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Peer Videos Available</h3>
          <p className="text-gray-600 mb-6">
            There are currently no peer video submissions available for review. This feature will be populated when your classmates submit their video assignments.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Return to Dashboard
            </button>
            <button
              onClick={() => router.push('/student/assignments')}
              className="w-full px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              View My Assignments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" onWheel={handleWheel}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-2 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="text-gray-600 hover:text-gray-800 transition-colors flex-shrink-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">Peer Video Reviews</h1>
              <p className="text-sm sm:text-base text-gray-600 truncate">
                {assignment ? assignment.title : `${peerVideos.length} videos to review`}
              </p>
              <div className="flex items-center mt-1">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  peerReviewScope === 'section' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {peerReviewScope === 'section' ? '👥 Section Only' : '🌐 Course Wide'}
                </span>
                {peerReviewScope === 'section' && currentUserSection && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Your section only)
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <div className="hidden sm:block text-sm text-gray-600">
              {responseStats.submittedResponses}/{assignment?.minResponsesRequired || 0} responses submitted
            </div>
            <div className="flex items-center space-x-2">
              <img
                src="/MyClassCast (800 x 200 px).png"
                alt="MyClassCast"
                className="h-6 sm:h-8 w-auto object-contain max-w-[120px] sm:max-w-none"
              />
            </div>
          </div>
        </div>
        {/* Mobile response counter */}
        <div className="sm:hidden mt-2 text-xs text-gray-600 text-center">
          {responseStats.submittedResponses}/{assignment?.minResponsesRequired || 0} responses submitted
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Video Player Section */}
        <div className="flex-shrink-0">
          {/* Video Player */}
          <div className="bg-black relative aspect-video w-full">
            {currentVideo.isYouTube || currentVideo.youtubeUrl ? (
              <YouTubePlayer
                url={currentVideo.youtubeUrl || currentVideo.videoUrl}
                title={currentVideo.title}
                className="w-full h-full"
              />
            ) : (
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                preload="metadata"
                crossOrigin="anonymous"
                playsInline
                webkit-playsinline="true"
                muted
                onLoadedMetadata={(e) => {
                  handleVideoLoad(e);
                  // Seek to 2 seconds for thumbnail display
                  const video = e.currentTarget;
                  video.currentTime = 2.0;
                }}
                onTimeUpdate={handleTimeUpdate}
                onCanPlay={() => {
                  // Safari: Ensure video is ready for playback
                  const video = videoRef.current;
                  if (video && !isPlaying) {
                    video.play().catch(() => {
                      // Autoplay failed, user interaction required
                      setIsPlaying(false);
                    });
                  }
                }}
                onSeeked={(e) => {
                  const video = e.currentTarget;
                  console.log('🎬 Main video seeked to:', video.currentTime, 'for video:', currentVideo?.id);
                  if (currentVideo && !videoThumbnails[currentVideo.id] && video.currentTime >= 2.0 && video.currentTime < 3.0) {
                    console.log('🎬 Attempting thumbnail generation for main video:', currentVideo.id);
                    generateThumbnailFromVideo(video, currentVideo.id).then(thumbnail => {
                      if (thumbnail) {
                        setVideoThumbnails(prev => ({ ...prev, [currentVideo.id]: thumbnail }));
                      }
                    }).catch(error => {
                      console.error('🎬 Thumbnail generation failed for main video:', currentVideo.id, error);
                    });
                  }
                }}
                onPlay={() => {
                  setIsPlaying(true);
                  // Track view when video starts playing
                  if (currentVideo) {
                    trackView(currentVideo.id);
                  }
                }}
                onPause={() => setIsPlaying(false)}
                poster={currentVideo.thumbnailUrl !== '/api/placeholder/300/200' ? currentVideo.thumbnailUrl : undefined}
              >
                <source src={getVideoUrl(currentVideo.videoUrl)} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4">
              <div className="flex items-center space-x-4 text-white">
                <button
                  onClick={handlePlayPause}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
                
                <div className="flex-1">
                  <div className="w-full bg-white/30 rounded-full h-1">
                    <div 
                      className="bg-white h-1 rounded-full transition-all duration-300"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                </div>
                
                <span className="text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>

          {/* Video Info */}
          <div className="bg-white p-3 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 mb-4 lg:mb-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                  {currentVideo.title}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mb-4">{currentVideo.description}</p>
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500">
                  <span>👤 {currentVideo.studentName}</span>
                  <span>📅 {new Date(currentVideo.submittedAt).toLocaleDateString()}</span>
                  <span>⏱️ {formatTime(currentVideo.duration)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                {/* Like Button */}
                <button
                  onClick={() => handleLike(currentVideo.id)}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-colors ${
                    currentVideo.userLiked
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-base sm:text-lg">{currentVideo.userLiked ? '❤️' : '🤍'}</span>
                  <span className="text-xs sm:text-sm font-medium">{currentVideo.likes}</span>
                </button>

                {/* Rating Stars */}
                <div className="flex items-center space-x-1">
                  <span className="hidden sm:inline text-sm text-gray-600 mr-2">Rate:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(currentVideo.id, star)}
                      className={`text-base sm:text-lg transition-colors ${
                        currentVideo.userRating && star <= currentVideo.userRating
                          ? 'text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    >
                      {currentVideo.userRating && star <= currentVideo.userRating ? '★' : '☆'}
                    </button>
                  ))}
                  <span className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2">
                    ({(currentVideo.averageRating || 0).toFixed(1)})
                  </span>
                </div>

                <button
                  onClick={() => setShowResponseForm(!showResponseForm)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {showResponseForm ? 'Hide Response' : 'Write Response'}
                </button>
                {responses.has(currentVideo.id) && (
                  <span className="text-sm text-green-600 font-medium">
                    ✓ Responded
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Response Form */}
          {showResponseForm && (
            <div className="bg-white p-6 border-b border-gray-200">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Response to {currentVideo.studentName}'s Video
                </label>
                
                {/* Response Type Selection */}
                {assignment?.allowVideoResponses && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Response Type
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="text"
                          checked={responseType === 'text'}
                          onChange={(e) => setResponseType(e.target.value as 'text')}
                          className="mr-2"
                        />
                        Text
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="video"
                          checked={responseType === 'video'}
                          onChange={(e) => setResponseType(e.target.value as 'video')}
                          className="mr-2"
                        />
                        Video
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="mixed"
                          checked={responseType === 'mixed'}
                          onChange={(e) => setResponseType(e.target.value as 'mixed')}
                          className="mr-2"
                        />
                        Text + Video
                      </label>
                    </div>
                  </div>
                )}

                {/* Text Response */}
                {(responseType === 'text' || responseType === 'mixed') && (
                  <div className="mb-4">
                    <textarea
                      value={currentResponse}
                      onChange={(e) => handleResponseChange(e.target.value)}
                      placeholder="Write your detailed response here. Consider the rubric criteria: content quality, engagement, critical thinking, and communication..."
                      className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                      <span>
                        {currentResponse.trim().split(/\s+/).length} words, {currentResponse.length} characters
                      </span>
                      <div className="flex items-center space-x-2">
                        {saveStatus === 'saving' && (
                          <span className="text-yellow-600">💾 Saving...</span>
                        )}
                        {saveStatus === 'saved' && lastSaved && (
                          <span className="text-green-600">✓ Saved at {lastSaved}</span>
                        )}
                        {saveStatus === 'error' && (
                          <span className="text-red-600">❌ Save failed</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Video Response */}
                {(responseType === 'video' || responseType === 'mixed') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Video Response
                    </label>
                    {recordedVideo ? (
                      <div className="space-y-2">
                        <div className="bg-black rounded-lg overflow-hidden aspect-video max-w-md">
                          <video
                            className="w-full h-full object-contain"
                            controls
                            playsInline
                            webkit-playsinline="true"
                            src={recordedVideo}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Duration: {formatTime(recordingDuration)} | 
                            Size: {(new Blob(recordedChunks).size / (1024 * 1024)).toFixed(1)} MB
                          </div>
                          <button
                            onClick={() => {
                              setRecordedVideo(null);
                              setRecordedChunks([]);
                              setRecordingDuration(0);
                            }}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Remove Video
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        {isRecording ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-red-600 font-medium">Recording...</span>
                              <span className="text-gray-600">{formatTime(recordingDuration)}</span>
                            </div>
                            <button
                              onClick={stopRecording}
                              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                              Stop Recording
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <button
                              onClick={startRecording}
                              disabled={isUploading}
                              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                              {isUploading ? 'Uploading...' : 'Record Video Response'}
                            </button>
                            <p className="text-sm text-gray-500">
                              Record a video to explain your perspective
                            </p>
                            {isUploading && (
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Minimum {assignment?.minResponsesRequired} responses required
                  {assignment?.responseWordLimit && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({assignment.responseWordLimit} words minimum)
                    </span>
                  )}
                  {assignment?.responseCharacterLimit && !assignment?.responseWordLimit && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({assignment.responseCharacterLimit} characters minimum)
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSubmitResponse}
                  disabled={(!currentResponse.trim() && !recordedVideo) || isSubmitting || isUploading}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : isUploading ? 'Uploading...' : 'Submit Response'}
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="bg-white p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={prevVideo}
                disabled={currentVideoIndex === 0}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Video {currentVideoIndex + 1} of {peerVideos.length}
                </span>
                <span className="text-xs text-gray-500 hidden sm:inline">
                  (Scroll to navigate)
                </span>
                
                {/* Autoscroll Toggle */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setAutoScrollEnabled(!autoScrollEnabled);
                      if (autoScrollTimeoutRef.current) {
                        clearTimeout(autoScrollTimeoutRef.current);
                      }
                      setAutoscrollCountdown(null);
                    }}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors text-sm ${
                      autoScrollEnabled 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={autoScrollEnabled ? 'Disable autoscroll (10s)' : 'Enable autoscroll (10s)'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {autoScrollEnabled ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                    <span className="hidden sm:inline">
                      {autoScrollEnabled ? 'Auto ON' : 'Auto OFF'}
                    </span>
                  </button>
                  
                  {/* Countdown Indicator */}
                  {autoscrollCountdown !== null && autoScrollEnabled && isPlaying && currentVideoIndex < peerVideos.length - 1 && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{autoscrollCountdown}s</span>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={nextVideo}
                disabled={currentVideoIndex === peerVideos.length - 1}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* Video List - Scrollable */}
        <div className="flex-1 bg-white overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">All Peer Videos ({peerVideos.length})</h3>
            <div className="text-sm text-gray-600">
              {responseStats.submittedResponses} of {assignment?.minResponsesRequired || 0} responses submitted
            </div>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {peerVideos.map((video, index) => (
                <div
                  key={video.id}
                  onClick={() => goToVideo(index)}
                  className={`bg-white rounded-lg shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
                    index === currentVideoIndex
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                    <video
                      src={getVideoUrl(video.videoUrl)}
                      className="w-full h-full object-cover"
                      preload="metadata"
                      crossOrigin="anonymous"
                      playsInline
                      webkit-playsinline="true"
                      muted
                      onLoadedMetadata={(e) => {
                        const vid = e.currentTarget;
                        vid.currentTime = 2.0;
                      }}
                      onError={(e) => {
                        console.error('Video thumbnail failed to load:', video.id);
                      }}
                      poster={video.thumbnailUrl !== '/api/placeholder/300/200' ? video.thumbnailUrl : undefined}
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-gray-800 text-sm truncate mb-1">
                      {video.title}
                    </h4>
                    <p className="text-xs text-gray-600 truncate mb-1">
                      {video.studentName}
                    </p>
                    {video.sectionName && (
                      <div className="flex items-center mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          video.sectionId === currentUserSection 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {video.sectionId === currentUserSection ? '👥' : '🌐'} {video.sectionName}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {formatTime(video.duration)}
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">❤️ {video.likes || 0}</span>
                          <span className="text-xs">⭐ {(video.averageRating || 0).toFixed(1)}</span>
                        </div>
                      </div>
                      {responses.has(video.id) && (
                        <span className="text-xs text-green-600 font-medium">
                          ✓ Responded
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg border-l-4 ${
            showNotification.type === 'success' 
              ? 'bg-green-50 border-green-400 text-green-800' 
              : 'bg-red-50 border-red-400 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {showNotification.type === 'success' ? '✅' : '❌'}
              </span>
              <span className="font-medium">{showNotification.message}</span>
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
