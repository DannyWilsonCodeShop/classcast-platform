'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { VideoTimeline } from './VideoTimeline';

interface VideoEditorProps {
  videoUrl: string;
  onSave: (editedBlob: Blob) => void;
  onCancel: () => void;
}

interface TextOverlay {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  position: 'top' | 'center' | 'bottom';
  fontSize: number;
  color: string;
}

interface CaptionWord {
  text: string;
  startTime: number;
  endTime: number;
}

type FilterType = 'none' | 'warm' | 'cool' | 'bw' | 'contrast' | 'soft';

const FILTERS: { id: FilterType; label: string; css: string }[] = [
  { id: 'none', label: 'Normal', css: '' },
  { id: 'warm', label: 'Warm', css: 'sepia(0.3) saturate(1.3) brightness(1.05)' },
  { id: 'cool', label: 'Cool', css: 'saturate(0.8) hue-rotate(15deg) brightness(1.05)' },
  { id: 'bw', label: 'B&W', css: 'grayscale(1)' },
  { id: 'contrast', label: 'Contrast', css: 'contrast(1.3) saturate(1.1)' },
  { id: 'soft', label: 'Soft', css: 'brightness(1.1) contrast(0.9) saturate(0.9)' },
];

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
  const [activeTab, setActiveTab] = useState<'trim' | 'cut' | 'speed' | 'filter' | 'text' | 'captions'>('trim');
  const [speed, setSpeed] = useState(1.0);
  const [markingCut, setMarkingCut] = useState<number | null>(null);

  // Phase 2: Filters
  const [activeFilter, setActiveFilter] = useState<FilterType>('none');

  // Phase 2: Text overlays
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [newText, setNewText] = useState('');
  const [newTextPosition, setNewTextPosition] = useState<'top' | 'center' | 'bottom'>('bottom');

  // Phase 2: Auto-captions
  const [captions, setCaptions] = useState<CaptionWord[]>([]);
  const [captionsLoading, setCaptionsLoading] = useState(false);
  const [captionsError, setCaptionsError] = useState('');

  // Load video metadata
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleLoaded = () => { setDuration(video.duration); setTrimEnd(video.duration); };
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
    if (video.currentTime >= trimEnd) { video.pause(); setIsPlaying(false); }
    for (const cut of cutRegions) {
      if (video.currentTime >= cut.start && video.currentTime < cut.end) video.currentTime = cut.end;
    }
  }, [currentTime, isPlaying, trimStart, trimEnd, cutRegions]);

  const handleSeek = (time: number) => {
    if (videoRef.current) { videoRef.current.currentTime = time; setCurrentTime(time); }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) { video.pause(); setIsPlaying(false); }
    else {
      if (video.currentTime < trimStart || video.currentTime >= trimEnd) video.currentTime = trimStart;
      video.playbackRate = speed;
      video.play();
      setIsPlaying(true);
    }
  };

  const handleMarkCut = () => {
    if (markingCut === null) { setMarkingCut(currentTime); }
    else {
      const start = Math.min(markingCut, currentTime);
      const end = Math.max(markingCut, currentTime);
      if (end - start >= 0.3) setCutRegions(prev => [...prev, { start, end }]);
      setMarkingCut(null);
    }
  };

  const removeCutRegion = (i: number) => setCutRegions(prev => prev.filter((_, idx) => idx !== i));

  const handleReset = () => {
    setTrimStart(0); setTrimEnd(duration); setCutRegions([]); setSpeed(1.0);
    setActiveFilter('none'); setTextOverlays([]); setCaptions([]);
  };

  // Add text overlay
  const handleAddText = () => {
    if (!newText.trim()) return;
    setTextOverlays(prev => [...prev, {
      id: `txt_${Date.now()}`,
      text: newText.trim(),
      startTime: currentTime,
      endTime: Math.min(currentTime + 3, trimEnd),
      position: newTextPosition,
      fontSize: 32,
      color: '#ffffff',
    }]);
    setNewText('');
  };

  const removeTextOverlay = (id: string) => setTextOverlays(prev => prev.filter(t => t.id !== id));

  // Auto-generate captions
  const handleGenerateCaptions = async () => {
    setCaptionsLoading(true);
    setCaptionsError('');
    try {
      // Upload the video to get a URL for transcription
      const res = await fetch('/api/video/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      });
      const data = await res.json();
      if (data.success && data.words) {
        setCaptions(data.words);
      } else {
        setCaptionsError(data.error || 'Failed to generate captions. You can add text manually.');
      }
    } catch {
      setCaptionsError('Captions unavailable. You can add text manually instead.');
    } finally {
      setCaptionsLoading(false);
    }
  };

  // Get filter CSS for canvas
  const getFilterCSS = () => FILTERS.find(f => f.id === activeFilter)?.css || '';

  // Draw text overlays on canvas
  const drawTextOnCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    // Draw text overlays
    for (const overlay of textOverlays) {
      if (time >= overlay.startTime && time <= overlay.endTime) {
        ctx.font = `bold ${overlay.fontSize}px sans-serif`;
        ctx.fillStyle = overlay.color;
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        let y = overlay.position === 'top' ? 60 : overlay.position === 'center' ? height / 2 : height - 40;
        ctx.strokeText(overlay.text, width / 2, y);
        ctx.fillText(overlay.text, width / 2, y);
      }
    }
    // Draw captions
    for (let i = 0; i < captions.length; i++) {
      const word = captions[i];
      if (time >= word.startTime && time <= word.endTime + 0.5) {
        // Gather words in the same time window (show 3-5 words at a time)
        let phrase = word.text;
        for (let j = i + 1; j < Math.min(i + 5, captions.length); j++) {
          if (captions[j].startTime <= time + 1) phrase += ' ' + captions[j].text;
          else break;
        }
        ctx.font = 'bold 28px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.strokeText(phrase, width / 2, height - 50);
        ctx.fillText(phrase, width / 2, height - 50);
        break;
      }
    }
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

    video.currentTime = trimStart;
    video.playbackRate = speed;
    await new Promise<void>(r => { video.onseeked = () => r(); });

    recorder.start();
    video.play();

    const filterCSS = getFilterCSS();
    const checkProgress = setInterval(() => {
      const elapsed = video.currentTime - trimStart;
      setEncodingProgress(Math.round(Math.min(95, (elapsed / editedDuration) * 100)));

      for (const cut of cutRegions) {
        if (video.currentTime >= cut.start && video.currentTime < cut.end) video.currentTime = cut.end;
      }

      // Apply filter
      if (filterCSS) ctx.filter = filterCSS;
      else ctx.filter = 'none';

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none'; // Reset for text

      // Draw text/captions
      drawTextOnCanvas(ctx, canvas.width, canvas.height, video.currentTime);

      if (video.currentTime >= trimEnd) {
        clearInterval(checkProgress);
        video.pause();
        recorder.stop();
      }
    }, 1000 / 30);
  };

  const filterCSS = getFilterCSS();

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <button onClick={onCancel} className="text-white/70 text-sm font-medium">Cancel</button>
        <span className="text-white text-sm font-bold">Edit Video</span>
        <button onClick={handleEncode} disabled={isEncoding} className="text-[#FFC72C] text-sm font-bold disabled:opacity-50">
          {isEncoding ? 'Encoding...' : 'Done'}
        </button>
      </div>

      {/* Video preview */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0 relative">
        <video
          ref={videoRef}
          src={videoUrl}
          className="max-w-full max-h-full rounded-xl object-contain"
          style={{ filter: filterCSS || undefined }}
          playsInline
          onClick={togglePlay}
        />
        {!isPlaying && !isEncoding && (
          <button onClick={togglePlay} className="absolute w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </button>
        )}
        {isEncoding && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
            <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-[#FFC72C] rounded-full transition-all" style={{ width: `${encodingProgress}%` }} />
            </div>
            <p className="text-white text-sm">Processing... {encodingProgress}%</p>
          </div>
        )}
        {/* Live text overlay preview */}
        {textOverlays.filter(t => currentTime >= t.startTime && currentTime <= t.endTime).map(t => (
          <div key={t.id} className={`absolute left-0 right-0 text-center pointer-events-none ${t.position === 'top' ? 'top-8' : t.position === 'center' ? 'top-1/2 -translate-y-1/2' : 'bottom-8'}`}>
            <span className="text-white text-2xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{t.text}</span>
          </div>
        ))}
        {/* Live caption preview */}
        {captions.length > 0 && (() => {
          const active = captions.find(w => currentTime >= w.startTime && currentTime <= w.endTime + 0.5);
          if (!active) return null;
          let phrase = active.text;
          const idx = captions.indexOf(active);
          for (let j = idx + 1; j < Math.min(idx + 5, captions.length); j++) {
            if (captions[j].startTime <= currentTime + 1) phrase += ' ' + captions[j].text;
            else break;
          }
          return (
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
              <span className="bg-black/70 text-white text-sm font-medium px-3 py-1 rounded">{phrase}</span>
            </div>
          );
        })()}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Toolbar */}
      <div className="shrink-0 bg-gray-900 border-t border-white/10">
        {/* Scrollable tool tabs */}
        <div className="flex overflow-x-auto border-b border-white/10 no-scrollbar">
          {(['trim', 'cut', 'speed', 'filter', 'text', 'captions'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-3 py-2 text-xs font-medium whitespace-nowrap ${activeTab === tab ? 'text-[#FFC72C] border-b-2 border-[#FFC72C]' : 'text-white/50'}`}
            >
              {tab === 'trim' && '✂️ Trim'}
              {tab === 'cut' && '🔪 Cut'}
              {tab === 'speed' && '⚡ Speed'}
              {tab === 'filter' && '🎨 Filter'}
              {tab === 'text' && '✏️ Text'}
              {tab === 'captions' && '💬 Captions'}
            </button>
          ))}
          <button onClick={handleReset} className="shrink-0 px-3 py-2 text-xs text-red-400 font-medium">Reset</button>
        </div>

        {/* Tool content */}
        <div className="px-3 py-2 min-h-[48px] max-h-[120px] overflow-y-auto">
          {activeTab === 'trim' && (
            <p className="text-[10px] text-white/50 text-center">Drag the yellow handles to trim the start and end</p>
          )}

          {activeTab === 'cut' && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-white/50">
                  {markingCut !== null ? 'Seek to end of cut, tap again' : 'Seek to start, tap Mark Cut'}
                </p>
                <button onClick={handleMarkCut} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${markingCut !== null ? 'bg-red-500 text-white' : 'bg-white/10 text-white'}`}>
                  {markingCut !== null ? 'End Cut' : 'Mark Cut'}
                </button>
              </div>
              {cutRegions.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {cutRegions.map((cut, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-300 text-[10px] rounded-full">
                      {Math.floor(cut.start)}s–{Math.floor(cut.end)}s
                      <button onClick={() => removeCutRegion(i)} className="text-red-400">×</button>
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'speed' && (
            <div className="flex items-center justify-center gap-2">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                <button key={s} onClick={() => setSpeed(s)} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${speed === s ? 'bg-[#FFC72C] text-[#005587]' : 'bg-white/10 text-white/70'}`}>
                  {s}x
                </button>
              ))}
            </div>
          )}

          {activeTab === 'filter' && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {FILTERS.map(f => (
                <button key={f.id} onClick={() => setActiveFilter(f.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${activeFilter === f.id ? 'bg-[#FFC72C] text-[#005587]' : 'bg-white/10 text-white/70'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Type text..."
                  className="flex-1 px-2.5 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FFC72C]"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
                />
                <select value={newTextPosition} onChange={(e) => setNewTextPosition(e.target.value as any)} className="px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs text-white focus:outline-none">
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                </select>
                <button onClick={handleAddText} disabled={!newText.trim()} className="px-3 py-1.5 bg-[#FFC72C] text-[#005587] rounded-lg text-xs font-bold disabled:opacity-40">Add</button>
              </div>
              {textOverlays.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {textOverlays.map(t => (
                    <span key={t.id} className="flex items-center gap-1 px-2 py-0.5 bg-white/10 text-white text-[10px] rounded-full">
                      "{t.text}" @ {Math.floor(t.startTime)}s
                      <button onClick={() => removeTextOverlay(t.id)} className="text-white/50 hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'captions' && (
            <div className="space-y-2">
              {captions.length === 0 ? (
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-white/50">Auto-generate captions from your audio</p>
                  <button
                    onClick={handleGenerateCaptions}
                    disabled={captionsLoading}
                    className="px-3 py-1.5 bg-[#FFC72C] text-[#005587] rounded-lg text-xs font-bold disabled:opacity-50"
                  >
                    {captionsLoading ? 'Generating...' : '✨ Generate'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-white/50">{captions.length} words detected</p>
                  <button onClick={() => setCaptions([])} className="text-[10px] text-red-400">Remove captions</button>
                </div>
              )}
              {captionsError && <p className="text-[10px] text-orange-400">{captionsError}</p>}
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
