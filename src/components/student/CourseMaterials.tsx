'use client';

import React, { useState, useEffect } from 'react';

interface CourseMaterial {
  materialId: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'link' | 'assignment' | 'announcement';
  url?: string;
  fileSize?: number;
  duration?: number;
  uploadedBy: {
    name: string;
    email: string;
  };
  uploadedAt: string;
  isRequired: boolean;
  tags: string[];
}

interface Course {
  courseId: string;
  courseName: string;
  courseCode: string;
}

interface CourseMaterialsProps {
  courseId: string;
  course: Course;
}

export const CourseMaterials: React.FC<CourseMaterialsProps> = ({ courseId, course }) => {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'required' | 'documents' | 'videos' | 'links'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMaterials();
  }, [courseId]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real materials from API
      const response = await fetch(`/api/courses/${courseId}/materials`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch materials: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setMaterials(data.materials || []);
      } else {
        throw new Error(data.error || 'Failed to fetch materials');
      }
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch materials');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesFilter = filter === 'all' || 
      (filter === 'required' && material.isRequired) ||
      (filter === 'documents' && material.type === 'document') ||
      (filter === 'videos' && material.type === 'video') ||
      (filter === 'links' && material.type === 'link');
    
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return '📄';
      case 'video':
        return '🎥';
      case 'link':
        return '🔗';
      case 'assignment':
        return '📝';
      case 'announcement':
        return '📢';
      default:
        return '📁';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document':
        return 'bg-blue-100 text-blue-800';
      case 'video':
        return 'bg-red-100 text-red-800';
      case 'link':
        return 'bg-green-100 text-green-800';
      case 'assignment':
        return 'bg-purple-100 text-purple-800';
      case 'announcement':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course materials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">😞</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Materials</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchMaterials}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Course Materials</h2>
          <p className="text-gray-600">Access all course resources and materials</p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border-2 border-gray-200/30">
        <div className="flex space-x-1">
          {[
            { id: 'all', label: 'All Materials', icon: '📁' },
            { id: 'required', label: 'Required', icon: '⭐' },
            { id: 'documents', label: 'Documents', icon: '📄' },
            { id: 'videos', label: 'Videos', icon: '🎥' },
            { id: 'links', label: 'Links', icon: '🔗' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
                filter === tab.id
                  ? 'bg-gradient-to-r from-yellow-400 to-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Materials List */}
      {filteredMaterials.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Materials Found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'No materials match your search criteria.' : 'No materials have been uploaded yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMaterials.map((material) => (
            <div
              key={material.materialId}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="text-3xl">{getTypeIcon(material.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{material.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${getTypeColor(material.type)}`}>
                        {material.type.charAt(0).toUpperCase() + material.type.slice(1)}
                      </span>
                      {material.isRequired && (
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800">
                          Required
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3">{material.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <span>👤</span>
                        <span>{material.uploadedBy.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>📅</span>
                        <span>{new Date(material.uploadedAt).toLocaleDateString()}</span>
                      </div>
                      {material.fileSize && (
                        <div className="flex items-center space-x-1">
                          <span>💾</span>
                          <span>{formatFileSize(material.fileSize)}</span>
                        </div>
                      )}
                      {material.duration && (
                        <div className="flex items-center space-x-1">
                          <span>⏱️</span>
                          <span>{formatDuration(material.duration)}</span>
                        </div>
                      )}
                    </div>

                    {material.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {material.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {material.type === 'link' ? (
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                    >
                      Open Link
                    </a>
                  ) : (
                    <button className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
                      Download
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Materials Stats */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Materials Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{materials.length}</div>
            <div className="text-sm text-gray-600">Total Materials</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">
              {materials.filter(m => m.isRequired).length}
            </div>
            <div className="text-sm text-gray-600">Required</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {materials.filter(m => m.type === 'video').length}
            </div>
            <div className="text-sm text-gray-600">Videos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {materials.filter(m => m.type === 'document').length}
            </div>
            <div className="text-sm text-gray-600">Documents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">
              {materials.filter(m => m.type === 'link').length}
            </div>
            <div className="text-sm text-gray-600">Links</div>
          </div>
        </div>
      </div>
    </div>
  );
};
