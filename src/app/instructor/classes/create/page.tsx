'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

interface ClassFormData {
  title: string;
  description: string;
  classCode: string;
  courseInitials: string;
  backgroundColor: string;
  department: string;
  semester: string;
  year: string;
  maxStudents: number;
  privacy: 'public' | 'private';
  prerequisites: string;
  learningObjectives: string;
  gradingPolicy: string;
  startDate: string;
  endDate: string;
  coInstructorEmail: string; // NEW: Co-instructor email
  coInstructorName?: string; // NEW: Co-instructor name (fetched)
  coInstructorId?: string; // NEW: Co-instructor ID (fetched)
  createAssignment: boolean;
  assignmentTitle?: string;
  assignmentDescription?: string;
  assignmentPoints?: number;
  assignmentDueDate?: string;
  assignmentType?: 'video' | 'file' | 'text' | 'quiz';
  // Advanced assignment features
  assignmentRequirements?: string[];
  allowLateSubmission?: boolean;
  latePenalty?: number;
  maxSubmissions?: number;
  groupAssignment?: boolean;
  maxGroupSize?: number;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  enablePeerResponses?: boolean;
  responseDueDate?: string;
  minResponsesRequired?: number;
  maxResponsesPerVideo?: number;
  responseWordLimit?: number;
  responseCharacterLimit?: number;
  hidePeerVideosUntilInstructorPosts?: boolean;
  assignmentEmoji?: string;
  assignmentColor?: string;
  requireLiveRecording?: boolean;
  rubricType?: 'none' | 'upload' | 'ai_generated';
}

const CreateClassPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [newRequirement, setNewRequirement] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sections, setSections] = useState<Array<{id: string, name: string, code?: string, classCode?: string, maxEnrollment?: number}>>([]);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [newSection, setNewSection] = useState({name: '', code: '', maxEnrollment: 30});
  const [previewClassCode, setPreviewClassCode] = useState('');
  const [coInstructorSearchResults, setCoInstructorSearchResults] = useState<Array<{id: string, name: string, email: string}>>([]);
  const [isSearchingCoInstructor, setIsSearchingCoInstructor] = useState(false);
  const [showCoInstructorResults, setShowCoInstructorResults] = useState(false);
  const [formData, setFormData] = useState<ClassFormData>({
    title: '',
    description: '',
    classCode: '',
    courseInitials: '',
    backgroundColor: 'indigo-600',
    department: '',
    semester: 'Fall+Spring',
    year: new Date().getFullYear().toString(),
    maxStudents: 30,
    privacy: 'public',
    prerequisites: '',
    learningObjectives: '',
    gradingPolicy: '',
    startDate: '',
    endDate: '',
    coInstructorEmail: '', // NEW: Initialize co-instructor fields
    coInstructorName: undefined,
    coInstructorId: undefined,
    createAssignment: false,
    assignmentTitle: '',
    assignmentDescription: '',
    assignmentPoints: 100,
    assignmentDueDate: '',
    assignmentType: 'video',
    // Advanced assignment features
    assignmentRequirements: [''],
    allowLateSubmission: false,
    latePenalty: 10,
    maxSubmissions: 1,
    groupAssignment: false,
    maxGroupSize: 2,
    allowedFileTypes: ['mp4', 'webm', 'mov', 'avi'],
    maxFileSize: 500 * 1024 * 1024, // 500MB
    enablePeerResponses: false,
    responseDueDate: '',
    minResponsesRequired: 2,
    maxResponsesPerVideo: 3,
    responseWordLimit: 50,
    responseCharacterLimit: 500,
    hidePeerVideosUntilInstructorPosts: false,
    assignmentEmoji: '🎥',
    assignmentColor: '#4c51bf',
    requireLiveRecording: false,
    rubricType: 'none'
  });

  const colorOptions = [
    { value: '#2d3142', label: 'Navy', preview: 'bg-slate-800' },
    { value: '#4a5568', label: 'Charcoal', preview: 'bg-gray-600' },
    { value: '#4c51bf', label: 'Indigo', preview: 'bg-indigo-600' },
    { value: '#475569', label: 'Slate', preview: 'bg-slate-600' },
    { value: '#059669', label: 'Emerald', preview: 'bg-emerald-600' },
    { value: '#0d9488', label: 'Teal', preview: 'bg-teal-600' },
    { value: '#d97706', label: 'Amber', preview: 'bg-amber-600' },
    { value: '#e11d48', label: 'Rose', preview: 'bg-rose-600' },
    { value: '#7c3aed', label: 'Violet', preview: 'bg-violet-600' },
    { value: '#78716c', label: 'Stone', preview: 'bg-stone-600' }
  ];

  const generateClassCode = async () => {
    setIsGeneratingCode(true);
    try {
      const response = await fetch('/api/classes/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          existingCodes: [], // In a real app, you'd fetch existing codes
          options: {
            length: 6,
            includeLetters: true,
            includeNumbers: true,
            excludeSimilar: true
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFormData(prev => ({ ...prev, classCode: data.code }));
        } else {
          // Fallback to local generation
          generateLocalClassCode();
        }
      } else {
        // Fallback to local generation
        generateLocalClassCode();
      }
    } catch (error) {
      console.error('Error generating class code:', error);
      // Fallback to local generation
      generateLocalClassCode();
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const generateLocalClassCode = () => {
    // Try to create a meaningful code based on course title and department
    let result = '';
    
    if (formData.title && formData.department) {
      // Extract meaningful parts from title and department
      const deptCode = formData.department.substring(0, 3).toUpperCase();
      const titleWords = formData.title.split(' ').filter(word => word.length > 2);
      const courseNum = Math.floor(Math.random() * 900) + 100; // 100-999
      
      if (deptCode.length >= 2) {
        result = `${deptCode}${courseNum}`;
      } else {
        result = `${deptCode}${courseNum}`.padEnd(6, 'X');
      }
    } else {
      // Fallback to random generation
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar characters
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    
    setFormData(prev => ({ ...prev, classCode: result }));
  };

  // Auto-generate class code on page load
  useEffect(() => {
    if (!formData.classCode) {
      generateLocalClassCode();
    }
  }, []);

  const handleInputChange = (field: keyof ClassFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-regenerate class code when title or department changes
    if ((field === 'title' || field === 'department') && value && typeof value === 'string') {
      // Small delay to avoid too many regenerations
      setTimeout(() => {
        generateLocalClassCode();
      }, 500);
    }
  };

  // Assignment requirement management
  const addRequirement = () => {
    if (newRequirement.trim() && !formData.assignmentRequirements?.includes(newRequirement.trim())) {
      setFormData(prev => ({
        ...prev,
        assignmentRequirements: [...(prev.assignmentRequirements || []), newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      assignmentRequirements: prev.assignmentRequirements?.filter((_, i) => i !== index) || []
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      assignmentRequirements: prev.assignmentRequirements?.map((req, i) => i === index ? value : req) || []
    }));
  };

  // File type management
  const addFileType = (fileType: string) => {
    if (fileType.trim() && !formData.allowedFileTypes?.includes(fileType.trim())) {
      setFormData(prev => ({
        ...prev,
        allowedFileTypes: [...(prev.allowedFileTypes || []), fileType.trim()]
      }));
    }
  };

  const removeFileType = (fileType: string) => {
    setFormData(prev => ({
      ...prev,
      allowedFileTypes: prev.allowedFileTypes?.filter(type => type !== fileType) || []
    }));
  };

  // Co-instructor search functionality
  const searchCoInstructor = async (email: string) => {
    if (!email || email.length < 3) {
      setCoInstructorSearchResults([]);
      setShowCoInstructorResults(false);
      return;
    }

    setIsSearchingCoInstructor(true);
    try {
      const response = await fetch(`/api/users/search?email=${encodeURIComponent(email)}&role=instructor`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCoInstructorSearchResults(data.users || []);
        setShowCoInstructorResults(true);
      } else {
        console.error('Failed to search for co-instructor');
        setCoInstructorSearchResults([]);
        setShowCoInstructorResults(false);
      }
    } catch (error) {
      console.error('Error searching for co-instructor:', error);
      setCoInstructorSearchResults([]);
      setShowCoInstructorResults(false);
    } finally {
      setIsSearchingCoInstructor(false);
    }
  };

  const selectCoInstructor = (instructor: {id: string, name: string, email: string}) => {
    setFormData(prev => ({
      ...prev,
      coInstructorEmail: instructor.email,
      coInstructorName: instructor.name,
      coInstructorId: instructor.id
    }));
    setShowCoInstructorResults(false);
    setCoInstructorSearchResults([]);
  };

  const clearCoInstructor = () => {
    setFormData(prev => ({
      ...prev,
      coInstructorEmail: '',
      coInstructorName: undefined,
      coInstructorId: undefined
    }));
    setShowCoInstructorResults(false);
    setCoInstructorSearchResults([]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Generate class code for sections using the API
  const generateSectionClassCode = async (sectionName: string, sectionIndex: number) => {
    try {
      const response = await fetch('/api/classes/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          existingCodes: sections.map(s => s.classCode).filter(Boolean),
          options: {
            length: 6,
            includeLetters: true,
            includeNumbers: true,
            excludeSimilar: true
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.code;
        }
      }
    } catch (error) {
      console.error('Error generating class code:', error);
    }
    
    // Fallback to simple generation if API fails
    const courseCode = (formData.title || 'COURSE')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3);
    
    if (sections.length > 0 || sectionIndex > 0) {
      // Generate unique class code for each section
      const sectionCode = sectionName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2);
      const randomNum = Math.floor(Math.random() * 900) + 100;
      return `${courseCode}${sectionCode}${randomNum}`;
    } else {
      // Single class code for first section
      const randomNum = Math.floor(Math.random() * 9000) + 1000;
      return `${courseCode}${randomNum}`;
    }
  };

  // Section management functions
  const addSection = async () => {
    if (newSection.name.trim()) {
      let generatedClassCode = previewClassCode;
      
      if (!generatedClassCode) {
        generatedClassCode = await generateSectionClassCode(newSection.name.trim(), sections.length);
      }
      
      const section = {
        id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newSection.name.trim(),
        code: newSection.code.trim() || undefined,
        classCode: generatedClassCode,
        maxEnrollment: newSection.maxEnrollment || 30
      };
      setSections(prev => [...prev, section]);
      setNewSection({name: '', code: '', maxEnrollment: 30});
      setPreviewClassCode('');
      setShowSectionForm(false);
    }
  };

  const removeSection = (id: string) => {
    setSections(prev => prev.filter(section => section.id !== id));
  };

  const updateSection = (id: string, updates: Partial<{name: string, code: string, classCode: string, maxEnrollment: number}>) => {
    setSections(prev => prev.map(section => 
      section.id === id ? { ...section, ...updates } : section
    ));
  };

  const regenerateSectionClassCode = async (id: string) => {
    const newClassCode = await generateSectionClassCode(
      sections.find(s => s.id === id)?.name || '', 
      sections.findIndex(s => s.id === id)
    );
    setSections(prev => prev.map(section => 
      section.id === id ? { ...section, classCode: newClassCode } : section
    ));
  };

  const generatePreviewClassCode = async () => {
    if (newSection.name.trim()) {
      const previewCode = await generateSectionClassCode(newSection.name.trim(), sections.length);
      setPreviewClassCode(previewCode);
    }
  };

  // Generate preview class code when section name changes
  React.useEffect(() => {
    if (newSection.name.trim()) {
      generatePreviewClassCode();
    } else {
      setPreviewClassCode('');
    }
  }, [newSection.name, sections.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Frontend validation
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.trim().length === 0) {
      newErrors.title = 'Course title is required';
    }

    if (!formData.classCode || formData.classCode.trim().length === 0) {
      newErrors.classCode = 'Class code is required';
    }


    if (formData.maxStudents && (formData.maxStudents < 1 || formData.maxStudents > 500)) {
      newErrors.maxStudents = 'Max students must be between 1 and 500';
    }

    if (formData.year && (parseInt(formData.year) < 2020 || parseInt(formData.year) > 2030)) {
      newErrors.year = 'Year must be between 2020 and 2030';
    }

    if (formData.createAssignment) {
      if (!formData.assignmentTitle || formData.assignmentTitle.trim().length === 0) {
        newErrors.assignmentTitle = 'Assignment title is required when creating an assignment';
      }

      if (!formData.assignmentDueDate) {
        newErrors.assignmentDueDate = 'Due date is required when creating an assignment';
      }

      if (formData.assignmentPoints && (formData.assignmentPoints < 1 || formData.assignmentPoints > 1000)) {
        newErrors.assignmentPoints = 'Points must be between 1 and 1000';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Call the backend API to create the course
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          code: formData.classCode,
          classCode: formData.classCode,
          courseInitials: formData.courseInitials || formData.classCode.substring(0, 3).toUpperCase(),
          department: formData.department,
          credits: 3, // Default credits
          semester: formData.semester,
          year: parseInt(formData.year),
          instructorId: user?.id,
          maxStudents: formData.maxStudents,
          startDate: formData.startDate || new Date().toISOString(),
          endDate: formData.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
          prerequisites: formData.prerequisites ? [formData.prerequisites] : [],
          learningObjectives: formData.learningObjectives ? [formData.learningObjectives] : [],
          gradingPolicy: {
            assignments: 60,
            exams: 30,
            participation: 10,
            final: 0
          },
          schedule: {
            days: ['Monday', 'Wednesday', 'Friday'],
            time: 'TBD',
            location: 'TBD'
          },
          resources: {
            textbooks: [],
            materials: []
          },
          settings: {
            allowLateSubmissions: true,
            latePenalty: 10,
            allowResubmissions: false,
            enableDiscussions: true,
            enableAnnouncements: true,
            privacy: formData.privacy
          },
          // NEW: Include co-instructor data
          coInstructorId: formData.coInstructorId || undefined,
          coInstructorEmail: formData.coInstructorEmail || undefined,
          coInstructorName: formData.coInstructorName || undefined
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Course created successfully:', result);
        
        // Create sections if any were added
        if (sections.length > 0) {
          try {
            for (const section of sections) {
              const sectionResponse = await fetch('/api/sections', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  courseId: result.data.courseId,
                  sectionName: section.name,
                  sectionCode: section.code,
                  classCode: section.classCode,
                  maxEnrollment: section.maxEnrollment,
                  instructorId: user?.id
                })
              });

              if (sectionResponse.ok) {
                const sectionResult = await sectionResponse.json();
                console.log('Section created successfully:', sectionResult);
              } else {
                console.error('Failed to create section:', await sectionResponse.text());
              }
            }
          } catch (sectionError) {
            console.error('Error creating sections:', sectionError);
            // Don't fail the whole process if section creation fails
          }
        }

        // If assignment creation is enabled, create the assignment too
        if (formData.createAssignment && formData.assignmentTitle) {
          try {
            const assignmentResponse = await fetch('/api/assignments', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: formData.assignmentTitle,
                description: formData.assignmentDescription || '',
                courseId: result.data.courseId,
                instructorId: user?.id,
                assignmentType: formData.assignmentType || 'video',
                maxScore: formData.assignmentPoints || 100,
                weight: 10,
                dueDate: formData.assignmentDueDate,
                startDate: new Date().toISOString(),
                requirements: formData.assignmentRequirements || [],
                allowLateSubmission: formData.allowLateSubmission || false,
                latePenalty: formData.latePenalty || 10,
                maxSubmissions: formData.maxSubmissions || 1,
                groupAssignment: formData.groupAssignment || false,
                maxGroupSize: formData.maxGroupSize || 2,
                allowedFileTypes: formData.allowedFileTypes || ['mp4', 'webm', 'mov'],
                maxFileSize: formData.maxFileSize || 500 * 1024 * 1024,
                individualSubmission: !formData.groupAssignment,
                autoGrade: false,
                peerReview: formData.enablePeerResponses || false,
                status: 'draft'
              }),
            });

            if (assignmentResponse.ok) {
              const assignmentResult = await assignmentResponse.json();
              console.log('Assignment created successfully:', assignmentResult);
            } else {
              console.error('Failed to create assignment:', await assignmentResponse.text());
            }
          } catch (assignmentError) {
            console.error('Error creating assignment:', assignmentError);
            // Don't fail the whole process if assignment creation fails
          }
        }
        
        alert('Class created successfully!');
        router.push('/instructor/dashboard');
      } else {
        const errorData = await response.json();
        console.error('Failed to create course:', errorData);
        const errorMessage = errorData.error || `Failed to create course: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating class:', error);
      alert(`Failed to create class: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <InstructorRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Create New Class</h1>
                <p className="text-gray-600 mt-2">Set up your class and optionally create your first assignment</p>
              </div>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Introduction to Computer Science"
                    required
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Code * 
                    <span className="text-xs text-gray-500 ml-1">(Auto-generated for students to join)</span>
                  </label>
                  <div className="flex">
                    <div className="flex-1 relative">
                      <div className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg bg-gray-50 font-mono text-lg font-semibold text-gray-800">
                        {formData.classCode || 'Generating...'}
                      </div>
                      {formData.classCode && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-green-500 text-sm">✓</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={generateClassCode}
                      disabled={isGeneratingCode}
                      className="ml-2 px-4 py-3 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
                    >
                      {isGeneratingCode ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>New Code</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Students will use this code to join your class. You can edit it if needed.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Initials <span className="text-blue-600">(for mobile navigation)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.courseInitials}
                    onChange={(e) => handleInputChange('courseInitials', e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent uppercase"
                    placeholder="e.g., MAT, ENG, HIS"
                    maxLength={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    3-letter abbreviation for mobile bottom navigation (e.g., "MAT" for MAT250)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="e.g., Computer Science"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => handleInputChange('semester', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  >
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Fall">Fall</option>
                    <option value="Fall+Spring">Fall+Spring (Full Year)</option>
                    <option value="Winter">Winter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    min="2020"
                    max="2030"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Students
                  </label>
                  <input
                    type="number"
                    value={formData.maxStudents}
                    onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent ${
                      errors.maxStudents ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="1"
                    max="500"
                  />
                  {errors.maxStudents && (
                    <p className="mt-1 text-sm text-red-600">{errors.maxStudents}</p>
                  )}
                </div>

              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  placeholder="Describe your class..."
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Color Theme
                </label>
                <div className="flex space-x-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleInputChange('backgroundColor', color.value)}
                      className={`w-12 h-12 rounded-lg border-2 ${
                        formData.backgroundColor === color.value
                          ? 'border-gray-800'
                          : 'border-gray-300'
                      } ${color.preview} hover:scale-110 transition-transform`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Course Privacy Setting */}
              <div className="mt-6">
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
                      checked={formData.privacy === 'public'}
                      onChange={(e) => handleInputChange('privacy', e.target.value as 'public' | 'private')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
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
                      checked={formData.privacy === 'private'}
                      onChange={(e) => handleInputChange('privacy', e.target.value as 'public' | 'private')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
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
                  You can change this setting later in your course settings.
                </p>
              </div>
            </div>

            {/* Co-Instructor Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <span className="mr-2">👥</span>
                Co-Instructor (Optional)
              </h2>
              <p className="text-gray-600 mb-6">
                Add a co-instructor who can help with grading and posting assignments. They'll have access to this class on their dashboard.
              </p>
              
              <div className="space-y-4">
                {/* Co-instructor search */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search by Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.coInstructorEmail}
                      onChange={(e) => {
                        const email = e.target.value;
                        setFormData(prev => ({ ...prev, coInstructorEmail: email }));
                        if (email.length >= 3) {
                          searchCoInstructor(email);
                        } else {
                          setShowCoInstructorResults(false);
                          setCoInstructorSearchResults([]);
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      placeholder="Enter instructor email address..."
                      disabled={!!formData.coInstructorId}
                    />
                    {isSearchingCoInstructor && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {formData.coInstructorId && (
                      <button
                        type="button"
                        onClick={clearCoInstructor}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Search Results Dropdown */}
                  {showCoInstructorResults && coInstructorSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {coInstructorSearchResults.map((instructor) => (
                        <button
                          key={instructor.id}
                          type="button"
                          onClick={() => selectCoInstructor(instructor)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{instructor.name}</div>
                          <div className="text-sm text-gray-600">{instructor.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* No Results Message */}
                  {showCoInstructorResults && coInstructorSearchResults.length === 0 && !isSearchingCoInstructor && formData.coInstructorEmail.length >= 3 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                      <div className="text-center text-gray-500">
                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p className="text-sm">No instructor found with this email address.</p>
                        <p className="text-xs text-gray-400 mt-1">Make sure they have an instructor account.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Co-instructor Display */}
                {formData.coInstructorId && formData.coInstructorName && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-green-800">{formData.coInstructorName}</div>
                          <div className="text-sm text-green-600">{formData.coInstructorEmail}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          ✓ Co-Instructor Added
                        </span>
                        <button
                          type="button"
                          onClick={clearCoInstructor}
                          className="text-green-600 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-green-700">
                      <p>✅ Can view and grade submissions</p>
                      <p>✅ Can create and manage assignments</p>
                      <p>✅ Will see this class on their dashboard</p>
                    </div>
                  </div>
                )}

                {/* Help Text */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Co-instructor permissions:</p>
                      <ul className="space-y-1 text-blue-700">
                        <li>• View all student submissions and grades</li>
                        <li>• Create, edit, and delete assignments</li>
                        <li>• Access class analytics and reports</li>
                        <li>• Cannot delete the class or remove the primary instructor</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Sections */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Course Sections</h2>
              
              <div className="space-y-4">
                {sections.length > 0 ? (
                  <div className="space-y-3">
                    {sections.map((section) => (
                      <div key={section.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-gray-900">{section.name}</h4>
                              {section.code && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {section.code}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Max Enrollment: {section.maxEnrollment}</span>
                              {section.classCode && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-600">Class Code:</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-mono font-semibold">
                                      {section.classCode}
                                    </span>
                                    <button
                                      onClick={() => regenerateSectionClassCode(section.id)}
                                      className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                      title="Generate new class code"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeSection(section.id)}
                            className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                            title="Remove section"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No sections created yet.</p>
                    <p className="text-sm">Add sections to organize your students into different groups.</p>
                  </div>
                )}

                {!showSectionForm ? (
                  <button
                    type="button"
                    onClick={() => setShowSectionForm(true)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add Section</span>
                  </button>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-4">Add New Section</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Section Name *
                        </label>
                        <input
                          type="text"
                          value={newSection.name}
                          onChange={(e) => setNewSection(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="e.g., Section A, Period 1"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Section Code (Optional)
                          </label>
                          <input
                            type="text"
                            value={newSection.code}
                            onChange={(e) => setNewSection(prev => ({ ...prev, code: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="e.g., A, 1, MORNING"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Enrollment
                          </label>
                          <input
                            type="number"
                            value={newSection.maxEnrollment}
                            onChange={(e) => setNewSection(prev => ({ ...prev, maxEnrollment: parseInt(e.target.value) || 30 }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            min="1"
                            max="500"
                          />
                        </div>
                      </div>

                      {/* Generated Class Code Preview */}
                      {previewClassCode && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="block text-sm font-medium text-green-800 mb-1">
                                Generated Class Code
                              </label>
                              <div className="flex items-center space-x-2">
                                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded font-mono font-semibold">
                                  {previewClassCode}
                                </span>
                                <span className="text-xs text-green-600">
                                  Students will use this code to join this section
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={generatePreviewClassCode}
                              className="p-2 text-green-600 hover:text-green-800 transition-colors"
                              title="Generate new class code"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowSectionForm(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => addSection()}
                          disabled={!newSection.name.trim()}
                          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Section
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Assignment Creation */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center mb-6">
                <input
                  type="checkbox"
                  id="createAssignment"
                  checked={formData.createAssignment}
                  onChange={(e) => handleInputChange('createAssignment', e.target.checked)}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-600"
                />
                <label htmlFor="createAssignment" className="ml-3 text-lg font-semibold text-gray-800">
                  Create First Assignment
                </label>
              </div>

              {formData.createAssignment && (
                <div className="space-y-8">
                  {/* Basic Assignment Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assignment Title *
                      </label>
                      <input
                        type="text"
                        value={formData.assignmentTitle || ''}
                        onChange={(e) => handleInputChange('assignmentTitle', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent ${
                          errors.assignmentTitle ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Introduction Video"
                        required={formData.createAssignment}
                      />
                      {errors.assignmentTitle && (
                        <p className="mt-1 text-sm text-red-600">{errors.assignmentTitle}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assignment Type
                      </label>
                      <select
                        value={formData.assignmentType}
                        onChange={(e) => handleInputChange('assignmentType', e.target.value as 'video' | 'file' | 'text' | 'quiz')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      >
                        <option value="video">🎥 Video Assignment</option>
                        <option value="file">📁 File Upload</option>
                        <option value="text">📝 Text Submission</option>
                        <option value="quiz">❓ Quiz</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Points
                      </label>
                      <input
                        type="number"
                        value={formData.assignmentPoints || 100}
                        onChange={(e) => handleInputChange('assignmentPoints', parseInt(e.target.value))}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent ${
                          errors.assignmentPoints ? 'border-red-500' : 'border-gray-300'
                        }`}
                        min="1"
                        max="1000"
                      />
                      {errors.assignmentPoints && (
                        <p className="mt-1 text-sm text-red-600">{errors.assignmentPoints}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.assignmentDueDate || ''}
                        onChange={(e) => handleInputChange('assignmentDueDate', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent ${
                          errors.assignmentDueDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required={formData.createAssignment}
                      />
                      {errors.assignmentDueDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.assignmentDueDate}</p>
                      )}
                    </div>
                  </div>

                  {/* Assignment Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assignment Description
                    </label>
                    <textarea
                      value={formData.assignmentDescription || ''}
                      onChange={(e) => handleInputChange('assignmentDescription', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      placeholder="Describe the assignment requirements..."
                    />
                  </div>

                  {/* Visual Identity */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">🎨</span>
                      Visual Identity
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Emoji Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assignment Emoji
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={formData.assignmentEmoji || '🎥'}
                            onChange={(e) => handleInputChange('assignmentEmoji', e.target.value)}
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
                          {colorOptions.map((colorOption) => (
                            <button
                              key={colorOption.value}
                              type="button"
                              onClick={() => handleInputChange('assignmentColor', colorOption.value)}
                              className={`relative w-full h-12 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                                formData.assignmentColor === colorOption.value
                                  ? 'border-gray-900 ring-2 ring-gray-300'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              style={{ backgroundColor: colorOption.value }}
                              title={colorOption.label}
                            >
                              {formData.assignmentColor === colorOption.value && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assignment Requirements
                    </label>
                    <div className="space-y-2">
                      {formData.assignmentRequirements?.map((requirement, index) => (
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
                          checked={formData.allowLateSubmission || false}
                          onChange={(e) => handleInputChange('allowLateSubmission', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="allowLateSubmission" className="text-sm font-medium text-gray-700">
                          Allow late submissions
                        </label>
                      </div>

                      {formData.allowLateSubmission && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Late Penalty (%)
                          </label>
                          <input
                            type="number"
                            value={formData.latePenalty || 10}
                            onChange={(e) => handleInputChange('latePenalty', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            max="100"
                            step="1"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maximum Submissions
                        </label>
                        <input
                          type="number"
                          value={formData.maxSubmissions || 1}
                          onChange={(e) => handleInputChange('maxSubmissions', parseInt(e.target.value))}
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
                          checked={formData.groupAssignment || false}
                          onChange={(e) => handleInputChange('groupAssignment', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="groupAssignment" className="text-sm font-medium text-gray-700">
                          Group assignment
                        </label>
                      </div>

                      {formData.groupAssignment && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Maximum Group Size
                          </label>
                          <input
                            type="number"
                            value={formData.maxGroupSize || 2}
                            onChange={(e) => handleInputChange('maxGroupSize', parseInt(e.target.value))}
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum File Size
                        </label>
                        <select
                          value={formData.maxFileSize || 500 * 1024 * 1024}
                          onChange={(e) => handleInputChange('maxFileSize', parseInt(e.target.value))}
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
                                  formData.allowedFileTypes?.includes(type)
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
                            {formData.allowedFileTypes?.map((fileType) => (
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
                          checked={formData.enablePeerResponses || false}
                          onChange={(e) => handleInputChange('enablePeerResponses', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="enablePeerResponses" className="ml-2 text-sm font-medium text-gray-700">
                          Enable peer responses for this assignment
                        </label>
                      </div>

                      {/* Response Due Date */}
                      {formData.enablePeerResponses && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Response Due Date
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.responseDueDate || ''}
                            onChange={(e) => handleInputChange('responseDueDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">When peer responses are due (must be after video due date)</p>
                        </div>
                      )}

                      {formData.enablePeerResponses && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Minimum Responses Required */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Minimum Responses Required per Student
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={formData.minResponsesRequired || 2}
                              onChange={(e) => handleInputChange('minResponsesRequired', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">How many peer responses each student must submit</p>
                          </div>

                          {/* Maximum Responses Per Video */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Maximum Responses Per Video
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={formData.maxResponsesPerVideo || 3}
                              onChange={(e) => handleInputChange('maxResponsesPerVideo', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">Limit responses per video to ensure fair distribution</p>
                          </div>

                          {/* Response Word Limit */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Minimum Word Count
                            </label>
                            <input
                              type="number"
                              min="10"
                              max="1000"
                              value={formData.responseWordLimit || 50}
                              onChange={(e) => handleInputChange('responseWordLimit', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">Minimum words required for each response</p>
                          </div>

                          {/* Response Character Limit */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Maximum Character Count
                            </label>
                            <input
                              type="number"
                              min="100"
                              max="5000"
                              value={formData.responseCharacterLimit || 500}
                              onChange={(e) => handleInputChange('responseCharacterLimit', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">Maximum characters allowed per response</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Recording Option */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">🎥</span>
                      Video Recording Settings
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="requireLiveRecording"
                          checked={formData.requireLiveRecording || false}
                          onChange={(e) => handleInputChange('requireLiveRecording', e.target.checked)}
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
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Class'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default CreateClassPage;
