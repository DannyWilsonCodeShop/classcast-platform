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
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-2">Sections</h3>
      
      <div className="space-y-2">
        {sections.map((section) => (
          <Link 
            key={section.sectionId} 
            href={`/instructor/courses/${courseId}/sections/${section.sectionId}`}
            className="block"
          >
            <div className="bg-gray-50 rounded-2xl p-3 active:scale-[0.98] transition-transform">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-[#005587]">{section.sectionName}</h3>
                    {section.classCode && (
                      <span className="px-2 py-0.5 bg-[#005587]/10 text-[#005587] text-[10px] font-mono font-bold rounded-full">
                        {section.classCode}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{section.currentEnrollment}/{section.maxEnrollment} students</span>
                    {section.sectionCode && (
                      <span>Code: {section.sectionCode}</span>
                    )}
                    {section.schedule && (
                      <span>{section.schedule.days.join(', ')} {section.schedule.time}</span>
                    )}
                  </div>
                </div>
                
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SectionList;
