'use client';

import React, { useState, useEffect } from 'react';
import FileUpload, { UploadedFile } from '../common/FileUpload';
import FileManager from '../common/FileManager';
import { useAuth } from '@/contexts/AuthContext';

interface AssignmentLink {
  linkId: string;
  title: string;
  url: string;
  description: string;
  category: string;
  createdAt: string;
  createdBy: string;
}

interface AssignmentResourcesProps {
  assignmentId: string;
  canManage?: boolean; // Can upload files and add links
  className?: string;
}

const AssignmentResources: React.FC<AssignmentResourcesProps> = ({
  assignmentId,
  canManage = false,
  className = ''
}) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [links, setLinks] = useState<AssignmentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // File upload state
  const [fileCategory, setFileCategory] = useState<string>('resource');
  const [fileDescription, setFileDescription] = useState<string>('');
  
  // Link form state
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [linkCategory, setLinkCategory] = useState('resource');
  const [addingLink, setAddingLink] = useState(false);

  const categories = [
    { value: 'resource', label: 'Resource', icon: '📚' },
    { value: 'rubric', label: 'Rubric', icon: '📋' },
    { value: 'instruction', label: 'Instructions', icon: '📝' },
    { value: 'template', label: 'Template', icon: '📄' },
    { value: 'reference', label: 'Reference', icon: '🔗' },
    { value: 'tool', label: 'Tool/Software', icon: '🛠️' },
    { value: 'other', label: 'Other', icon: '📎' }
  ];

  const fetchResources = async () => {
    try {
      setLoading(true);
      
      // Fetch files and links in parallel
      const [filesResponse, linksResponse] = await Promise.all([
        fetch(`/api/assignments/${assignmentId}/files`),
        fetch(`/api/assignments/${assignmentId}/links`)
      ]);

      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        if (filesData.success) {
          setFiles(filesData.data.files);
        }
      }

      if (linksResponse.ok) {
        const linksData = await linksResponse.json();
        if (linksData.success) {
          setLinks(linksData.data.links);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [assignmentId]);

  const handleFileUpload = (uploadedFile: UploadedFile) => {
    setFiles(prev => [uploadedFile, ...prev]);
    setFileDescription('');
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

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!linkTitle.trim() || !linkUrl.trim()) {
      setError('Title and URL are required');
      return;
    }

    try {
      setAddingLink(true);
      
      const response = await fetch(`/api/assignments/${assignmentId}/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: linkTitle.trim(),
          url: linkUrl.trim(),
          description: linkDescription.trim(),
          category: linkCategory
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add link');
      }

      const data = await response.json();
      if (data.success) {
        setLinks(prev => [data.data.link, ...prev]);
        setLinkTitle('');
        setLinkUrl('');
        setLinkDescription('');
        setShowLinkForm(false);
      } else {
        throw new Error(data.error || 'Failed to add link');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add link');
    } finally {
      setAddingLink(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/links?linkId=${linkId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete link');
      }

      const data = await response.json();
      if (data.success) {
        setLinks(prev => prev.filter(link => link.linkId !== linkId));
      } else {
        throw new Error(data.error || 'Failed to delete link');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete link');
    }
  };

  const getCategoryIcon = (category: string) => {
    return categories.find(cat => cat.value === category)?.icon || '📎';
  };

  const getCategoryLabel = (category: string) => {
    return categories.find(cat => cat.value === category)?.label || 'Other';
  };

  if (loading) {
    return (
      <div className={`assignment-resources ${className}`}>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`assignment-resources space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Assignment Resources</h3>
        {canManage && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowLinkForm(!showLinkForm)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Add Link
            </button>
          </div>
        )}
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

      {/* Add Link Form */}
      {canManage && showLinkForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 mb-4">Add Resource Link</h4>
          <form onSubmit={handleAddLink} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="e.g., Course Textbook, Reference Guide"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={linkCategory}
                  onChange={(e) => setLinkCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL *
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={linkDescription}
                onChange={(e) => setLinkDescription(e.target.value)}
                placeholder="Brief description of this resource"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowLinkForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingLink}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {addingLink ? 'Adding...' : 'Add Link'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* File Upload Section */}
      {canManage && (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Upload Files</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={fileCategory}
                onChange={(e) => setFileCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
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
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                placeholder="Brief description of the file"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <FileUpload
            uploadEndpoint={`/api/assignments/${assignmentId}/files`}
            onFileUpload={handleFileUpload}
            onError={setError}
            category={fileCategory}
            description={fileDescription}
            maxFileSize={50 * 1024 * 1024} // 50MB for assignment files
            multiple={true}
          />
        </div>
      )}

      {/* Resources Display */}
      <div className="space-y-6">
        {/* Links Section */}
        {links.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Resource Links</h4>
            <div className="space-y-3">
              {links.map((link) => (
                <div key={link.linkId} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{getCategoryIcon(link.category)}</span>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {getCategoryLabel(link.category)}
                        </span>
                      </div>
                      <h5 className="text-sm font-medium text-gray-900 mb-1">{link.title}</h5>
                      {link.description && (
                        <p className="text-sm text-gray-600 mb-2">{link.description}</p>
                      )}
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open Link
                      </a>
                    </div>
                    {canManage && (
                      <button
                        onClick={() => handleDeleteLink(link.linkId)}
                        className="text-gray-400 hover:text-red-600 ml-4"
                        title="Delete link"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files Section */}
        {files.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Resource Files</h4>
            <FileManager
              files={files}
              onFileDelete={canManage ? handleFileDelete : undefined}
              canDelete={canManage}
              canDownload={true}
              groupBy="category"
            />
          </div>
        )}

        {/* Empty State */}
        {files.length === 0 && links.length === 0 && (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No resources yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              {canManage ? 'Upload files or add links to get started.' : 'No resources have been added to this assignment.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentResources;