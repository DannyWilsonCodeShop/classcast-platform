'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { StudyModule, StudyLesson } from '@/types/study-modules';
import InteractiveVideoPlayer from '@/components/study-modules/InteractiveVideoPlayer';
import QuizComponent from '@/components/study-modules/QuizComponent';
import {
  ArrowLeftIcon,
  PlayIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ClockIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

interface ModuleViewerPageProps {
  params: { moduleId: string };
}

const ModuleViewerPage: React.FC<ModuleViewerPageProps> = ({ params }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [module, setModule] = useState<StudyModule | null>(null);
  const [currentLesson, setCurrentLesson] = useState<StudyLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchModule();
  }, [params.moduleId]);

  const fetchModule = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/study-modules/${params.moduleId}?userId=${user?.id}`);
      const data = await response.json();

      if (data.success) {
        setModule(data.module);
        // Set current lesson to first incomplete lesson or first lesson
        const firstIncomplete = data.module.lessons.find((lesson: StudyLesson) => !lesson.isCompleted);
        setCurrentLesson(firstIncomplete || data.module.lessons[0]);
      }
    } catch (error) {
      console.error('Error fetching module:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonComplete = (lessonId: string) => {
    if (!module) return;

    // Mark lesson as completed
    const updatedLessons = module.lessons.map(lesson => 
      lesson.id === lessonId 
        ? { ...lesson, isCompleted: true }
        : lesson
    );

    // Unlock next lesson
    const currentIndex = updatedLessons.findIndex(lesson => lesson.id === lessonId);
    if (currentIndex < updatedLessons.length - 1) {
      updatedLessons[currentIndex + 1].isLocked = false;
    }

    setModule({ ...module, lessons: updatedLessons });

    // Auto-advance to next lesson if available
    const nextLesson = updatedLessons[currentIndex + 1];
    if (nextLesson && !nextLesson.isLocked) {
      setCurrentLesson(nextLesson);
    }
  };

  const handleLessonSelect = (lesson: StudyLesson) => {
    if (!lesson.isLocked) {
      setCurrentLesson(lesson);
    }
  };

  const getLessonIcon = (lesson: StudyLesson) => {
    if (lesson.isCompleted) {
      return <CheckCircleIconSolid className="w-5 h-5 text-green-500" />;
    }
    if (lesson.isLocked) {
      return <LockClosedIcon className="w-5 h-5 text-gray-400" />;
    }
    
    switch (lesson.type) {
      case 'video':
        return <PlayIcon className="w-5 h-5 text-blue-500" />;
      case 'quiz':
        return <AcademicCapIcon className="w-5 h-5 text-purple-500" />;
      default:
        return <BookOpenIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <StudentRoute>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </StudentRoute>
    );
  }

  if (!module || !currentLesson) {
    return (
      <StudentRoute>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Module not found</h2>
            <button
              onClick={() => router.push('/student/study-modules')}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
            >
              Back to Modules
            </button>
          </div>
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gray-900 flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-gray-800 border-r border-gray-700 overflow-hidden`}>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => router.push('/student/study-modules')}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Back to Modules</span>
              </button>
            </div>

            {/* Module Info */}
            <div className="mb-6">
              <h1 className="text-xl font-bold text-white mb-2">{module.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="flex items-center space-x-1">
                  <BookOpenIcon className="w-4 h-4" />
                  <span>{module.lessons.length} lessons</span>
                </span>
                <span className="flex items-center space-x-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>{module.estimatedTime}</span>
                </span>
              </div>
              
              {/* Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                  <span>Progress</span>
                  <span>{module.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${module.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Lessons List */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                Lessons
              </h3>
              {module.lessons.map((lesson, index) => (
                <button
                  key={lesson.id}
                  onClick={() => handleLessonSelect(lesson)}
                  disabled={lesson.isLocked}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all ${
                    currentLesson.id === lesson.id
                      ? 'bg-blue-600 text-white'
                      : lesson.isLocked
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getLessonIcon(lesson)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium opacity-60">
                        {index + 1}.
                      </span>
                      <p className="font-medium truncate">{lesson.title}</p>
                    </div>
                    {lesson.duration && (
                      <p className="text-xs opacity-60 mt-1">{lesson.duration}</p>
                    )}
                  </div>
                  {currentLesson.id === lesson.id && (
                    <ChevronRightIcon className="w-4 h-4 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-white">{currentLesson.title}</h2>
                  <p className="text-sm text-gray-400">{currentLesson.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {currentLesson.isCompleted && (
                  <div className="flex items-center space-x-1 text-green-400">
                    <CheckCircleIconSolid className="w-5 h-5" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lesson Content */}
          <div className="flex-1 bg-black">
            {currentLesson.type === 'video' && currentLesson.videoUrl && (
              <InteractiveVideoPlayer
                videoUrl={currentLesson.videoUrl}
                lessonId={currentLesson.id}
                onComplete={() => handleLessonComplete(currentLesson.id)}
                isCompleted={currentLesson.isCompleted}
              />
            )}
            
            {currentLesson.type === 'quiz' && currentLesson.quiz && (
              <QuizComponent
                quiz={currentLesson.quiz}
                onComplete={() => handleLessonComplete(currentLesson.id)}
                isCompleted={currentLesson.isCompleted}
              />
            )}
            
            {currentLesson.type === 'reading' && (
              <div className="p-8 max-w-4xl mx-auto">
                <div className="bg-white rounded-lg p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">{currentLesson.title}</h3>
                  <div className="prose max-w-none">
                    {currentLesson.content}
                  </div>
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => handleLessonComplete(currentLesson.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Mark as Complete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentRoute>
  );
};

export default ModuleViewerPage;