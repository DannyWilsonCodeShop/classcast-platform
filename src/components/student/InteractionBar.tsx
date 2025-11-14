'use client';

import React from 'react';

interface InteractionBarProps {
  videoId: string;
  contentCreatorId?: string | null;
  currentUser: { id: string; firstName?: string; lastName?: string; email?: string; avatar?: string };
  initialLikes?: number;
  initialComments?: number;
  initialIsLiked?: boolean;
  initialUserRating?: number;
  onCountsChange?: (counts: { likes?: number; comments?: number; userRating?: number; averageRating?: number }) => void;
}

const InteractionBar: React.FC<InteractionBarProps> = ({
  videoId,
  contentCreatorId,
  currentUser,
  initialLikes = 0,
  initialComments = 0,
  initialIsLiked = false,
  initialUserRating = 0,
  onCountsChange,
}) => {
  const [likes, setLikes] = React.useState<number>(initialLikes);
  const [isLiked, setIsLiked] = React.useState<boolean>(initialIsLiked);
  const [comments, setComments] = React.useState<number>(initialComments);
  const [showComments, setShowComments] = React.useState<boolean>(false);
  const [commentText, setCommentText] = React.useState<string>('');
  const [responseText, setResponseText] = React.useState<string>('');
  const [postingComment, setPostingComment] = React.useState<boolean>(false);
  const [postingResponse, setPostingResponse] = React.useState<boolean>(false);
  const [userRating, setUserRating] = React.useState<number>(initialUserRating);
  const [averageRating, setAverageRating] = React.useState<number>(0);
  const [loadingRating, setLoadingRating] = React.useState<boolean>(false);
  const [commentsList, setCommentsList] = React.useState<any[]>([]);
  const [responsesList, setResponsesList] = React.useState<any[]>([]);
  const [showAllComments, setShowAllComments] = React.useState<boolean>(false);
  const [showResponses, setShowResponses] = React.useState<boolean>(false);
  const [loadingComments, setLoadingComments] = React.useState<boolean>(false);
  const [loadingResponses, setLoadingResponses] = React.useState<boolean>(false);

  // Load persisted user rating and comment count on mount
  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // Load user rating
        if (currentUser?.id && videoId) {
          const r = await fetch(`/api/videos/${videoId}/rating?userId=${currentUser.id}`);
          if (!cancelled && r.ok) {
            const data = await r.json();
            if (data.success && typeof data.rating === 'number') {
              setUserRating(data.rating);
            }
          }
        }
        // Load comments
        await loadComments();
      } catch (error) {
        console.error('❌ Error loading interactions:', error);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [videoId, currentUser?.id]);

  const loadComments = async () => {
    try {
      const c = await fetch(`/api/videos/${videoId}/interactions?type=comment`);
      if (c.ok) {
        const data = await c.json();
        if (data.success) {
          setComments(data.count || 0);
          setCommentsList(data.interactions || []);
        }
      }
    } catch (error) {
      console.error('❌ Error loading comments:', error);
    }
  };

  const loadResponses = async () => {
    if (loadingResponses) return;
    setLoadingResponses(true);
    try {
      const r = await fetch(`/api/videos/${videoId}/interactions?type=response`);
      if (r.ok) {
        const data = await r.json();
        if (data.success) {
          setResponsesList(data.interactions || []);
        }
      }
    } catch (error) {
      console.error('❌ Error loading responses:', error);
    }
    setLoadingResponses(false);
  };

  const handleLike = async () => {
    if (!currentUser?.id) {
      console.warn('⚠️ Cannot like: No current user');
      return;
    }
    
    const nextLiked = !isLiked;
    console.log('👍 Handling like:', { videoId, userId: currentUser.id, nextLiked });
    
    // Optimistic UI update
    setIsLiked(nextLiked);
    setLikes((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));
    
    try {
      const res = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, isLiked: nextLiked }),
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Like response:', data);
        if (data.success) {
          setLikes(data.likes ?? likes);
          setIsLiked(!!data.isLiked);
          onCountsChange?.({ likes: data.likes });
        }
      } else {
        console.error('❌ Like request failed:', res.status, await res.text().catch(() => 'Unknown error'));
        // Revert on failure
        setIsLiked((prev) => !prev);
        setLikes((prev) => Math.max(0, prev + (nextLiked ? -1 : 1)));
      }
    } catch (error) {
      console.error('❌ Like request error:', error);
      // Revert on failure
      setIsLiked((prev) => !prev);
      setLikes((prev) => Math.max(0, prev + (nextLiked ? -1 : 1)));
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || postingComment) return;
    
    console.log('💬 Posting comment:', { videoId, userId: currentUser.id, content: commentText });
    setPostingComment(true);
    
    try {
      const res = await fetch(`/api/videos/${videoId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'comment',
          userId: currentUser.id,
          userName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email,
          userAvatar: currentUser.avatar || '/api/placeholder/40/40',
          content: commentText.trim(),
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Comment posted:', data);
        if (data.success) {
          setComments((p) => p + 1);
          setCommentText('');
          onCountsChange?.({ comments: comments + 1 });
          // Refresh comments list to show new comment
          await loadComments();
        }
      } else {
        console.error('❌ Comment post failed:', res.status, await res.text().catch(() => 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Comment post error:', error);
    }
    setPostingComment(false);
  };

  const handlePostResponse = async () => {
    if (!responseText.trim() || postingResponse) return;
    
    console.log('📝 Posting response:', { videoId, userId: currentUser.id, content: responseText });
    setPostingResponse(true);
    
    try {
      const res = await fetch(`/api/videos/${videoId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'response',
          userId: currentUser.id,
          userName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email,
          userAvatar: currentUser.avatar || '/api/placeholder/40/40',
          content: responseText.trim(),
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Response posted:', data);
        if (data.success) {
          setResponseText('');
          // Responses don't increment comment count since they're for grading
          // Refresh responses list to show new response
          await loadResponses();
        }
      } else {
        console.error('❌ Response post failed:', res.status, await res.text().catch(() => 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Response post error:', error);
    }
    setPostingResponse(false);
  };

  const handleRating = async (rating: number) => {
    if (!currentUser?.id) return;
    
    console.log('⭐ Rating video:', { videoId, userId: currentUser.id, rating });
    
    // Optimistic UI update of user stars
    const prev = userRating;
    setUserRating(rating);
    setLoadingRating(true);
    
    try {
      const res = await fetch(`/api/videos/${videoId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rating',
          userId: currentUser.id,
          userName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email,
          userAvatar: currentUser.avatar || '/api/placeholder/40/40',
          rating,
          contentCreatorId: contentCreatorId,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Rating posted:', data);
        if (data.success) {
          if (typeof data.averageRating === 'number') {
            setAverageRating(data.averageRating);
            onCountsChange?.({ userRating: rating, averageRating: data.averageRating });
          } else {
            onCountsChange?.({ userRating: rating });
          }
        } else {
          setUserRating(prev);
        }
      } else {
        console.error('❌ Rating post failed:', res.status, await res.text().catch(() => 'Unknown error'));
        setUserRating(prev);
      }
    } catch (error) {
      console.error('❌ Rating post error:', error);
      setUserRating(prev);
    }
    setLoadingRating(false);
  };

  return (
    <div className="flex items-center flex-wrap gap-4 text-gray-600">
      {/* Like */}
      <button onClick={handleLike} className={`flex items-center space-x-1.5 transition-colors py-2 ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
        <svg className="w-6 h-6" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span className="text-sm font-medium">{likes}</span>
      </button>

      {/* Comment */}
      <button onClick={() => setShowComments((s) => !s)} className="flex items-center space-x-1.5 hover:text-blue-500 transition-colors py-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="text-sm font-medium">{comments}</span>
      </button>

      {/* Respond (inline toggle) */}
      <details>
        <summary className="list-none cursor-pointer flex items-center space-x-1.5 hover:text-green-500 transition-colors py-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">Respond</span>
        </summary>
        <div className="mt-2">
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Write your response for grading..."
            rows={3}
            onChange={(e) => setResponseText(e.target.value)}
            value={responseText}
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={handlePostResponse}
              disabled={!responseText.trim() || postingResponse}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {postingResponse ? 'Submitting...' : 'Submit Response'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This response will be submitted for grading and assessment.
          </p>
        </div>
      </details>

      {/* Star Rating */}
      <div className="flex items-center space-x-0.5 border-l border-gray-300 pl-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} onClick={() => handleRating(star)} className="focus:outline-none" type="button" title={`Rate ${star} star${star > 1 ? 's' : ''}`} disabled={loadingRating}>
            <svg className={`w-5 h-5 transition-all ${star <= userRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
        {averageRating > 0 && (
          <span className="ml-1.5 text-xs text-gray-500">({averageRating.toFixed(1)})</span>
        )}
      </div>

      {/* View Responses Button */}
      <button 
        onClick={() => {
          setShowResponses(!showResponses);
          if (!showResponses) loadResponses();
        }} 
        className="flex items-center space-x-1.5 hover:text-purple-500 transition-colors py-2"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-sm font-medium">Responses ({responsesList.length})</span>
      </button>

      {/* Inline comments panel */}
      {showComments && (
        <div className="w-full mt-2">
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a casual comment..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
            />
            <button
              onClick={handlePostComment}
              disabled={!commentText.trim() || postingComment}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {postingComment ? 'Posting...' : 'Comment'}
            </button>
          </div>
          
          {/* Display Comments */}
          {commentsList.length > 0 && (
            <div className="space-y-2">
              {/* Show first 2 comments */}
              {commentsList.slice(0, showAllComments ? commentsList.length : 2).map((comment, index) => (
                <div key={comment.id || index} className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-400">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {comment.userName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{comment.userName}</span>
                        <span className="text-xs text-gray-500">
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Show more button */}
              {commentsList.length > 2 && (
                <button
                  onClick={() => setShowAllComments(!showAllComments)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {showAllComments ? 'Show Less' : `Show ${commentsList.length - 2} More Comments`}
                </button>
              )}
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-2">
            Comments are casual interactions and not graded.
          </p>
        </div>
      )}

      {/* Responses panel */}
      {showResponses && (
        <div className="w-full mt-2">
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <h4 className="text-sm font-semibold text-green-800 mb-2">Assignment Responses (For Grading)</h4>
            {loadingResponses ? (
              <p className="text-sm text-gray-500">Loading responses...</p>
            ) : responsesList.length > 0 ? (
              <div className="space-y-2">
                {responsesList.map((response, index) => (
                  <div key={response.id || index} className="bg-white rounded-lg p-3 border border-green-300">
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {response.userName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{response.userName}</span>
                          <span className="text-xs text-gray-500">
                            {response.createdAt ? new Date(response.createdAt).toLocaleDateString() : 'Recently'}
                          </span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            For Grading
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{response.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No responses yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractionBar;