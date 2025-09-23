'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

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
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [peerVideos, setPeerVideos] = useState<PeerVideo[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, PeerResponse>>(new Map());
  const [currentResponse, setCurrentResponse] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
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

  // Like and rating functions
  const handleLike = async (videoId: string) => {
    try {
      const response = await fetch('/api/peer-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: videoId,
          studentId: 'current_student_id', // In production, get from auth context
          action: 'like'
        })
      });

      if (response.ok) {
        setPeerVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { 
                ...video, 
                userLiked: !video.userLiked,
                likes: video.userLiked ? video.likes - 1 : video.likes + 1
              }
            : video
        ));
      }
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleRating = async (videoId: string, rating: number) => {
    try {
      const response = await fetch('/api/peer-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: videoId,
          studentId: 'current_student_id', // In production, get from auth context
          action: 'rate',
          rating: rating
        })
      });

      if (response.ok) {
        setPeerVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { 
                ...video, 
                userRating: rating,
                averageRating: calculateNewAverageRating(video.averageRating, video.userRating, rating)
              }
            : video
        ));
      }
    } catch (error) {
      console.error('Error rating video:', error);
    }
  };

  const calculateNewAverageRating = (currentAverage: number, oldRating: number | null, newRating: number): number => {
    // This is a simplified calculation - in production, you'd want to track total ratings and count
    if (oldRating === null) {
      return (currentAverage + newRating) / 2; // Simplified for demo
    }
    return currentAverage + (newRating - oldRating) / 10; // Simplified for demo
  };

  const assignmentId = searchParams.get('assignment') || 'assignment_1';
  const courseId = searchParams.get('course') || 'cs-101';

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

  // Mock data - in production, this would come from API
  useEffect(() => {
    // Always load data, use defaults if no URL params
    const loadData = async () => {
      // Mock assignment data
      const mockAssignment: Assignment = {
        id: assignmentId,
        title: 'Video Presentation Assignment',
        description: 'Create a 5-minute presentation on your chosen topic and review your peers\' videos.',
        dueDate: '2024-02-15T23:59:59Z',
        courseId: courseId,
        courseName: 'Introduction to Computer Science',
        assignmentType: 'video_presentation',
        peerReviewRequired: true,
        minResponsesRequired: 2,
        maxResponsesAllowed: 5,
        allowVideoResponses: true,
        allowThreadedDiscussions: true,
        maxThreadDepth: 3,
        rubric: {
          contentQuality: { possible: 25, description: 'Depth and accuracy of content' },
          engagement: { possible: 25, description: 'How well the presentation engages the audience' },
          criticalThinking: { possible: 25, description: 'Analysis and critical evaluation' },
          communication: { possible: 25, description: 'Clarity and effectiveness of communication' }
        },
        instructions: 'Please watch at least 2 peer videos and provide thoughtful, constructive feedback. You can respond with text, video, or both. Engage in discussions with your peers by replying to their responses.',
        responseGuidelines: [
          'Be constructive and respectful in your feedback',
          'Provide specific examples and suggestions',
          'Engage in meaningful discussions with peers',
          'Use video responses when you want to demonstrate concepts'
        ]
      };

      // Mock peer videos with comprehensive data
      const mockPeerVideos: PeerVideo[] = [
        {
          id: 'video_1',
          studentId: 'student_1',
          studentName: 'Alex Johnson',
          studentEmail: 'alex.johnson@university.edu',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
          title: 'Machine Learning Fundamentals',
          description: 'An comprehensive overview of basic machine learning concepts, including supervised and unsupervised learning, neural networks, and practical applications in real-world scenarios.',
          submittedAt: '2024-01-20T14:30:00Z',
          duration: 320,
          assignmentId: assignmentId,
          assignmentTitle: mockAssignment.title,
          courseId: courseId,
          courseName: mockAssignment.courseName,
          likes: 12,
          averageRating: 4.2,
          userLiked: false,
          userRating: null
        },
        {
          id: 'video_2',
          studentId: 'student_2',
          studentName: 'Sarah Chen',
          studentEmail: 'sarah.chen@university.edu',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
          thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg',
          title: 'Data Structures and Algorithms',
          description: 'Exploring common data structures and their implementations, with detailed explanations of time complexity and space complexity for each algorithm.',
          submittedAt: '2024-01-21T09:15:00Z',
          duration: 280,
          assignmentId: assignmentId,
          assignmentTitle: mockAssignment.title,
          courseId: courseId,
          courseName: mockAssignment.courseName,
          likes: 8,
          averageRating: 4.5,
          userLiked: true,
          userRating: 5
        },
        {
          id: 'video_3',
          studentId: 'student_3',
          studentName: 'Michael Rodriguez',
          studentEmail: 'michael.rodriguez@university.edu',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Toshiba_Canvio_Advance.mp4',
          thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Toshiba_Canvio_Advance.jpg',
          title: 'Web Development Best Practices',
          description: 'Tips and techniques for building modern web applications, covering responsive design, performance optimization, and security considerations.',
          submittedAt: '2024-01-22T16:45:00Z',
          duration: 350,
          assignmentId: assignmentId,
          assignmentTitle: mockAssignment.title,
          courseId: courseId,
          courseName: mockAssignment.courseName,
          likes: 15,
          averageRating: 3.8,
          userLiked: false,
          userRating: null
        },
        {
          id: 'video_4',
          studentId: 'student_4',
          studentName: 'Emily Watson',
          studentEmail: 'emily.watson@university.edu',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
          thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/VolkswagenGTIReview.jpg',
          title: 'Database Design Principles',
          description: 'Understanding relational database design, normalization, indexing strategies, and query optimization techniques for efficient data management.',
          submittedAt: '2024-01-23T11:20:00Z',
          duration: 420,
          assignmentId: assignmentId,
          assignmentTitle: mockAssignment.title,
          courseId: courseId,
          courseName: mockAssignment.courseName,
          likes: 6,
          averageRating: 4.0,
          userLiked: false,
          userRating: 4
        },
        {
          id: 'video_5',
          studentId: 'student_5',
          studentName: 'David Kim',
          studentEmail: 'david.kim@university.edu',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
          thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WhatCarCanYouGetForAGrand.jpg',
          title: 'Software Testing Strategies',
          description: 'Comprehensive guide to software testing methodologies, including unit testing, integration testing, and automated testing frameworks.',
          submittedAt: '2024-01-24T08:45:00Z',
          duration: 380,
          assignmentId: assignmentId,
          assignmentTitle: mockAssignment.title,
          courseId: courseId,
          courseName: mockAssignment.courseName,
          likes: 9,
          averageRating: 4.3,
          userLiked: true,
          userRating: null
        },
        {
          id: 'video_6',
          studentId: 'student_6',
          studentName: 'Lisa Thompson',
          studentEmail: 'lisa.thompson@university.edu',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
          thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WeAreGoingOnBullrun.jpg',
          title: 'Cloud Computing Architecture',
          description: 'Introduction to cloud computing concepts, including microservices, containerization, and deployment strategies using modern cloud platforms.',
          submittedAt: '2024-01-25T13:30:00Z',
          duration: 450,
          assignmentId: assignmentId,
          assignmentTitle: mockAssignment.title,
          courseId: courseId,
          courseName: mockAssignment.courseName,
          likes: 11,
          averageRating: 4.6,
          userLiked: false,
          userRating: 5
        }
      ];

      setAssignment(mockAssignment);
      setPeerVideos(mockPeerVideos);
      
      // Load existing responses
      loadExistingResponses(assignmentId);
    };

    loadData();
  }, [assignmentId, courseId]);

  const loadExistingResponses = async (assignmentId: string) => {
    try {
      // Mock existing responses to simulate a student who has already started reviewing
      const mockResponses = new Map<string, PeerResponse>();
      
      // Add some existing responses
      mockResponses.set('video_1', {
        id: 'response_video_1_001',
        reviewerId: 'current_student_id',
        reviewerName: 'Current Student',
        videoId: 'video_1',
        content: 'Alex, your explanation of machine learning fundamentals was really clear and well-structured. I particularly liked how you broke down the different types of learning algorithms. The examples you used made it easy to understand the concepts. One suggestion would be to include more visual diagrams to illustrate the neural network architecture. Overall, great presentation!',
        submittedAt: '2024-01-23T10:15:00Z',
        lastSavedAt: '2024-01-23T10:15:00Z',
        isSubmitted: true,
        wordCount: 67,
        characterCount: 456
      });

      mockResponses.set('video_2', {
        id: 'response_video_2_001',
        reviewerId: 'current_student_id',
        reviewerName: 'Current Student',
        videoId: 'video_2',
        content: 'Sarah, excellent work on the data structures presentation! Your code examples were very helpful and the time complexity analysis was thorough. I learned a lot about how different algorithms perform in various scenarios. The way you explained the trade-offs between different data structures was particularly insightful. Keep up the great work!',
        submittedAt: '2024-01-23T14:30:00Z',
        lastSavedAt: '2024-01-23T14:30:00Z',
        isSubmitted: true,
        wordCount: 58,
        characterCount: 398
      });

      // Add a draft response (not yet submitted)
      mockResponses.set('video_3', {
        id: 'response_video_3_001',
        reviewerId: 'current_student_id',
        reviewerName: 'Current Student',
        videoId: 'video_3',
        content: 'Michael, your web development presentation covered a lot of important topics. I found the section on performance optimization particularly useful. However, I think you could have spent more time on security considerations as that\'s such an important aspect of modern web development. The examples you provided were good, but maybe include some code snippets to make it more practical.',
        submittedAt: '2024-01-24T09:20:00Z',
        lastSavedAt: '2024-01-24T09:20:00Z',
        isSubmitted: false,
        wordCount: 71,
        characterCount: 487
      });

      setResponses(mockResponses);
      updateResponseStats(mockResponses);
    } catch (error) {
      console.error('Error loading responses:', error);
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
    try {
      await fetch('/api/videos/track-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: videoId,
          userId: 'current_student_id' // In real app, get from auth context
        }),
      });
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
        
        // Seek to 25% of video duration for thumbnail
        video.currentTime = video.duration * 0.25;
      };
      
      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnailDataUrl);
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
    if (!currentVideo) return;

    try {
      const response: PeerResponse = {
        id: `response_${currentVideo.id}_${Date.now()}`,
        reviewerId: 'current_student_id', // In production, get from auth context
        reviewerName: 'Current Student', // In production, get from auth context
        videoId: currentVideo.id,
        content: content,
        submittedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        isSubmitted: false,
        wordCount: content.trim().split(/\s+/).length,
        characterCount: content.length
      };

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setResponses(prev => {
        const newResponses = new Map(prev);
        newResponses.set(currentVideo.id, response);
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
    if (!currentVideo) return;
    
    // Check if we have content to submit
    const hasTextContent = currentResponse.trim().length > 0;
    const hasVideoContent = recordedVideo && recordedChunks.length > 0;
    
    if (!hasTextContent && !hasVideoContent) return;

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
        videoResponse: hasVideoContent ? {
          videoUrl: videoUrl,
          thumbnailUrl: thumbnailUrl,
          duration: recordingDuration,
          fileSize: recordedChunks.length > 0 ? new Blob(recordedChunks).size : 0
        } : undefined
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
      console.error('Error submitting response:', error);
      alert('Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToVideo = (index: number) => {
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

  if (!assignment || !currentVideo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading peer videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-2 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="text-gray-600 hover:text-gray-800 transition-colors flex-shrink-0"
            >
              <span className="text-xl sm:text-2xl">&lt;</span>
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">Peer Video Reviews</h1>
              <p className="text-sm sm:text-base text-gray-600 truncate">{assignment.title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <div className="hidden sm:block text-sm text-gray-600">
              {responseStats.submittedResponses}/{assignment.minResponsesRequired} responses submitted
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
          {responseStats.submittedResponses}/{assignment.minResponsesRequired} responses submitted
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Video Player Section */}
        <div className="flex-1 flex flex-col">
          {/* Video Player */}
          <div className="bg-black relative">
            <video
              ref={videoRef}
              className="w-full h-64 sm:h-96 object-cover"
              onLoadedMetadata={handleVideoLoad}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => {
                setIsPlaying(true);
                // Track view when video starts playing
                if (currentVideo) {
                  trackView(currentVideo.id);
                }
              }}
              onPause={() => setIsPlaying(false)}
              poster={currentVideo.thumbnailUrl}
            >
              <source src={currentVideo.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
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
                      ⭐
                    </button>
                  ))}
                  <span className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2">
                    ({currentVideo.averageRating.toFixed(1)})
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
                        <video
                          className="w-full max-w-md rounded-lg"
                          controls
                          src={recordedVideo}
                        />
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
              <span className="text-sm text-gray-600">
                Video {currentVideoIndex + 1} of {peerVideos.length}
              </span>
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

        {/* Video List Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">Peer Videos</h3>
            <div className="text-sm text-gray-600">
              {responseStats.submittedResponses} of {assignment.minResponsesRequired} responses submitted
            </div>
          </div>
          
          <div className="p-2">
            {peerVideos.map((video, index) => (
              <div
                key={video.id}
                onClick={() => goToVideo(index)}
                className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                  index === currentVideoIndex
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-16 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 text-sm truncate">
                      {video.title}
                    </h4>
                    <p className="text-xs text-gray-600 truncate">
                      {video.studentName}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {formatTime(video.duration)}
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">❤️ {video.likes}</span>
                          <span className="text-xs">⭐ {video.averageRating.toFixed(1)}</span>
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
