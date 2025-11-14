'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Search, BookOpen, Users, Calendar, Clock, Star, Plus } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  code: string;
  classCode: string;
  description: string;
  instructor: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  privacy: string;
  createdAt: string;
  updatedAt: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  course: {
    id: string;
    name: string;
    code: string;
    classCode: string;
    instructor: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
  dueDate: string;
  points: number;
  status: string;
  createdAt: string;
}

const ExplorePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'courses' | 'assignments'>('courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPublicCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      const response = await fetch(`/api/courses/public?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.data?.courses || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load public courses');
      }
    } catch (err) {
      console.error('Error fetching public courses:', err);
      setError('Failed to load public courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      const response = await fetch(`/api/assignments/public?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.data?.assignments || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load public assignments');
      }
    } catch (err) {
      console.error('Error fetching public assignments:', err);
      setError('Failed to load public assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'courses') {
      fetchPublicCourses();
    } else {
      fetchPublicAssignments();
    }
  }, [activeTab, searchQuery]);

  const handleJoinCourse = async (classCode: string) => {
    try {
      const response = await fetch('/api/student/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          classCode,
          userId: user?.id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Successfully joined the course!');
          // Refresh the courses list
          fetchPublicCourses();
        } else {
          alert(data.error || 'Failed to join course');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to join course');
      }
    } catch (err) {
      console.error('Error joining course:', err);
      alert('Failed to join course');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Public Content</h1>
            <p className="text-gray-600">
              Discover public courses and assignments from instructors around the platform
            </p>
          </div>

          {/* Search and Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search courses or assignments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('courses')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'courses'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  Courses
                </button>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'assignments'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Assignments
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => activeTab === 'courses' ? fetchPublicCourses() : fetchPublicAssignments()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : activeTab === 'courses' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Public Courses Found</h3>
                  <p className="text-gray-600">
                    {searchQuery ? 'Try adjusting your search terms' : 'No public courses are available at the moment'}
                  </p>
                </div>
              ) : (
                courses.map((course) => (
                  <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{course.code}</p>
                          <p className="text-xs text-gray-500">Class Code: {course.classCode}</p>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => handleJoinCourse(course.classCode)}
                            className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Join
                          </button>
                        </div>
                      </div>
                      
                      {course.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{course.instructor?.name || 'Unknown Instructor'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Public Assignments Found</h3>
                  <p className="text-gray-600">
                    {searchQuery ? 'Try adjusting your search terms' : 'No public assignments are available at the moment'}
                  </p>
                </div>
              ) : (
                assignments.map((assignment) => (
                  <div key={assignment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{assignment.course.name} ({assignment.course.code})</p>
                          <p className="text-xs text-gray-500">Instructor: {assignment.course.instructor?.name || 'Unknown'}</p>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-sm font-medium text-gray-900">{assignment.points} pts</div>
                          <div className="text-xs text-gray-500">
                            Due: {formatDate(assignment.dueDate)}
                          </div>
                        </div>
                      </div>
                      
                      {assignment.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{assignment.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>Created {formatDate(assignment.createdAt)}</span>
                        </div>
                        <button
                          onClick={() => handleJoinCourse(assignment.course.classCode)}
                          className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Join Course
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </StudentRoute>
  );
};

export default ExplorePage;
