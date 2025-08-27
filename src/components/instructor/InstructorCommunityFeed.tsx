'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { InstructorSubmissionCard } from './InstructorSubmissionCard';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { GradingModal } from './GradingModal';
import { SearchBar } from '../common/SearchBar';
import { FilterDropdown } from '../common/FilterDropdown';
import { Pagination } from '../common/Pagination';
import { InstructorStats } from './InstructorStats';

import { InstructorSubmissionData } from './types';

export interface InstructorCommunityFeedProps {
  instructorId: string;
  className?: string;
}

// Mock data for demonstration
const mockInstructorSubmissions: InstructorSubmissionData[] = [
  {
    id: 'sub-001',
    studentId: 'student-001',
    studentName: 'Alex Johnson',
    studentEmail: 'alex.johnson@university.edu',
    assignmentId: 'assign-001',
    assignmentTitle: 'Video Presentation: Modern Web Development',
    courseId: 'course-001',
    courseName: 'Advanced Web Development',
    status: 'submitted',
    submittedAt: '2024-01-15T10:30:00Z',
    processedAt: '2024-01-15T10:35:00Z',
    dueDate: '2024-01-15T23:59:00Z',
    isLate: false,
    maxScore: 100,
    videoDuration: 180,
    videoResolution: { width: 1920, height: 1080 },
    processingDuration: 45,
    priority: 'high',
    reviewStatus: 'pending',
    estimatedGradingTime: 15,
    tags: ['video', 'presentation', 'web-dev'],
    files: [
      {
        name: 'presentation.mp4',
        url: '/videos/presentation.mp4',
        type: 'video/mp4',
        size: 25600000,
        uploadedAt: '2024-01-15T10:30:00Z'
      },
      {
        name: 'slides.pdf',
        url: '/files/slides.pdf',
        type: 'application/pdf',
        size: 2048000,
        uploadedAt: '2024-01-15T10:30:00Z'
      }
    ],
    likes: [
      { userId: 'student-002', userName: 'Sarah Chen', createdAt: '2024-01-15T12:00:00Z' }
    ],
    comments: [
      {
        id: 'comment-001',
        text: 'Great job explaining the concepts!',
        authorId: 'student-002',
        authorName: 'Sarah Chen',
        authorType: 'student',
        createdAt: '2024-01-15T12:00:00Z'
      }
    ]
  },
  {
    id: 'sub-002',
    studentId: 'student-002',
    studentName: 'Sarah Chen',
    studentEmail: 'sarah.chen@university.edu',
    assignmentId: 'assign-001',
    assignmentTitle: 'Video Presentation: Modern Web Development',
    courseId: 'course-001',
    courseName: 'Advanced Web Development',
    status: 'completed',
    submittedAt: '2024-01-14T15:45:00Z',
    processedAt: '2024-01-14T15:50:00Z',
    dueDate: '2024-01-15T23:59:00Z',
    isLate: false,
    grade: 88,
    maxScore: 100,
    feedback: 'Good content and structure. Consider improving video lighting and audio quality for future presentations.',
    instructorNotes: 'Student shows good understanding of concepts. Video quality could be improved.',
    videoDuration: 165,
    videoResolution: { width: 1280, height: 720 },
    processingDuration: 38,
    priority: 'medium',
    reviewStatus: 'completed',
    estimatedGradingTime: 12,
    tags: ['video', 'presentation'],
    files: [
      {
        name: 'web-dev-presentation.mp4',
        url: '/videos/web-dev-presentation.mp4',
        type: 'video/mp4',
        size: 18900000,
        uploadedAt: '2024-01-14T15:45:00Z'
      }
    ],
    likes: [],
    comments: []
  },
  {
    id: 'sub-003',
    studentId: 'student-003',
    studentName: 'Mike Rodriguez',
    studentEmail: 'mike.rodriguez@university.edu',
    assignmentId: 'assign-001',
    assignmentTitle: 'Video Presentation: Modern Web Development',
    courseId: 'course-001',
    courseName: 'Advanced Web Development',
    status: 'submitted',
    submittedAt: '2024-01-16T09:15:00Z',
    processedAt: '2024-01-16T09:20:00Z',
    dueDate: '2024-01-15T23:59:00Z',
    isLate: true,
    maxScore: 100,
    videoDuration: 210,
    videoResolution: { width: 1920, height: 1080 },
    processingDuration: 52,
    priority: 'low',
    reviewStatus: 'pending',
    estimatedGradingTime: 18,
    tags: ['video', 'late'],
    files: [
      {
        name: 'web-development-talk.mp4',
        url: '/videos/web-development-talk.mp4',
        type: 'video/mp4',
        size: 32000000,
        uploadedAt: '2024-01-16T09:15:00Z'
      }
    ],
    likes: [],
    comments: []
  }
];

export const InstructorCommunityFeed: React.FC<InstructorCommunityFeedProps> = ({
  instructorId,
  className = '',
}) => {
  const [submissions, setSubmissions] = useState<InstructorSubmissionData[]>(mockInstructorSubmissions);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('priority');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [isLoading, setIsLoading] = useState(false);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [currentGradingSubmission, setCurrentGradingSubmission] = useState<InstructorSubmissionData | null>(null);

  // Filter and sort submissions
  const processedSubmissions = useMemo(() => {
    let filtered = [...submissions];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(submission =>
        submission.assignmentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.courseName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(submission => submission.status === statusFilter);
    }

    // Apply course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(submission => submission.courseId === courseFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(submission => submission.priority === priorityFilter);
    }

    // Apply review status filter
    if (reviewStatusFilter !== 'all') {
      filtered = filtered.filter(submission => submission.reviewStatus === reviewStatusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'recent':
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        case 'oldest':
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        case 'due_date':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'student_name':
          return a.studentName.localeCompare(b.studentName);
        case 'estimated_time':
          return (a.estimatedGradingTime || 0) - (b.estimatedGradingTime || 0);
        case 'late':
          return Number(b.isLate) - Number(a.isLate);
        default:
          return 0;
      }
    });

    return filtered;
  }, [submissions, searchQuery, statusFilter, courseFilter, priorityFilter, reviewStatusFilter, sortBy]);

  // Paginate results
  const paginatedSubmissions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedSubmissions.slice(startIndex, startIndex + itemsPerPage);
  }, [processedSubmissions, currentPage, itemsPerPage]);

  // Get unique courses for filter
  const uniqueCourses = useMemo(() => {
    const courses = submissions.map(sub => ({ id: sub.courseId, name: sub.courseName }));
    return Array.from(new Map(courses.map(course => [course.id, course])).values());
  }, [submissions]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = submissions.length;
    const pending = submissions.filter(s => s.reviewStatus === 'pending').length;
    const inProgress = submissions.filter(s => s.reviewStatus === 'in_progress').length;
    const completed = submissions.filter(s => s.reviewStatus === 'completed').length;
    const late = submissions.filter(s => s.isLate).length;
    const highPriority = submissions.filter(s => s.priority === 'high').length;
    const totalGradingTime = submissions
      .filter(s => s.estimatedGradingTime)
      .reduce((sum, s) => sum + (s.estimatedGradingTime || 0), 0);

    return {
      total,
      pending,
      inProgress,
      completed,
      late,
      highPriority,
      totalGradingTime
    };
  }, [submissions]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  // Handle filters
  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  }, []);

  const handleCourseFilter = useCallback((courseId: string) => {
    setCourseFilter(courseId);
    setCurrentPage(1);
  }, []);

  const handlePriorityFilter = useCallback((priority: string) => {
    setPriorityFilter(priority);
    setCurrentPage(1);
  }, []);

  const handleReviewStatusFilter = useCallback((status: string) => {
    setReviewStatusFilter(status);
    setCurrentPage(1);
  }, []);

  // Handle sorting
  const handleSort = useCallback((sortOption: string) => {
    setSortBy(sortOption);
    setCurrentPage(1);
  }, []);

  // Handle selection
  const handleSelectSubmission = useCallback((id: string, selected: boolean) => {
    setSelectedSubmissions(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedSubmissions(new Set(paginatedSubmissions.map(s => s.id)));
    } else {
      setSelectedSubmissions(new Set());
    }
  }, [paginatedSubmissions]);

  // Handle bulk actions
  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedSubmissions.size === 0) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      switch (action) {
        case 'mark_in_progress':
          setSubmissions(prev => prev.map(sub => 
            selectedSubmissions.has(sub.id)
              ? { ...sub, reviewStatus: 'in_progress' as const }
              : sub
          ));
          break;
        case 'mark_completed':
          setSubmissions(prev => prev.map(sub => 
            selectedSubmissions.has(sub.id)
              ? { ...sub, reviewStatus: 'completed' as const }
              : sub
          ));
          break;
        case 'set_high_priority':
          setSubmissions(prev => prev.map(sub => 
            selectedSubmissions.has(sub.id)
              ? { ...sub, priority: 'high' as const }
              : sub
          ));
          break;
        case 'add_note':
          // This would open a modal for adding notes
          break;
      }

      setSelectedSubmissions(new Set());
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubmissions]);

  // Handle grading
  const handleGradeSubmission = useCallback((submission: InstructorSubmissionData) => {
    setCurrentGradingSubmission(submission);
    setShowGradingModal(true);
  }, []);

  const handleGradingComplete = useCallback((id: string, grade: number, feedback: string, notes?: string) => {
    setSubmissions(prev => prev.map(sub => 
      sub.id === id
        ? {
            ...sub,
            grade,
            feedback,
            instructorNotes: notes,
            status: 'completed' as const,
            reviewStatus: 'completed' as const
          }
        : sub
    ));
    setShowGradingModal(false);
    setCurrentGradingSubmission(null);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setCourseFilter('all');
    setPriorityFilter('all');
    setReviewStatusFilter('all');
    setSortBy('priority');
    setCurrentPage(1);
    setSelectedSubmissions(new Set());
  }, []);

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Instructor Dashboard</h1>
        <p className="text-gray-600">
          Manage student submissions, grade assignments, and track review progress.
        </p>
      </div>

      {/* Statistics Dashboard */}
      <InstructorStats submissions={submissions} className="mb-6" />

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <SearchBar
              placeholder="Search students, assignments, or courses..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full"
            />
          </div>

          {/* Status Filter */}
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={handleStatusFilter}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' }
            ]}
          />

          {/* Course Filter */}
          <FilterDropdown
            label="Course"
            value={courseFilter}
            onChange={handleCourseFilter}
            options={[
              { value: 'all', label: 'All Courses' },
              ...uniqueCourses.map(course => ({
                value: course.id,
                label: course.name
              }))
            ]}
          />

          {/* Priority Filter */}
          <FilterDropdown
            label="Priority"
            value={priorityFilter}
            onChange={handlePriorityFilter}
            options={[
              { value: 'all', label: 'All Priorities' },
              { value: 'high', label: 'High Priority' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'low', label: 'Low Priority' }
            ]}
          />

          {/* Review Status Filter */}
          <FilterDropdown
            label="Review Status"
            value={reviewStatusFilter}
            onChange={handleReviewStatusFilter}
            options={[
              { value: 'all', label: 'All Review Statuses' },
              { value: 'pending', label: 'Pending Review' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' }
            ]}
          />
        </div>

        {/* Additional Controls */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <FilterDropdown
              label="Sort by"
              value={sortBy}
              onChange={handleSort}
              options={[
                { value: 'priority', label: 'Priority (High to Low)' },
                { value: 'recent', label: 'Most Recent' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'due_date', label: 'Due Date' },
                { value: 'student_name', label: 'Student Name' },
                { value: 'estimated_time', label: 'Estimated Grading Time' },
                { value: 'late', label: 'Late Submissions First' }
              ]}
            />

            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              Reset Filters
            </button>
          </div>

          <div className="text-sm text-gray-500">
            {processedSubmissions.length} submission{processedSubmissions.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedSubmissions.size > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedSubmissions.size}
          onBulkAction={handleBulkAction}
          onClearSelection={() => setSelectedSubmissions(new Set())}
          className="mb-4"
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Submissions Grid */}
      {!isLoading && (
        <>
          {paginatedSubmissions.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {paginatedSubmissions.map((submission) => (
                <InstructorSubmissionCard
                  key={submission.id}
                  submission={submission}
                  isSelected={selectedSubmissions.has(submission.id)}
                  onSelect={handleSelectSubmission}
                  onGrade={handleGradeSubmission}
                  instructorId={instructorId}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or filters to find what you're looking for.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {processedSubmissions.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(processedSubmissions.length / itemsPerPage)}
              onPageChange={handlePageChange}
              className="mt-8"
            />
          )}
        </>
      )}

      {/* Grading Modal */}
      {showGradingModal && currentGradingSubmission && (
        <GradingModal
          submission={currentGradingSubmission}
          isOpen={showGradingModal}
          onClose={() => {
            setShowGradingModal(false);
            setCurrentGradingSubmission(null);
          }}
          onSave={handleGradingComplete}
        />
      )}
    </div>
  );
};
