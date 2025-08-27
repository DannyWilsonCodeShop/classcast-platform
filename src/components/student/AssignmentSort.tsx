'use client';

import React from 'react';
import { AssignmentSortState } from './AssignmentList';

export interface AssignmentSortProps {
  sort: AssignmentSortState;
  onSortChange: (sort: Partial<AssignmentSortState>) => void;
  showLabel?: boolean;
  compact?: boolean;
}

export const AssignmentSort: React.FC<AssignmentSortProps> = ({
  sort,
  onSortChange,
  showLabel = true,
  compact = false,
}) => {
  const handleFieldChange = (field: AssignmentSortState['field']) => {
    onSortChange({ field });
  };

  const handleOrderChange = (order: AssignmentSortState['order']) => {
    onSortChange({ order });
  };

  const toggleOrder = () => {
    onSortChange({ order: sort.order === 'asc' ? 'desc' : 'asc' });
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <select
          value={sort.field}
          onChange={(e) => handleFieldChange(e.target.value as AssignmentSortState['field'])}
          className="block px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="dueDate">Due Date</option>
          <option value="createdAt">Created</option>
          <option value="title">Title</option>
          <option value="maxScore">Points</option>
          <option value="status">Status</option>
        </select>
        
        <button
          type="button"
          onClick={toggleOrder}
          className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
          title={`Sort ${sort.order === 'asc' ? 'ascending' : 'descending'}`}
        >
          {sort.order === 'asc' ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {showLabel && (
        <label className="text-sm font-medium text-gray-700">Sort by:</label>
      )}
      
      <div className="flex items-center space-x-2">
        <select
          value={sort.field}
          onChange={(e) => handleFieldChange(e.target.value as AssignmentSortState['field'])}
          className="block px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="dueDate">Due Date</option>
          <option value="createdAt">Created Date</option>
          <option value="title">Title</option>
          <option value="maxScore">Points</option>
          <option value="status">Status</option>
        </select>
        
        <div className="flex border border-gray-300 rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => handleOrderChange('asc')}
            className={`px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              sort.order === 'asc'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title="Sort ascending"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
          
          <button
            type="button"
            onClick={() => handleOrderChange('desc')}
            className={`px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              sort.order === 'desc'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title="Sort descending"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Sort Order Indicator */}
      <div className="text-xs text-gray-500">
        {sort.order === 'asc' ? 'A → Z' : 'Z → A'}
      </div>
    </div>
  );
};





