import React from 'react';
import Link from 'next/link';

interface Section {
  sectionId: string;
  sectionName: string;
  sectionCode?: string;
  classCode?: string;
  description?: string;
  maxEnrollment: number;
  currentEnrollment: number;
  schedule?: {
    days: string[];
    time: string;
    location: string;
  };
  location?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SectionListProps {
  courseId: string;
  sections: Section[];
}

const SectionList: React.FC<SectionListProps> = ({ courseId, sections }) => {
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Course Sections</h2>
        <span className="text-gray-600">{sections.length} section{sections.length !== 1 ? 's' : ''}</span>
      </div>
      
      <div className="space-y-4">
        {sections.map((section) => (
          <Link 
            key={section.sectionId} 
            href={`/instructor/courses/${courseId}/sections/${section.sectionId}`}
            className="block"
          >
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-indigo-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{section.sectionName}</h3>
                    {section.classCode && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-mono rounded">
                        {section.classCode}
                      </span>
                    )}
                    {section.sectionCode && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded">
                        {section.sectionCode}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <span>Enrollment: {section.currentEnrollment} / {section.maxEnrollment}</span>
                    {section.schedule && (
                      <span>{section.schedule.days.join(', ')} at {section.schedule.time}</span>
                    )}
                    {section.location && (
                      <span>Location: {section.location}</span>
                    )}
                  </div>
                  
                  {section.description && (
                    <p className="text-gray-600 text-sm mt-2">{section.description}</p>
                  )}
                </div>
                
                <div className="flex items-center text-indigo-600">
                  <span className="text-sm font-medium">View Section</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SectionList;
