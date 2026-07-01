'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { isNativePlatform } from '@/lib/capacitor';

type Step = 'select-assignment' | 'record-video' | 'capture-cover' | 'preview' | 'uploading' | 'done';

export default function RecordPage() {
  return (
    <Suspense fallback={<StudentRoute><div className="h-full flex items-center justify-center bg-black"><div className="animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent" /></div></StudentRoute>}>
      <RecordPageInner />
    </Suspense>
  );
}

function RecordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get('assignmentId');
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('record-video');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
  const [coverPhoto, setCoverPhoto] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const videoRecordRef = useRef<HTMLInputElement>(null);
  const [assignment, setAssignment] = useState<any>(null);

  // Fetch assignment data to get courseId
  useEffect(() => {
    if (!assignmentId) return;
    fetch(`/api/assignments/${assignmentId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.assignment) setAssignment(data.assignment);
        else if (data?.data) setAssignment(data.data);
      })
      .catch(() => {});
  }, [assignmentId]);
  const videoLibraryRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-activate camera on mount
  useEffect(() => {
    if (step === 'record-video' && cameraActive) {
      startCamera();
    }
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: true 
      });
      streamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera access denied:', err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') 
      ? 'video/webm;codecs=vp9,opus' 
      : MediaRecorder.isTypeSupported('video/webm') 
        ? 'video/webm' 
        : 'video/mp4';
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      const file = new File([blob], `recording-${Date.now()}.webm`, { type: mimeType });
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(blob));
      stopCamera();
      setCameraActive(false);
      setStep('capture-cover');
    };
    mediaRecorderRef.current = recorder;
    recorder.start(1000); // collect data every second
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const handleLibraryClick = () => {
    if (isRecording) stopRecording();
    stopCamera();
    setCameraActive(false);
    videoLibraryRef.current?.click();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Step 1: Record or select video
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCamera();
      setCameraActive(false);
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      setStep('capture-cover');
    }
  };

  // Step 2: Capture cover photo
  const handleCoverPhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        setCoverPhoto(base64);
        setIsProcessing(true);

        try {
          // Send to server for background removal and compositing
          const response = await fetch('/api/thumbnails/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64, userId: user?.id }),
          });

          if (response.ok) {
            const data = await response.json();
            setThumbnailUrl(data.thumbnailUrl);
          } else {
            // Fallback: use the raw photo as thumbnail
            setThumbnailUrl(base64);
          }
        } catch (err) {
          // Fallback: use raw photo
          setThumbnailUrl(base64);
        }

        setIsProcessing(false);
        setStep('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  // Skip cover photo - use branded default
  const skipCoverPhoto = () => {
    setThumbnailUrl('');
    setStep('preview');
  };

  // Step 3: Upload video + thumbnail
  const handleSubmit = async () => {
    if (!videoFile || !user?.id) return;
    setStep('uploading');
    setError('');

    try {
      // Get presigned URL for video upload
      const presignRes = await fetch('/api/upload/video-presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: videoFile.name,
          fileType: videoFile.type,
          userId: user.id,
        }),
      });

      if (!presignRes.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, videoUrl } = await presignRes.json();

      // Upload video to S3
      setUploadProgress(10);
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: videoFile,
        headers: { 'Content-Type': videoFile.type },
      });

      if (!uploadRes.ok) throw new Error('Video upload failed');
      setUploadProgress(70);

      // Submit video metadata with thumbnail and assignmentId
      const submitRes = await fetch('/api/video-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          assignmentId: assignmentId || undefined,
          courseId: assignment?.courseId || undefined,
          videoUrl,
          thumbnailUrl: thumbnailUrl || undefined,
          videoTitle: videoFile.name.replace(/\.[^/.]+$/, ''),
          isRecorded: true,
          submissionMethod: 'record',
        }),
      });

      setUploadProgress(100);
      if (submitRes.ok) {
        setStep('done');
        setTimeout(() => router.push(assignmentId ? `/student/assignments/${assignmentId}` : '/student/dashboard'), 1500);
      } else {
        throw new Error('Failed to save submission');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStep('preview');
    }
  };

  return (
    <StudentRoute>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;700;400&display=swap" rel="stylesheet" />
      <div className="h-full flex flex-col bg-black text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
          <button onClick={() => router.back()} className="text-white p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold uppercase tracking-normal" style={{ fontFamily: "'Oswald', sans-serif" }}>
            {step === 'record-video' && 'Record Video'}
            {step === 'capture-cover' && 'Cover Photo'}
            {step === 'preview' && 'Preview'}
            {step === 'uploading' && 'Uploading...'}
            {step === 'done' && 'Done!'}
          </h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-0">

          {/* Step: Record/Select Video */}
          {step === 'record-video' && (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {/* Live camera preview */}
              {cameraActive && (
                <div className="absolute inset-0 overflow-hidden rounded-xl">
                  <video
                    ref={liveVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {/* Dark gradient overlay at bottom for buttons */}
                  <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
              )}

              {/* Controls at bottom */}
              <div className="absolute bottom-8 inset-x-0 flex flex-col items-center space-y-4 z-10">
                {isRecording && (
                  <div className="flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-white text-sm font-mono">{formatTime(recordingTime)}</span>
                  </div>
                )}
                <p className="text-white/80 text-xs font-medium">
                  {isRecording ? 'Tap to stop recording' : cameraActive ? 'Tap to start recording' : 'Select a video source'}
                </p>
                <div className="flex items-center gap-6">
                  {/* Library */}
                  <button
                    onClick={handleLibraryClick}
                    className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border border-white/30"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>

                  {/* Record button - starts/stops MediaRecorder */}
                  <button
                    onClick={() => { isRecording ? stopRecording() : startRecording(); }}
                    className={`flex items-center justify-center border-4 border-white shadow-lg ${isRecording ? 'bg-red-600' : 'bg-red-500'} rounded-full`}
                    style={{ width: 72, height: 72 }}
                  >
                    {isRecording ? (
                      <div className="w-6 h-6 bg-white rounded-sm" />
                    ) : (
                      <div className="w-14 h-14 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </button>

                  {/* Flip camera placeholder */}
                  <button
                    onClick={() => { /* flip camera */ }}
                    className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border border-white/30"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Fallback if camera not active */}
              {!cameraActive && (
                <div className="text-center space-y-6 w-full">
                  <div className="w-24 h-24 mx-auto bg-[#005587] rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-300 text-sm">Record a new video or choose one from your library</p>
                  <div className="space-y-3 w-full max-w-xs mx-auto">
                    <button
                      onClick={() => videoRecordRef.current?.click()}
                      className="w-full py-3 bg-[#005587] hover:bg-[#003d5c] rounded-full font-bold text-lg transition-colors"
                    >
                      📹 Record Video
                    </button>
                    <button
                      onClick={() => videoLibraryRef.current?.click()}
                      className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-full font-medium transition-colors"
                    >
                      📁 Choose from Library
                    </button>
                  </div>
                </div>
              )}

              {/* Camera input - opens camera directly */}
              <input
                ref={videoRecordRef}
                type="file"
                accept="video/*"
                capture="environment"
                onChange={handleVideoSelect}
                className="hidden"
              />
              {/* Library input - opens file picker */}
              <input
                ref={videoLibraryRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Step: Capture Cover Photo */}
          {step === 'capture-cover' && (
            <div className="text-center space-y-6 w-full">
              <div className="w-20 h-20 mx-auto bg-[#FFC72C] rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-[#005587]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">Take Your Cover Photo</h2>
              <p className="text-gray-400 text-sm px-4">
                Strike a pose! This photo will be your video thumbnail. 
                We'll remove the background and make it look great.
              </p>

              <div className="space-y-3 w-full max-w-xs mx-auto">
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full py-3 bg-[#FFC72C] hover:bg-[#E5A900] text-[#005587] rounded-full font-bold text-lg transition-colors"
                >
                  📸 Take Photo
                </button>
                <button
                  onClick={skipCoverPhoto}
                  className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-full font-medium text-gray-300 transition-colors"
                >
                  Skip — use default thumbnail
                </button>
              </div>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleCoverPhotoCapture}
                className="hidden"
              />

              {isProcessing && (
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-sm text-gray-300">Processing your photo...</span>
                </div>
              )}
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="text-center space-y-4 w-full">
              {/* Thumbnail preview */}
              {thumbnailUrl && (
                <div className="mx-auto w-48 h-48 rounded-xl overflow-hidden border-2 border-white/20">
                  <img src={thumbnailUrl} alt="Cover" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Video info */}
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-400">Video ready</p>
                <p className="font-medium truncate">{videoFile?.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {videoFile && `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB`}
                </p>
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <div className="space-y-3 w-full max-w-xs mx-auto">
                <button
                  onClick={handleSubmit}
                  className="w-full py-3 bg-[#005587] hover:bg-[#003d5c] rounded-full font-bold text-lg transition-colors"
                >
                  🚀 Post Video
                </button>
                <button
                  onClick={() => setStep('capture-cover')}
                  className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Retake cover photo
                </button>
              </div>
            </div>
          )}

          {/* Step: Uploading */}
          {step === 'uploading' && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto relative">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="35" fill="none" stroke="#333" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="35" fill="none" stroke="#005587" strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 35}`}
                    strokeDashoffset={`${2 * Math.PI * 35 * (1 - uploadProgress / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                  {uploadProgress}%
                </span>
              </div>
              <p className="text-gray-300">Uploading your video...</p>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">Posted!</h2>
              <p className="text-gray-400 text-sm">Your video is live. Redirecting...</p>
            </div>
          )}
        </div>
      </div>
    </StudentRoute>
  );
}
