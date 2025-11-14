'use client';
import React, { useState, useCallback } from 'react';
import { SubmissionFiltersState } from './SubmissionHistory';

export interface SubmissionFiltersProps {
  filters: SubmissionFiltersState;
  onFilterChange: (filters: Partial<SubmissionFiltersState>) => void;
  className?: string;
}

export const SubmissionFilters: React.FC<SubmissionFiltersProps> = ({
  filters,
  onFilterChange,
  className = '',
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = useCallback((key: keyof SubmissionFiltersState, value: any) => {
    onFilterChange({ [key]: value });
  }, [onFilterChange]);

  const clearFilters = useCallback(() => {
    onFilterChange({
      status: '',
      hasGrade: null,
      courseId: '',
      assignmentId: '',
      submittedAfter: '',
      submittedBefore: '',
      search: '',
    });
  }, [onFilterChange]);

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== null && value !== undefined
  );

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filter Submissions</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </button>
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
            <option value="late">Late</option>
            <option value="returned">Returned</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Grade Filter */}
        <div>
          <label htmlFor="hasGrade" className="block text-sm font-medium text-gray-700 mb-2">
            Grade Status
          </label>
          <select
            id="hasGrade"
            value={filters.hasGrade === null || filters.hasGrade === undefined ? '' : filters.hasGrade.toString()}
            onChange={(e) => handleFilterChange('hasGrade', e.target.value === '' ? null : e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Submissions</option>
            <option value="true">Graded</option>
            <option value="false">Not Graded</option>
          </select>
        </div>

        {/* Search Filter */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            id="search"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search assignments, courses..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Advanced Filters</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Course Filter */}
            <div>
              <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-2">
                Course ID
              </label>
              <input
                type="text"
                id="courseId"
                value={filters.courseId}
                onChange={(e) => handleFilterChange('courseId', e.target.value)}
                placeholder="e.g., CS101"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Assignment Filter */}
            <div>
              <label htmlFor="assignmentId" className="block text-sm font-medium text-gray-700 mb-2">
                Assignment ID
              </label>
              <input
                type="text"
                id="assignmentId"
                value={filters.assignmentId}
                onChange={(e) => handleFilterChange('assignmentId', e.target.value)}
                placeholder="e.g., HW1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Date Range Filters */}
            <div>
              <label htmlFor="submittedAfter" className="block text-sm font-medium text-gray-700 mb-2">
                Submitted After
              </label>
              <input
                type="date"
                id="submittedAfter"
                value={filters.submittedAfter}
                onChange={(e) => handleFilterChange('submittedAfter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="submittedBefore" className="block text-sm font-medium text-gray-700 mb-2">
                Submitted Before
              </label>
              <input
                type="date"
                id="submittedBefore"
                value={filters.submittedBefore}
                onChange={(e) => handleFilterChange('submittedBefore', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Date Presets
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const today = new Date();
                  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  handleFilterChange('submittedAfter', lastWeek.toISOString().split('T')[0]);
                  handleFilterChange('submittedBefore', today.toISOString().split('T')[0]);
                }}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Last Week
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                  handleFilterChange('submittedAfter', lastMonth.toISOString().split('T')[0]);
                  handleFilterChange('submittedBefore', today.toISOString().split('T')[0]);
                }}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Last Month
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const lastSemester = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
                  handleFilterChange('submittedAfter', lastSemester.toISOString().split('T')[0]);
                  handleFilterChange('submittedBefore', today.toISOString().split('T')[0]);
                }}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Last Semester
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Active Filters</h4>
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Clear All
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filters.status && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Status: {filters.status}
                <button
                  onClick={() => handleFilterChange('status', '')}
                  className="ml-1.5 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.hasGrade !== null && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Grade: {filters.hasGrade ? 'Graded' : 'Not Graded'}
                <button
                  onClick={() => handleFilterChange('hasGrade', null)}
                  className="ml-1.5 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.courseId && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Course: {filters.courseId}
                <button
                  onClick={() => handleFilterChange('courseId', '')}
                  className="ml-1.5 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.assignmentId && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Assignment: {filters.assignmentId}
                <button
                  onClick={() => handleFilterChange('assignmentId', '')}
                  className="ml-1.5 text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.submittedAfter && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                After: {filters.submittedAfter}
                <button
                  onClick={() => handleFilterChange('submittedAfter', '')}
                  className="ml-1.5 text-indigo-600 hover:text-indigo-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.submittedBefore && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Before: {filters.submittedBefore}
                <button
                  onClick={() => handleFilterChange('submittedBefore', '')}
                  className="ml-1.5 text-indigo-600 hover:text-indigo-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.search && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Search: "{filters.search}"
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-1.5 text-gray-600 hover:text-gray-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

