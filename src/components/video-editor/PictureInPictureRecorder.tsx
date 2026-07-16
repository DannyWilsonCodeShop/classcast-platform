'use client';

import React, { useRef, useState, useEffect } from 'react';

interface PiPRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onCancel: () => void;
}

/**
 * Picture-in-Picture recorder: captures screen share with a webcam overlay.
 * The webcam appears as a small circle in the corner.
 */
export function PictureInPictureRecorder({ onRecordingComplete, onCancel }: PiPRecorderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number>(0);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [webcamPosition, setWebcamPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [error, setError] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start both streams
  const startStreams = async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      });
      setScreenStream(screen);

      const webcam = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 320 } },
        audio: true,
      });
      setWebcamStream(webcam);

      // Set up video elements
      if (screenVideoRef.current) { screenVideoRef.current.srcObject = screen; screenVideoRef.current.play(); }
      if (webcamVideoRef.current) { webcamVideoRef.current.srcObject = webcam; webcamVideoRef.current.play(); }
    } catch (err: any) {
      setError('Could not access screen or camera. Please grant permissions.');
    }
  };

  useEffect(() => { startStreams(); return () => cleanup(); }, []);

  const cleanup = () => {
    screenStream?.getTracks().forEach(t => t.stop());
    webcamStream?.getTracks().forEach(t => t.stop());
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Composite drawing loop
  const startCompositing = () => {
    const canvas = canvasRef.current;
    const screenVideo = screenVideoRef.current;
    const webcamVideo = webcamVideoRef.current;
    if (!canvas || !screenVideo || !webcamVideo) return;

    const ctx = canvas.getContext('2d')!;
    canvas.width = 1920;
    canvas.height = 1080;

    const draw = () => {
      // Draw screen
      ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

      // Draw webcam circle
      const size = 200;
      const margin = 20;
      let x = 0, y = 0;
      if (webcamPosition === 'bottom-right') { x = canvas.width - size - margin; y = canvas.height - size - margin; }
      else if (webcamPosition === 'bottom-left') { x = margin; y = canvas.height - size - margin; }
      else if (webcamPosition === 'top-right') { x = canvas.width - size - margin; y = margin; }
      else { x = margin; y = margin; }

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(webcamVideo, x, y, size, size);
      ctx.restore();

      // Border around webcam
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas || !webcamStream) return;

    startCompositing();

    const stream = canvas.captureStream(30);
    // Add audio from webcam
    const audioTrack = webcamStream.getAudioTracks()[0];
    if (audioTrack) stream.addTrack(audioTrack);
    // Also add screen audio if available
    const screenAudio = screenStream?.getAudioTracks()[0];
    if (screenAudio) stream.addTrack(screenAudio);

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus' : 'video/webm';

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3000000 });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      cleanup();
      onRecordingComplete(blob);
    };

    recorderRef.current = recorder;
    recorder.start(1000);
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <button onClick={() => { cleanup(); onCancel(); }} className="text-white/70 text-sm font-medium">Cancel</button>
        <span className="text-white text-sm font-bold">Screen + Camera</span>
        <div className="w-16" />
      </div>

      {error && <p className="text-red-400 text-xs text-center px-4">{error}</p>}

      {/* Preview */}
      <div className="flex-1 flex items-center justify-center px-4 relative">
        <canvas ref={canvasRef} className="max-w-full max-h-full rounded-xl object-contain" style={{ aspectRatio: '16/9' }} />
        {!isRecording && screenStream && (
          <button onClick={startRecording} className="absolute w-20 h-20 bg-red-500 rounded-full border-4 border-white flex items-center justify-center">
            <div className="w-16 h-16 bg-red-500 rounded-full border-2 border-white" />
          </button>
        )}
      </div>

      {/* Hidden video elements */}
      <video ref={screenVideoRef} className="hidden" playsInline muted />
      <video ref={webcamVideoRef} className="hidden" playsInline muted />

      {/* Controls */}
      <div className="shrink-0 bg-gray-900 px-4 py-4 flex items-center justify-center gap-4">
        {isRecording ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white font-mono text-sm">{formatTime(recordingTime)}</span>
            </div>
            <button onClick={stopRecording} className="w-14 h-14 bg-red-600 rounded-full border-4 border-white flex items-center justify-center">
              <div className="w-5 h-5 bg-white rounded-sm" />
            </button>
          </>
        ) : (
          <div className="flex gap-2">
            {(['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const).map(pos => (
              <button
                key={pos}
                onClick={() => setWebcamPosition(pos)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium ${webcamPosition === pos ? 'bg-[#FFC72C] text-[#005587]' : 'bg-white/10 text-white/60'}`}
              >
                {pos.replace('-', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
