'use client';

import React, { useState, useEffect } from 'react';

interface Course {
  courseId: string;
  courseName: string;
  courseCode: string;
  description: string;
  semester: string;
  year: number;
  status: 'draft' | 'published' | 'archived';
  enrollmentCount: number;
  maxEnrollment?: number;
  credits: number;
  schedule: {
    days: string[];
    time: string;
    location: string;
  };
  prerequisites: string[];
  learningObjectives: string[];
  gradingPolicy: {
    assignments: number;
    exams: number;
    participation: number;
    final: number;
  };
  settings?: {
    privacy?: 'public' | 'private';
    allowLateSubmissions?: boolean;
    latePenalty?: number;
    allowResubmissions?: boolean;
    enableDiscussions?: boolean;
    enableAnnouncements?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface CourseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onUpdate: (updateData: Partial<Course>) => Promise<{ success: boolean; message: string }>;
}

const CourseSettingsModal: React.FC<CourseSettingsModalProps> = ({
  isOpen,
  onClose,
  course,
  onUpdate
}) => {
  const [formData, setFormData] = useState<Partial<Course>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (course && isOpen) {
      setFormData({
        courseName: course.courseName,
        courseCode: course.courseCode,
        description: course.description,
        semester: course.semester,
        year: course.year,
        maxEnrollment: course.maxEnrollment,
        credits: course.credits,
        schedule: course.schedule,
        prerequisites: course.prerequisites,
        learningObjectives: course.learningObjectives,
        gradingPolicy: course.gradingPolicy
      });
    }
  }, [course, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await onUpdate(formData);
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to update course settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: string, value: string) => {
    const items = value.split('\n').filter(item => item.trim());
    setFormData(prev => ({
      ...prev,
      [field]: items
    }));
  };

  const handleGradingPolicyChange = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      gradingPolicy: {
        ...prev.gradingPolicy!,
        [field]: value
      }
    }));
  };

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Course Settings</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={formData.courseName || ''}
                    onChange={(e) => handleInputChange('courseName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={formData.courseCode || ''}
                    onChange={(e) => handleInputChange('courseCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester
                  </label>
                  <select
                    value={formData.semester || ''}
                    onChange={(e) => handleInputChange('semester', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Fall">Fall</option>
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Winter">Winter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <input
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="2020"
                    max="2030"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits
                  </label>
                  <input
                    type="number"
                    value={formData.credits || ''}
                    onChange={(e) => handleInputChange('credits', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="6"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Enrollment
                  </label>
                  <input
                    type="number"
                    value={formData.maxEnrollment || ''}
                    onChange={(e) => handleInputChange('maxEnrollment', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Privacy Settings
              </h3>
              
              <div>
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
                      checked={formData.settings?.privacy === 'public' || !formData.settings?.privacy}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            privacy: e.target.value as 'public' | 'private'
                          }
                        }));
                      }}
                      className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
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
                      checked={formData.settings?.privacy === 'private'}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            privacy: e.target.value as 'public' | 'private'
                          }
                        }));
                      }}
                      className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
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
                  Private courses won't appear in public course searches but can still be joined using the class code.
                </p>
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Schedule
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days
                  </label>
                  <input
                    type="text"
                    value={formData.schedule?.days?.join(', ') || ''}
                    onChange={(e) => handleInputChange('schedule', {
                      ...formData.schedule,
                      days: e.target.value.split(',').map(d => d.trim()).filter(d => d)
                    })}
                    placeholder="Monday, Wednesday, Friday"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="text"
                    value={formData.schedule?.time || ''}
                    onChange={(e) => handleInputChange('schedule', {
                      ...formData.schedule,
                      time: e.target.value
                    })}
                    placeholder="10:00 AM - 11:00 AM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.schedule?.location || ''}
                    onChange={(e) => handleInputChange('schedule', {
                      ...formData.schedule,
                      location: e.target.value
                    })}
                    placeholder="Room 101"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Grading Policy */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Grading Policy
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignments (%)
                  </label>
                  <input
                    type="number"
                    value={formData.gradingPolicy?.assignments || ''}
                    onChange={(e) => handleGradingPolicyChange('assignments', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exams (%)
                  </label>
                  <input
                    type="number"
                    value={formData.gradingPolicy?.exams || ''}
                    onChange={(e) => handleGradingPolicyChange('exams', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participation (%)
                  </label>
                  <input
                    type="number"
                    value={formData.gradingPolicy?.participation || ''}
                    onChange={(e) => handleGradingPolicyChange('participation', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Final (%)
                  </label>
                  <input
                    type="number"
                    value={formData.gradingPolicy?.final || ''}
                    onChange={(e) => handleGradingPolicyChange('final', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>

            {/* Prerequisites */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Prerequisites
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prerequisites (one per line)
                </label>
                <textarea
                  value={formData.prerequisites?.join('\n') || ''}
                  onChange={(e) => handleArrayChange('prerequisites', e.target.value)}
                  rows={3}
                  placeholder="Introduction to Computer Science&#10;Basic Mathematics&#10;Programming Fundamentals"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Learning Objectives */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Learning Objectives
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learning Objectives (one per line)
                </label>
                <textarea
                  value={formData.learningObjectives?.join('\n') || ''}
                  onChange={(e) => handleArrayChange('learningObjectives', e.target.value)}
                  rows={4}
                  placeholder="Understand fundamental concepts of computer science&#10;Develop problem-solving skills&#10;Learn programming languages&#10;Apply knowledge to real-world projects"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">{success}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CourseSettingsModal;
