'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface StudentTabBarProps {
  /** If provided, skips assignment selection and uses this assignmentId directly */
  assignmentId?: string;
  /** Legacy: custom click handler (overrides built-in modal) */
  onPostClick?: () => void;
}

export function StudentTabBar({ assignmentId, onPostClick }: StudentTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  // Post modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(assignmentId || null);
  const [postMode, setPostMode] = useState<'link' | null>(null);
  const [postLinkUrl, setPostLinkUrl] = useState('');
  const [postLinkSubmitting, setPostLinkSubmitting] = useState(false);
  const [postLinkError, setPostLinkError] = useState('');
  const [assignments, setAssignments] = useState<any[]>([]);

  // Fetch unsubmitted assignments when modal opens
  useEffect(() => {
    if (showPostModal && !assignmentId && user?.id) {
      fetch(`/api/student/assignments?userId=${user.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const all = data?.assignments || [];
          setAssignments(all.filter((a: any) => !a.isSubmitted));
        })
        .catch(() => {});
    }
  }, [showPostModal, user?.id, assignmentId]);

  const handlePostClick = () => {
    if (onPostClick) { onPostClick(); return; }
    if (assignmentId) {
      setSelectedAssignment(assignmentId);
    } else {
      setSelectedAssignment(null);
    }
    setPostMode(null);
    setPostLinkUrl('');
    setPostLinkError('');
    setShowPostModal(true);
  };

  const closeModal = () => {
    setShowPostModal(false);
    setSelectedAssignment(assignmentId || null);
    setPostMode(null);
    setPostLinkUrl('');
    setPostLinkError('');
  };

  const isActive = (path: string) => {
    if (path === '/student/dashboard') return pathname === '/student/dashboard';
    if (path === '/student/assignments') return pathname?.startsWith('/student/assignments');
    if (path === '/student/courses') return pathname?.startsWith('/student/courses');
    if (path === '/student/profile') return pathname?.startsWith('/student/profile');
    return false;
  };

  const activeColor = 'text-[#005587]';
  const inactiveColor = 'text-gray-400';
  const avatarUrl = user?.avatar || user?.profileImage || null;
  const userInitial = (user?.firstName || user?.email || '?')[0]?.toUpperCase();

  return (
    <>
      <nav className="shrink-0 px-1 py-2 native-bottom-nav" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', borderTop: '1px solid rgba(0,85,135,0.08)', boxShadow: '0 -4px 30px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center min-w-0" onClick={() => router.push('/student/dashboard')}>
            <svg className={`w-6 h-6 ${isActive('/student/dashboard') ? activeColor : inactiveColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className={`text-[9px] ${isActive('/student/dashboard') ? activeColor + ' font-medium' : inactiveColor}`}>Home</span>
          </button>
          <button className="flex flex-col items-center min-w-0" onClick={() => router.push('/student/assignments')}>
            <svg className={`w-6 h-6 ${isActive('/student/assignments') ? activeColor : inactiveColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            <span className={`text-[9px] ${isActive('/student/assignments') ? activeColor + ' font-medium' : inactiveColor}`}>Assignments</span>
          </button>
          <button className="flex flex-col items-center min-w-0" onClick={handlePostClick}>
            <div className="w-12 h-12 bg-gradient-to-br from-[#005587] to-[#0088cc] rounded-full flex items-center justify-center shadow-lg border-4 border-white ring-2 ring-[#FFC72C]">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </div>
            <span className="text-[9px] text-gray-500 mt-0.5">Post</span>
          </button>
          <button className="flex flex-col items-center min-w-0" onClick={() => router.push('/student/courses')}>
            <svg className={`w-6 h-6 ${isActive('/student/courses') ? activeColor : inactiveColor}`} fill={isActive('/student/courses') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <span className={`text-[9px] ${isActive('/student/courses') ? activeColor + ' font-medium' : inactiveColor}`}>Courses</span>
          </button>
          <button className="flex flex-col items-center min-w-0" onClick={() => router.push('/student/profile')}>
            <div className={`w-12 h-12 rounded-full overflow-hidden ${isActive('/student/profile') ? 'ring-2 ring-[#005587]' : ''} bg-[#005587] flex items-center justify-center shadow-lg`}>
              {avatarUrl && avatarUrl.startsWith('http') ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : avatarUrl && avatarUrl.length <= 4 ? (
                <span className="text-lg">{avatarUrl}</span>
              ) : (
                <span className="text-white text-sm font-bold">{userInitial}</span>
              )}
            </div>
            <span className={`text-[9px] ${isActive('/student/profile') ? activeColor + ' font-medium' : inactiveColor}`}>Profile</span>
          </button>
        </div>
      </nav>

      {/* Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white w-full max-w-[380px] mx-4 rounded-2xl p-4 max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">
                {!selectedAssignment ? 'Select Assignment' : postMode === 'link' ? 'Paste a Link' : 'How do you want to post?'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Step 1: Choose Assignment (skipped if assignmentId prop provided) */}
            {!selectedAssignment && (
              <div className="overflow-y-auto flex-1 space-y-2">
                {assignments.length > 0 ? assignments.map((a: any) => (
                  <button key={a.assignmentId} onClick={() => setSelectedAssignment(a.assignmentId)} className="w-full text-left rounded-xl p-3 bg-gray-50 border border-gray-200 active:scale-[0.98] transition-transform">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{a.title}</h4>
                    <p className="text-xs text-gray-500 truncate">{a.courseName || ''}</p>
                  </button>
                )) : (
                  <p className="text-center text-gray-400 text-sm py-4">No unsubmitted assignments</p>
                )}
              </div>
            )}

            {/* Step 2: Choose method */}
            {selectedAssignment && !postMode && (
              <div className="space-y-3">
                <button onClick={() => { closeModal(); router.push(`/student/record?assignmentId=${selectedAssignment}&mode=record`); }} className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-[#005587] to-[#0088cc] text-white rounded-xl active:scale-[0.98] transition-transform">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>
                  <div className="text-left"><p className="font-semibold text-sm">Record Live</p><p className="text-xs text-white/70">Open camera and record</p></div>
                </button>
                <button onClick={() => { closeModal(); router.push(`/student/record?assignmentId=${selectedAssignment}&mode=upload`); }} className="w-full flex items-center gap-3 p-4 bg-gray-100 text-gray-900 rounded-xl active:scale-[0.98] transition-transform">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center"><svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></div>
                  <div className="text-left"><p className="font-semibold text-sm">Upload a File</p><p className="text-xs text-gray-500">Choose from your device</p></div>
                </button>
                <button onClick={() => setPostMode('link')} className="w-full flex items-center gap-3 p-4 bg-gray-100 text-gray-900 rounded-xl active:scale-[0.98] transition-transform">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center"><svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg></div>
                  <div className="text-left"><p className="font-semibold text-sm">Paste a Link</p><p className="text-xs text-gray-500">YouTube or Google Drive</p></div>
                </button>
                {!assignmentId && <button onClick={() => setSelectedAssignment(null)} className="w-full text-center text-xs text-[#005587] font-medium py-2 mt-1">← Back</button>}
              </div>
            )}

            {/* Step 3: Link input */}
            {selectedAssignment && postMode === 'link' && (
              <div className="space-y-3">
                <input type="url" autoFocus placeholder="Paste YouTube or Google Drive link..." value={postLinkUrl} onChange={(e) => { setPostLinkUrl(e.target.value); setPostLinkError(''); }} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#005587] focus:ring-1 focus:ring-[#005587]" />
                {postLinkError && <p className="text-red-500 text-xs">{postLinkError}</p>}
                <button
                  onClick={async () => {
                    if (!postLinkUrl.trim()) { setPostLinkError('Please paste a link'); return; }
                    if (!user?.id) { setPostLinkError('Not logged in'); return; }
                    setPostLinkSubmitting(true); setPostLinkError('');
                    try {
                      const aRes = await fetch(`/api/assignments/${selectedAssignment}`);
                      const aData = aRes.ok ? await aRes.json() : null;
                      const courseId = aData?.data?.assignment?.courseId || aData?.assignment?.courseId;
                      const isYT = postLinkUrl.includes('youtube.com') || postLinkUrl.includes('youtu.be');
                      const isGD = postLinkUrl.includes('drive.google');
                      const res = await fetch('/api/video-submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: user.id, assignmentId: selectedAssignment, courseId, videoUrl: postLinkUrl.trim(), youtubeUrl: isYT ? postLinkUrl.trim() : undefined, googleDriveUrl: isGD ? postLinkUrl.trim() : undefined, videoTitle: 'Video Submission', isYouTube: isYT, isGoogleDrive: isGD, submissionMethod: isYT ? 'youtube' : isGD ? 'google-drive' : 'link' }) });
                      const data = await res.json().catch(() => null);
                      if (res.ok && data?.success) { 
                        setPostLinkUrl('');
                        setPostLinkError('');
                        setPostMode(null);
                        // Show brief success then close
                        setPostLinkError('✅ Posted successfully!');
                        setTimeout(() => { closeModal(); router.refresh(); }, 1000);
                      }
                      else { setPostLinkError(data?.error || `Failed (${res.status})`); }
                    } catch (err: any) { setPostLinkError(err?.message || 'Network error'); }
                    setPostLinkSubmitting(false);
                  }}
                  disabled={postLinkSubmitting || !postLinkUrl.trim()}
                  className="w-full py-3 bg-[#005587] text-white rounded-xl font-bold disabled:opacity-50"
                >{postLinkSubmitting ? 'Submitting...' : 'Submit Link'}</button>
                <button onClick={() => { setPostMode(null); setPostLinkUrl(''); setPostLinkError(''); }} className="w-full text-center text-xs text-[#005587] font-medium py-2">← Back</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input removed - upload navigates to record page */}
    </>
  );
}
