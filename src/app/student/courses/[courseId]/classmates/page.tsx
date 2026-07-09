'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';

interface Classmate {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  sectionName?: string;
}

interface Course {
  courseId: string;
  courseName: string;
  courseCode: string;
}

export default function ClassmatesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.courseId as string;

  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      // Fetch course info (includes enrollment data)
      const courseRes = await fetch(`/api/courses/${courseId}`, { credentials: 'include' });
      if (courseRes.ok) {
        const courseData = await courseRes.json();
        const rawCourse = courseData.data || courseData.course || courseData;

        setCourse({
          courseId: rawCourse.courseId || courseId,
          courseName: rawCourse.name || rawCourse.courseName || rawCourse.title || 'Course',
          courseCode: rawCourse.courseCode || rawCourse.code || rawCourse.classCode || '',
        });

        // Extract classmates from enrollment data
        const enrollment = rawCourse.enrollment;
        if (enrollment && enrollment.students && Array.isArray(enrollment.students)) {
          const activeStudents = enrollment.students
            .filter((s: any) => s.userId !== user?.id && s.userId && s.status === 'active');

          // Fetch user profiles to get actual names and avatars
          const studentProfiles: Classmate[] = await Promise.all(
            activeStudents.map(async (s: any) => {
              let firstName = s.firstName || '';
              let lastName = s.lastName || '';
              let email = s.email || '';
              let avatar = s.avatar || '';

              // If name is missing, fetch from user profile
              if (!firstName && !lastName) {
                try {
                  const userRes = await fetch(`/api/users/${s.userId}`, { credentials: 'include' });
                  if (userRes.ok) {
                    const userData = await userRes.json();
                    if (userData.success && userData.user) {
                      firstName = userData.user.firstName || '';
                      lastName = userData.user.lastName || '';
                      email = userData.user.email || email;
                      avatar = userData.user.avatar || avatar;
                    }
                  }
                } catch { /* skip failed lookups */ }
              }

              return {
                userId: s.userId,
                firstName,
                lastName,
                email,
                avatar,
                sectionName: s.sectionName || '',
              };
            })
          );

          setClassmates(studentProfiles);
        }
      }
    } catch (e) {
      console.error('Error fetching classmates:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = classmates.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.firstName + ' ' + c.lastName).toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  // Group by section
  const sections = new Map<string, Classmate[]>();
  filtered.forEach(c => {
    const key = c.sectionName || 'All Students';
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key)!.push(c);
  });

  const getInitial = (c: Classmate) => {
    if (c.firstName) return c.firstName[0].toUpperCase();
    if (c.email) return c.email[0].toUpperCase();
    return '?';
  };

  return (
    <StudentRoute>
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap" rel="stylesheet" />

      <div className="h-full flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-3 py-2.5 border-b border-gray-100 shrink-0">
          <button onClick={() => router.push(`/student/courses/${courseId}`)} className="p-1.5 -ml-1 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 mx-2 min-w-0">
            <h1 className="text-sm font-bold text-gray-900">Classmates</h1>
            <p className="text-[10px] text-gray-500 truncate">{course?.courseName || ''}</p>
          </div>
          <span className="text-xs text-gray-400 font-medium">{classmates.length}</span>
        </div>

        {/* Search */}
        <div className="px-4 py-2 shrink-0">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search classmates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005587]/30 focus:border-[#005587]"
            />
          </div>
        </div>

        {/* Classmates List */}
        <div className="flex-1 overflow-y-auto px-4 pb-24 min-h-0">
          {loading ? (
            <div className="space-y-2 pt-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-2 w-36 bg-gray-50 rounded animate-pulse mt-1.5" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-400 text-sm">{search ? 'No matches found' : 'No classmates enrolled yet'}</p>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {Array.from(sections.entries()).map(([sectionName, students]) => (
                <div key={sectionName}>
                  {sections.size > 1 && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{sectionName}</span>
                      <span className="text-[10px] text-gray-300">({students.length})</span>
                    </div>
                  )}
                  <div className="space-y-1">
                    {students.map((c) => (
                      <div
                        key={c.userId}
                        onClick={() => router.push(`/student/profile/${c.userId}`)}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#005587] to-[#0088cc] flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {c.avatar && c.avatar.length <= 4 && !c.avatar.startsWith('http') ? (
                            <span className="text-lg">{c.avatar}</span>
                          ) : c.avatar && c.avatar.startsWith('http') ? (
                            <img src={c.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            getInitial(c)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {c.firstName} {c.lastName}
                          </p>
                          {c.email && <p className="text-[10px] text-gray-400 truncate">{c.email}</p>}
                        </div>
                        <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Nav - Liquid Glass */}
        <nav className="fixed bottom-4 left-4 right-4 z-40 px-2 py-2 rounded-2xl native-bottom-nav" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.25)', boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.3)' }}>
          <div className="flex items-center justify-around">
            <button className="flex flex-col items-center w-1/3 py-1" onClick={() => router.push('/student/dashboard')}>
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="text-[9px] text-gray-500">Home</span>
            </button>
            <button className="flex flex-col items-center w-1/3 py-1" onClick={() => router.push(`/student/courses/${courseId}`)}>
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <span className="text-[9px] text-gray-500">Course</span>
            </button>
            <button className="flex flex-col items-center w-1/3 py-1">
              <svg className="w-6 h-6 text-[#005587]" fill="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <span className="text-[9px] text-[#005587] font-medium">Peers</span>
            </button>
          </div>
        </nav>
      </div>
    </StudentRoute>
  );
}
