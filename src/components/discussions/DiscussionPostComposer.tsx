'use client';

import React, { useRef, useState } from 'react';
import { extractUrls } from '@/lib/discussionRender';

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
  allowedTypes, minWordCount, onPostCreated, compact, placeholder,
}: DiscussionPostComposerProps) {
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const hasAttachment = links.length > 0 || !!imageUrl;
  const canSubmit =
    (allowedTypes === 'video') ||
    (content.trim().length > 0 && wordCount >= minWordCount) ||
    hasAttachment;

  const addLink = () => {
    const url = linkValue.trim();
    if (!url) return;
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    setLinks(prev => Array.from(new Set([...prev, normalized])));
    setLinkValue('');
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
          videoUrl: null,
          links: allLinks,
          imageUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setContent('');
        setLinks([]);
        setImageUrl(null);
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

          {/* Pending attachments */}
          {links.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {links.map((l) => (
                <span key={l} className="inline-flex items-center gap-1 text-[10px] bg-[#0065a3]/10 text-[#0065a3] px-2 py-0.5 rounded-full max-w-[200px]">
                  <span className="truncate">🔗 {l}</span>
                  <button type="button" onClick={() => setLinks(prev => prev.filter(x => x !== l))} className="font-bold">✕</button>
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

          {showLinkInput && (
            <div className="flex items-center gap-2 mt-2">
              <input
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
                placeholder="Paste a link (https://...)"
                className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0065a3] focus:outline-none"
              />
              <button type="button" onClick={addLink} className="text-xs text-[#0065a3] font-medium">Add</button>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLinkInput(v => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 text-sm"
                title="Add link"
                aria-label="Add link"
              >🔗</button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingImage}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 text-sm disabled:opacity-50"
                title="Add image"
                aria-label="Add image"
              >{uploadingImage ? '…' : '🖼️'}</button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
              <span className={`text-[10px] ${wordCount < minWordCount && minWordCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                {wordCount} words {minWordCount > 0 && `(min ${minWordCount})`}
              </span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || posting}
              className="px-4 py-1.5 bg-[#0065a3] text-white rounded-lg text-xs font-medium disabled:opacity-50"
            >
              {posting ? '...' : parentPostId ? 'Reply' : 'Post'}
            </button>
          </div>
        </>
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
