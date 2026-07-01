'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { getAssignmentColor, getAssignmentTitleColor } from '@/lib/assignmentColors';
import { isScreenshotMode, getDemoAssignments, getDemoFeed, DEMO_STUDENT } from '@/lib/demo-screenshot-data';
import { useIsWideScreen } from '@/hooks/useIsWideScreen';
import { StudentTabBar } from '@/components/student/StudentTabBar';

interface Assignment { assignmentId: string; title: string; courseName?: string; courseInitials?: string; dueDate: string; maxScore?: number; isSubmitted?: boolean; createdAt?: string; }
interface FeedItem { id: string; type?: string; title?: string; videoUrl?: string; author?: { name?: string; avatar?: string; id?: string }; rating?: number; likes?: number; comments?: number; assignmentId?: string; }

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignmentPicker, setShowAssignmentPicker] = useState(false);
  const [postMode, setPostMode] = useState<'record' | 'upload' | 'link' | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const { isWide } = useIsWideScreen();

  useEffect(() => {
    if (user?.id) { fetchAssignments(); fetchFeed(); }
  }, [user?.id, user?.isDemoUser]);

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

  const fetchAssignments = async () => {
    try {
      const res = await fetch(`/api/student/assignments?userId=${user?.id}`);
      if (res.ok) { const data = await res.json(); setAssignments(data.assignments || []); }
    } catch {} finally { setLoading(false); }
  };

  const fetchFeed = async () => {
    try {
      const res = await fetch(`/api/student/feed?userId=${user?.id}`);
      if (res.ok) { const data = await res.json(); setFeed((data.feed || []).filter((f: FeedItem) => f.type === 'video')); }
    } catch {}
  };

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

  const getVideoThumbnail = (url?: string) => { if (!url) return null; const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/); return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null; };

  // Quick stats
  const dueThisWeek = assignments.filter(a => { const d = new Date(a.dueDate); return d >= now && d <= new Date(now.getTime() + 7 * 86400000) && !a.isSubmitted; }).length;
  const submitted = assignments.filter(a => a.isSubmitted).length;

  return (
    <StudentRoute>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&family=Oswald:wght@300;700&display=swap" rel="stylesheet" />

      {/* ===== WIDE SCREEN LAYOUT (iPad/Desktop) ===== */}
      {isWide ? (
        <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-[#e8f4f8] via-white to-[#f0f9fc]">
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
                          {(() => { const ytThumb = getVideoThumbnail(item.videoUrl); return ytThumb ? <img src={ytThumb} alt="" className="w-full h-full object-cover" /> : item.videoUrl ? <video src={item.videoUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" /> : <div className="w-full h-full bg-gradient-to-br from-[#005587] to-[#0077aa] flex items-center justify-center"><svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>; })()}
                          <div className="absolute inset-0 flex items-center justify-center"><div className="w-9 h-9 bg-white/80 rounded-full flex items-center justify-center shadow"><svg className="w-4 h-4 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div></div>
                        </div>
                        {/* Title */}
                        <p className="text-xs text-gray-900 truncate font-medium uppercase mt-1.5" style={{ fontFamily: "'Oswald', sans-serif" }}>{item.title || 'Video'}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                          <span>❤️ {item.likes || 0}</span>
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
      <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-[#e8f4f8] via-white to-[#f0f9fc]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-2 pb-1 shrink-0">
          <div className="flex items-center gap-1">
            <span style={{ fontFamily: "'Grand Hotel', cursive", color: '#005587' }} className="text-2xl">ClassCast</span>
            <img src="/UpdatedCCLogo.png" alt="" className="w-9 h-9 object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/student/courses')} className="p-1"><svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
            <img src={user?.isDemoUser ? "/Demo1Logo.png" : "/CristoReyLogo.png"} alt="" className="w-12 h-12 object-contain" />
          </div>
        </div>

        {/* Quick Stats Row - replaces greeting */}
        <div className="flex items-center gap-3 px-4 py-1.5 shrink-0">
          <div className="flex-1 flex items-center gap-2 text-[11px]">
            <span className="bg-blue-50 text-[#005587] px-2 py-0.5 rounded-full font-medium">📋 {dueThisWeek} due this week</span>
            <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">✅ {submitted} submitted</span>
          </div>
        </div>

        {/* TOP HALF - Assignments */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
            <div className="px-3 py-1.5 shrink-0">
              <button onClick={() => router.push('/student/assignments')} className="w-full text-center text-[11px] text-[#005587] font-medium py-1">View All →</button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 mx-4 shrink-0 mt-2" />

        {/* BOTTOM HALF - Recent Videos */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-4 pt-2 pb-1 shrink-0">
            <h2 className="text-base font-bold uppercase text-[#005587] tracking-normal" style={{ fontFamily: "'Oswald', sans-serif" }}>Recent Videos</h2>
          </div>
          <div className="flex-1 overflow-hidden px-4 pb-1 min-h-0">
            {feed.length > 0 ? (
              <div className="flex gap-3.5 overflow-x-auto h-full items-start pt-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                {feed.slice(0, 10).map(item => {
                  const ytThumb = getVideoThumbnail(item.videoUrl);
                  return (
                    <div key={item.id} className="shrink-0 w-44 h-full flex flex-col cursor-pointer" onClick={() => router.push(`/student/assignments/${item.assignmentId}/feed?videoId=${item.id}`)}>
                      {/* Author above video */}
                      <div className="flex items-center gap-2 mb-1.5 shrink-0">
                        <div className="w-10 h-10 rounded-full border-2 border-[#FFC72C] overflow-hidden bg-gray-300 shrink-0">
                          {item.author?.avatar && item.author.avatar.startsWith('http') ? (
                            <img src={item.author.avatar} alt="" className="w-full h-full object-cover" />
                          ) : item.author?.avatar && item.author.avatar.length <= 4 ? (
                            <div className="w-full h-full bg-[#005587] flex items-center justify-center text-lg">{item.author.avatar}</div>
                          ) : (
                            <div className="w-full h-full bg-[#005587] flex items-center justify-center text-white text-xs font-bold">{(item.author?.name || '?')[0]}</div>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-gray-900 truncate">{item.author?.name || 'Student'}</span>
                      </div>
                      {/* Video thumbnail - taller */}
                      <div className="relative rounded-xl overflow-hidden flex-1 bg-gray-800 min-h-[140px]">
                        {ytThumb ? <img src={ytThumb} alt="" className="w-full h-full object-cover" /> : item.videoUrl ? <video src={item.videoUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" onLoadedMetadata={e => { (e.target as HTMLVideoElement).currentTime = 3; }} /> : <div className="w-full h-full bg-gradient-to-br from-[#005587] to-[#0077aa] flex items-center justify-center"><svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>}
                        <div className="absolute inset-0 flex items-center justify-center"><div className="w-11 h-11 bg-white/80 rounded-full flex items-center justify-center shadow-lg"><svg className="w-5 h-5 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div></div>
                      </div>
                      {/* Title + likes below */}
                      <div className="mt-1.5 shrink-0">
                        <p className="text-sm text-gray-900 truncate font-medium uppercase" style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '0.03em' }}>{item.title || 'Video'}</p>
                        <div className="flex items-center gap-2.5 text-xs text-gray-500 mt-0.5">
                          <span>❤️ {item.likes || 0}</span>
                          <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <svg key={s} className={`w-3 h-3 ${s <= (item.rating || 0) ? 'text-[#FFC72C]' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>)}</div>
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
        <StudentTabBar onPostClick={() => setShowAssignmentPicker(true)} />
      </div>
      )}

      {/* Post Modal */}
      {showAssignmentPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setShowAssignmentPicker(false); setPostMode(null); }}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white w-full max-w-[380px] mx-4 rounded-2xl p-4 max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">
                {!postMode ? 'Post a Video' : 'Select Assignment'}
              </h3>
              <button onClick={() => { setShowAssignmentPicker(false); setPostMode(null); }} className="text-gray-400 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Step 1: Choose Record, Upload, or Link */}
            {!postMode && (
              <div className="space-y-3">
                <button
                  onClick={() => setPostMode('record')}
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
                  onClick={() => setPostMode('upload')}
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
                    <p className="text-xs text-gray-500">YouTube or Google Drive URL</p>
                  </div>
                </button>
              </div>
            )}

            {/* Step 2: Choose Assignment */}
            {postMode && (
              <div className="overflow-y-auto flex-1 space-y-2">
                <p className="text-xs text-gray-500 mb-2">Choose which assignment to post to:</p>
                {unsubmitted.length > 0 ? unsubmitted.map(a => (
                  <button
                    key={a.assignmentId}
                    onClick={() => {
                      setShowAssignmentPicker(false);
                      setPostMode(null);
                      if (postMode === 'record') {
                        router.push(`/student/record?assignmentId=${a.assignmentId}&mode=record`);
                      } else if (postMode === 'upload') {
                        router.push(`/student/record?assignmentId=${a.assignmentId}&mode=upload`);
                      } else {
                        router.push(`/student/record?assignmentId=${a.assignmentId}`);
                      }
                    }}
                    className="w-full text-left rounded-xl p-3 active:scale-[0.98] transition-transform"
                    style={{ backgroundColor: getAssignmentColor(a.assignmentId) }}
                  >
                    <h4 className="text-base font-bold uppercase truncate" style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em', color: getAssignmentTitleColor(a.assignmentId) }}>{a.title}</h4>
                    <p className="text-xs opacity-70" style={{ color: getAssignmentTitleColor(a.assignmentId) }}>{a.courseName || ''} • Due {getDueBadge(a.dueDate)}</p>
                  </button>
                )) : (
                  <p className="text-center text-gray-400 text-sm py-4">No unsubmitted assignments</p>
                )}
                <button onClick={() => setPostMode(null)} className="w-full text-center text-xs text-[#005587] font-medium py-2 mt-2">← Back</button>
              </div>
            )}
          </div>
        </div>
      )}
    </StudentRoute>
  );
}
