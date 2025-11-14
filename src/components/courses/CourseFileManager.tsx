'use client';

import React, { useState, useEffect } from 'react';
import FileUpload, { UploadedFile } from '../common/FileUpload';
import FileManager from '../common/FileManager';
import { useAuth } from '@/contexts/AuthContext';

interface CourseFileManagerProps {
  courseId: string;
  canUpload?: boolean;
  canDelete?: boolean;
  className?: string;
}

const CourseFileManager: React.FC<CourseFileManagerProps> = ({
  courseId,
  canUpload = false,
  canDelete = false,
  className = ''
}) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('resource');
  const [description, setDescription] = useState<string>('');
  const [week, setWeek] = useState<string>('');
  const [module, setModule] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterWeek, setFilterWeek] = useState<string>('');

  const categories = [
    { value: 'syllabus', label: 'Syllabus' },
    { value: 'lecture', label: 'Lecture Materials' },
    { value: 'reading', label: 'Readings' },
    { value: 'resource', label: 'Resources' },
    { value: 'assignment_template', label: 'Assignment Templates' },
    { value: 'other', label: 'Other' }
  ];

  const fetchFiles = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (filterWeek) params.append('week', filterWeek);
      
      const response = await fetch(`/api/courses/${courseId}/files?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      const data = await response.json();
      if (data.success) {
        setFiles(data.data.files);
      } else {
        throw new Error(data.error || 'Failed to fetch files');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [courseId, filterCategory, filterWeek]);

  const handleFileUpload = (uploadedFile: UploadedFile) => {
    setFiles(prev => [uploadedFile, ...prev]);
    setDescription(''); // Reset form after upload
    setWeek('');
    setModule('');
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/files?fileId=${fileId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      const data = await response.json();
      if (data.success) {
        setFiles(prev => prev.filter(file => file.fileId !== fileId));
      } else {
        throw new Error(data.error || 'Failed to delete file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (loading) {
    return (
      <div className={`course-file-manager ${className}`}>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`course-file-manager space-y-6 ${className}`}>
      {/* Upload Section */}
      {canUpload && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Upload Course Materials</h3>
          
          {/* Upload Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Week (Optional)
              </label>
              <input
                type="number"
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                placeholder="e.g., 1"
                min="1"
                max="52"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Module (Optional)
              </label>
              <input
                type="text"
                value={module}
                onChange={(e) => setModule(e.target.value)}
                placeholder="e.g., Introduction"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <FileUpload
            uploadEndpoint={`/api/courses/${courseId}/files`}
            onFileUpload={handleFileUpload}
            onError={handleError}
            category={category}
            description={description}
            week={week ? parseInt(week) : undefined}
            module={module}
            maxFileSize={100 * 1024 * 1024} // 100MB for course files
            multiple={true}
            acceptedTypes={[
              // Documents
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-powerpoint',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              'text/plain',
              'text/csv',
              'text/markdown',
              // Images
              'image/jpeg',
              'image/png',
              'image/gif',
              'image/webp',
              // Audio/Video
              'audio/mpeg',
              'audio/wav',
              'video/mp4',
              'video/webm',
              // Archives
              'application/zip',
              'application/x-rar-compressed'
            ]}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Filter Files</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Week
            </label>
            <input
              type="number"
              value={filterWeek}
              onChange={(e) => setFilterWeek(e.target.value)}
              placeholder="All weeks"
              min="1"
              max="52"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Files List */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Course Materials</h3>
        <FileManager
          files={files}
          onFileDelete={canDelete ? handleFileDelete : undefined}
          canDelete={canDelete}
          canDownload={true}
          groupBy="category"
        />
      </div>
    </div>
  );
};

export default CourseFileManager;