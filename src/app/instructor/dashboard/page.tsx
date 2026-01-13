'use client';

import React, { useState, useEffect } from 'react';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/common/Avatar';
import NotificationBell from '@/components/common/NotificationBell';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { CourseManagement } from '@/components/instructor/CourseManagement';

interface Course {
  courseId: string;
  title: string;
  studentCount?: number;
  status?: string;
}

/**
 * Enhanced Instructor Dashboard
 * 
 * Combines the useful top banner (Moderate/Create/Wizard buttons) with 
 * the courses page functionality and adds a course selection dropdown
 * for easy switching between courses.
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
  }, [user?.id, selectedCourseId]);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    if (courseId) {
      router.push(`/instructor/courses/${courseId}`);
    }
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
              
              {/* Wizard Button */}
              <button
                onClick={() => router.push('/instructor/classes/create')} // Could also open a wizard modal
                className="flex items-center space-x-1 sm:space-x-2 bg-purple-600 text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
                title="Create a new class using the wizard"
              >
                <span className="text-base sm:text-lg">🧙</span>
                <span className="font-medium text-xs sm:text-sm hidden sm:inline">Wizard</span>
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

        {/* Status Bar with Course Selection */}
        <div className="bg-gray-50 border-b border-indigo-600/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-gray-800 font-medium">
                Instructor Portal
              </div>
              
              {/* Course Selection Dropdown */}
              {courses.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Quick Switch:</span>
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

        {/* Main Content - Course Management */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <CourseManagement />
          )}
        </div>
      </div>
    </InstructorRoute>
  );
};

export default InstructorDashboard;