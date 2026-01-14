'use client';

import React, { useState, useEffect } from 'react';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Avatar from '@/components/common/Avatar';
import NotificationBell from '@/components/common/NotificationBell';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import InstructionalVideoUploader from '@/components/instructor/InstructionalVideoUploader';
import {
  PlusIcon,
  VideoCameraIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlayIcon
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

interface Lesson {
  lessonId: string;
  moduleId: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  order: number;
  questions: Question[];
  createdAt: string;
}

interface Question {
  questionId: string;
  pauseTime: number;
  questionText: string;
  options: string[];
  correctAnswer: number;
  points: number;
  feedback?: string;
}

const ModuleEditPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const moduleId = params?.moduleId as string;

  const [module, setModule] = useState<LessonModule | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'tests'>('overview');
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [editingModule, setEditingModule] = useState(false);

  useEffect(() => {
    if (moduleId) {
      fetchModule();
      fetchLessons();
    }
  }, [moduleId]);

  const fetchModule = async () => {
    try {
      const response = await fetch(`/api/instructor/lesson-modules/${moduleId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setModule(data.module);
      }
    } catch (error) {
      console.error('Error fetching module:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await fetch(`/api/instructor/lesson-modules/${moduleId}/lessons`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setLessons(data.lessons || []);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const handleUpdateModule = async (updates: Partial<LessonModule>) => {
    try {
      const response = await fetch(`/api/instructor/lesson-modules/${moduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        setModule(data.module);
        setEditingModule(false);
      }
    } catch (error) {
      console.error('Error updating module:', error);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this module? Students will be able to access it.')) return;
    await handleUpdateModule({ status: 'published' });
  };

  const handleUnpublish = async () => {
    if (!confirm('Are you sure you want to unpublish this module? Students will no longer be able to access it.')) return;
    await handleUpdateModule({ status: 'draft' });
  };

  if (loading) {
    return (
      <InstructorRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </InstructorRoute>
    );
  }

  if (!module) {
    return (
      <InstructorRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Module Not Found</h2>
            <button
              onClick={() => router.push('/instructor/lesson-modules')}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Back to Modules
            </button>
          </div>
        </div>
      </InstructorRoute>
    );
  }

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
                onClick={() => router.push('/instructor/lesson-modules')}
                className="flex items-center space-x-1 sm:space-x-2 bg-gray-600 text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span className="font-medium text-xs sm:text-sm hidden sm:inline">Back</span>
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

        {/* Module Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold">{module.title}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    module.status === 'published' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-yellow-500 text-white'
                  }`}>
                    {module.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-purple-100 mb-4">{module.description}</p>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <VideoCameraIcon className="w-5 h-5" />
                    <span>{lessons.length} lessons</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>{module.studentCount} students enrolled</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setEditingModule(true)}
                  className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors font-medium flex items-center space-x-2"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span>Edit Details</span>
                </button>
                
                {module.status === 'draft' ? (
                  <button
                    onClick={handlePublish}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center space-x-2"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Publish</span>
                  </button>
                ) : (
                  <button
                    onClick={handleUnpublish}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    Unpublish
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('lessons')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'lessons'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Lessons ({lessons.length})
              </button>
              <button
                onClick={() => setActiveTab('tests')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'tests'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Practice Tests
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Intro Video */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Introduction Video</h3>
                {module.introVideoUrl ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <iframe
                        src={module.introVideoUrl}
                        className="w-full h-full"
                        allowFullScreen
                        title="Intro Video"
                      />
                    </div>
                    <button
                      onClick={() => handleUpdateModule({ introVideoUrl: '' })}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove Video
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <VideoCameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No introduction video added yet</p>
                    <button
                      onClick={() => setEditingModule(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Add Intro Video
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <VideoCameraIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{lessons.length}</p>
                      <p className="text-sm text-gray-600">Total Lessons</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <QuestionMarkCircleIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {lessons.reduce((sum, lesson) => sum + (lesson.questions?.length || 0), 0)}
                      </p>
                      <p className="text-sm text-gray-600">Interactive Questions</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{module.studentCount}</p>
                      <p className="text-sm text-gray-600">Students Enrolled</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lessons' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Lesson Videos</h3>
                <button
                  onClick={() => setShowAddLesson(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Add Lesson</span>
                </button>
              </div>

              {lessons.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <VideoCameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Lessons Yet</h4>
                  <p className="text-gray-600 mb-6">Start building your module by adding lesson videos</p>
                  <button
                    onClick={() => setShowAddLesson(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span>Add First Lesson</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {lessons.map((lesson, index) => (
                    <div key={lesson.lessonId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 font-bold">{index + 1}</span>
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">{lesson.title}</h4>
                          <p className="text-gray-600 text-sm mb-3">{lesson.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <PlayIcon className="w-4 h-4" />
                              <span>{lesson.duration} min</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <QuestionMarkCircleIcon className="w-4 h-4" />
                              <span>{lesson.questions?.length || 0} questions</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Move up"
                          >
                            <ArrowUpIcon className="w-5 h-5" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Move down"
                          >
                            <ArrowDownIcon className="w-5 h-5" />
                          </button>
                          <button
                            className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            className="p-2 text-red-600 hover:text-red-700 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Practice Tests</h3>
                <button
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Add Practice Test</span>
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Practice Tests Yet</h4>
                <p className="text-gray-600 mb-6">Create standalone tests to assess student knowledge</p>
                <button
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Create First Test</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Edit Module Modal */}
        {editingModule && (
          <EditModuleModal
            module={module}
            onClose={() => setEditingModule(false)}
            onSave={(updates) => handleUpdateModule(updates)}
          />
        )}

        {/* Add Lesson Modal */}
        {showAddLesson && (
          <AddLessonModal
            moduleId={moduleId}
            onClose={() => setShowAddLesson(false)}
            onComplete={() => {
              setShowAddLesson(false);
              fetchLessons();
            }}
          />
        )}
      </div>
    </InstructorRoute>
  );
};

// Edit Module Modal Component
const EditModuleModal: React.FC<{
  module: LessonModule;
  onClose: () => void;
  onSave: (updates: Partial<LessonModule>) => void;
}> = ({ module, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: module.title,
    description: module.description,
    introVideoUrl: module.introVideoUrl || ''
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Module Details</h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Intro Video URL</label>
            <input
              type="url"
              value={formData.introVideoUrl}
              onChange={(e) => setFormData({ ...formData, introVideoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Lesson Modal Component
const AddLessonModal: React.FC<{
  moduleId: string;
  onClose: () => void;
  onComplete: () => void;
}> = ({ moduleId, onClose, onComplete }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: 0
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title || !formData.videoUrl) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/instructor/lesson-modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onComplete();
      }
    } catch (error) {
      console.error('Error adding lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add Lesson Video</h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Introduction to Limits"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what students will learn..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video URL *</label>
            <InstructionalVideoUploader
              onVideoSelect={(url) => setFormData({ ...formData, videoUrl: url })}
              currentVideoUrl={formData.videoUrl}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              placeholder="10"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.title || !formData.videoUrl}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {loading ? 'Adding...' : 'Add Lesson'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleEditPage;
