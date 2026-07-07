'use client';

import React, { useState, useEffect } from 'react';
import { DiscussionPost, DiscussionConfig } from '@/types/discussion';

interface DiscussionModeratorViewProps {
  assignmentId: string;
  discussionConfig: DiscussionConfig;
}

export function DiscussionModeratorView({ assignmentId, discussionConfig }: DiscussionModeratorViewProps) {
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post?')) return;
    // TODO: implement delete API
    setPosts(prev => prev.filter(p => p.postId !== postId));
  };

  // Compute participation per author
  const participationMap = new Map<string, { name: string; count: number; words: number }>();
  posts.forEach(p => {
    const existing = participationMap.get(p.authorId) || { name: p.authorName || 'Student', count: 0, words: 0 };
    existing.count++;
    existing.words += p.wordCount || 0;
    participationMap.set(p.authorId, existing);
  });

  const topLevelPosts = posts.filter(p => !p.parentPostId);

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005587]" /></div>;

  return (
    <div className="space-y-4">
      {/* Prompt */}
      <div className="bg-[#005587]/5 rounded-xl p-3 border border-[#005587]/10">
        <p className="text-xs text-[#005587] font-medium">Prompt</p>
        <p className="text-sm text-gray-800">{discussionConfig.prompt}</p>
      </div>

      {/* Participation Summary */}
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs font-bold text-[#005587] mb-2">Participation ({participationMap.size} students)</p>
        <div className="space-y-1 max-h-[150px] overflow-y-auto">
          {Array.from(participationMap.entries()).map(([id, data]) => (
            <div key={id} className="flex items-center justify-between text-[10px]">
              <span className="text-gray-700">{data.name}</span>
              <span className={`font-medium ${data.count >= discussionConfig.minPosts ? 'text-green-600' : 'text-amber-600'}`}>
                {data.count}/{discussionConfig.minPosts} posts • {data.words} words
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-2">
        {topLevelPosts.map(post => (
          <div key={post.postId} className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-900">{post.authorName || 'Student'}</span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                <button onClick={() => handleDelete(post.postId)} className="text-[9px] text-red-400">Delete</button>
              </div>
            </div>
            {post.content && <p className="text-xs text-gray-700">{post.content}</p>}
            {post.videoUrl && <video src={post.videoUrl} controls playsInline className="w-full rounded-lg mt-1 max-h-[120px]" />}
          </div>
        ))}
      </div>
    </div>
  );
}
