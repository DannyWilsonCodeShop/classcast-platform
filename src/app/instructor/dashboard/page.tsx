'use client';

import React, { useState, useEffect } from 'react';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/common/Avatar';
import NotificationBell from '@/components/common/NotificationBell';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { AssignmentManagement } from '@/components/instructor/AssignmentManagement';

interface Course {
  courseId: string;
  title: string;
  studentCount?: number;
  status?: string;
}

/**
 * Enhanced Instructor Dashboard
 * 
 * Shows assignments and students for the selected course instead of course cards.
 * Includes course selection dropdown and search for assignments/students.
 */
const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Fetch courses for the dropdown
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const instructorId = user?.id || 'default-instructor';
        const response = await fetch(`/api/instructor/courses?instructorId=${instructorId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const coursesData = await response.json();
          const coursesArray = coursesData.data?.courses || [];
          
          if (Array.isArray(coursesArray)) {
            const mappedCourses = coursesArray.map((course: any) => ({
              courseId: course.id || course.courseId,
              title: course.title || course.courseName,
              studentCount: course.studentCount || course.currentEnrollment || 0,
              status: course.status || 'published'
            }));
            setCourses(mappedCourses);
            
            // Auto-select first course if available
            if (mappedCourses.length > 0 && !selectedCourseId) {
              setSelectedCourseId(mappedCourses[0].courseId);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchCourses();
    }
  }, [user?.id]);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
  };

  const selectedCourse = courses.find(course => course.courseId === selectedCourseId);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = user?.firstName || 'Instructor';
    
    if (hour < 12) return `Good morning, ${firstName}!`;
    if (hour < 17) return `Good afternoon, ${firstName}!`;
    return `Good evening, ${firstName}!`;
  };

  return (
    <InstructorRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Top Banner - Keep the existing header */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-indigo-600/20 px-2 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left Side - MyClassCast Logo */}
            <div className="flex items-center min-w-0 flex-1">
              <img
                src="/MyClassCast (800 x 200 px).png"
                alt="MyClassCast"
                className="h-6 sm:h-8 w-auto object-contain max-w-[200px] sm:max-w-none"
              />
            </div>
            
            {/* Right Side - Notifications, Create Class Buttons and Profile */}
            <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
              {/* Notification Bell */}
              {user?.id && (
                <NotificationBell 
                  userId={user.id} 
                  userRole="instructor" 
                  className="flex-shrink-0"
                />
              )}
              
              {/* Moderation Button */}
              <button
                onClick={() => router.push('/instructor/moderation')}
                className="flex items-center space-x-1 sm:space-x-2 bg-orange-600 text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors shadow-lg hover:shadow-xl"
                title="Content moderation and student management"
              >
                <span className="text-base sm:text-lg">🛡️</span>
                <span className="font-medium text-xs sm:text-sm hidden sm:inline">Moderate</span>
              </button>
              
              {/* Create Button */}
              <button
                onClick={() => router.push('/instructor/classes/create')}
                className="flex items-center space-x-1 sm:space-x-2 bg-indigo-600 text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors shadow-lg hover:shadow-xl"
                title="Create a new class using the form"
              >
                <span className="text-base sm:text-lg">+</span>
                <span className="font-medium text-xs sm:text-sm hidden sm:inline">Create</span>
              </button>
              
              {/* Lesson Modules Button */}
              <button
                onClick={() => router.push('/instructor/lesson-modules')}
                className="flex items-center space-x-1 sm:space-x-2 bg-purple-600 text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
                title="Create and manage lesson modules"
              >
                <span className="text-base sm:text-lg">📚</span>
                <span className="font-medium text-xs sm:text-sm hidden sm:inline">Modules</span>
              </button>
              
              {/* Profile Avatar */}
              <Avatar
                user={user}
                size="lg"
                onClick={() => router.push('/instructor/profile')}
                className="shadow-lg hover:scale-110 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Greeting Bar */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">{getGreeting()}</h1>
            <p className="text-indigo-100">Ready to inspire your students today?</p>
          </div>
        </div>

        {/* Status Bar with Course Selection */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-gray-800 font-medium">
                Instructor Portal
              </div>
              
              {/* Course Selection Dropdown */}
              {courses.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Current Course:</span>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a course...</option>
                    {courses.map((course) => (
                      <option key={course.courseId} value={course.courseId}>
                        {course.title} ({course.studentCount} students)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {/* School Logo - Right Side */}
            {(user as any)?.schoolLogo && (
              <img
                src={(user as any).schoolLogo}
                alt="School Logo"
                className="h-6 w-auto object-contain"
              />
            )}
          </div>
        </div>

        {/* Main Content - Assignment Management */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : selectedCourse ? (
            <AssignmentManagement 
              courseId={selectedCourse.courseId}
              courseName={selectedCourse.title}
            />
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="text-center">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                  {courses.length === 0 ? 'No Courses Yet' : 'Select a Course'}
                </h3>
                <p className="text-gray-600 mb-8">
                  {courses.length === 0 
                    ? 'Create your first course to get started teaching.'
                    : 'Choose a course from the dropdown above to view its assignments and students.'
                  }
                </p>
                {courses.length === 0 && (
                  <div className="flex space-x-4 justify-center">
                    <button
                      onClick={() => router.push('/instructor/classes/create')}
                      className="px-6 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                    >
                      + Create Course
                    </button>
                    <button
                      onClick={() => router.push('/instructor/classes/create')}
                      className="px-6 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
                    >
                      🧙 Start Wizard
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </InstructorRoute>
  );
};

export default InstructorDashboard;