'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { SEMESTER_OPTIONS } from '@/constants/semesters';

interface Section {
  sectionId: string;
  courseId: string;
  sectionName: string;
  sectionCode?: string;
  description?: string;
  maxEnrollment?: number;
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
  courseName: string;
  courseCode: string;
  description: string;
  semester: string;
  year: number;
  status: 'draft' | 'published' | 'archived';
  enrollmentCount: number;
  maxEnrollment?: number;
  instructorId?: string;
  settings?: {
    privacy?: 'public' | 'private';
    allowLateSubmissions?: boolean;
    latePenalty?: number;
    allowResubmissions?: boolean;
    enableDiscussions?: boolean;
    enableAnnouncements?: boolean;
  };
  sections?: Section[];
  createdAt: string;
  updatedAt: string;
}

interface CourseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onUpdate: (updateData: Partial<Course>) => Promise<{ success: boolean; message: string }>;
  onDelete?: (courseId: string) => Promise<{ success: boolean; message: string }>;
  instructorId?: string; // NEW: Add instructor ID prop
}

const CourseSettingsModal: React.FC<CourseSettingsModalProps> = ({
  isOpen,
  onClose,
  course,
  onUpdate,
  onDelete,
  instructorId
}) => {
  const [formData, setFormData] = useState<Partial<Course>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionForm, setSectionForm] = useState({
    sectionName: '',
    sectionCode: '',
    description: '',
    maxEnrollment: 30,
    location: '',
    schedule: {
      days: [] as string[],
      time: '',
      location: ''
    }
  });

  useEffect(() => {
    if (course && isOpen) {
      setFormData({
        courseName: course.courseName,
        courseCode: course.courseCode,
        description: course.description,
        semester: course.semester,
        year: course.year,
        maxEnrollment: course.maxEnrollment,
      });
      loadSections();
    }
  }, [course, isOpen]);

  const loadSections = async () => {
    if (!course?.courseId) return;
    
    setIsLoadingSections(true);
    try {
      const response = await fetch(`/api/sections?courseId=${course.courseId}`);
      if (response.ok) {
        const data = await response.json();
        setSections(data.data || []);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setIsLoadingSections(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await onUpdate(formData);
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to update course settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: string, value: string) => {
    const items = value.split('\n').filter(item => item.trim());
    setFormData(prev => ({
      ...prev,
      [field]: items
    }));
  };


  // Section management functions
  const handleAddSection = async () => {
    if (!course?.courseId || !sectionForm.sectionName.trim()) return;

    try {
      const finalInstructorId = instructorId || course.instructorId || course.instructor?.id;
      
      if (!finalInstructorId) {
        setError('Instructor ID is missing. Please refresh the page and try again.');
        return;
      }

      console.log('Creating section with data:', {
        courseId: course.courseId,
        sectionName: sectionForm.sectionName,
        instructorId: finalInstructorId
      });

      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.courseId,
          sectionName: sectionForm.sectionName.trim(),
          sectionCode: sectionForm.sectionCode.trim() || undefined,
          description: sectionForm.description.trim() || undefined,
          maxEnrollment: sectionForm.maxEnrollment,
          location: sectionForm.location.trim() || undefined,
          schedule: sectionForm.schedule.days.length > 0 ? sectionForm.schedule : undefined,
          instructorId: finalInstructorId
        })
      });

      if (response.ok) {
        setSuccess('Section added successfully');
        setShowAddSection(false);
        setSectionForm({
          sectionName: '',
          sectionCode: '',
          description: '',
          maxEnrollment: 30,
          location: '',
          schedule: { days: [], time: '', location: '' }
        });
        loadSections();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add section');
      }
    } catch (error) {
      setError('Failed to add section');
    }
  };

  const handleEditSection = async (section: Section) => {
    try {
      const response = await fetch('/api/sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: section.sectionId,
          sectionName: section.sectionName,
          sectionCode: section.sectionCode,
          description: section.description,
          maxEnrollment: section.maxEnrollment,
          location: section.location,
          schedule: section.schedule,
          isActive: section.isActive
        })
      });

      if (response.ok) {
        setSuccess('Section updated successfully');
        setEditingSection(null);
        loadSections();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update section');
      }
    } catch (error) {
      setError('Failed to update section');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      const response = await fetch(`/api/sections?sectionId=${sectionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Section deleted successfully');
        loadSections();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete section');
      }
    } catch (error) {
      setError('Failed to delete section');
    }
  };

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Course Settings</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={formData.courseName || ''}
                    onChange={(e) => handleInputChange('courseName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={formData.courseCode || ''}
                    onChange={(e) => handleInputChange('courseCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester
                  </label>
                  <select
                    value={formData.semester || ''}
                    onChange={(e) => handleInputChange('semester', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {SEMESTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <input
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="2020"
                    max="2030"
                    required
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Enrollment
                  </label>
                  <input
                    type="number"
                    value={formData.maxEnrollment || ''}
                    onChange={(e) => handleInputChange('maxEnrollment', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Privacy Settings
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Course Visibility
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="privacy-public"
                      name="privacy"
                      value="public"
                      checked={formData.settings?.privacy === 'public' || !formData.settings?.privacy}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            privacy: e.target.value as 'public' | 'private'
                          }
                        }));
                      }}
                      className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="privacy-public" className="flex-1">
                      <div className="font-medium text-gray-900">Public Course</div>
                      <div className="text-sm text-gray-500">
                        Students can search and discover this course in the course directory
                      </div>
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="privacy-private"
                      name="privacy"
                      value="private"
                      checked={formData.settings?.privacy === 'private'}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            privacy: e.target.value as 'public' | 'private'
                          }
                        }));
                      }}
                      className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="privacy-private" className="flex-1">
                      <div className="font-medium text-gray-900">Private Course</div>
                      <div className="text-sm text-gray-500">
                        Only students with the class code can join this course
                      </div>
                    </label>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Private courses won't appear in public course searches but can still be joined using the class code.
                </p>
              </div>
            </div>

            {/* Sections Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Course Sections ({sections.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddSection(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Add Section</span>
                </button>
              </div>

              {isLoadingSections ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600">Loading sections...</span>
                </div>
              ) : sections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No sections created yet.</p>
                  <p className="text-sm">Add your first section to organize students.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sections.map((section) => (
                    <div key={section.sectionId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900">{section.sectionName}</h4>
                            {section.sectionCode && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {section.sectionCode}
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              section.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {section.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {section.description && (
                            <p className="text-sm text-gray-600 mb-2">{section.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Max: {section.maxEnrollment || 'Unlimited'}</span>
                            <span>Current: {section.currentEnrollment}</span>
                            {section.location && <span>Location: {section.location}</span>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingSection(section)}
                            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                            title="Edit section"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSection(section.sectionId)}
                            className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                            title="Delete section"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>





            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">{success}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add Section Modal */}
      {showAddSection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Section</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Name *
                  </label>
                  <input
                    type="text"
                    value={sectionForm.sectionName}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, sectionName: e.target.value }))}
                    placeholder="e.g., Section A, Morning Class"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Code
                  </label>
                  <input
                    type="text"
                    value={sectionForm.sectionCode}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, sectionCode: e.target.value }))}
                    placeholder="e.g., A, 001, MWF"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={sectionForm.description}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description for this section"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Enrollment
                    </label>
                    <input
                      type="number"
                      value={sectionForm.maxEnrollment}
                      onChange={(e) => setSectionForm(prev => ({ ...prev, maxEnrollment: parseInt(e.target.value) || 30 }))}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={sectionForm.location}
                      onChange={(e) => setSectionForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Room 101, Online"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddSection(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddSection}
                  disabled={!sectionForm.sectionName.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Section
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {editingSection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Edit Section</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Name *
                  </label>
                  <input
                    type="text"
                    value={editingSection.sectionName}
                    onChange={(e) => setEditingSection(prev => prev ? { ...prev, sectionName: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Code
                  </label>
                  <input
                    type="text"
                    value={editingSection.sectionCode || ''}
                    onChange={(e) => setEditingSection(prev => prev ? { ...prev, sectionCode: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingSection.description || ''}
                    onChange={(e) => setEditingSection(prev => prev ? { ...prev, description: e.target.value } : null)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Enrollment
                    </label>
                    <input
                      type="number"
                      value={editingSection.maxEnrollment || ''}
                      onChange={(e) => setEditingSection(prev => prev ? { ...prev, maxEnrollment: parseInt(e.target.value) || undefined } : null)}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={editingSection.location || ''}
                      onChange={(e) => setEditingSection(prev => prev ? { ...prev, location: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingSection.isActive}
                    onChange={(e) => setEditingSection(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                    className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active Section
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleEditSection(editingSection)}
                  disabled={!editingSection.sectionName.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseSettingsModal;
