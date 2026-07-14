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
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

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

  return (
    <InstructorRoute>
      <div className={`min-h-full overflow-y-auto pb-24 ${isWide ? 'bg-transparent' : 'bg-white'}`}>
        {/* NOTE: Mobile header is handled by instructor layout — do NOT add one here */}

        {/* Course Selector */}
        <div className={`px-4 ${isWide ? 'pt-4 pb-2' : 'py-2'}`}>
          {courses.length > 0 && (
            <div className={isWide ? 'flex items-center gap-3' : ''}>
              {isWide && (
                <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Course:</label>
              )}
              <select
                value={selectedCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className={`px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-[#005587] focus:outline-none focus:ring-2 focus:ring-[#005587] ${isWide ? 'max-w-[280px]' : 'w-full'}`}
              >
                <option value="" className="font-normal text-gray-500">Select a course...</option>
                {courses.map((course) => (
                  <option key={course.courseId} value={course.courseId} className="font-bold">
                    {course.title}
                  </option>
                ))}
              </select>
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
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📚</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {courses.length === 0 ? 'No Courses Yet' : 'Select a Course'}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {courses.length === 0 
                  ? 'Create your first course to get started.'
                  : 'Choose a course above to view assignments.'
                }
              </p>
              {courses.length === 0 && (
                <button
                  onClick={() => router.push('/instructor/classes/create')}
                  className="px-5 py-3 bg-[#FFC72C] text-[#005587] rounded-xl font-bold"
                >
                  + Create Course
                </button>
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
                  className="bg-gray-50 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-[#005587] line-clamp-1">{assignment.title}</h3>
                      {typeLabel && <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full shrink-0">{typeLabel}</span>}
                    </div>
                    <span className="text-xs font-medium text-[#005587] shrink-0 ml-2">{assignment.points} pts</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    <span>Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    <span className="text-green-600 font-medium">{assignment.gradedCount}/{assignment.submissionsCount} graded</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/instructor/courses/${selectedCourseId}/assignments/${assignment.assignmentId}/grades`)}
                      className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-medium text-gray-600 active:scale-95 transition-transform"
                    >
                      View
                    </button>
                    <button
                      onClick={() => router.push(`/instructor/grading/bulk?course=${selectedCourseId}&assignment=${assignment.assignmentId}`)}
                      className="px-3 py-1 bg-[#005587] rounded-full text-[10px] font-medium text-white active:scale-95 transition-transform"
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
