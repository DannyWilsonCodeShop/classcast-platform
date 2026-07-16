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
  gradeLevel: string;
}

interface SectionItem {
  name: string;
  classCode: string;
}

const CreateClassPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [sections, setSections] = useState<SectionItem[]>([
    { name: 'Section 1', classCode: '' }
  ]);
  const [formData, setFormData] = useState<ClassFormData>({
    title: '',
    description: '',
    department: '',
    semester: 'Fall+Spring',
    year: new Date().getFullYear().toString(),
    gradeLevel: '9-12',
  });

  const generateClassCode = (title: string, index: number) => {
    const courseCode = (title || 'COURSE')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3);
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    return `${courseCode}${randomNum}`;
  };

  // Generate codes for sections whenever title changes or sections are added
  useEffect(() => {
    setSections(prev => prev.map((s, i) => ({
      ...s,
      classCode: s.classCode || generateClassCode(formData.title, i)
    })));
  }, []);

  const handleInputChange = (field: keyof ClassFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSectionCountChange = (count: number) => {
    const clamped = Math.max(1, Math.min(10, count));
    setSections(prev => {
      if (clamped > prev.length) {
        // Add new sections
        const newSections = [...prev];
        for (let i = prev.length; i < clamped; i++) {
          newSections.push({
            name: `Section ${i + 1}`,
            classCode: generateClassCode(formData.title, i)
          });
        }
        return newSections;
      } else {
        // Remove sections from the end
        return prev.slice(0, clamped);
      }
    });
  };

  const handleSectionNameChange = (index: number, name: string) => {
    setSections(prev => prev.map((s, i) => i === index ? { ...s, name } : s));
  };

  const regenerateCode = (index: number) => {
    setSections(prev => prev.map((s, i) =>
      i === index ? { ...s, classCode: generateClassCode(formData.title, i) } : s
    ));
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
      // Use the first section's class code as the course-level code
      const courseClassCode = sections[0]?.classCode || generateClassCode(formData.title, 0);

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          code: courseClassCode,
          classCode: courseClassCode,
          department: formData.department,
          credits: 3,
          semester: formData.semester,
          year: parseInt(formData.year),
          gradeLevel: formData.gradeLevel,
          instructorId: user?.id,
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

        // Create all sections
        for (const section of sections) {
          try {
            await fetch('/api/sections', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                courseId: result.data.courseId,
                sectionName: section.name,
                classCode: section.classCode,
                instructorId: user?.id
              })
            });
          } catch (sectionError) {
            console.error('Error creating section:', sectionError);
          }
        }

        // Show success message before redirecting
        setShowSuccess(true);
        setTimeout(() => router.push('/instructor/dashboard'), 3000);
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

          {showSuccess ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Course Created!</h3>
              <p className="text-xs text-gray-500">It may take a moment to appear in your dashboard.</p>
            </div>
          ) : (

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

            {/* Grade Level + Semester row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Grade Level
                </label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) => handleInputChange('gradeLevel', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                >
                  <option value="K-2">K-2</option>
                  <option value="3-5">3-5</option>
                  <option value="6-8">6-8</option>
                  <option value="9-12">9-12</option>
                  <option value="College">College</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Professional">Professional</option>
                </select>
              </div>
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
            </div>

            {/* Sections */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">Sections</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSectionCountChange(sections.length - 1)}
                    disabled={sections.length <= 1}
                    className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 text-sm font-bold hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={sections.length}
                    onChange={(e) => handleSectionCountChange(parseInt(e.target.value) || 1)}
                    min={1}
                    max={10}
                    className="w-10 text-center text-sm font-bold border border-gray-200 rounded-md py-0.5 focus:ring-1 focus:ring-[#005587] focus:border-[#005587]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSectionCountChange(sections.length + 1)}
                    disabled={sections.length >= 10}
                    className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 text-sm font-bold hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {sections.map((section, index) => (
                  <div key={index} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                    <input
                      type="text"
                      value={section.name}
                      onChange={(e) => handleSectionNameChange(index, e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#005587] focus:border-[#005587] bg-white"
                      placeholder={`Section ${index + 1}`}
                    />
                    <div className="flex items-center gap-1">
                      <span className="px-2 py-1 bg-[#005587]/10 text-[#005587] text-[10px] font-mono font-bold rounded-md">
                        {section.classCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => regenerateCode(index)}
                        className="p-1 text-gray-400 hover:text-[#005587] transition-colors"
                        title="Regenerate code"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
          )}
        </div>
      </div>
    </InstructorRoute>
  );
};

export default CreateClassPage;
