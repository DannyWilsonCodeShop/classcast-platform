'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Assignment } from '@/types/dynamodb';
import { AssignmentCard } from './AssignmentCard';
import { AssignmentFilters } from './AssignmentFilters';
import { AssignmentSort } from './AssignmentSort';
import LoadingSpinner from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

export interface CompactAssignmentListProps {
  courseId?: string;
  maxItems?: number;
  showFilters?: boolean;
  showSort?: boolean;
  title?: string;
  className?: string;
}

export const CompactAssignmentList: React.FC<CompactAssignmentListProps> = ({
  courseId,
  maxItems = 6,
  showFilters = false,
  showSort = true,
  title = 'Recent Assignments',
  className = '',
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: ['published', 'active'],
    type: undefined,
    weekNumber: undefined,
    search: undefined,
  });
  const [sort, setSort] = useState({
    field: 'dueDate' as const,
    order: 'asc' as const,
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

      // Add sorting
      params.append('sortBy', sort.field);
      params.append('sortOrder', sort.order);

      // Add pagination
      params.append('page', '1');
      params.append('limit', maxItems.toString());

      const response = await fetch(`/api/assignments?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assignments: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setAssignments(data.data.assignments || []);
      } else {
        throw new Error(data.error || 'Failed to fetch assignments');
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  }, [courseId, filters, sort, maxItems]);

  // Fetch assignments when dependencies change
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Handle sort changes
  const handleSortChange = useCallback((newSort: Partial<typeof sort>) => {
    setSort(prev => ({ ...prev, ...newSort }));
  }, []);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <EmptyState
          title="Error Loading Assignments"
          description={error}
          icon="error"
          action={{
            label: 'Try Again',
            onClick: fetchAssignments,
            variant: 'primary',
          }}
        />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <EmptyState
          title="No Assignments Available"
          description="There are no assignments available at the moment."
          icon="assignment"
        />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          
          {showSort && (
            <AssignmentSort
              sort={sort}
              onSortChange={handleSortChange}
              showLabel={false}
              compact={true}
            />
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-6 py-4 border-b border-gray-200">
          <AssignmentFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            courseId={courseId}
            showAdvancedFilters={false}
          />
        </div>
      )}

      {/* Assignment Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.slice(0, maxItems).map((assignment) => (
            <AssignmentCard
              key={assignment.assignmentId}
              assignment={assignment}
              onViewDetails={() => {
                // Handle view details - could navigate to assignment detail page
                console.log('View assignment:', assignment.assignmentId);
              }}
              compact={true}
              showCourseInfo={!courseId}
            />
          ))}
        </div>

        {/* View All Link */}
        {assignments.length > maxItems && (
          <div className="mt-6 text-center">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All {assignments.length} Assignments →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

