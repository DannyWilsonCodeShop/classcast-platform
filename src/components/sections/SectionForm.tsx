'use client';

import React, { useState } from 'react';
import { Section, CreateSectionRequest } from '@/types/sections';

interface SectionFormProps {
  courseId: string;
  instructorId: string;
  onSave: (section: CreateSectionRequest) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<Section>;
  isEditing?: boolean;
}

export const SectionForm: React.FC<SectionFormProps> = ({
  courseId,
  instructorId,
  onSave,
  onCancel,
  initialData,
  isEditing = false
}) => {
  const [formData, setFormData] = useState({
    sectionName: initialData?.sectionName || '',
    sectionCode: initialData?.sectionCode || '',
    description: initialData?.description || '',
    maxEnrollment: initialData?.maxEnrollment || 30
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sectionName.trim()) {
      newErrors.sectionName = 'Section name is required';
    }

    if (formData.maxEnrollment < 1) {
      newErrors.maxEnrollment = 'Maximum enrollment must be at least 1';
    }

    if (formData.maxEnrollment > 1000) {
      newErrors.maxEnrollment = 'Maximum enrollment cannot exceed 1000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        courseId,
        sectionName: formData.sectionName,
        sectionCode: formData.sectionCode || undefined,
        description: formData.description || undefined,
        maxEnrollment: formData.maxEnrollment
      });
    } catch (error) {
      console.error('Error saving section:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        {isEditing ? 'Edit Section' : 'Create New Section'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Section Name *
          </label>
          <input
            type="text"
            value={formData.sectionName}
            onChange={(e) => handleInputChange('sectionName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.sectionName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Period 1, Section A, Morning Class"
          />
          {errors.sectionName && (
            <p className="mt-1 text-sm text-red-600">{errors.sectionName}</p>
          )}
        </div>

        {/* Section Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Section Code (Optional)
          </label>
          <input
            type="text"
            value={formData.sectionCode}
            onChange={(e) => handleInputChange('sectionCode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., P1, A, MORN"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional details about this section..."
          />
        </div>

        {/* Max Enrollment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Enrollment *
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={formData.maxEnrollment}
            onChange={(e) => handleInputChange('maxEnrollment', parseInt(e.target.value))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.maxEnrollment ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.maxEnrollment && (
            <p className="mt-1 text-sm text-red-600">{errors.maxEnrollment}</p>
          )}
        </div>


        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Section' : 'Create Section')}
          </button>
        </div>
      </form>
    </div>
  );
};
