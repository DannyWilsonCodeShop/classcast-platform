'use client';

import React, { useState, useEffect } from 'react';
import { DiscussionPost, DiscussionConfig } from '@/types/discussion';
import { linkifyText, postCardUrls, LinkCard } from '@/lib/discussionRender';

interface DiscussionModeratorViewProps {
  assignmentId: string;
  discussionConfig: DiscussionConfig;
}

export function DiscussionModeratorView({ assignmentId, discussionConfig }: DiscussionModeratorViewProps) {
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [participation, setParticipation] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<{ postsRequired: number; repliesRequired: number; legacy: boolean } | null>(null);

  const fetchParticipation = async () => {
    try {
      const res = await fetch(`/api/discussions/${assignmentId}/participation`);
      const data = await res.json();
      if (data.success) {
        setParticipation(data.data.students || []);
        setRequirements(data.data.requirements || null);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchParticipation();
  }, [assignmentId]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/discussions/${assignmentId}/posts`);
        const data = await res.json();
        if (data.success) setPosts(data.data.posts || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchPosts();
  }, [assignmentId]);

  const handleHide = async (postId: string) => {
    if (!confirm('Hide this post from students?')) return;
    try {
      const res = await fetch(`/api/discussions/${assignmentId}/posts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, hidden: true }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.map(p => p.postId === postId ? { ...p, hidden: true } : p));
        fetchParticipation();
      } else {
        alert(data.error || 'Failed to hide post');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleUnhide = async (postId: string) => {
    try {
      const res = await fetch(`/api/discussions/${assignmentId}/posts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, hidden: false }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.map(p => p.postId === postId ? { ...p, hidden: false } : p));
        fetchParticipation();
      }
    } catch { /* ignore */ }
  };


  const topLevelPosts = posts.filter(p => !p.parentPostId);

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0065a3]" /></div>;

  return (
    <div className="space-y-4">
      {/* Prompt */}
      <div className="bg-[#0065a3]/5 rounded-xl p-3 border border-[#0065a3]/10">
        <p className="text-xs text-[#0065a3] font-medium">Prompt</p>
        <p className="text-sm text-gray-800">{discussionConfig.prompt}</p>
      </div>

      {/* Participation Summary */}
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs font-bold text-[#0065a3] mb-2">Participation ({participation.length} students)</p>
        <div className="space-y-1 max-h-[200px] overflow-y-auto">
          {participation.map((s) => (
            <div key={s.studentId} className="flex items-center justify-between gap-2 text-[10px]">
              <span className="text-gray-700 truncate">{s.name}</span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="text-gray-600">
                  Posts {s.postCount}/{requirements?.postsRequired ?? discussionConfig.minPosts}
                  {requirements && !requirements.legacy ? `, Replies ${s.replyCount}/${requirements.repliesRequired}` : ''}
                  {` • ${s.totalWordCount} words`}
                </span>
                <span className={`px-1.5 py-0.5 rounded-full font-medium ${s.requirementsMet ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {s.requirementsMet ? 'Met' : 'Not met'}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-2">
        {topLevelPosts.map(post => (
          <div key={post.postId} className={`rounded-xl p-3 ${post.hidden ? 'bg-red-50 opacity-70' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-900">
                {post.authorName || 'Student'}
                {post.hidden && <span className="ml-2 text-[9px] text-red-500 font-bold">HIDDEN</span>}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                {post.hidden ? (
                  <button onClick={() => handleUnhide(post.postId)} className="text-[9px] text-[#0065a3]">Unhide</button>
                ) : (
                  <button onClick={() => handleHide(post.postId)} className="text-[9px] text-red-400">Hide</button>
                )}
              </div>
            </div>
            {post.content && (
              <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">{linkifyText(post.content)}</p>
            )}
            {(() => {
              // Rich link previews via the shared render helper — same de-dupe/cap
              // and LinkCard as the student view, so both surfaces match.
              const cardUrls = postCardUrls(post.links, post.content);
              return cardUrls.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {cardUrls.map((url) => (
                    <LinkCard key={url} url={url} />
                  ))}
                </div>
              ) : null;
            })()}
            {post.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.imageUrl} alt="attachment" className="w-full rounded-lg mt-1 max-h-[120px] object-contain" />
            )}
            {post.videoUrl && <video src={post.videoUrl} controls playsInline preload="none" className="w-full rounded-lg mt-1 max-h-[120px]" />}
          </div>
        ))}
      </div>
    </div>
  );
}
