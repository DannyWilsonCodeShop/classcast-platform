'use client';

import React, { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { isValidYouTubeUrl, extractYouTubeVideoId, getYouTubeThumbnail } from '@/lib/youtube';

const VideoSubmissionContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  
  // Get assignment and course IDs from URL parameters
  const assignmentId = searchParams.get('assignmentId') || 'temp-assignment';
  const courseId = searchParams.get('courseId') || 'temp-course';
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'record' | 'upload' | 'youtube'>('record');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [assignmentTitle, setAssignmentTitle] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Load assignment data to get the assignment title
  React.useEffect(() => {
    const loadAssignment = async () => {
      if (assignmentId && assignmentId !== 'temp-assignment') {
        try {
          const response = await fetch(`/api/assignments/${assignmentId}`, {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            console.log('📝 Assignment data loaded:', data);
            if (data.success && data.data?.assignment?.title) {
              console.log('📝 Setting assignment title:', data.data.assignment.title);
              setAssignmentTitle(data.data.assignment.title);
            } else {
              console.log('📝 No assignment title found in response');
            }
          }
        } catch (error) {
          console.error('Error loading assignment:', error);
        }
      }
    };
    
    loadAssignment();
  }, [assignmentId]);

  const clearOldVideos = () => {
    try {
      // Clear localStorage if it's getting too full
      const stored = localStorage.getItem('uploadedVideos');
      if (stored) {
        const videos = JSON.parse(stored);
        if (videos.length > 5) {
          // Keep only the last 5 videos
          const recentVideos = videos.slice(-5);
          localStorage.setItem('uploadedVideos', JSON.stringify(recentVideos));
        }
      }
    } catch (error) {
      console.warn('Error clearing old videos:', error);
      // If localStorage is completely full, clear it
      localStorage.removeItem('uploadedVideos');
    }
  };

  // Clear old videos on component mount to prevent quota issues
  React.useEffect(() => {
    clearOldVideos();
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      // Try to get optimal constraints first, fallback to basic if needed
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            aspectRatio: { ideal: 16/9 },
            facingMode: 'user'
          }, 
          audio: true 
        });
      } catch (error) {
        console.log('Optimal constraints failed, trying basic constraints:', error);
        // Fallback to basic constraints for mobile devices
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user'
          }, 
          audio: true 
        });
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideo(videoUrl);
      };

      mediaRecorder.start();
      setIsRecording(true);
      } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access camera and microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const uploadVideo = async () => {
    const videoToUpload = recordedVideo || uploadedVideo;
    if (!videoToUpload) return;

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      let videoBlob: Blob;
      let fileName: string;
      let videoType: string;

      if (recordedVideo) {
        // Handle recorded video
        const response = await fetch(recordedVideo);
        videoBlob = await response.blob();
        fileName = `video-submission-${Date.now()}.webm`;
        videoType = videoBlob.type;
      } else if (selectedFile) {
        // Handle uploaded file
        videoBlob = selectedFile;
        fileName = selectedFile.name;
        videoType = selectedFile.type;
      } else {
        throw new Error('No video to upload');
      }
      
      // Use presigned URL for secure S3 upload
      console.log('Uploading video using presigned URL...');
      
      // Get presigned URL for video upload
      const presignedResponse = await fetch('/api/videos/presigned-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: fileName,
          contentType: videoType,
          userId: user?.id || 'unknown',
          assignmentId: assignmentId
        }),
      });

      if (!presignedResponse.ok) {
        throw new Error('Failed to get presigned URL');
      }

      const { data: presignedData } = await presignedResponse.json();
      const { presignedUrl, videoUrl } = presignedData;

      // Upload video directly to S3 using presigned URL
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: videoBlob,
        headers: {
          'Content-Type': videoType,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video to S3');
      }

      console.log('Video uploaded successfully to S3:', videoUrl);

      // Store video blob in IndexedDB for persistence
      const videoId = `video-${Date.now()}`;
      await storeVideoInIndexedDB(videoId, videoBlob);
      
      // Extract video metadata (duration, resolution)
      let videoDuration = 0;
      let videoWidth = 1920;
      let videoHeight = 1080;
      
      try {
        const metadata = await extractVideoMetadata(videoBlob);
        videoDuration = metadata.duration;
        videoWidth = metadata.width;
        videoHeight = metadata.height;
        console.log('Video metadata extracted:', { duration: videoDuration, width: videoWidth, height: videoHeight });
      } catch (error) {
        console.warn('Could not extract video metadata, using defaults:', error);
        // Try to get duration from the video element if it's displayed
        if (videoRef.current && videoRef.current.duration) {
          videoDuration = Math.floor(videoRef.current.duration);
          console.log('Using duration from video element:', videoDuration);
        }
      }
      
      // Get assignment details to extract sectionId
      let sectionId = null;
      try {
        const assignmentResponse = await fetch(`/api/assignments/${assignmentId}`, {
          credentials: 'include',
        });
        
        if (assignmentResponse.ok) {
          const assignmentData = await assignmentResponse.json();
          if (assignmentData.success && assignmentData.assignment) {
            sectionId = assignmentData.assignment.sectionId;
            console.log('Found sectionId for assignment:', sectionId);
          }
        }
      } catch (error) {
        console.warn('Could not fetch assignment details for sectionId:', error);
      }

      // Now submit the video as an assignment submission
      const finalVideoTitle = assignmentTitle || `Video Submission - ${new Date().toLocaleDateString()}`;
      console.log('📝 Final video title being sent:', finalVideoTitle, 'assignmentTitle:', assignmentTitle);
      
      const submissionData = {
        assignmentId: assignmentId, // Use the actual assignment ID from URL params
        studentId: user?.id || 'unknown',
        courseId: courseId, // Use the actual course ID from URL params
        sectionId: sectionId, // Add sectionId if available
        videoUrl: videoUrl, // Now using the actual S3 URL
        videoId: videoId, // Store the IndexedDB key for retrieval
        videoTitle: finalVideoTitle,
        videoDescription: 'Student video submission',
        duration: videoDuration, // Use extracted video duration
        fileName: fileName,
        fileSize: videoBlob.size,
        fileType: videoType,
        isRecorded: !!recordedVideo,
        isUploaded: !!selectedFile,
        isLocalStorage: false // Now using S3 storage
      };

      const submissionResponse = await fetch('/api/video-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!submissionResponse.ok) {
        throw new Error('Failed to submit video assignment');
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Simulate successful upload
      setSuccess(true);
      
      // Auto-redirect to dashboard after 3 seconds
      setTimeout(() => {
    router.push('/student/dashboard');
      }, 3000);
      
      // Store only metadata in localStorage for local reference
      const videoInfo = {
        id: `video-${Date.now()}`,
        blobUrl: videoToUpload, // Keep blob URL for immediate playback
        fileName: fileName,
        uploadedAt: new Date().toISOString(),
        userId: user?.id || 'unknown',
        assignmentId: 'temp-assignment',
        size: videoBlob.size,
        type: videoType,
        isRecorded: !!recordedVideo,
        isUploaded: !!selectedFile,
        videoUrl: videoUrl, // Store the S3 URL
        videoData: null // Will be stored separately
      };
      
      // Store metadata in localStorage (small data only)
      let existingVideos = [];
      try {
        const stored = localStorage.getItem('uploadedVideos');
        existingVideos = stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.warn('Error reading from localStorage, starting fresh');
        existingVideos = [];
      }
      
      existingVideos.push(videoInfo);
      
      // Limit to last 10 videos to prevent quota issues
      if (existingVideos.length > 10) {
        existingVideos = existingVideos.slice(-10);
      }
      
      try {
        localStorage.setItem('uploadedVideos', JSON.stringify(existingVideos));
      } catch (error) {
        console.warn('localStorage quota exceeded, storing in sessionStorage instead');
        // Fallback to sessionStorage if localStorage is full
        sessionStorage.setItem('uploadedVideos', JSON.stringify(existingVideos));
      }
      
      // Store video blob in IndexedDB for persistence
      await storeVideoInIndexedDB(videoInfo.id, videoBlob);

      // Show success message with video preview
      // User can choose to view submissions or go to dashboard

    } catch (err) {
      console.error('Error uploading video:', err);
      setError('Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const retakeVideo = () => {
    setRecordedVideo(null);
    setUploadedVideo(null);
    setSelectedFile(null);
    setYoutubeUrl('');
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
  };

  const handleYouTubeSubmit = async () => {
    if (!youtubeUrl) return;

    // Validate YouTube URL
    if (!isValidYouTubeUrl(youtubeUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Extract video ID
      const videoId = extractYouTubeVideoId(youtubeUrl);
      if (!videoId) {
        throw new Error('Could not extract video ID from URL');
      }

      // Get sectionId from assignment if available
      let sectionId;
      try {
        const assignmentResponse = await fetch(`/api/assignments/${assignmentId}`);
        if (assignmentResponse.ok) {
          const assignmentData = await assignmentResponse.json();
          if (assignmentData.success && assignmentData.assignment) {
            sectionId = assignmentData.assignment.sectionId;
          }
        }
      } catch (error) {
        console.warn('Could not fetch assignment details for sectionId:', error);
      }

      // Submit the YouTube URL as an assignment submission
      const finalYouTubeTitle = assignmentTitle || `YouTube Submission - ${new Date().toLocaleDateString()}`;
      console.log('📝 Final YouTube title being sent:', finalYouTubeTitle, 'assignmentTitle:', assignmentTitle);
      
      const submissionData = {
        assignmentId: assignmentId,
        studentId: user?.id || 'unknown',
        courseId: courseId,
        sectionId: sectionId,
        youtubeUrl: youtubeUrl,
        videoId: videoId,
        thumbnailUrl: getYouTubeThumbnail(youtubeUrl, 'hq'),
        videoTitle: finalYouTubeTitle,
        videoDescription: 'Student YouTube video submission',
        submissionMethod: 'youtube',
        isRecorded: false,
        isUploaded: false,
        isYouTube: true
      };

      setUploadProgress(50);

      const submissionResponse = await fetch('/api/video-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!submissionResponse.ok) {
        throw new Error('Failed to submit YouTube video');
      }

      setUploadProgress(100);
      setSuccess(true);

      // Auto-redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/student/dashboard');
      }, 3000);

    } catch (err) {
      console.error('Error submitting YouTube URL:', err);
      setError('Failed to submit YouTube URL. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file.');
        return;
      }
      
      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setError(
          `⚠️ File Too Large (${fileSizeMB}MB)\n\n` +
          `Your video exceeds the ${Math.round(maxSize / (1024 * 1024))}MB upload limit.\n\n` +
          `📺 Solution: Upload to YouTube Instead\n\n` +
          `1. Upload your video to YouTube (set to Unlisted or Public)\n` +
          `2. Copy the YouTube video URL\n` +
          `3. Switch to the "YouTube URL" tab above\n` +
          `4. Paste your video URL and submit\n\n` +
          `This allows you to submit videos of any size!`
        );
        // Switch to YouTube tab to guide the user
        setActiveTab('youtube');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
      
      // Create preview URL
      const videoUrl = URL.createObjectURL(file);
      setUploadedVideo(videoUrl);
    }
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Extract video metadata (duration, resolution)
  const extractVideoMetadata = async (blob: Blob | File): Promise<{
    duration: number;
    width: number;
    height: number;
  }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(blob);

      video.onloadedmetadata = () => {
        const metadata = {
          duration: Math.floor(video.duration), // Round to nearest second
          width: video.videoWidth,
          height: video.videoHeight,
        };
        URL.revokeObjectURL(url);
        resolve(metadata);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video metadata'));
      };

      video.src = url;
    });
  };

  // IndexedDB functions for storing video data
  const storeVideoInIndexedDB = async (videoId: string, videoBlob: Blob): Promise<void> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VideoStorage', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['videos'], 'readwrite');
        const store = transaction.objectStore('videos');
        const putRequest = store.put(videoBlob, videoId);
        
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('videos')) {
          db.createObjectStore('videos');
        }
      };
    });
  };

  const getVideoFromIndexedDB = async (videoId: string): Promise<Blob | null> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VideoStorage', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['videos'], 'readonly');
        const store = transaction.objectStore('videos');
        const getRequest = store.get(videoId);
        
        getRequest.onsuccess = () => resolve(getRequest.result || null);
        getRequest.onerror = () => reject(getRequest.error);
      };
    });
  };

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3">
            <div className="flex items-center space-x-3">
              <button
              onClick={() => router.push('/student/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              🎥
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900">
                Video Submission
              </h1>
              <p className="text-xs text-gray-600">
                Record and submit your video assignment
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <img
                src="/MyClassCast (800 x 200 px).png"
                alt="MyClassCast"
                className="h-6 w-auto object-contain"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Tab Navigation */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-gray-200/30 mb-6">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
                <button
                  onClick={() => setActiveTab('record')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'record'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🎥 Live Recording
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'upload'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📁 Upload Video
                </button>
                <button
                  onClick={() => setActiveTab('youtube')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'youtube'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ▶️ YouTube URL
                </button>
              </div>

              {activeTab === 'record' && !recordedVideo && (
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Record Your Video</h2>
                  <p className="text-gray-600">
                    Click the record button to start recording your video assignment
                  </p>
                </div>
              )}

              {activeTab === 'upload' && !uploadedVideo && (
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Your Video</h2>
                  <p className="text-gray-600">
                    Select a video file from your device to upload
                  </p>
                </div>
              )}

              {activeTab === 'youtube' && !youtubeUrl && (
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Submit YouTube URL</h2>
                  <p className="text-gray-600">
                    Paste a link to your video on YouTube
                  </p>
                </div>
              )}
            </div>

            {!recordedVideo && !uploadedVideo && !youtubeUrl ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-gray-200/30">

                {/* Video Preview */}
                {activeTab === 'record' && (
                  <div className="relative bg-black rounded-xl overflow-hidden mb-6">
                    <div className="aspect-video w-full max-w-2xl mx-auto">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                    {isRecording && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-500 text-white px-4 py-2 rounded-full flex items-center space-x-2">
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                          <span className="font-semibold">Recording...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Area */}
                {activeTab === 'upload' && (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 mb-6">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">📁</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Select Video File
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Choose a video file from your device (MP4, WebM, MOV, etc.)
                      </p>
                      <button
                        onClick={handleFileUpload}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                      >
                        Choose File
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        Maximum file size: 100MB
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                )}

                {/* YouTube URL Input */}
                {activeTab === 'youtube' && (
                  <div className="mb-6">
                    <div className="max-w-2xl mx-auto">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        YouTube Video URL
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="url"
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={handleYouTubeSubmit}
                          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                          disabled={!youtubeUrl || isUploading}
                        >
                          {isUploading ? 'Submitting...' : 'Submit'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Paste the full URL of your YouTube video. The video should be unlisted or public.
                      </p>
                      {youtubeUrl && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>📌 Important:</strong> Make sure your YouTube video is set to "Unlisted" or "Public" 
                            so your instructor can view it. Private videos cannot be accessed.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recording Controls */}
                {activeTab === 'record' && (
                  <div className="flex justify-center space-x-4">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="px-8 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
                      >
                        <span className="text-xl">🔴</span>
                        <span>Start Recording</span>
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
                      >
                        <span className="text-xl">⏹️</span>
                        <span>Stop Recording</span>
                      </button>
                    )}
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-6 bg-red-50 border-2 border-red-300 rounded-xl shadow-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 text-2xl">
                        {error.includes('File Too Large') ? '📦' : '⚠️'}
                      </div>
                      <div className="flex-1">
                        <pre className="text-red-800 text-sm whitespace-pre-wrap font-sans leading-relaxed">{error}</pre>
                        {error.includes('YouTube') && (
                          <div className="mt-4 pt-4 border-t border-red-200">
                            <div className="flex items-center justify-center space-x-2">
                              <span className="text-blue-600 font-semibold">👆 Switch to YouTube URL tab above</span>
                              <span className="animate-bounce text-xl">⬆️</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-gray-200/30">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Review Your Video</h2>
                  <p className="text-gray-600">
                    {recordedVideo ? 'Review your recording before submitting' : 'Review your uploaded video before submitting'}
                  </p>
            </div>

                {/* Video Preview */}
                <div className="relative bg-black rounded-xl overflow-hidden mb-6">
                  <div className="aspect-video w-full max-w-2xl mx-auto">
                    <video
                      src={recordedVideo || uploadedVideo || undefined}
                      controls
                      playsInline
                      webkit-playsinline="true"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                </div>

                {/* Video Info */}
                {selectedFile && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-800 mb-2">File Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                        <p><strong>Name:</strong> {selectedFile.name}</p>
                        <p><strong>Size:</strong> {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <div>
                        <p><strong>Type:</strong> {selectedFile.type}</p>
                        <p><strong>Last Modified:</strong> {new Date(selectedFile.lastModified).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Uploading...</span>
                      <span className="text-sm text-gray-500">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="mb-6 space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600 text-xl">✅</span>
                        <p className="text-green-800 font-semibold">
                          Video uploaded successfully! Redirecting to dashboard...
                        </p>
                      </div>
                    </div>
                    
                    {/* Video Preview After Upload */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Your Submitted Video:</h4>
                      <div className="aspect-video w-full max-w-md mx-auto">
                        <video
                          src={recordedVideo || uploadedVideo || undefined}
                          controls
                          playsInline
                          webkit-playsinline="true"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex justify-center space-x-4 mt-4">
                        <button
                          onClick={() => router.push('/student/submissions')}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                          View All Submissions
                        </button>
                        <button
                          onClick={() => router.push('/student/dashboard')}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                        >
                          Go to Dashboard
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        This video has been saved and will be available in your submissions.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={retakeVideo}
                    disabled={isUploading}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {recordedVideo ? 'Retake Video' : 'Choose Different File'}
                  </button>
                  <button
                    onClick={uploadVideo}
                    disabled={isUploading || success}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isUploading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl">📤</span>
                        <span>Submit Video</span>
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-6 bg-red-50 border-2 border-red-300 rounded-xl shadow-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 text-2xl">
                        {error.includes('File Too Large') ? '📦' : '⚠️'}
                      </div>
                      <div className="flex-1">
                        <pre className="text-red-800 text-sm whitespace-pre-wrap font-sans leading-relaxed">{error}</pre>
                        {error.includes('YouTube') && (
                          <div className="mt-4 pt-4 border-t border-red-200">
                            <div className="flex items-center justify-center space-x-2">
                              <span className="text-blue-600 font-semibold">👆 Switch to YouTube URL tab above</span>
                              <span className="animate-bounce text-xl">⬆️</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">📋 Recording Tips</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li>• Ensure good lighting and clear audio</li>
                <li>• Look directly at the camera when speaking</li>
                <li>• Keep your video concise and focused</li>
                <li>• Test your recording before submitting</li>
                <li>• Make sure you have a stable internet connection for upload</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </StudentRoute>
  );
};

const VideoSubmissionPage: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <VideoSubmissionContent />
    </Suspense>
  );
};

export default VideoSubmissionPage;