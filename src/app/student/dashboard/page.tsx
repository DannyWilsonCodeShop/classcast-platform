'use client';

import React, { useState, useEffect } from 'react';
import { useTransitionRouter as useRouter } from '@/hooks/useTransitionRouter';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { getAssignmentColor, getAssignmentTitleColor } from '@/lib/assignmentColors';
import { isScreenshotMode, getDemoAssignments, getDemoFeed, DEMO_STUDENT } from '@/lib/demo-screenshot-data';
import { useIsWideScreen } from '@/hooks/useIsWideScreen';
import { StudentTabBar } from '@/components/student/StudentTabBar';
import { useStudentAssignments, useStudentFeed, Assignment, FeedItem } from '@/hooks/useStudentData';
import { DashboardSkeleton } from '@/components/student/DashboardSkeleton';
import Avatar from '@/components/common/Avatar';
import { useQueryClient } from '@tanstack/react-query';
import ModalTransition from '@/components/transitions/ModalTransition';

const heading = 'font-[family-name:var(--font-fredoka)]';

const getVideoThumbnail = (url?: string, thumbnailUrl?: string) => {
  // Don't return video URLs as image thumbnails
  if (thumbnailUrl && !thumbnailUrl.includes('placeholder') && !thumbnailUrl.endsWith('.mp4') && !thumbnailUrl.endsWith('.webm') && !thumbnailUrl.endsWith('.mov') && !thumbnailUrl.includes('/videos/')) return thumbnailUrl;
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
};

const PlayButton = ({ size }: { size: number }) => (
  <span className="rounded-full bg-white/90 shadow-lg flex items-center justify-center" style={{ width: size, height: size }} aria-hidden="true">
    <svg style={{ width: size * 0.45, height: size * 0.45, marginLeft: size * 0.05 }} className="text-[#0065a3]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
  </span>
);

interface VideoTileProps {
  item: FeedItem;
  onOpen: (item: FeedItem) => void;
  className?: string;
  featured?: boolean;
  compact?: boolean;
}

/** Video card. Uses the thumbnail image when there is one; otherwise <video preload="none"> (never downloads). */
function VideoTile({ item, onOpen, className = '', featured, compact }: VideoTileProps) {
  const thumb = getVideoThumbnail(item.videoUrl, item.thumbnailUrl);
  const authorName = item.author?.name || 'Student';
  const title = item.title || 'Video';
  const isNew = !!item.timestamp && Date.now() - new Date(item.timestamp).getTime() < 86400000 && Date.now() >= new Date(item.timestamp).getTime();
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      aria-label={`Watch ${title} by ${authorName}`}
      className={`group relative block overflow-hidden bg-[#14507a] text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0065a3]/50 ${featured ? 'rounded-3xl shadow-[0_6px_20px_rgba(11,37,64,0.12)]' : 'rounded-2xl'} ${className}`}
    >
      {thumb ? (
        <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : item.videoUrl ? (
        <video src={item.videoUrl} className="absolute inset-0 w-full h-full object-cover" muted playsInline preload="none" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b2540] via-[#14507a] to-[#2b8fd0]" />
      )}
      <span className="absolute inset-0 flex items-center justify-center transition-transform group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
        <PlayButton size={featured ? 68 : compact ? 32 : 40} />
      </span>
      {featured && (
        <>
          <span className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/75 to-transparent" aria-hidden="true" />
          {isNew && (
            <span className="absolute top-4 left-4 rounded-full bg-[#FFC72C] px-3 py-1 text-xs font-extrabold text-[#0b2540]">NEW TODAY</span>
          )}
          <span className="absolute left-5 right-5 bottom-4 flex items-end gap-3">
            <Avatar src={item.author?.avatar} name={authorName} size="md" className="!w-10 !h-10 ring-[3px] ring-[#FFC72C] shrink-0" />
            <span className="min-w-0 flex-1">
              <span className={`${heading} block text-xl md:text-[22px] font-bold text-white truncate`}>{title}</span>
              <span className="block text-sm text-white/90 truncate">
                {authorName}{item.courseName ? ` · ${item.courseName}` : ''}
              </span>
            </span>
            <span className="shrink-0 flex items-center gap-4 text-sm font-extrabold text-white">
              <span className="inline-flex items-center gap-1.5" aria-label={`${item.likes || 0} likes`}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7-4.6-9.3-9.1C1.1 8.7 3 5 6.4 5c2 0 3.5 1.2 4.3 2.6h2.6C14.1 6.2 15.6 5 17.6 5 21 5 22.9 8.700 21.300 11.900 19 16.400 12 21 12 21z" /></svg>
                {item.likes || 0}
              </span>
              <span className="inline-flex items-center gap-1.5" aria-label={`${item.comments || 0} comments`}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 4h16v12H8l-4 4V4z" /></svg>
                {item.comments || 0}
              </span>
            </span>
          </span>
        </>
      )}
    </button>
  );
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
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

  // Welcome modal for first-time students
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeCode, setWelcomeCode] = useState('');
  const [welcomeJoining, setWelcomeJoining] = useState(false);
  const [welcomeError, setWelcomeError] = useState('');

  useEffect(() => {
    if (user?.id && user?.role === 'student') {
      const welcomed = localStorage.getItem(`classcast_welcomed_${user.id}`);
      // Only show welcome if never welcomed AND no assignments (means no courses)
      if (!welcomed && assignments.length === 0 && !loading) {
        setShowWelcome(true);
      } else if (welcomed || assignments.length > 0) {
        setShowWelcome(false);
      }
    }
  }, [user?.id, user?.role, assignments.length, loading]);

  const handleWelcomeJoin = async () => {
    if (!welcomeCode.trim() || !user?.id) return;
    setWelcomeJoining(true);
    setWelcomeError('');
    try {
      const res = await fetch('/api/courses/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classCode: welcomeCode.trim(),
          studentId: user.id,
          studentEmail: user.email || '',
          studentFirstName: user.firstName || '',
          studentLastName: user.lastName || '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(`classcast_welcomed_${user.id}`, 'true');
        setShowWelcome(false);
        // Update user context with school branding
        if (data.school?.schoolLogo) {
          updateUser({ schoolName: data.school.schoolName, schoolLogo: data.school.schoolLogo });
        }
        queryClient.invalidateQueries({ queryKey: ['student-courses'] });
        queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
        queryClient.invalidateQueries({ queryKey: ['student-feed'] });
        // Navigate to the course detail page
        const joinedCourseId = data.course?.courseId;
        setTimeout(() => router.push(joinedCourseId ? `/student/courses/${joinedCourseId}` : '/student/assignments'), 1500);
      } else {
        setWelcomeError(data.error || 'Invalid code. Try again.');
      }
    } catch {
      setWelcomeError('Network error. Try again.');
    } finally {
      setWelcomeJoining(false);
    }
  };

  const dismissWelcome = () => {
    if (user?.id) localStorage.setItem(`classcast_welcomed_${user.id}`, 'true');
    setShowWelcome(false);
  };

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

  // Quick stats
  const dueThisWeek = assignments.filter(a => { const d = new Date(a.dueDate); return d >= now && d <= new Date(now.getTime() + 7 * 86400000) && !a.isSubmitted; }).length;
  const submitted = assignments.filter(a => a.isSubmitted).length;

  const firstName = user?.firstName || 'there';
  const sortedFeed = [...feed].sort((a, b) => (b.timestamp ? new Date(b.timestamp).getTime() : 0) - (a.timestamp ? new Date(a.timestamp).getTime() : 0));
  const featured = sortedFeed[0];
  const thumbs = sortedFeed.slice(1, isWide ? 5 : 8);
  const openVideo = (item: FeedItem) => router.push(`/student/assignments/${item.assignmentId}/feed?videoId=${item.id}`);
  const railAssignments = [...displayAssignments]
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const edgeColor = (a: Assignment) => a.assignmentType === 'discussion' ? '#14b8a6' : a.assignmentType === 'assessment' ? '#f59e0b' : '#0065a3';
  const dueTextClass = (d: string) => { const diff = Math.ceil((new Date(d).getTime() - now.getTime()) / 86400000); if (diff < 0) return 'text-red-700'; if (diff <= 1) return 'text-[#b45309]'; return 'text-[#46596c]'; };

  const renderDueSoon = (compact?: boolean) => (
    <div className={`bg-white rounded-[20px] shadow-[0_6px_20px_rgba(11,37,64,0.08)] ${compact ? 'h-full flex flex-col p-3' : 'p-5'}`}>
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
        <h2 className={`${heading} text-lg font-bold text-[#0b2540]`}>Due soon</h2>
        <span className="rounded-full bg-[#eaf3fb] px-3 py-1 text-xs font-extrabold text-[#0065a3]">{dueThisWeek} due this week</span>
      </div>
      <div className={`space-y-3 ${compact ? 'flex-1 min-h-0 overflow-y-auto' : ''}`}>
        {railAssignments.length > 0 ? railAssignments.map((a) => {
          const dp = a.assignmentType === 'discussion' ? a.discussionProgress : null;
          return (
            <button
              key={a.assignmentId}
              type="button"
              onClick={() => { const id = a.assignmentId || (a as any).id; if (id) router.push(`/student/assignments/${id}`); }}
              className="w-full flex gap-3 text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0065a3]"
            >
              <span className="w-1 rounded-full shrink-0" style={{ backgroundColor: edgeColor(a) }} aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-sm font-extrabold text-[#0b2540] truncate">{a.title}</span>
                <span className={`block text-xs font-bold ${dueTextClass(a.dueDate)}`}>
                  {getDueBadge(a.dueDate)}{dp && !dp.legacy && dp.repliesRequired > 0 ? ` · Replies ${Math.min(dp.replyCount, dp.repliesRequired)}/${dp.repliesRequired}` : ''}
                </span>
              </span>
            </button>
          );
        }) : <p className="text-sm text-[#6b7c8c]">No assignments yet</p>}
      </div>
      <div className="mt-4 shrink-0">
        <button
          type="button"
          onClick={() => router.push('/student/assignments')}
          className="w-full h-10 rounded-full border-2 border-[#0065a3] text-sm font-extrabold text-[#0065a3] hover:bg-[#eaf3fb] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0065a3]/30"
        >
          All assignments →
        </button>
        <p className="mt-3 text-[13px] font-extrabold text-[#15803d]">{submitted} submitted so far</p>
      </div>
    </div>
  );

  return (
    <StudentRoute>
      {/* ===== WIDE SCREEN LAYOUT (iPad/Desktop) ===== */}
      {isWide ? (
        <div className="h-full overflow-y-auto bg-[#f4f7fb] font-[family-name:var(--font-nunito)]">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-5 pb-10">
            <h1 className={`${heading} text-[26px] font-bold text-[#0b2540] mb-4`}>
              Hi, {firstName}! See what your class is posting.
            </h1>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_316px] gap-6 items-start">
              {/* Video stage */}
              <section aria-labelledby="recent-videos-h">
                <h2 id="recent-videos-h" className={`${heading} text-[21px] font-bold text-[#0b2540] mb-3`}>Recent Videos</h2>
                {featured ? (
                  <>
                    <VideoTile onOpen={openVideo} item={featured} featured className="w-full aspect-video max-h-[480px]" />
                    {thumbs.length > 0 && (
                      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {thumbs.map(item => (
                          <div key={item.id}>
                            <VideoTile onOpen={openVideo} item={item} className="w-full aspect-[4/3]" />
                            <div className="mt-2 flex items-center gap-2 min-w-0">
                              <Avatar src={item.author?.avatar} name={item.author?.name} size="sm" className="ring-2 ring-[#FFC72C]" />
                              <div className="min-w-0">
                                <p className="text-[13px] font-extrabold text-[#0b2540] truncate">{item.author?.name || 'Student'}</p>
                                <p className="text-xs text-[#6b7c8c] truncate">{item.title || 'Video'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-3xl bg-white border border-[#e3ebf2] py-20 text-center text-[#6b7c8c] text-sm">No videos yet</div>
                )}
              </section>

              {/* Right rail */}
              <aside aria-label="Assignments">
                {renderDueSoon()}
              </aside>
            </div>
          </div>
        </div>
      ) : (
      /* ===== MOBILE LAYOUT ===== */
      <div key={loading ? 'loading' : 'ready'} className="h-full flex flex-col overflow-hidden bg-[#f4f7fb] cc-fade-in font-[family-name:var(--font-nunito)]" style={{ maxHeight: '100%', overflowY: 'hidden', touchAction: 'pan-x', overscrollBehavior: 'none' }}>
        {loading ? (
          <div className="flex-1 bg-[#f4f7fb]" />
        ) : (
        <>
        <div className="px-4 pt-2 pb-2 shrink-0">
          <h1 className={`${heading} text-lg font-bold text-[#0b2540] truncate`}>Hi, {firstName}!</h1>
        </div>

        {/* Videos first: most of the screen */}
        <section aria-labelledby="recent-videos-m" className="flex-[3] flex flex-col min-h-0 px-4">
          <h2 id="recent-videos-m" className={`${heading} text-base font-bold text-[#0b2540] mb-2 shrink-0`}>Recent Videos</h2>
          {featured ? (
            <>
              <VideoTile onOpen={openVideo} item={featured} featured className="w-full flex-1 min-h-[120px]" />
              {thumbs.length > 0 && (
                <div className="flex gap-2 overflow-x-auto mt-2 shrink-0 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                  {thumbs.map(item => (
                    <div key={item.id} className="shrink-0 w-28">
                      <VideoTile onOpen={openVideo} item={item} compact className="w-28 h-20" />
                      <p className="text-[11px] font-extrabold text-[#0b2540] truncate mt-1">{item.author?.name || 'Student'}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center rounded-2xl bg-white border border-[#e3ebf2] text-[#6b7c8c] text-sm">No videos yet</div>
          )}
        </section>

        {/* Compact Due soon */}
        <div className="flex-[2] min-h-0 px-4 pt-3">
          {renderDueSoon(true)}
        </div>
        </>
        )}
        {/* Spacer for fixed tab bar */}
        <div className="shrink-0 h-20" />
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
                    <h4 className="text-base font-semibold text-stone-900 truncate">{a.title}</h4>
                    <p className="text-xs text-stone-500">{a.courseName || ''} • Due {getDueBadge(a.dueDate)}</p>
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
                  className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-[#0065a3] to-[#0088cc] text-white rounded-xl active:scale-[0.98] transition-transform"
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
                <button onClick={() => setSelectedPostAssignment(null)} className="w-full text-center text-xs text-[#0065a3] font-medium py-2 mt-1">← Back to assignments</button>
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#0065a3] focus:ring-1 focus:ring-[#0065a3]"
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
                  className="w-full py-3 bg-[#0065a3] text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {postLinkSubmitting ? 'Submitting...' : 'Submit Link'}
                </button>
                <button onClick={() => { setPostMode(null); setPostLinkUrl(''); setPostLinkError(''); }} className="w-full text-center text-xs text-[#0065a3] font-medium py-2">← Back</button>
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
    {/* Welcome Modal for first-time students */}
    {showWelcome && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/50">
        <div className="bg-white w-full max-w-[380px] rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-[#0065a3]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-lg font-bold text-[#0065a3] mb-1">Welcome to ClassCast!</h2>
          <p className="text-xs text-gray-500 mb-5">Enter your class code to join your first course.</p>

          {welcomeError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{welcomeError}</div>
          )}

          <input
            type="text"
            value={welcomeCode}
            onChange={(e) => { setWelcomeCode(e.target.value.toUpperCase()); setWelcomeError(''); }}
            placeholder="Class code (e.g., ABC1234)"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-center font-mono font-bold tracking-wider focus:border-[#0065a3] focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 mb-4"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleWelcomeJoin()}
          />

          <button
            onClick={handleWelcomeJoin}
            disabled={welcomeJoining || !welcomeCode.trim()}
            className="w-full py-3 bg-[#0065a3] text-white rounded-xl text-sm font-bold hover:bg-[#00517f] transition-colors disabled:opacity-50 mb-3"
          >
            {welcomeJoining ? 'Joining...' : 'Join Course'}
          </button>

          <button
            onClick={dismissWelcome}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Skip for now
          </button>
        </div>
      </div>
    )}
    </StudentRoute>
  );
}
