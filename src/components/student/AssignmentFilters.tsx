'use client';

import React, { useState, useCallback } from 'react';
import { AssignmentType, AssignmentStatus } from '@/types/dynamodb';
import { AssignmentFiltersState } from './AssignmentList';

export interface AssignmentFiltersProps {
  filters: AssignmentFiltersState;
  onFilterChange: (filters: Partial<AssignmentFiltersState>) => void;
  courseId?: string;
  showAdvancedFilters?: boolean;
}

export const AssignmentFilters: React.FC<AssignmentFiltersProps> = ({
  filters,
  onFilterChange,
  courseId,
  showAdvancedFilters = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(showAdvancedFilters);
  const [localFilters, setLocalFilters] = useState<AssignmentFiltersState>(filters);

  // Handle individual filter changes
  const handleFilterChange = useCallback((key: keyof AssignmentFiltersState, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  }, [localFilters, onFilterChange]);

  // Handle search input with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setLocalFilters(prev => ({ ...prev, search: value }));
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      onFilterChange({ search: value });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [onFilterChange]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const clearedFilters: AssignmentFiltersState = {};
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  }, [onFilterChange]);

  // Get current week number
  const getCurrentWeek = (): number => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil(days / 7);
  };

  // Generate week options for the current academic year
  const generateWeekOptions = () => {
    const weeks = [];
    const currentWeek = getCurrentWeek();
    
    // Show current week and next 8 weeks
    for (let i = Math.max(1, currentWeek - 2); i <= currentWeek + 8; i++) {
      weeks.push(i);
    }
    
    return weeks;
  };

  const weekOptions = generateWeekOptions();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <label htmlFor="search" className="sr-only">
            Search assignments
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              id="search"
              type="text"
              placeholder="Search assignments..."
              value={localFilters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Basic Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <div className="relative">
            <label htmlFor="status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="status-filter"
              value={localFilters.status?.[0] || ''}
              onChange={(e) => handleFilterChange('status', e.target.value ? [e.target.value] : undefined)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Statuses</option>
              <option value={AssignmentStatus.PUBLISHED}>Published</option>
              <option value={AssignmentStatus.ACTIVE}>Active</option>
              <option value={AssignmentStatus.CLOSED}>Closed</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <label htmlFor="type-filter" className="sr-only">
              Filter by type
            </label>
            <select
              id="type-filter"
              value={localFilters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value={AssignmentType.VIDEO_ASSIGNMENT}>Video Assignment</option>
              <option value={AssignmentType.VIDEO_DISCUSSION}>Video Discussion</option>
              <option value={AssignmentType.VIDEO_ASSESSMENT}>Video Assessment</option>
            </select>
          </div>

          {/* Week Filter */}
          <div className="relative">
            <label htmlFor="week-filter" className="sr-only">
              Filter by week
            </label>
            <select
              id="week-filter"
              value={localFilters.weekNumber || ''}
              onChange={(e) => handleFilterChange('weekNumber', e.target.value ? parseInt(e.target.value) : undefined)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Weeks</option>
              {weekOptions.map((week) => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>
          </div>

          {/* Expand/Collapse Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isExpanded ? 'Hide' : 'Show'} Advanced
            <svg
              className={`ml-2 h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Clear Filters Button */}
          {(localFilters.status || localFilters.type || localFilters.weekNumber || localFilters.search || localFilters.dueDateRange) && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Due Date Range */}
            <div>
              <label htmlFor="due-date-start" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date From
              </label>
              <input
                type="date"
                id="due-date-start"
                value={localFilters.dueDateRange?.start || ''}
                onChange={(e) => handleFilterChange('dueDateRange', {
                  ...localFilters.dueDateRange,
                  start: e.target.value || undefined,
                })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="due-date-end" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date To
              </label>
              <input
                type="date"
                id="due-date-end"
                value={localFilters.dueDateRange?.end || ''}
                onChange={(e) => handleFilterChange('dueDateRange', {
                  ...localFilters.dueDateRange,
                  end: e.target.value || undefined,
                })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Quick Week Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quick Week Presets
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleFilterChange('weekNumber', getCurrentWeek())}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('weekNumber', getCurrentWeek() + 1)}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Next Week
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('weekNumber', getCurrentWeek() + 2)}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Week +2
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {Object.keys(localFilters).some(key => localFilters[key as keyof AssignmentFiltersState]) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">Active Filters:</span>
            
            {localFilters.status && localFilters.status.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Status: {localFilters.status.join(', ')}
                <button
                  type="button"
                  onClick={() => handleFilterChange('status', undefined)}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
                >
                  <span className="sr-only">Remove status filter</span>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}

            {localFilters.type && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Type: {localFilters.type}
                <button
                  type="button"
                  onClick={() => handleFilterChange('type', undefined)}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-500 focus:outline-none focus:bg-green-500 focus:text-white"
                >
                  <span className="sr-only">Remove type filter</span>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}

            {localFilters.weekNumber && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Week: {localFilters.weekNumber}
                <button
                  type="button"
                  onClick={() => handleFilterChange('weekNumber', undefined)}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-500 focus:outline-none focus:bg-purple-500 focus:text-white"
                >
                  <span className="sr-only">Remove week filter</span>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}

            {localFilters.search && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Search: "{localFilters.search}"
                <button
                  type="button"
                  onClick={() => handleFilterChange('search', undefined)}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-yellow-400 hover:bg-yellow-200 hover:text-yellow-500 focus:outline-none focus:bg-yellow-500 focus:text-white"
                >
                  <span className="sr-only">Remove search filter</span>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}

            {localFilters.dueDateRange && (localFilters.dueDateRange.start || localFilters.dueDateRange.end) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Date Range: {localFilters.dueDateRange.start || 'Any'} - {localFilters.dueDateRange.end || 'Any'}
                <button
                  type="button"
                  onClick={() => handleFilterChange('dueDateRange', undefined)}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-red-400 hover:bg-red-200 hover:text-red-500 focus:outline-none focus:bg-red-500 focus:text-white"
                >
                  <span className="sr-only">Remove date range filter</span>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};






