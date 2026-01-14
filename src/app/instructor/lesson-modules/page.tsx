'use client';

import React, { useState, useEffect } from 'react';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/common/Avatar';
import NotificationBell from '@/components/common/NotificationBell';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  PlusIcon,
  AcademicCapIcon,
  VideoCameraIcon,
  ClockIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface LessonModule {
  moduleId: string;
  courseId: string;
  title: string;
  description: string;
  thumbnail?: string;
  introVideoUrl?: string;
  status: 'draft' | 'published';
  lessonCount: number;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
}

const LessonModulesPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [modules, setModules] = useState<LessonModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateWizard, setShowCreateWizard] = useState(false);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/instructor/lesson-modules', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setModules(data.modules || []);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return;

    try {
      const response = await fetch(`/api/instructor/lesson-modules/${moduleId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setModules(modules.filter(m => m.moduleId !== moduleId));
      }
    } catch (error) {
      console.error('Error deleting module:', error);
    }
  };

  return (
    <InstructorRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Top Banner */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-indigo-600/20 px-2 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <img
                src="/MyClassCast (800 x 200 px).png"
                alt="MyClassCast"
                className="h-6 sm:h-8 w-auto object-contain max-w-[200px] sm:max-w-none"
              />
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
              {user?.id && (
                <NotificationBell 
                  userId={user.id} 
                  userRole="instructor" 
                  className="flex-shrink-0"
                />
              )}
              
              <button
                onClick={() => router.push('/instructor/dashboard')}
                className="flex items-center space-x-1 sm:space-x-2 bg-gray-600 text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <span className="text-base sm:text-lg">←</span>
                <span className="font-medium text-xs sm:text-sm hidden sm:inline">Dashboard</span>
              </button>
              
              <Avatar
                user={user}
                size="lg"
                onClick={() => router.push('/instructor/profile')}
                className="shadow-lg hover:scale-110 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Lesson Modules</h1>
                <p className="text-purple-100">Create interactive learning experiences with videos, quizzes, and practice tests</p>
              </div>
              <button
                onClick={() => setShowCreateWizard(true)}
                className="flex items-center space-x-2 bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors shadow-lg font-semibold"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create Module</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AcademicCapIcon className="w-12 h-12 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">No Lesson Modules Yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Create your first lesson module to provide structured learning with interactive videos, quizzes, and practice tests.
              </p>
              <button
                onClick={() => setShowCreateWizard(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-bold transition-colors inline-flex items-center space-x-2"
              >
                <PlusIcon className="w-6 h-6" />
                <span>Create Your First Module</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <div key={module.moduleId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-br from-purple-500 to-indigo-600">
                    {module.thumbnail ? (
                      <img src={module.thumbnail} alt={module.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <AcademicCapIcon className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        module.status === 'published' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-yellow-500 text-white'
                      }`}>
                        {module.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{module.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{module.description}</p>

                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <VideoCameraIcon className="w-4 h-4" />
                        <span>{module.lessonCount} lessons</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <UserGroupIcon className="w-4 h-4" />
                        <span>{module.studentCount} students</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/instructor/lesson-modules/${module.moduleId}`)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                      >
                        <PencilIcon className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => router.push(`/instructor/lesson-modules/${module.moduleId}/preview`)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        title="Preview"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteModule(module.moduleId)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Module Wizard Modal */}
        {showCreateWizard && (
          <ModuleCreationWizard
            onClose={() => setShowCreateWizard(false)}
            onComplete={(newModule) => {
              setModules([...modules, newModule]);
              setShowCreateWizard(false);
            }}
          />
        )}
      </div>
    </InstructorRoute>
  );
};

// Module Creation Wizard Component
const ModuleCreationWizard: React.FC<{
  onClose: () => void;
  onComplete: (module: LessonModule) => void;
}> = ({ onClose, onComplete }) => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    introVideoUrl: '',
    thumbnail: ''
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/instructor/courses', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data.data?.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/instructor/lesson-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        onComplete(data.module);
        // Redirect to edit page to add lessons
        router.push(`/instructor/lesson-modules/${data.module.moduleId}`);
      }
    } catch (error) {
      console.error('Error creating module:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-xl">
          <h2 className="text-2xl font-bold mb-2">Create Lesson Module</h2>
          <p className="text-purple-100">Step {step} of 3</p>
          <div className="mt-4 flex space-x-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full ${
                  s <= step ? 'bg-white' : 'bg-purple-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Module Setup</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Module Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Introduction to Calculus"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what students will learn in this module..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course *
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a course...</option>
                  {courses.map((course) => (
                    <option key={course.id || course.courseId} value={course.id || course.courseId}>
                      {course.title || course.courseName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Intro Video (Optional)</h3>
              <p className="text-gray-600 mb-4">
                Add an introduction video to welcome students and explain what they'll learn.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video URL (YouTube or Google Drive)
                </label>
                <input
                  type="url"
                  value={formData.introVideoUrl}
                  onChange={(e) => setFormData({ ...formData, introVideoUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can skip this and add it later
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Review & Create</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Title:</span>
                  <p className="text-gray-900">{formData.title}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Description:</span>
                  <p className="text-gray-900">{formData.description}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Course:</span>
                  <p className="text-gray-900">
                    {courses.find(c => (c.id || c.courseId) === formData.courseId)?.title || 
                     courses.find(c => (c.id || c.courseId) === formData.courseId)?.courseName || 
                     'Not selected'}
                  </p>
                </div>
                {formData.introVideoUrl && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Intro Video:</span>
                    <p className="text-gray-900 truncate">{formData.introVideoUrl}</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  After creating the module, you'll be able to add lesson videos, interactive questions, and practice tests.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          
          <div className="flex space-x-3">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
              >
                Back
              </button>
            )}
            
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={
                  (step === 1 && (!formData.title || !formData.description || !formData.courseId))
                }
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {loading ? 'Creating...' : 'Create Module'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonModulesPage;
