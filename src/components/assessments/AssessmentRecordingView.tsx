'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AssessmentQuestion, QuestionTimestamp, IntegrityEvent } from '@/types/assessment';

interface AssessmentRecordingViewProps {
  sessionId: string;
  assessmentId: string;
  studentId: string;
  questions: AssessmentQuestion[];
  onComplete: () => void;
}

export function AssessmentRecordingView({
  sessionId, assessmentId, studentId, questions, onComplete
}: AssessmentRecordingViewProps) {
  // Pre-assessment integrity steps: 'room-scan' → 'affirmation' → 'questions'
  const [phase, setPhase] = useState<'room-scan' | 'affirmation' | 'questions'>('room-scan');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(questions[0]?.timeLimitSeconds || 60);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [integrityWarning, setIntegrityWarning] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timestampsRef = useRef<QuestionTimestamp[]>([]);
  const integrityEventsRef = useRef<IntegrityEvent[]>([]);
  const sessionStartRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  // Initialize camera and recording
  useEffect(() => {
    const init = async () => {
      try {
        // Request fullscreen to cover entire desktop
        try {
          await document.documentElement.requestFullscreen?.();
        } catch {}

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 1280, height: 720 },
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Start recording
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : 'video/webm',
          videoBitsPerSecond: 2500000,
        });
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.start(1000); // Collect data every second

        // Record first question timestamp
        timestampsRef.current.push({ questionId: questions[0].questionId, timestampSeconds: 0 });

        // Monitor camera track
        const videoTrack = stream.getVideoTracks()[0];
        videoTrack?.addEventListener('ended', () => {
          const ts = (Date.now() - sessionStartRef.current) / 1000;
          integrityEventsRef.current.push({ type: 'camera-lost', timestampSeconds: ts, description: 'Camera feed ended' });
          setIntegrityWarning('Camera disconnected!');
        });
        videoTrack?.addEventListener('mute', () => {
          const ts = (Date.now() - sessionStartRef.current) / 1000;
          integrityEventsRef.current.push({ type: 'camera-lost', timestampSeconds: ts, description: 'Camera muted/covered' });
          setIntegrityWarning('Camera blocked');
        });
        videoTrack?.addEventListener('unmute', () => {
          const ts = (Date.now() - sessionStartRef.current) / 1000;
          integrityEventsRef.current.push({ type: 'camera-restored', timestampSeconds: ts, description: 'Camera restored' });
          setIntegrityWarning('');
        });
      } catch (err) {
        console.error('Failed to start recording:', err);
      }
    };

    init();

    // Monitor tab visibility — abort recording if student leaves
    const handleVisibility = () => {
      if (document.hidden) {
        const ts = (Date.now() - sessionStartRef.current) / 1000;
        integrityEventsRef.current.push({ type: 'tab-navigation', timestampSeconds: ts, description: 'Left assessment tab — recording aborted' });
        setIntegrityWarning('⚠️ Recording aborted — you left the screen. Your assessment has been invalidated.');
        // Stop recording immediately
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          recorderRef.current.stop();
        }
        streamRef.current?.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer countdown — only active during questions phase
  useEffect(() => {
    if (phase !== 'questions') return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          // Advance to next question
          const nextIndex = currentQuestionIndex + 1;
          if (nextIndex >= questions.length) {
            // Assessment complete
            clearInterval(timerRef.current!);
            handleAssessmentComplete();
            return 0;
          }
          // Record timestamp and advance
          const ts = (Date.now() - sessionStartRef.current) / 1000;
          timestampsRef.current.push({ questionId: questions[nextIndex].questionId, timestampSeconds: ts });
          setCurrentQuestionIndex(nextIndex);
          return questions[nextIndex].timeLimitSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, phase]);

  const handleAssessmentComplete = async () => {
    setIsUploading(true);
    setUploadProgress('Stopping recording...');

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // Stop recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Wait for final data
    await new Promise(resolve => setTimeout(resolve, 500));

    setUploadProgress('Preparing video...');
    const blob = new Blob(chunksRef.current, { type: 'video/webm' });

    // Upload via presigned URL
    setUploadProgress('Uploading video...');
    try {
      const fileName = `assessment_${sessionId}_${Date.now()}.webm`;
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          contentType: 'video/webm',
          folder: `assessments/${assessmentId}`,
          userId: studentId,
        }),
      });
      const presignedData = await presignedRes.json();

      if (presignedData.success && presignedData.data) {
        await fetch(presignedData.data.presignedUrl, {
          method: 'PUT',
          body: blob,
          headers: { 'Content-Type': 'video/webm' },
        });

        // Complete session
        setUploadProgress('Saving results...');
        await fetch(`/api/assessments/${assessmentId}/sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrl: presignedData.data.fileUrl,
            questionTimestamps: timestampsRef.current,
            integrityEvents: integrityEventsRef.current,
            status: 'completed',
            completedAt: new Date().toISOString(),
          }),
        });

        setUploadProgress('Assessment submitted!');
        setTimeout(() => onComplete(), 2000);
      } else {
        setUploadProgress('Upload failed. Please contact your instructor.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadProgress('Upload error. Please try again or contact your instructor.');
    }

    // Stop camera
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isUploading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#005587] px-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4" />
        <p className="text-white font-medium">{uploadProgress}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black relative overflow-hidden">
      {/* Camera Feed */}
      <div className="flex-1 relative">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

        {/* Framing Guide */}
        <div className="absolute inset-8 border-2 border-dashed border-white/30 rounded-xl pointer-events-none" />

        {/* Integrity Warning */}
        {integrityWarning && (
          <div className="absolute top-4 left-4 right-4 bg-red-600/90 text-white text-xs font-bold text-center py-2 rounded-lg">
            {integrityWarning}
          </div>
        )}
      </div>

      {/* Question + Timer Overlay (bottom) */}
      <div className="bg-black/80 px-4 py-4 space-y-2">
        {/* Phase: Room Scan */}
        {phase === 'room-scan' && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-xs">Step 1 of 2 — Room Scan</span>
              <span className="text-xs text-green-400 font-medium">📹 Recording</span>
            </div>
            <p className="text-white text-sm font-medium leading-relaxed">
              Please do a slow 360° scan of your room to show there are no notes, devices, or other materials visible. Turn your camera to show your entire workspace.
            </p>
            <button
              onClick={() => {
                const ts = (Date.now() - sessionStartRef.current) / 1000;
                integrityEventsRef.current.push({ type: 'room-scan-complete', timestampSeconds: ts, description: 'Student completed room scan' });
                setPhase('affirmation');
              }}
              className="w-full mt-2 py-3 bg-[#005587] text-white rounded-xl text-sm font-bold active:scale-[0.98] transition-transform"
            >
              ✓ Room Scan Complete
            </button>
          </>
        )}

        {/* Phase: Affirmation */}
        {phase === 'affirmation' && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-xs">Step 2 of 2 — Agreement</span>
              <span className="text-xs text-green-400 font-medium">📹 Recording</span>
            </div>
            <p className="text-white text-sm font-medium leading-relaxed">
              I understand that I must show my complete upper body and hands at all times during this assessment. I have <span className="text-[#FFC72C] font-bold">1 attempt only</span>. Leaving the screen will invalidate my recording.
            </p>
            <button
              onClick={() => {
                const ts = (Date.now() - sessionStartRef.current) / 1000;
                integrityEventsRef.current.push({ type: 'affirmation-accepted', timestampSeconds: ts, description: 'Student affirmed assessment rules' });
                timestampsRef.current.push({ questionId: questions[0].questionId, timestampSeconds: ts });
                setPhase('questions');
              }}
              className="w-full mt-2 py-3 bg-[#FFC72C] text-[#005587] rounded-xl text-sm font-bold active:scale-[0.98] transition-transform"
            >
              I Understand — Begin Assessment
            </button>
          </>
        )}

        {/* Phase: Questions */}
        {phase === 'questions' && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-xs">Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span className={`text-lg font-bold font-mono ${remainingSeconds <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {formatTime(remainingSeconds)}
              </span>
            </div>
            {/* Question image */}
            {currentQuestion?.imageUrl && (
              <div className="rounded-lg overflow-hidden bg-white/10 max-h-40">
                <img src={currentQuestion.imageUrl} alt="Question" className="w-full max-h-40 object-contain" />
              </div>
            )}
            <p className="text-white text-sm font-medium leading-relaxed">
              {currentQuestion?.questionText || ''}
            </p>
            {/* Next button + Progress dots */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-1">
                {questions.map((_, idx) => (
                  <div key={idx} className={`w-2 h-2 rounded-full ${idx < currentQuestionIndex ? 'bg-green-400' : idx === currentQuestionIndex ? 'bg-white' : 'bg-white/30'}`} />
                ))}
              </div>
              <button
                onClick={() => {
                  const nextIndex = currentQuestionIndex + 1;
                  if (nextIndex >= questions.length) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    handleAssessmentComplete();
                  } else {
                    const ts = (Date.now() - sessionStartRef.current) / 1000;
                    timestampsRef.current.push({ questionId: questions[nextIndex].questionId, timestampSeconds: ts });
                    setCurrentQuestionIndex(nextIndex);
                    setRemainingSeconds(questions[nextIndex].timeLimitSeconds);
                  }
                }}
                className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-xs font-medium active:scale-95 transition-transform"
              >
                {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
