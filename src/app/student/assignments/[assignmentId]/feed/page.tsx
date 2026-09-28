'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { extractYouTubeVideoId as getYouTubeVideoId, getYouTubeEmbedUrl } from '@/lib/youtube';
import { GroupAssignmentModal } from '@/components/student/GroupAssignmentModal';
import InteractionBar from '@/components/student/InteractionBar';
import RichTextRenderer from '@/components/common/RichTextRenderer';
import { getVideoUrl } from '@/lib/videoUtils';
import { StudentTabBar } from '@/components/student/StudentTabBar';
import { useIsWideScreen } from '@/hooks/useIsWideScreen';

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
  assignmentType?: string;
  releaseScores?: boolean;
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
  const { isWide } = useIsWideScreen();
  const assignmentId = params?.assignmentId as string;
  const highlightVideoId = searchParams.get('videoId');

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [videos, setVideos] = useState<VideoSubmission[]>([]);
  const [myGroup, setMyGroup] = useState<Group | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentFeed();
    }
  }, [assignmentId]);

  // Track view when video is opened from dashboard (via videoId query param)
  useEffect(() => {
    if (highlightVideoId) {
      fetch(`/api/video-submissions/${highlightVideoId}/view`, { method: 'POST' }).catch(() => {});
    }
  }, [highlightVideoId]);

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

  const scoresLocked = assignment?.assignmentType === 'assessment' && (assignment as any)?.releaseScores === false;
  const visibleVideos = videos.filter(v => v && v.submissionId);

  return (
    <StudentRoute>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&family=Oswald:wght@300;700&display=swap" rel="stylesheet" />

      <div className="fixed inset-0 bg-black overflow-hidden">
        {/* Full-screen vertical snap reel scroller */}
        <div
          className="h-[100dvh] w-full overflow-y-auto snap-y snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
        >
          {loading ? (
            <div className="h-[100dvh] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
            </div>
          ) : scoresLocked ? (
            <ReelShell isWide={isWide} onInfo={() => setShowInfo(true)} title={assignment?.title}>
              <div className="text-center px-8">
                <svg className="w-14 h-14 mx-auto text-white/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-white/80 font-medium">Videos will be available after your instructor releases scores.</p>
              </div>
            </ReelShell>
          ) : visibleVideos.length === 0 ? (
            <ReelShell isWide={isWide} onInfo={() => setShowInfo(true)} title={assignment?.title}>
              <div className="text-center px-8">
                <svg className="w-14 h-14 mx-auto text-white/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-white/80 font-medium mb-4">No videos yet. Be the first to submit!</p>
                <button
                  onClick={() => setShowInfo(true)}
                  className="px-5 py-2.5 bg-white text-[#005587] rounded-full font-bold text-sm"
                >
                  Submit a video
                </button>
              </div>
            </ReelShell>
          ) : (
            visibleVideos.map((video) => (
              <VideoSubmissionCard
                key={video.submissionId}
                video={video}
                formatTimestamp={formatTimestamp}
                currentUserId={user?.id}
                onDelete={fetchAssignmentFeed}
                isWide={isWide}
                assignmentTitle={assignment?.title}
                onInfo={() => setShowInfo(true)}
              />
            ))
          )}
        </div>

        {/* ===== Info / Submit slide-up panel (assignment details + recording options) ===== */}
        {showInfo && assignment && (
          <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={() => setShowInfo(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <div
              className="relative bg-white rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{ animation: 'sheetUp 0.25s ease-out' }}
            >
              <div className="pt-2 pb-1 flex justify-center shrink-0">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
              <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-1">
                  <span style={{ fontFamily: "'Grand Hotel', cursive", color: '#005587' }} className="text-2xl">ClassCast</span>
                  <img src="/UpdatedCCLogo.png" alt="" className="w-5 h-5 object-contain" />
                </div>
                <button onClick={() => setShowInfo(false)} className="p-1 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                {/* Assignment Details */}
                <div className="px-4 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">{assignment.title}</h2>
                  <RichTextRenderer content={assignment.description} className="text-sm text-gray-700 mb-3" />
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
                <div className="px-4 py-4 bg-gradient-to-b from-blue-50 to-white" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
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
            </div>
          </div>
        )}

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

      {/* Bottom Nav */}
      <StudentTabBar />

      <style jsx global>{`@keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </StudentRoute>
  );
};

/* Reel-shaped shell for loading / empty / locked states so they still show the overlay header. */
const ReelShell: React.FC<{ isWide: boolean; onInfo: () => void; title?: string; children: React.ReactNode }> = ({ onInfo, title, children }) => (
  <div className="relative h-[100dvh] w-full flex items-center justify-center bg-black snap-start">
    <OverlayHeader title={title} onInfo={onInfo} />
    {children}
  </div>
);

/* Top overlay header shown on every reel. */
const OverlayHeader: React.FC<{ title?: string; onInfo: () => void }> = ({ title, onInfo }) => (
  <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
    <div className="bg-gradient-to-b from-black/60 via-black/25 to-transparent pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between px-4 pt-3 pb-6 pointer-events-auto">
        <div className="flex items-center gap-1 min-w-0">
          <span style={{ fontFamily: "'Grand Hotel', cursive" }} className="text-2xl text-white drop-shadow">ClassCast</span>
          <img src="/UpdatedCCLogo.png" alt="" className="w-5 h-5 object-contain" />
        </div>
        <button
          onClick={onInfo}
          className="pointer-events-auto flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white rounded-full pl-3 pr-3 py-1.5 border border-white/25"
          title="Assignment details & submit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-xs font-semibold">Details</span>
        </button>
      </div>
      {title && (
        <div className="px-4 -mt-4 pb-2 pointer-events-none">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/85 truncate drop-shadow" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Peer Videos — {title}
          </p>
        </div>
      )}
    </div>
  </div>
);

// Video Submission Card Component — full-screen Instagram-style reel
const VideoSubmissionCard: React.FC<{
  video: VideoSubmission;
  formatTimestamp: (timestamp: string) => string;
  currentUserId?: string;
  onDelete?: () => void;
  isWide: boolean;
  assignmentTitle?: string;
  onInfo: () => void;
}> = ({ video, formatTimestamp, currentUserId, onDelete, isWide, assignmentTitle, onInfo }) => {
  const [imageError, setImageError] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showReportModal, setShowReportModal] = React.useState(false);
  const [reportReason, setReportReason] = React.useState('');
  const [reportSubmitting, setReportSubmitting] = React.useState(false);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const videoId = getYouTubeVideoId(video.videoUrl);
  const isYouTube = !!videoId;
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if avatar is emoji
  const isEmoji = video.studentAvatar && video.studentAvatar.length <= 4 && !video.studentAvatar.startsWith('http');
  const hasValidAvatar = video.studentAvatar && !video.studentAvatar.includes('placeholder') && !imageError;

  // Check if this is the current user's video
  const isMyVideo = currentUserId && video.studentId === currentUserId;

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

  // On mobile use object-cover (fill screen, no black bars). On wide screens letterbox with contain.
  const videoFit = isWide ? 'object-contain' : 'object-cover';

  return (
    <div className="relative h-[100dvh] w-full bg-black snap-start overflow-hidden">
      {/* ===== Video layer (fills screen) — shrinks up when a bottom sheet is open ===== */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
        style={{ transform: panelOpen ? 'translateY(-18%) scale(0.62)' : 'none' }}
      >
        {isYouTube ? (
          <div className="relative w-full h-full max-w-3xl mx-auto">
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt={video.videoTitle}
              className={`w-full h-full ${videoFit} cursor-pointer`}
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
            ref={videoRef}
            src={getVideoUrl(video.videoUrl)}
            controls
            className={`w-full h-full ${videoFit}`}
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 2; }}
          />
        )}
      </div>

      {/* ===== Top overlay header ===== */}
      <OverlayHeader title={assignmentTitle} onInfo={onInfo} />

      {/* ===== Right-side action rail ===== */}
      <div className="absolute right-2 z-30 bottom-28 flex flex-col items-center">
        {currentUserId && (
          <InteractionBar
            layout="overlay"
            onPanelChange={setPanelOpen}
            videoId={video.submissionId}
            contentCreatorId={video.studentId}
            currentUser={{ id: currentUserId, firstName: '', lastName: '', email: '', avatar: '' }}
            initialLikes={video.likes || video.stats?.likes || 0}
            initialIsLiked={Array.isArray(video.likedBy) && video.likedBy.includes(currentUserId)}
          />
        )}
      </div>

      {/* ===== Bottom overlay: author + title + delete/report ===== */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <div className="bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-16 pb-24 px-4">
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center space-x-3 min-w-0">
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
              <div className="min-w-0">
                <p className="font-semibold text-sm text-white drop-shadow truncate">
                  {video.studentFirstName && video.studentLastName
                    ? `${video.studentFirstName} ${video.studentLastName}`
                    : video.studentName || 'Student'}
                </p>
                <p className="text-xs text-white/70">{video.submittedAt ? formatTimestamp(video.submittedAt) : ''}</p>
              </div>
            </div>
            {isMyVideo ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 bg-black/30 hover:bg-red-500/40 rounded-full transition-colors backdrop-blur-sm"
                title="Delete video"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => setShowReportModal(true)}
                className="p-2 bg-black/30 hover:bg-orange-500/40 rounded-full transition-colors backdrop-blur-sm"
                title="Report content"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </button>
            )}
          </div>
          {video.videoTitle && (
            <p className="mt-2 text-sm text-white/95 drop-shadow pointer-events-auto line-clamp-2">{video.videoTitle}</p>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
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

      {/* Report Content Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] px-4">
          <div className="bg-white rounded-2xl p-5 max-w-[340px] w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-3">Report Content</h3>
            <p className="text-xs text-gray-500 mb-3">Your report is anonymous. Select a reason:</p>

            <div className="space-y-2 mb-4">
              {['Inappropriate content', 'Bullying or harassment', 'Safety concern', 'Spam or off-topic', 'Other'].map(reason => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                    reportReason === reason
                      ? 'bg-[#005587] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => { setShowReportModal(false); setReportReason(''); }}
                className="flex-1 py-2 text-sm text-gray-500 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!reportReason) return;
                  setReportSubmitting(true);
                  try {
                    await fetch('/api/moderation/flag', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        contentId: video.submissionId,
                        contentType: 'submission',
                        content: video.videoTitle || 'Video submission',
                        authorId: video.studentId,
                        authorName: video.studentName || 'Student',
                        flagReason: reportReason,
                        severity: reportReason === 'Safety concern' ? 'high' : reportReason === 'Bullying or harassment' ? 'high' : 'medium',
                        categories: [reportReason.toLowerCase().replace(/ /g, '-')],
                        isAnonymous: true,
                      })
                    });
                    setShowReportModal(false);
                    setReportReason('');
                    alert('Report submitted anonymously. Thank you.');
                  } catch (err) {
                    alert('Failed to submit report. Please try again.');
                  }
                  setReportSubmitting(false);
                }}
                disabled={!reportReason || reportSubmitting}
                className="flex-1 py-2 bg-[#005587] text-white rounded-full text-sm font-bold disabled:opacity-50"
              >
                {reportSubmitting ? 'Sending...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function AssignmentFeedPageWrapper() {
  return (
    <Suspense fallback={<StudentRoute><div className="h-full flex items-center justify-center bg-black"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" /></div></StudentRoute>}>
      <AssignmentFeedPage />
    </Suspense>
  );
}

export default AssignmentFeedPageWrapper;
