'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { getAssignmentColor } from '@/lib/assignmentColors';

interface Course {
  courseId: string;
  courseName: string;
  courseCode: string;
  instructor: string;
  schedule?: string;
}

interface Assignment {
  assignmentId: string;
  title: string;
  courseName?: string;
  courseInitials?: string;
  dueDate: string;
  maxScore?: number;
  isSubmitted?: boolean;
}

export default function StudentCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      // Fetch course info
      const courseRes = await fetch(`/api/courses/${courseId}`, { credentials: 'include' });
      if (courseRes.ok) {
        const courseData = await courseRes.json();
        setCourse(courseData.course || courseData.data?.course || courseData);
      }

      // Fetch assignments for this course
      const assignRes = await fetch(`/api/student/assignments?userId=${user?.id}&courseId=${courseId}`, { credentials: 'include' });
      if (assignRes.ok) {
        const data = await assignRes.json();
        setAssignments(data.assignments || []);
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();

  const getDueBadge = (dueDate: string) => {
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, color: 'bg-red-100 text-red-700' };
    if (diffDays === 0) return { label: 'Due Today', color: 'bg-orange-100 text-orange-700' };
    if (diffDays === 1) return { label: 'Tomorrow', color: 'bg-orange-100 text-orange-700' };
    return { label: `${diffDays} days`, color: 'bg-gray-100 text-gray-600' };
  };

  const getCardColor = (idx: number) => 'bg-[#a8d8ea]'; // unused, kept for compat

  return (
    <StudentRoute>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap" rel="stylesheet" />

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
            <p className="text-[10px] text-gray-500 truncate">{course?.instructor || ''} {course?.courseCode ? `• ${course.courseCode}` : ''}</p>
          </div>
          <img src="/UpdatedCCLogo.png" alt="ClassCast" className="w-6 h-6 object-contain" />
        </div>

        {/* Course Info Card */}
        {course && (
          <div className="px-4 py-3 bg-gradient-to-r from-[#005587] to-[#0077aa] shrink-0">
            <h2 className="text-white text-lg font-bold">{course.courseName}</h2>
            <p className="text-white/70 text-xs">{course.instructor} • {course.courseCode}</p>
            {course.schedule && <p className="text-white/50 text-xs mt-0.5">{course.schedule}</p>}
          </div>
        )}

        {/* Assignments Label */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-bold text-gray-900">Assignments</h2>
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
                return (
                  <div
                    key={a.assignmentId}
                    onClick={() => router.push(`/student/assignments/${a.assignmentId}`)}
                    className={`rounded-xl p-3 cursor-pointer ${getAssignmentColor(a.assignmentId)} active:scale-[0.98] transition-transform`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[#005587] text-sm font-bold truncate">{a.title}</h3>
                        <p className="text-[#005587]/60 text-[10px]">
                          {a.maxScore ? `${a.maxScore} pts` : ''} {a.isSubmitted ? '• ✓ Submitted' : ''}
                        </p>
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

        {/* Bottom Nav */}
        <div className="shrink-0 bg-white border-t border-gray-200 px-2 py-2">
          <div className="flex items-center justify-around">
            <NavBtn icon="🏠" label="Home" onClick={() => router.push('/student/dashboard')} />
            <NavBtn icon="📋" label="Assignments" onClick={() => router.push('/student/assignments')} />
            <button onClick={() => router.push('/student/record')} className="flex flex-col items-center -mt-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#005587] to-[#0088cc] flex items-center justify-center shadow-lg border-3 border-white ring-2 ring-[#FFC72C]">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </button>
            <NavBtn icon="👥" label="Classmates" onClick={() => router.push(`/student/courses/${courseId}/classmates`)} />
            <NavBtn icon="🔔" label="Alerts" onClick={() => router.push('/student/notifications')} />
          </div>
        </div>
      </div>
    </StudentRoute>
  );
}

function NavBtn({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center px-1 active:scale-95">
      <span className="text-lg">{icon}</span>
      <span className="text-[10px] text-gray-600 mt-0.5">{label}</span>
    </button>
  );
}
