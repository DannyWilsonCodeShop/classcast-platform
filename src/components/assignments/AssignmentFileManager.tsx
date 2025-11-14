'use client';

import React, { useState, useEffect } from 'react';
import FileUpload, { UploadedFile } from '../common/FileUpload';
import FileManager from '../common/FileManager';
import { useAuth } from '@/contexts/AuthContext';

interface AssignmentFileManagerProps {
  assignmentId: string;
  canUpload?: boolean;
  canDelete?: boolean;
  className?: string;
}

const AssignmentFileManager: React.FC<AssignmentFileManagerProps> = ({
  assignmentId,
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

  const categories = [
    { value: 'resource', label: 'Resource' },
    { value: 'rubric', label: 'Rubric' },
    { value: 'instruction', label: 'Instructions' },
    { value: 'template', label: 'Template' },
    { value: 'other', label: 'Other' }
  ];

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assignments/${assignmentId}/files`);
      
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
  }, [assignmentId]);

  const handleFileUpload = (uploadedFile: UploadedFile) => {
    setFiles(prev => [uploadedFile, ...prev]);
    setDescription(''); // Reset description after upload
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/files?fileId=${fileId}`, {
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
      <div className={`assignment-file-manager ${className}`}>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`assignment-file-manager space-y-6 ${className}`}>
      {/* Upload Section */}
      {canUpload && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Upload Files</h3>
          
          {/* Upload Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the file"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <FileUpload
            uploadEndpoint={`/api/assignments/${assignmentId}/files`}
            onFileUpload={handleFileUpload}
            onError={handleError}
            category={category}
            description={description}
            maxFileSize={50 * 1024 * 1024} // 50MB for assignment files
            multiple={true}
          />
        </div>
      )}

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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Files</h3>
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

export default AssignmentFileManager;