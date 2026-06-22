'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { getAssignmentColor } from '@/lib/assignmentColors';

interface Assignment { assignmentId: string; title: string; courseName?: string; courseInitials?: string; dueDate: string; maxScore?: number; isSubmitted?: boolean; createdAt?: string; }
interface FeedItem { id: string; type?: string; title?: string; videoUrl?: string; author?: { name?: string; avatar?: string; id?: string }; rating?: number; likes?: number; comments?: number; assignmentId?: string; }

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignmentPicker, setShowAssignmentPicker] = useState(false);

  useEffect(() => {
    if (user?.id) { fetchAssignments(); fetchFeed(); }
  }, [user?.id]);

  const fetchAssignments = async () => {
    try {
      const res = await fetch(`/api/student/assignments?userId=${user?.id}`);
      if (res.ok) { const data = await res.json(); setAssignments(data.assignments || []); }
    } catch {} finally { setLoading(false); }
  };

  const fetchFeed = async () => {
    try {
      const res = await fetch(`/api/student/feed?userId=${user?.id}&includeAllPublic=true`);
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
  }).filter(a => !a.isSubmitted).slice(0, 3);
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
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap" rel="stylesheet" />

      <div className="h-full flex flex-col overflow-hidden bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-2 pb-1 shrink-0">
          <div className="flex items-center gap-1">
            <span style={{ fontFamily: "'Grand Hotel', cursive", color: '#005587' }} className="text-2xl">ClassCast</span>
            <img src="/UpdatedCCLogo.png" alt="" className="w-9 h-9 object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/student/courses')} className="p-1"><svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
            <img src="/CRAJSmallLogo.png" alt="" className="w-8 h-8 object-contain" />
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
          <div className="px-4 pt-1 pb-0.5 shrink-0">
            <h2 className="text-sm font-bold text-gray-900">Assignments</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 space-y-1.5 min-h-0 pb-1">
            {displayAssignments.length > 0 ? displayAssignments.map((a, i) => (
              <div key={a.assignmentId} onClick={() => { const id = a.assignmentId || (a as any).id; if (id) router.push(`/student/assignments/${id}`); }} className={`rounded-xl p-3.5 cursor-pointer active:scale-[0.98] transition-transform ${getAssignmentColor(a.assignmentId)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#005587] text-sm font-bold uppercase truncate">{a.title}</h3>
                    <p className="text-[#005587]/60 text-xs mt-0.5">{a.courseName || ''} {a.maxScore ? `• ${a.maxScore} pts` : ''}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ml-2 shrink-0 ${getBadgeStyle(a.dueDate)}`}>{getDueBadge(a.dueDate)}</span>
                </div>
              </div>
            )) : <div className="flex items-center justify-center h-full text-gray-400 text-xs">No assignments 🎉</div>}
          </div>
          <div className="px-4 py-1 shrink-0">
            <button onClick={() => router.push('/student/assignments')} className="w-full text-center text-[11px] text-[#005587] font-medium py-1">View All →</button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 mx-4 shrink-0" />

        {/* BOTTOM HALF - Recent Videos */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-4 pt-2 pb-0.5 shrink-0">
            <h2 className="text-sm font-bold text-gray-900">Recent Videos</h2>
          </div>
          <div className="flex-1 overflow-hidden px-4 pb-1 min-h-0">
            {feed.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto h-full items-start pt-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                {feed.slice(0, 10).map(item => {
                  const ytThumb = getVideoThumbnail(item.videoUrl);
                  return (
                    <div key={item.id} className="shrink-0 w-36 h-full flex flex-col cursor-pointer" onClick={() => router.push(`/student/assignments/${item.assignmentId}/feed?videoId=${item.id}`)}>
                      {/* Author above video */}
                      <div className="flex items-center gap-1.5 mb-1 shrink-0">
                        <div className="w-9 h-9 rounded-full border-2 border-[#FFC72C] overflow-hidden bg-gray-300 shrink-0">
                          {item.author?.avatar && !item.author.avatar.includes('placeholder') ? (
                            <img src={item.author.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[#005587] flex items-center justify-center text-white text-[10px] font-bold">{(item.author?.name || '?')[0]}</div>
                          )}
                        </div>
                        <span className="text-xs font-medium text-gray-800 truncate">{item.author?.name || 'Student'}</span>
                      </div>
                      {/* Video thumbnail */}
                      <div className="relative rounded-lg overflow-hidden flex-1 bg-gray-800">
                        {ytThumb ? <img src={ytThumb} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-[#005587] to-[#0077aa] flex items-center justify-center"><svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>}
                        <div className="absolute inset-0 flex items-center justify-center"><div className="w-9 h-9 bg-white/80 rounded-full flex items-center justify-center shadow"><svg className="w-4 h-4 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div></div>
                      </div>
                      {/* Title + likes below */}
                      <div className="mt-1 shrink-0">
                        <p className="text-[10px] text-gray-700 truncate font-medium">{item.title || 'Video'}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                          <span>❤️ {item.likes || 0}</span>
                          <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <svg key={s} className={`w-2.5 h-2.5 ${s <= (item.rating || 0) ? 'text-[#FFC72C]' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <div className="flex items-center justify-center h-full text-gray-400 text-xs">No videos yet</div>}
          </div>
        </div>

        {/* Bottom Nav - 3 buttons: Courses | + | Profile */}
        <nav className="shrink-0 bg-white border-t border-gray-200 px-2 py-2">
          <div className="flex items-center justify-around">
            <button className="flex flex-col items-center" onClick={() => router.push('/student/courses')}><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg><span className="text-[10px] text-gray-400">Courses</span></button>
            <button onClick={() => setShowAssignmentPicker(true)} className="-mt-6"><div className="w-14 h-14 bg-gradient-to-br from-[#005587] to-[#0088cc] rounded-full flex items-center justify-center shadow-xl border-4 border-white ring-2 ring-[#FFC72C]"><svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg></div></button>
            <button className="flex flex-col items-center" onClick={() => router.push('/student/profile')}><div className="w-7 h-7 rounded-full border-2 border-[#FFC72C] overflow-hidden"><img src="/headshot.jpeg" alt="" className="w-full h-full object-cover" /></div><span className="text-[10px] text-gray-400 mt-0.5">Profile</span></button>
          </div>
        </nav>
      </div>

      {/* Assignment Picker Modal */}
      {showAssignmentPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowAssignmentPicker(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white w-full max-w-[380px] mx-4 rounded-2xl p-4 max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">Record for which assignment?</h3>
              <button onClick={() => setShowAssignmentPicker(false)} className="text-gray-400 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-2">
              {unsubmitted.length > 0 ? unsubmitted.map(a => (
                <button
                  key={a.assignmentId}
                  onClick={() => { setShowAssignmentPicker(false); router.push(`/student/record?assignmentId=${a.assignmentId}`); }}
                  className={`w-full text-left rounded-xl p-3 ${getAssignmentColor(a.assignmentId)} active:scale-[0.98] transition-transform`}
                >
                  <h4 className="text-[#005587] text-sm font-bold truncate">{a.title}</h4>
                  <p className="text-[#005587]/60 text-xs">{a.courseName || ''} • Due {getDueBadge(a.dueDate)}</p>
                </button>
              )) : (
                <p className="text-center text-gray-400 text-sm py-4">No unsubmitted assignments</p>
              )}
            </div>
          </div>
        </div>
      )}
    </StudentRoute>
  );
}
