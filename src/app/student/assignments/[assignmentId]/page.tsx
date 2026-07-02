'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { getVideoUrl } from '@/lib/videoUtils';
import { getAssignmentColor, getAssignmentTitleColor } from '@/lib/assignmentColors';

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

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [assignRes, subRes] = await Promise.all([
        fetch(`/api/student/assignments?userId=${user.id}&t=${Date.now()}`, { credentials: 'include', cache: 'no-store' }),
        fetch(`/api/assignments/${assignmentId}/submissions?studentId=${user.id}&t=${Date.now()}`, { credentials: 'include', cache: 'no-store' }),
      ]);

      if (assignRes.ok) {
        const data = await assignRes.json();
        const allAssignments = data.assignments || [];
        // Store all IDs for prev/next navigation
        setAllAssignmentIds(allAssignments.map((a: any) => a.assignmentId || a.id));
        const found = allAssignments.find((a: any) => a.assignmentId === assignmentId);
        if (found) setAssignment(found);
        else {
          // Try direct API
          const directRes = await fetch(`/api/assignments/${assignmentId}?t=${Date.now()}`, { credentials: 'include', cache: 'no-store' });
          if (directRes.ok) {
            const directData = await directRes.json();
            if (directData.success && directData.data?.assignment) setAssignment(directData.data.assignment);
            else setError(true);
          } else setError(true);
        }
      } else setError(true);

      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.success && subData.submissions?.length > 0) setSubmission(subData.submissions[0]);
      }
    } catch { setError(true); } 
    finally { setLoading(false); }
  }, [assignmentId, user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const dueBadge = useMemo(() => assignment ? getDueBadge(assignment.dueDate, assignment.isSubmitted || !!submission) : null, [assignment?.dueDate, assignment?.isSubmitted, submission]);
  const isGraded = submission?.grade !== undefined && submission?.grade !== null;
  const isSubmitted = !!submission;
  const resourceCount = (assignment?.resources || []).length;

  if (loading) {
    return (
      <StudentRoute>
        <div className="h-full flex items-center justify-center bg-black">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent" />
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

      <div className="h-full flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-3 py-2 border-b border-gray-100 z-10 shrink-0" style={{ backgroundColor: getAssignmentColor(assignmentId) }}>
          {(() => {
            const currentIdx = allAssignmentIds.indexOf(assignmentId);
            const prevId = currentIdx > 0 ? allAssignmentIds[currentIdx - 1] : null;
            const nextId = currentIdx < allAssignmentIds.length - 1 ? allAssignmentIds[currentIdx + 1] : null;
            return (
              <>
                <button onClick={() => prevId && router.push(`/student/assignments/${prevId}`)} className={`p-1.5 -ml-1 ${prevId ? '' : 'opacity-30 pointer-events-none'}`} style={{ color: getAssignmentTitleColor(assignmentId) }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="flex-1 text-base font-bold uppercase mx-2 break-words leading-tight" style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em', color: getAssignmentTitleColor(assignmentId) }}>{assignment.title}</h1>
                <button onClick={() => nextId && router.push(`/student/assignments/${nextId}`)} className={`p-1.5 ${nextId ? '' : 'opacity-30 pointer-events-none'}`} style={{ color: getAssignmentTitleColor(assignmentId) }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            );
          })()}
        </div>

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

        {/* Scrollable Instructions */}
        <div className="flex-1 overflow-y-auto px-4 py-3 bg-white min-h-0">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-normal mb-2">Instructions</h3>
          {assignment.description ? (
            <div 
              className="text-sm text-gray-700 leading-relaxed [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-3 [&_h2]:mb-1 [&_p]:mb-2 [&_ul]:pl-4 [&_ul]:mb-2 [&_li]:mb-1 [&_li]:list-disc [&_strong]:font-semibold [&_br]:hidden"
              dangerouslySetInnerHTML={{ __html: assignment.description }}
            />
          ) : (
            <p className="text-sm text-gray-400 italic">No instructions provided.</p>
          )}
        </div>

        {/* Bottom Nav */}
        <div className="shrink-0 bg-white border-t border-gray-200 px-2 py-3 native-bottom-nav">
          {!isSubmitted && (
            <div className="flex items-center justify-around">
              <button onClick={() => router.push('/student/dashboard')} className="flex flex-col items-center"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg><span className="text-[10px] text-gray-400">Home</span></button>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-medium text-orange-600">Unsubmitted</span>
                {dueBadge && <span className={`text-[9px] mt-0.5 ${dueBadge.color} px-1.5 py-0.5 rounded-full`}>{dueBadge.label}</span>}
              </div>
              <button onClick={() => setShowPostModal(true)} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-[#005587] to-[#0088cc] rounded-full flex items-center justify-center shadow-xl border-4 border-white ring-2 ring-[#FFC72C]">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>
                <span className="text-[9px] font-bold text-[#005587] mt-0.5">Post</span>
              </button>
              <button onClick={() => setShowRubricModal(true)} className="flex flex-col items-center"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg><span className="text-[10px] text-gray-400">Rubric</span></button>
              <button className="flex flex-col items-center relative" onClick={() => resourceCount > 0 && setShowResourcesModal(true)}><svg className={`w-6 h-6 ${resourceCount > 0 ? 'text-gray-400' : 'text-gray-200'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>{resourceCount > 0 && <span className="absolute -top-1 right-0 w-4 h-4 bg-[#005587] rounded-full text-[8px] text-white flex items-center justify-center font-bold">{resourceCount}</span>}<span className={`text-[10px] ${resourceCount > 0 ? 'text-gray-400' : 'text-gray-200'}`}>Resources</span></button>
            </div>
          )}


          {isSubmitted && !isGraded && (
            <div className="flex items-center justify-around">
              <button onClick={() => router.push('/student/dashboard')} className="flex flex-col items-center"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg><span className="text-[10px] text-gray-400">Home</span></button>
              <div className="flex flex-col items-center"><span className="text-[10px] font-bold text-green-600">✓ Submitted!</span></div>
              <button onClick={() => router.push(`/student/assignments/${assignmentId}/feed`)} className="">
                <div className="w-14 h-14 rounded-full bg-[#005587] flex items-center justify-center shadow-xl border-4 border-white ring-2 ring-[#FFC72C]">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <span className="text-[9px] font-bold text-[#005587] mt-0.5 block text-center leading-tight">Peer<br/>Review</span>
              </button>
              <button onClick={() => setShowRubricModal(true)} className="flex flex-col items-center"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg><span className="text-[10px] text-gray-400">Rubric</span></button>
              <button className="flex flex-col items-center relative" onClick={() => resourceCount > 0 && setShowResourcesModal(true)}><svg className={`w-6 h-6 ${resourceCount > 0 ? 'text-gray-400' : 'text-gray-200'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>{resourceCount > 0 && <span className="absolute -top-1 right-0 w-4 h-4 bg-[#005587] rounded-full text-[8px] text-white flex items-center justify-center font-bold">{resourceCount}</span>}<span className={`text-[10px] ${resourceCount > 0 ? 'text-gray-400' : 'text-gray-200'}`}>Resources</span></button>
            </div>
          )}

          {isGraded && (
            <div className="flex items-center justify-around">
              <button onClick={() => router.push('/student/dashboard')} className="flex flex-col items-center"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg><span className="text-[10px] text-gray-400">Home</span></button>
              <div className="flex flex-col items-center"><span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">{submission!.grade}/{assignment.points || assignment.maxScore || 100}</span><span className="text-[9px] text-gray-400 mt-0.5">Grade</span></div>
              <button onClick={() => router.push(`/student/assignments/${assignmentId}/feed`)} className="">
                <div className="w-14 h-14 rounded-full bg-[#005587] flex items-center justify-center shadow-xl border-4 border-white ring-2 ring-[#FFC72C]">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <span className="text-[9px] font-bold text-[#005587] mt-0.5 block text-center leading-tight">Peer<br/>Review</span>
              </button>
              <button onClick={() => setShowRubricModal(true)} className="flex flex-col items-center"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg><span className="text-[10px] text-gray-400">Rubric</span></button>
              <button className="flex flex-col items-center relative" onClick={() => resourceCount > 0 && setShowResourcesModal(true)}><svg className={`w-6 h-6 ${resourceCount > 0 ? 'text-gray-400' : 'text-gray-200'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>{resourceCount > 0 && <span className="absolute -top-1 right-0 w-4 h-4 bg-[#005587] rounded-full text-[8px] text-white flex items-center justify-center font-bold">{resourceCount}</span>}<span className={`text-[10px] ${resourceCount > 0 ? 'text-gray-400' : 'text-gray-200'}`}>Resources</span></button>
            </div>
          )}
        </div>
      </div>

      {/* Rubric Modal */}
      {showRubricModal && assignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowRubricModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white w-full max-w-[380px] mx-4 rounded-2xl p-4 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">Rubric</h3>
              <button onClick={() => setShowRubricModal(false)} className="text-gray-400 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-3">
              {(assignment as any).rubric && Array.isArray((assignment as any).rubric) ? (
                <>
                  {(assignment as any).rubric.map((item: any, idx: number) => (
                    <div key={item.id || idx} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">{item.name}</span>
                        <span className="text-sm font-bold text-[#005587]">{item.maxPoints} pts</span>
                      </div>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">Total</span>
                    <span className="text-sm font-bold text-[#005587]">
                      {(assignment as any).rubric.reduce((sum: number, r: any) => sum + (r.maxPoints || 0), 0)} pts
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No rubric available for this assignment.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resources Modal */}
      {showResourcesModal && assignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowResourcesModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white w-full max-w-[380px] mx-4 rounded-2xl p-4 max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">Resources</h3>
              <button onClick={() => setShowResourcesModal(false)} className="text-gray-400 p-1">
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
        </div>
      )}

      {/* Post Modal - Record or Upload */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => { setShowPostModal(false); setShowLinkInput(false); setPostError(''); }}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white w-full max-w-[400px] mx-4 mb-8 rounded-2xl p-5 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 text-center mb-1">Post to Assignment</h3>
            
            {!showLinkInput ? (
              <>
                <button
                  onClick={() => { setShowPostModal(false); router.push(`/student/record?assignmentId=${assignmentId}&mode=record`); }}
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
                  onClick={() => { setShowPostModal(false); router.push(`/student/record?assignmentId=${assignmentId}&mode=upload`); }}
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
                          assignmentId,
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
              <button onClick={() => { setShowPostModal(false); setShowLinkInput(false); }} className="w-full py-2.5 text-sm text-gray-400 font-medium mt-1">
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
                    formData.append('assignmentId', assignmentId);
                    formData.append('studentId', user?.id || '');
                    const res = await fetch('/api/upload/student-video', { method: 'POST', body: formData });
                    if (res.ok) { setShowUploadModal(false); fetchData(); }
                    else alert('Upload failed. Please try again.');
                  } else if (uploadUrl) {
                    // Submit URL directly
                    const res = await fetch('/api/submissions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ assignmentId, studentId: user?.id, videoUrl: uploadUrl }),
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
    </StudentRoute>
  );
}

// end of file
