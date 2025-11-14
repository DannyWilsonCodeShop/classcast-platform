'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

interface Assignment {
  assignmentId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  status: 'draft' | 'published' | 'grading' | 'completed';
  submissionType: 'text' | 'file' | 'video';
  submissionsCount: number;
  gradedCount: number;
  averageGrade?: number;
  createdAt: string;
}

interface SectionDashboardProps {
  courseId: string;
  courseName: string;
  courseCode: string;
  onSectionSelect?: (sectionId: string) => void;
}

const SectionDashboard: React.FC<SectionDashboardProps> = ({
  courseId,
  courseName,
  courseCode,
  onSectionSelect
}) => {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  useEffect(() => {
    fetchSections();
    fetchAssignments();
  }, [courseId]);

  const fetchSections = async () => {
    try {
      const response = await fetch(`/api/sections?courseId=${courseId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sections');
      }

      const data = await response.json();
      if (data.success) {
        setSections(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch sections');
      }
    } catch (err) {
      console.error('Error fetching sections:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sections');
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/assignments?courseId=${courseId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }

      const data = await response.json();
      if (data.success) {
        setAssignments(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch assignments');
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
      // Don't set error for assignments as it's not critical for section display
    }
  };

  const handleSectionClick = (sectionId: string) => {
    setSelectedSection(sectionId);
    if (onSectionSelect) {
      onSectionSelect(sectionId);
    } else {
      // Navigate to section assignments page
      router.push(`/instructor/courses/${courseId}/sections/${sectionId}`);
    }
  };

  const getSectionAssignments = (sectionId: string) => {
    // For now, return all assignments. In the future, this could be filtered by section
    return assignments;
  };

  const getEnrollmentPercentage = (current: number, max: number) => {
    if (max === 0) return 0;
    return Math.round((current / max) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading sections...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 mb-2">⚠️ Error loading sections</div>
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchSections();
          }}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏫</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sections Found</h3>
        <p className="text-gray-600 mb-6">
          This course doesn't have any sections yet. Create sections to organize your students.
        </p>
        <button
          onClick={() => router.push(`/instructor/courses/${courseId}/settings`)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Manage Sections
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{courseName}</h1>
            <p className="text-gray-600 mt-1">Course Code: {courseCode}</p>
            <p className="text-sm text-gray-500 mt-2">
              {sections.length} section{sections.length !== 1 ? 's' : ''} • Click on a section to view assignments
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">
              {sections.reduce((sum, section) => sum + section.currentEnrollment, 0)}
            </div>
            <div className="text-sm text-gray-500">Total Students</div>
          </div>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => {
          const sectionAssignments = getSectionAssignments(section.sectionId);
          const enrollmentPercentage = getEnrollmentPercentage(section.currentEnrollment, section.maxEnrollment);
          const isSelected = selectedSection === section.sectionId;

          return (
            <div
              key={section.sectionId}
              onClick={() => handleSectionClick(section.sectionId)}
              className={`bg-white rounded-lg shadow-sm border-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
                isSelected 
                  ? 'border-indigo-500 ring-2 ring-indigo-200' 
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <div className="p-6">
                {/* Section Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {section.sectionName}
                    </h3>
                    {section.sectionCode && (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mb-2">
                        {section.sectionCode}
                      </span>
                    )}
                    {section.classCode && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Class Code:</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-mono font-semibold">
                          {section.classCode}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    section.isActive ? 'bg-green-400' : 'bg-gray-400'
                  }`} title={section.isActive ? 'Active' : 'Inactive'} />
                </div>

                {/* Enrollment Stats */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Enrollment</span>
                    <span>{section.currentEnrollment} / {section.maxEnrollment}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        enrollmentPercentage >= 90 ? 'bg-red-500' :
                        enrollmentPercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(enrollmentPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {enrollmentPercentage}% full
                  </div>
                </div>

                {/* Assignments Count */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Assignments</span>
                    <span className="text-sm font-medium text-gray-900">
                      {sectionAssignments.length}
                    </span>
                  </div>
                  {sectionAssignments.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {sectionAssignments.filter(a => a.status === 'published').length} published
                    </div>
                  )}
                </div>

                {/* Schedule Info */}
                {section.schedule && (
                  <div className="text-xs text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <span>📅</span>
                      <span>{section.schedule.days?.join(', ')}</span>
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <span>🕐</span>
                      <span>{section.schedule.time}</span>
                    </div>
                    {section.schedule.location && (
                      <div className="flex items-center space-x-1 mt-1">
                        <span>📍</span>
                        <span>{section.schedule.location}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-indigo-600 font-medium">
                      View Assignments
                    </span>
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push(`/instructor/courses/${courseId}/assignments/create`)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            Create Assignment
          </button>
          <button
            onClick={() => router.push(`/instructor/courses/${courseId}/students`)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            View Students
          </button>
          <button
            onClick={() => router.push(`/instructor/courses/${courseId}/settings`)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            Course Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionDashboard;
