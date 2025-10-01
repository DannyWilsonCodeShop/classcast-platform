'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Assignment } from '@/types/dynamodb';
import { AssignmentCard } from './AssignmentCard';
import { AssignmentFilters } from './AssignmentFilters';
import { AssignmentSort } from './AssignmentSort';
import { Pagination } from '../common/Pagination';
import LoadingSpinner from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

export interface AssignmentListProps {
  courseId?: string;
  initialFilters?: AssignmentFiltersState;
  showFilters?: boolean;
  showSort?: boolean;
  showPagination?: boolean;
  maxItems?: number;
}

export interface AssignmentFiltersState {
  status?: string[];
  type?: string;
  weekNumber?: number;
  search?: string;
  dueDateRange?: {
    start: string;
    end: string;
  };
}

export interface AssignmentSortState {
  field: 'dueDate' | 'createdAt' | 'title' | 'maxScore' | 'status' | 'type';
  order: 'asc' | 'desc';
}

export const AssignmentList: React.FC<AssignmentListProps> = ({
  courseId,
  initialFilters = {},
  showFilters = true,
  showSort = true,
  showPagination = true,
  maxItems = 50,
}) => {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AssignmentFiltersState>(initialFilters);
  const [sort, setSort] = useState<AssignmentSortState>({
    field: 'dueDate',
    order: 'asc',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 12,
    totalItems: 0,
  });

  // Fetch assignments from API
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      if (courseId) {
        params.append('courseId', courseId);
      }
      
      // Add filters
      if (filters.status && filters.status.length > 0) {
        params.append('statuses', filters.status.join(','));
      }
      if (filters.type) {
        params.append('type', filters.type);
      }
      if (filters.weekNumber) {
        params.append('weekNumber', filters.weekNumber.toString());
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.dueDateRange?.start) {
        params.append('dueDateFrom', filters.dueDateRange.start);
      }
      if (filters.dueDateRange?.end) {
        params.append('dueDateRange.end', filters.dueDateRange.end);
      }

      // Add sorting
      params.append('sortBy', sort.field);
      params.append('sortOrder', sort.order);

      // Add pagination
      params.append('page', pagination.currentPage.toString());
      params.append('limit', pagination.itemsPerPage.toString());

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/assignments?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assignments: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setAssignments(data.data.assignments || []);
        setPagination(prev => ({
          ...prev,
          totalItems: data.data.totalCount || 0,
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch assignments');
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  }, [courseId, filters, sort, pagination.currentPage, pagination.itemsPerPage]);

  // Apply filters and sorting to assignments
  useEffect(() => {
    let filtered = [...assignments];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(assignment =>
        assignment.title.toLowerCase().includes(searchLower) ||
        assignment.description.toLowerCase().includes(searchLower) ||
        assignment.requirements.some(req => req.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(assignment =>
        filters.status!.includes(assignment.status)
      );
    }

    // Apply type filter
    if (filters.type) {
      filtered = filtered.filter(assignment =>
        assignment.assignmentType === filters.type
      );
    }

    // Apply week number filter
    if (filters.weekNumber) {
      filtered = filtered.filter(assignment => {
        const dueDate = new Date(assignment.dueDate);
        const weekNumber = getWeekNumber(dueDate);
        return weekNumber === filters.weekNumber;
      });
    }

    // Apply due date range filter
    if (filters.dueDateRange?.start || filters.dueDateRange?.end) {
      filtered = filtered.filter(assignment => {
        const dueDate = new Date(assignment.dueDate);
        const start = filters.dueDateRange?.start ? new Date(filters.dueDateRange.start) : null;
        const end = filters.dueDateRange?.end ? new Date(filters.dueDateRange.end) : null;
        
        if (start && dueDate < start) return false;
        if (end && dueDate > end) return false;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      // First, sort by pinned status (pinned assignments go to top)
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Then, sort by highlighted status (highlighted assignments go next)
      if (a.isHighlighted && !b.isHighlighted) return -1;
      if (!a.isHighlighted && b.isHighlighted) return 1;
      
      // Finally, apply the regular sorting
      let aValue: any;
      let bValue: any;

      switch (sort.field) {
        case 'dueDate':
          aValue = new Date(a.dueDate).getTime();
          bValue = new Date(b.dueDate).getTime();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'maxScore':
          aValue = a.maxScore;
          bValue = b.maxScore;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (sort.order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredAssignments(filtered);
  }, [assignments, filters, sort]);

  // Fetch assignments when dependencies change
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<AssignmentFiltersState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  }, []);

  // Handle sort changes
  const handleSortChange = useCallback((newSort: Partial<AssignmentSortState>) => {
    setSort(prev => ({ ...prev, ...newSort }));
  }, []);

  // Handle pagination changes
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  // Get week number for a date
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Calculate pagination
  const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage);
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const endIndex = startIndex + pagination.itemsPerPage;
  const currentAssignments = filteredAssignments.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Assignments</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchAssignments}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <EmptyState
        title="No Assignments Found"
        description="There are no assignments available at the moment."
        icon="assignment"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Sort Controls */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        {showFilters && (
          <AssignmentFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            courseId={courseId}
          />
        )}
        
        {showSort && (
          <AssignmentSort
            sort={sort}
            onSortChange={handleSortChange}
          />
        )}
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {startIndex + 1}-{Math.min(endIndex, pagination.totalItems)} of {pagination.totalItems} assignments
      </div>

      {/* Assignment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentAssignments.map((assignment) => (
          <AssignmentCard
            key={assignment.assignmentId}
            assignment={assignment}
            onViewDetails={() => {
              router.push(`/student/assignments/${assignment.assignmentId}`);
            }}
          />
        ))}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          showPageNumbers={true}
          showFirstLast={true}
        />
      )}

      {/* No Results Message */}
      {filteredAssignments.length === 0 && assignments.length > 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments Match Your Filters</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or filters to find more assignments.
          </p>
          <button
            onClick={() => setFilters(initialFilters)}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

