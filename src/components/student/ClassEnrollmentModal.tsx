'use client';

import React, { useState } from 'react';
import { X, Plus, BookOpen, Users, Calendar } from 'lucide-react';
import SectionSelectionModal from './SectionSelectionModal';

interface Course {
  courseId: string;
  title: string;
  description: string;
  code: string;
  instructorId: string;
}

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

interface ClassEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnroll: (classCode: string, sectionId?: string) => Promise<void>;
}

const ClassEnrollmentModal: React.FC<ClassEnrollmentModalProps> = ({
  isOpen,
  onClose,
  onEnroll,
}) => {
  const [classCode, setClassCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSectionSelection, setShowSectionSelection] = useState(false);
  const [foundCourse, setFoundCourse] = useState<Course | null>(null);
  const [foundSections, setFoundSections] = useState<Section[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!classCode.trim()) {
      setError('Please enter a class code');
      return;
    }

    if (classCode.trim().length < 5) {
      setError('Class code must be at least 5 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First, find the course and its sections
      const response = await fetch('/api/courses/find-by-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classCode: classCode.trim().toUpperCase() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Course not found');
      }

      const data = await response.json();
      setFoundCourse(data.course);
      setFoundSections(data.sections || []);
      setShowSectionSelection(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find course');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectionSelection = async (sectionId: string) => {
    if (!foundCourse) return;

    setIsLoading(true);
    setError('');

    try {
      console.log('Starting enrollment for section:', sectionId);
      // Enroll in the specific section
      await onEnroll(classCode.trim().toUpperCase(), sectionId);
      console.log('Enrollment successful, closing modal');
      
      // Reset all state
      setClassCode('');
      setShowSectionSelection(false);
      setFoundCourse(null);
      setFoundSections([]);
      
      // Close the modal
      onClose();
    } catch (err) {
      console.error('Enrollment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to enroll in class');
      setShowSectionSelection(false); // Close section selection modal to show error
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setClassCode('');
    setError('');
    setShowSectionSelection(false);
    setFoundCourse(null);
    setFoundSections([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Section Selection Modal */}
      {showSectionSelection && foundCourse && (
        <SectionSelectionModal
          isOpen={showSectionSelection}
          onClose={() => setShowSectionSelection(false)}
          onSelectSection={handleSectionSelection}
          course={foundCourse}
          sections={foundSections}
        />
      )}

      {/* Main Enrollment Modal */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#4A90E2] rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Join a Class</h2>
                <p className="text-sm text-gray-600">Enter your class code to enroll</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Class Code Input */}
            <div>
              <label htmlFor="classCode" className="block text-sm font-medium text-gray-700 mb-2">
                Class Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="classCode"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  placeholder="Enter class code (e.g., MATH101)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent text-center text-lg font-mono tracking-wider"
                  maxLength={20}
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">How to get a class code:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ask your instructor for the class code</li>
                <li>• Check your course syllabus or announcement</li>
                <li>• Look for the code in your email invitation</li>
              </ul>
            </div>

            {/* Class Preview (if code is entered) */}
            {classCode.length >= 5 && !error && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Class Preview</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span>Class Code: <span className="font-mono font-semibold">{classCode}</span></span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Class details will be shown after enrollment</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !classCode.trim()}
                className="flex-1 px-4 py-3 bg-[#4A90E2] text-white rounded-lg hover:bg-[#9B5DE5] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Enrolling...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Join Class</span>
                  </>
                )}
              </button>
            </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClassEnrollmentModal;
