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
import { useQueryClient } from '@tanstack/react-query';
import ModalTransition from '@/components/transitions/ModalTransition';
import { FramedVideoCard } from '@/components/student/FramedVideoCard';
import { VideoCarousel } from '@/components/student/VideoCarousel';
import { getCardColor } from '@/lib/cardColors';

// Three small cards across on desktop with a peek of the next one.
const SMALL_SLIDE = 'w-[min(78vw,330px)] md:w-[calc((100%-2.5rem)/3-1rem)]';
const heading = 'font-[family-name:var(--font-fredoka)]';

const getVideoThumbnail = (url?: string, thumbnailUrl?: string) => {
  // Don't return video URLs as image thumbnails
  if (thumbnailUrl && !thumbnailUrl.includes('placeholder') && !thumbnailUrl.endsWith('.mp4') && !thumbnailUrl.endsWith('.webm') && !thumbnailUrl.endsWith('.mov') && !thumbnailUrl.includes('/videos/')) return thumbnailUrl;
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
};

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

  // ---- Course scope (courses come from the assignments the student already has) ----
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [chip, setChip] = useState<'all' | 'week' | 'mine'>('all');
  const courseOptions = (() => {
    const m = new Map<string, string>();
    assignments.forEach(a => { if (a.courseId) m.set(a.courseId, a.courseName || 'Course'); });
    return [...m].map(([id, name]) => ({ id, name }));
  })();
  const showCoursePicker = courseOptions.length >= 2;
  const activeCourse = showCoursePicker && courseOptions.some(c => c.id === courseFilter) ? courseFilter : 'all';
  const inCourse = (cid?: string) => activeCourse === 'all' || cid === activeCourse;
  const scoped = assignments.filter(a => inCourse(a.courseId));

  const now = new Date();
  const displayAssignments = [...scoped].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime; // most recently created first
  }).filter(a => !a.isSubmitted).slice(0, isWide ? 6 : 3);
  const unsubmitted = assignments.filter(a => !a.isSubmitted);

  const diffDays = (d: string) => Math.ceil((new Date(d).getTime() - now.getTime()) / 86400000);
  const getDueBadge = (d: string) => { const diff = diffDays(d); if (diff < 0) return `${Math.abs(diff)}d late`; if (diff === 0) return 'Today'; if (diff === 1) return 'Tomorrow'; return `${diff}d`; };
  const dueLine = (d: string) => {
    const diff = diffDays(d);
    if (diff < 0 || diff <= 1) return getDueBadge(d);
    return `Due ${new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`;
  };
  const dueTextClass = (d: string) => { const diff = diffDays(d); if (diff < 0) return 'text-red-700'; if (diff <= 1) return 'text-[#b45309]'; return 'text-[#46596c]'; };

  // Quick stats
  const dueThisWeek = scoped.filter(a => { const d = new Date(a.dueDate); return d >= now && d <= new Date(now.getTime() + 7 * 86400000) && !a.isSubmitted; }).length;
  const submitted = scoped.filter(a => a.isSubmitted).length;

  const firstName = user?.firstName || 'there';
  const sortedFeed = [...feed]
    .filter(f => inCourse(f.courseId))
    .sort((a, b) => (b.timestamp ? new Date(b.timestamp).getTime() : 0) - (a.timestamp ? new Date(a.timestamp).getTime() : 0));
  const isOwn = (f: FeedItem) => !!user?.id && f.author?.id === user.id;
  const videos = sortedFeed.filter(f => {
    if (chip === 'week') return !!f.timestamp && now.getTime() - new Date(f.timestamp).getTime() < 7 * 86400000;
    if (chip === 'mine') return isOwn(f);
    return true;
  });
  const openVideo = (item: FeedItem) => router.push(`/student/assignments/${item.assignmentId}/feed?videoId=${item.id}`);
  const railAssignments = [...displayAssignments]
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const renderCard = (item: FeedItem, large: boolean) => {
    const own = isOwn(item);
    const a = own ? assignments.find(x => x.assignmentId === item.assignmentId) : undefined;
    const gradeLabel = a && typeof a.grade === 'number' ? `Graded ${a.grade}/${a.maxScore ?? 100}` : null;
    return (
      <FramedVideoCard
        key={item.id}
        item={item}
        thumbnail={getVideoThumbnail(item.videoUrl, item.thumbnailUrl)}
        isOwn={own}
        gradeLabel={gradeLabel}
        large={large}
        onOpen={openVideo}
      />
    );
  };

  const chips: { id: 'all' | 'week' | 'mine'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'week', label: 'This week' },
    { id: 'mine', label: 'My videos' },
  ];
  const renderChips = () => (
    <div className="flex items-center gap-2" role="group" aria-label="Filter class videos">
      {chips.map(c => (
        <button
          key={c.id}
          type="button"
          aria-pressed={chip === c.id}
          onClick={() => setChip(c.id)}
          className={`h-8 rounded-full px-4 text-[13px] font-extrabold focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0065a3]/40 ${chip === c.id ? 'bg-[#0065a3] text-white' : 'bg-white text-[#46596c] border border-[#d8e3ec] hover:bg-[#eaf3fb]'}`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );

  const renderCoursePicker = () => showCoursePicker ? (
    <label className="flex items-center gap-3 text-sm font-bold text-[#5b6b7b]">
      Course:
      <span className="relative">
        <select
          value={activeCourse}
          onChange={e => setCourseFilter(e.target.value)}
          className="appearance-none h-10 min-w-[200px] max-w-[320px] rounded-[14px] border border-[#d8e3ec] bg-white pl-4 pr-10 text-[15px] font-extrabold text-[#0b2540] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0065a3]/40"
        >
          <option value="all">All my courses</option>
          {courseOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#46596c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" /></svg>
      </span>
    </label>
  ) : null;

  const recordButton = (
    <button
      type="button"
      onClick={() => setShowAssignmentPicker(true)}
      className="shrink-0 inline-flex items-center gap-2 rounded-full bg-[#FFC72C] hover:bg-[#e6b225] text-[#0b2540] font-extrabold text-[15px] px-5 h-10 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0065a3]/40"
    >
      <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full bg-[#e11d48]" />
      Record video
    </button>
  );

  const duePill = (
    <span className="rounded-full bg-[#eaf3fb] px-3.5 py-1.5 text-[13px] font-extrabold text-[#0065a3]">{dueThisWeek} due this week</span>
  );

  const renderDueSoon = () => (
    <div className="bg-white rounded-[20px] shadow-[0_6px_20px_rgba(11,37,64,0.08)] p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className={`${heading} text-lg font-bold text-[#0b2540]`}>Due soon</h2>
        <button
          type="button"
          onClick={() => router.push('/student/assignments')}
          className="text-[13px] font-extrabold text-[#0065a3] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0065a3]"
        >
          All →
        </button>
      </div>
      <div className="space-y-3">
        {railAssignments.length > 0 ? railAssignments.map((a) => {
          const dp = a.assignmentType === 'discussion' ? a.discussionProgress : null;
          const typeLabel = a.assignmentType === 'discussion' ? 'Discussion' : a.assignmentType === 'assessment' ? 'Assessment' : '';
          return (
            <button
              key={a.assignmentId}
              type="button"
              onClick={() => { const id = a.assignmentId || (a as any).id; if (id) router.push(`/student/assignments/${id}`); }}
              className="w-full flex gap-3 text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0065a3]"
            >
              <span className="w-1 rounded-full shrink-0" style={{ backgroundColor: getCardColor(a.assignmentId).edge }} aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-sm font-extrabold text-[#0b2540] truncate">{a.title}</span>
                <span className={`block text-xs font-bold ${dueTextClass(a.dueDate)}`}>
                  {dueLine(a.dueDate)}
                  {dp && !dp.legacy && dp.repliesRequired > 0 ? ` · Replies ${Math.min(dp.replyCount, dp.repliesRequired)}/${dp.repliesRequired}` : typeLabel ? ` · ${typeLabel}` : ''}
                </span>
              </span>
            </button>
          );
        }) : <p className="text-sm text-[#5b6b7b]">No unsubmitted assignments</p>}
      </div>
      <p className="mt-4 text-[13px] font-extrabold text-[#15803d]">{submitted} submitted so far</p>
    </div>
  );

  // This-week calendar (Monday start)
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today0 = startOfDay(now);
  const weekStart = new Date(today0);
  weekStart.setDate(today0.getDate() - ((today0.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d; });
  const dueByDay = weekDays.map(d => scoped.filter(a => !a.isSubmitted && startOfDay(new Date(a.dueDate)).getTime() === d.getTime()));
  const weekList = weekDays.flatMap((d, i) => dueByDay[i].map(a => ({ d, a }))).slice(0, 4);

  const renderCalendar = () => (
    <div className="bg-white rounded-[20px] shadow-[0_6px_20px_rgba(11,37,64,0.08)] p-5">
      <h2 className={`${heading} text-lg font-bold text-[#0b2540] mb-3`}>This week</h2>
      <div className="grid grid-cols-7 text-center" role="list" aria-label="This week">
        {weekDays.map((d, i) => {
          const isToday = d.getTime() === today0.getTime();
          const due = dueByDay[i];
          return (
            <div
              key={i}
              role="listitem"
              aria-label={`${d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}${isToday ? ', today' : ''}${due.length ? `, ${due.length} due` : ''}`}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-xs font-extrabold text-[#5b6b7b]" aria-hidden="true">{'MTWTFSS'[i]}</span>
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold ${isToday ? 'bg-[#0065a3] text-white' : i > 4 ? 'text-[#6b7c8c]' : 'text-[#0b2540]'}`}
                aria-hidden="true"
              >
                {d.getDate()}
              </span>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: due.length ? getCardColor(due[0].assignmentId).edge : 'transparent' }} aria-hidden="true" />
            </div>
          );
        })}
      </div>
      <ul className="mt-3 space-y-2">
        {weekList.length > 0 ? weekList.map(({ d, a }) => (
          <li key={a.assignmentId} className="flex items-center gap-2 text-[13px] text-[#33475b] min-w-0">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: getCardColor(a.assignmentId).edge }} aria-hidden="true" />
            <span className="truncate"><span className="font-extrabold">{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>  {a.title} due</span>
          </li>
        )) : <li className="text-[13px] text-[#5b6b7b]">Nothing due this week</li>}
      </ul>
    </div>
  );

  return (
    <StudentRoute>
      {/* ===== WIDE SCREEN LAYOUT (iPad/Desktop): sidebar lives in the student layout ===== */}
      {isWide ? (
        <div className="h-full overflow-y-auto bg-[#f4f7fb] font-[family-name:var(--font-nunito)]">
          <div className="max-w-[1400px] mx-auto px-6 xl:px-10 pt-5 pb-10">
            {/* Top bar */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mb-6">
              {renderCoursePicker()}
              {duePill}
              <div className="ml-auto">{recordButton}</div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
              <section aria-labelledby="class-videos-h">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                  <h1 id="class-videos-h" className={`${heading} text-2xl font-bold text-[#0b2540]`}>Class videos</h1>
                  {renderChips()}
                </div>
                {videos.length > 0 ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-6 gap-5">
                      {videos.slice(0, 2).map(item => <div key={item.id} className="col-span-6 md:col-span-3">{renderCard(item, true)}</div>)}
                    </div>
                    {videos.length > 2 && (
                      <VideoCarousel key={`${activeCourse}-${chip}`} itemClassName={SMALL_SLIDE}>
                        {videos.slice(2).map(item => renderCard(item, false))}
                      </VideoCarousel>
                    )}
                  </div>
                ) : (
                  <div className="rounded-3xl bg-white border border-[#e3ebf2] py-20 text-center text-[#5b6b7b] text-sm">
                    {feed.length === 0 ? 'No videos yet' : 'No videos match this filter'}
                  </div>
                )}
              </section>

              {/* Right rail */}
              <aside aria-label="Assignments and calendar" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-5">
                {renderDueSoon()}
                {renderCalendar()}
              </aside>
            </div>
          </div>
        </div>
      ) : (
      /* ===== MOBILE LAYOUT ===== */
      <div key={loading ? 'loading' : 'ready'} className="h-full flex flex-col overflow-hidden bg-[#f4f7fb] cc-fade-in font-[family-name:var(--font-nunito)]">
        {loading ? (
          <div className="flex-1 bg-[#f4f7fb]" />
        ) : (
        <>
        <div className="px-4 pt-2 pb-2 shrink-0 flex items-center justify-between gap-3">
          <h1 className={`${heading} text-lg font-bold text-[#0b2540] truncate`}>Hi, {firstName}!</h1>
          {duePill}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-4" style={{ overscrollBehavior: 'contain' }}>
          {showCoursePicker && <div>{renderCoursePicker()}</div>}
          <section aria-labelledby="class-videos-m">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 id="class-videos-m" className={`${heading} text-base font-bold text-[#0b2540]`}>Class videos</h2>
              {recordButton}
            </div>
            <div className="mb-3 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>{renderChips()}</div>
            {videos.length > 0 ? (
              <div className="space-y-3">
                {renderCard(videos[0], true)}
                {videos.length > 1 && (
                  <VideoCarousel key={`${activeCourse}-${chip}`}>
                    {videos.slice(1).map(item => renderCard(item, false))}
                  </VideoCarousel>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-white border border-[#e3ebf2] py-12 text-center text-[#5b6b7b] text-sm">
                {feed.length === 0 ? 'No videos yet' : 'No videos match this filter'}
              </div>
            )}
          </section>
          {renderDueSoon()}
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
