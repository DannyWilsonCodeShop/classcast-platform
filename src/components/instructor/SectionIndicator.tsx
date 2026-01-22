'use client';

import React from 'react';

interface SectionIndicatorProps {
  sectionName?: string | null;
  sectionId?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const SectionIndicator: React.FC<SectionIndicatorProps> = ({
  sectionName,
  sectionId,
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'text-xs',
    md: 'text-sm', 
    lg: 'text-base'
  };

  if (!sectionName && !sectionId) {
    return (
      <span className={`inline-flex items-center ${sizeClasses[size]} bg-gray-400 text-white rounded-full font-medium ${className}`}>
        {showIcon && <span className={`mr-1 ${iconSizes[size]}`}>📚</span>}
        No Section
      </span>
    );
  }

  // Generate a consistent color based on section name/id
  const getColorFromSection = (section: string) => {
    const colors = [
      'bg-blue-600 text-white',
      'bg-green-600 text-white', 
      'bg-purple-600 text-white',
      'bg-indigo-600 text-white',
      'bg-pink-600 text-white',
      'bg-teal-600 text-white',
      'bg-orange-600 text-white',
      'bg-red-600 text-white'
    ];
    
    let hash = 0;
    for (let i = 0; i < section.length; i++) {
      hash = section.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const colorClass = getColorFromSection(sectionName || sectionId || '');

  return (
    <span className={`inline-flex items-center ${sizeClasses[size]} ${colorClass} rounded-full font-medium ${className}`}>
      {showIcon && <span className={`mr-1 ${iconSizes[size]}`}>📚</span>}
      {sectionName || `Section ${sectionId}`}
    </span>
  );
};

// Compact version for lists
export const CompactSectionIndicator: React.FC<SectionIndicatorProps> = (props) => {
  return <SectionIndicator {...props} size="sm" showIcon={false} />;
};

// Large version for headers
export const LargeSectionIndicator: React.FC<SectionIndicatorProps> = (props) => {
  return <SectionIndicator {...props} size="lg" />;
};