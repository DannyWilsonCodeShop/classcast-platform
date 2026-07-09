'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import DemoModeBanner from '@/components/common/DemoModeBanner';
import { StudentTabBar } from '@/components/student/StudentTabBar';
import { useStudentCourses } from '@/hooks/useStudentData';

interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  instructor: {
    name: string;
    email: string;
    avatar?: string;
  };
  semester: string;
  year: number;
  status: 'active' | 'completed' | 'upcoming';
  backgroundColor: string;
  enrollmentCount: number;
  credits: number;
  schedule?: {
    days?: string[];
    time?: string;
    location?: string;
  };
  nextAssignment?: {
    title: string;
    dueDate: string;
    points: number;
  };
  createdAt: string;
  updatedAt: string;
}

const StudentCoursesPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { data: courses = [], isLoading: loading, error: fetchError } = useStudentCourses();
  const [searchQuery, setSearchQuery] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  const handleJoinCourse = async () => {
    const code = joinCode.trim() || searchQuery.trim();
    if (!code || !user?.id) return;
    setJoining(true);
    setJoinError('');
    setJoinSuccess('');
    try {
      const res = await fetch('/api/courses/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classCode: code,
          studentId: user.id,
          studentEmail: user.email || '',
          studentFirstName: user.firstName || '',
          studentLastName: user.lastName || '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setJoinSuccess(`Enrolled in ${data.course.title}${data.course.sectionName ? ` (${data.course.sectionName})` : ''}!`);
        setSearchQuery('');
        setJoinCode('');
        // Refresh courses list
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setJoinError(data.error || 'Failed to join course');
      }
    } catch {
      setJoinError('Network error. Please try again.');
    }
    setJoining(false);
  };

  const error = fetchError ? 'Failed to load courses' : null;

  const filteredCourses = courses.filter((course: Course) => {
    // Apply search filter
    const searchMatch = searchQuery === '' || 
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return searchMatch;
  });


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <StudentRoute>
        <div className="h-full flex flex-col bg-white overflow-hidden">
          <div className="px-4 pt-3 pb-2 shrink-0">
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="h-9 w-full bg-gray-100 rounded-xl animate-pulse" />
          </div>
          <div className="flex-1 px-4 py-3 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl p-4 bg-gray-100 animate-pulse">
                <div className="h-5 w-2/3 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-1/2 bg-gray-200 rounded mb-3" />
                <div className="h-3 w-1/3 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&family=Oswald:wght@300;700;400&display=swap" rel="stylesheet" />
      <div className="h-full overflow-hidden flex flex-col bg-white">
        {/* Demo Mode Banner */}
        <DemoModeBanner />

        {/* Search / Join unified input */}
        <div className="px-4 pt-1 pb-2 shrink-0">
          <h1 className="text-base font-bold uppercase text-[#005587] tracking-normal mb-2" style={{ fontFamily: "'Oswald', sans-serif" }}>My Courses</h1>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search courses or enter class code..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setJoinError(''); setJoinSuccess(''); }}
              className="w-full pl-9 pr-16 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005587] focus:border-[#005587] text-sm bg-white"
            />
            {/* Show Join button when input looks like a class code (4-8 chars, no spaces) */}
            {searchQuery.trim().length >= 4 && searchQuery.trim().length <= 8 && !searchQuery.includes(' ') && filteredCourses.length === 0 && (
              <button
                onClick={() => { setJoinCode(searchQuery.trim().toUpperCase()); handleJoinCourse(); }}
                disabled={joining}
                className="absolute inset-y-1 right-1 px-3 bg-[#005587] text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                {joining ? '...' : 'Join'}
              </button>
            )}
            {searchQuery && filteredCourses.length > 0 && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {joinError && <p className="text-xs text-red-600 mt-1">{joinError}</p>}
          {joinSuccess && <p className="text-xs text-green-600 mt-1">{joinSuccess}</p>}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Courses</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchCourses}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredCourses.length === 0 ? (
            <EmptyState
              icon={searchQuery ? "🔍" : "📚"}
              title={searchQuery ? "No Courses Found" : "No Courses Found"}
              description={
                searchQuery 
                  ? `No courses match "${searchQuery}". Try adjusting your search.`
                  : `You don't have any courses yet.`
              }
              action={
                <div className="flex flex-col sm:flex-row gap-2">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                  <button
                    onClick={() => router.push('/student/dashboard')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Back to Home
                  </button>
                </div>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => router.push(`/student/courses/${course.id}`)}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-5 hover:shadow-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ borderLeftColor: course.backgroundColor, borderLeftWidth: '4px' }}
                >
                  {/* Course Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold uppercase text-[#005587] truncate tracking-normal" style={{ fontFamily: "'Oswald', sans-serif" }}>{course.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{course.code}</p>
                      <p className="text-xs text-[#6cc3d3] font-medium mt-0.5">{course.instructor.name}</p>
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="space-y-1.5 text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <span>{course.semester} {course.year}</span>
                      <span>{course.credits} credits</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>👥 {course.enrollmentCount} students</span>
                      {course.schedule?.location && <span>📍 {course.schedule.location}</span>}
                    </div>
                    {course.schedule?.days && course.schedule?.time && (
                      <div className="flex items-center text-gray-400">
                        <span>🕒 {course.schedule.days.join(', ')} {course.schedule.time}</span>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Nav */}
        <StudentTabBar />
      </div>
    </StudentRoute>
  );
};

export default StudentCoursesPage;
