'use client';

import React from 'react';

interface Section {
  id: string;
  name: string;
  count: number;
}

interface SectionFilterProps {
  sections: Section[];
  selectedSection: string;
  onSectionChange: (sectionId: string) => void;
  totalCount: number;
  className?: string;
}

export const SectionFilter: React.FC<SectionFilterProps> = ({
  sections,
  selectedSection,
  onSectionChange,
  totalCount,
  className = ''
}) => {
  // Sort sections by name for consistent display
  const sortedSections = [...sections].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
        Section:
      </label>
      <select
        value={selectedSection}
        onChange={(e) => onSectionChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[200px]"
      >
        <option value="all">
          All Sections ({totalCount})
        </option>
        {sortedSections.length > 0 ? (
          sortedSections.map(section => (
            <option key={section.id} value={section.id}>
              {section.name} ({section.count})
            </option>
          ))
        ) : (
          <option disabled>No sections available</option>
        )}
      </select>
      
      {/* Section summary */}
      {sections.length > 1 && (
        <div className="text-xs text-gray-500 ml-2">
          {sections.length} sections
        </div>
      )}
    </div>
  );
};

// Enhanced section filter with quick buttons
export const QuickSectionFilter: React.FC<SectionFilterProps> = ({
  sections,
  selectedSection,
  onSectionChange,
  totalCount,
  className = ''
}) => {
  const sortedSections = [...sections].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={`${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <label className="text-sm font-medium text-gray-700">
          Filter by Section:
        </label>
        <span className="text-xs text-gray-500">
          ({sections.length} sections, {totalCount} total submissions)
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {/* All sections button */}
        <button
          onClick={() => onSectionChange('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selectedSection === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({totalCount})
        </button>
        
        {/* Individual section buttons */}
        {sortedSections.map(section => (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedSection === section.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {section.name} ({section.count})
          </button>
        ))}
      </div>
    </div>
  );
};