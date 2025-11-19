'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { extractYouTubeVideoId as getYouTubeVideoId, getYouTubeEmbedUrl } from '@/lib/youtube';
import { GroupAssignmentModal } from '@/components/student/GroupAssignmentModal';
import InteractionBar from '@/components/student/InteractionBar';
import RichTextRenderer from '@/components/common/RichTextRenderer';
import { getVideoUrl } from '@/lib/videoUtils';

interface VideoSubmission {
  submissionId: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  studentAvatar?: string;
  videoUrl: string;
  videoTitle: string;
  submittedAt: string;
  likes?: number;
  commentCount?: number;
}

interface AssignmentDetails {
  assignmentId: string;
  title: string;
  description: string;
  dueDate: string;
  courseId: string;
  courseName?: string;
  courseInitials?: string;
  groupAssignment?: boolean;
  maxGroupSize?: number;
}

interface Group {
  groupId: string;
  groupName: string;
  joinCode: string;
  members: Array<{
    userId: string;
    firstName: string;
    lastName: string;
    role: 'leader' | 'member';
  }>;
  currentSize: number;
  maxSize: number;
  status: 'forming' | 'ready' | 'submitted';
}

const AssignmentFeedPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assignmentId = params?.assignmentId as string;

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [videos, setVideos] = useState<VideoSubmission[]>([]);
  const [myGroup, setMyGroup] = useState<Group | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentFeed();
    }
  }, [assignmentId]);

  const fetchAssignmentFeed = async () => {
    try {
      // Fetch assignment details
      const assignmentRes = await fetch(`/api/assignments/${assignmentId}`);
      const assignmentData = await assignmentRes.json();

      let groupData: any = null;

      if (assignmentData.success && assignmentData.assignment) {
        setAssignment(assignmentData.assignment);
        
        // If it's a group assignment, check if user has a group
        if (assignmentData.assignment.groupAssignment && user?.id) {
          const groupRes = await fetch(`/api/groups/my-group?assignmentId=${assignmentId}&userId=${user.id}`);
          groupData = await groupRes.json();
          
          if (groupData.success && groupData.hasGroup) {
            setMyGroup(groupData.group);
          }
        }
      }

      // Fetch video submissions for this assignment
      const videosRes = await fetch(`/api/video-submissions?assignmentId=${assignmentId}`);
      const videosData = await videosRes.json();

      if (videosData.success) {
        let submissions = videosData.submissions || [];
        
        // If it's a group assignment and user has a group, filter to show only group member videos
        if (assignmentData?.assignment?.groupAssignment && groupData?.hasGroup && groupData.group) {
          const groupMemberIds = groupData.group.memberIds || groupData.group.members.map((m: any) => m.userId);
          submissions = submissions.filter((sub: VideoSubmission) => 
            groupMemberIds.includes(sub.studentId)
          );
        }
        
        // Sort by most recent first
        const sorted = submissions.sort((a: VideoSubmission, b: VideoSubmission) => 
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
        setVideos(sorted);
      }
    } catch (error) {
      console.error('Error fetching assignment feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Top Bar */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>

            {/* Assignment Title */}
            <div className="flex-1 text-center">
              <h1 className="text-sm font-semibold text-gray-900 truncate">
                {assignment?.title || 'Assignment'}
              </h1>
              {assignment?.courseInitials && (
                <span className="text-xs text-gray-500">{assignment.courseInitials}</span>
              )}
            </div>

            {/* School Logo */}
            <div className="w-8 h-8 flex-shrink-0">
              <Image
                src="/logos/cristo-rey-atlanta.png"
                alt="Cristo Rey Atlanta"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

        </div>

        {/* Assignment Details & Recording Options */}
        <div className="max-w-2xl mx-auto">
          {assignment && (
            <div className="bg-white border-b border-gray-200">
              {/* Assignment Details */}
              <div className="px-4 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-2">{assignment.title}</h2>
                <RichTextRenderer 
                  content={assignment.description}
                  className="text-sm text-gray-700 mb-3"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    {assignment.dueDate && (
                      <div className="flex items-center space-x-1 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1 text-blue-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{videos.length} {videos.length === 1 ? 'submission' : 'submissions'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group Assignment Section */}
              {assignment.groupAssignment && (
                <div className="px-4 py-4 bg-purple-50 border-b border-purple-100">
                  <div className="flex items-center space-x-2 mb-3">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-purple-900">Group Assignment (max {assignment.maxGroupSize} students)</h3>
                  </div>

                  {myGroup ? (
                    <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{myGroup.groupName}</p>
                          <p className="text-xs text-gray-500">Code: <span className="font-mono font-bold text-purple-600">{myGroup.joinCode}</span></p>
                        </div>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                          {myGroup.currentSize}/{myGroup.maxSize}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {myGroup.members.map((member) => (
                          <div key={member.userId} className="flex items-center space-x-2 text-sm">
                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="8" />
                            </svg>
                            <span className="text-gray-700">
                              {member.firstName} {member.lastName}
                              {member.role === 'leader' && <span className="text-purple-600 ml-1">(Leader)</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                      {myGroup.currentSize < myGroup.maxSize && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                          Share code <span className="font-mono font-bold">{myGroup.joinCode}</span> with {myGroup.maxSize - myGroup.currentSize} more {myGroup.maxSize - myGroup.currentSize === 1 ? 'classmate' : 'classmates'}
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowGroupModal(true)}
                      className="w-full p-4 bg-white border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all"
                    >
                      <p className="font-medium text-gray-900 mb-1">Form or Join a Group</p>
                      <p className="text-xs text-gray-600">Required before submitting</p>
                    </button>
                  )}
                </div>
              )}

              {/* Recording Options */}
              <div className="px-4 py-4 bg-gradient-to-b from-blue-50 to-white">
                {assignment.groupAssignment ? (
                  <>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">📹 Submit Your Video</h3>
                    <p className="text-xs text-gray-600 mb-3">Each group member can submit their own video</p>
                  </>
                ) : (
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">📹 Submit Your Video</h3>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      if (assignment.groupAssignment && !myGroup) {
                        alert('Please form or join a group first');
                        return;
                      }
                      router.push(`/student/video-submission?assignmentId=${assignmentId}&mode=record${myGroup ? `&groupId=${myGroup.groupId}` : ''}`);
                    }}
                    className="flex flex-col items-center p-4 bg-white border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="8" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Record Now</span>
                    <span className="text-xs text-gray-500">Live recording</span>
                  </button>
                  <button
                    onClick={() => {
                      if (assignment.groupAssignment && !myGroup) {
                        alert('Please form or join a group first');
                        return;
                      }
                      router.push(`/student/video-submission?assignmentId=${assignmentId}&mode=upload${myGroup ? `&groupId=${myGroup.groupId}` : ''}`);
                    }}
                    className="flex flex-col items-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Upload File</span>
                    <span className="text-xs text-gray-500">Pre-recorded</span>
                  </button>
                </div>
                {assignment.groupAssignment && myGroup && (
                  <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-xs text-purple-700">
                      💡 Each member can submit a video. All videos will be visible to the group and instructor.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Student Submissions Header */}
          {!loading && videos.length > 0 && (
            <div className="bg-white border-b border-gray-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {assignment?.groupAssignment 
                  ? '🎬 Group Member Videos' 
                  : '🎬 Student Submissions'}
              </h3>
              {assignment?.groupAssignment && myGroup && (
                <p className="text-xs text-gray-500 mt-1">
                  Videos from your group: {myGroup.groupName}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Video Feed */}
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-8 px-4 bg-white">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-500">No submissions yet. Be the first to submit!</p>
            </div>
          ) : (
            <div className="space-y-0">
              {videos.map((video) => (
                <VideoSubmissionCard key={video.submissionId} video={video} formatTimestamp={formatTimestamp} currentUserId={user?.id} onDelete={fetchAssignmentFeed} />
              ))}
            </div>
          )}
        </div>

        {/* Group Modal */}
        {showGroupModal && assignment && (
          <GroupAssignmentModal
            assignmentId={assignmentId}
            assignmentTitle={assignment.title}
            maxGroupSize={assignment.maxGroupSize || 4}
            onClose={() => setShowGroupModal(false)}
            onGroupFormed={(group) => {
              setMyGroup(group);
              setShowGroupModal(false);
            }}
          />
        )}
      </div>
    </StudentRoute>
  );
};

// Video Submission Card Component
const VideoSubmissionCard: React.FC<{ video: VideoSubmission; formatTimestamp: (timestamp: string) => string; currentUserId?: string; onDelete?: () => void }> = ({ video, formatTimestamp, currentUserId, onDelete }) => {
  const [imageError, setImageError] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const videoId = getYouTubeVideoId(video.videoUrl);
  const isYouTube = !!videoId;
  
  // Check if avatar is emoji
  const isEmoji = video.studentAvatar && video.studentAvatar.length <= 4 && !video.studentAvatar.startsWith('http');
  const hasValidAvatar = video.studentAvatar && !video.studentAvatar.includes('placeholder') && !imageError;
  
  // Check if this is the current user's video
  const isMyVideo = currentUserId && video.studentId === currentUserId;
  
  console.log('🎬 Video card debug:', {
    videoId: video.submissionId,
    currentUserId,
    videoOwnerId: video.studentId,
    isMyVideo
  });

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/video-submissions/${video.submissionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setShowDeleteConfirm(false);
        onDelete?.(); // Refresh videos
      } else {
        alert('Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Error deleting video');
    }
  };

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {isEmoji ? (
              <span className="text-2xl">{video.studentAvatar}</span>
            ) : hasValidAvatar ? (
              <Image
                src={video.studentAvatar}
                alt={`${video.studentFirstName} ${video.studentLastName}`}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-gray-600 font-semibold text-sm">
                {video.studentFirstName[0]}{video.studentLastName[0]}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">
              {video.studentFirstName} {video.studentLastName}
            </p>
            <p className="text-xs text-gray-500">{formatTimestamp(video.submittedAt)}</p>
          </div>
        </div>
        {isMyVideo && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 hover:bg-red-50 rounded-full transition-colors"
            title="Delete video"
          >
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Video?</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player - Mobile Optimized */}
      <div className="relative w-full bg-black" style={{ aspectRatio: '16/9' }}>
        {isYouTube ? (
          <div className="relative w-full h-full">
            <Image
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt={video.videoTitle}
              width={1280}
              height={720}
              className="w-full h-full object-cover cursor-pointer"
              onClick={(e) => {
                const iframe = document.createElement('iframe');
                iframe.src = getYouTubeEmbedUrl(video.videoUrl) + '?autoplay=1';
                iframe.className = 'w-full h-full';
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframe.allowFullscreen = true;
                e.currentTarget.parentElement?.replaceChild(iframe, e.currentTarget);
              }}
              onError={(e) => {
                // Fallback to standard thumbnail if maxres doesn't exist
                e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              }}
            />
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <video
            src={getVideoUrl(video.videoUrl)}
            controls
            className="w-full h-full object-contain"
            playsInline
            preload="metadata"
          />
        )}
      </div>

      {/* Title & Interactions */}
      <div className="px-4 py-3">
        <p className="font-medium text-gray-900 mb-3">{video.videoTitle}</p>
        {currentUserId && (
          <InteractionBar
            videoId={video.submissionId}
            contentCreatorId={video.studentId}
            currentUser={{
              id: currentUserId,
              firstName: '',
              lastName: '',
              email: '',
              avatar: ''
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AssignmentFeedPage;

