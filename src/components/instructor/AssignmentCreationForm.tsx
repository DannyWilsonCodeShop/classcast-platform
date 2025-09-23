'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Assignment, AssignmentType, AssignmentStatus } from '@/types/dynamodb';

// Dynamically import TipTapEditor to avoid SSR issues
const TipTapEditor = dynamic(() => import('./TipTapEditor'), {
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 rounded animate-pulse" />
});

interface AssignmentCreationFormProps {
  onSubmit: (assignment: Partial<Assignment>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<Assignment>;
  className?: string;
}

interface FormData {
  title: string;
  description: string;
  assignmentType: AssignmentType;
  dueDate: Date | null;
  responseDueDate: Date | null;
  maxScore: number;
  weight: number;
  requirements: string[];
  allowLateSubmission: boolean;
  latePenalty: number;
  maxSubmissions: number;
  groupAssignment: boolean;
  maxGroupSize: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  enablePeerResponses: boolean;
  minResponsesRequired: number;
  maxResponsesPerVideo: number;
  responseWordLimit: number;
  responseCharacterLimit: number;
}

const AssignmentCreationForm: React.FC<AssignmentCreationFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
  className = ''
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    assignmentType: initialData?.assignmentType || AssignmentType.ESSAY,
    dueDate: initialData?.dueDate ? new Date(initialData.dueDate) : null,
    responseDueDate: initialData?.responseDueDate ? new Date(initialData.responseDueDate) : null,
    maxScore: initialData?.maxScore || 100,
    weight: initialData?.weight || 10,
    requirements: initialData?.requirements || [''],
    allowLateSubmission: initialData?.allowLateSubmission || false,
    latePenalty: initialData?.latePenalty || 10,
    maxSubmissions: initialData?.maxSubmissions || 1,
    groupAssignment: initialData?.groupAssignment || false,
    maxGroupSize: initialData?.maxGroupSize || 2,
    allowedFileTypes: initialData?.allowedFileTypes || ['pdf', 'doc', 'docx'],
    maxFileSize: initialData?.maxFileSize || 10 * 1024 * 1024, // 10MB
    enablePeerResponses: initialData?.enablePeerResponses || false,
    minResponsesRequired: initialData?.minResponsesRequired || 2,
    maxResponsesPerVideo: initialData?.maxResponsesPerVideo || 3,
    responseWordLimit: initialData?.responseWordLimit || 50,
    responseCharacterLimit: initialData?.responseCharacterLimit || 500
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [newRequirement, setNewRequirement] = useState('');

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else if (formData.dueDate < new Date()) {
      newErrors.dueDate = 'Due date must be in the future';
    }

    // Validate response due date if peer responses are enabled
    if (formData.enablePeerResponses) {
      if (!formData.responseDueDate) {
        newErrors.responseDueDate = 'Response due date is required when peer responses are enabled';
      } else if (formData.responseDueDate < new Date()) {
        newErrors.responseDueDate = 'Response due date must be in the future';
      } else if (formData.dueDate && formData.responseDueDate <= formData.dueDate) {
        newErrors.responseDueDate = 'Response due date must be after video due date';
      }
    }

    if (formData.maxScore <= 0) {
      newErrors.maxScore = 'Maximum score must be greater than 0';
    }

    if (formData.weight <= 0 || formData.weight > 100) {
      newErrors.weight = 'Weight must be between 1 and 100';
    }

    if (formData.maxSubmissions < 1) {
      newErrors.maxSubmissions = 'Maximum submissions must be at least 1';
    }

    if (formData.groupAssignment && formData.maxGroupSize < 2) {
      newErrors.maxGroupSize = 'Group size must be at least 2';
    }

    if (formData.maxFileSize <= 0) {
      newErrors.maxFileSize = 'Maximum file size must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const assignmentData: Partial<Assignment> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assignmentType: formData.assignmentType,
        dueDate: formData.dueDate?.toISOString() || '',
        responseDueDate: formData.responseDueDate?.toISOString(),
        maxScore: formData.maxScore,
        weight: formData.weight,
        requirements: formData.requirements.filter(req => req.trim()),
        allowLateSubmission: formData.allowLateSubmission,
        latePenalty: formData.latePenalty,
        maxSubmissions: formData.maxSubmissions,
        groupAssignment: formData.groupAssignment,
        maxGroupSize: formData.groupAssignment ? formData.maxGroupSize : undefined,
        allowedFileTypes: formData.allowedFileTypes,
        maxFileSize: formData.maxFileSize,
        enablePeerResponses: formData.enablePeerResponses,
        minResponsesRequired: formData.enablePeerResponses ? formData.minResponsesRequired : undefined,
        maxResponsesPerVideo: formData.enablePeerResponses ? formData.maxResponsesPerVideo : undefined,
        responseWordLimit: formData.enablePeerResponses ? formData.responseWordLimit : undefined,
        responseCharacterLimit: formData.enablePeerResponses ? formData.responseCharacterLimit : undefined,
        status: AssignmentStatus.DRAFT
      };

      await onSubmit(assignmentData);
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  const addRequirement = () => {
    if (newRequirement.trim() && !formData.requirements.includes(newRequirement.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? value : req)
    }));
  };

  const addFileType = (fileType: string) => {
    if (fileType.trim() && !formData.allowedFileTypes.includes(fileType.trim())) {
      setFormData(prev => ({
        ...prev,
        allowedFileTypes: [...prev.allowedFileTypes, fileType.trim()]
      }));
    }
  };

  const removeFileType = (fileType: string) => {
    setFormData(prev => ({
      ...prev,
      allowedFileTypes: prev.allowedFileTypes.filter(type => type !== fileType)
    }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Assignment</h2>
        <p className="text-gray-600">Fill out the form below to create a new assignment for your students.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter assignment title"
              maxLength={200}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="assignmentType" className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Type *
            </label>
            <select
              id="assignmentType"
              value={formData.assignmentType}
              onChange={(e) => setFormData(prev => ({ ...prev, assignmentType: e.target.value as AssignmentType }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.values(AssignmentType).map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Assignment Description *
          </label>
          <div className={`border rounded-md ${errors.description ? 'border-red-500' : 'border-gray-300'}`}>
            <TipTapEditor
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Describe the assignment requirements, objectives, and expectations..."
              className="min-h-[200px]"
            />
          </div>
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        {/* Due Dates and Scoring */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
              Video Due Date *
            </label>
            <DatePicker
              selected={formData.dueDate}
              onChange={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              minDate={new Date()}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.dueDate ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholderText="Select video due date"
            />
            {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>}
          </div>

          <div>
            <label htmlFor="responseDueDate" className="block text-sm font-medium text-gray-700 mb-2">
              Response Due Date
            </label>
            <DatePicker
              selected={formData.responseDueDate}
              onChange={(date) => setFormData(prev => ({ ...prev, responseDueDate: date }))}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              minDate={formData.dueDate || new Date()}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.responseDueDate ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholderText="Select response due date"
              disabled={!formData.enablePeerResponses}
            />
            {errors.responseDueDate && <p className="mt-1 text-sm text-red-600">{errors.responseDueDate}</p>}
          </div>

          <div>
            <label htmlFor="maxScore" className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Score *
            </label>
            <input
              type="number"
              id="maxScore"
              value={formData.maxScore}
              onChange={(e) => setFormData(prev => ({ ...prev, maxScore: parseInt(e.target.value) || 0 }))}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.maxScore ? 'border-red-500' : 'border-gray-300'
              }`}
              min="1"
              step="1"
            />
            {errors.maxScore && <p className="mt-1 text-sm text-red-600">{errors.maxScore}</p>}
          </div>

          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
              Course Weight (%) *
            </label>
            <input
              type="number"
              id="weight"
              value={formData.weight}
              onChange={(e) => setFormData(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.weight ? 'border-red-500' : 'border-gray-300'
              }`}
              min="1"
              max="100"
              step="1"
            />
            {errors.weight && <p className="mt-1 text-sm text-red-600">{errors.weight}</p>}
          </div>
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assignment Requirements
          </label>
          <div className="space-y-2">
            {formData.requirements.map((requirement, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={requirement}
                  onChange={(e) => updateRequirement(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter requirement"
                />
                <button
                  type="button"
                  onClick={() => removeRequirement(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add new requirement"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
              />
              <button
                type="button"
                onClick={addRequirement}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Submission Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Submission Settings</h3>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="allowLateSubmission"
                checked={formData.allowLateSubmission}
                onChange={(e) => setFormData(prev => ({ ...prev, allowLateSubmission: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="allowLateSubmission" className="text-sm font-medium text-gray-700">
                Allow late submissions
              </label>
            </div>

            {formData.allowLateSubmission && (
              <div>
                <label htmlFor="latePenalty" className="block text-sm font-medium text-gray-700 mb-1">
                  Late Penalty (%)
                </label>
                <input
                  type="number"
                  id="latePenalty"
                  value={formData.latePenalty}
                  onChange={(e) => setFormData(prev => ({ ...prev, latePenalty: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="100"
                  step="1"
                />
              </div>
            )}

            <div>
              <label htmlFor="maxSubmissions" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Submissions
              </label>
              <input
                type="number"
                id="maxSubmissions"
                value={formData.maxSubmissions}
                onChange={(e) => setFormData(prev => ({ ...prev, maxSubmissions: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                step="1"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Group Settings</h3>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="groupAssignment"
                checked={formData.groupAssignment}
                onChange={(e) => setFormData(prev => ({ ...prev, groupAssignment: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="groupAssignment" className="text-sm font-medium text-gray-700">
                Group assignment
              </label>
            </div>

            {formData.groupAssignment && (
              <div>
                <label htmlFor="maxGroupSize" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Group Size
                </label>
                <input
                  type="number"
                  id="maxGroupSize"
                  value={formData.maxGroupSize}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxGroupSize: parseInt(e.target.value) || 2 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="2"
                  step="1"
                />
              </div>
            )}
          </div>
        </div>

        {/* File Upload Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">File Upload Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="maxFileSize" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum File Size
              </label>
              <select
                id="maxFileSize"
                value={formData.maxFileSize}
                onChange={(e) => setFormData(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1024 * 1024}>1 MB</option>
                <option value={5 * 1024 * 1024}>5 MB</option>
                <option value={10 * 1024 * 1024}>10 MB</option>
                <option value={25 * 1024 * 1024}>25 MB</option>
                <option value={50 * 1024 * 1024}>50 MB</option>
                <option value={100 * 1024 * 1024}>100 MB</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed File Types
              </label>
              <div className="space-y-2">
                {formData.allowedFileTypes.map((fileType) => (
                  <div key={fileType} className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md">
                      {fileType.toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFileType(fileType)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Add file type (e.g., pdf)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        addFileType(input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Add file type (e.g., pdf)"]') as HTMLInputElement;
                      if (input) {
                        addFileType(input.value);
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Peer Response Settings */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">💬</span>
            Peer Response Settings
          </h3>
          
          <div className="space-y-6">
            {/* Enable Peer Responses */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enablePeerResponses"
                checked={formData.enablePeerResponses}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  enablePeerResponses: e.target.checked,
                  responseDueDate: e.target.checked ? prev.responseDueDate : null
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enablePeerResponses" className="ml-2 text-sm font-medium text-gray-700">
                Enable peer responses for this assignment
              </label>
            </div>

            {formData.enablePeerResponses && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Minimum Responses Required */}
                <div>
                  <label htmlFor="minResponsesRequired" className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Responses Required per Student
                  </label>
                  <input
                    type="number"
                    id="minResponsesRequired"
                    min="1"
                    max="10"
                    value={formData.minResponsesRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, minResponsesRequired: parseInt(e.target.value) || 2 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">How many peer responses each student must submit</p>
                </div>

                {/* Maximum Responses Per Video */}
                <div>
                  <label htmlFor="maxResponsesPerVideo" className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Responses Per Video
                  </label>
                  <input
                    type="number"
                    id="maxResponsesPerVideo"
                    min="1"
                    max="20"
                    value={formData.maxResponsesPerVideo}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxResponsesPerVideo: parseInt(e.target.value) || 3 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Limit responses per video to ensure fair distribution</p>
                </div>

                {/* Response Word Limit */}
                <div>
                  <label htmlFor="responseWordLimit" className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Word Count
                  </label>
                  <input
                    type="number"
                    id="responseWordLimit"
                    min="10"
                    max="1000"
                    value={formData.responseWordLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, responseWordLimit: parseInt(e.target.value) || 50 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Minimum words required for each response</p>
                </div>

                {/* Response Character Limit */}
                <div>
                  <label htmlFor="responseCharacterLimit" className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Character Count
                  </label>
                  <input
                    type="number"
                    id="responseCharacterLimit"
                    min="100"
                    max="5000"
                    value={formData.responseCharacterLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, responseCharacterLimit: parseInt(e.target.value) || 500 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Maximum characters allowed per response</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssignmentCreationForm;
