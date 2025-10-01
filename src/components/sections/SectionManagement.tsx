'use client';

import React, { useState, useEffect } from 'react';
import { Section, CreateSectionRequest } from '@/types/sections';
import { SectionForm } from './SectionForm';

interface SectionManagementProps {
  courseId: string;
  instructorId: string;
  onSectionsChange?: (sections: Section[]) => void;
}

export const SectionManagement: React.FC<SectionManagementProps> = ({
  courseId,
  instructorId,
  onSectionsChange
}) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  useEffect(() => {
    loadSections();
  }, [courseId]);

  const loadSections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sections?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setSections(data.data || []);
        onSectionsChange?.(data.data || []);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async (sectionData: CreateSectionRequest) => {
    try {
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectionData)
      });

      if (response.ok) {
        await loadSections();
        setShowForm(false);
      } else {
        const error = await response.json();
        alert(`Error creating section: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating section:', error);
      alert('Failed to create section');
    }
  };

  const handleEditSection = async (sectionId: string, updates: Partial<Section>) => {
    try {
      const response = await fetch(`/api/sections/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        await loadSections();
        setEditingSection(null);
      } else {
        const error = await response.json();
        alert(`Error updating section: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating section:', error);
      alert('Failed to update section');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      const response = await fetch(`/api/sections/${sectionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadSections();
      } else {
        const error = await response.json();
        alert(`Error deleting section: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Course Sections</h3>
          <p className="text-sm text-gray-600">
            Manage different sections of this course (e.g., Period 1, 2, 3 or Section A, B, C)
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Section
        </button>
      </div>

      {/* Sections List */}
      {sections.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No sections created yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create sections to organize your students into different class periods
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section) => (
            <div key={section.sectionId} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{section.sectionName}</h4>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setEditingSection(section)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.sectionId)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {section.sectionCode && (
                <p className="text-sm text-gray-600 mb-2">Code: {section.sectionCode}</p>
              )}
              
              <p className="text-sm text-gray-500 mb-2">
                {section.currentEnrollment} / {section.maxEnrollment} students
              </p>
              
              {section.location && (
                <p className="text-sm text-gray-500 mb-2">📍 {section.location}</p>
              )}
              
              {section.schedule && (
                <div className="text-sm text-gray-500">
                  <p>📅 {section.schedule.days.join(', ')}</p>
                  <p>🕐 {section.schedule.startTime} - {section.schedule.endTime}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Section Form Modal */}
      {(showForm || editingSection) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <SectionForm
              courseId={courseId}
              instructorId={instructorId}
              onSave={editingSection ? 
                (data) => handleEditSection(editingSection.sectionId, data) :
                handleCreateSection
              }
              onCancel={() => {
                setShowForm(false);
                setEditingSection(null);
              }}
              initialData={editingSection || undefined}
              isEditing={!!editingSection}
            />
          </div>
        </div>
      )}
    </div>
  );
};
