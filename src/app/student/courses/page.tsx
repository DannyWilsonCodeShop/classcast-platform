'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

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
  progress: number;
  enrollmentCount: number;
  credits: number;
  schedule: {
    days: string[];
    time: string;
    location: string;
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
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'upcoming'>('all');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/student/courses', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      } else {
        // For now, show mock data until API is implemented
        const mockCourses: Course[] = [
          {
            id: '1',
            name: 'Introduction to Computer Science',
            code: 'CS101',
            description: 'Fundamental concepts of computer science and programming',
            instructor: {
              name: 'Dr. Sarah Johnson',
              email: 'sarah.johnson@university.edu',
              avatar: '/api/placeholder/40/40'
            },
            semester: 'Fall',
            year: 2024,
            status: 'active',
            progress: 75,
            enrollmentCount: 120,
            credits: 3,
            schedule: {
              days: ['Monday', 'Wednesday', 'Friday'],
              time: '10:00 AM - 11:00 AM',
              location: 'Room 101'
            },
            nextAssignment: {
              title: 'Programming Assignment 3',
              dueDate: '2024-12-15',
              points: 100
            },
            createdAt: '2024-08-15T00:00:00Z',
            updatedAt: '2024-11-20T00:00:00Z'
          },
          {
            id: '2',
            name: 'Data Structures and Algorithms',
            code: 'CS201',
            description: 'Advanced data structures and algorithmic problem solving',
            instructor: {
              name: 'Prof. Michael Chen',
              email: 'michael.chen@university.edu',
              avatar: '/api/placeholder/40/40'
            },
            semester: 'Fall',
            year: 2024,
            status: 'active',
            progress: 60,
            enrollmentCount: 85,
            credits: 4,
            schedule: {
              days: ['Tuesday', 'Thursday'],
              time: '2:00 PM - 3:30 PM',
              location: 'Room 205'
            },
            nextAssignment: {
              title: 'Algorithm Analysis Project',
              dueDate: '2024-12-20',
              points: 150
            },
            createdAt: '2024-08-15T00:00:00Z',
            updatedAt: '2024-11-20T00:00:00Z'
          },
          {
            id: '3',
            name: 'Web Development Fundamentals',
            code: 'CS301',
            description: 'Modern web development with HTML, CSS, and JavaScript',
            instructor: {
              name: 'Dr. Emily Rodriguez',
              email: 'emily.rodriguez@university.edu',
              avatar: '/api/placeholder/40/40'
            },
            semester: 'Fall',
            year: 2024,
            status: 'completed',
            progress: 100,
            enrollmentCount: 95,
            credits: 3,
            schedule: {
              days: ['Monday', 'Wednesday'],
              time: '1:00 PM - 2:30 PM',
              location: 'Lab 301'
            },
            createdAt: '2024-08-15T00:00:00Z',
            updatedAt: '2024-11-20T00:00:00Z'
          }
        ];
        setCourses(mockCourses);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    if (filter === 'all') return true;
    return course.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'completed':
        return '✅';
      case 'upcoming':
        return '⏳';
      default:
        return '📚';
    }
  };

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
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/student/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="text-xl">←</span>
              </button>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                📚
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">My Courses</h1>
                <p className="text-xs text-gray-600">{filteredCourses.length} courses</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Courses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>
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
              icon="📚"
              title="No Courses Found"
              description={`You don't have any ${filter === 'all' ? '' : filter} courses yet.`}
              action={
                <button
                  onClick={() => router.push('/student/dashboard')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Dashboard
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => router.push(`/student/courses/${course.id}`)}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl cursor-pointer transition-all duration-300 hover:scale-105"
                >
                  {/* Course Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{course.name}</h3>
                      <p className="text-sm text-gray-600">{course.code}</p>
                      <p className="text-xs text-gray-500 mt-1">{course.instructor.name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(course.status)}`}>
                        {getStatusIcon(course.status)} {course.status}
                      </span>
                    </div>
                  </div>

                  {/* Course Description */}
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">{course.description}</p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${course.progress}%` }}
                      ></div>
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
                      <span>📍 {course.schedule.location}</span>
                    </div>
                    <div className="flex items-center">
                      <span>🕒 {course.schedule.days.join(', ')} {course.schedule.time}</span>
                    </div>
                  </div>

                  {/* Next Assignment */}
                  {course.nextAssignment && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-orange-800">Next Assignment</p>
                          <p className="text-sm text-orange-700 truncate">{course.nextAssignment.title}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-orange-600">Due {formatDate(course.nextAssignment.dueDate)}</p>
                          <p className="text-xs text-orange-600">{course.nextAssignment.points} pts</p>
                        </div>
                      </div>
                    </div>
                  )}
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
