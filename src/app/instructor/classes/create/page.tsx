'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

interface ClassFormData {
  title: string;
  description: string;
  classCode: string;
  backgroundColor: string;
  department: string;
  semester: string;
  year: string;
  credits: number;
  maxStudents: number;
  schedule: string;
  prerequisites: string;
  learningObjectives: string;
  gradingPolicy: string;
  startDate: string;
  endDate: string;
  createAssignment: boolean;
  assignmentTitle?: string;
  assignmentDescription?: string;
  assignmentPoints?: number;
  assignmentDueDate?: string;
  assignmentType?: 'video' | 'file' | 'text';
}

const CreateClassPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [formData, setFormData] = useState<ClassFormData>({
    title: '',
    description: '',
    classCode: '',
    backgroundColor: 'indigo-600',
    department: '',
    semester: 'Spring',
    year: new Date().getFullYear().toString(),
    credits: 3,
    maxStudents: 30,
    schedule: '',
    prerequisites: '',
    learningObjectives: '',
    gradingPolicy: '',
    startDate: '',
    endDate: '',
    createAssignment: false,
    assignmentTitle: '',
    assignmentDescription: '',
    assignmentPoints: 100,
    assignmentDueDate: '',
    assignmentType: 'video'
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
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar characters
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, classCode: result }));
  };

  const handleInputChange = (field: keyof ClassFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Class created:', formData);
      alert('Class created successfully!');
      router.push('/instructor/dashboard');
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Failed to create class. Please try again.');
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="e.g., Introduction to Computer Science"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Code *
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={formData.classCode}
                      onChange={(e) => handleInputChange('classCode', e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      placeholder="e.g., CS101"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateClassCode}
                      disabled={isGeneratingCode}
                      className="ml-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isGeneratingCode ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <span>Generate</span>
                      )}
                    </button>
                  </div>
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
                    Credits
                  </label>
                  <input
                    type="number"
                    value={formData.credits}
                    onChange={(e) => handleInputChange('credits', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    min="1"
                    max="6"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    min="1"
                    max="500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule
                  </label>
                  <input
                    type="text"
                    value={formData.schedule}
                    onChange={(e) => handleInputChange('schedule', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="e.g., Mon/Wed/Fri 10:00-11:00 AM"
                  />
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
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assignment Title *
                      </label>
                      <input
                        type="text"
                        value={formData.assignmentTitle || ''}
                        onChange={(e) => handleInputChange('assignmentTitle', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                        placeholder="e.g., Introduction Video"
                        required={formData.createAssignment}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assignment Type
                      </label>
                      <select
                        value={formData.assignmentType}
                        onChange={(e) => handleInputChange('assignmentType', e.target.value as 'video' | 'file' | 'text')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      >
                        <option value="video">Video Assignment</option>
                        <option value="file">File Upload</option>
                        <option value="text">Text Submission</option>
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                        min="1"
                        max="1000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.assignmentDueDate || ''}
                        onChange={(e) => handleInputChange('assignmentDueDate', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                        required={formData.createAssignment}
                      />
                    </div>
                  </div>

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
