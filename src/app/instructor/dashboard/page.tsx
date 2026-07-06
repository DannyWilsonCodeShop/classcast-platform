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
              studentCount: course.studentCount || course.currentEnrollment || course.enrollment?.students?.length || 0,
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

        {/* Page Title + Course Selector */}
        <div className="px-4 py-2">
          <h2 className="text-base font-bold uppercase text-[#005587] tracking-normal" style={{ fontFamily: "'Oswald', sans-serif" }}>Instructor Dashboard</h2>
          {courses.length > 0 && (
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="mt-1 px-3 py-1.5 bg-gray-100 border-0 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#005587]"
            >
              <option value="">Select a course...</option>
              {courses.map((course) => (
                <option key={course.courseId} value={course.courseId}>
                  {course.title}{course.studentCount ? ` (${course.studentCount})` : ''}
                </option>
              ))}
            </select>
          )}
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