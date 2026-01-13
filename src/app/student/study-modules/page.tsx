'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { StudyModule } from '@/types/study-modules';
import {
  AcademicCapIcon,
  ClockIcon,
  StarIcon,
  UserGroupIcon,
  PlayIcon,
  BookOpenIcon,
  ChartBarIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { FireIcon } from '@heroicons/react/24/solid';

const StudyModulesPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [modules, setModules] = useState<StudyModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const categories = ['all', 'Mathematics', 'Literature', 'Computer Science', 'Science', 'History'];
  const difficulties = ['all', 'Beginner', 'Intermediate', 'Advanced'];

  useEffect(() => {
    fetchModules();
  }, [selectedCategory, selectedDifficulty]);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        userId: user?.id || '',
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedDifficulty !== 'all' && { difficulty: selectedDifficulty })
      });

      const response = await fetch(`/api/study-modules?${params}`);
      const data = await response.json();

      if (data.success) {
        setModules(data.modules);
      }
    } catch (error) {
      console.error('Error fetching study modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollModule = async (moduleId: string) => {
    try {
      const response = await fetch('/api/study-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          moduleId,
          action: 'enroll'
        })
      });

      const data = await response.json();
      if (data.success) {
        // Update module enrollment status
        setModules(prev => prev.map(module => 
          module.id === moduleId 
            ? { ...module, isEnrolled: true }
            : module
        ));
        
        // Navigate to the module
        router.push(`/student/study-modules/${moduleId}`);
      }
    } catch (error) {
      console.error('Error enrolling in module:', error);
    }
  };

  const filteredModules = modules.filter(module =>
    module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Mathematics': return ChartBarIcon;
      case 'Literature': return BookOpenIcon;
      case 'Computer Science': return AcademicCapIcon;
      default: return BookOpenIcon;
    }
  };

  if (loading) {
    return (
      <StudentRoute>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-200 h-80 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <AcademicCapIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Study Modules</h1>
                <p className="text-gray-600">Interactive learning experiences with videos and quizzes</p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search modules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Filters */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <FunnelIcon className="w-5 h-5 text-gray-400" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty === 'all' ? 'All Levels' : difficulty}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Modules Grid */}
          {filteredModules.length === 0 ? (
            <div className="text-center py-12">
              <AcademicCapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No modules found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModules.map((module) => {
                const CategoryIcon = getCategoryIcon(module.category);
                
                return (
                  <div
                    key={module.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-48 bg-gradient-to-br from-purple-400 to-blue-500">
                      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                      <div className="absolute top-4 left-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(module.difficulty)}`}>
                          {module.difficulty}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4">
                        <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                          <CategoryIcon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                          <PlayIcon className="w-8 h-8 text-white ml-1" fill="currentColor" />
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center justify-between text-white text-sm">
                          <span className="flex items-center space-x-1">
                            <ClockIcon className="w-4 h-4" />
                            <span>{module.estimatedTime}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <BookOpenIcon className="w-4 h-4" />
                            <span>{module.totalLessons} lessons</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                            {module.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">{module.category}</p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                        {module.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <StarIcon className="w-4 h-4 text-yellow-400" fill="currentColor" />
                          <span className="font-medium">{module.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <UserGroupIcon className="w-4 h-4" />
                          <span>{module.enrolledCount.toLocaleString()} enrolled</span>
                        </div>
                      </div>

                      {/* Progress or Enroll Button */}
                      {module.isEnrolled ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium text-gray-900">{module.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${module.progress}%` }}
                            ></div>
                          </div>
                          <button
                            onClick={() => router.push(`/student/study-modules/${module.id}`)}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                          >
                            Continue Learning
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEnrollModule(module.id)}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center space-x-2"
                        >
                          <AcademicCapIcon className="w-5 h-5" />
                          <span>Enroll Now</span>
                        </button>
                      )}

                      {/* Creator */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Created by <span className="font-medium text-gray-700">{module.createdBy}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentRoute>
  );
};

export default StudyModulesPage;