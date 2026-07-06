'use client';

import React, { useState, useEffect } from 'react';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NotificationBell from '@/components/common/NotificationBell';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { AssignmentManagement } from '@/components/instructor/AssignmentManagement';
import { useIsWideScreen } from '@/hooks/useIsWideScreen';

interface Course {
  courseId: string;
  title: string;
  code?: string;
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
  const { isWide } = useIsWideScreen();
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
              code: course.code || course.courseCode,
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

  return (
    <InstructorRoute>
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&family=Oswald:wght@300;700&display=swap" rel="stylesheet" />
      <div className={`min-h-screen ${isWide ? 'bg-transparent' : 'bg-white'}`}>
        {/* Top Banner - only show on mobile (sidebar handles nav on wide) */}
        {!isWide && (
          <div className="flex items-center justify-between px-4 pt-2 pb-1 shrink-0 bg-white">
            <div className="flex items-center gap-1">
              <span style={{ fontFamily: "'Grand Hotel', cursive", color: '#005587' }} className="text-3xl">ClassCast</span>
              <img src="/UpdatedCCLogo.png" alt="" className="w-6 h-6 object-contain" />
            </div>
            <div className="flex items-center gap-2">
              {user?.id && <NotificationBell userId={user.id} userRole="instructor" className="flex-shrink-0" />}
              <img src="/CristoReyLogo.png" alt="" className="w-14 h-14 object-contain" />
            </div>
          </div>
        )}

        {/* Status Bar with Course Selection */}
        <div className="bg-white px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-bold text-[#005587]" style={{ fontFamily: "'Oswald', sans-serif" }}>INSTRUCTOR DASHBOARD</h2>
              
              {/* Course Selection Dropdown */}
              {courses.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Current Course:</span>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                  >
                    <option value="">Select a course...</option>
                    {courses.map((course) => (
                      <option key={course.courseId} value={course.courseId}>
                        {course.code ? `${course.code} - ` : ''}{course.title} ({course.studentCount} students)
                      </option>
                    ))}
                  </select>
                  
                  {/* Edit Course Button */}
                  {selectedCourseId && (
                    <button
                      onClick={() => router.push(`/instructor/courses/${selectedCourseId}?openSettings=true`)}
                      className="px-3 py-1.5 bg-[#005587]/10 text-[#005587] border border-[#005587]/20 rounded-lg text-sm font-medium hover:bg-[#005587]/20 transition-colors flex items-center space-x-1"
                      title="Edit course details, assignments, and students"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit Course</span>
                    </button>
                  )}
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
                      className="px-6 py-4 bg-[#005587] text-white rounded-xl font-bold hover:bg-[#004470] transition-colors"
                    >
                      + Create Course
                    </button>
                    <button
                      onClick={() => router.push('/instructor/classes/create')}
                      className="px-6 py-4 bg-[#FFC72C] text-[#005587] rounded-xl font-bold hover:bg-[#e6b225] transition-colors"
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