'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { getVideoUrl } from '@/lib/videoUtils';
import { getAssignmentColor, getAssignmentTitleColor } from '@/lib/assignmentColors';
import ModalTransition from '@/components/transitions/ModalTransition';
import { LiquidGlassIndicator } from '@/components/student/LiquidGlassIndicator';
import { useLiquidGlass } from '@/hooks/useLiquidGlass';
import { computeCommitDecision, computeTranslation, checkDirectionLock, computeRubberBand } from '@/hooks/useSwipeNavigation';
import { StudentHeader } from '@/components/student/StudentHeader';
import { ChoiceBoard } from '@/components/student/ChoiceBoard';

interface Assignment {
  assignmentId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  maxScore?: number;
  status: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  instructor: string;
  instructionalVideoUrl?: string;
  resources?: any[];
  isSubmitted: boolean;
  grade?: number;
  assignmentType?: string;
  assessmentQuestions?: any[];
  maxAttempts?: number;
}

interface Submission {
  submissionId: string;
  videoUrl?: string;
  youtubeUrl?: string;
  googleDriveUrl?: string;
  thumbnailUrl?: string;
  grade?: number;
  gradedAt?: string;
  submittedAt: string;
  status: string;
}

function getDueBadge(dueDate: string, isSubmitted?: boolean) {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due.getTime() - now.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (isSubmitted) return { label: '✓ Submitted', color: 'bg-green-500 text-white' };
  if (diff <= 0) return { label: 'Overdue', color: 'bg-red-500 text-white' };
  if (hours <= 48) return { label: 'Due Soon', color: 'bg-orange-400 text-white' };
  return { label: new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: 'bg-gray-200 text-gray-700' };
}

function VideoPlayer({ url, poster }: { url: string; poster?: string }) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = '';
    if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split(/[?&]/)[0] || '';
    else { try { videoId = new URL(url).searchParams.get('v') || ''; } catch { videoId = ''; } }
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  if (url.includes('drive.google')) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const fileId = match?.[1] || '';
    return (
      <iframe
        src={`https://drive.google.com/file/d/${fileId}/preview`}
        className="w-full h-full"
        allow="autoplay"
        allowFullScreen
      />
    );
  }
  return (
    <video
      src={getVideoUrl(url)}
      className="w-full h-full object-cover"
      controls
      playsInline
      preload="metadata"
      poster={poster || undefined}
      onLoadedMetadata={(e) => {
        // If no poster, seek to 2 seconds to generate a preview frame
        if (!poster) {
          const video = e.target as HTMLVideoElement;
          video.currentTime = 2;
        }
      }}
    />
  );
}

export default function StudentAssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showRubricModal, setShowRubricModal] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [postLinkUrl, setPostLinkUrl] = useState('');
  const [postLinkSubmitting, setPostLinkSubmitting] = useState(false);
  const [postError, setPostError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const uploadFileRef = React.useRef<HTMLInputElement>(null);
  const [allAssignmentIds, setAllAssignmentIds] = useState<string[]>([]);
  const [peerResponseCount, setPeerResponseCount] = useState(0);
  const [currentAssignmentId, setCurrentAssignmentId] = useState(assignmentId);
  const [isTitleTransitioning, setIsTitleTransitioning] = useState(false);

  // Liquid glass indicator for detail page nav
  const { indicatorRef, animateToTab } = useLiquidGlass();
  const [detailActiveIdx] = useState(1); // Default: Status (index 1)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Keep currentAssignmentId in sync if params change externally (e.g. browser nav)
  useEffect(() => { setCurrentAssignmentId(assignmentId); }, [assignmentId]);

  // Swipe navigation refs
  const swipeContainerRef = useRef<HTMLDivElement | null>(null);
  const gestureRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    currentX: 0,
    locked: false,
    isHorizontal: null as boolean | null,
    active: false,
    direction: null as 'left' | 'right' | null,
  });

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [assignRes, subRes] = await Promise.all([
        fetch(`/api/student/assignments?userId=${user.id}&t=${Date.now()}`, { credentials: 'include', cache: 'no-store' }),
        fetch(`/api/assignments/${currentAssignmentId}/submissions?studentId=${user.id}&t=${Date.now()}`, { credentials: 'include', cache: 'no-store' }),
      ]);

      if (assignRes.ok) {
        const data = await assignRes.json();
        const allAssignments = data.assignments || [];
        // Store all IDs for prev/next navigation
        setAllAssignmentIds(allAssignments.map((a: any) => a.assignmentId || a.id));
        const found = allAssignments.find((a: any) => a.assignmentId === currentAssignmentId);
        if (found) setAssignment(found);
        else {
          // Try direct API
          const directRes = await fetch(`/api/assignments/${currentAssignmentId}?t=${Date.now()}`, { credentials: 'include', cache: 'no-store' });
          if (directRes.ok) {
            const directData = await directRes.json();
            if (directData.success && directData.data?.assignment) setAssignment(directData.data.assignment);
            else setError(true);
          } else setError(true);
        }
      } else setError(true);

      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.success && subData.submissions?.length > 0) {
          setAllSubmissions(subData.submissions);
          // Set primary submission (most recent submitted/graded one)
          const validSub = subData.submissions.find((s: Submission) => s.status === 'submitted' || s.status === 'graded');
          setSubmission(validSub || null);
        } else {
          setAllSubmissions([]);
          setSubmission(null);
        }
      }
    } catch { setError(true); } 
    finally { setLoading(false); }
  }, [currentAssignmentId, user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch peer response count for this user on this assignment
  useEffect(() => {
    if (!user?.id || !currentAssignmentId || !submission) return;
    fetch(`/api/videos/${currentAssignmentId}/interactions?type=response`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.interactions) {
          const myResponses = data.interactions.filter((i: any) => i.userId === user.id);
          setPeerResponseCount(myResponses.length);
        }
      })
      .catch(() => {});
  }, [user?.id, currentAssignmentId, submission]);

  // Swipe navigation between assignments
  useEffect(() => {
    const container = swipeContainerRef.current;
    if (!container || allAssignmentIds.length <= 1) return;

    const currentIdx = allAssignmentIds.indexOf(currentAssignmentId);
    if (currentIdx === -1) return;

    const prevId = currentIdx > 0 ? allAssignmentIds[currentIdx - 1] : null;
    const nextId = currentIdx < allAssignmentIds.length - 1 ? allAssignmentIds[currentIdx + 1] : null;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const startX = touch.clientX;
      const screenWidth = window.innerWidth;

      // Edge zone exclusion (20px)
      if (startX < 20 || startX > screenWidth - 20) return;
      if (e.defaultPrevented) return;

      // Check if target is horizontally scrollable
      let el = e.target as HTMLElement | null;
      while (el && el !== container) {
        if (el.scrollWidth > el.clientWidth) {
          const overflow = getComputedStyle(el).overflowX;
          if (overflow === 'auto' || overflow === 'scroll') return;
        }
        el = el.parentElement;
      }

      gestureRef.current = {
        startX,
        startY: touch.clientY,
        startTime: Date.now(),
        currentX: startX,
        locked: false,
        isHorizontal: null,
        active: true,
        direction: null,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      const gesture = gestureRef.current;
      if (!gesture.active) return;

      const touch = e.touches[0];
      const dx = touch.clientX - gesture.startX;
      const dy = touch.clientY - gesture.startY;

      // Direction lock check
      if (!gesture.locked) {
        const lockResult = checkDirectionLock(dx, dy);
        if (lockResult === 'undecided') return;

        gesture.locked = true;
        gesture.isHorizontal = lockResult === 'horizontal';

        if (!gesture.isHorizontal) {
          gesture.active = false;
          return;
        }
      }

      if (!gesture.isHorizontal) return;

      // Determine direction: negative dx = swipe left (next), positive = swipe right (prev)
      const direction: 'left' | 'right' = dx < 0 ? 'left' : 'right';
      const hasTarget = direction === 'left' ? !!nextId : !!prevId;
      gesture.direction = direction;

      // Prevent vertical scroll while swiping horizontally
      e.preventDefault();

      gesture.currentX = touch.clientX;

      const screenWidth = window.innerWidth;
      let translation: number;

      if (!hasTarget) {
        // At boundary — rubber-band effect
        translation = computeRubberBand(dx, screenWidth);
      } else {
        translation = computeTranslation(dx, screenWidth);
      }

      // Apply translation to content area only
      container.style.transform = `translateX(${translation}px)`;
    };

    const handleTouchEnd = () => {
      const gesture = gestureRef.current;
      if (!gesture.active || !gesture.isHorizontal) {
        gestureRef.current = { startX: 0, startY: 0, startTime: 0, currentX: 0, locked: false, isHorizontal: null, active: false, direction: null };
        return;
      }

      const displacement = gesture.currentX - gesture.startX;
      const elapsed = Date.now() - gesture.startTime;
      const velocity = elapsed > 0 ? Math.abs(displacement) / (elapsed / 1000) : 0;

      const direction: 'left' | 'right' = displacement < 0 ? 'left' : 'right';
      const targetId = direction === 'left' ? nextId : prevId;

      const decision = computeCommitDecision(displacement, velocity);

      if (decision === 'commit' && targetId) {
        const screenWidth = window.innerWidth;
        const exitX = direction === 'left' ? -screenWidth : screenWidth;

        // Animate content off-screen
        container.style.transition = 'transform 250ms cubic-bezier(0.2, 0.9, 0.3, 1)';
        container.style.transform = `translateX(${exitX}px)`;

        // Start title dissolve
        setIsTitleTransitioning(true);

        setTimeout(() => {
          // Update URL without full navigation
          window.history.replaceState(null, '', `/student/assignments/${targetId}`);

          // Update state to trigger data refetch
          setCurrentAssignmentId(targetId);

          // Reset content position (slides in from opposite side)
          container.style.transition = 'none';
          container.style.transform = `translateX(${-exitX}px)`;

          // Force reflow, then animate to center
          void container.offsetWidth;
          container.style.transition = 'transform 250ms cubic-bezier(0.2, 0.9, 0.3, 1)';
          container.style.transform = 'translateX(0)';

          setTimeout(() => {
            container.style.transition = '';
            setIsTitleTransitioning(false);
          }, 250);
        }, 250);
      } else {
        // Cancel: snap back
        container.style.transition = 'transform 200ms cubic-bezier(0.2, 0.9, 0.3, 1)';
        container.style.transform = 'translateX(0)';

        setTimeout(() => {
          container.style.transition = '';
        }, 200);
      }

      gestureRef.current = { startX: 0, startY: 0, startTime: 0, currentX: 0, locked: false, isHorizontal: null, active: false, direction: null };
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [allAssignmentIds, currentAssignmentId]);

  const handleDelete = async () => {
    if (!submission?.submissionId || !confirm('Delete your submission? This cannot be undone.')) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/delete-submission', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ submissionId: submission.submissionId }),
      });
      if (res.ok) setSubmission(null);
      else alert('Failed to delete.');
    } catch { alert('Error deleting.'); }
    finally { setIsDeleting(false); }
  };

  const dueBadge = useMemo(() => assignment ? getDueBadge(assignment.dueDate, !!submission) : null, [assignment?.dueDate, submission]);
  const isGraded = submission?.grade !== undefined && submission?.grade !== null;
  const isSubmitted = !!submission;
  const resourceCount = (assignment?.resources || []).length;

  // Assessment attempt tracking
  const maxAttempts = (assignment as any)?.maxAttempts || 1;
  const validSubmissionCount = allSubmissions.filter(s => s.status === 'submitted' || s.status === 'graded').length;
  const attemptsRemaining = Math.max(0, maxAttempts - validSubmissionCount);
  const hasInvalidatedSubmission = allSubmissions.some(s => s.status === 'invalidated');

  if (loading) {
    return (
      <StudentRoute>
        <div className="h-full flex flex-col bg-[#faf9f7] overflow-hidden">
          {/* Header skeleton */}
          <div className="flex items-center px-3 py-2 border-b border-gray-100 shrink-0 bg-gray-100">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="flex-1 mx-3">
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Video area skeleton */}
          <div className="w-full shrink-0 bg-gray-200 animate-pulse" style={{ height: '42%', minHeight: '180px' }}>
            <div className="h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Info row skeleton */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 shrink-0">
            <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Instructions skeleton */}
          <div className="flex-1 px-4 py-3">
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-5/6 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-4/6 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>

          {/* Bottom nav skeleton */}
          <div className="shrink-0 h-[80px]" />
          <div className="fixed bottom-4 left-4 right-4 z-40 px-2 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.25)' }}>
            <div className="flex items-center justify-around">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 bg-gray-200/50 rounded animate-pulse" />
                  <div className="w-8 h-2 bg-gray-200/50 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </StudentRoute>
    );
  }

  if (error || !assignment) {
    return (
      <StudentRoute>
        <div className="h-full flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Assignment Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">This assignment may have been removed or you don&apos;t have access.</p>
          <button onClick={() => router.push('/student/assignments')} className="px-5 py-2 bg-[#005587] text-white rounded-full text-sm font-medium">
            Back to Assignments
          </button>
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&family=Oswald:wght@300;700;400&display=swap" rel="stylesheet" />

      <div className="h-full flex flex-col bg-[#faf9f7] overflow-hidden">
      {/* ClassCast branded header */}
      <StudentHeader />

      {/* Colored assignment header — stays pinned during swipe */}
      <div
        className="flex items-center px-3 py-2 border-b border-gray-100 z-10 shrink-0"
        style={{
          backgroundColor: getAssignmentColor(currentAssignmentId),
          transition: 'background-color 300ms ease-out',
        }}
      >
        {(() => {
          const currentIdx = allAssignmentIds.indexOf(currentAssignmentId);
          const prevId = currentIdx > 0 ? allAssignmentIds[currentIdx - 1] : null;
          const nextId = currentIdx < allAssignmentIds.length - 1 ? allAssignmentIds[currentIdx + 1] : null;
          return (
            <>
              <button onClick={() => prevId && setCurrentAssignmentId(prevId)} className={`p-1.5 -ml-1 ${prevId ? '' : 'opacity-30 pointer-events-none'}`} style={{ color: getAssignmentTitleColor(currentAssignmentId) }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1
                className="flex-1 text-base font-semibold mx-2 break-words leading-tight text-stone-900"
                style={{
                  opacity: isTitleTransitioning ? 0 : 1,
                  transition: 'opacity 200ms ease-out',
                }}
              >
                {assignment.title}
              </h1>
              <button onClick={() => nextId && setCurrentAssignmentId(nextId)} className={`p-1.5 ${nextId ? '' : 'opacity-30 pointer-events-none'}`} style={{ color: getAssignmentTitleColor(currentAssignmentId) }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          );
        })()}
      </div>

      {/* Swipeable content area */}
      <div ref={swipeContainerRef} className="flex-1 flex flex-col overflow-hidden" style={{ touchAction: 'pan-y' }}>

        {/* Video Area - Show student's submission if exists, otherwise instructional video */}
        {isSubmitted && (submission?.videoUrl || submission?.youtubeUrl || submission?.googleDriveUrl) ? (
          <div className="relative w-full shrink-0" style={{ height: '42%', minHeight: '180px' }}>
            <VideoPlayer url={submission.videoUrl || submission.youtubeUrl || submission.googleDriveUrl || ''} poster={(submission as any).thumbnailUrl || undefined} />
            {/* Your Video label */}
            <div className="absolute top-2 left-2 bg-green-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              ✓ Your Video
            </div>
            {/* Delete button */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-700 text-white w-10 h-10 rounded-full shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center"
            >
              {isDeleting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              )}
            </button>
          </div>
        ) : assignment.instructionalVideoUrl ? (
          <div className="relative w-full shrink-0" style={{ height: '42%', minHeight: '180px' }}>
            <VideoPlayer url={assignment.instructionalVideoUrl} />
          </div>
        ) : null}

        {/* Info Row */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 shrink-0">
          {dueBadge && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${dueBadge.color}`}>
              {dueBadge.label}
            </span>
          )}
          <span className="text-xs text-gray-500">{assignment.points || assignment.maxScore || 100} pts</span>
          {isGraded && (
            <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
              {submission!.grade}/{assignment.points || assignment.maxScore || 100}
            </span>
          )}
          {isSubmitted && !isGraded && (
            <span className="ml-auto text-xs text-[#005587] font-medium">✓ Submitted</span>
          )}
        </div>

        {/* Peer Review Status - only show after submission and if peer responses enabled */}
        {isSubmitted && (assignment as any).enablePeerResponses && (
          <div className="px-4 py-2 bg-blue-50 border-y border-blue-100 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className={`w-4 h-4 ${peerResponseCount >= ((assignment as any).minResponsesRequired || 0) ? 'text-green-600' : 'text-orange-500'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs font-medium text-gray-700">
                  Peer Reviews: <span className={peerResponseCount >= ((assignment as any).minResponsesRequired || 0) ? 'text-green-600' : 'text-orange-600'}>{peerResponseCount}/{(assignment as any).minResponsesRequired || 0}</span>
                </span>
              </div>
              {peerResponseCount >= ((assignment as any).minResponsesRequired || 0) ? (
                <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">✓ Complete</span>
              ) : (
                <button onClick={() => router.push(`/student/assignments/${currentAssignmentId}/feed`)} className="text-[10px] font-bold text-[#005587] bg-blue-100 px-2 py-0.5 rounded-full active:scale-95">
                  Review Peers →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Instructions or Choice Board */}
        <div className="flex-1 overflow-y-auto px-4 py-3 bg-white min-h-0">
          {(assignment as any).assignmentType === 'choice-board' && (assignment as any).choices?.length > 0 ? (
            <ChoiceBoard
              assignmentId={currentAssignmentId}
              choices={(assignment as any).choices}
              sectionId={(assignment as any).sectionId}
              assignmentDescription={assignment.description}
              assignmentTitle={assignment.title}
              dueDate={assignment.dueDate}
              maxScore={(assignment as any).maxScore}
            />
          ) : (
            <>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-normal mb-2">Instructions</h3>
              {assignment.description ? (
                <div 
                  className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: assignment.description.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }}
                />
              ) : (
                <p className="text-sm text-gray-400 italic">No instructions provided.</p>
              )}
            </>
          )}
        </div>

        {/* Bottom Nav */}
        <div className="shrink-0 h-[80px] native-bottom-nav" />
      </div>

      {mounted && createPortal(
        <nav className="fixed bottom-4 left-4 right-4 z-40 px-2 py-2 rounded-2xl native-bottom-nav" style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px) saturate(150%)', WebkitBackdropFilter: 'blur(12px) saturate(150%)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          {!isSubmitted && (
            <div className="relative flex items-center">
              <LiquidGlassIndicator activeIndex={detailActiveIdx} indicatorRef={indicatorRef} />
              <button onClick={() => router.push('/student/dashboard')} className="flex flex-col items-center w-1/5 py-1 z-10"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg><span className="text-[9px] text-gray-400">Home</span></button>
              <div className="flex flex-col items-center w-1/5 py-1 z-10">
                <span className="text-[9px] font-medium text-orange-600">
                  {assignment?.assignmentType === 'assessment' 
                    ? (hasInvalidatedSubmission && attemptsRemaining > 0
                        ? <span className="text-red-600">Invalidated</span>
                        : attemptsRemaining <= 0
                          ? <span className="text-red-600">No attempts left</span>
                          : `${attemptsRemaining} attempt${attemptsRemaining > 1 ? 's' : ''} left`)
                    : 'Unsubmitted'}
                </span>
                {dueBadge && <span className={`text-[8px] mt-0.5 ${dueBadge.color} px-1.5 py-0.5 rounded-full`}>{dueBadge.label}</span>}
              </div>
              <button onClick={() => {
                if (assignment?.assignmentType === 'assessment') {
                  // Check attempts before navigating
                  if (attemptsRemaining <= 0) {
                    alert('No attempts remaining');
                    return;
                  }
                  // For assessments, go directly to the assessment recording
                  router.push(`/student/record?assignmentId=${currentAssignmentId}&mode=record&assessment=true`);
                } else {
                  animateToTab(2); setTimeout(() => setShowPostModal(true), 450);
                }
              }} className="flex flex-col items-center w-1/5 py-1 z-10">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <span className="text-[9px] text-gray-400">{assignment?.assignmentType === 'assessment' ? 'Take Test' : 'Post'}</span>
              </button>
              <button onClick={() => { animateToTab(3); setTimeout(() => setShowRubricModal(true), 450); }} className="flex flex-col items-center w-1/5 py-1 z-10"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg><span className="text-[9px] text-gray-400">Rubric</span></button>
              <button className="flex flex-col items-center w-1/5 py-1 relative z-10" onClick={() => { if (resourceCount > 0) { animateToTab(4); setTimeout(() => setShowResourcesModal(true), 450); } }}><svg className={`w-6 h-6 ${resourceCount > 0 ? 'text-gray-400' : 'text-gray-200'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>{resourceCount > 0 && <span className="absolute -top-1 right-0 w-4 h-4 bg-[#005587] rounded-full text-[8px] text-white flex items-center justify-center font-bold">{resourceCount}</span>}<span className={`text-[9px] ${resourceCount > 0 ? 'text-gray-400' : 'text-gray-200'}`}>Resources</span></button>
            </div>
          )}

          {isSubmitted && !isGraded && (
            <div className="relative flex items-center">
              <LiquidGlassIndicator activeIndex={detailActiveIdx} indicatorRef={indicatorRef} />
              <button onClick={() => router.push('/student/dashboard')} className="flex flex-col items-center w-1/5 py-1 z-10"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg><span className="text-[9px] text-gray-400">Home</span></button>
              <div className="flex flex-col items-center w-1/5 py-1 z-10"><span className="text-[9px] font-bold text-green-600">✓ Submitted!</span></div>
              <button onClick={() => router.push(`/student/assignments/${currentAssignmentId}/feed`)} className="flex flex-col items-center w-1/5 py-1 z-10">
                <svg className="w-6 h-6 text-[#005587]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-[9px] text-[#005587]">Peers</span>
              </button>
              <button onClick={() => { animateToTab(3); setTimeout(() => setShowRubricModal(true), 450); }} className="flex flex-col items-center w-1/5 py-1 z-10"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg><span className="text-[9px] text-gray-400">Rubric</span></button>
              <button className="flex flex-col items-center w-1/5 py-1 relative z-10" onClick={() => { if (resourceCount > 0) { animateToTab(4); setTimeout(() => setShowResourcesModal(true), 450); } }}><svg className={`w-6 h-6 ${resourceCount > 0 ? 'text-gray-400' : 'text-gray-200'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>{resourceCount > 0 && <span className="absolute -top-1 right-0 w-4 h-4 bg-[#005587] rounded-full text-[8px] text-white flex items-center justify-center font-bold">{resourceCount}</span>}<span className={`text-[9px] ${resourceCount > 0 ? 'text-gray-400' : 'text-gray-200'}`}>Resources</span></button>
            </div>
          )}

          {isGraded && (
            <div className="relative flex items-center">
              <LiquidGlassIndicator activeIndex={detailActiveIdx} indicatorRef={indicatorRef} />
              <button onClick={() => router.push('/student/dashboard')} className="flex flex-col items-center w-1/5 py-1 z-10"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg><span className="text-[9px] text-gray-400">Home</span></button>
              <div className="flex flex-col items-center w-1/5 py-1 z-10"><span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">{submission!.grade}/{assignment.points || assignment.maxScore || 100}</span><span className="text-[8px] text-gray-400 mt-0.5">Grade</span></div>
              <button onClick={() => router.push(`/student/assignments/${currentAssignmentId}/feed`)} className="flex flex-col items-center w-1/5 py-1 z-10">
                <svg className="w-6 h-6 text-[#005587]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-[9px] text-[#005587]">Peers</span>
              </button>
              <button onClick={() => { animateToTab(3); setTimeout(() => setShowRubricModal(true), 450); }} className="flex flex-col items-center w-1/5 py-1 z-10"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg><span className="text-[9px] text-gray-400">Rubric</span></button>
              <button className="flex flex-col items-center w-1/5 py-1 relative z-10" onClick={() => { if (resourceCount > 0) { animateToTab(4); setTimeout(() => setShowResourcesModal(true), 450); } }}><svg className={`w-6 h-6 ${resourceCount > 0 ? 'text-gray-400' : 'text-gray-200'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>{resourceCount > 0 && <span className="absolute -top-1 right-0 w-4 h-4 bg-[#005587] rounded-full text-[8px] text-white flex items-center justify-center font-bold">{resourceCount}</span>}<span className={`text-[9px] ${resourceCount > 0 ? 'text-gray-400' : 'text-gray-200'}`}>Resources</span></button>
            </div>
          )}
        </nav>,
        document.body
        )}

      {/* Rubric Modal */}
      <ModalTransition isOpen={showRubricModal && !!assignment} onClose={() => { setShowRubricModal(false); setTimeout(() => animateToTab(1), 280); }}>
          <div className="bg-white w-full rounded-2xl p-4 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">Rubric</h3>
              <button onClick={() => { setShowRubricModal(false); setTimeout(() => animateToTab(1), 280); }} className="text-gray-400 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-3">
              {(() => {
                const rubricData = (assignment as any).rubric && Array.isArray((assignment as any).rubric) 
                  ? (assignment as any).rubric 
                  : [
                      { id: '1', name: 'Mathematical Accuracy', levels: [
                        { score: 4, description: 'All work is correct.' },
                        { score: 3, description: 'One minor error.' },
                        { score: 2, description: 'Multiple errors but demonstrates understanding.' },
                        { score: 1, description: 'Little or no understanding shown.' },
                      ]},
                      { id: '2', name: 'Work Shown', levels: [
                        { score: 4, description: 'All steps are shown and easy to follow.' },
                        { score: 3, description: 'Most steps shown.' },
                        { score: 2, description: 'Some steps missing.' },
                        { score: 1, description: 'Little or no work shown.' },
                      ]},
                      { id: '3', name: 'Explanation', levels: [
                        { score: 4, description: 'Reasoning is clear and complete.' },
                        { score: 3, description: 'Mostly clear.' },
                        { score: 2, description: 'Limited explanation.' },
                        { score: 1, description: 'No meaningful explanation.' },
                      ]},
                      { id: '4', name: 'Organization', levels: [
                        { score: 4, description: 'Neat and easy to read.' },
                        { score: 3, description: 'Mostly organized.' },
                        { score: 2, description: 'Somewhat difficult to follow.' },
                        { score: 1, description: 'Disorganized.' },
                      ]},
                    ];
                // Check if it's the new 4/3/2/1 format (has levels) or old format (has maxPoints)
                const isNewFormat = rubricData[0]?.levels;
                return (
                  <>
                    {isNewFormat ? (
                      rubricData.map((item: any, idx: number) => (
                        <div key={item.id || idx} className="bg-gray-50 rounded-xl p-3">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">{item.name}</h4>
                          <div className="space-y-1">
                            {item.levels.map((level: any) => (
                              <div key={level.score} className="flex items-start gap-2">
                                <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${level.score === 4 ? 'bg-green-100 text-green-700' : level.score === 3 ? 'bg-blue-100 text-blue-700' : level.score === 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{level.score}</span>
                                <span className="text-xs text-gray-600">{level.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      rubricData.map((item: any, idx: number) => (
                        <div key={item.id || idx} className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-gray-900">{item.name}</span>
                            <span className="text-sm font-bold text-[#005587]">{item.maxPoints} pts</span>
                          </div>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                      ))
                    )}
                    <div className="border-t border-gray-200 pt-2 mt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">Max Score</span>
                      <span className="text-sm font-bold text-[#005587]">
                        {isNewFormat ? `${rubricData.reduce((sum: number, cat: any) => sum + Math.max(...cat.levels.map((l: any) => l.score)), 0)} pts` : `${rubricData.reduce((sum: number, r: any) => sum + (r.maxPoints || 0), 0)} pts`}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
      </ModalTransition>

      {/* Resources Modal */}
      <ModalTransition isOpen={showResourcesModal && !!assignment} onClose={() => { setShowResourcesModal(false); setTimeout(() => animateToTab(1), 280); }}>
          <div className="bg-white w-full rounded-2xl p-4 max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">Resources</h3>
              <button onClick={() => { setShowResourcesModal(false); setTimeout(() => animateToTab(1), 280); }} className="text-gray-400 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-2">
              {(assignment.resources || []).map((resource: any, idx: number) => (
                <a
                  key={resource.id || idx}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#005587]/10 flex items-center justify-center shrink-0">
                    {resource.type === 'link' ? (
                      <svg className="w-5 h-5 text-[#005587]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    ) : (
                      <svg className="w-5 h-5 text-[#005587]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{resource.title || resource.fileName || 'Resource'}</p>
                    <p className="text-[10px] text-gray-400 truncate">{resource.url}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
      </ModalTransition>

      {/* Post Modal - Record or Upload */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setShowPostModal(false); setShowLinkInput(false); setPostError(''); setTimeout(() => animateToTab(1), 280); }}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white w-full max-w-[400px] mx-4 mb-8 rounded-2xl p-5 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 text-center mb-1">Post to Assignment</h3>
            
            {!showLinkInput ? (
              <>
                <button
                  onClick={() => { setShowPostModal(false); router.push(`/student/record?assignmentId=${currentAssignmentId}&mode=record`); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[#005587] to-[#0088cc] active:scale-[0.98] transition-transform"
                >
                  <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="text-left">
                    <span className="text-white font-bold text-sm block">Record Live</span>
                    <span className="text-white/70 text-xs">Open camera and record</span>
                  </div>
                </button>
                <button
                  onClick={() => { setShowPostModal(false); router.push(`/student/record?assignmentId=${currentAssignmentId}&mode=upload`); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 active:scale-[0.98] transition-transform"
                >
                  <div className="w-11 h-11 rounded-full bg-[#005587]/10 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-[#005587]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <div className="text-left">
                    <span className="text-gray-900 font-bold text-sm block">Upload a File</span>
                    <span className="text-gray-500 text-xs">Choose from your device</span>
                  </div>
                </button>
                <button
                  onClick={() => setShowLinkInput(true)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 active:scale-[0.98] transition-transform"
                >
                  <div className="w-11 h-11 rounded-full bg-[#005587]/10 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-[#005587]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  </div>
                  <div className="text-left">
                    <span className="text-gray-900 font-bold text-sm block">Paste a Link</span>
                    <span className="text-gray-500 text-xs">YouTube or Google Drive</span>
                  </div>
                </button>
              </>
            ) : (
              /* Link input inline */
              <div className="space-y-3">
                <input
                  type="url"
                  autoFocus
                  placeholder="Paste YouTube or Google Drive link..."
                  value={postLinkUrl}
                  onChange={(e) => { setPostLinkUrl(e.target.value); setPostError(''); }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#005587] focus:ring-1 focus:ring-[#005587]"
                />
                {postError && <p className="text-red-500 text-xs break-all">{postError}</p>}
                <button
                  onClick={async () => {
                    if (!postLinkUrl.trim()) { setPostError('Please paste a link'); return; }
                    if (!user?.id) { setPostError('Not logged in'); return; }
                    setPostLinkSubmitting(true);
                    setPostError('');
                    try {
                      const isYT = postLinkUrl.includes('youtube.com') || postLinkUrl.includes('youtu.be');
                      const isGD = postLinkUrl.includes('drive.google');
                      const res = await fetch('/api/video-submissions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          studentId: user.id,
                          assignmentId: currentAssignmentId,
                          courseId: assignment?.courseId,
                          videoUrl: postLinkUrl.trim(),
                          youtubeUrl: isYT ? postLinkUrl.trim() : undefined,
                          googleDriveUrl: isGD ? postLinkUrl.trim() : undefined,
                          videoTitle: 'Video Submission',
                          isYouTube: isYT,
                          isGoogleDrive: isGD,
                          submissionMethod: isYT ? 'youtube' : isGD ? 'google-drive' : 'link',
                        }),
                      });
                      const data = await res.json().catch(() => null);
                      if (res.ok && data?.success) {
                        setShowPostModal(false);
                        setShowLinkInput(false);
                        setPostLinkUrl('');
                        fetchData(); // Refresh to show submission
                      } else {
                        setPostError(data?.error || data?.details || `Failed (${res.status}): ${JSON.stringify(data)}`);
                      }
                    } catch (err: any) {
                      setPostError(err?.message || 'Network error');
                    }
                    setPostLinkSubmitting(false);
                  }}
                  disabled={postLinkSubmitting || !postLinkUrl.trim()}
                  className="w-full py-3 bg-[#005587] text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {postLinkSubmitting ? 'Submitting...' : 'Submit Link'}
                </button>
                <button onClick={() => setShowLinkInput(false)} className="w-full py-2 text-sm text-gray-400">← Back</button>
              </div>
            )}
            
            {!showLinkInput && (
              <button onClick={() => { setShowPostModal(false); setShowLinkInput(false); setTimeout(() => animateToTab(1), 280); }} className="w-full py-2.5 text-sm text-gray-400 font-medium mt-1">
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowUploadModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white w-full max-w-[380px] mx-4 rounded-2xl p-5 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Upload Submission</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* File upload */}
            <button
              onClick={() => uploadFileRef.current?.click()}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center gap-2 hover:border-[#005587] transition-colors mb-3"
            >
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              <span className="text-sm text-gray-600 font-medium">Choose a video file</span>
              <span className="text-xs text-gray-400">MP4, MOV, or WebM</span>
            </button>
            {uploadFile && (
              <p className="text-xs text-green-600 mb-3 truncate">✓ {uploadFile.name}</p>
            )}

            {/* OR divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* YouTube / link paste */}
            <input
              type="text"
              placeholder="Paste YouTube or Google Drive link..."
              value={uploadUrl}
              onChange={(e) => setUploadUrl(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm mt-2 focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
            />

            {/* Submit */}
            <button
              onClick={async () => {
                if (!uploadUrl && !uploadFile) return;
                setUploading(true);
                try {
                  if (uploadFile) {
                    // Upload file to S3
                    const formData = new FormData();
                    formData.append('file', uploadFile);
                    formData.append('assignmentId', currentAssignmentId);
                    formData.append('studentId', user?.id || '');
                    const res = await fetch('/api/upload/student-video', { method: 'POST', body: formData });
                    if (res.ok) { setShowUploadModal(false); fetchData(); }
                    else alert('Upload failed. Please try again.');
                  } else if (uploadUrl) {
                    // Submit URL directly
                    const res = await fetch('/api/submissions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ assignmentId: currentAssignmentId, studentId: user?.id, videoUrl: uploadUrl }),
                    });
                    if (res.ok) { setShowUploadModal(false); fetchData(); }
                    else alert('Submission failed. Please try again.');
                  }
                } catch { alert('Error submitting.'); }
                finally { setUploading(false); }
              }}
              disabled={uploading || (!uploadUrl && !uploadFile)}
              className="w-full mt-4 py-3 bg-[#005587] text-white rounded-full font-bold text-sm disabled:opacity-50 active:scale-95 transition-transform"
            >
              {uploading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={uploadFileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) setUploadFile(e.target.files[0]); }}
      />
      </div>
    </StudentRoute>
  );
}

// end of file
