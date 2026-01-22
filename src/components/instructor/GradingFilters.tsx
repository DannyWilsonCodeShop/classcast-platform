'use client';

import React from 'react';
import { SectionFilter, QuickSectionFilter } from './SectionFilter';

interface Section {
  id: string;
  name: string;
  count: number;
}

interface GradingFiltersProps {
  // Filter states
  filter: 'all' | 'graded' | 'ungraded';
  onFilterChange: (filter: 'all' | 'graded' | 'ungraded') => void;
  
  selectedSection: string;
  onSectionChange: (sectionId: string) => void;
  
  searchTerm: string;
  onSearchChange: (term: string) => void;
  
  sortBy: 'name' | 'date' | 'grade' | 'section';
  onSortChange: (sort: 'name' | 'date' | 'grade' | 'section') => void;
  
  // Data
  sections: Section[];
  totalSubmissions: number;
  gradedCount: number;
  ungradedCount: number;
  
  // Options
  showQuickSectionFilter?: boolean;
  className?: string;
}

export const GradingFilters: React.FC<GradingFiltersProps> = ({
  filter,
  onFilterChange,
  selectedSection,
  onSectionChange,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  sections,
  totalSubmissions,
  gradedCount,
  ungradedCount,
  showQuickSectionFilter = false,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      {/* Quick section filter (if enabled) */}
      {showQuickSectionFilter && sections.length > 1 && (
        <div className="mb-6">
          <QuickSectionFilter
            sections={sections}
            selectedSection={selectedSection}
            onSectionChange={onSectionChange}
            totalCount={totalSubmissions}
          />
        </div>
      )}
      
      {/* Main filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Status:
          </label>
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as 'all' | 'graded' | 'ungraded')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All ({totalSubmissions})</option>
            <option value="ungraded">Ungraded ({ungradedCount})</option>
            <option value="graded">Graded ({gradedCount})</option>
          </select>
        </div>

        {/* Section Filter (if not using quick filter) */}
        {!showQuickSectionFilter && (
          <SectionFilter
            sections={sections}
            selectedSection={selectedSection}
            onSectionChange={onSectionChange}
            totalCount={totalSubmissions}
          />
        )}
        
        {/* Search */}
        <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Search:
          </label>
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Student name, email, or section..."
              className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {/* Sort */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Sort by:
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as 'name' | 'date' | 'grade' | 'section')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="section">Section + Name</option>
            <option value="name">Name (A-Z)</option>
            <option value="date">Submission Date</option>
            <option value="grade">Grade</option>
          </select>
        </div>
      </div>
      
      {/* Filter summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>
              Showing {totalSubmissions} submission{totalSubmissions !== 1 ? 's' : ''}
            </span>
            {selectedSection !== 'all' && (
              <span className="text-blue-600 font-medium">
                • Filtered by section: {sections.find(s => s.id === selectedSection)?.name}
              </span>
            )}
            {searchTerm && (
              <span className="text-blue-600 font-medium">
                • Search: "{searchTerm}"
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-green-600">
              ✓ {gradedCount} graded
            </span>
            <span className="text-orange-600">
              ⏳ {ungradedCount} pending
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};