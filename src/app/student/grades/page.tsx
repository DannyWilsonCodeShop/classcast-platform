'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

interface Grade {
  id: string;
  assignmentTitle: string;
  courseName: string;
  courseCode: string;
  grade: number;
  maxPoints: number;
  submittedAt: string;
  gradedAt: string;
  dueDate?: string;
  feedback?: string;
  status: 'graded' | 'pending' | 'late';
}

export default function StudentGradesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchGrades();
  }, [user?.id]);

  const fetchGrades = async () => {
    try {
      const res = await fetch(`/api/student/assignments?userId=${user?.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        // Map assignments to grade items
        const assignments = data.assignments || [];
        const mapped: Grade[] = assignments.map((a: any) => ({
          id: a.assignmentId || a.id,
          assignmentTitle: a.title || 'Untitled',
          courseName: a.courseName || '',
          courseCode: a.courseCode || '',
          grade: a.grade ?? a.score ?? 0,
          maxPoints: a.maxScore || a.maxPoints || 100,
          submittedAt: a.submittedAt || '',
          gradedAt: a.gradedAt || '',
          dueDate: a.dueDate || '',
          feedback: a.feedback || '',
          status: a.gradedAt ? 'graded' : 'pending',
        }));
        setGrades(mapped);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <StudentRoute>
      <div className="h-full flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-3 py-2.5 border-b border-gray-100 shrink-0">
          <button onClick={() => router.push('/student/dashboard')} className="p-1.5 -ml-1 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="flex-1 text-sm font-bold text-gray-900 mx-2">Grades</h1>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-16" />
              ))}
            </div>
          ) : grades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">No grades yet</p>
              <p className="text-xs text-gray-500 mt-1">Your grades will appear here once available.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {grades.map((grade) => (
                <div key={grade.id} className="border border-gray-100 rounded-xl p-3 active:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{grade.assignmentTitle}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{grade.courseName}</p>
                    </div>
                    {/* Grade badge */}
                    {grade.status === 'graded' ? (
                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                        {grade.grade}/{grade.maxPoints}
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                        Pending
                      </span>
                    )}
                  </div>
                  {/* Due date */}
                  {grade.dueDate && (
                    <p className="text-[11px] text-gray-400 mt-1.5">Due {formatDate(grade.dueDate)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Nav - 3 buttons: Home | Courses | Profile */}
        <nav className="shrink-0 bg-white border-t border-gray-200 px-2 py-2">
          <div className="flex items-center justify-around">
            <button className="flex flex-col items-center" onClick={() => router.push('/student/dashboard')}>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="text-[10px] text-gray-400 mt-0.5">Home</span>
            </button>
            <button className="flex flex-col items-center" onClick={() => router.push('/student/courses')}>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              <span className="text-[10px] text-gray-400 mt-0.5">Courses</span>
            </button>
            <button className="flex flex-col items-center" onClick={() => router.push('/student/profile')}>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <span className="text-[10px] text-gray-400 mt-0.5">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </StudentRoute>
  );
}
