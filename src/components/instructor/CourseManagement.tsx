'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Course, CreateCourseData, UpdateCourseData } from '@/types/course';
import { CourseCard } from './CourseCard';
import { CourseForm } from './CourseForm';
import { CourseFilters } from './CourseFilters';
import BulkEnrollmentWizard from './BulkEnrollmentWizard';
import LoadingSpinner from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import InstructorOnboardingWizard from '../wizards/InstructorOnboardingWizard';

export const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showBulkEnrollment, setShowBulkEnrollment] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [filters, setFilters] = useState({
    department: '',
    semester: '',
    year: '',
    status: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      if (filters.department) params.append('department', filters.department);
      if (filters.semester) params.append('semester', filters.semester);
      if (filters.year) params.append('year', filters.year);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/courses?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setCourses(data.data.courses);
        setPagination(prev => ({
          ...prev,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages,
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch courses');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  // Create course
  const handleCreateCourse = async (courseData: CreateCourseData | UpdateCourseData) => {
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        setCourses(prev => [data.data, ...prev]);
        setShowForm(false);
        return { success: true, message: 'Course created successfully' };
      } else {
        return { success: false, message: data.error || 'Failed to create course' };
      }
    } catch (error) {
      console.error('Error creating course:', error);
      return { success: false, message: 'Failed to create course' };
    }
  };

  // Update course
  const handleUpdateCourse = async (courseId: string, updateData: UpdateCourseData) => {
    try {
      const response = await fetch('/api/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, ...updateData }),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        setCourses(prev => prev.map(course => 
          course.courseId === courseId 
            ? { ...course, ...updateData }
            : course
        ));
        setEditingCourse(null);
        return { success: true, message: 'Course updated successfully' };
      } else {
        return { success: false, message: data.error || 'Failed to update course' };
      }
    } catch (error) {
      console.error('Error updating course:', error);
      return { success: false, message: 'Failed to update course' };
    }
  };

  // Delete course
  const handleDeleteCourse = async (courseId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/instructor/courses/${courseId}/delete`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        setCourses(prev => prev.filter(course => course.courseId !== courseId));
        
        // Build detailed deletion report
        const report = data.report;
        let message = `✅ Course deleted successfully!\n\n`;
        message += `📊 Deletion Report:\n`;
        message += `• Assignments: ${report.deletedAssignments}\n`;
        message += `• Submissions: ${report.deletedSubmissions}\n`;
        message += `• Peer Responses: ${report.deletedPeerResponses}\n`;
        message += `• Videos from S3: ${report.deletedVideos}`;
        
        if (report.failedVideoDeletes > 0) {
          message += `\n⚠️  Failed to delete ${report.failedVideoDeletes} videos from S3`;
        }
        
        if (report.errors && report.errors.length > 0) {
          message += `\n\n⚠️  Warnings:\n${report.errors.join('\n')}`;
        }
        
        alert(message);
        return { success: true, message: 'Course deleted successfully' };
      } else {
        const errorMsg = data.details || data.error || 'Unknown error';
        let message = `❌ Failed to delete course: ${errorMsg}`;
        
        // Show partial deletion report if available
        if (data.partialReport) {
          const pr = data.partialReport;
          message += `\n\n📊 Partial Deletion Report:\n`;
          message += `• Assignments: ${pr.assignments}\n`;
          message += `• Submissions: ${pr.submissions}\n`;
          message += `• Peer Responses: ${pr.peerResponses}\n`;
          message += `• Videos: ${pr.videosDeleted}`;
          
          if (pr.errors && pr.errors.length > 0) {
            message += `\n\nErrors:\n${pr.errors.join('\n')}`;
          }
        }
        
        alert(message);
        return { success: false, message: data.error || 'Failed to delete course' };
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course. Please try again.');
      return { success: false, message: 'Failed to delete course' };
    } finally {
      setLoading(false);
    }
  };

  // Archive course
  const handleArchiveCourse = async (courseId: string) => {
    return handleUpdateCourse(courseId, { status: 'archived' });
  };

  // Publish course
  const handlePublishCourse = async (courseId: string) => {
    return handleUpdateCourse(courseId, { status: 'published' });
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Bulk enroll students
  const handleBulkEnroll = useCallback((course: Course) => {
    setSelectedCourse(course);
    setShowBulkEnrollment(true);
  }, []);

  const handleEnrollmentComplete = useCallback((enrolledCount: number) => {
    // Refresh courses to update enrollment counts
    fetchCourses();
    
    // Show success message
    alert(`Successfully enrolled ${enrolledCount} students!`);
  }, [fetchCourses]);

  // Fetch courses when dependencies change
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Error Loading Courses"
        description={error}
        icon="error"
        action={{
          label: 'Try Again',
          onClick: fetchCourses,
          variant: 'primary',
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/MyClassCast (800 x 200 px).png" 
                alt="ClassCast Logo" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">My Classes</h1>
                <p className="text-gray-600">
                  {courses.length} class{courses.length !== 1 ? 'es' : ''} total
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors mr-2"
            >
              + Create
            </button>
            <button
              onClick={() => setShowWizard(true)}
              className="px-4 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
            >
              🧙 Wizard
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <CourseFilters
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Course Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">No Classes Yet</h3>
            <p className="text-gray-600 mb-8">Create your first class to get started teaching.</p>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                + Create Class
              </button>
              <button
                onClick={() => setShowWizard(true)}
                className="px-6 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
              >
                🧙 Start Wizard
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {courses.map((course) => (
              <CourseCard
                key={course.courseId}
                course={course}
                onEdit={(course) => setEditingCourse(course)}
                onDelete={handleDeleteCourse}
                onArchive={handleArchiveCourse}
                onPublish={handlePublishCourse}
                onBulkEnroll={handleBulkEnroll}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <div className="flex items-center space-x-2 bg-white rounded-xl shadow-lg border border-gray-200/30 p-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 rounded-lg transition-colors"
              >
                ← Previous
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-700 font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 rounded-lg transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Course Form Modal */}
      {showForm && (
        <CourseForm
          course={null}
          onSubmit={handleCreateCourse}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Instructor Onboarding Wizard */}
      <InstructorOnboardingWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={() => {
          setShowWizard(false);
          // Optionally refresh course data or show success message
        }}
        isFirstTime={false}
      />

      {/* Edit Course Modal */}
      {editingCourse && (
        <CourseForm
          course={editingCourse}
          onSubmit={(updateData) => handleUpdateCourse(editingCourse.courseId, updateData)}
          onCancel={() => setEditingCourse(null)}
        />
      )}

      {/* Bulk Enrollment Wizard */}
      {showBulkEnrollment && selectedCourse && (
        <BulkEnrollmentWizard
          isOpen={showBulkEnrollment}
          onClose={() => {
            setShowBulkEnrollment(false);
            setSelectedCourse(null);
          }}
          courseId={selectedCourse.courseId}
          courseName={selectedCourse.title}
          onEnrollmentComplete={handleEnrollmentComplete}
        />
      )}
    </div>
  );
};
