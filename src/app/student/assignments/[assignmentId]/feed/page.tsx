'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { extractYouTubeVideoId as getYouTubeVideoId, getYouTubeEmbedUrl } from '@/lib/youtube';
import { GroupAssignmentModal } from '@/components/student/GroupAssignmentModal';
import InteractionBar from '@/components/student/InteractionBar';
import RichTextRenderer from '@/components/common/RichTextRenderer';
import { getVideoUrl } from '@/lib/videoUtils';
import { StudentTabBar } from '@/components/student/StudentTabBar';

interface VideoSubmission {
  submissionId: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  studentName?: string;
  studentAvatar?: string;
  videoUrl: string;
  videoTitle: string;
  submittedAt: string;
  likes?: number;
  likedBy?: string[];
  commentCount?: number;
  stats?: {
    likes?: number;
    averageRating?: number;
  };
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
  const searchParams = useSearchParams();
  const assignmentId = params?.assignmentId as string;
  const highlightVideoId = searchParams.get('videoId');

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

      // Also fetch from the other submissions endpoint that has studentName
      let nameMap = new Map<string, string>();
      try {
        const namesRes = await fetch(`/api/assignments/${assignmentId}/submissions`);
        if (namesRes.ok) {
          const namesData = await namesRes.json();
          (namesData.submissions || []).forEach((s: any) => {
            if (s.studentId && s.studentName) nameMap.set(s.studentId, s.studentName);
          });
        }
      } catch {}

      if (videosData.success) {
        let submissions = videosData.submissions || [];
        
        // If it's a group assignment and user has a group, filter to show only group member videos
        if (assignmentData?.assignment?.groupAssignment && groupData?.hasGroup && groupData.group) {
          const groupMemberIds = groupData.group.memberIds || groupData.group.members.map((m: any) => m.userId);
          submissions = submissions.filter((sub: VideoSubmission) => 
            groupMemberIds.includes(sub.studentId)
          );
        }

        // Enrich submissions with student profile data (name, avatar)
        const uniqueStudentIds = [...new Set(submissions.map((s: any) => s.studentId).filter(Boolean))] as string[];
        const profileMap = new Map<string, { firstName: string; lastName: string; avatar: string }>();
        
        await Promise.all(uniqueStudentIds.map(async (sid) => {
          try {
            const pRes = await fetch(`/api/profile?userId=${sid}`, { credentials: 'include' });
            if (pRes.ok) {
              const pData = await pRes.json();
              const profile = pData.data || pData;
              if (profile) {
                profileMap.set(sid, {
                  firstName: profile.firstName || '',
                  lastName: profile.lastName || '',
                  avatar: profile.avatar || '',
                });
              }
            }
          } catch {}
        }));

        // Merge profile data into submissions
        submissions = submissions.map((sub: any) => {
          const profile = profileMap.get(sub.studentId);
          const fallbackName = nameMap.get(sub.studentId) || sub.studentName || '';
          // Split studentName if firstName/lastName are missing
          let firstName = (sub.studentFirstName && sub.studentFirstName.trim()) || profile?.firstName || '';
          let lastName = (sub.studentLastName && sub.studentLastName.trim()) || profile?.lastName || '';
          if (!firstName && !lastName && fallbackName) {
            const parts = fallbackName.trim().split(' ');
            firstName = parts[0] || '';
            lastName = parts.slice(1).join(' ') || '';
          }
          return {
            ...sub,
            studentName: fallbackName || `${firstName} ${lastName}`.trim(),
            studentFirstName: firstName,
            studentLastName: lastName,
            studentAvatar: (sub.studentAvatar && sub.studentAvatar.trim()) || profile?.avatar || '',
          };
        });
        
        // Sort by most recent first
        let sorted = submissions.sort((a: VideoSubmission, b: VideoSubmission) => 
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );

        // If a specific video was clicked, put it first
        if (highlightVideoId) {
          const idx = sorted.findIndex((v: VideoSubmission) => v.submissionId === highlightVideoId);
          if (idx > 0) {
            const [highlighted] = sorted.splice(idx, 1);
            sorted = [highlighted, ...sorted];
          }
        }

        setVideos(sorted);
      }
    } catch (error) {
      console.error('Error fetching assignment feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    const now = new Date();
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <StudentRoute>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&family=Oswald:wght@300;700&display=swap" rel="stylesheet" />
      <div className="h-full flex flex-col bg-gradient-to-br from-[#e8f4f8] via-white to-[#f0f9fc] overflow-hidden">
        {/* Top Bar */}
        <div className="shrink-0 sticky top-0 z-10 bg-white/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 pt-2 pb-1">
            <div className="flex items-center gap-1">
              <span style={{ fontFamily: "'Grand Hotel', cursive", color: '#005587' }} className="text-2xl">ClassCast</span>
              <img src="/UpdatedCCLogo.png" alt="" className="w-9 h-9 object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <img src="/CristoReyLogo.png" alt="" className="w-12 h-12 object-contain" />
            </div>
          </div>
          {assignment?.title && (
            <div className="px-4 pb-1.5">
              <h1 className="text-sm font-bold uppercase text-[#005587] truncate" style={{ fontFamily: "'Oswald', sans-serif" }}>
                Peer Videos — {assignment.title}
              </h1>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
        {/* Assignment Details & Recording Options */}
        <div>
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
            <div className="bg-gradient-to-r from-[#005587] to-[#0077aa] px-4 py-3">
              <h3 className="text-base font-bold text-white uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>
                {assignment?.groupAssignment 
                  ? '🎬 GROUP MEMBER VIDEOS' 
                  : '🎬 PEER VIDEOS'}
              </h3>
              {assignment?.groupAssignment && myGroup && (
                <p className="text-xs text-white/70 mt-1">
                  Videos from your group: {myGroup.groupName}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Video Feed */}
        <div>
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
              {videos.filter(v => v && v.submissionId).map((video) => (
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
        </div>{/* end scrollable */}

        {/* Bottom Nav */}
        <StudentTabBar />
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
          <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-[#FFC72C] flex items-center justify-center overflow-hidden flex-shrink-0">
            {isEmoji ? (
              <span className="text-2xl">{video.studentAvatar}</span>
            ) : hasValidAvatar ? (
              <img
                src={video.studentAvatar}
                alt={`${video.studentFirstName || ''} ${video.studentLastName || ''}`}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="w-full h-full bg-[#005587] flex items-center justify-center text-white font-bold text-sm">
                {(video.studentFirstName || video.studentName || 'S')[0]}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">
              {video.studentFirstName && video.studentLastName 
                ? `${video.studentFirstName} ${video.studentLastName}`
                : video.studentName || 'Student'}
            </p>
            <p className="text-xs text-gray-500">{video.submittedAt ? formatTimestamp(video.submittedAt) : ''}</p>
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
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt={video.videoTitle}
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
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
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
            onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 2; }}
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
            initialLikes={video.likes || video.stats?.likes || 0}
            initialIsLiked={Array.isArray(video.likedBy) && video.likedBy.includes(currentUserId)}
          />
        )}
      </div>
    </div>
  );
};

function AssignmentFeedPageWrapper() {
  return (
    <Suspense fallback={<StudentRoute><div className="h-full flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005587]" /></div></StudentRoute>}>
      <AssignmentFeedPage />
    </Suspense>
  );
}

export default AssignmentFeedPageWrapper;

