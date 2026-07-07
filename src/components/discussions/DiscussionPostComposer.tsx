'use client';

import React, { useState } from 'react';

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
}

export function DiscussionPostComposer({
  discussionId, authorId, authorName, authorAvatar, parentPostId,
  allowedTypes, minWordCount, maxVideoDuration, onPostCreated
}: DiscussionPostComposerProps) {
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = (allowedTypes === 'video') || (content.trim().length > 0 && wordCount >= minWordCount);

  const handleSubmit = async () => {
    if (!canSubmit || posting) return;
    setPosting(true);
    setError('');
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
        }),
      });
      const data = await res.json();
      if (data.success) {
        setContent('');
        onPostCreated();
      } else {
        setError(data.error || 'Failed to post');
      }
    } catch {
      setError('Network error');
    }
    setPosting(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      {(allowedTypes === 'text' || allowedTypes === 'both') && (
        <>
          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setError(''); }}
            placeholder={parentPostId ? 'Write a reply...' : 'Share your thoughts...'}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-1 focus:ring-[#005587] focus:border-[#005587] focus:outline-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className={`text-[10px] ${wordCount < minWordCount && minWordCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
              {wordCount} words {minWordCount > 0 && `(min ${minWordCount})`}
            </span>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || posting}
              className="px-4 py-1.5 bg-[#005587] text-white rounded-lg text-xs font-medium disabled:opacity-50"
            >
              {posting ? '...' : 'Post'}
            </button>
          </div>
        </>
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
