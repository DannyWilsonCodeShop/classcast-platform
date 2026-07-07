'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { RubricBuilder } from '@/components/instructor/RubricBuilder';
import { RubricCategory } from '@/types/rubric';

interface CourseOption {
  id: string;
  courseId: string;
  title: string;
  courseName: string;
}

interface AssignmentFormData {
  courseId: string;
  title: string;
  description: string;
  assignmentType: 'video' | 'text' | 'file';
  dueDate: string;
  maxScore: number;
  rubric: RubricCategory[];
}

const STEPS = [
  { number: 1, label: 'Course Selection' },
  { number: 2, label: 'Assignment Details' },
  { number: 3, label: 'Rubric Builder' },
  { number: 4, label: 'Review & Save' },
];

const CreateAssignmentPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<AssignmentFormData>({
    courseId: '',
    title: '',
    description: '',
    assignmentType: 'video',
    dueDate: '',
    maxScore: 100,
    rubric: [],
  });

  useEffect(() => {
    if (user?.id) {
      fetchCourses();
    }
  }, [user?.id]);

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await fetch(`/api/instructor/courses?instructorId=${user?.id}`);
      const data = await res.json();
      if (data.success && data.data?.courses) {
        setCourses(data.data.courses);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return formData.courseId !== '';
      case 2:
        return formData.title.trim() !== '' && formData.dueDate !== '';
      case 3:
        return true; // Rubric is optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          courseId: formData.courseId,
          assignmentType: formData.assignmentType,
          dueDate: formData.dueDate,
          maxScore: formData.maxScore,
          rubric: formData.rubric.length > 0 ? formData.rubric : null,
          instructorId: user?.id,
          status: 'published',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/instructor/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Failed to create assignment');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                currentStep >= step.number
                  ? 'bg-[#005587] text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step.number}
            </div>
            <span
              className={`mt-1 text-xs font-medium ${
                currentStep >= step.number ? 'text-[#005587]' : 'text-gray-400'
              }`}
              
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={`w-12 h-0.5 mx-2 mt-[-16px] ${
                currentStep > step.number ? 'bg-[#005587]' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <h2
        className="text-lg font-bold text-[#005587]"
      >
        Select a Course
      </h2>
      {loadingCourses ? (
        <div className="text-center py-8 text-gray-500">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No courses found. Create a course first.
        </div>
      ) : (
        <select
          value={formData.courseId}
          onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
        >
          <option value="">-- Select a course --</option>
          {courses.map((course) => (
            <option key={course.courseId} value={course.courseId}>
              {course.title || course.courseName}
            </option>
          ))}
        </select>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h2
        className="text-lg font-bold text-[#005587]"
      >
        Assignment Details
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Assignment title"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the assignment..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587] resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Type</label>
        <select
          value={formData.assignmentType}
          onChange={(e) =>
            setFormData({ ...formData, assignmentType: e.target.value as 'video' | 'text' | 'file' })
          }
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
        >
          <option value="video">Video</option>
          <option value="text">Text</option>
          <option value="file">File Upload</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
          <input
            type="datetime-local"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Points</label>
          <input
            type="number"
            min={1}
            max={1000}
            value={formData.maxScore}
            onChange={(e) => setFormData({ ...formData, maxScore: Number(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2
          className="text-lg font-bold text-[#005587]"
          
        >
          Rubric Builder
        </h2>
        <span className="text-xs text-gray-400 italic">Optional — skip if not needed</span>
      </div>
      <RubricBuilder
        value={formData.rubric}
        onChange={(rubric) => setFormData({ ...formData, rubric })}
      />
    </div>
  );

  const renderStep4 = () => {
    const selectedCourse = courses.find((c) => c.courseId === formData.courseId);

    return (
      <div className="space-y-4">
        <h2
          className="text-lg font-bold text-[#005587]"
          
        >
          Review & Save
        </h2>

        <div className="bg-gray-50 rounded-2xl p-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Course:</span>
            <span className="text-gray-900">{selectedCourse?.title || selectedCourse?.courseName || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Title:</span>
            <span className="text-gray-900">{formData.title || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Type:</span>
            <span className="text-gray-900 capitalize">{formData.assignmentType}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Due Date:</span>
            <span className="text-gray-900">
              {formData.dueDate ? new Date(formData.dueDate).toLocaleString() : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Max Points:</span>
            <span className="text-gray-900">{formData.maxScore}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Rubric:</span>
            <span className="text-gray-900">
              {formData.rubric.length > 0
                ? `${formData.rubric.length} categor${formData.rubric.length === 1 ? 'y' : 'ies'}`
                : 'None'}
            </span>
          </div>
          {formData.description && (
            <div className="pt-2 border-t border-gray-200">
              <span className="font-medium text-gray-600 block mb-1">Description:</span>
              <p className="text-gray-900 whitespace-pre-wrap">{formData.description}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl">{error}</div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 text-sm p-3 rounded-xl">
            Assignment created successfully! Redirecting to dashboard...
          </div>
        )}
      </div>
    );
  };

  return (
    <InstructorRoute>
      <link
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1
              className="text-2xl font-bold text-[#005587]"
              
            >
              Create Assignment
            </h1>
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>

          {/* Progress Indicator */}
          {renderProgressIndicator()}

          {/* Step Content */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Back
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#005587] rounded-xl hover:bg-[#004470] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || success}
                className="px-5 py-2.5 text-sm font-bold text-[#005587] bg-[#FFC72C] rounded-xl hover:bg-[#e6b225] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Assignment'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default CreateAssignmentPage;
