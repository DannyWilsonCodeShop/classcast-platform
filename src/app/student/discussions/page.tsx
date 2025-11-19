'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { getVideoUrl } from '@/lib/videoUtils';

interface DiscussionPost {
  id: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  submittedAt: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  responseType: 'text' | 'video' | 'mixed';
  videoResponse?: {
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
    fileSize: number;
  };
  parentPostId?: string;
  threadLevel: number;
  replies?: DiscussionPost[];
  likes: number;
  isLiked: boolean;
}

interface DiscussionAssignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  courseId: string;
  courseName: string;
  discussionPrompt: string;
  responseGuidelines: string[];
  minResponsesRequired: number;
  maxResponsesAllowed: number;
  allowVideoResponses: boolean;
  allowThreadedDiscussions: boolean;
  maxThreadDepth: number;
  rubric: {
    contentQuality: { possible: number; description: string };
    engagement: { possible: number; description: string };
    criticalThinking: { possible: number; description: string };
    communication: { possible: number; description: string };
  };
}

const DiscussionContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [assignment, setAssignment] = useState<DiscussionAssignment | null>(null);
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [currentPost, setCurrentPost] = useState<DiscussionPost | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [replyToPost, setReplyToPost] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [responseType, setResponseType] = useState<'text' | 'video' | 'mixed'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  const assignmentId = searchParams.get('assignment');
  const courseId = searchParams.get('course');

  // Mock data - in production, this would come from API
  useEffect(() => {
    if (assignmentId && courseId) {
      // Mock assignment data
      const mockAssignment: DiscussionAssignment = {
        id: assignmentId,
        title: 'Ethics in AI Discussion',
        description: 'Engage in a threaded discussion about the ethical implications of artificial intelligence in modern society.',
        dueDate: '2024-02-25T23:59:59Z',
        courseId: courseId,
        courseName: 'Introduction to Computer Science',
        discussionPrompt: 'Consider the following scenario: A healthcare AI system is designed to prioritize patients for treatment based on their likelihood of survival. However, the algorithm shows bias against certain demographic groups. How should this be addressed? What are the ethical implications?',
        responseGuidelines: [
          'Respond to the initial prompt with your perspective',
          'Engage with at least 3 different classmates\' responses',
          'Build on others\' ideas and ask thoughtful questions',
          'Use video responses to explain complex concepts',
          'Maintain respectful dialogue throughout'
        ],
        minResponsesRequired: 5,
        maxResponsesAllowed: 10,
        allowVideoResponses: true,
        allowThreadedDiscussions: true,
        maxThreadDepth: 4,
        rubric: {
          contentQuality: { possible: 30, description: 'Depth of ethical analysis and understanding' },
          engagement: { possible: 25, description: 'Active participation in discussions' },
          criticalThinking: { possible: 30, description: 'Critical evaluation of different perspectives' },
          communication: { possible: 15, description: 'Clear and respectful communication' }
        }
      };

      // Mock discussion posts
      const mockPosts: DiscussionPost[] = [
        {
          id: 'post_1',
          authorId: 'student_1',
          authorName: 'Alex Johnson',
          authorEmail: 'alex.johnson@university.edu',
          content: 'I think the bias in healthcare AI is a critical issue that needs immediate attention. The algorithm should be retrained with more diverse data and regularly audited for fairness. We also need diverse teams developing these systems to catch potential biases early.',
          submittedAt: '2024-01-26T10:00:00Z',
          assignmentId: assignmentId,
          assignmentTitle: mockAssignment.title,
          courseId: courseId,
          courseName: mockAssignment.courseName,
          responseType: 'text',
          threadLevel: 0,
          likes: 8,
          isLiked: false,
          replies: [
            {
              id: 'post_1_reply_1',
              authorId: 'student_4',
              authorName: 'Emily Watson',
              authorEmail: 'emily.watson@university.edu',
              content: 'I agree about diverse teams, but how do we ensure the auditing process itself isn\'t biased? Who gets to decide what "fair" means in this context?',
              submittedAt: '2024-01-26T11:15:00Z',
              assignmentId: assignmentId,
              assignmentTitle: mockAssignment.title,
              courseId: courseId,
              courseName: mockAssignment.courseName,
              responseType: 'text',
              parentPostId: 'post_1',
              threadLevel: 1,
              likes: 5,
              isLiked: true,
              replies: [
                {
                  id: 'post_1_reply_1_reply_1',
                  authorId: 'current_student_id',
                  authorName: 'Current Student',
                  authorEmail: 'current.student@university.edu',
                  content: 'That\'s a great point! I think we need multiple stakeholders involved - patients, healthcare providers, ethicists, and community representatives. The definition of fairness should be co-created, not imposed.',
                  submittedAt: '2024-01-26T14:30:00Z',
                  assignmentId: assignmentId,
                  assignmentTitle: mockAssignment.title,
                  courseId: courseId,
                  courseName: mockAssignment.courseName,
                  responseType: 'text',
                  parentPostId: 'post_1_reply_1',
                  threadLevel: 2,
                  likes: 3,
                  isLiked: false
                }
              ]
            },
            {
              id: 'post_1_reply_2',
              authorId: 'student_2',
              authorName: 'Sarah Chen',
              authorEmail: 'sarah.chen@university.edu',
              content: 'I think we also need to consider the cost of retraining. What if the biased algorithm is already saving lives, even if imperfectly? Should we risk lives during the retraining period?',
              submittedAt: '2024-01-26T12:45:00Z',
              assignmentId: assignmentId,
              assignmentTitle: mockAssignment.title,
              courseId: courseId,
              courseName: mockAssignment.courseName,
              responseType: 'video',
              videoResponse: {
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
                duration: 180,
                fileSize: 20000000
              },
              parentPostId: 'post_1',
              threadLevel: 1,
              likes: 6,
              isLiked: false
            }
          ]
        },
        {
          id: 'post_2',
          authorId: 'student_3',
          authorName: 'Michael Rodriguez',
          authorEmail: 'michael.rodriguez@university.edu',
          content: 'I believe we need to fundamentally rethink how we approach AI in healthcare. Instead of trying to fix biased algorithms, we should design systems that are inherently fair from the ground up. This means using different data sources and algorithmic approaches.',
          submittedAt: '2024-01-26T15:20:00Z',
          assignmentId: assignmentId,
          assignmentTitle: mockAssignment.title,
          courseId: courseId,
          courseName: mockAssignment.courseName,
          responseType: 'mixed',
          videoResponse: {
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
            duration: 240,
            fileSize: 30000000
          },
          threadLevel: 0,
          likes: 12,
          isLiked: true,
          replies: []
        }
      ];

      setAssignment(mockAssignment);
      setPosts(mockPosts);
    }
  }, [assignmentId, courseId]);

  const handlePostSubmit = async () => {
    if (!newPostContent.trim() && !recordedVideo) return;

    setIsSubmitting(true);
    try {
      const newPost: DiscussionPost = {
        id: `post_${Date.now()}`,
        authorId: 'current_student_id',
        authorName: 'Current Student',
        authorEmail: 'current.student@university.edu',
        content: newPostContent,
        submittedAt: new Date().toISOString(),
        assignmentId: assignmentId!,
        assignmentTitle: assignment!.title,
        courseId: courseId!,
        courseName: assignment!.courseName,
        responseType: responseType,
        videoResponse: recordedVideo ? {
          videoUrl: recordedVideo,
          thumbnailUrl: '/thumbnails/recorded_video.jpg',
          duration: 120,
          fileSize: 15000000
        } : undefined,
        threadLevel: 0,
        likes: 0,
        isLiked: false,
        replies: []
      };

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPosts(prev => [newPost, ...prev]);
      setNewPostContent('');
      setRecordedVideo(null);
      setResponseType('text');
    } catch (error) {
      console.error('Error submitting post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentPostId: string) => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const parentPost = findPostById(posts, parentPostId);
      if (!parentPost) return;

      const newReply: DiscussionPost = {
        id: `reply_${Date.now()}`,
        authorId: 'current_student_id',
        authorName: 'Current Student',
        authorEmail: 'current.student@university.edu',
        content: replyContent,
        submittedAt: new Date().toISOString(),
        assignmentId: assignmentId!,
        assignmentTitle: assignment!.title,
        courseId: courseId!,
        courseName: assignment!.courseName,
        responseType: 'text',
        parentPostId: parentPostId,
        threadLevel: parentPost.threadLevel + 1,
        likes: 0,
        isLiked: false,
        replies: []
      };

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPosts(prev => addReplyToPost(prev, parentPostId, newReply));
      setReplyContent('');
      setReplyToPost(null);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const findPostById = (posts: DiscussionPost[], id: string): DiscussionPost | null => {
    for (const post of posts) {
      if (post.id === id) return post;
      if (post.replies) {
        const found = findPostById(post.replies, id);
        if (found) return found;
      }
    }
    return null;
  };

  const addReplyToPost = (posts: DiscussionPost[], parentId: string, newReply: DiscussionPost): DiscussionPost[] => {
    return posts.map(post => {
      if (post.id === parentId) {
        return {
          ...post,
          replies: [...(post.replies || []), newReply]
        };
      }
      if (post.replies) {
        return {
          ...post,
          replies: addReplyToPost(post.replies, parentId, newReply)
        };
      }
      return post;
    });
  };

  const toggleThreadExpansion = (postId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderPost = (post: DiscussionPost, level: number = 0) => {
    const isExpanded = expandedThreads.has(post.id);
    const hasReplies = post.replies && post.replies.length > 0;

    return (
      <div key={post.id} className={`${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
          <div className="flex items-start space-x-3">
            <div 
              className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
              onClick={() => post.authorId && router.push(`/student/profile/${post.authorId}`)}
            >
              {post.authorName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h4 
                  className="font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => post.authorId && router.push(`/student/profile/${post.authorId}`)}
                >
                  {post.authorName}
                </h4>
                <span className="text-sm text-gray-500">
                  {new Date(post.submittedAt).toLocaleDateString()}
                </span>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {post.responseType}
                </span>
              </div>
              
              <div className="text-gray-700 mb-3">
                {post.content}
              </div>

              {post.videoResponse && (
                <div className="mb-3">
                  <video
                    className="w-full max-w-md rounded-lg"
                    controls
                    poster={post.videoResponse.thumbnailUrl}
                  >
                    <source src={getVideoUrl(post.videoResponse.videoUrl)} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <p className="text-xs text-gray-500 mt-1">
                    Duration: {formatTime(post.videoResponse.duration)}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {/* Handle like */}}
                    className={`flex items-center space-x-1 text-sm ${
                      post.isLiked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                    }`}
                  >
                    <span>👍</span>
                    <span>{post.likes}</span>
                  </button>
                  
                  {assignment?.allowThreadedDiscussions && level < (assignment.maxThreadDepth || 3) && (
                    <button
                      onClick={() => setReplyToPost(replyToPost === post.id ? null : post.id)}
                      className="text-sm text-gray-500 hover:text-blue-600"
                    >
                      Reply
                    </button>
                  )}
                </div>

                {hasReplies && (
                  <button
                    onClick={() => toggleThreadExpansion(post.id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {isExpanded ? 'Hide' : 'Show'} {post.replies?.length} replies
                  </button>
                )}
              </div>

              {replyToPost === post.id && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write your reply..."
                    className="w-full h-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="flex items-center justify-end space-x-2 mt-2">
                    <button
                      onClick={() => setReplyToPost(null)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReplySubmit(post.id)}
                      disabled={!replyContent.trim() || isSubmitting}
                      className="px-4 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Posting...' : 'Reply'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {hasReplies && isExpanded && (
          <div className="ml-4">
            {post.replies?.map(reply => renderPost(reply, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading discussion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{assignment.title}</h1>
              <p className="text-gray-600">{assignment.courseName}</p>
            </div>
          </div>
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <Image
              src="/MyClassCast (800 x 200 px).png"
              alt="ClassCast"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Discussion Prompt */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-3">Discussion Prompt</h2>
          <p className="text-blue-700 mb-4">{assignment.discussionPrompt}</p>
          <div className="text-sm text-blue-600">
            <p><strong>Due:</strong> {new Date(assignment.dueDate).toLocaleDateString()}</p>
            <p><strong>Required Responses:</strong> {assignment.minResponsesRequired}</p>
          </div>
        </div>

        {/* Response Guidelines */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">Response Guidelines</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            {assignment.responseGuidelines.map((guideline, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>{guideline}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* New Post Form */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Your Response</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Response Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="text"
                  checked={responseType === 'text'}
                  onChange={(e) => setResponseType(e.target.value as 'text')}
                  className="mr-2"
                />
                Text
              </label>
              {assignment.allowVideoResponses && (
                <>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="video"
                      checked={responseType === 'video'}
                      onChange={(e) => setResponseType(e.target.value as 'video')}
                      className="mr-2"
                    />
                    Video
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="mixed"
                      checked={responseType === 'mixed'}
                      onChange={(e) => setResponseType(e.target.value as 'mixed')}
                      className="mr-2"
                    />
                    Text + Video
                  </label>
                </>
              )}
            </div>
          </div>

          {(responseType === 'text' || responseType === 'mixed') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Response
              </label>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Share your thoughts on the discussion prompt..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          )}

          {(responseType === 'video' || responseType === 'mixed') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Response
              </label>
              {recordedVideo ? (
                <div className="space-y-2">
                  <video
                    className="w-full max-w-md rounded-lg"
                    controls
                    src={getVideoUrl(recordedVideo)}
                  />
                  <button
                    onClick={() => setRecordedVideo(null)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove Video
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <button
                    onClick={() => {/* Handle video recording */}}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Record Video Response
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    Record a video to explain your perspective
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {newPostContent.length} characters
            </div>
            <button
              onClick={handlePostSubmit}
              disabled={(!newPostContent.trim() && !recordedVideo) || isSubmitting}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : 'Post Response'}
            </button>
          </div>
        </div>

        {/* Discussion Posts */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Discussion ({posts.length} posts)
          </h3>
          {posts.map(post => renderPost(post))}
        </div>
      </div>
    </div>
  );
};

const DiscussionPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading discussion...</p>
        </div>
      </div>
    }>
      <DiscussionContent />
    </Suspense>
  );
};

export default DiscussionPage;
