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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
          <LoadingSpinner text="Loading courses..." />
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {/* Demo Mode Banner */}
        <DemoModeBanner />
        
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/student/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Back to Home"
              >
                <span className="text-xl">←</span>
              </button>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                📚
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">My Courses</h1>
                <p className="text-xs text-gray-600">
                  {searchQuery 
                    ? `${filteredCourses.length} of ${courses.length} courses match "${searchQuery}"`
                    : `${filteredCourses.length} courses`
                  }
                </p>
              </div>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search courses by name, code, or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl cursor-pointer transition-all duration-300 hover:scale-105"
                  style={{ borderLeftColor: course.backgroundColor, borderLeftWidth: '4px' }}
                >
                  {/* Course Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{course.name}</h3>
                      <p className="text-sm text-gray-600">{course.code}</p>
                      <p className="text-xs text-gray-500 mt-1">{course.instructor.name}</p>
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>📅 {course.semester} {course.year}</span>
                      <span>🎓 {course.credits} credits</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>👥 {course.enrollmentCount} students</span>
                      {course.schedule?.location && <span>📍 {course.schedule.location}</span>}
                    </div>
                    {course.schedule?.days && course.schedule?.time && (
                      <div className="flex items-center">
                        <span>🕒 {course.schedule.days.join(', ')} {course.schedule.time}</span>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentRoute>
  );
};

export default StudentCoursesPage;
