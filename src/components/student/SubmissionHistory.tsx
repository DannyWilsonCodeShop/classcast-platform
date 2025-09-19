'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SubmissionCard } from './SubmissionCard';
import { SubmissionFilters } from './SubmissionFilters';
import { SubmissionSort } from './SubmissionSort';
import { Pagination } from '../common/Pagination';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

export interface SubmissionHistoryProps {
  title?: string;
  maxItems?: number;
  showFilters?: boolean;
  showSort?: boolean;
  className?: string;
}

export interface SubmissionData {
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  studentId: string;
  studentName: string;
  status: string;
  submittedAt: string;
  processedAt?: string;
  grade?: number;
  maxScore?: number;
  feedback?: string;
  videoUrl?: string;
  videoUrlExpiry?: string;
  thumbnailUrls?: string[];
  videoDuration?: number;
  videoResolution?: { width: number; height: number };
  processingDuration?: number;
  errorMessage?: string;
  retryCount: number;
  metadata: Record<string, any>;
  files: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
    uploadedAt: string;
  }>;
}

export interface SubmissionFiltersState {
  status: string;
  hasGrade: boolean | null;
  courseId: string;
  assignmentId: string;
  submittedAfter: string;
  submittedBefore: string;
  search: string;
}

export interface SubmissionSortState {
  field: 'submittedAt' | 'grade' | 'status' | 'assignmentTitle';
  order: 'asc' | 'desc';
}

export const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({
  title = 'My Submissions',
  maxItems,
  showFilters = true,
  showSort = true,
  className = '',
}) => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SubmissionFiltersState>({
    status: '',
    hasGrade: null,
    courseId: '',
    assignmentId: '',
    submittedAfter: '',
    submittedBefore: '',
    search: '',
  });
  const [sort, setSort] = useState<SubmissionSortState>({
    field: 'submittedAt',
    order: 'desc',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: maxItems || 20,
  });

  const fetchSubmissions = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      // Add filters
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.hasGrade !== null) queryParams.append('hasGrade', filters.hasGrade.toString());
      if (filters.courseId) queryParams.append('courseId', filters.courseId);
      if (filters.assignmentId) queryParams.append('assignmentId', filters.assignmentId);
      if (filters.submittedAfter) queryParams.append('submittedAfter', filters.submittedAfter);
      if (filters.submittedBefore) queryParams.append('submittedBefore', filters.submittedBefore);
      
      // Add sorting
      queryParams.append('sortBy', sort.field);
      queryParams.append('sortOrder', sort.order);
      
      // Add pagination
      queryParams.append('page', pagination.currentPage.toString());
      queryParams.append('limit', pagination.itemsPerPage.toString());
      
      // Include video URLs for playback
      queryParams.append('includeVideoUrls', 'true');
      queryParams.append('videoUrlExpiry', '900'); // 15 minutes

      const response = await fetch(`/api/submissions?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch submissions: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setSubmissions(data.data.submissions || []);
        setPagination(prev => ({
          ...prev,
          totalPages: data.data.totalPages || 1,
          totalItems: data.data.totalCount || 0,
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch submissions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch submissions');
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  }, [user, filters, sort, pagination.currentPage, pagination.itemsPerPage]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleFilterChange = useCallback((newFilters: Partial<SubmissionFiltersState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleSortChange = useCallback((newSort: Partial<SubmissionSortState>) => {
    setSort(prev => ({ ...prev, ...newSort }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      status: '',
      hasGrade: null,
      courseId: '',
      assignmentId: '',
      submittedAfter: '',
      submittedBefore: '',
      search: '',
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  if (loading && submissions.length === 0) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && submissions.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          title="Error Loading Submissions"
          description={error}
          icon="error"
          action={{
            label: 'Try Again',
            onClick: fetchSubmissions,
          }}
        />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          title="No Submissions Found"
          description="You haven't submitted any assignments yet, or no submissions match your current filters."
          icon="submission"
          action={{
            label: 'Clear Filters',
            onClick: clearFilters,
          }}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600">
            {pagination.totalItems} submission{pagination.totalItems !== 1 ? 's' : ''} found
          </p>
        </div>
        
        {showFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Filters and Sort */}
      {showFilters && (
        <SubmissionFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      )}

      {showSort && (
        <SubmissionSort
          sort={sort}
          onSortChange={handleSortChange}
        />
      )}

      {/* Submissions Grid */}
      <div className="grid grid-cols-1 gap-6">
        {submissions.map((submission) => (
          <SubmissionCard
            key={submission.submissionId}
            submission={submission}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
        />
      )}
    </div>
  );
};

