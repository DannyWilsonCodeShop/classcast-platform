'use client';

import React, { useState } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, LinkIcon, DocumentIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { AssignmentResource } from '@/types/dynamodb';

interface AssignmentResourcesManagerProps {
  resources: AssignmentResource[];
  onResourcesChange: (resources: AssignmentResource[]) => void;
  disabled?: boolean;
}

const AssignmentResourcesManager: React.FC<AssignmentResourcesManagerProps> = ({
  resources,
  onResourcesChange,
  disabled = false
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResource, setEditingResource] = useState<AssignmentResource | null>(null);
  const [resourceForm, setResourceForm] = useState({
    type: 'link' as 'document' | 'link',
    title: '',
    description: '',
    url: '',
    file: null as File | null
  });

  const handleAddResource = () => {
    if (!resourceForm.title.trim() || !resourceForm.url.trim()) {
      return;
    }

    const newResource: AssignmentResource = {
      id: `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: resourceForm.type,
      title: resourceForm.title.trim(),
      description: resourceForm.description.trim() || undefined,
      url: resourceForm.url.trim(),
      size: resourceForm.type === 'document' && resourceForm.file ? resourceForm.file.size : undefined,
      mimeType: resourceForm.type === 'document' && resourceForm.file ? resourceForm.file.type : undefined,
      uploadedAt: resourceForm.type === 'document' && resourceForm.file ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString()
    };

    onResourcesChange([...resources, newResource]);
    setResourceForm({
      type: 'link',
      title: '',
      description: '',
      url: '',
      file: null
    });
    setShowAddModal(false);
  };

  const handleEditResource = (resource: AssignmentResource) => {
    setEditingResource(resource);
    setResourceForm({
      type: resource.type,
      title: resource.title,
      description: resource.description || '',
      url: resource.url,
      file: null
    });
    setShowAddModal(true);
  };

  const handleUpdateResource = () => {
    if (!editingResource || !resourceForm.title.trim() || !resourceForm.url.trim()) {
      return;
    }

    const updatedResource: AssignmentResource = {
      ...editingResource,
      type: resourceForm.type,
      title: resourceForm.title.trim(),
      description: resourceForm.description.trim() || undefined,
      url: resourceForm.url.trim(),
      size: resourceForm.type === 'document' && resourceForm.file ? resourceForm.file.size : editingResource.size,
      mimeType: resourceForm.type === 'document' && resourceForm.file ? resourceForm.file.type : editingResource.mimeType,
      uploadedAt: resourceForm.type === 'document' && resourceForm.file ? new Date().toISOString() : editingResource.uploadedAt,
    };

    onResourcesChange(resources.map(r => r.id === editingResource.id ? updatedResource : r));
    setEditingResource(null);
    setResourceForm({
      type: 'link',
      title: '',
      description: '',
      url: '',
      file: null
    });
    setShowAddModal(false);
  };

  const handleDeleteResource = (resourceId: string) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      onResourcesChange(resources.filter(r => r.id !== resourceId));
    }
  };

  const handleFileUpload = async (file: File) => {
    // In a real implementation, you would upload the file to S3 or your storage service
    // For now, we'll create a data URL
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResourceForm(prev => ({ ...prev, file }));
      const url = await handleFileUpload(file);
      setResourceForm(prev => ({ ...prev, url }));
    }
  };

  const getFileIcon = (resource: AssignmentResource) => {
    if (resource.type === 'link') {
      return <LinkIcon className="w-5 h-5 text-blue-500" />;
    }
    
    if (resource.mimeType?.startsWith('image/')) {
      return <DocumentIcon className="w-5 h-5 text-green-500" />;
    }
    
    if (resource.mimeType?.includes('pdf')) {
      return <DocumentIcon className="w-5 h-5 text-red-500" />;
    }
    
    if (resource.mimeType?.includes('word') || resource.mimeType?.includes('document')) {
      return <DocumentIcon className="w-5 h-5 text-blue-600" />;
    }
    
    return <DocumentIcon className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Assignment Resources ({resources.length})
        </h3>
        {!disabled && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Resource</span>
          </button>
        )}
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <DocumentIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No resources added yet.</p>
          <p className="text-sm">Add documents and links to help students with this assignment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => (
            <div key={resource.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getFileIcon(resource)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">{resource.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        resource.type === 'link' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {resource.type === 'link' ? 'Link' : 'Document'}
                      </span>
                    </div>
                    {resource.description && (
                      <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                      >
                        <span>View Resource</span>
                        <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                      </a>
                      {resource.size && (
                        <span>{formatFileSize(resource.size)}</span>
                      )}
                      {resource.uploadedAt && (
                        <span>Uploaded {new Date(resource.uploadedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                {!disabled && (
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEditResource(resource)}
                      className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Edit resource"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteResource(resource.id)}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete resource"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {editingResource ? 'Edit Resource' : 'Add New Resource'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resource Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="resourceType"
                        value="link"
                        checked={resourceForm.type === 'link'}
                        onChange={(e) => setResourceForm(prev => ({ ...prev, type: e.target.value as 'link' }))}
                        className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Link</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="resourceType"
                        value="document"
                        checked={resourceForm.type === 'document'}
                        onChange={(e) => setResourceForm(prev => ({ ...prev, type: e.target.value as 'document' }))}
                        className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Document</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={resourceForm.title}
                    onChange={(e) => setResourceForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Assignment Instructions, Reference Material"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={resourceForm.description}
                    onChange={(e) => setResourceForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description of this resource"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {resourceForm.type === 'link' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL *
                    </label>
                    <input
                      type="url"
                      value={resourceForm.url}
                      onChange={(e) => setResourceForm(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document *
                    </label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, MP4, MP3
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingResource(null);
                    setResourceForm({
                      type: 'link',
                      title: '',
                      description: '',
                      url: '',
                      file: null
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={editingResource ? handleUpdateResource : handleAddResource}
                  disabled={!resourceForm.title.trim() || !resourceForm.url.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingResource ? 'Update Resource' : 'Add Resource'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentResourcesManager;
