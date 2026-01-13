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
            {user?.schoolLogo && (
              <img
                src={user.schoolLogo}
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
                    setShowWizard(true);
                  }}
                  className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-purple-600 transition-colors font-medium"
                >
                  Start Setup Wizard
                </button>
                
                <button
                  onClick={() => {
                    setShowFirstTimeWizard(false);
                    router.push('/instructor/classes/create');
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Create Class Manually
                </button>
                
                <div className="flex items-center justify-center pt-4">
                  <label className="flex items-center text-sm text-gray-600">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          localStorage.setItem('instructor-wizard-seen', 'true');
                        }
                      }}
                      className="mr-2"
                    />
                    Don't show this again
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student List Modal */}
        {showStudentList && selectedCourse && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Students Enrolled</h2>
                  <p className="text-gray-600">{selectedCourse.title}</p>
                </div>
                <button
                  onClick={() => setShowStudentList(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Student List */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingStudents ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-gray-600">Loading students...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courseStudents.map((student) => (
                    <div key={student.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                          {student.name.charAt(0)}
            </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">{student.name}</h3>
                          <p className="text-sm text-gray-600 truncate">{student.email}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>📅 Enrolled: {new Date(student.enrollmentDate).toLocaleDateString()}</span>
                            <span>📊 {student.submissionsCount} submissions</span>
          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              Last active: {new Date(student.lastActive).toLocaleDateString()}
                            </span>
                            {student.averageGrade > 0 && (
                              <span className="text-xs font-medium text-indigo-600">
                                Avg: {student.averageGrade}%
                              </span>
                            )}
            </div>
          </div>
                      </div>
                    </div>
                    ))}
                  </div>
                )}

                {courseStudents.length === 0 && !loadingStudents && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">👥</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Students Enrolled</h3>
                    <p className="text-gray-600">This class doesn't have any enrolled students yet.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Total: {courseStudents.length} students
                  </span>
            <button
                    onClick={() => setShowStudentList(false)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
                    Close
            </button>
          </div>
            </div>
            </div>
          </div>
        )}

        {/* Clone Class Modal */}
        {showCloneModal && courseToClone && (
          <CloneClassModal
            course={courseToClone}
            onClose={() => {
              setShowCloneModal(false);
              setCourseToClone(null);
            }}
            onClone={async (newClassData) => {
              setIsCloning(true);
              try {
                const response = await fetch('/api/courses/clone', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    sourceCourseId: courseToClone.id,
                    ...newClassData
                  }),
                });

                if (!response.ok) {
                  throw new Error('Failed to clone class');
                }

                const data = await response.json();
                console.log('Class cloned successfully:', data);

                // Refresh courses list with proper enrichment
                const coursesResponse = await fetch('/api/courses', {
                  credentials: 'include',
                });
                if (coursesResponse.ok) {
                  const coursesData = await coursesResponse.json();
                  console.log('Refreshing courses after clone:', coursesData);
                  
                  // Use the same format as initial load
                  const coursesArray = coursesData.data?.courses || coursesData.courses || [];
                  
                  if (Array.isArray(coursesArray)) {
                    // Map courseId to id for compatibility
                    const mappedCourses = coursesArray.map((course: any) => ({
                      ...course,
                      id: course.id || course.courseId,
                      courseId: course.id || course.courseId
                    }));
                    
                    // Fetch ungraded submission counts for each course
                    const coursesWithSubmissionCounts = await Promise.all(
                      mappedCourses.map(async (course: any) => {
                        try {
                          const submissionsResponse = await fetch(`/api/instructor/video-submissions?courseId=${course.id}`);
                          if (submissionsResponse.ok) {
                            const submissionsData = await submissionsResponse.json();
                            const submissions = submissionsData.submissions || [];
                            const ungradedCount = submissions.filter((sub: any) => 
                              sub.grade === null || sub.grade === undefined
                            ).length;
                            return {
                              ...course,
                              ungradedSubmissions: ungradedCount
                            };
                          }
                        } catch (error) {
                          console.error(`Error fetching submissions for course ${course.id}:`, error);
                        }
                        return {
                          ...course,
                          ungradedSubmissions: 0
                        };
                      })
                    );
                    
                    setCourses(coursesWithSubmissionCounts);
                    console.log('Courses refreshed successfully after clone:', coursesWithSubmissionCounts.length);
                  }
                }

                setShowCloneModal(false);
                setCourseToClone(null);
                
                // Show success message
                alert(`Class "${newClassData.name}" has been created successfully!`);
              } catch (error) {
                console.error('Error cloning class:', error);
                alert('Failed to clone class. Please try again.');
              } finally {
                setIsCloning(false);
              }
            }}
            isCloning={isCloning}
          />
        )}
      </div>
    </InstructorRoute>
  );
};

// Clone Class Modal Component
interface CloneClassModalProps {
  course: Course;
  onClose: () => void;
  onClone: (newClassData: { name: string; code: string; description: string }) => Promise<void>;
  isCloning: boolean;
}

const CloneClassModal: React.FC<CloneClassModalProps> = ({ course, onClose, onClone, isCloning }) => {
  const [className, setClassName] = useState(`${course.title} (Copy)`);
  const [classCode, setClassCode] = useState(`${course.code}-COPY`);
  const [description, setDescription] = useState(course.description || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onClone({
      name: className,
      code: classCode,
      description: description
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Clone Class</h2>
            <p className="text-sm text-gray-600 mt-1">
              Create a copy of <span className="font-semibold">{course.title}</span> with all assignments
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isCloning}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">What will be cloned:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>All assignments and their settings</li>
                  <li>Assignment descriptions and instructions</li>
                  <li>Rubrics and grading criteria</li>
                  <li>Course description and settings</li>
                </ul>
                <p className="mt-2 text-xs text-blue-600">
                  <strong>Note:</strong> Student enrollments and submissions will NOT be copied.
                </p>
              </div>
            </div>
          </div>

          {/* Class Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Class Name *
            </label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Integrated Math 2 (Spring 2026)"
              required
              disabled={isCloning}
            />
          </div>

          {/* Class Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class Code *
            </label>
            <input
              type="text"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., MAT249-COPY"
              required
              disabled={isCloning}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Course description..."
              disabled={isCloning}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isCloning}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCloning || !className.trim() || !classCode.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCloning ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Cloning...</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Clone Class</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstructorDashboard;

