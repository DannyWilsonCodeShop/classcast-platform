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
  hidePeerVideosUntilInstructorPosts: boolean;
  coverPhoto: string;
  emoji: string;
  color: string;
  requireLiveRecording: boolean;
  rubricType: 'none' | 'upload' | 'ai_generated';
  rubricFile: File | null;
  aiGeneratedRubric: any;
  customRubric: any;
  customRubricCategories: Array<{ name: string; points: number; description: string }>;
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
    assignmentType: initialData?.assignmentType || AssignmentType.VIDEO_ASSIGNMENT,
    dueDate: initialData?.dueDate ? new Date(initialData.dueDate) : null,
    responseDueDate: initialData?.responseDueDate ? new Date(initialData.responseDueDate) : null,
    maxScore: initialData?.maxScore || 100,
    requirements: initialData?.requirements || [''],
    allowLateSubmission: initialData?.allowLateSubmission || false,
    latePenalty: initialData?.latePenalty || 10,
    maxSubmissions: initialData?.maxSubmissions || 1,
    groupAssignment: initialData?.groupAssignment || false,
    maxGroupSize: initialData?.maxGroupSize || 2,
    allowedFileTypes: initialData?.allowedFileTypes || ['mp4', 'webm', 'mov', 'avi'],
    maxFileSize: initialData?.maxFileSize || 100 * 1024 * 1024, // 100MB for videos
    enablePeerResponses: initialData?.enablePeerResponses || false,
    minResponsesRequired: initialData?.minResponsesRequired || 2,
    maxResponsesPerVideo: initialData?.maxResponsesPerVideo || 3,
    responseWordLimit: initialData?.responseWordLimit || 50,
    responseCharacterLimit: initialData?.responseCharacterLimit || 500,
    hidePeerVideosUntilInstructorPosts: initialData?.hidePeerVideosUntilInstructorPosts || false,
    coverPhoto: initialData?.coverPhoto || '',
    emoji: initialData?.emoji || '🎥',
    color: initialData?.color || '#3B82F6',
    requireLiveRecording: initialData?.requireLiveRecording || false,
    rubricType: 'none',
    rubricFile: null,
    aiGeneratedRubric: null,
    customRubric: null,
    customRubricCategories: [
      { name: 'Content Quality', points: 25, description: 'Depth, accuracy, and relevance of content' },
      { name: 'Presentation Skills', points: 25, description: 'Clarity, organization, and delivery' },
      { name: 'Technical Accuracy', points: 25, description: 'Correctness of technical concepts' },
      { name: 'Creativity & Innovation', points: 25, description: 'Originality and creative approach' }
    ]
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [newRequirement, setNewRequirement] = useState('');
  const [isGeneratingRubric, setIsGeneratingRubric] = useState(false);
  const [showRubricPreview, setShowRubricPreview] = useState(false);

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
        hidePeerVideosUntilInstructorPosts: formData.enablePeerResponses ? formData.hidePeerVideosUntilInstructorPosts : undefined,
        coverPhoto: formData.coverPhoto,
        emoji: formData.emoji,
        color: formData.color,
        requireLiveRecording: formData.requireLiveRecording,
        rubric: formData.rubricType === 'ai_generated' ? formData.aiGeneratedRubric : 
                formData.rubricType === 'upload' ? { type: 'uploaded', file: formData.rubricFile } : 
                undefined,
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

  const generateAIRubric = async () => {
    setIsGeneratingRubric(true);
    try {
      const response = await fetch('/api/ai/rubric-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          assignmentType: formData.assignmentType,
          maxScore: formData.maxScore,
          requirements: formData.requirements.filter(req => req.trim()),
          customCategories: formData.customRubricCategories
        })
      });

      if (response.ok) {
        const rubric = await response.json();
        setFormData(prev => ({ 
          ...prev, 
          aiGeneratedRubric: rubric,
          rubricType: 'ai_generated'
        }));
        setShowRubricPreview(true);
      } else {
        throw new Error('Failed to generate rubric');
      }
    } catch (error) {
      console.error('Error generating rubric:', error);
      alert('Failed to generate rubric. Please try again.');
    } finally {
      setIsGeneratingRubric(false);
    }
  };

  const handleRubricFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ 
        ...prev, 
        rubricFile: file,
        rubricType: 'upload'
      }));
    }
  };

  const removeRubric = () => {
    setFormData(prev => ({ 
      ...prev, 
      rubricType: 'none',
      rubricFile: null,
      aiGeneratedRubric: null,
      customRubric: null
    }));
    setShowRubricPreview(false);
  };

  const addRubricCategory = () => {
    setFormData(prev => ({
      ...prev,
      customRubricCategories: [
        ...prev.customRubricCategories,
        { name: '', points: 0, description: '' }
      ]
    }));
  };

  const updateRubricCategory = (index: number, field: 'name' | 'points' | 'description', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      customRubricCategories: prev.customRubricCategories.map((category, i) => 
        i === index ? { ...category, [field]: value } : category
      )
    }));
  };

  const removeRubricCategory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customRubricCategories: prev.customRubricCategories.filter((_, i) => i !== index)
    }));
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
              <option value={AssignmentType.VIDEO_ASSIGNMENT}>🎥 Video Assignment</option>
              <option value={AssignmentType.VIDEO_DISCUSSION}>💬 Video Discussion</option>
              <option value={AssignmentType.VIDEO_ASSESSMENT}>📝 Video Assessment</option>
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

        {/* Visual Identity */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🎨</span>
            Visual Identity
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Emoji Selection */}
            <div>
              <label htmlFor="emoji" className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Emoji
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  id="emoji"
                  value={formData.emoji}
                  onChange={(e) => setFormData(prev => ({ ...prev, emoji: e.target.value }))}
                  className="w-16 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl"
                  placeholder="🎥"
                  maxLength={2}
                />
                <div className="text-sm text-gray-500">
                  Choose an emoji that represents this assignment
                </div>
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            {/* Cover Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Photo
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setFormData(prev => ({ ...prev, coverPhoto: event.target?.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                  id="coverPhoto"
                />
                <label
                  htmlFor="coverPhoto"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Upload Photo
                </label>
                {formData.coverPhoto && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, coverPhoto: '' }))}
                    className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              {formData.coverPhoto && (
                <div className="mt-2">
                  <img
                    src={formData.coverPhoto}
                    alt="Cover preview"
                    className="w-20 h-12 object-cover rounded border"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Due Dates and Scoring */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        </div>

        {/* Maximum Score */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
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
                {/* Preset file type buttons */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {['mp4', 'webm', 'mov', 'avi', 'pdf', 'doc', 'docx', 'txt'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => addFileType(type)}
                      className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                        formData.allowedFileTypes.includes(type)
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
                
                {/* Selected file types */}
                <div className="space-y-1">
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
                </div>
                
                {/* Custom file type input */}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Add custom file type (e.g., zip)"
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
                      const input = document.querySelector('input[placeholder="Add custom file type (e.g., zip)"]') as HTMLInputElement;
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

        {/* Assignment Type Specific Settings */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">
              {formData.assignmentType === AssignmentType.VIDEO_ASSIGNMENT && '🎥'}
              {formData.assignmentType === AssignmentType.VIDEO_DISCUSSION && '💬'}
              {formData.assignmentType === AssignmentType.VIDEO_ASSESSMENT && '📝'}
            </span>
            {formData.assignmentType === AssignmentType.VIDEO_ASSIGNMENT && 'Video Assignment Settings'}
            {formData.assignmentType === AssignmentType.VIDEO_DISCUSSION && 'Video Discussion Settings'}
            {formData.assignmentType === AssignmentType.VIDEO_ASSESSMENT && 'Video Assessment Settings'}
          </h3>
          
          <div className="space-y-4">
            {formData.assignmentType === AssignmentType.VIDEO_ASSIGNMENT && (
              <div className="text-sm text-gray-600">
                <p className="mb-2">Students will create and submit video presentations or demonstrations.</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Perfect for presentations, tutorials, or demonstrations</li>
                  <li>Students can upload video files directly</li>
                  <li>Instructors can provide detailed feedback</li>
                </ul>
              </div>
            )}
            
            {formData.assignmentType === AssignmentType.VIDEO_DISCUSSION && (
              <div className="text-sm text-gray-600">
                <p className="mb-2">Students will engage in video-based discussions and peer interactions.</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Students post video responses to discussion topics</li>
                  <li>Peer-to-peer video interactions and feedback</li>
                  <li>Encourages collaborative learning</li>
                </ul>
              </div>
            )}
            
            {formData.assignmentType === AssignmentType.VIDEO_ASSESSMENT && (
              <div className="text-sm text-gray-600">
                <p className="mb-2">Students will complete video-based assessments or evaluations.</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Video-based quizzes, tests, or evaluations</li>
                  <li>Students record their responses to questions</li>
                  <li>Formal assessment with structured grading</li>
                </ul>
              </div>
            )}
            
            {/* Live Recording Option */}
            <div className="border-t border-blue-200 pt-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="requireLiveRecording"
                  checked={formData.requireLiveRecording}
                  onChange={(e) => setFormData(prev => ({ ...prev, requireLiveRecording: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label htmlFor="requireLiveRecording" className="text-sm font-medium text-gray-700">
                    Require Live Video Recording
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Students must record their video live using the browser camera. File uploads will be disabled.
                  </p>
                </div>
              </div>
              
              {formData.requireLiveRecording && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="text-yellow-400">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800">Live Recording Requirements</h4>
                      <div className="mt-1 text-sm text-yellow-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Students will need to grant camera and microphone permissions</li>
                          <li>Videos are recorded directly in the browser and uploaded automatically</li>
                          <li>No pre-recorded video files can be uploaded</li>
                          <li>Recording quality depends on student's device and internet connection</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

            {/* Response Due Date */}
            {formData.enablePeerResponses && (
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
                />
                {errors.responseDueDate && <p className="mt-1 text-sm text-red-600">{errors.responseDueDate}</p>}
                <p className="mt-1 text-xs text-gray-500">When peer responses are due (must be after video due date)</p>
              </div>
            )}

            {/* Hide Peer Videos Until Instructor Posts */}
            {formData.enablePeerResponses && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hidePeerVideosUntilInstructorPosts"
                  checked={formData.hidePeerVideosUntilInstructorPosts}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    hidePeerVideosUntilInstructorPosts: e.target.checked
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="hidePeerVideosUntilInstructorPosts" className="ml-2 text-sm font-medium text-gray-700">
                  Hide peer videos until instructor posts their own video
                </label>
              </div>
            )}

            {/* Hide Peer Videos Info */}
            {formData.enablePeerResponses && formData.hidePeerVideosUntilInstructorPosts && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-blue-400 text-lg">ℹ️</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">Instructor Video Required</h4>
                    <p className="mt-1 text-sm text-blue-700">
                      Students will not be able to see peer videos until you post your own video submission. 
                      This ensures students see your example first before viewing their peers' work.
                    </p>
                  </div>
                </div>
              </div>
            )}

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

        {/* Rubric Settings */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📋</span>
            Grading Rubric
          </h3>
          
          <div className="space-y-4">
            {/* Rubric Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Rubric Option
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, rubricType: 'none' }))}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    formData.rubricType === 'none'
                      ? 'border-purple-500 bg-purple-100'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-2">❌</div>
                  <div className="font-medium">No Rubric</div>
                  <div className="text-sm text-gray-600">Grade without structured criteria</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, rubricType: 'upload' }))}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    formData.rubricType === 'upload'
                      ? 'border-purple-500 bg-purple-100'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-2">📄</div>
                  <div className="font-medium">Upload Rubric</div>
                  <div className="text-sm text-gray-600">Upload your own rubric file</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, rubricType: 'ai_generated' }))}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    formData.rubricType === 'ai_generated'
                      ? 'border-purple-500 bg-purple-100'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="font-medium">AI Generated</div>
                  <div className="text-sm text-gray-600">Generate rubric with AI</div>
                </button>
              </div>
            </div>

            {/* Upload Rubric Section */}
            {formData.rubricType === 'upload' && (
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Rubric File
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleRubricFileUpload}
                    className="hidden"
                    id="rubricFile"
                  />
                  <label
                    htmlFor="rubricFile"
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 cursor-pointer transition-colors"
                  >
                    Choose File
                  </label>
                  {formData.rubricFile && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {formData.rubricFile.name} ({formatFileSize(formData.rubricFile.size)})
                      </span>
                      <button
                        type="button"
                        onClick={removeRubric}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: PDF, DOC, DOCX, TXT (max 10MB)
                </p>
              </div>
            )}

            {/* AI Generated Rubric Section */}
            {formData.rubricType === 'ai_generated' && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">AI-Generated Rubric</h4>
                    <p className="text-sm text-gray-600">
                      Define your rubric categories and AI will generate detailed criteria
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={generateAIRubric}
                    disabled={isGeneratingRubric || !formData.title.trim() || !formData.description.trim() || formData.customRubricCategories.some(cat => !cat.name.trim() || cat.points <= 0)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGeneratingRubric ? 'Generating...' : 'Generate Rubric'}
                  </button>
                </div>

                {/* Custom Categories Input */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Rubric Categories
                    </label>
                    <button
                      type="button"
                      onClick={addRubricCategory}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      + Add Category
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.customRubricCategories.map((category, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-4">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Category Name
                          </label>
                          <input
                            type="text"
                            value={category.name}
                            onChange={(e) => updateRubricCategory(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                            placeholder="e.g., Content Quality"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Points
                          </label>
                          <input
                            type="number"
                            value={category.points}
                            onChange={(e) => updateRubricCategory(index, 'points', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                            min="1"
                            step="1"
                          />
                        </div>
                        <div className="md:col-span-5">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={category.description}
                            onChange={(e) => updateRubricCategory(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                            placeholder="Brief description of this category"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <button
                            type="button"
                            onClick={() => removeRubricCategory(index)}
                            disabled={formData.customRubricCategories.length <= 1}
                            className="w-full px-2 py-2 text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                            title="Remove category"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center">
                      <span className="text-blue-600 mr-2">ℹ️</span>
                      <div className="text-sm text-blue-800">
                        <strong>Total Points:</strong> {formData.customRubricCategories.reduce((sum, cat) => sum + cat.points, 0)} / {formData.maxScore}
                        {formData.customRubricCategories.reduce((sum, cat) => sum + cat.points, 0) !== formData.maxScore && (
                          <span className="text-red-600 ml-2">
                            (Points don't match max score)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isGeneratingRubric && (
                  <div className="flex items-center space-x-2 text-purple-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    <span className="text-sm">AI is analyzing your assignment and generating a rubric...</span>
                  </div>
                )}

                {formData.aiGeneratedRubric && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Generated Rubric Preview</span>
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowRubricPreview(!showRubricPreview)}
                          className="text-sm text-purple-600 hover:text-purple-800"
                        >
                          {showRubricPreview ? 'Hide' : 'Preview'}
                        </button>
                        <button
                          type="button"
                          onClick={removeRubric}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    
                    {showRubricPreview && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <div className="space-y-4">
                          {formData.aiGeneratedRubric.criteria?.map((criterion: any, index: number) => (
                            <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                              <div className="font-medium text-gray-900 mb-2">
                                {criterion.name} ({criterion.points} points)
                              </div>
                              <div className="text-sm text-gray-600 mb-2">{criterion.description}</div>
                              <div className="text-xs text-gray-500">
                                <div className="grid grid-cols-4 gap-2">
                                  {criterion.levels?.map((level: any, levelIndex: number) => (
                                    <div key={levelIndex} className="text-center">
                                      <div className="font-medium">{level.name}</div>
                                      <div className="text-gray-500">{level.points} pts</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!formData.aiGeneratedRubric && !isGeneratingRubric && (
                  <div className="text-sm text-gray-500 italic">
                    Click "Generate Rubric" to create an AI-powered rubric based on your assignment details.
                  </div>
                )}
              </div>
            )}

            {/* Current Rubric Status */}
            {formData.rubricType !== 'none' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center">
                  <span className="text-green-400 mr-2">✅</span>
                  <span className="text-sm text-green-800">
                    {formData.rubricType === 'upload' && 'Rubric file uploaded successfully'}
                    {formData.rubricType === 'ai_generated' && 'AI-generated rubric ready'}
                  </span>
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
