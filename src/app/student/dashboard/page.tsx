'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { getAssignmentColor, getAssignmentTitleColor } from '@/lib/assignmentColors';
import { isScreenshotMode, getDemoAssignments, getDemoFeed, DEMO_STUDENT } from '@/lib/demo-screenshot-data';
import { useIsWideScreen } from '@/hooks/useIsWideScreen';
import { StudentTabBar } from '@/components/student/StudentTabBar';
import { useStudentAssignments, useStudentFeed, Assignment, FeedItem } from '@/hooks/useStudentData';
import { DashboardSkeleton } from '@/components/student/DashboardSkeleton';
import { useQueryClient } from '@tanstack/react-query';
import ModalTransition from '@/components/transitions/ModalTransition';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: assignments = [], isLoading: loading } = useStudentAssignments();
  const { data: feed = [] } = useStudentFeed();
  const [showAssignmentPicker, setShowAssignmentPicker] = useState(false);
  const [postMode, setPostMode] = useState<'record' | 'upload' | 'link' | null>(null);
  const [selectedPostAssignment, setSelectedPostAssignment] = useState<string | null>(null);
  const [postLinkUrl, setPostLinkUrl] = useState('');
  const [postLinkSubmitting, setPostLinkSubmitting] = useState(false);
  const [postLinkError, setPostLinkError] = useState('');
  const postFileInputRef = React.useRef<HTMLInputElement>(null);
  const [demoMode, setDemoMode] = useState(false);
  const { isWide } = useIsWideScreen();

  // Listen for Record button click from sidebar
  useEffect(() => {
    const handleRecordClick = () => setShowAssignmentPicker(true);
    window.addEventListener('classcast-record-click', handleRecordClick);
    
    // Check if navigated here with ?openRecord=true
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openRecord') === 'true') {
        setShowAssignmentPicker(true);
        // Clean up the URL
        window.history.replaceState({}, '', '/student/dashboard');
      }
    }
    
    return () => window.removeEventListener('classcast-record-click', handleRecordClick);
  }, []);

  const now = new Date();
  const overdue = assignments.filter(a => new Date(a.dueDate) < now && !a.isSubmitted);
  const upcoming = assignments.filter(a => new Date(a.dueDate) >= now && !a.isSubmitted).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const displayAssignments = [...assignments].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime; // most recently created first
  }).filter(a => !a.isSubmitted).slice(0, isWide ? 6 : 3);
  const unsubmitted = assignments.filter(a => !a.isSubmitted);

  const getDueBadge = (d: string) => { const diff = Math.ceil((new Date(d).getTime() - now.getTime()) / 86400000); if (diff < 0) return `${Math.abs(diff)}d late`; if (diff === 0) return 'Today'; if (diff === 1) return 'Tomorrow'; return `${diff}d`; };
  const getBadgeStyle = (d: string) => { const diff = Math.ceil((new Date(d).getTime() - now.getTime()) / 86400000); if (diff < 0) return 'bg-red-100 text-red-700'; if (diff <= 1) return 'bg-orange-100 text-orange-700'; return 'bg-white/90 text-gray-700'; };

  const getVideoThumbnail = (url?: string, thumbnailUrl?: string) => { if (thumbnailUrl) return thumbnailUrl; if (!url) return null; const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/); return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null; };

  // Quick stats
  const dueThisWeek = assignments.filter(a => { const d = new Date(a.dueDate); return d >= now && d <= new Date(now.getTime() + 7 * 86400000) && !a.isSubmitted; }).length;
  const submitted = assignments.filter(a => a.isSubmitted).length;

  return (
    <StudentRoute>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&family=Oswald:wght@300;700&display=swap" rel="stylesheet" />

      {/* ===== WIDE SCREEN LAYOUT (iPad/Desktop) ===== */}
      {isWide ? (
        <div className="h-full flex flex-col overflow-hidden bg-white">
          {/* Quick Stats Row */}
          <div className="flex items-center gap-4 px-6 py-3 shrink-0 border-b border-gray-100">
            <h1 className="text-lg font-bold uppercase text-[#005587]" style={{ fontFamily: "'Oswald', sans-serif" }}>Dashboard</h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="bg-blue-50 text-[#005587] px-3 py-1 rounded-full font-medium">📋 {dueThisWeek} due this week</span>
              <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">✅ {submitted} submitted</span>
            </div>
          </div>

          {/* Two Column Grid */}
          <div className="flex-1 grid grid-cols-[55fr_45fr] gap-5 p-5 min-h-0 overflow-hidden">
            {/* Left Column — Assignments */}
            <div className="flex flex-col min-h-0 bg-gray-50 rounded-2xl overflow-hidden">
              <div className="px-4 pt-3 pb-2 shrink-0 flex items-center justify-between">
                <h2 className="text-base font-bold uppercase text-[#005587]" style={{ fontFamily: "'Oswald', sans-serif" }}>Assignments</h2>
                <button onClick={() => router.push('/student/assignments')} className="text-xs text-[#005587] font-medium">View All →</button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-2">
                {displayAssignments.length > 0 ? displayAssignments.map((a) => (
                  <div key={a.assignmentId} onClick={() => router.push(`/student/assignments/${a.assignmentId}`)} className="rounded-xl p-4 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform" style={{ backgroundColor: getAssignmentColor(a.assignmentId) }}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold uppercase truncate" style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em', color: getAssignmentTitleColor(a.assignmentId) }}>{a.title}</h3>
                        <p className="text-xs mt-0.5 opacity-70" style={{ color: getAssignmentTitleColor(a.assignmentId) }}>{a.courseName || ''} {a.maxScore ? `• ${a.maxScore} pts` : ''}</p>
                      </div>
                      <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ml-3 shrink-0 ${getBadgeStyle(a.dueDate)}`}>{getDueBadge(a.dueDate)}</span>
                    </div>
                  </div>
                )) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No assignments 🎉</div>}
              </div>
            </div>

            {/* Right Column — Recent Videos */}
            <div className="flex flex-col min-h-0 bg-gray-50 rounded-2xl overflow-hidden">
              <div className="px-4 pt-3 pb-2 shrink-0">
                <h2 className="text-base font-bold uppercase text-[#005587]" style={{ fontFamily: "'Oswald', sans-serif" }}>Recent Videos</h2>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-3">
                {feed.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {feed.slice(0, 8).map(item => (
                      <div key={item.id} className="flex flex-col cursor-pointer hover:scale-[1.01] transition-transform" onClick={() => router.push(`/student/assignments/${item.assignmentId}/feed?videoId=${item.id}`)}>
                        {/* Author */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-8 h-8 rounded-full border-2 border-[#FFC72C] overflow-hidden bg-gray-300 shrink-0">
                            {item.author?.avatar && item.author.avatar.startsWith('http') ? (
                              <img src={item.author.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-[#005587] flex items-center justify-center text-white text-[10px] font-bold">{(item.author?.name || '?')[0]}</div>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-gray-900 truncate">{item.author?.name || 'Student'}</span>
                        </div>
                        {/* Thumbnail */}
                        <div className="relative rounded-xl overflow-hidden bg-gray-800 aspect-[4/5]">
                          {(() => { const ytThumb = getVideoThumbnail(item.videoUrl, item.thumbnailUrl); return ytThumb ? <img src={ytThumb} alt="" className="w-full h-full object-cover" /> : item.videoUrl ? <video src={item.videoUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" /> : <div className="w-full h-full bg-gradient-to-br from-[#005587] to-[#0077aa] flex items-center justify-center"><svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>; })()}
                          <div className="absolute inset-0 flex items-center justify-center"><div className="w-9 h-9 bg-white/80 rounded-full flex items-center justify-center shadow"><svg className="w-4 h-4 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div></div>
                        </div>
                        {/* Title */}
                        <p className="text-xs text-gray-900 truncate font-medium uppercase mt-1.5" style={{ fontFamily: "'Oswald', sans-serif" }}>{item.title || 'Video'}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                          <span>⭐ {item.likes || 0}</span>
                          <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <svg key={s} className={`w-2.5 h-2.5 ${s <= (item.rating || 0) ? 'text-[#FFC72C]' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No videos yet</div>}
              </div>
            </div>
          </div>
        </div>
      ) : (
      /* ===== MOBILE LAYOUT (existing) ===== */
      <div className="h-full flex flex-col overflow-hidden bg-white" style={{ maxHeight: '100%', overflowY: 'hidden', touchAction: 'pan-x', overscrollBehavior: 'none' }}>
        {loading ? (
          <DashboardSkeleton />
        ) : (
        <>
        {/* Quick Stats Row - replaces greeting */}
        <div className="flex items-center gap-3 px-4 py-1.5 shrink-0">
          <div className="flex-1 flex items-center gap-2 text-[11px]">
            <span className="bg-blue-50 text-[#005587] px-2 py-0.5 rounded-full font-medium">📋 {dueThisWeek} due this week</span>
            <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">✅ {submitted} submitted</span>
          </div>
        </div>

        {/* TOP HALF - Assignments (40% of space) */}
        <div className="flex-[2] flex flex-col min-h-0 overflow-hidden">
          {/* Divider line above section */}
          <div className="h-px bg-gray-200 mx-4 shrink-0" />
          {/* Grey rounded container */}
          <div className="mx-3 mt-2 flex-1 flex flex-col min-h-0 bg-gray-100 rounded-2xl overflow-hidden">
            <div className="px-3 pt-2.5 pb-1 shrink-0">
              <h2 className="text-base font-bold uppercase text-[#005587] tracking-normal" style={{ fontFamily: "'Oswald', sans-serif" }}>Assignments</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-3 space-y-1.5 min-h-0 pb-1.5">
              {displayAssignments.length > 0 ? displayAssignments.map((a, i) => (
                <div key={a.assignmentId} onClick={() => { const id = a.assignmentId || (a as any).id; if (id) router.push(`/student/assignments/${id}`); }} className="rounded-xl p-3.5 cursor-pointer active:scale-[0.98] transition-transform" style={{ backgroundColor: getAssignmentColor(a.assignmentId) }}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold uppercase truncate" style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em', color: getAssignmentTitleColor(a.assignmentId) }}>{a.title}</h3>
                      <p className="text-xs mt-0.5 opacity-70" style={{ color: getAssignmentTitleColor(a.assignmentId) }}>{a.courseName || ''} {a.maxScore ? `• ${a.maxScore} pts` : ''}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ml-2 shrink-0 ${getBadgeStyle(a.dueDate)}`}>{getDueBadge(a.dueDate)}</span>
                  </div>
                </div>
              )) : <div className="flex items-center justify-center h-full text-gray-400 text-xs">No assignments 🎉</div>}
            </div>
            <div className="px-3 py-0.5 shrink-0">
              <button onClick={() => router.push('/student/assignments')} className="w-full text-center text-[11px] text-[#005587] font-medium py-0.5">View All →</button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 mx-4 shrink-0 mt-2" />

        {/* BOTTOM HALF - Recent Videos */}
        <div className="flex-[3] flex flex-col min-h-0 overflow-hidden pb-16">
          <div className="px-4 pt-2 pb-1 shrink-0">
            <h2 className="text-base font-bold uppercase text-[#005587] tracking-normal" style={{ fontFamily: "'Oswald', sans-serif" }}>Recent Videos</h2>
          </div>
          <div className="flex-1 overflow-hidden px-4 min-h-0">
            {feed.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto h-full items-start pt-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                {feed.slice(0, 10).map(item => {
                  const ytThumb = getVideoThumbnail(item.videoUrl, item.thumbnailUrl);
                  const isEmojiAvatar = item.author?.avatar && item.author.avatar.length <= 4 && !item.author.avatar.startsWith('http');
                  const hasImageAvatar = item.author?.avatar && item.author.avatar.startsWith('http');
                  return (
                    <div key={item.id} className="shrink-0 w-44 h-full flex flex-col cursor-pointer" onClick={() => router.push(`/student/assignments/${item.assignmentId}/feed?videoId=${item.id}`)}>
                      {/* Video thumbnail with overlay info */}
                      <div className="relative rounded-xl overflow-hidden flex-1 bg-gray-800">
                        {ytThumb ? <img src={ytThumb} alt="" className="w-full h-full object-cover" /> : item.videoUrl ? <video src={item.videoUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" onLoadedMetadata={e => { (e.target as HTMLVideoElement).currentTime = 3; }} /> : <div className="w-full h-full bg-gradient-to-br from-[#005587] to-[#0077aa] flex items-center justify-center"><svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>}
                        {/* Play button */}
                        <div className="absolute inset-0 flex items-center justify-center"><div className="w-11 h-11 bg-white/80 rounded-full flex items-center justify-center shadow-lg"><svg className="w-5 h-5 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div></div>
                        {/* Overlay info at bottom of thumbnail */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 pt-8">
                          {/* Author */}
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-[#005587] border-[1.5px] border-[#FFC72C] flex items-center justify-center shrink-0 overflow-hidden">
                              {isEmojiAvatar ? (
                                <span className="text-sm">{item.author!.avatar}</span>
                              ) : hasImageAvatar ? (
                                <img src={item.author!.avatar!} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white text-[9px] font-bold">{(item.author?.name || 'S')[0].toUpperCase()}</span>
                              )}
                            </div>
                            <span className="text-[11px] text-white font-medium truncate">{item.author?.name || 'Student'}</span>
                          </div>
                          {/* Title + stars */}
                          <p className="text-xs text-white truncate font-medium mt-1 uppercase" style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '0.03em' }}>{item.title || 'Video'}</p>
                          <div className="flex items-center gap-2 text-[10px] text-white/70 mt-0.5">
                            <span>⭐ {item.likes || 0}</span>
                            <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <svg key={s} className={`w-2.5 h-2.5 ${s <= (item.rating || 0) ? 'text-[#FFC72C]' : 'text-white/30'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No videos yet</div>}
          </div>
        </div>

        {/* Bottom Nav */}
        </>
        )}
        <StudentTabBar />
      </div>
      )}

      {/* Post Modal */}
      <ModalTransition isOpen={showAssignmentPicker} onClose={() => { setShowAssignmentPicker(false); setPostMode(null); setSelectedPostAssignment(null); }}>
          <div className="bg-white w-full rounded-2xl p-4 max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">
                {!selectedPostAssignment ? 'Select Assignment' : 'How do you want to post?'}
              </h3>
              <button onClick={() => { setShowAssignmentPicker(false); setPostMode(null); setSelectedPostAssignment(null); }} className="text-gray-400 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Step 1: Choose Assignment */}
            {!selectedPostAssignment && (
              <div className="overflow-y-auto flex-1 space-y-2">
                {unsubmitted.length > 0 ? unsubmitted.map(a => (
                  <button
                    key={a.assignmentId}
                    onClick={() => setSelectedPostAssignment(a.assignmentId)}
                    className="w-full text-left rounded-xl p-3 active:scale-[0.98] transition-transform"
                    style={{ backgroundColor: getAssignmentColor(a.assignmentId) }}
                  >
                    <h4 className="text-base font-bold uppercase truncate" style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em', color: getAssignmentTitleColor(a.assignmentId) }}>{a.title}</h4>
                    <p className="text-xs opacity-70" style={{ color: getAssignmentTitleColor(a.assignmentId) }}>{a.courseName || ''} • Due {getDueBadge(a.dueDate)}</p>
                  </button>
                )) : (
                  <p className="text-center text-gray-400 text-sm py-4">No unsubmitted assignments</p>
                )}
              </div>
            )}

            {/* Step 2: Choose method */}
            {selectedPostAssignment && !postMode && (
              <div className="space-y-3">
                <button
                  onClick={() => { setShowAssignmentPicker(false); setSelectedPostAssignment(null); router.push(`/student/record?assignmentId=${selectedPostAssignment}&mode=record`); }}
                  className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-[#005587] to-[#0088cc] text-white rounded-xl active:scale-[0.98] transition-transform"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Record Live</p>
                    <p className="text-xs text-white/70">Open camera and record</p>
                  </div>
                </button>
                <button
                  onClick={() => { setShowAssignmentPicker(false); postFileInputRef.current?.click(); }}
                  className="w-full flex items-center gap-3 p-4 bg-gray-100 text-gray-900 rounded-xl active:scale-[0.98] transition-transform"
                >
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Upload a File</p>
                    <p className="text-xs text-gray-500">Choose from your device</p>
                  </div>
                </button>
                <button
                  onClick={() => setPostMode('link')}
                  className="w-full flex items-center gap-3 p-4 bg-gray-100 text-gray-900 rounded-xl active:scale-[0.98] transition-transform"
                >
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Paste a Link</p>
                    <p className="text-xs text-gray-500">YouTube or Google Drive</p>
                  </div>
                </button>
                <button onClick={() => setSelectedPostAssignment(null)} className="w-full text-center text-xs text-[#005587] font-medium py-2 mt-1">← Back to assignments</button>
              </div>
            )}

            {/* Step 3: Link input inline */}
            {selectedPostAssignment && postMode === 'link' && (
              <div className="space-y-3">
                <input
                  type="url"
                  autoFocus
                  placeholder="Paste YouTube or Google Drive link..."
                  value={postLinkUrl}
                  onChange={(e) => { setPostLinkUrl(e.target.value); setPostLinkError(''); }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#005587] focus:ring-1 focus:ring-[#005587]"
                />
                {postLinkError && <p className="text-red-500 text-xs">{postLinkError}</p>}
                <button
                  onClick={async () => {
                    if (!postLinkUrl.trim()) { setPostLinkError('Please paste a link'); return; }
                    if (!user?.id) { setPostLinkError('Not logged in'); return; }
                    setPostLinkSubmitting(true);
                    setPostLinkError('');
                    try {
                      // Fetch assignment to get courseId
                      const aRes = await fetch(`/api/assignments/${selectedPostAssignment}`);
                      const aData = aRes.ok ? await aRes.json() : null;
                      const courseId = aData?.data?.assignment?.courseId || aData?.assignment?.courseId;
                      
                      const isYT = postLinkUrl.includes('youtube.com') || postLinkUrl.includes('youtu.be');
                      const isGD = postLinkUrl.includes('drive.google');
                      const res = await fetch('/api/video-submissions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          studentId: user.id,
                          assignmentId: selectedPostAssignment,
                          courseId,
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
                        setShowAssignmentPicker(false);
                        setPostMode(null);
                        setSelectedPostAssignment(null);
                        setPostLinkUrl('');
                        // Refresh data
                        queryClient.invalidateQueries({ queryKey: ['student-feed'] });
                      } else {
                        setPostLinkError(data?.error || `Failed (${res.status})`);
                      }
                    } catch (err: any) {
                      setPostLinkError(err?.message || 'Network error');
                    }
                    setPostLinkSubmitting(false);
                  }}
                  disabled={postLinkSubmitting || !postLinkUrl.trim()}
                  className="w-full py-3 bg-[#005587] text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {postLinkSubmitting ? 'Submitting...' : 'Submit Link'}
                </button>
                <button onClick={() => { setPostMode(null); setPostLinkUrl(''); setPostLinkError(''); }} className="w-full text-center text-xs text-[#005587] font-medium py-2">← Back</button>
              </div>
            )}
          </div>
      </ModalTransition>

      {/* Hidden file input for upload from modal */}
      <input
        ref={postFileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file || !selectedPostAssignment) return;
          // Navigate to record page with file — since we can't pass files between pages,
          // navigate to record page in upload mode (it will auto-open file picker there too)
          router.push(`/student/record?assignmentId=${selectedPostAssignment}&mode=upload`);
          setSelectedPostAssignment(null);
        }}
      />
    </StudentRoute>
  );
}
