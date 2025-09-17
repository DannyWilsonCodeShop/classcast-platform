'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Course, CreateCourseData, UpdateCourseData } from '@/types/course';
import { CourseCard } from './CourseCard';
import { CourseForm } from './CourseForm';
import { CourseFilters } from './CourseFilters';
import BulkEnrollmentWizard from './BulkEnrollmentWizard';
import LoadingSpinner from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

export const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
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
  const handleCreateCourse = async (courseData: CreateCourseData) => {
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
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses?courseId=${courseId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        setCourses(prev => prev.filter(course => course.courseId !== courseId));
        return { success: true, message: 'Course deleted successfully' };
      } else {
        return { success: false, message: data.error || 'Failed to delete course' };
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      return { success: false, message: 'Failed to delete course' };
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
          <p className="mt-2 text-gray-600">
            Create and manage your courses
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#003366] text-white px-4 py-2 rounded-lg hover:bg-[#003366]/90 transition-colors"
        >
          Create New Course
        </button>
      </div>

      {/* Filters */}
      <CourseFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Course Grid */}
      {courses.length === 0 ? (
        <EmptyState
          title="No Courses Found"
          description="Create your first course to get started"
          icon="course"
          action={{
            label: 'Create Course',
            onClick: () => setShowForm(true),
            variant: 'primary',
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <span className="px-4 py-2 text-sm text-gray-700">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Course Form Modal */}
      {showForm && (
        <CourseForm
          course={null}
          onSubmit={handleCreateCourse}
          onCancel={() => setShowForm(false)}
        />
      )}

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
