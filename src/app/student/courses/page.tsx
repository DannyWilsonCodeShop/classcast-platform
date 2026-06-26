'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import DemoModeBanner from '@/components/common/DemoModeBanner';

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
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchCourses();
    }
  }, [user?.id]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      const response = await fetch(`/api/student/courses?userId=${user.id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load courses');
        setCourses([]);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e8f4f8] via-[#d4eef5] to-[#c2e4f2]">
          <LoadingSpinner text="Loading courses..." />
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&family=Oswald:wght@300;700;400&display=swap" rel="stylesheet" />
      <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-[#e8f4f8] via-[#d4eef5] to-[#c2e4f2]">
        {/* Demo Mode Banner */}
        <DemoModeBanner />
        
        {/* Header - matches other pages */}
        <div className="bg-white/80 backdrop-blur-md border-b border-white/20 px-4 py-2.5 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/student/dashboard')}
                className="p-1.5 -ml-1 text-gray-600"
                title="Back to Home"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span style={{ fontFamily: "'Grand Hotel', cursive", color: '#005587' }} className="text-2xl">ClassCast</span>
              <img src="/UpdatedCCLogo.png" alt="" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <p className="text-xs text-gray-500">
                {searchQuery 
                  ? `${filteredCourses.length} of ${courses.length} match`
                  : `${filteredCourses.length} courses`
                }
              </p>
            </div>
          </div>

          {/* Page title */}
          <h1 className="text-base font-bold uppercase text-[#005587] tracking-normal mb-2.5" style={{ fontFamily: "'Oswald', sans-serif" }}>My Courses</h1>
          
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6cc3d3] focus:border-[#6cc3d3] text-sm bg-white/70"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
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

        {/* Bottom Nav - 3 buttons: Home | Courses (active) | Profile */}
        <nav className="shrink-0 bg-white border-t border-gray-200 px-2 py-2 native-bottom-nav">
          <div className="flex items-center justify-around">
            <button className="flex flex-col items-center" onClick={() => router.push('/student/dashboard')}>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="text-[10px] text-gray-400 mt-0.5">Home</span>
            </button>
            <button className="flex flex-col items-center">
              <svg className="w-6 h-6 text-[#005587]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              <span className="text-[10px] text-[#005587] font-medium mt-0.5">Courses</span>
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
};

export default StudentCoursesPage;
