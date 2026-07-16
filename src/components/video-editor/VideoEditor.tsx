'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { VideoTimeline } from './VideoTimeline';

interface VideoEditorProps {
  videoUrl: string; // Object URL or S3 URL of the recorded video
  onSave: (editedBlob: Blob) => void;
  onCancel: () => void;
}

export function VideoEditor({ videoUrl, onSave, onCancel }: VideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [cutRegions, setCutRegions] = useState<{ start: number; end: number }[]>([]);
  const [isEncoding, setIsEncoding] = useState(false);
  const [encodingProgress, setEncodingProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'trim' | 'cut' | 'speed'>('trim');
  const [speed, setSpeed] = useState(1.0);
  const [markingCut, setMarkingCut] = useState<number | null>(null);

  // Load video metadata
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleLoaded = () => {
      setDuration(video.duration);
      setTrimEnd(video.duration);
    };
    video.addEventListener('loadedmetadata', handleLoaded);
    return () => video.removeEventListener('loadedmetadata', handleLoaded);
  }, [videoUrl]);

  // Sync playhead
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTime = () => setCurrentTime(video.currentTime);
    video.addEventListener('timeupdate', handleTime);
    return () => video.removeEventListener('timeupdate', handleTime);
  }, []);

  // Enforce trim bounds during playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isPlaying) return;
    if (video.currentTime < trimStart) video.currentTime = trimStart;
    if (video.currentTime >= trimEnd) {
      video.pause();
      setIsPlaying(false);
    }
    // Skip cut regions
    for (const cut of cutRegions) {
      if (video.currentTime >= cut.start && video.currentTime < cut.end) {
        video.currentTime = cut.end;
      }
    }
  }, [currentTime, isPlaying, trimStart, trimEnd, cutRegions]);

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
      }
      video.playbackRate = speed;
      video.play();
      setIsPlaying(true);
    }
  };

  // Mark cut region
  const handleMarkCut = () => {
    if (markingCut === null) {
      setMarkingCut(currentTime);
    } else {
      const start = Math.min(markingCut, currentTime);
      const end = Math.max(markingCut, currentTime);
      if (end - start >= 0.3) {
        setCutRegions(prev => [...prev, { start, end }]);
      }
      setMarkingCut(null);
    }
  };

  const removeCutRegion = (index: number) => {
    setCutRegions(prev => prev.filter((_, i) => i !== index));
  };

  // Reset all edits
  const handleReset = () => {
    setTrimStart(0);
    setTrimEnd(duration);
    setCutRegions([]);
    setSpeed(1.0);
  };

  // Encode the edited video
  const handleEncode = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setIsEncoding(true);
    setEncodingProgress(0);

    const ctx = canvas.getContext('2d')!;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const stream = canvas.captureStream(30);
    // Add audio track from video
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(video);
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);
    source.connect(audioCtx.destination);
    stream.addTrack(dest.stream.getAudioTracks()[0]);

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    const editedDuration = (trimEnd - trimStart) - cutRegions.reduce((sum, c) => sum + (c.end - c.start), 0);

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      source.disconnect();
      audioCtx.close();
      setIsEncoding(false);
      setEncodingProgress(100);
      onSave(blob);
    };

    // Play through the edited segments and capture frames
    video.currentTime = trimStart;
    video.playbackRate = speed;
    await new Promise<void>(r => { video.onseeked = () => r(); });

    recorder.start();
    video.play();

    const startedAt = Date.now();
    const checkProgress = setInterval(() => {
      const elapsed = (video.currentTime - trimStart);
      const pct = Math.min(95, (elapsed / editedDuration) * 100);
      setEncodingProgress(Math.round(pct));

      // Skip cut regions
      for (const cut of cutRegions) {
        if (video.currentTime >= cut.start && video.currentTime < cut.end) {
          video.currentTime = cut.end;
        }
      }

      // Draw frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Stop at trim end
      if (video.currentTime >= trimEnd) {
        clearInterval(checkProgress);
        video.pause();
        recorder.stop();
      }
    }, 1000 / 30); // 30fps
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <button onClick={onCancel} className="text-white/70 text-sm font-medium">Cancel</button>
        <span className="text-white text-sm font-bold">Edit Video</span>
        <button
          onClick={handleEncode}
          disabled={isEncoding}
          className="text-[#FFC72C] text-sm font-bold disabled:opacity-50"
        >
          {isEncoding ? 'Encoding...' : 'Done'}
        </button>
      </div>

      {/* Video preview */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0">
        <video
          ref={videoRef}
          src={videoUrl}
          className="max-w-full max-h-full rounded-xl object-contain"
          playsInline
          onClick={togglePlay}
        />
        {/* Play button overlay */}
        {!isPlaying && !isEncoding && (
          <button
            onClick={togglePlay}
            className="absolute w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
        {/* Encoding overlay */}
        {isEncoding && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
            <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-[#FFC72C] rounded-full transition-all" style={{ width: `${encodingProgress}%` }} />
            </div>
            <p className="text-white text-sm">Processing... {encodingProgress}%</p>
          </div>
        )}
      </div>

      {/* Hidden canvas for encoding */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Toolbar */}
      <div className="shrink-0 bg-gray-900 border-t border-white/10">
        {/* Tool tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('trim')}
            className={`flex-1 py-2 text-xs font-medium ${activeTab === 'trim' ? 'text-[#FFC72C] border-b-2 border-[#FFC72C]' : 'text-white/50'}`}
          >
            ✂️ Trim
          </button>
          <button
            onClick={() => setActiveTab('cut')}
            className={`flex-1 py-2 text-xs font-medium ${activeTab === 'cut' ? 'text-[#FFC72C] border-b-2 border-[#FFC72C]' : 'text-white/50'}`}
          >
            🔪 Cut
          </button>
          <button
            onClick={() => setActiveTab('speed')}
            className={`flex-1 py-2 text-xs font-medium ${activeTab === 'speed' ? 'text-[#FFC72C] border-b-2 border-[#FFC72C]' : 'text-white/50'}`}
          >
            ⚡ Speed
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 text-xs text-red-400 font-medium"
          >
            Reset
          </button>
        </div>

        {/* Tool content */}
        <div className="px-3 py-2 min-h-[40px]">
          {activeTab === 'trim' && (
            <p className="text-[10px] text-white/50 text-center">Drag the yellow handles to trim the start and end</p>
          )}
          {activeTab === 'cut' && (
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-white/50">
                {markingCut !== null ? 'Now seek to the end of the cut and tap again' : 'Seek to start of section to remove, then tap Cut'}
              </p>
              <button
                onClick={handleMarkCut}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${markingCut !== null ? 'bg-red-500 text-white' : 'bg-white/10 text-white'}`}
              >
                {markingCut !== null ? 'End Cut' : 'Mark Cut'}
              </button>
            </div>
          )}
          {activeTab === 'cut' && cutRegions.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {cutRegions.map((cut, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-300 text-[10px] rounded-full">
                  {Math.floor(cut.start)}s–{Math.floor(cut.end)}s
                  <button onClick={() => removeCutRegion(i)} className="text-red-400">×</button>
                </span>
              ))}
            </div>
          )}
          {activeTab === 'speed' && (
            <div className="flex items-center justify-center gap-2">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${speed === s ? 'bg-[#FFC72C] text-[#005587]' : 'bg-white/10 text-white/70'}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Timeline */}
        <VideoTimeline
          duration={duration}
          currentTime={currentTime}
          trimStart={trimStart}
          trimEnd={trimEnd}
          cutRegions={cutRegions}
          onSeek={handleSeek}
          onTrimStartChange={setTrimStart}
          onTrimEndChange={setTrimEnd}
        />
      </div>
    </div>
  );
}
