'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { VideoEditor } from '@/components/video-editor/VideoEditor';

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
  const mode = searchParams.get('mode'); // 'record', 'upload', or null
  const isAssessment = searchParams.get('assessment') === 'true';
  const { user } = useAuth();

  // Assignment data
  const [assignment, setAssignment] = useState<any>(null);
  const [assignmentLoading, setAssignmentLoading] = useState(!!assignmentId);

  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkType, setLinkType] = useState<'youtube' | 'googledrive' | null>(null);

  // Thumbnail state
  const [showThumbnailStep, setShowThumbnailStep] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Recording state
  const [cameraActive, setCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // Upload state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showEditor, setShowEditor] = useState(false);

  // Refs
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch assignment data
  useEffect(() => {
    if (!assignmentId) { setAssignmentLoading(false); return; }
    fetch(`/api/assignments/${assignmentId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.data?.assignment) setAssignment(data.data.assignment);
        else if (data?.assignment) setAssignment(data.assignment);
        else if (data?.data) setAssignment(data.data);
      })
      .catch(() => {})
      .finally(() => setAssignmentLoading(false));
  }, [assignmentId]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, []);

  // Auto-trigger based on mode param
  useEffect(() => {
    if (mode === 'record') {
      // Delay to ensure video element is rendered
      setTimeout(() => startCamera(), 100);
    }
    // Note: mode=upload no longer auto-opens file picker
    // Browsers block programmatic .click() without user gesture
  }, [mode]);

  // Attach stream to video element when camera becomes active
  useEffect(() => {
    if (cameraActive && streamRef.current && liveVideoRef.current) {
      liveVideoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  // Camera controls
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (liveVideoRef.current) liveVideoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch (err: any) {
      setError(`Camera access denied: ${err?.message || err}`);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      const file = new File([blob], `recording-${Date.now()}.webm`, { type: mimeType });
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(blob));
      stopCamera();
      setShowThumbnailStep(true);
      // Exit fullscreen when recording stops
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
    mediaRecorderRef.current = recorder;
    recorder.start(1000);
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);

    // Request fullscreen to cover other windows (anti-cheat)
    try {
      document.documentElement.requestFullscreen?.() || 
      (document.documentElement as any).webkitRequestFullscreen?.();
    } catch {}
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Anti-cheat: abort recording if user leaves the screen
  const [recordingAborted, setRecordingAborted] = useState(false);
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isRecording) {
        // User switched away during recording — abort immediately
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        recordedChunksRef.current = [];
        stopCamera();
        setRecordingAborted(true);
        setError('Recording aborted — you left the screen. You must stay on this screen during the entire recording. Please try again.');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isRecording]);

  // File selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 handleFileSelect triggered');
    const file = e.target.files?.[0];
    if (!file) {
      console.log('❌ No file selected (user cancelled?)');
      return;
    }
    console.log('📁 File selected:', { name: file.name, size: `${(file.size / (1024*1024)).toFixed(1)} MB`, type: file.type });
    if (file.size > 5 * 1024 * 1024 * 1024) {
      console.log('❌ File too large:', file.size);
      setError('File must be under 5 GB');
      return;
    }
    console.log('✅ Setting videoFile and showing thumbnail step');
    setVideoFile(file);
    // Only create preview URL for files under 500MB (large files can cause memory issues)
    if (file.size < 500 * 1024 * 1024) {
      setVideoPreviewUrl(URL.createObjectURL(file));
      console.log('✅ Preview URL created');
    } else {
      setVideoPreviewUrl('large-file');
      console.log('⚠️ Large file - skipping preview URL');
    }
    setLinkUrl('');
    setLinkType(null);
    setError('');
    setShowThumbnailStep(true);
    console.log('✅ showThumbnailStep set to true');
  };

  // Delete video
  const deleteVideo = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(null);
    setVideoPreviewUrl('');
    setError('');
  };

  // Detect link type
  const detectLinkType = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('drive.google')) return 'googledrive';
    return null;
  };

  // Submit
  const handleSubmit = async () => {
    console.log('🚀 handleSubmit called', { hasFile: !!videoFile, hasLink: !!linkUrl.trim(), userId: user?.id });
    if (!user?.id) { setError('Not logged in'); return; }
    if (!videoFile && !linkUrl.trim()) { setError('No video or link to submit'); return; }
    if (assignmentId && assignmentLoading) { setError('Still loading assignment data...'); return; }
    if (assignmentId && !assignment?.courseId) { setError(`Could not load course info for this assignment. assignment data: ${JSON.stringify(assignment)}`); return; }

    setIsSubmitting(true);
    setError('');
    setUploadProgress(0);

    try {
      let finalVideoUrl = '';
      let submissionMethod = 'unknown';
      let isYouTube = false;
      let isGoogleDrive = false;

      if (linkUrl.trim()) {
        // Link submission
        const type = detectLinkType(linkUrl.trim());
        finalVideoUrl = linkUrl.trim();
        if (type === 'youtube') { isYouTube = true; submissionMethod = 'youtube'; }
        else if (type === 'googledrive') { isGoogleDrive = true; submissionMethod = 'google-drive'; }
        else { submissionMethod = 'link'; }
        setUploadProgress(50);
      } else if (videoFile) {
        // File upload - use multipart for large files (>100MB), presigned PUT for small
        submissionMethod = videoFile.name.includes('recording') ? 'record' : 'upload';
        setUploadProgress(5);
        console.log('📤 Starting upload:', { name: videoFile.name, size: `${(videoFile.size / (1024*1024)).toFixed(1)} MB`, type: videoFile.type });

        const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100MB

        if (videoFile.size > MULTIPART_THRESHOLD) {
          // --- MULTIPART UPLOAD for large files ---
          const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB per part
          const totalParts = Math.ceil(videoFile.size / CHUNK_SIZE);
          console.log(`📤 Using multipart upload: ${totalParts} parts of 10MB`);

          // 1. Initialize multipart upload
          console.log('📤 Step 1: Initializing multipart upload...');
          const initRes = await fetch('/api/upload/multipart/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: videoFile.name,
              fileSize: videoFile.size,
              contentType: videoFile.type,
              folder: 'videos',
              userId: user.id,
            }),
          });
          if (!initRes.ok) {
            const errBody = await initRes.text().catch(() => '');
            console.error('❌ Init failed:', initRes.status, errBody);
            throw new Error(`Failed to initialize upload (${initRes.status}): ${errBody}`);
          }
          const initJson = await initRes.json();
          console.log('✅ Init response:', initJson);
          const { data: initData } = initJson;
          const { uploadId, fileKey, fileUrl } = initData;
          finalVideoUrl = fileUrl;
          setUploadProgress(8);

          // 2. Upload each part
          console.log('📤 Step 2: Uploading parts...');
          const uploadedParts: { ETag: string; PartNumber: number }[] = [];
          for (let partNum = 1; partNum <= totalParts; partNum++) {
            const start = (partNum - 1) * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, videoFile.size);
            const chunk = videoFile.slice(start, end);

            // Get presigned URL for this part
            const partUrlRes = await fetch('/api/upload/multipart/part-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileKey, uploadId, partNumber: partNum }),
            });
            if (!partUrlRes.ok) {
              const errBody = await partUrlRes.text().catch(() => '');
              console.error(`❌ Part URL failed for part ${partNum}:`, partUrlRes.status, errBody);
              throw new Error(`Failed to get URL for part ${partNum} (${partUrlRes.status})`);
            }
            const { data: partData } = await partUrlRes.json();

            // Upload the chunk
            const partRes = await fetch(partData.presignedUrl, {
              method: 'PUT',
              body: chunk,
            });
            if (!partRes.ok) {
              const errBody = await partRes.text().catch(() => '');
              console.error(`❌ Part ${partNum} PUT failed:`, partRes.status, errBody.substring(0, 200));
              throw new Error(`Part ${partNum}/${totalParts} upload failed (${partRes.status})`);
            }

            const etag = partRes.headers.get('ETag') || `"part${partNum}"`;
            uploadedParts.push({ ETag: etag, PartNumber: partNum });

            // Update progress (8% to 88%)
            const pct = 8 + Math.round((partNum / totalParts) * 80);
            setUploadProgress(pct);
            if (partNum % 10 === 0 || partNum === totalParts) {
              console.log(`📤 Part ${partNum}/${totalParts} done (${pct}%)`);
            }
          }

          // 3. Complete multipart upload
          console.log('📤 Step 3: Completing multipart upload...');
          const completeRes = await fetch('/api/upload/multipart/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileKey, uploadId, parts: uploadedParts }),
          });
          if (!completeRes.ok) {
            const errBody = await completeRes.text().catch(() => '');
            console.error('❌ Complete failed:', completeRes.status, errBody);
            throw new Error(`Failed to complete upload (${completeRes.status})`);
          }
          console.log('✅ Multipart upload complete!');
          setUploadProgress(90);

        } else {
          // --- SINGLE PRESIGNED PUT for small files ---
          const presignRes = await fetch('/api/upload/video-presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: videoFile.name, fileType: videoFile.type, userId: user.id }),
          });
          if (!presignRes.ok) {
            const errText = await presignRes.text();
            throw new Error(`Presign failed (${presignRes.status}): ${errText}`);
          }
          const { uploadUrl, videoUrl } = await presignRes.json();
          finalVideoUrl = videoUrl;
          setUploadProgress(10);

          // Upload to S3 with progress via XMLHttpRequest
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl);
            xhr.setRequestHeader('Content-Type', videoFile!.type);
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) setUploadProgress(10 + Math.round((e.loaded / e.total) * 80));
            };
            xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) resolve(); else reject(new Error(`S3 upload failed: ${xhr.status} ${xhr.responseText?.substring(0, 200)}`)); };
            xhr.onerror = () => reject(new Error('Upload failed. Check your connection and try again.'));
            xhr.send(videoFile);
          });
          setUploadProgress(90);
        }
      }

      // Upload thumbnail to S3 if it's a base64 image
      let finalThumbnailUrl: string | undefined = undefined;
      if (thumbnailUrl && thumbnailUrl.startsWith('data:')) {
        try {
          const thumbRes = await fetch('/api/upload/thumbnail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: thumbnailUrl, userId: user.id }),
          });
          if (thumbRes.ok) {
            const thumbData = await thumbRes.json();
            finalThumbnailUrl = thumbData.url || thumbData.thumbnailUrl;
          }
        } catch { /* skip thumbnail if upload fails */ }
      } else if (thumbnailUrl) {
        finalThumbnailUrl = thumbnailUrl;
      }

      // Save submission
      const body: any = {
        studentId: user.id,
        assignmentId: assignmentId || undefined,
        courseId: assignment?.courseId || undefined,
        videoUrl: finalVideoUrl,
        videoTitle: assignment?.title || videoFile?.name?.replace(/\.[^/.]+$/, '') || 'Video Submission',
        thumbnailUrl: finalThumbnailUrl,
        submissionMethod,
        isYouTube,
        isGoogleDrive,
        isRecorded: submissionMethod === 'record',
        isUploaded: submissionMethod === 'upload',
      };
      if (isYouTube) body.youtubeUrl = finalVideoUrl;
      if (isGoogleDrive) body.googleDriveUrl = finalVideoUrl;

      const submitRes = await fetch('/api/video-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const submitData = await submitRes.json().catch(() => null);
      if (!submitRes.ok || !submitData?.success) {
        throw new Error(`Submission save failed (${submitRes.status}): ${JSON.stringify(submitData)}`);
      }

      setUploadProgress(100);
      setSuccess(true);
      setTimeout(() => router.push(assignmentId ? `/student/assignments/${assignmentId}` : '/student/dashboard'), 1500);
    } catch (err: any) {
      console.error('❌ Upload/Submit error:', err);
      setError(err?.message || err?.toString() || 'Unknown error');
      setIsSubmitting(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const hasVideo = !!videoFile || !!linkUrl.trim();

  // Assessment pre-start state
  const [assessmentStarted, setAssessmentStarted] = useState(false);

  // ASSESSMENT MODE: show instructions modal before starting
  if (isAssessment && !assignmentLoading && assignment?.assessmentQuestions?.length > 0 && user?.id && assignmentId && !assessmentStarted) {
    return (
      <StudentRoute>
        <div className="h-full h-dvh bg-[#005587] flex flex-col overflow-y-auto">
          <div className="flex-1 px-5 py-8 flex flex-col">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-white mb-1">{assignment.title || 'Assessment'}</h1>
              <p className="text-white/60 text-xs">{assignment.assessmentQuestions.length} questions</p>
            </div>

            {/* Directions */}
            {assignment.description && (
              <div className="bg-white/10 rounded-2xl p-4 mb-4">
                <h3 className="text-xs font-bold text-[#FFC72C] uppercase mb-2">Directions</h3>
                <p className="text-white/90 text-xs leading-relaxed whitespace-pre-wrap">{assignment.description}</p>
              </div>
            )}

            {/* Rules that invalidate */}
            <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-4 mb-4">
              <h3 className="text-xs font-bold text-red-300 uppercase mb-2">⚠️ Your test will be invalidated if you:</h3>
              <ul className="space-y-1.5 text-white/90 text-xs">
                <li className="flex items-start gap-2"><span className="text-red-400">•</span> Leave the screen or switch apps/tabs</li>
                <li className="flex items-start gap-2"><span className="text-red-400">•</span> Exit fullscreen mode</li>
                <li className="flex items-start gap-2"><span className="text-red-400">•</span> Cover or disconnect your camera</li>
                <li className="flex items-start gap-2"><span className="text-red-400">•</span> Have your hands or upper body out of frame</li>
              </ul>
            </div>

            {/* 360 Room Scan instructions */}
            <div className="bg-white/10 rounded-2xl p-4 mb-6">
              <h3 className="text-xs font-bold text-[#FFC72C] uppercase mb-2">📹 Room Scan Required</h3>
              <p className="text-white/90 text-xs mb-3">Recording will begin immediately. Your first task is to do a slow 360° scan of your surroundings to show there are no notes or devices.</p>
              <div className="rounded-xl overflow-hidden">
                <img src="/StudentFiles/assessment-360-guide.png" alt="360 room scan guide" className="w-full object-contain max-h-48" />
              </div>
            </div>

            {/* Start button */}
            <div className="mt-auto">
              <button
                onClick={() => setAssessmentStarted(true)}
                className="w-full py-4 bg-[#FFC72C] text-[#005587] rounded-xl text-base font-bold active:scale-[0.98] transition-transform"
              >
                I'm Ready — Start Recording
              </button>
              <button
                onClick={() => router.back()}
                className="w-full py-3 text-white/50 text-xs mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </StudentRoute>
    );
  }

  // ASSESSMENT MODE: render full-screen assessment recording view
  if (isAssessment && assessmentStarted && assignment?.assessmentQuestions?.length > 0 && user?.id && assignmentId) {
    const { AssessmentRecordingView } = require('@/components/assessments/AssessmentRecordingView');
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return (
      <StudentRoute>
        <div className="h-full h-dvh">
          <AssessmentRecordingView
            sessionId={sessionId}
            assessmentId={assignmentId}
            studentId={user.id}
            courseId={assignment?.courseId}
            questions={assignment.assessmentQuestions}
            onComplete={() => router.push(`/student/assignments/${assignmentId}`)}
          />
        </div>
      </StudentRoute>
    );
  }

  // ASSESSMENT MODE: loading state
  if (isAssessment && assignmentLoading) {
    return (
      <StudentRoute>
        <div className="h-full flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent mx-auto mb-3" />
            <p className="text-white text-sm">Loading assessment...</p>
          </div>
        </div>
      </StudentRoute>
    );
  }

  // ASSESSMENT MODE: no questions found
  if (isAssessment && !assignmentLoading && (!assignment?.assessmentQuestions || assignment.assessmentQuestions.length === 0)) {
    return (
      <StudentRoute>
        <div className="h-full flex items-center justify-center bg-black px-6">
          <div className="text-center">
            <div className="text-4xl mb-3">📋</div>
            <h2 className="text-white text-lg font-bold mb-2">No Questions Available</h2>
            <p className="text-gray-400 text-sm mb-4">This assessment doesn't have questions set up yet.</p>
            <button onClick={() => router.back()} className="px-5 py-2 bg-[#005587] text-white rounded-xl text-sm font-bold">Go Back</button>
          </div>
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <div className="h-full flex flex-col bg-gray-950 text-white overflow-hidden">

        {/* FULL SCREEN CAMERA MODE */}
        {cameraActive && !videoFile && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col overflow-hidden">
            <video ref={liveVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: `scaleX(-1) scale(${zoomLevel})` }} />
            {/* Back button */}
            <button onClick={() => { stopCamera(); router.back(); }} className="absolute top-12 left-4 z-10 bg-black/50 text-white p-2.5 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            {/* Zoom control */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))} className="text-white text-lg font-bold w-6 h-6 flex items-center justify-center">−</button>
              <span className="text-white text-[10px] font-mono w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => setZoomLevel(z => Math.min(2.0, z + 0.1))} className="text-white text-lg font-bold w-6 h-6 flex items-center justify-center">+</button>
            </div>
            {/* Security notice */}
            {!isRecording && (
              <div className="absolute top-12 right-4 z-10 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] px-2.5 py-1.5 rounded-lg max-w-[140px] text-center">
                🔒 Full-screen recording. Leaving will abort.
              </div>
            )}
            {/* Recording indicator + controls at bottom */}
            <div className="absolute inset-x-0 bottom-0 pb-12 pt-20 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center gap-3">
              {isRecording && (
                <div className="flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white text-sm font-mono">{formatTime(recordingTime)}</span>
                </div>
              )}
              <button onClick={isRecording ? stopRecording : startRecording} className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center ${isRecording ? 'bg-red-600' : 'bg-red-500'}`}>
                {isRecording ? <div className="w-7 h-7 bg-white rounded-sm" /> : <div className="w-16 h-16 bg-red-500 rounded-full border-2 border-white" />}
              </button>
              <p className="text-white/60 text-xs">{isRecording ? 'Tap to stop' : 'Tap to record'}</p>
            </div>
          </div>
        )}

        {/* Header - hidden when camera is active */}
        {!cameraActive && (
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <button onClick={() => router.back()} className="text-white p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-lg font-bold">Post Video</h1>
            <div className="w-8" />
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 min-h-0">

          {/* THUMBNAIL STEP - after recording */}
          {showThumbnailStep && !isSubmitting && !success && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-20 h-20 bg-[#FFC72C] rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-[#005587]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-center">Take Your Cover Photo</h2>
              <p className="text-gray-400 text-sm text-center px-4">
                Strike a pose! This will be your video thumbnail.
              </p>
              {thumbnailUrl && (
                <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-white/20">
                  <img src={thumbnailUrl} alt="Cover" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="w-full max-w-xs space-y-3">
                <button
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="w-full py-3 bg-[#FFC72C] text-[#005587] rounded-full font-bold text-lg"
                >
                  📸 {thumbnailUrl ? 'Retake Photo' : 'Take Photo'}
                </button>
                <button
                  onClick={() => setShowThumbnailStep(false)}
                  className="w-full py-3 bg-gray-700 text-gray-300 rounded-full font-medium"
                >
                  {thumbnailUrl ? 'Use This Photo →' : 'Skip — use default'}
                </button>
              </div>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setThumbnailUrl(ev.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
          )}

          {/* VIDEO PREVIEW (top half when video exists) */}
          {videoPreviewUrl && !showThumbnailStep && !isSubmitting && !success && (
            <div className="relative rounded-xl overflow-hidden bg-black" style={{ height: '45%', minHeight: '200px' }}>
              {videoPreviewUrl === 'large-file' ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  <p className="text-xs">{videoFile ? `${(videoFile.size / (1024*1024)).toFixed(0)} MB video ready` : 'Video ready'}</p>
                </div>
              ) : (
                <video src={videoPreviewUrl} className="w-full h-full object-contain" controls playsInline />
              )}
              <button onClick={deleteVideo} className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full shadow-lg active:scale-95">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
              {videoPreviewUrl && videoPreviewUrl !== 'large-file' && (
                <button onClick={() => setShowEditor(true)} className="absolute top-3 right-14 bg-[#005587] text-white p-2 rounded-full shadow-lg active:scale-95">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              )}
              <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-xs">
                {videoFile && `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB`}
              </div>
            </div>
          )}

          {/* Open Camera button (when camera not active and no video yet) */}
          {!videoFile && !linkUrl && !isSubmitting && !success && !cameraActive && mode !== 'upload' && (
            <div className="py-4 flex flex-col items-center">
              <button onClick={startCamera} className="w-full max-w-xs py-3 bg-[#005587] rounded-full font-bold text-center">📹 Open Camera</button>
            </div>
          )}

          {/* ACTION BUTTONS (when no video yet) */}
          {!videoFile && !linkUrl && !isSubmitting && !success && !cameraActive && (
            <div className="space-y-3">
              {/* Upload button - prominent when mode=upload */}
              <button onClick={() => { console.log('🖱️ Upload button clicked, opening file picker'); fileInputRef.current?.click(); }} className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${mode === 'upload' ? 'bg-[#005587] text-white' : 'bg-gray-800 border border-gray-600'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                {mode === 'upload' ? 'Choose Video File (up to 5 GB)' : 'Upload from Device (up to 5 GB)'}
              </button>
              {mode === 'upload' && (
                <p className="text-xs text-gray-500 text-center">Tap the button above to select your video file</p>
              )}
              {mode !== 'upload' && (
                <button onClick={startCamera} className="w-full py-3 bg-gray-800 border border-gray-600 rounded-xl font-medium flex items-center justify-center gap-2">
                  📹 Record Live
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-700" /><span className="text-xs text-gray-500">OR PASTE A LINK</span><div className="flex-1 h-px bg-gray-700" />
              </div>
              <input
                type="url"
                placeholder="Paste YouTube or Google Drive link..."
                value={linkUrl}
                onChange={(e) => { setLinkUrl(e.target.value); setLinkType(detectLinkType(e.target.value)); setError(''); }}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-[#005587] focus:ring-1 focus:ring-[#005587]"
              />
              {linkType && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {linkType === 'youtube' ? 'YouTube link detected' : 'Google Drive link detected'}
                </div>
              )}
            </div>
          )}

          {/* LINK PREVIEW (when link is entered) */}
          {linkUrl.trim() && !videoFile && !isSubmitting && !success && (
            <div className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center shrink-0">
                  {linkType === 'youtube' ? <span className="text-lg">▶️</span> : <span className="text-lg">📁</span>}
                </div>
                <p className="text-sm truncate text-gray-300">{linkUrl}</p>
              </div>
              <button onClick={() => { setLinkUrl(''); setLinkType(null); }} className="text-gray-400 p-1 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          {hasVideo && !showThumbnailStep && !isSubmitting && !success && (
            <button onClick={handleSubmit} disabled={assignmentLoading} className="w-full py-4 bg-gradient-to-r from-[#005587] to-[#0088cc] rounded-xl font-bold text-lg active:scale-[0.98] transition-transform disabled:opacity-50">
              {assignmentLoading ? '⏳ Loading assignment...' : '🚀 Post Video'}
            </button>
          )}

          {/* UPLOADING STATE */}
          {isSubmitting && !success && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="w-20 h-20 relative">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="35" fill="none" stroke="#333" strokeWidth="6" />
                  <circle cx="40" cy="40" r="35" fill="none" stroke="#005587" strokeWidth="6" strokeDasharray={`${2 * Math.PI * 35}`} strokeDashoffset={`${2 * Math.PI * 35 * (1 - uploadProgress / 100)}`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{uploadProgress}%</span>
              </div>
              <p className="text-gray-400">Uploading...</p>
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-xl font-bold">Posted!</h2>
              <p className="text-gray-400 text-sm">Redirecting...</p>
            </div>
          )}

          {/* ERROR DISPLAY - FULL DETAILS */}
          {error && (
            <div className="bg-red-900/60 border border-red-500/50 rounded-xl p-4 mt-2">
              <p className="text-red-300 text-sm font-bold mb-1">⚠️ Error</p>
              <p className="text-red-200 text-xs break-all whitespace-pre-wrap font-mono">{error}</p>
              <button onClick={() => setError('')} className="mt-2 text-xs text-red-400 underline">Dismiss</button>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
      </div>

      {/* Video Editor Overlay */}
      {showEditor && videoPreviewUrl && videoPreviewUrl !== 'large-file' && (
        <VideoEditor
          videoUrl={videoPreviewUrl}
          onSave={(editedBlob) => {
            // Replace the current video with the edited version
            const editedFile = new File([editedBlob], videoFile?.name || 'edited-video.webm', { type: editedBlob.type });
            const editedUrl = URL.createObjectURL(editedBlob);
            if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
            setVideoFile(editedFile);
            setVideoPreviewUrl(editedUrl);
            setShowEditor(false);
          }}
          onCancel={() => setShowEditor(false)}
        />
      )}
    </StudentRoute>
  );
}
