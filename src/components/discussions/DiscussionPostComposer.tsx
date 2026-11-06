'use client';

import React, { useEffect, useRef, useState } from 'react';
import { extractUrls, hostnameOf } from '@/lib/discussionRender';

// The board renders up to 2 link preview cards per post, so the composer caps
// explicitly-attached links at the same number to stay consistent.
const LINK_CAP = 2;
const FREDOKA_FONT = 'var(--font-fredoka), Fredoka, sans-serif';

interface DiscussionPostComposerProps {
  discussionId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  parentPostId: string | null;
  allowedTypes: 'text' | 'video' | 'both';
  minWordCount: number;
  maxVideoDuration: number;
  onPostCreated: () => void;
  compact?: boolean;
  placeholder?: string;
}

export function DiscussionPostComposer({
  discussionId, authorId, authorName, authorAvatar, parentPostId,
  allowedTypes, minWordCount, maxVideoDuration, onPostCreated, compact, placeholder,
}: DiscussionPostComposerProps) {
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [linkHint, setLinkHint] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // --- Video attachment state (video posts reuse the same presigned S3 flow as images) ---
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const allowsVideo = allowedTypes === 'video' || allowedTypes === 'both';
  const videoOnly = allowedTypes === 'video';

  // Stop camera + timer if the composer unmounts mid-recording (e.g. reply form closed).
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const hasAttachment = links.length > 0 || !!imageUrl || !!videoUrl;
  const canSubmit =
    (videoOnly ? !!videoUrl : false) ||
    (content.trim().length > 0 && wordCount >= minWordCount) ||
    hasAttachment;

  const linksAtCap = links.length >= LINK_CAP;

  const addLink = () => {
    const raw = linkValue.trim();
    if (!raw) return;
    if (linksAtCap) {
      setLinkHint(`You can attach up to ${LINK_CAP} links.`);
      return;
    }
    // Friendly, non-blocking validation: auto-prefix a bare domain with https://,
    // then confirm it's a real http(s) URL before accepting it.
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const parsed = new URL(normalized);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('scheme');
    } catch {
      setLinkHint('That doesn’t look like a web link. Try something like https://example.com');
      return;
    }
    if (links.includes(normalized)) {
      setLinkHint('That link is already attached.');
      setLinkValue('');
      return;
    }
    setLinks(prev => [...prev, normalized]);
    setLinkValue('');
    setLinkHint('');
    setShowLinkInput(false);
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError('');
    try {
      const res = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, userId: authorId, folder: 'discussion-images' }),
      });
      const data = await res.json();
      if (data.success) {
        await fetch(data.data.presignedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        setImageUrl(data.data.fileUrl);
      } else {
        setError('Image upload failed');
      }
    } catch {
      setError('Image upload failed');
    } finally {
      setUploadingImage(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // Upload a video File to S3 via the existing presigned flow (same as images, folder 'discussion-videos').
  const uploadVideoFile = async (file: File) => {
    setUploadingVideo(true);
    setVideoProgress(0);
    setError('');
    try {
      const res = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, userId: authorId, folder: 'discussion-videos' }),
      });
      const data = await res.json();
      if (!data.success) { setError('Video upload failed'); return; }
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', data.data.presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setVideoProgress(Math.round((e.loaded / e.total) * 100)); };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(`${xhr.status}`));
        xhr.onerror = () => reject(new Error('network'));
        xhr.send(file);
      });
      setVideoUrl(data.data.fileUrl);
    } catch {
      setError('Video upload failed');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleVideoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadVideoFile(file);
    if (videoFileRef.current) videoFileRef.current.value = '';
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (liveVideoRef.current) liveVideoRef.current.srcObject = stream;
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (ev) => { if (ev.data.size > 0) chunksRef.current.push(ev.data); };
      recorder.onstop = async () => {
        if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `discussion-recording-${Date.now()}.${ext}`, { type: mimeType });
        stopCamera();
        setRecording(false);
        await uploadVideoFile(file);
      };
      recorderRef.current = recorder;
      recorder.start(1000);
      setRecording(true);
      setRecordTime(0);
      recordTimerRef.current = setInterval(() => {
        setRecordTime(t => {
          const next = t + 1;
          // Auto-stop at the discussion's max video duration.
          if (maxVideoDuration > 0 && next >= maxVideoDuration && recorderRef.current?.state !== 'inactive') {
            recorderRef.current?.stop();
          }
          return next;
        });
      }, 1000);
    } catch (err: unknown) {
      setError(`Camera access denied: ${err instanceof Error ? err.message : 'unknown error'}`);
      stopCamera();
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || posting) return;
    setPosting(true);
    setError('');
    // Merge explicitly-added links with any URLs typed inline in the body.
    const allLinks = Array.from(new Set([...links, ...extractUrls(content)]));
    try {
      const res = await fetch(`/api/discussions/${discussionId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId,
          authorName,
          authorAvatar: authorAvatar || '',
          parentPostId,
          content: content.trim(),
          videoUrl,
          links: allLinks,
          imageUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setContent('');
        setLinks([]);
        setImageUrl(null);
        setVideoUrl(null);
        onPostCreated();
      } else {
        setError(data.error || 'Failed to post');
      }
    } catch {
      setError('Network error');
    }
    setPosting(false);
  };

  const showText = allowedTypes === 'text' || allowedTypes === 'both';

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Shared video capture/attachment UI (file picker + in-composer recorder + preview).
  const videoSection = allowsVideo ? (
    <div className="mt-2">
      {/* Live recording preview */}
      {recording && (
        <div className="relative mb-2">
          <video ref={liveVideoRef} autoPlay muted playsInline className="w-full rounded-lg bg-black max-h-48" />
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> REC {fmtTime(recordTime)}
            {maxVideoDuration > 0 && <span className="opacity-80">/ {fmtTime(maxVideoDuration)}</span>}
          </div>
        </div>
      )}

      {/* Uploaded/recorded video preview */}
      {videoUrl && !recording && (
        <div className="relative mb-2 inline-block w-full">
          <video src={videoUrl} controls preload="none" className="w-full rounded-lg border border-gray-200 max-h-48" />
          <button
            type="button"
            onClick={() => setVideoUrl(null)}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center"
          >✕</button>
        </div>
      )}

      {/* Upload progress */}
      {uploadingVideo && (
        <div className="mb-2">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#0065a3] transition-all" style={{ width: `${videoProgress}%` }} />
          </div>
          <span className="text-[10px] text-gray-400">Uploading video… {videoProgress}%</span>
        </div>
      )}

      {/* Capture controls */}
      {!videoUrl && !uploadingVideo && (
        <div className="flex items-center gap-2">
          {!recording ? (
            <>
              <button
                type="button"
                onClick={startRecording}
                className="px-3 py-1.5 bg-[#0065a3] text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
              >🎥 Record video</button>
              <button
                type="button"
                onClick={() => videoFileRef.current?.click()}
                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-medium flex items-center gap-1.5"
              >⬆️ Upload video</button>
            </>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium"
            >⏹ Stop recording</button>
          )}
          <input ref={videoFileRef} type="file" accept="video/*" className="hidden" onChange={handleVideoPick} />
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${compact ? 'p-2.5' : 'p-3'}`}>
      {showText && (
        <>
          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setError(''); }}
            placeholder={placeholder || (parentPostId ? `Reply to ${authorName ? '' : ''}...` : 'Share your thoughts...')}
            rows={compact ? 2 : 3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-1 focus:ring-[#0065a3] focus:border-[#0065a3] focus:outline-none"
          />

          {/* Pending links — shown as chips so the student sees what's attached before posting */}
          {links.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {links.map((l) => (
                <span
                  key={l}
                  title={l}
                  className="inline-flex items-center gap-1.5 text-[11px] bg-[#0065a3]/10 text-[#0065a3] font-medium pl-2 pr-1 py-1 rounded-full max-w-[220px]"
                >
                  <span aria-hidden>🔗</span>
                  <span className="truncate">{hostnameOf(l).toLowerCase()}</span>
                  <button
                    type="button"
                    onClick={() => { setLinks(prev => prev.filter(x => x !== l)); setLinkHint(''); }}
                    aria-label={`Remove link ${l}`}
                    className="w-4 h-4 flex items-center justify-center rounded-full bg-[#0065a3]/20 hover:bg-[#0065a3]/30 text-[#0065a3] text-[10px] font-bold leading-none"
                  >✕</button>
                </span>
              ))}
            </div>
          )}
          {imageUrl && (
            <div className="relative mt-2 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="attachment preview" className="max-h-24 rounded-lg border border-gray-200" />
              <button type="button" onClick={() => setImageUrl(null)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">✕</button>
            </div>
          )}

          {/* Video capture (when text+video is allowed) */}
          {videoSection}

          {/* Dedicated link input, revealed by the labeled "Add link" button */}
          {showLinkInput && (
            <div className="mt-2 rounded-xl border border-[#0065a3]/30 bg-[#0065a3]/5 p-2.5">
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={linkValue}
                  onChange={(e) => { setLinkValue(e.target.value); setLinkHint(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
                  placeholder="Paste a link (https://…)"
                  inputMode="url"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#0065a3] focus:border-[#0065a3] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addLink}
                  disabled={!linkValue.trim() || linksAtCap}
                  className="px-3 py-2 bg-[#0065a3] text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >Add</button>
                <button
                  type="button"
                  onClick={() => { setShowLinkInput(false); setLinkValue(''); setLinkHint(''); }}
                  aria-label="Cancel adding link"
                  className="px-2 py-2 text-gray-400 hover:text-gray-600 text-xs"
                >Cancel</button>
              </div>
              <p className={`text-[11px] mt-1.5 ${linkHint ? 'text-amber-600' : 'text-gray-500'}`}>
                {linkHint || 'Share an article or video — it’ll show a preview.'}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => { if (linksAtCap) { setLinkHint(`You can attach up to ${LINK_CAP} links.`); setShowLinkInput(true); return; } setShowLinkInput(v => !v); setLinkHint(''); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#0065a3]/40 text-[#0065a3] bg-[#0065a3]/5 hover:bg-[#0065a3]/10 text-xs font-semibold"
                style={{ fontFamily: FREDOKA_FONT }}
                aria-expanded={showLinkInput}
              >
                <span aria-hidden>🔗</span> Add link
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingImage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 text-xs font-semibold disabled:opacity-50"
                style={{ fontFamily: FREDOKA_FONT }}
                aria-label="Add image"
              >
                <span aria-hidden>🖼️</span> {uploadingImage ? 'Uploading…' : 'Add image'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
              <span className={`text-[10px] ${wordCount < minWordCount && minWordCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                {wordCount} words {minWordCount > 0 && `(min ${minWordCount})`}
              </span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || posting || uploadingVideo || recording}
              className="px-4 py-1.5 bg-[#0065a3] text-white rounded-lg text-xs font-medium disabled:opacity-50"
            >
              {posting ? '...' : parentPostId ? 'Reply' : 'Post'}
            </button>
          </div>
        </>
      )}

      {/* Video-only mode: capture UI + its own submit button (no text body). */}
      {videoOnly && (
        <>
          {videoSection}
          <div className="flex items-center justify-end mt-2">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || posting || uploadingVideo || recording}
              className="px-4 py-1.5 bg-[#0065a3] text-white rounded-lg text-xs font-medium disabled:opacity-50"
            >
              {posting ? '...' : parentPostId ? 'Reply' : 'Post video'}
            </button>
          </div>
        </>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
