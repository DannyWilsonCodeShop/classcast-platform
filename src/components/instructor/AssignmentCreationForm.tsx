'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Assignment, AssignmentType, AssignmentStatus, AssignmentResource } from '@/types/dynamodb';
import { CLASS_COLORS, getClassColorById, getDefaultClassColor } from '@/lib/class-colors';
import AssignmentResourcesManager from './AssignmentResourcesManager';
// import { Section } from '@/types/sections';

interface Section {
  sectionId: string;
  sectionName: string;
  sectionCode?: string;
}

// Dynamically import TipTapEditor to avoid SSR issues
const TipTapEditor = dynamic(() => import('./TipTapEditor'), {
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 rounded animate-pulse" />
});

interface AssignmentCreationFormProps {
  onSubmit: (assignment: Partial<Assignment>) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>; // NEW: Optional delete callback
  isLoading?: boolean;
  initialData?: Partial<Assignment>;
  className?: string;
  courseId?: string;
  isEditing?: boolean;
  assignmentId?: string;
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
  allowYouTubeUrl: boolean; // NEW: Allow external video link submissions (YouTube & Google Drive)
  rubricType: 'none' | 'upload' | 'custom' | 'ai_generated';
  rubricFile: File | null;
  aiGeneratedRubric: any;
  customRubric: any;
  customRubricCategories: Array<{ name: string; points: number; description: string }>;
  targetSections: string[];
  allSections: boolean;
  peerReviewScope: 'section' | 'course';
  resources: AssignmentResource[];
  instructionalVideoUrl: string; // NEW: Instructor's explanation video
  instructionalVideoType: 'youtube' | 'upload' | 'none'; // NEW: Video type
  instructionalVideoFile: File | null; // NEW: Uploaded video file
}

const AssignmentCreationForm: React.FC<AssignmentCreationFormProps> = ({
  onSubmit,
  onCancel,
  onDelete,
  isLoading = false,
  initialData,
  className = '',
  courseId,
  isEditing = false,
  assignmentId
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
    maxFileSize: initialData?.maxFileSize || 2048 * 1024 * 1024, // 2GB for videos
    enablePeerResponses: initialData?.enablePeerResponses || false,
    minResponsesRequired: initialData?.minResponsesRequired || 2,
    maxResponsesPerVideo: initialData?.maxResponsesPerVideo || 3,
    responseWordLimit: initialData?.responseWordLimit || 50,
    responseCharacterLimit: initialData?.responseCharacterLimit || 500,
    hidePeerVideosUntilInstructorPosts: initialData?.hidePeerVideosUntilInstructorPosts || false,
    coverPhoto: initialData?.coverPhoto || '',
    emoji: initialData?.emoji || '🎥',
    color: initialData?.color || getDefaultClassColor().value,
    requireLiveRecording: initialData?.requireLiveRecording || false,
    allowYouTubeUrl: initialData?.allowYouTubeUrl || false,
    rubricType: 'none',
    rubricFile: null,
    aiGeneratedRubric: null,
    customRubric: null,
    customRubricCategories: [
      { name: 'Content Quality', points: 25, description: 'Depth, accuracy, and relevance of content' },
      { name: 'Presentation Skills', points: 25, description: 'Clarity, organization, and delivery' },
      { name: 'Technical Accuracy', points: 25, description: 'Correctness of technical concepts' },
      { name: 'Creativity & Innovation', points: 25, description: 'Originality and creative approach' }
    ],
    targetSections: [],
    allSections: true,
    peerReviewScope: initialData?.peerReviewScope || 'section',
    resources: initialData?.resources || [],
    instructionalVideoUrl: initialData?.instructionalVideoUrl || '',
    instructionalVideoType: 'none',
    instructionalVideoFile: null
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [newRequirement, setNewRequirement] = useState('');
  const [isGeneratingRubric, setIsGeneratingRubric] = useState(false);
  const [showRubricPreview, setShowRubricPreview] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  // Load sections when courseId is provided
  useEffect(() => {
    if (courseId) {
      loadSections();
    }
  }, [courseId]);

  const loadSections = async () => {
    if (!courseId) return;
    
    try {
      setSectionsLoading(true);
      const response = await fetch(`/api/sections?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setSections(data.data || []);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setSectionsLoading(false);
    }
  };

  const validateForm = useCallback((): { isValid: boolean; errors: Partial<Record<keyof FormData, string>> } => {
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
    } else if (!isEditing && formData.dueDate < new Date()) {
      // Only validate future dates when creating a new assignment
      // When editing, allow past dates (assignments might already be due)
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

    // Validate instructional video settings
    if (formData.instructionalVideoType === 'youtube') {
      if (!formData.instructionalVideoUrl.trim()) {
        newErrors.instructionalVideoUrl = 'Video URL is required when video URL type is selected';
      } else {
        // Validate both YouTube and Google Drive URLs
        const trimmedUrl = formData.instructionalVideoUrl.trim();
        const youtubeUrlPattern = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
        // Updated Google Drive pattern to handle /view?usp=sharing and other parameters
        const googleDrivePattern = /^https?:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/;
        
        const isValidYouTube = youtubeUrlPattern.test(trimmedUrl);
        const isValidGoogleDrive = googleDrivePattern.test(trimmedUrl);
        
        if (!isValidYouTube && !isValidGoogleDrive) {
          newErrors.instructionalVideoUrl = 'Please enter a valid YouTube or Google Drive URL. Google Drive URLs should be in the format: https://drive.google.com/file/d/FILE_ID/...';
        }
      }
    } else if (formData.instructionalVideoType === 'upload') {
      if (!formData.instructionalVideoFile) {
        newErrors.instructionalVideoFile = 'Video file is required when upload video type is selected';
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

    // Don't call setErrors here to avoid race conditions
    // The caller will handle setting errors if needed
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  }, [formData, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔄 Form submit triggered');
    console.log('📝 Form data:', formData);
    console.log('🎬 Instructional video details:', {
      type: formData.instructionalVideoType,
      url: formData.instructionalVideoUrl,
      file: formData.instructionalVideoFile?.name || null
    });
    console.log('✅ Validating form...');
    
    const validationResult = validateForm();
    const { isValid, errors: validationErrors } = validationResult;
    
    console.log('🔍 Validation result:', isValid);
    console.log('❌ Validation errors:', validationErrors);
    
    if (!isValid) {
      console.log('❌ Form validation failed with errors:', validationErrors);
      
      // Show error alert with specific validation messages
      const errorMessages = Object.entries(validationErrors)
        .map(([field, message]) => `• ${message}`)
        .join('\n');
      
      if (errorMessages) {
        alert(`Please fix the following errors:\n\n${errorMessages}`);
      } else {
        alert('Form validation failed. Please check all required fields.');
      }
      
      // Update the errors state for UI display
      setErrors(validationErrors);
      
      // Scroll to first error field
      const firstErrorField = Object.keys(validationErrors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField) || document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }
      return;
    }
    
    console.log('✅ Form validation passed, submitting...');

    try {
      let instructionalVideoUrl = formData.instructionalVideoUrl;
      console.log('📹 Initial instructional video URL:', instructionalVideoUrl);

      // Handle video file upload if needed
      if (formData.instructionalVideoType === 'upload' && formData.instructionalVideoFile) {
        console.log('📤 Uploading instructional video...');
        const uploadFormData = new FormData();
        uploadFormData.append('video', formData.instructionalVideoFile);
        uploadFormData.append('type', 'instructional');
        
        try {
          const uploadResponse = await fetch('/api/upload/instructional-video', {
            method: 'POST',
            body: uploadFormData
          });
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            instructionalVideoUrl = uploadResult.videoUrl;
            console.log('✅ Instructional video uploaded:', instructionalVideoUrl);
          } else {
            throw new Error('Failed to upload instructional video');
          }
        } catch (uploadError) {
          console.error('Error uploading instructional video:', uploadError);
          alert('Failed to upload instructional video. Please try again.');
          return;
        }
      } else if (formData.instructionalVideoType === 'youtube') {
        console.log('🔗 Using video URL directly:', instructionalVideoUrl);
        
        // Validate video URL format (YouTube or Google Drive)
        const trimmedUrl = instructionalVideoUrl.trim();
        const youtubeUrlPattern = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
        // Updated Google Drive pattern to handle /view?usp=sharing and other parameters
        const googleDrivePattern = /^https?:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/;
        
        const isValidYouTube = youtubeUrlPattern.test(trimmedUrl);
        const isValidGoogleDrive = googleDrivePattern.test(trimmedUrl);
        
        console.log('🔍 URL Validation in submit handler:');
        console.log(`   URL: ${trimmedUrl}`);
        console.log(`   YouTube valid: ${isValidYouTube}`);
        console.log(`   Google Drive valid: ${isValidGoogleDrive}`);
        console.log(`   Overall valid: ${isValidYouTube || isValidGoogleDrive}`);
        
        if (!isValidYouTube && !isValidGoogleDrive) {
          console.error('❌ Invalid video URL format:', instructionalVideoUrl);
          console.error('❌ YouTube pattern test:', isValidYouTube);
          console.error('❌ Google Drive pattern test:', isValidGoogleDrive);
          
          const errorMessage = 'Please enter a valid YouTube or Google Drive URL.\n\n' +
            'YouTube format: https://www.youtube.com/watch?v=VIDEO_ID\n' +
            'Google Drive format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing\n\n' +
            `Your URL: ${trimmedUrl}`;
          
          setErrors(prev => ({
            ...prev,
            instructionalVideoUrl: errorMessage
          }));
          alert(errorMessage);
          
          // Scroll to the error field
          const element = document.getElementById('instructionalVideoUrl');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();
          }
          return;
        }
        
        const urlType = isValidYouTube ? 'YouTube' : 'Google Drive';
        console.log(`✅ ${urlType} URL format validated`);
      }

      const finalInstructionalVideoUrl = formData.instructionalVideoType !== 'none' ? instructionalVideoUrl : undefined;
      console.log('🎯 Final instructional video URL for assignment:', finalInstructionalVideoUrl);

      const assignmentData: Partial<Assignment> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assignmentType: formData.assignmentType,
        dueDate: formData.dueDate && formData.dueDate instanceof Date ? formData.dueDate.toISOString() : '',
        responseDueDate: formData.responseDueDate && formData.responseDueDate instanceof Date ? formData.responseDueDate.toISOString() : undefined,
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
        peerReviewScope: formData.enablePeerResponses ? formData.peerReviewScope : undefined,
        coverPhoto: formData.coverPhoto,
        emoji: formData.emoji,
        color: formData.color,
        requireLiveRecording: formData.requireLiveRecording,
        allowYouTubeUrl: formData.allowYouTubeUrl,
        resources: formData.resources,
        instructionalVideoUrl: finalInstructionalVideoUrl,
        rubric: formData.rubricType === 'ai_generated' ? formData.aiGeneratedRubric : 
                formData.rubricType === 'upload' ? { type: 'uploaded', file: formData.rubricFile } : 
                formData.rubricType === 'custom' ? { type: 'custom', categories: formData.customRubricCategories } :
                undefined,
        status: AssignmentStatus.DRAFT
      };

      console.log('📤 Calling onSubmit with assignment data:', assignmentData);
      console.log('🎬 Assignment instructionalVideoUrl field:', assignmentData.instructionalVideoUrl);
      await onSubmit(assignmentData);
      console.log('✅ onSubmit completed successfully');
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('Network error: Please check your internet connection and try again.');
      } else if (error instanceof Error && error.message.includes('Failed to create assignment')) {
        alert(`Assignment creation failed: ${error.message}`);
      } else if (error instanceof Error && error.message.includes('validation')) {
        alert(`Validation error: ${error.message}`);
      } else {
        // Show a more helpful error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        alert(`Failed to save assignment: ${errorMessage}\n\nPlease check the console for more details and try again.`);
      }
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

      const data = await response.json();

      // Check if subscription is required
      if (data.requiresSubscription) {
        setIsGeneratingRubric(false);
        setSubscriptionData(data);
        setShowSubscriptionModal(true);
        return;
      }

      if (response.ok) {
        const rubric = data;
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
      rubricType: 'custom', // Automatically set to custom when adding categories
      customRubricCategories: [
        ...prev.customRubricCategories,
        { name: '', points: 0, description: '' }
      ]
    }));
  };

  const updateRubricCategory = (index: number, field: 'name' | 'points' | 'description', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      rubricType: 'custom', // Automatically set to custom when updating categories
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

  const handleDelete = async () => {
    if (!isEditing || !assignmentId) return;
    
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('🗑️ Deleting assignment:', assignmentId);
      
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete assignment');
      }

      console.log('✅ Assignment deleted successfully');
      
      // Close modal first
      onCancel();
      
      // Show success message
      alert('Assignment deleted successfully!');
      
      // Then refresh the data
      if (onDelete) {
        console.log('🔄 Calling onDelete callback to refresh assignments list');
        await onDelete();
      } else {
        console.log('🔄 No onDelete callback provided, reloading page');
        window.location.reload();
      }
      
    } catch (error) {
      console.error('❌ Error deleting assignment:', error);
      alert(`Failed to delete assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isEditing ? 'Edit Assignment' : 'Create New Assignment'}
            </h2>
            <p className="text-gray-600">
              {isEditing 
                ? 'Update the assignment details below.' 
                : 'Fill out the form below to create a new assignment for your students.'
              }
            </p>
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete Assignment</span>
            </button>
          )}
        </div>
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

        {/* Section Targeting */}
        {courseId && sections.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🎯</span>
              Target Sections
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose which sections of this course should receive this assignment.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allSections"
                  checked={formData.allSections}
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      allSections: e.target.checked,
                      targetSections: e.target.checked ? [] : prev.targetSections
                    }));
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="allSections" className="ml-2 text-sm font-medium text-gray-700">
                  All sections ({sections.length} sections)
                </label>
              </div>

              {!formData.allSections && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select specific sections:
                  </label>
                  {sectionsLoading ? (
                    <div className="text-sm text-gray-500">Loading sections...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {sections.map((section) => (
                        <div key={section.sectionId} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`section-${section.sectionId}`}
                            checked={formData.targetSections.includes(section.sectionId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  targetSections: [...prev.targetSections, section.sectionId]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  targetSections: prev.targetSections.filter(id => id !== section.sectionId)
                                }));
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`section-${section.sectionId}`} className="ml-2 text-sm text-gray-700">
                            {section.sectionName} {section.sectionCode && `(${section.sectionCode})`}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Peer Review Scope */}
        {courseId && sections.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">👥</span>
              Peer Review Scope
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose whether students can review videos from their section only or from all sections.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="peerReviewSection"
                  name="peerReviewScope"
                  value="section"
                  checked={formData.peerReviewScope === 'section'}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    peerReviewScope: e.target.value as 'section' | 'course'
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="peerReviewSection" className="ml-3 text-sm font-medium text-gray-700">
                  Section Only
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-7">
                Students can only review videos from peers in their same section
              </p>
              
              <div className="flex items-center">
                <input
                  type="radio"
                  id="peerReviewCourse"
                  name="peerReviewScope"
                  value="course"
                  checked={formData.peerReviewScope === 'course'}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    peerReviewScope: e.target.value as 'section' | 'course'
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="peerReviewCourse" className="ml-3 text-sm font-medium text-gray-700">
                  Course Wide
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-7">
                Students can review videos from peers in all sections of the course
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Assignment Description *
          </label>
          <div className={`border rounded-md ${errors.description ? 'border-red-500' : 'border-gray-300'}`}>
            <TipTapEditor
              value={formData.description}
              onChange={(value) => {
                console.log('TipTap description changed:', value);
                setFormData(prev => ({ ...prev, description: value }));
              }}
              placeholder="Describe the assignment requirements, objectives, and expectations..."
              className="min-h-[200px]"
            />
          </div>
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          
          {/* Fallback textarea for debugging */}
          <details className="mt-2">
            <summary className="text-xs text-gray-500 cursor-pointer">Debug: Show raw textarea</summary>
            <textarea
              id="description-fallback"
              value={formData.description}
              onChange={(e) => {
                console.log('Fallback textarea changed:', e.target.value);
                setFormData(prev => ({ ...prev, description: e.target.value }));
              }}
              placeholder="Describe the assignment requirements, objectives, and expectations..."
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[200px]"
            />
          </details>
        </div>

        {/* Instructional Video Section */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
            <span className="mr-2">🎬</span>
            Instructional Video (Optional)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Add a video explaining the assignment requirements to help students understand expectations
          </p>

          <div className="space-y-4">
            {/* Video Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, instructionalVideoType: 'none', instructionalVideoUrl: '', instructionalVideoFile: null }))}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.instructionalVideoType === 'none'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  No Video
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, instructionalVideoType: 'youtube', instructionalVideoFile: null }))}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.instructionalVideoType === 'youtube'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  🔗 Video URL
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, instructionalVideoType: 'upload', instructionalVideoUrl: '' }))}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.instructionalVideoType === 'upload'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  📤 Upload
                </button>
              </div>
            </div>

            {/* Video URL Input (YouTube & Google Drive) */}
            {formData.instructionalVideoType === 'youtube' && (
              <div>
                <label htmlFor="instructionalVideoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Video URL (YouTube or Google Drive) *
                </label>
                <input
                  type="url"
                  id="instructionalVideoUrl"
                  value={formData.instructionalVideoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructionalVideoUrl: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=... or https://drive.google.com/file/d/..."
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.instructionalVideoUrl ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.instructionalVideoUrl && (
                  <p className="mt-1 text-sm text-red-600">{errors.instructionalVideoUrl}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Paste a YouTube URL or Google Drive share link for your instructional video
                </p>
              </div>
            )}

            {/* Video Upload */}
            {formData.instructionalVideoType === 'upload' && (
              <div>
                <label htmlFor="instructionalVideoFile" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Video *
                </label>
                <input
                  type="file"
                  id="instructionalVideoFile"
                  accept="video/mp4,video/webm,video/mov"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData(prev => ({ ...prev, instructionalVideoFile: file }));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 ${
                    errors.instructionalVideoFile ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.instructionalVideoFile && (
                  <p className="mt-1 text-sm text-red-600">{errors.instructionalVideoFile}</p>
                )}
                {formData.instructionalVideoFile && (
                  <p className="mt-2 text-sm text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {formData.instructionalVideoFile.name} ({(formData.instructionalVideoFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Supported formats: MP4, WebM, MOV (max 2GB)
                </p>
              </div>
            )}

            {/* Preview */}
            {formData.instructionalVideoType !== 'none' && (formData.instructionalVideoUrl || formData.instructionalVideoFile) && (
              <div className="bg-white border border-purple-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Students Will See
                </h4>
                <p className="text-xs text-purple-700">
                  ✓ Instructional video will appear at the top of the assignment page
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Students can watch your explanation before starting their work
                </p>
              </div>
            )}
          </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Assignment Color
              </label>
              <div className="grid grid-cols-5 gap-3">
                {CLASS_COLORS.map((colorOption) => (
                  <button
                    key={colorOption.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: colorOption.value }))}
                    className={`relative w-full h-12 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                      formData.color === colorOption.value
                        ? 'border-gray-900 ring-2 ring-gray-300'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: colorOption.value }}
                    title={colorOption.description}
                  >
                    {formData.color === colorOption.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Choose a sophisticated color that represents your assignment
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
              onChange={(date) => setFormData(prev => ({ ...prev, dueDate: date instanceof Date ? date : null }))}
              showTimeSelect
              timeFormat="h:mm aa"
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

        {/* Assignment Resources */}
        <div>
          <AssignmentResourcesManager
            resources={formData.resources}
            onResourcesChange={(resources) => setFormData(prev => ({ ...prev, resources }))}
          />
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
                <option value={250 * 1024 * 1024}>250 MB</option>
                <option value={500 * 1024 * 1024}>500 MB</option>
                <option value={1024 * 1024 * 1024}>1 GB</option>
                <option value={2048 * 1024 * 1024}>2 GB</option>
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

            {/* YouTube URL Option */}
            <div className="border-t border-blue-200 pt-4 mt-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="allowYouTubeUrl"
                  checked={formData.allowYouTubeUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, allowYouTubeUrl: e.target.checked }))}
                  disabled={formData.requireLiveRecording}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                <div className="flex-1">
                  <label htmlFor="allowYouTubeUrl" className="text-sm font-medium text-gray-700">
                    Allow External Video Links (YouTube & Google Drive)
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Students can submit video links from YouTube or Google Drive instead of uploading files. Useful for large videos that exceed file size limits.
                  </p>
                </div>
              </div>
              
              {formData.allowYouTubeUrl && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="text-blue-400">ℹ️</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">External Video Link Guidelines</h4>
                      <div className="mt-1 text-sm text-blue-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li><strong>YouTube:</strong> Videos should be unlisted or public (not private)</li>
                          <li><strong>Google Drive:</strong> Files must be shared with "Anyone with the link can view"</li>
                          <li>Ideal for videos larger than {Math.round(formData.maxFileSize / (1024 * 1024))}MB</li>
                          <li>Students can still choose to record/upload directly if preferred</li>
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
                  onChange={(date) => setFormData(prev => ({ ...prev, responseDueDate: date instanceof Date ? date : null }))}
                  showTimeSelect
                  timeFormat="h:mm aa"
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
                  Hide peer videos until students post their own video
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
                    <h4 className="text-sm font-medium text-blue-800">Student Submission Required</h4>
                    <p className="mt-1 text-sm text-blue-700">
                      Students will not be able to see peer videos until they submit their own video first. 
                      This ensures students complete their work before viewing their peers' submissions.
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <div className="text-sm text-gray-600">Grade without criteria</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, rubricType: 'custom' }))}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    formData.rubricType === 'custom'
                      ? 'border-purple-500 bg-purple-100'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-2">✏️</div>
                  <div className="font-medium">Create Custom</div>
                  <div className="text-sm text-gray-600">Build your own rubric</div>
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
                  <div className="text-sm text-gray-600">Let AI create criteria</div>
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
                  <div className="font-medium">Upload File</div>
                  <div className="text-sm text-gray-600">Upload rubric PDF</div>
                </button>
              </div>
            </div>

            {/* Custom Rubric Section */}
            {formData.rubricType === 'custom' && (
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Create Your Rubric</h4>
                  <p className="text-sm text-gray-600">
                    Add categories with points and descriptions for your grading rubric
                  </p>
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
                      <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-5">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Category Name *
                              </label>
                              <input
                                type="text"
                                value={category.name}
                                onChange={(e) => updateRubricCategory(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                                placeholder="e.g., Content Quality"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Points *
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
                            <div className="col-span-4">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Description
                              </label>
                              <input
                                type="text"
                                value={category.description}
                                onChange={(e) => updateRubricCategory(index, 'description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                                placeholder="Brief description"
                              />
                            </div>
                            <div className="col-span-1">
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
                            ⚠️ Points don't match max score
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

            {/* AI Generated Rubric Section - Simplified */}
            {formData.rubricType === 'ai_generated' && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">🤖 AI-Powered Rubric Generator</h4>
                  <p className="text-sm text-gray-600">
                    Provide category names and points. AI will generate detailed descriptions and grading levels.
                  </p>
                </div>

                {/* Simplified Categories Input - Only name and points */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Define Categories (AI will add descriptions)
                    </label>
                    <button
                      type="button"
                      onClick={addRubricCategory}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      + Add Category
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.customRubricCategories.map((category, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={category.name}
                            onChange={(e) => updateRubricCategory(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                            placeholder="e.g., Content Quality, Presentation, Creativity"
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            value={category.points}
                            onChange={(e) => updateRubricCategory(index, 'points', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm text-center"
                            min="1"
                            step="1"
                            placeholder="pts"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRubricCategory(index)}
                          disabled={formData.customRubricCategories.length <= 1}
                          className="px-3 py-2 text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                          title="Remove category"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-blue-600 mr-2">ℹ️</span>
                        <div className="text-sm text-blue-800">
                          <strong>Total Points:</strong> {formData.customRubricCategories.reduce((sum, cat) => sum + cat.points, 0)} / {formData.maxScore}
                          {formData.customRubricCategories.reduce((sum, cat) => sum + cat.points, 0) !== formData.maxScore && (
                            <span className="text-red-600 ml-2">
                              ⚠️ Mismatch
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={generateAIRubric}
                        disabled={isGeneratingRubric || !formData.title.trim() || !formData.description.trim() || formData.customRubricCategories.some(cat => !cat.name.trim() || cat.points <= 0)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        {isGeneratingRubric ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <span>🤖</span>
                            <span>Generate Descriptions</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {formData.aiGeneratedRubric && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">✨ AI-Generated Rubric Preview</span>
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowRubricPreview(!showRubricPreview)}
                          className="text-sm text-purple-600 hover:text-purple-800"
                        >
                          {showRubricPreview ? 'Hide' : 'Show Preview'}
                        </button>
                        <button
                          type="button"
                          onClick={removeRubric}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Regenerate
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
                                    <div key={levelIndex} className="text-center p-2 bg-gray-50 rounded">
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
                  <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <span className="text-purple-600 text-xl">💡</span>
                      <div className="text-sm text-purple-800">
                        <strong>How it works:</strong> Add your category names and point values above, 
                        then click "Generate Descriptions" and AI will create detailed grading criteria and performance levels for each category.
                      </div>
                    </div>
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
            {isLoading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Assignment')}
          </button>
        </div>
      </form>

      {/* AI Subscription Modal */}
      {showSubscriptionModal && subscriptionData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold">🤖 AI Features</h3>
                <button
                  onClick={() => setShowSubscriptionModal(false)}
                  className="text-white/80 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <p className="text-white/90">{subscriptionData.feature}</p>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-700 text-lg mb-4">
                  {subscriptionData.message}
                </p>
                
                {subscriptionData.benefits && subscriptionData.benefits.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-900 mb-2">With AI Subscription:</p>
                    {subscriptionData.benefits.map((benefit: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 text-xl">💡</span>
                  <div className="text-sm text-blue-800">
                    <strong>Coming Soon!</strong> AI-powered features will be available with a ClassCast AI subscription. 
                    Contact your administrator or check our pricing page for more information.
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSubscriptionModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Continue Without AI
                </button>
                <button
                  onClick={() => {
                    setShowSubscriptionModal(false);
                    window.open('/pricing', '_blank');
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentCreationForm;
