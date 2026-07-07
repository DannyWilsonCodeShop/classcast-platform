'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AssessmentQuestion } from '@/types/assessment';

interface AssessmentStartScreenProps {
  assignmentId: string;
  studentId: string;
  title: string;
  description: string;
  questionCount: number;
  totalDurationSeconds: number;
  hasExistingAttempt: boolean;
  onStart: (questions: AssessmentQuestion[]) => void;
}

export function AssessmentStartScreen({
  assignmentId, studentId, title, description, questionCount,
  totalDurationSeconds, hasExistingAttempt, onStart
}: AssessmentStartScreenProps) {
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [starting, setStarting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Request camera permission and show preview
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 }, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraReady(true);
      } catch (err) {
        setCameraError('Camera access denied. Please enable camera permissions to take this assessment.');
      }
    };
    if (!hasExistingAttempt) initCamera();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [hasExistingAttempt]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await fetch(`/api/assessments/${assignmentId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (data.success) {
        onStart(data.data.questions);
      } else {
        setCameraError(data.error || 'Failed to start assessment');
        setStarting(false);
      }
    } catch {
      setCameraError('Network error');
      setStarting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs > 0 ? `${secs}s` : ''}`;
  };

  if (hasExistingAttempt) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-lg font-bold text-[#005587] mb-2">Assessment Submitted</h2>
        <p className="text-sm text-gray-600">You have already completed this assessment. Only one attempt is allowed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 py-4">
      <h2 className="text-lg font-bold text-[#005587]">{title}</h2>
      {description && <p className="text-sm text-gray-600">{description}</p>}

      {/* Assessment Info */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Questions</span>
          <span className="font-bold text-[#005587]">{questionCount}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Total Duration</span>
          <span className="font-bold text-[#005587]">{formatDuration(totalDurationSeconds)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Attempts</span>
          <span className="font-bold text-red-600">1 (no retakes)</span>
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-blue-50 rounded-xl p-3">
        <p className="text-xs font-medium text-blue-800 mb-1">Requirements:</p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Keep full upper body and arms visible in frame</li>
          <li>• Questions auto-advance when time expires</li>
          <li>• Cannot pause, rewind, or restart</li>
          <li>• Do not leave the app during the assessment</li>
        </ul>
      </div>

      {/* Camera Preview */}
      <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        {!cameraReady && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          </div>
        )}
        {/* Framing Guide */}
        {cameraReady && (
          <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-lg pointer-events-none" />
        )}
      </div>

      {cameraError && <p className="text-xs text-red-600 text-center">{cameraError}</p>}

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={!cameraReady || starting}
        className="w-full py-3 bg-[#005587] text-white rounded-xl font-bold text-sm disabled:opacity-50"
      >
        {starting ? 'Starting...' : 'Start Assessment'}
      </button>
    </div>
  );
}
