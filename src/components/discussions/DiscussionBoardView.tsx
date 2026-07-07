'use client';

import React, { useState, useEffect } from 'react';
import { DiscussionPost, DiscussionConfig, ParticipationSummary } from '@/types/discussion';
import { DiscussionPostComposer } from './DiscussionPostComposer';

interface DiscussionBoardViewProps {
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  discussionConfig: DiscussionConfig;
  dueDate: string;
}

export function DiscussionBoardView({ assignmentId, studentId, studentName, studentAvatar, discussionConfig, dueDate }: DiscussionBoardViewProps) {
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [participation, setParticipation] = useState<ParticipationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

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

  const handlePostCreated = () => {
    fetchPosts();
    setReplyingTo(null);
  };

  // Organize posts into threads (top-level + replies)
  const topLevelPosts = posts.filter(p => !p.parentPostId);
  const getReplies = (parentId: string) => posts.filter(p => p.parentPostId === parentId);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005587]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Prompt */}
      <div className="bg-[#005587]/5 rounded-xl p-4 border border-[#005587]/10">
        <p className="text-sm font-medium text-[#005587]">Discussion Prompt</p>
        <p className="text-sm text-gray-800 mt-1">{discussionConfig.prompt}</p>
      </div>

      {/* Participation Progress */}
      {participation && (
        <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs text-gray-600">
            Posts: <span className="font-bold text-[#005587]">{participation.postCount}</span>/{discussionConfig.minPosts} required
          </span>
          {participation.requirementsMet ? (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ Complete</span>
          ) : (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{discussionConfig.minPosts - participation.postCount} more needed</span>
          )}
        </div>
      )}

      {/* New Post Composer (top-level) */}
      {!isPastDue && replyingTo === null && (
        <DiscussionPostComposer
          discussionId={assignmentId}
          authorId={studentId}
          authorName={studentName}
          authorAvatar={studentAvatar}
          parentPostId={null}
          allowedTypes={discussionConfig.allowedResponseTypes}
          minWordCount={discussionConfig.minWordCount}
          maxVideoDuration={discussionConfig.maxVideoDurationSeconds}
          onPostCreated={handlePostCreated}
        />
      )}

      {isPastDue && (
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-xs text-red-600 font-medium">Discussion is closed (past due date)</p>
        </div>
      )}

      {/* Thread List */}
      <div className="space-y-3">
        {topLevelPosts.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No posts yet. Be the first to respond!</div>
        ) : (
          topLevelPosts.map(post => (
            <div key={post.postId} className="bg-gray-50 rounded-xl p-3">
              {/* Post Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#005587] flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                  {post.authorAvatar && post.authorAvatar.startsWith('http') ? (
                    <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" />
                  ) : post.authorAvatar && post.authorAvatar.length <= 4 ? (
                    <span className="text-sm">{post.authorAvatar}</span>
                  ) : (
                    (post.authorName || 'S')[0].toUpperCase()
                  )}
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-900">{post.authorName || 'Student'}</span>
                  <span className="text-[10px] text-gray-400 ml-2">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {/* Post Content */}
              {post.content && <p className="text-sm text-gray-700 mb-2">{post.content}</p>}
              {post.videoUrl && (
                <video src={post.videoUrl} controls playsInline className="w-full rounded-lg mb-2" style={{ maxHeight: '200px' }} />
              )}
              {/* Reply Button */}
              {!isPastDue && (
                <button onClick={() => setReplyingTo(post.postId)} className="text-[10px] text-[#005587] font-medium">
                  Reply
                </button>
              )}
              {/* Reply Composer */}
              {replyingTo === post.postId && (
                <div className="mt-2 ml-4">
                  <DiscussionPostComposer
                    discussionId={assignmentId}
                    authorId={studentId}
                    authorName={studentName}
                    authorAvatar={studentAvatar}
                    parentPostId={post.postId}
                    allowedTypes={discussionConfig.allowedResponseTypes}
                    minWordCount={0}
                    maxVideoDuration={discussionConfig.maxVideoDurationSeconds}
                    onPostCreated={handlePostCreated}
                  />
                  <button onClick={() => setReplyingTo(null)} className="text-[10px] text-gray-400 mt-1">Cancel</button>
                </div>
              )}
              {/* Replies */}
              {getReplies(post.postId).map(reply => (
                <div key={reply.postId} className="ml-6 mt-2 bg-white rounded-lg p-2 border border-gray-100">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[10px] font-medium text-gray-700">{reply.authorName || 'Student'}</span>
                    <span className="text-[9px] text-gray-400">{new Date(reply.createdAt).toLocaleDateString()}</span>
                  </div>
                  {reply.content && <p className="text-xs text-gray-600">{reply.content}</p>}
                  {reply.videoUrl && <video src={reply.videoUrl} controls playsInline className="w-full rounded-lg mt-1" style={{ maxHeight: '150px' }} />}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
