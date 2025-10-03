'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Users, Clock, CheckCircle } from 'lucide-react';

interface Section {
  sectionId: string;
  sectionName: string;
  sectionCode?: string;
  description?: string;
  maxEnrollment: number;
  currentEnrollment: number;
  schedule?: {
    days: string[];
    time: string;
    location: string;
  };
  location?: string;
  instructorId: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface Course {
  courseId: string;
  title: string;
  description: string;
  code: string;
  instructorId: string;
}

interface SectionSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSection: (sectionId: string) => Promise<void>;
  course: Course;
  sections: Section[];
}

const SectionSelectionModal: React.FC<SectionSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectSection,
  course,
  sections
}) => {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter active sections with available spots
  const availableSections = sections.filter(section => 
    section.isActive && section.currentEnrollment < section.maxEnrollment
  );

  const handleSelectSection = async () => {
    if (!selectedSection) {
      setError('Please select a section');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSelectSection(selectedSection);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll in section');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedSection(null);
    setError('');
    onClose();
  };

  const formatSchedule = (schedule: Section['schedule']) => {
    if (!schedule) return 'Schedule TBD';
    return `${schedule.days.join(', ')} • ${schedule.time}`;
  };

  const getAvailabilityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getAvailabilityText = (current: number, max: number) => {
    const remaining = max - current;
    if (remaining <= 0) return 'Full';
    if (remaining === 1) return '1 spot left';
    return `${remaining} spots left`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Choose Your Section</h2>
              <p className="text-blue-100">{course.title} ({course.code})</p>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
              disabled={isLoading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {availableSections.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😔</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Available Sections</h3>
              <p className="text-gray-600">
                All sections for this course are currently full. Please contact your instructor.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Available Sections</h3>
                <p className="text-blue-800 text-sm">
                  Select the section that fits your schedule. You can only enroll in one section per course.
                </p>
              </div>

              {availableSections.map((section) => (
                <div
                  key={section.sectionId}
                  onClick={() => setSelectedSection(section.sectionId)}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedSection === section.sectionId
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {section.sectionName}
                        </h4>
                        {section.sectionCode && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-md">
                            {section.sectionCode}
                          </span>
                        )}
                        {selectedSection === section.sectionId && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>

                      {section.description && (
                        <p className="text-gray-600 text-sm mb-3">{section.description}</p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {formatSchedule(section.schedule)}
                          </span>
                        </div>

                        {section.schedule?.location && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{section.schedule.location}</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className={`font-medium ${getAvailabilityColor(section.currentEnrollment, section.maxEnrollment)}`}>
                            {section.currentEnrollment}/{section.maxEnrollment} students
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className={`text-sm font-medium ${getAvailabilityColor(section.currentEnrollment, section.maxEnrollment)}`}>
                          {getAvailabilityText(section.currentEnrollment, section.maxEnrollment)}
                        </span>
                        
                        {section.currentEnrollment / section.maxEnrollment >= 0.9 && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                            Almost Full
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {availableSections.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedSection ? 'Ready to enroll' : 'Please select a section'}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSelectSection}
                disabled={!selectedSection || isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Enrolling...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Enroll in Section</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionSelectionModal;
