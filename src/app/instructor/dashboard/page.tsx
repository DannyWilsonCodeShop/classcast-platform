'use client';

import React, { useState, useEffect } from 'react';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useIsWideScreen } from '@/hooks/useIsWideScreen';

interface Course {
  courseId: string;
  title: string;
  code?: string;
  classCode?: string;
  studentCount?: number;
  status?: string;
}

interface Assignment {
  assignmentId: string;
  title: string;
  dueDate: string;
  points: number;
  status: string;
  submissionsCount: number;
  gradedCount: number;
  courseId: string;
  assignmentType?: string;
}

const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { isWide } = useIsWideScreen();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('classcast_instructor_selected_course') || '';
    }
    return '';
  });
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [showCourseMenu, setShowCourseMenu] = useState(false);
  const [courseActionLoading, setCourseActionLoading] = useState(false);

  // Study-hall-only accounts don't use the dashboard — send them to Study Hall.
  useEffect(() => {
    if ((user as any)?.studyHallOnly === true) {
      router.replace('/instructor/study-hall');
    }
  }, [user, router]);

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
              classCode: course.classCode || '',
              studentCount: course.studentCount || course.currentEnrollment || 0,
              status: course.status || 'published'
            }));
            setCourses(mappedCourses);
            
            if (mappedCourses.length > 0 && !selectedCourseId) {
              // Check if saved course still exists in the list
              const saved = localStorage.getItem('classcast_instructor_selected_course');
              if (saved && mappedCourses.some((c: Course) => c.courseId === saved)) {
                setSelectedCourseId(saved);
              } else {
                setSelectedCourseId(mappedCourses[0].courseId);
              }
            }

            // If no courses, check if user is team-only → redirect to Study Hall
            if (mappedCourses.length === 0) {
              try {
                const teamRes = await fetch(`/api/teams?memberId=${user?.id}`);
                const teamData = await teamRes.json();
                if (teamData.success && teamData.teams?.length > 0) {
                  router.push('/instructor/study-hall');
                  return;
                }
              } catch {}
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

  // Persist selected course to localStorage
  useEffect(() => {
    if (selectedCourseId) {
      localStorage.setItem('classcast_instructor_selected_course', selectedCourseId);
    }
  }, [selectedCourseId]);

  // Fetch assignments when course changes
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!selectedCourseId) {
        setAssignments([]);
        return;
      }
      try {
        setAssignmentsLoading(true);
        const response = await fetch(`/api/assignments?courseId=${selectedCourseId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const mapped = (data.data.assignments || []).map((a: any) => ({
              assignmentId: a.assignmentId || a.id,
              title: a.title,
              dueDate: a.dueDate,
              points: a.maxScore || a.points || 100,
              status: a.status || 'published',
              submissionsCount: a.submissionsCount || 0,
              gradedCount: a.gradedCount || 0,
              courseId: selectedCourseId,
              assignmentType: a.assignmentType || 'video',
              createdAt: a.createdAt || '',
            })).sort((a: any, b: any) => {
              // Most recently created first
              const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return bTime - aTime;
            });
            setAssignments(mapped);
          }
        }
      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setAssignmentsLoading(false);
      }
    };

    fetchAssignments();
  }, [selectedCourseId]);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
  };

  const selectedCourse = courses.find(course => course.courseId === selectedCourseId);

  const handleDeleteCourse = async () => {
    if (!selectedCourseId) return;
    const courseName = selectedCourse?.title || 'this course';
    if (!confirm(`Are you sure you want to delete "${courseName}"? This will permanently remove all assignments, submissions, and videos. This cannot be undone.`)) return;
    
    setCourseActionLoading(true);
    setShowCourseMenu(false);
    try {
      const response = await fetch(`/api/instructor/courses/${selectedCourseId}/delete`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setCourses(prev => prev.filter(c => c.courseId !== selectedCourseId));
        setSelectedCourseId('');
        setAssignments([]);
      } else {
        alert(`Failed to delete course: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to delete course. Please try again.');
    } finally {
      setCourseActionLoading(false);
    }
  };

  const handleArchiveCourse = async () => {
    if (!selectedCourseId) return;
    setShowCourseMenu(false);
    setCourseActionLoading(true);
    try {
      const response = await fetch('/api/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourseId, status: 'archived' }),
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setCourses(prev => prev.map(c => c.courseId === selectedCourseId ? { ...c, status: 'archived' } : c));
      } else {
        alert(`Failed to archive course: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to archive course. Please try again.');
    } finally {
      setCourseActionLoading(false);
    }
  };

  return (
    <InstructorRoute>
      <div className={`min-h-full overflow-y-auto pb-24 ${isWide ? 'bg-[#faf9f7]' : 'bg-[#faf9f7]'}`}>
        {/* NOTE: Mobile header is handled by instructor layout — do NOT add one here */}

        {/* Course Selector */}
        <div className={`px-4 ${isWide ? 'pt-6 pb-3' : 'py-3'}`}>
          {courses.length > 0 && (
            <div className={`${isWide ? 'flex items-center gap-3' : 'flex items-center gap-2'}`}>
              {isWide && (
                <label className="text-sm font-medium text-stone-500 whitespace-nowrap">Course:</label>
              )}
              <select
                value={selectedCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className={`px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#005587] ${isWide ? 'max-w-[300px]' : 'flex-1'}`}
              >
                <option value="" className="font-normal text-gray-500">Select a course...</option>
                {courses.map((course) => (
                  <option key={course.courseId} value={course.courseId} className="font-bold">
                    {course.title}{course.status === 'archived' ? ' (Archived)' : ''}
                  </option>
                ))}
              </select>

              {/* Course actions menu */}
              {selectedCourseId && (
                <div className="relative">
                  <button
                    onClick={() => setShowCourseMenu(!showCourseMenu)}
                    disabled={courseActionLoading}
                    className="p-2 text-gray-400 hover:text-[#005587] hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    aria-label="Course actions"
                  >
                    {courseActionLoading ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    )}
                  </button>

                  {showCourseMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowCourseMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]">
                        {selectedCourse?.status !== 'archived' && (
                          <button
                            onClick={handleArchiveCourse}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <span>📦</span> Archive Course
                          </button>
                        )}
                        <button
                          onClick={handleDeleteCourse}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <span>🗑️</span> Delete Course
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Assignments List */}
        <div className="px-4 pb-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !selectedCourse ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              {courses.length === 0 ? (
                <>
                  <div className="w-20 h-20 bg-[#005587]/10 rounded-full flex items-center justify-center mb-5">
                    <svg className="w-10 h-10 text-[#005587]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>Welcome to ClassCast</h3>
                  <p className="text-sm text-stone-500 text-center mb-6 max-w-[260px]">
                    Create your first course to start assigning video work and engaging students.
                  </p>
                  <button
                    onClick={() => router.push('/instructor/classes/create')}
                    className="px-6 py-3 bg-[#005587] text-white rounded-xl font-bold text-sm hover:bg-[#004470] transition-colors"
                  >
                    + Create Your First Course
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7l4-4m0 0l4 4m-4-4v18" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Select a course above to view assignments</p>
                </>
              )}
            </div>
          ) : assignmentsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="sm" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-sm text-gray-600 mb-4">No assignments yet</p>
              <button
                onClick={() => router.push('/instructor/assignments/create')}
                className="px-4 py-2 bg-[#FFC72C] text-[#005587] rounded-xl font-bold text-sm"
              >
                + Create Assignment
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => {
                const typeLabel = assignment.assignmentType === 'discussion' ? 'Discussion' : assignment.assignmentType === 'assessment' ? 'Assessment' : assignment.assignmentType === 'module' || assignment.assignmentType === 'group-project' ? 'Group' : assignment.assignmentType === 'study-module' ? 'Module' : '';
                return (
                <div
                  key={assignment.assignmentId}
                  className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-sm"
                  style={{ borderLeft: '3px solid #005587' }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-stone-900 line-clamp-1">{assignment.title}</h3>
                      {typeLabel && <span className="text-[9px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full shrink-0">{typeLabel}</span>}
                    </div>
                    <span className="text-xs font-medium text-stone-500 shrink-0 ml-2">{assignment.points} pts</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-400 mb-3">
                    <span>Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    <span className="text-green-600 font-medium">{assignment.gradedCount}/{assignment.submissionsCount} graded</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/instructor/courses/${selectedCourseId}/assignments/${assignment.assignmentId}/grades`)}
                      className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-full text-[11px] font-medium text-stone-600 active:scale-95 transition-transform"
                    >
                      View
                    </button>
                    <button
                      onClick={() => router.push(`/instructor/grading/bulk?course=${selectedCourseId}&assignment=${assignment.assignmentId}`)}
                      className="px-3 py-1.5 bg-[#005587] rounded-full text-[11px] font-medium text-white active:scale-95 transition-transform"
                    >
                      Grade
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </InstructorRoute>
  );
};

export default InstructorDashboard;
