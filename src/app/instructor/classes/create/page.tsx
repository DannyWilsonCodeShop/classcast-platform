'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

interface ClassFormData {
  title: string;
  description: string;
  department: string;
  semester: string;
  year: string;
  maxStudents: number;
}

const CreateClassPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ClassFormData>({
    title: '',
    description: '',
    department: '',
    semester: 'Fall+Spring',
    year: new Date().getFullYear().toString(),
    maxStudents: 30,
  });

  const generateClassCode = (title: string) => {
    const courseCode = (title || 'COURSE')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3);
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    return `${courseCode}${randomNum}`;
  };

  const handleInputChange = (field: keyof ClassFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.trim().length === 0) {
      newErrors.title = 'Course title is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const classCode = generateClassCode(formData.title);

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          code: classCode,
          classCode: classCode,
          department: formData.department,
          credits: 3,
          semester: formData.semester,
          year: parseInt(formData.year),
          instructorId: user?.id,
          maxStudents: formData.maxStudents,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          prerequisites: [],
          learningObjectives: [],
          gradingPolicy: { assignments: 60, exams: 30, participation: 10, final: 0 },
          schedule: { days: ['Monday', 'Wednesday', 'Friday'], time: 'TBD', location: 'TBD' },
          resources: { textbooks: [], materials: [] },
          settings: {
            allowLateSubmissions: true,
            latePenalty: 10,
            allowResubmissions: false,
            enableDiscussions: true,
            enableAnnouncements: true,
            privacy: 'private'
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Auto-create a default section with the class code
        try {
          await fetch('/api/sections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courseId: result.data.courseId,
              sectionName: 'Section 1',
              classCode: classCode,
              maxEnrollment: formData.maxStudents,
              instructorId: user?.id
            })
          });
        } catch (sectionError) {
          console.error('Error creating default section:', sectionError);
        }

        router.push('/instructor/dashboard');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create course');
      }
    } catch (error) {
      console.error('Error creating class:', error);
      setErrors({ general: error instanceof Error ? error.message : 'Failed to create class' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <InstructorRoute>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
        <div className="bg-white w-full max-w-[420px] rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-[#005587]">Create New Course</h2>
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Course Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587] ${
                  errors.title ? 'border-red-400' : 'border-gray-200'
                }`}
                placeholder="e.g., Introduction to Computer Science"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">{errors.title}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                placeholder="e.g., Computer Science"
              />
            </div>

            {/* Semester + Year row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Semester
                </label>
                <select
                  value={formData.semester}
                  onChange={(e) => handleInputChange('semester', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                >
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                  <option value="Fall">Fall</option>
                  <option value="Fall+Spring">Full Year</option>
                  <option value="Winter">Winter</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                  min="2020"
                  max="2030"
                />
              </div>
            </div>

            {/* Max Students */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Max Students
              </label>
              <input
                type="number"
                value={formData.maxStudents}
                onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                min="1"
                max="500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587] resize-none"
                placeholder="Brief description of your course..."
              />
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
              <span className="text-sm">💡</span>
              <p className="text-xs text-gray-500">
                A class code will be auto-generated for students to join. You can add more sections later from your course settings.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-[#005587] text-white rounded-xl text-sm font-bold hover:bg-[#004470] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default CreateClassPage;
