'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { getAssignmentColor, getAssignmentTitleColor } from '@/lib/assignmentColors';
import ModalTransition from '@/components/transitions/ModalTransition';

interface Course {
  courseId: string;
  courseName: string;
  courseCode: string;
  instructor: string;
  schedule: string;
}

interface Assignment {
  assignmentId: string;
  title: string;
  courseName?: string;
  courseInitials?: string;
  dueDate: string;
  maxScore?: number;
  isSubmitted?: boolean;
  grade?: number | null;
}

interface Submission {
  assignmentId: string;
  grade?: number | null;
  status?: string;
  submittedAt?: string;
}

interface CourseFile {
  fileId: string;
  fileName: string;
  originalName?: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  category?: string;
  description?: string;
}

export default function StudentCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Map<string, Submission>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showAssignmentPicker, setShowAssignmentPicker] = useState(false);
  const [courseFiles, setCourseFiles] = useState<CourseFile[]>([]);
  const [showResourcesModal, setShowResourcesModal] = useState(false);

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      // Fetch course info
      const courseRes = await fetch(`/api/courses/${courseId}`, { credentials: 'include' });
      if (courseRes.ok) {
        const courseData = await courseRes.json();
        const rawCourse = courseData.data || courseData.course || courseData;
        
        // Fetch instructor name
        let instructorName = rawCourse.instructorName || rawCourse.instructor || '';
        if (!instructorName && rawCourse.instructorId) {
          try {
            const instrRes = await fetch(`/api/profile?userId=${rawCourse.instructorId}`, { credentials: 'include' });
            if (instrRes.ok) {
              const instrData = await instrRes.json();
              const instr = instrData.data || instrData;
              instructorName = `${instr.firstName || ''} ${instr.lastName || ''}`.trim() || 'Instructor';
            }
          } catch {}
        }

        // Format schedule - could be a string or an object { days, time, location }
        let scheduleStr = '';
        const sched = rawCourse.schedule;
        if (typeof sched === 'string') {
          scheduleStr = sched;
        } else if (sched && typeof sched === 'object') {
          const days = Array.isArray(sched.days) ? sched.days.join(', ') : '';
          const time = sched.time || '';
          scheduleStr = [days, time].filter(Boolean).join(' • ');
        }

        setCourse({
          courseId: rawCourse.courseId || courseId,
          courseName: rawCourse.name || rawCourse.courseName || rawCourse.title || 'Course',
          courseCode: rawCourse.courseCode || rawCourse.code || rawCourse.classCode || '',
          instructor: instructorName,
          schedule: scheduleStr,
        });
      }

      // Fetch assignments for this course (already includes grade info)
      const assignRes = await fetch(`/api/student/assignments?userId=${user?.id}&courseId=${courseId}`, { credentials: 'include' });
      if (assignRes.ok) {
        const data = await assignRes.json();
        setAssignments(data.assignments || []);
      }

      // Fetch submissions for grade data
      const subRes = await fetch(`/api/submissions?studentId=${user?.id}`, { credentials: 'include' });
      if (subRes.ok) {
        const subData = await subRes.json();
        const subs = subData.data?.submissions || subData.submissions || [];
        const subMap = new Map<string, Submission>();
        subs.forEach((s: Submission) => subMap.set(s.assignmentId, s));
        setSubmissions(subMap);
      }

      // Fetch course files/resources
      try {
        const filesRes = await fetch(`/api/courses/${courseId}/files`, { credentials: 'include' });
        if (filesRes.ok) {
          const filesData = await filesRes.json();
          setCourseFiles(filesData.files || filesData.data || []);
        }
      } catch {}
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const unsubmitted = assignments.filter(a => !a.isSubmitted);

  const getDueBadge = (dueDate: string) => {
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, color: 'bg-red-100 text-red-700' };
    if (diffDays === 0) return { label: 'Due Today', color: 'bg-orange-100 text-orange-700' };
    if (diffDays === 1) return { label: 'Tomorrow', color: 'bg-orange-100 text-orange-700' };
    return { label: `${diffDays} days`, color: 'bg-gray-100 text-gray-600' };
  };

  const getGradeForAssignment = (assignmentId: string, assignment: Assignment): string | null => {
    // Check from enriched assignment data first
    if (assignment.grade !== undefined && assignment.grade !== null) {
      return `${assignment.grade}/${assignment.maxScore || 100}`;
    }
    // Fallback to submissions map
    const sub = submissions.get(assignmentId);
    if (sub?.grade !== undefined && sub?.grade !== null) {
      return `${sub.grade}/${assignment.maxScore || 100}`;
    }
    return null;
  };

  return (
    <StudentRoute>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&family=Oswald:wght@300;700&display=swap" rel="stylesheet" />

      <div className="h-full flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-3 py-2.5 border-b border-gray-100 shrink-0">
          <button onClick={() => router.push('/student/dashboard')} className="p-1.5 -ml-1 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 mx-2 min-w-0">
            <h1 className="text-sm font-bold text-gray-900 truncate">{course?.courseName || 'Course'}</h1>
          </div>
          <img src="/UpdatedCCLogo.png" alt="ClassCast" className="w-6 h-6 object-contain" />
        </div>

        {/* Course Info Card - Detailed */}
        {course ? (
          <div className="px-4 py-3 bg-gradient-to-r from-[#005587] to-[#0077aa] shrink-0">
            <h2 className="text-white text-lg font-bold">{course.courseName}</h2>
            {course.instructor && (
              <div className="flex items-center gap-2 mt-1">
                <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-white/80 text-xs">{course.instructor}</p>
              </div>
            )}
            <div className="flex items-center gap-4 mt-1.5">
              {course.courseCode && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  <span className="text-white/70 text-xs font-medium">{course.courseCode}</span>
                </div>
              )}
              {course.schedule && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white/70 text-xs">{course.schedule}</span>
                </div>
              )}
            </div>
          </div>
        ) : loading ? (
          <div className="px-4 py-3 bg-gradient-to-r from-[#005587] to-[#0077aa] shrink-0">
            <div className="h-5 w-48 bg-white/20 rounded animate-pulse" />
            <div className="h-3 w-32 bg-white/10 rounded animate-pulse mt-2" />
            <div className="h-3 w-40 bg-white/10 rounded animate-pulse mt-1.5" />
          </div>
        ) : null}

        {/* Assignments Label */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold uppercase text-[#005587] tracking-normal" style={{ fontFamily: "'Oswald', sans-serif" }}>Assignments</h2>
          <span className="text-xs text-gray-400">{assignments.length} total</span>
        </div>

        {/* Assignment List - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
          {loading ? (
            <div className="space-y-2 pt-2">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No assignments for this course yet.</div>
          ) : (
            <div className="space-y-2 pt-1">
              {assignments.map((a) => {
                const badge = getDueBadge(a.dueDate);
                const grade = getGradeForAssignment(a.assignmentId, a);
                return (
                  <div
                    key={a.assignmentId}
                    onClick={() => router.push(`/student/assignments/${a.assignmentId}`)}
                    className="rounded-xl p-3 cursor-pointer active:scale-[0.98] transition-transform"
                    style={{ backgroundColor: getAssignmentColor(a.assignmentId) }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold uppercase truncate" style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em', color: getAssignmentTitleColor(a.assignmentId) }}>{a.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] opacity-70" style={{ color: getAssignmentTitleColor(a.assignmentId) }}>
                            {a.maxScore ? `${a.maxScore} pts` : ''} {a.isSubmitted ? '• ✓ Submitted' : ''}
                          </p>
                          {grade && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                              Grade: {grade}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ml-2 shrink-0 ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Nav - Liquid Glass */}
        <nav className="fixed bottom-4 left-4 right-4 z-40 px-2 py-2 rounded-2xl native-bottom-nav" style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px) saturate(150%)', WebkitBackdropFilter: 'blur(12px) saturate(150%)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-around">
            <button className="flex flex-col items-center w-1/3 py-1" onClick={() => router.push('/student/dashboard')}>
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-[9px] text-gray-500">Home</span>
            </button>
            <button className="flex flex-col items-center w-1/3 py-1 relative" onClick={() => { if (courseFiles.length > 0) setShowResourcesModal(true); }}>
              <svg className={`w-6 h-6 ${courseFiles.length > 0 ? 'text-[#005587]' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {courseFiles.length > 0 && (
                <span className="absolute top-0 right-1/4 w-3.5 h-3.5 bg-[#005587] rounded-full text-[7px] text-white flex items-center justify-center font-bold">{courseFiles.length}</span>
              )}
              <span className={`text-[9px] ${courseFiles.length > 0 ? 'text-[#005587] font-medium' : 'text-gray-300'}`}>Resources</span>
            </button>
            <button className="flex flex-col items-center w-1/3 py-1" onClick={() => router.push(`/student/courses/${courseId}/classmates`)}>
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-[9px] text-gray-500">Classmates</span>
            </button>
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
                  className="w-full text-left rounded-xl p-3 active:scale-[0.98] transition-transform"
                  style={{ backgroundColor: getAssignmentColor(a.assignmentId) }}
                >
                  <h4 className="text-base font-bold uppercase truncate" style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em', color: getAssignmentTitleColor(a.assignmentId) }}>{a.title}</h4>
                  <p className="text-xs opacity-70" style={{ color: getAssignmentTitleColor(a.assignmentId) }}>{a.courseName || course?.courseName || ''} • Due {getDueBadge(a.dueDate).label}</p>
                </button>
              )) : (
                <p className="text-center text-gray-400 text-sm py-4">No unsubmitted assignments</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resources Modal */}
      <ModalTransition isOpen={showResourcesModal} onClose={() => setShowResourcesModal(false)}>
          <div className="bg-white w-full rounded-2xl p-4 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">Course Resources</h3>
              <button onClick={() => setShowResourcesModal(false)} className="text-gray-400 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-2">
              {courseFiles.length > 0 ? courseFiles.map(file => (
                <a
                  key={file.fileId}
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#005587]/10 flex items-center justify-center shrink-0">
                    <FileIcon fileType={file.fileType || file.fileName} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.originalName || file.fileName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {file.category && <span className="text-[10px] text-[#005587] bg-[#005587]/10 px-1.5 py-0.5 rounded font-medium capitalize">{file.category}</span>}
                      {file.fileSize && <span className="text-[10px] text-gray-400">{formatFileSize(file.fileSize)}</span>}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              )) : (
                <p className="text-center text-gray-400 text-sm py-4">No resources available</p>
              )}
            </div>
          </div>
      </ModalTransition>
    </StudentRoute>
  );
}

function FileIcon({ fileType }: { fileType?: string }) {
  const ext = (fileType || '').toLowerCase();
  if (ext.includes('pdf')) return <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" /></svg>;
  if (ext.includes('doc') || ext.includes('word')) return <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" /></svg>;
  if (ext.includes('xls') || ext.includes('sheet')) return <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" /></svg>;
  if (ext.includes('ppt') || ext.includes('presentation')) return <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" /></svg>;
  if (ext.includes('image') || ext.includes('png') || ext.includes('jpg')) return <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  return <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
