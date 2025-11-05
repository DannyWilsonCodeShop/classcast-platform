'use client';

import React, { useState, useEffect } from 'react';
import { Course, CreateCourseData, UpdateCourseData } from '@/types/course';
import { SEMESTER_OPTIONS } from '@/constants/semesters';
import { useAuth } from '@/contexts/AuthContext';

interface CourseFormProps {
  course: Course | null;
  onSubmit: (data: CreateCourseData | UpdateCourseData) => Promise<{ success: boolean; message: string }>;
  onCancel: () => void;
}

export const CourseForm: React.FC<CourseFormProps> = ({
  course,
  onSubmit,
  onCancel,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateCourseData>({
    title: '',
    description: '',
    code: '',
    classCode: '',
    department: '',
    credits: 3,
    semester: 'Fall+Spring',
    year: new Date().getFullYear(),
    backgroundColor: '#4A90E2',
    startDate: '',
    endDate: '',
    maxStudents: 30,
    prerequisites: [],
    learningObjectives: [''],
    coInstructorEmail: '',
    coInstructorName: '',
    gradingPolicy: {
      assignments: 40,
      quizzes: 20,
      exams: 30,
      participation: 5,
      final: 5,
    },
    schedule: {
      days: ['Monday', 'Wednesday', 'Friday'],
      time: '10:00 AM - 11:00 AM',
      location: 'TBD',
    },
    resources: {
      textbooks: [],
      materials: [],
    },
    settings: {
      allowLateSubmissions: true,
      latePenalty: 10,
      allowResubmissions: false,
      requireAttendance: false,
      enableDiscussions: true,
      enableAnnouncements: true,
      privacy: 'public' as const,
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate course code and class code when title changes
  useEffect(() => {
    if (formData.title && !course) {
      const courseCode = formData.title
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 3);
      
      // Generate course code
      const courseCodeNum = Math.floor(Math.random() * 90) + 10;
      const generatedCourseCode = `${courseCode}${courseCodeNum}`;
      
      // Generate class code
      const classCodeNum = Math.floor(Math.random() * 9000) + 1000;
      const generatedClassCode = `${courseCode}${classCodeNum}`;
      
      setFormData(prev => ({ 
        ...prev, 
        code: generatedCourseCode,
        classCode: generatedClassCode
      }));
    }
  }, [formData.title, course]);

  // Initialize form with course data if editing
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        description: course.description,
        code: course.code,
        classCode: course.classCode || '',
        department: course.department,
        credits: course.credits,
        semester: course.semester,
        year: course.year,
        backgroundColor: course.backgroundColor || '#4A90E2',
        startDate: course.startDate.split('T')[0],
        endDate: course.endDate.split('T')[0],
        maxStudents: course.maxStudents,
        prerequisites: course.prerequisites || [],
        learningObjectives: course.learningObjectives?.length > 0 ? course.learningObjectives : [''],
        coInstructorEmail: course.coInstructorEmail || '',
        coInstructorName: course.coInstructorName || '',
        gradingPolicy: course.gradingPolicy,
        schedule: course.schedule,
        resources: course.resources,
        settings: course.settings,
      });
    }
  }, [course]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedInputChange = (parent: keyof CreateCourseData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value,
      },
    }));
  };

  const handleArrayChange = (field: 'learningObjectives' | 'prerequisites', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).map((item: string, i: number) => 
        i === index ? value : item
      ),
    }));
  };

  const addArrayItem = (field: 'learningObjectives' | 'prerequisites') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), ''],
    }));
  };

  const removeArrayItem = (field: 'learningObjectives' | 'prerequisites', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_: string, i: number) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Filter out empty learning objectives and add instructor ID
      const filteredData = {
        ...formData,
        instructorId: user?.id,
        learningObjectives: formData.learningObjectives?.filter(obj => obj.trim() !== '') || [],
      };

      const result = await onSubmit(filteredData);
      
      if (result.success) {
        onCancel();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {course ? 'Edit Course' : 'Create New Course'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Code * 
                <span className="text-xs text-gray-500 ml-1">(Auto-generated)</span>
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-gray-800">
                {formData.code || 'Generating...'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Code (for students to join) *
                <span className="text-xs text-gray-500 ml-1">(Auto-generated)</span>
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-gray-800">
                  {formData.classCode || 'Generating...'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const courseCode = (formData.title || 'COURSE')
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase())
                      .join('')
                      .substring(0, 3);
                    
                    // Regenerate course code
                    const courseCodeNum = Math.floor(Math.random() * 90) + 10;
                    const generatedCourseCode = `${courseCode}${courseCodeNum}`;
                    handleInputChange('code', generatedCourseCode);
                    
                    // Regenerate class code
                    const randomNum = Math.floor(Math.random() * 9000) + 1000;
                    const generatedClassCode = `${courseCode}${randomNum}`;
                    handleInputChange('classCode', generatedClassCode);
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  🔄 Regenerate
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Students will use this code to join your class
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credits *
              </label>
              <input
                type="number"
                value={formData.credits}
                onChange={(e) => handleInputChange('credits', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="6"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester *
              </label>
              <select
                value={formData.semester}
                onChange={(e) => handleInputChange('semester', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
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
                Year *
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="2020"
                max="2030"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Course Color Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Course Color Theme
            </label>
            <div className="grid grid-cols-6 gap-3">
              {[
                { name: 'Sky Blue', value: '#4A90E2' },
                { name: 'Coral', value: '#FF6F61' },
                { name: 'Golden Yellow', value: '#FFD166' },
                { name: 'Mint Green', value: '#06D6A0' },
                { name: 'Lavender', value: '#9B5DE5' },
                { name: 'Charcoal', value: '#333333' }
              ].map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleInputChange('backgroundColor', color.value)}
                  className={`w-12 h-12 rounded-lg border-2 transition-all duration-200 ${
                    formData.backgroundColor === color.value
                      ? 'border-gray-800 scale-110 shadow-lg'
                      : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Choose a color theme for your course. This will help students easily identify your class.
            </p>
          </div>

          {/* Co-Instructor (Optional) */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Add Co-Instructor (Optional)
              </label>
              <button
                type="button"
                onClick={() => {
                  if (formData.coInstructorEmail) {
                    // Clear co-instructor data
                    handleInputChange('coInstructorEmail', '');
                    handleInputChange('coInstructorName', '');
                  }
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {formData.coInstructorEmail ? 'Remove Co-Instructor' : ''}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Co-Instructor Name
                </label>
                <input
                  type="text"
                  value={formData.coInstructorName || ''}
                  onChange={(e) => handleInputChange('coInstructorName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Dr. Jane Smith"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Co-Instructor Email
                </label>
                <input
                  type="email"
                  value={formData.coInstructorEmail || ''}
                  onChange={(e) => handleInputChange('coInstructorEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="jane.smith@school.edu"
                />
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mt-2">
              Add a co-instructor who will have the same permissions to manage this course.
            </p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Learning Objectives */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Learning Objectives
            </label>
            {formData.learningObjectives.map((objective, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => handleArrayChange('learningObjectives', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter learning objective"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('learningObjectives', index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('learningObjectives')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add Learning Objective
            </button>
          </div>

          {/* Grading Policy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grading Policy (percentages must total 100%)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(formData.gradingPolicy).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-xs text-gray-600 mb-1 capitalize">
                    {key}
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleNestedInputChange('gradingPolicy', key, parseInt(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days
              </label>
              <div className="space-y-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <label key={day} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.schedule?.days.includes(day) || false}
                      onChange={(e) => {
                        const currentDays = formData.schedule?.days || [];
                        const newDays = e.target.checked
                          ? [...currentDays, day]
                          : currentDays.filter(d => d !== day);
                        handleNestedInputChange('schedule', 'days', newDays);
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time
              </label>
              <input
                type="text"
                value={formData.schedule?.time || ''}
                onChange={(e) => handleNestedInputChange('schedule', 'time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 10:00 AM - 11:00 AM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.schedule?.location || ''}
                onChange={(e) => handleNestedInputChange('schedule', 'location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Room 101, Online"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#003366] text-white rounded-md hover:bg-[#003366]/90 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (course ? 'Update Course' : 'Create Course')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
