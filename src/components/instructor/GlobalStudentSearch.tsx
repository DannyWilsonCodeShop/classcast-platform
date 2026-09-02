'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface StudentResult {
  studentId: string;
  studentName: string;
  email: string;
  courseId: string;
  courseName: string;
  sectionId: string | null;
  sectionName: string | null;
}

// A "recent item" is a student the instructor recently jumped to.
interface RecentItem {
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  sectionName: string | null;
  at: number;
}

const RECENT_KEY = 'classcast_instructor_recent_students';
const MAX_RECENT = 6;

export function getRecentStudents(): RecentItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const items = raw ? (JSON.parse(raw) as RecentItem[]) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function addRecentStudent(item: Omit<RecentItem, 'at'>) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getRecentStudents().filter(
      (r) => !(r.studentId === item.studentId && r.courseId === item.courseId)
    );
    const next = [{ ...item, at: Date.now() }, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}

export function GlobalStudentSearch() {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StudentResult[]>([]);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent items when the panel opens
  useEffect(() => {
    if (open) setRecent(getRecentStudents());
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2 || !user?.id) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/instructor/student-search?instructorId=${user.id}&q=${encodeURIComponent(q)}`,
          { credentials: 'include' }
        );
        const data = await res.json();
        if (data.success) setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, user?.id]);

  const goToStudent = useCallback(
    (item: { studentId: string; studentName: string; courseId: string; courseName: string; sectionName: string | null }) => {
      addRecentStudent(item);
      setOpen(false);
      setQuery('');
      setResults([]);
      router.push(
        `/instructor/grading/bulk?course=${item.courseId}&student=${item.studentId}&studentName=${encodeURIComponent(item.studentName)}`
      );
    },
    [router]
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger / input */}
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-stone-400 hover:border-stone-300 transition-colors ${open ? 'hidden' : ''}`}
        aria-label="Search students"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-xs">Search students</span>
      </button>

      {open && (
        <div className="absolute right-0 top-0 z-50 w-[min(88vw,320px)]">
          <div className="rounded-2xl border border-stone-200 bg-white shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-stone-100">
              <svg className="w-4 h-4 text-stone-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search students by name…"
                className="flex-1 text-sm outline-none placeholder:text-stone-400"
              />
              <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-stone-600 text-sm shrink-0">✕</button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {/* Results */}
              {query.trim().length >= 2 ? (
                <>
                  {loading && (
                    <div className="px-3 py-3 text-xs text-stone-400">Searching…</div>
                  )}
                  {!loading && results.length === 0 && (
                    <div className="px-3 py-3 text-xs text-stone-400">No students found.</div>
                  )}
                  {!loading &&
                    results.map((r) => (
                      <button
                        key={`${r.courseId}:${r.studentId}`}
                        onClick={() => goToStudent(r)}
                        className="w-full text-left px-3 py-2 hover:bg-stone-50 border-b border-stone-50 last:border-0"
                      >
                        <div className="text-sm font-medium text-stone-900">{r.studentName}</div>
                        <div className="text-[11px] text-stone-400">
                          {r.courseName}{r.sectionName ? ` • ${r.sectionName}` : ''}
                        </div>
                      </button>
                    ))}
                </>
              ) : (
                /* Recent items (shown when the box is empty) */
                <>
                  <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                    Recent
                  </div>
                  {recent.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-stone-400">
                      Search a student to jump straight to their work.
                    </div>
                  ) : (
                    recent.map((r) => {
                      const meta = [r.courseName, r.sectionName].filter(Boolean).join(' • ');
                      return (
                        <button
                          key={`${r.courseId}:${r.studentId}`}
                          onClick={() => goToStudent(r)}
                          className="w-full text-left px-3 py-2 hover:bg-stone-50 border-b border-stone-50 last:border-0"
                        >
                          <div className="text-sm font-medium text-stone-900">{r.studentName}</div>
                          {meta && <div className="text-[11px] text-stone-400">{meta}</div>}
                        </button>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
