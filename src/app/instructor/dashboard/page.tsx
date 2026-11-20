'use client';

import React, { useState, useEffect } from 'react';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useTransitionRouter as useRouter } from '@/hooks/useTransitionRouter';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useIsWideScreen } from '@/hooks/useIsWideScreen';
import Avatar from '@/components/common/Avatar';
import { getAssignmentMaxPoints } from '@/lib/assignmentPoints';

interface Course {
  courseId: string;
  title: string;
  code?: string;
  classCode?: string;
  studentCount?: number;
  status?: string;
}

interface Assignment {
  assignmentId: string;
  title: string;
  dueDate: string;
  points: number;
  status: string;
  submissionsCount: number;
  gradedCount: number;
  courseId: string;
  assignmentType?: string;
}

interface DashboardStats {
  ungradedAssignments: number;
  submittedThisWeek?: number;
  recentUngraded?: {
    submissionId: string;
    studentId: string;
    studentName: string;
    assignmentId: string;
    assignmentTitle: string;
    courseId?: string;
    submittedAt?: string | null;
  }[];
}

const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { isWide } = useIsWideScreen();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('classcast_instructor_selected_course') || '';
    }
    return '';
  });
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [showCourseMenu, setShowCourseMenu] = useState(false);
  const [courseActionLoading, setCourseActionLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Course-scoped grading stats (to grade, submitted this week, needs-grading list)
  useEffect(() => {
    if (!user?.id || !selectedCourseId) { setStats(null); return; }
    let cancelled = false;
    setStats(null);
    fetch(`/api/instructor/dashboard/stats?instructorId=${encodeURIComponent(user.id)}&courseId=${encodeURIComponent(selectedCourseId)}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (!cancelled && data && typeof data.ungradedAssignments === 'number') setStats(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id, selectedCourseId]);

  // Study-hall-only accounts don't use the dashboard — send them to Study Hall.
  useEffect(() => {
    if ((user as any)?.studyHallOnly === true) {
      router.replace('/instructor/study-hall');
    }
  }, [user, router]);

  // Fetch courses for the dropdown
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const instructorId = user?.id || 'default-instructor';
        const response = await fetch(`/api/instructor/courses?instructorId=${instructorId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const coursesData = await response.json();
          const coursesArray = coursesData.data?.courses || [];
          
          if (Array.isArray(coursesArray)) {
            const mappedCourses = coursesArray.map((course: any) => ({
              courseId: course.id || course.courseId,
              title: course.title || course.courseName,
              code: course.code || course.courseCode,
              classCode: course.classCode || '',
              studentCount: course.studentCount || course.currentEnrollment || 0,
              status: course.status || 'published'
            }));
            setCourses(mappedCourses);
            
            if (mappedCourses.length > 0 && !selectedCourseId) {
              // Check if saved course still exists in the list
              const saved = localStorage.getItem('classcast_instructor_selected_course');
              if (saved && mappedCourses.some((c: Course) => c.courseId === saved)) {
                setSelectedCourseId(saved);
              } else {
                setSelectedCourseId(mappedCourses[0].courseId);
              }
            }

            // If no courses, check if user is team-only → redirect to Study Hall
            if (mappedCourses.length === 0) {
              try {
                const teamRes = await fetch(`/api/teams?memberId=${user?.id}`);
                const teamData = await teamRes.json();
                if (teamData.success && teamData.teams?.length > 0) {
                  router.push('/instructor/study-hall');
                  return;
                }
              } catch {}
            }
          }
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchCourses();
    }
  }, [user?.id]);

  // Persist selected course to localStorage
  useEffect(() => {
    if (selectedCourseId) {
      localStorage.setItem('classcast_instructor_selected_course', selectedCourseId);
    }
  }, [selectedCourseId]);

  // Fetch assignments when course changes
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!selectedCourseId) {
        setAssignments([]);
        return;
      }
      try {
        setAssignmentsLoading(true);
        const response = await fetch(`/api/assignments?courseId=${selectedCourseId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const mapped = (data.data.assignments || []).map((a: any) => ({
              assignmentId: a.assignmentId || a.id,
              title: a.title,
              dueDate: a.dueDate,
              points: getAssignmentMaxPoints(a),
              status: a.status || 'published',
              submissionsCount: a.submissionsCount || 0,
              gradedCount: a.gradedCount || 0,
              courseId: selectedCourseId,
              assignmentType: a.assignmentType || 'video',
              createdAt: a.createdAt || '',
            })).sort((a: any, b: any) => {
              // Most recently created first
              const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return bTime - aTime;
            });
            setAssignments(mapped);
          }
        }
      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setAssignmentsLoading(false);
      }
    };

    fetchAssignments();
  }, [selectedCourseId]);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
  };

  const selectedCourse = courses.find(course => course.courseId === selectedCourseId);

  const handleDeleteCourse = async () => {
    if (!selectedCourseId) return;
    const courseName = selectedCourse?.title || 'this course';
    if (!confirm(`Are you sure you want to delete "${courseName}"? This will permanently remove all assignments, submissions, and videos. This cannot be undone.`)) return;
    
    setCourseActionLoading(true);
    setShowCourseMenu(false);
    try {
      const response = await fetch(`/api/instructor/courses/${selectedCourseId}/delete`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setCourses(prev => prev.filter(c => c.courseId !== selectedCourseId));
        setSelectedCourseId('');
        setAssignments([]);
      } else {
        alert(`Failed to delete course: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to delete course. Please try again.');
    } finally {
      setCourseActionLoading(false);
    }
  };

  const handleArchiveCourse = async () => {
    if (!selectedCourseId) return;
    setShowCourseMenu(false);
    setCourseActionLoading(true);
    try {
      const response = await fetch('/api/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourseId, status: 'archived' }),
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setCourses(prev => prev.map(c => c.courseId === selectedCourseId ? { ...c, status: 'archived' } : c));
      } else {
        alert(`Failed to archive course: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to archive course. Please try again.');
    } finally {
      setCourseActionLoading(false);
    }
  };

  const heading = 'font-[family-name:var(--font-fredoka)]';
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 86400000);
  const dueThisWeek = assignments.filter(a => { const d = new Date(a.dueDate); return d >= now && d <= weekAhead; });

  // Monday-start week containing today
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i));
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const calendarDue = assignments
    .filter(a => { const d = new Date(a.dueDate); return d >= weekDays[0] && d < new Date(weekDays[6].getTime() + 86400000); })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const typeStyle = (t?: string) => {
    switch (t) {
      case 'discussion': return { edge: '#14b8a6', chipBg: '#dcf6f2', chipText: '#0f766e', label: 'Discussion' };
      case 'assessment': return { edge: '#f59e0b', chipBg: '#fdf0d8', chipText: '#b45309', label: 'Assessment' };
      case 'module':
      case 'group-project': return { edge: '#e11d48', chipBg: '#fde4ea', chipText: '#be123c', label: 'Group' };
      case 'study-module': return { edge: '#0065a3', chipBg: '#eaf3fb', chipText: '#0065a3', label: 'Module' };
      default: return { edge: '#8b5cf6', chipBg: '#ede7fd', chipText: '#6d28d9', label: 'Video' };
    }
  };
  const gradeRoute = (assignmentId: string, assignmentType?: string) => assignmentType === 'discussion'
    ? `/instructor/grading/assignment/${assignmentId}`
    : `/instructor/grading/bulk?course=${selectedCourseId}&assignment=${assignmentId}`;
  const timeAgo = (iso?: string | null) => {
    if (!iso) return '';
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    return days === 1 ? 'yesterday' : `${days}d ago`;
  };
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const instructorName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  const focusRing = 'focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0065a3]/40';

  return (
    <InstructorRoute>
      <div className="min-h-full overflow-y-auto pb-24 bg-[#f4f7fb] font-[family-name:var(--font-nunito)] text-[#33475b]">
        {/* NOTE: Mobile header is handled by instructor layout — do NOT add one here */}
        <div className={`${isWide ? 'px-6 lg:px-8 pt-6' : 'px-4 pt-3'} max-w-[1280px]`}>
          {/* Top bar: course select, course actions, New Assignment */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {courses.length > 0 && (
              <>
                {isWide && (
                  <label htmlFor="dashboard-course-select" className="text-sm font-bold text-[#6b7c8c] whitespace-nowrap">Course:</label>
                )}
                <select
                  id="dashboard-course-select"
                  aria-label="Course"
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className={`h-[42px] px-4 bg-white border border-[#d8e3ec] rounded-[14px] text-[15px] font-extrabold text-[#0b2540] focus:outline-none focus:ring-2 focus:ring-[#0065a3] ${isWide ? 'min-w-[260px] max-w-[340px]' : 'flex-1 min-w-[160px]'}`}
                >
                  <option value="" className="font-normal text-gray-500">Select a course...</option>
                  {courses.map((course) => (
                    <option key={course.courseId} value={course.courseId} className="font-bold">
                      {course.title}{course.status === 'archived' ? ' (Archived)' : ''}
                    </option>
                  ))}
                </select>
                {/* Course actions menu */}
                {selectedCourseId && (
                  <div className="relative">
                    <button
                      onClick={() => setShowCourseMenu(!showCourseMenu)}
                      disabled={courseActionLoading}
                      className={`w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#e3ebf2] text-[#46596c] hover:text-[#0065a3] transition-colors disabled:opacity-50 ${focusRing}`}
                      aria-label="Course actions"
                      aria-haspopup="menu"
                      aria-expanded={showCourseMenu}
                    >
                      {courseActionLoading ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      )}
                    </button>
                    {showCourseMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowCourseMenu(false)} />
                        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]" role="menu">
                          {selectedCourse?.status !== 'archived' && (
                            <button
                              onClick={handleArchiveCourse}
                              role="menuitem"
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <span aria-hidden="true">📦</span> Archive Course
                            </button>
                          )}
                          <button
                            onClick={handleDeleteCourse}
                            role="menuitem"
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <span aria-hidden="true">🗑</span> Delete Course
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <button
                  onClick={() => router.push('/instructor/assignments/create')}
                  className={`ml-auto h-[42px] px-5 rounded-full bg-[#FFC72C] hover:bg-[#e6b225] text-[15px] font-extrabold text-[#0b2540] whitespace-nowrap ${focusRing}`}
                >
                  + New<span className="hidden sm:inline"> Assignment</span>
                </button>
              </>
            )}
          </div>

          <div key={loading ? 'loading' : 'ready'} className="cc-fade-in">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : !selectedCourse ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                {courses.length === 0 ? (
                  <>
                    <div className="w-20 h-20 bg-[#0065a3]/10 rounded-full flex items-center justify-center mb-5">
                      <svg className="w-10 h-10 text-[#0065a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className={`${heading} text-xl font-bold text-stone-900 mb-2`}>Welcome to ClassCast</h3>
                    <p className="text-sm text-stone-500 text-center mb-6 max-w-[260px]">
                      Create your first course to start assigning video work and engaging students.
                    </p>
                    <button
                      onClick={() => router.push('/instructor/classes/create')}
                      className={`px-6 py-3 bg-[#0065a3] text-white rounded-xl font-bold text-sm hover:bg-[#00517f] transition-colors ${focusRing}`}
                    >
                      + Create Your First Course
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7l4-4m0 0l4 4m-4-4v18" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">Select a course above to view assignments</p>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Greeting band */}
                <section className="relative overflow-hidden mt-5 rounded-3xl bg-gradient-to-br from-[#0065a3] to-[#0088cc] shadow-[0_6px_20px_rgba(11,37,64,0.09)] px-6 py-6 lg:px-8 text-white">
                  <span className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/[0.06]" aria-hidden="true" />
                  <div className="relative flex flex-col lg:flex-row lg:items-center gap-5">
                    <div className="flex-1 min-w-0">
                      <h1 className={`${heading} text-2xl lg:text-[30px] font-bold leading-tight`}>
                        {greeting}{instructorName ? `, ${instructorName}` : ''}
                      </h1>
                      <p className="mt-1 text-base text-[#e3f1fb]">
                        {selectedCourse.title}{typeof selectedCourse.studentCount === 'number' ? ` · ${selectedCourse.studentCount} student${selectedCourse.studentCount === 1 ? '' : 's'}` : ''}
                      </p>
                      <button
                        onClick={() => router.push('/instructor/grading')}
                        className="mt-4 inline-flex items-center h-[30px] px-4 rounded-full bg-white text-[13px] font-extrabold text-[#0065a3] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
                      >
                        Start grading →
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 lg:w-[448px] shrink-0" aria-live="polite">
                      {[
                        { value: stats?.ungradedAssignments, label: 'to grade', accent: true },
                        { value: stats?.submittedThisWeek, label: 'submitted this week' },
                        { value: dueThisWeek.length, label: 'due this week' },
                      ].map(tile => (
                        <div key={tile.label} className="rounded-[18px] bg-[#00507f]/40 ring-1 ring-white/15 px-4 py-3">
                          <p className={`${heading} text-[32px] font-bold leading-none ${tile.accent ? 'text-[#FFC72C]' : 'text-white'}`}>
                            {typeof tile.value === 'number' ? tile.value : '–'}
                          </p>
                          <p className="mt-2 text-[13px] font-bold text-white leading-tight">{tile.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <div className={`mt-6 grid gap-5 ${isWide ? 'lg:grid-cols-[minmax(0,1fr)_310px]' : ''} items-start`}>
                  {/* Assignments */}
                  <section aria-labelledby="dash-assignments-h">
                    <h2 id="dash-assignments-h" className={`${heading} text-[22px] font-bold text-[#0b2540] mb-3`}>Assignments</h2>
                    {assignmentsLoading ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner size="sm" />
                      </div>
                    ) : assignments.length === 0 ? (
                      <div className="text-center py-8 bg-white rounded-[18px] shadow-[0_6px_20px_rgba(11,37,64,0.06)]">
                        <div className="text-3xl mb-2" aria-hidden="true">📝</div>
                        <p className="text-sm text-gray-600 mb-4">No assignments yet</p>
                        <button
                          onClick={() => router.push('/instructor/assignments/create')}
                          className={`px-4 py-2 bg-[#FFC72C] text-[#0b2540] rounded-xl font-bold text-sm ${focusRing}`}
                        >
                          + Create Assignment
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {assignments.map((assignment) => {
                          const ts = typeStyle(assignment.assignmentType);
                          const pct = assignment.submissionsCount > 0 ? Math.round((assignment.gradedCount / assignment.submissionsCount) * 100) : 0;
                          return (
                            <div
                              key={assignment.assignmentId}
                              className="relative overflow-hidden bg-white rounded-[18px] shadow-[0_6px_20px_rgba(11,37,64,0.08)] pl-6 pr-5 py-4"
                            >
                              <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: ts.edge }} aria-hidden="true" />
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2 min-w-0">
                                  <h3 className={`${heading} text-[17px] font-semibold text-[#0b2540] line-clamp-1`}>{assignment.title}</h3>
                                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: ts.chipBg, color: ts.chipText }}>{ts.label}</span>
                                </div>
                                <span className="text-[13px] font-bold text-[#6b7c8c] shrink-0">{assignment.points} pts</span>
                              </div>
                              <div className="mt-2 flex flex-col sm:flex-row sm:items-end gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] text-[#5b6b7b]">
                                    Due {new Date(assignment.dueDate).toLocaleDateString()} · {assignment.gradedCount}/{assignment.submissionsCount} graded
                                  </p>
                                  <div
                                    className="mt-2 h-2 max-w-[300px] rounded-full bg-[#e6edf3] overflow-hidden"
                                    role="progressbar"
                                    aria-label={`${assignment.title} graded`}
                                    aria-valuemin={0}
                                    aria-valuemax={assignment.submissionsCount}
                                    aria-valuenow={assignment.gradedCount}
                                  >
                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#16a34a' : ts.edge }} />
                                  </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <button
                                    onClick={() => router.push(`/instructor/courses/${selectedCourseId}/assignments/${assignment.assignmentId}/grades`)}
                                    className={`h-[34px] px-5 rounded-full border-2 border-[#0065a3] bg-white text-sm font-extrabold text-[#0065a3] hover:bg-[#eaf3fb] active:scale-95 transition-transform ${focusRing}`}
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => router.push(gradeRoute(assignment.assignmentId, assignment.assignmentType))}
                                    className={`h-[34px] px-5 rounded-full bg-[#0065a3] hover:bg-[#00517f] text-sm font-extrabold text-white active:scale-95 transition-transform ${focusRing}`}
                                  >
                                    Grade
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {/* Right column */}
                  <div className={`space-y-4 ${isWide ? 'lg:mt-[44px]' : ''}`}>
                    {stats?.recentUngraded && (
                      <section aria-labelledby="dash-needs-grading-h" className="bg-white rounded-[20px] shadow-[0_6px_20px_rgba(11,37,64,0.08)] p-5">
                        <div className="flex items-center justify-between mb-2">
                          <h2 id="dash-needs-grading-h" className={`${heading} text-[19px] font-bold text-[#0b2540]`}>Needs grading</h2>
                          <button onClick={() => router.push('/instructor/grading')} className={`rounded text-[13px] font-extrabold text-[#0065a3] hover:underline ${focusRing}`}>All →</button>
                        </div>
                        {stats.recentUngraded.length === 0 ? (
                          <p className="text-sm text-[#6b7c8c] py-2">All caught up.</p>
                        ) : (
                          <ul className="divide-y divide-[#eef2f6]">
                            {stats.recentUngraded.map(sub => {
                              const type = assignments.find(a => a.assignmentId === sub.assignmentId)?.assignmentType;
                              return (
                                <li key={sub.submissionId} className="flex items-center gap-3 py-2.5">
                                  <Avatar name={sub.studentName} size="md" className="!w-7 !h-7" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-extrabold text-[#0b2540] truncate">{sub.studentName}</p>
                                    <p className="text-xs text-[#6b7c8c] truncate">{sub.assignmentTitle}{sub.submittedAt ? ` · ${timeAgo(sub.submittedAt)}` : ''}</p>
                                  </div>
                                  <button
                                    onClick={() => router.push(gradeRoute(sub.assignmentId, type))}
                                    aria-label={`Grade ${sub.studentName}, ${sub.assignmentTitle}`}
                                    className={`h-7 px-4 rounded-full bg-[#0065a3] hover:bg-[#00517f] text-xs font-extrabold text-white shrink-0 ${focusRing}`}
                                  >
                                    Grade
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </section>
                    )}

                    <section aria-labelledby="dash-this-week-h" className="bg-white rounded-[20px] shadow-[0_6px_20px_rgba(11,37,64,0.08)] p-5">
                      <h2 id="dash-this-week-h" className={`${heading} text-[19px] font-bold text-[#0b2540] mb-3`}>This week</h2>
                      <div className="grid grid-cols-7 text-center" role="list" aria-label="This week">
                        {weekDays.map((d, i) => {
                          const isToday = sameDay(d, now);
                          const dueToday = calendarDue.filter(a => sameDay(new Date(a.dueDate), d));
                          const weekend = i >= 5;
                          return (
                            <div key={d.toISOString()} role="listitem" aria-label={`${d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}${dueToday.length ? `, ${dueToday.length} due` : ''}`}>
                              <p className="text-[11px] font-extrabold text-[#6b7c8c]" aria-hidden="true">{d.toLocaleDateString(undefined, { weekday: 'narrow' })}</p>
                              <p className={`mx-auto mt-1 w-[34px] h-[34px] flex items-center justify-center rounded-full text-[15px] font-extrabold ${isToday ? 'bg-[#0065a3] text-white' : weekend ? 'text-[#7a8a9a]' : 'text-[#33475b]'}`} aria-hidden="true">
                                {d.getDate()}
                              </p>
                              <div className="h-3 flex items-center justify-center gap-0.5" aria-hidden="true">
                                {dueToday.slice(0, 3).map(a => (
                                  <span key={a.assignmentId} className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: typeStyle(a.assignmentType).edge }} />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {calendarDue.length > 0 ? (
                        <ul className="mt-3 space-y-2">
                          {calendarDue.slice(0, 5).map(a => (
                            <li key={a.assignmentId} className="flex items-center gap-2.5 text-[13px] text-[#33475b] min-w-0">
                              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: typeStyle(a.assignmentType).edge }} aria-hidden="true" />
                              <span className="font-extrabold shrink-0">{new Date(a.dueDate).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                              <span className="truncate">{a.title}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-[#6b7c8c]">Nothing due this week.</p>
                      )}
                    </section>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default InstructorDashboard;
