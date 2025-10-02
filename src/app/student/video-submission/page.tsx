'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const VideoSubmissionPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          aspectRatio: { ideal: 16/9 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      
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
      
      // Create a more permanent video URL by converting to base64
      const reader = new FileReader();
      const videoDataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(videoBlob);
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Simulate successful upload
      setSuccess(true);
      
      // Store video info in localStorage for demo purposes
      const videoInfo = {
        id: `video-${Date.now()}`,
        url: videoDataUrl, // Store as data URL for persistence
        blobUrl: videoToUpload, // Keep original blob URL for immediate playback
        fileName: fileName,
        uploadedAt: new Date().toISOString(),
        userId: user?.id || 'unknown',
        assignmentId: 'temp-assignment',
        size: videoBlob.size,
        type: videoType,
        isRecorded: !!recordedVideo,
        isUploaded: !!selectedFile
      };
      
      // Store in localStorage
      const existingVideos = JSON.parse(localStorage.getItem('uploadedVideos') || '[]');
      existingVideos.push(videoInfo);
      localStorage.setItem('uploadedVideos', JSON.stringify(existingVideos));

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
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
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
        setError('File size must be less than 100MB.');
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
              <span className="text-xl">&lt;</span>
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
            </div>

            {!recordedVideo && !uploadedVideo ? (
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
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800">{error}</p>
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
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800">{error}</p>
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

export default VideoSubmissionPage;