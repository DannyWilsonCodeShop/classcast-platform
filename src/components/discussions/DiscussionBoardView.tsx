'use client';

import React, { useState, useEffect } from 'react';
import { DiscussionPost, DiscussionConfig, ParticipationSummary } from '@/types/discussion';
import { DiscussionPostComposer } from './DiscussionPostComposer';
import { linkifyText, hostnameOf, extractUrls, personColor, BRAND_PERSON_COLOR, type PersonColor } from '@/lib/discussionRender';

interface DiscussionBoardViewProps {
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  discussionConfig: DiscussionConfig;
  dueDate: string;
}

const FREDOKA = 'var(--font-fredoka), Fredoka, sans-serif';

function Avatar({ post, color, size }: { post: DiscussionPost; color: PersonColor; size: number }) {
  const px = `${size}px`;
  const content =
    post.authorAvatar && post.authorAvatar.startsWith('http') ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" />
    ) : post.authorAvatar && post.authorAvatar.length <= 4 ? (
      <span>{post.authorAvatar}</span>
    ) : (
      (post.authorName || 'S')[0].toUpperCase()
    );
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold overflow-hidden shrink-0"
      style={{ width: px, height: px, background: color.avatarBg, fontSize: `${Math.round(size * 0.42)}px` }}
    >
      {content}
    </div>
  );
}

// Render the body text (linkified, XSS-safe) plus explicit link cards and an image.
function PostBody({ post }: { post: DiscussionPost }) {
  const inlineUrls = extractUrls(post.content || '');
  // De-dupe: link cards come from explicit links + inline URLs.
  const cardUrls = Array.from(new Set([...(post.links || []), ...inlineUrls]));

  return (
    <>
      {post.content && (
        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words" style={{ fontFamily: 'inherit' }}>
          {linkifyText(post.content)}
        </p>
      )}

      {cardUrls.length > 0 && (
        <div className="mt-2 space-y-2">
          {cardUrls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="block rounded-xl overflow-hidden border border-gray-200 hover:border-[#0065a3] transition-colors"
            >
              <div className="bg-[#0065a3] text-white text-[10px] font-bold tracking-wide px-3 py-1" style={{ fontFamily: FREDOKA }}>
                {hostnameOf(url)}
              </div>
              <div className="px-3 py-2 bg-white">
                <p className="text-xs text-[#0065a3] break-all">{url}</p>
              </div>
            </a>
          ))}
        </div>
      )}

      {post.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrl} alt="attachment" className="w-full rounded-lg mt-2 max-h-[280px] object-contain bg-gray-50" />
      )}

      {post.videoUrl && (
        <video src={post.videoUrl} controls playsInline className="w-full rounded-lg mt-2" style={{ maxHeight: '200px' }} />
      )}
    </>
  );
}

export function DiscussionBoardView({ assignmentId, studentId, studentName, studentAvatar, discussionConfig, dueDate }: DiscussionBoardViewProps) {
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [participation, setParticipation] = useState<ParticipationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const isPastDue = new Date(dueDate) < new Date();

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/discussions/${assignmentId}/posts?studentId=${studentId}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.data.posts || []);
        setParticipation(data.data.participationSummary || null);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, [assignmentId, studentId]);

  const handlePostCreated = (expandParent?: string) => {
    fetchPosts();
    setReplyingTo(null);
    if (expandParent) setExpanded(prev => new Set(prev).add(expandParent));
  };

  const toggleExpand = (postId: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
  };

  // Hide moderated posts from the student feed.
  const visible = posts.filter(p => !p.hidden);
  const topLevelPosts = visible.filter(p => !p.parentPostId);
  const getReplies = (parentId: string) => visible.filter(p => p.parentPostId === parentId);

  const colorFor = (authorId: string): PersonColor =>
    authorId === studentId ? BRAND_PERSON_COLOR : personColor(authorId);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0065a3]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Instructor prompt — pinned brand-blue banner */}
      <div
        className="rounded-2xl p-4 text-white shadow-sm"
        style={{ background: 'linear-gradient(135deg, #0065a3 0%, #0088cc 100%)' }}
      >
        <p className="text-[11px] font-bold uppercase tracking-wide text-white/80" style={{ fontFamily: FREDOKA }}>
          Discussion Prompt
        </p>
        <p className="text-sm mt-1 leading-relaxed">{discussionConfig.prompt}</p>
      </div>

      {/* Participation progress */}
      {participation && (
        <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs text-gray-600">
            Posts: <span className="font-bold text-[#0065a3]">{participation.postCount}</span>/{discussionConfig.minPosts} required
          </span>
          {participation.requirementsMet ? (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ Complete</span>
          ) : (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{discussionConfig.minPosts - participation.postCount} more needed</span>
          )}
        </div>
      )}

      {isPastDue && (
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-xs text-red-600 font-medium">Discussion is closed (past due date)</p>
        </div>
      )}

      {/* Thread feed */}
      <div className="space-y-3">
        {topLevelPosts.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No posts yet. Be the first to respond!</div>
        ) : (
          topLevelPosts.map(post => {
            const color = colorFor(post.authorId);
            const isMine = post.authorId === studentId;
            const replies = getReplies(post.postId);
            const isOpen = expanded.has(post.postId);
            return (
              <div
                key={post.postId}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                style={{ borderLeft: `4px solid ${color.bar}` }}
              >
                <div className="p-3" style={{ background: color.tint }}>
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar post={post} color={color} size={32} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-gray-900 truncate" style={{ fontFamily: FREDOKA }}>
                          {isMine ? 'You' : (post.authorName || 'Student')}
                        </span>
                        {isMine && (
                          <span className="text-[9px] font-bold text-white bg-[#0065a3] px-1.5 py-0.5 rounded-full">YOU</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  {/* Body */}
                  <PostBody post={post} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 px-3 py-2 bg-white border-t border-gray-100">
                  {!isPastDue && (
                    <button
                      onClick={() => setReplyingTo(replyingTo === post.postId ? null : post.postId)}
                      className="text-xs font-medium text-[#0065a3] active:scale-95"
                    >
                      Reply
                    </button>
                  )}
                  {replies.length > 0 && (
                    <button onClick={() => toggleExpand(post.postId)} className="text-xs font-medium text-gray-500">
                      {isOpen ? 'Hide replies' : `View ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
                    </button>
                  )}
                </div>

                {/* Inline reply composer */}
                {replyingTo === post.postId && !isPastDue && (
                  <div className="px-3 pb-3 pl-6">
                    <DiscussionPostComposer
                      discussionId={assignmentId}
                      authorId={studentId}
                      authorName={studentName}
                      authorAvatar={studentAvatar}
                      parentPostId={post.postId}
                      allowedTypes={discussionConfig.allowedResponseTypes}
                      minWordCount={0}
                      maxVideoDuration={discussionConfig.maxVideoDurationSeconds}
                      onPostCreated={() => handlePostCreated(post.postId)}
                      compact
                      placeholder={`Reply to ${post.authorId === studentId ? 'yourself' : (post.authorName || 'this post')}…`}
                    />
                    <button onClick={() => setReplyingTo(null)} className="text-[10px] text-gray-400 mt-1">Cancel</button>
                  </div>
                )}

                {/* Replies (one level, indented with a connector rail) */}
                {isOpen && replies.length > 0 && (
                  <div className="pl-5 pr-3 pb-3 space-y-2 relative">
                    <div className="absolute left-5 top-0 bottom-3 w-px bg-gray-200" aria-hidden />
                    {replies.map(reply => {
                      const rColor = colorFor(reply.authorId);
                      const rMine = reply.authorId === studentId;
                      return (
                        <div key={reply.postId} className="relative pl-4">
                          <div
                            className="rounded-xl border border-gray-100 p-2.5"
                            style={{ background: rColor.tint, borderLeft: `3px solid ${rColor.bar}` }}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <Avatar post={reply} color={rColor} size={22} />
                              <span className="text-xs font-bold text-gray-900" style={{ fontFamily: FREDOKA }}>
                                {rMine ? 'You' : (reply.authorName || 'Student')}
                              </span>
                              {rMine && (
                                <span className="text-[8px] font-bold text-white bg-[#0065a3] px-1 py-0.5 rounded-full">YOU</span>
                              )}
                              <span className="text-[9px] text-gray-400 ml-auto">
                                {new Date(reply.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <PostBody post={reply} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New top-level post composer, pinned at the bottom of the feed */}
      {!isPastDue && (
        <div className="pt-1">
          <DiscussionPostComposer
            discussionId={assignmentId}
            authorId={studentId}
            authorName={studentName}
            authorAvatar={studentAvatar}
            parentPostId={null}
            allowedTypes={discussionConfig.allowedResponseTypes}
            minWordCount={discussionConfig.minWordCount}
            maxVideoDuration={discussionConfig.maxVideoDurationSeconds}
            onPostCreated={() => handlePostCreated()}
          />
        </div>
      )}
    </div>
  );
}
