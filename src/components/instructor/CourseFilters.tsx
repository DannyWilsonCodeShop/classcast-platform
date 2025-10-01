'use client';

import React from 'react';
import { SEMESTER_OPTIONS } from '@/constants/semesters';

interface CourseFiltersProps {
  filters: {
    department: string;
    semester: string;
    year: string;
    status: string;
    search: string;
  };
  onFilterChange: (filters: Partial<typeof filters>) => void;
}

export const CourseFilters: React.FC<CourseFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const departments = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'History',
    'Psychology',
    'Business',
    'Engineering',
  ];

  const semesters = SEMESTER_OPTIONS.map(option => option.value);
  const statuses = ['draft', 'published', 'archived'];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2);

  return (
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200/30">
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Search courses..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {(filters.search || filters.status) && (
          <button
            onClick={() => onFilterChange({
              department: '',
              semester: '',
              year: '',
              status: '',
              search: '',
            })}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
