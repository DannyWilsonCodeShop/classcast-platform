'use client';
import React from 'react';
import { SubmissionSortState } from './SubmissionHistory';

export interface SubmissionSortProps {
  sort: SubmissionSortState;
  onSortChange: (sort: Partial<SubmissionSortState>) => void;
  className?: string;
}

export const SubmissionSort: React.FC<SubmissionSortProps> = ({
  sort,
  onSortChange,
  className = '',
}) => {
  const handleFieldChange = (field: SubmissionSortState['field']) => {
    onSortChange({ field });
  };

  const handleOrderChange = (order: SubmissionSortState['order']) => {
    onSortChange({ order });
  };

  const sortFields = [
    { value: 'submittedAt', label: 'Submission Date' },
    { value: 'grade', label: 'Grade' },
    { value: 'status', label: 'Status' },
    { value: 'assignmentTitle', label: 'Assignment Title' },
  ];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Sort By</h3>
        
        <div className="flex items-center gap-4">
          {/* Sort Field */}
          <div className="flex items-center gap-2">
            <label htmlFor="sortField" className="text-sm text-gray-600">
              Field:
            </label>
            <select
              id="sortField"
              value={sort.field}
              onChange={(e) => handleFieldChange(e.target.value as SubmissionSortState['field'])}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {sortFields.map((field) => (
                <option key={field.value} value={field.value}>
                  {field.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Order:</span>
            <div 
              className="flex border border-gray-300 rounded-md overflow-hidden"
              role="group"
              aria-labelledby="sort-order-label"
            >
              <span id="sort-order-label" className="sr-only">Sort order</span>
              <button
                onClick={() => handleOrderChange('asc')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  sort.order === 'asc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title="Ascending (A to Z, 1 to 9, Oldest to Newest)"
                aria-pressed={sort.order === 'asc'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => handleOrderChange('desc')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  sort.order === 'desc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title="Descending (Z to A, 9 to 1, Newest to Oldest)"
                aria-pressed={sort.order === 'desc'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sort Description */}
      <div className="mt-3 text-xs text-gray-500">
        {sort.field === 'submittedAt' && (
          <span>
            {sort.order === 'asc' ? 'Oldest submissions first' : 'Newest submissions first'}
          </span>
        )}
        {sort.field === 'grade' && (
          <span>
            {sort.order === 'asc' ? 'Lowest grades first' : 'Highest grades first'}
          </span>
        )}
        {sort.field === 'status' && (
          <span>
            {sort.order === 'asc' ? 'Status A to Z' : 'Status Z to A'}
          </span>
        )}
        {sort.field === 'assignmentTitle' && (
          <span>
            {sort.order === 'asc' ? 'Assignment titles A to Z' : 'Assignment titles Z to A'}
          </span>
        )}
      </div>
    </div>
  );
};

