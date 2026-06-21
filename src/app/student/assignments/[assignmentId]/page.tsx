'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { getVideoUrl } from '@/lib/videoUtils';

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

function VideoPlayer({ url }: { url: string }) {
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
        const found = data.assignments?.find((a: any) => a.assignmentId === assignmentId);
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
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap" rel="stylesheet" />

      <div className="h-full flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-3 py-2 bg-white border-b border-gray-100 z-10 shrink-0">
          <button onClick={() => router.push('/student/assignments')} className="p-1.5 -ml-1 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="flex-1 text-gray-900 text-sm font-medium truncate mx-2">{assignment.title}</h1>
          <img src="/UpdatedCCLogo.png" alt="ClassCast" className="w-6 h-6 object-contain" />
        </div>

        {/* Video Area - Top ~42% */}
        <div className="relative w-full shrink-0" style={{ height: '42%', minHeight: '180px' }}>
          {assignment.instructionalVideoUrl ? (
            <VideoPlayer url={assignment.instructionalVideoUrl} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#005587] to-[#003d62] px-6">
              <h2 className="text-white text-2xl font-bold text-center leading-tight mb-2">{assignment.title}</h2>
              <p className="text-white/70 text-sm">{assignment.courseName}</p>
            </div>
          )}
        </div>

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
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Instructions</h3>
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
        <div className="shrink-0 bg-white border-t border-gray-200 px-2 py-2">
          {!isSubmitted && (
            <div className="flex items-center justify-around">
              <button onClick={() => router.push('/student/dashboard')} className="flex flex-col items-center"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg><span className="text-[10px] text-gray-400">Home</span></button>
              <button className="flex flex-col items-center relative" onClick={() => resourceCount > 0 && setShowResourcesModal(true)}><svg className={`w-6 h-6 ${resourceCount > 0 ? 'text-gray-400' : 'text-gray-200'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>{resourceCount > 0 && <span className="absolute -top-1 right-0 w-4 h-4 bg-[#005587] rounded-full text-[8px] text-white flex items-center justify-center font-bold">{resourceCount}</span>}<span className={`text-[10px] ${resourceCount > 0 ? 'text-gray-400' : 'text-gray-200'}`}>Resources</span></button>
              <button onClick={() => router.push(`/student/record?assignmentId=${assignmentId}`)} className="flex flex-col items-center -mt-5">
                <div className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg border-4 border-white">
                  <div className="w-5 h-5 rounded-full bg-white" />
                </div>
                <span className="text-[10px] font-bold text-red-600 mt-0.5">Record</span>
              </button>
              <button className="flex flex-col items-center opacity-80"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg><span className="text-[10px] text-gray-400">Rubric</span></button>
              <button className="flex flex-col items-center opacity-30"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg><span className="text-[10px] text-gray-300">Peers</span></button>
            </div>
          )}

          {isSubmitted && !isGraded && (
            <div className="flex items-center justify-around">
              <button onClick={() => router.push('/student/dashboard')} className="flex flex-col items-center"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg><span className="text-[10px] text-gray-400">Home</span></button>
              <button className="flex flex-col items-center relative" onClick={() => resourceCount > 0 && setShowResourcesModal(true)}><svg className={`w-6 h-6 ${resourceCount > 0 ? 'text-gray-400' : 'text-gray-200'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>{resourceCount > 0 && <span className="absolute -top-1 right-0 w-4 h-4 bg-[#005587] rounded-full text-[8px] text-white flex items-center justify-center font-bold">{resourceCount}</span>}<span className={`text-[10px] ${resourceCount > 0 ? 'text-gray-400' : 'text-gray-200'}`}>Resources</span></button>
              <button onClick={() => router.push(`/student/assignments/${assignmentId}/feed`)} className="flex flex-col items-center -mt-5">
                <div className="w-14 h-14 rounded-full bg-[#005587] flex items-center justify-center shadow-lg border-4 border-white ring-2 ring-[#FFC72C]">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <span className="text-[10px] font-bold text-[#005587] mt-0.5">Peers</span>
              </button>
              <button className="flex flex-col items-center"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg><span className="text-[10px] text-gray-400">Rubric</span></button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex flex-col items-center opacity-60"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg><span className="text-[9px] text-gray-400">Delete</span></button>
            </div>
          )}

          {isGraded && (
            <div className="flex items-center justify-around">
              <button onClick={() => router.push('/student/dashboard')} className="flex flex-col items-center"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg><span className="text-[10px] text-gray-400">Home</span></button>
              <button className="flex flex-col items-center relative" onClick={() => resourceCount > 0 && setShowResourcesModal(true)}><svg className={`w-6 h-6 ${resourceCount > 0 ? 'text-gray-400' : 'text-gray-200'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>{resourceCount > 0 && <span className="absolute -top-1 right-0 w-4 h-4 bg-[#005587] rounded-full text-[8px] text-white flex items-center justify-center font-bold">{resourceCount}</span>}<span className={`text-[10px] ${resourceCount > 0 ? 'text-gray-400' : 'text-gray-200'}`}>Resources</span></button>
              <button onClick={() => router.push(`/student/assignments/${assignmentId}/feed`)} className="flex flex-col items-center -mt-5">
                <div className="w-14 h-14 rounded-full bg-[#005587] flex items-center justify-center shadow-lg border-4 border-white ring-2 ring-[#FFC72C]">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <span className="text-[10px] font-bold text-[#005587] mt-0.5">Peers</span>
              </button>
              <button className="flex flex-col items-center"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg><span className="text-[10px] text-gray-400">Rubric</span></button>
              <div className="flex flex-col items-center"><span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">{submission!.grade}/{assignment.points || 100}</span><span className="text-[9px] text-gray-400 mt-0.5">Grade</span></div>
            </div>
          )}
        </div>
      </div>

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
    </StudentRoute>
  );
}

// end of file
