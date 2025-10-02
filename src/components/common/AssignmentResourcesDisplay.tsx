'use client';

import React from 'react';
import { LinkIcon, DocumentIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { AssignmentResource } from '@/types/dynamodb';

interface AssignmentResourcesDisplayProps {
  resources: AssignmentResource[];
  className?: string;
}

const AssignmentResourcesDisplay: React.FC<AssignmentResourcesDisplayProps> = ({
  resources,
  className = ''
}) => {
  if (!resources || resources.length === 0) {
    return null;
  }

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
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-gray-900">Assignment Resources</h4>
      <div className="space-y-2">
        {resources.map((resource) => (
          <div key={resource.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors">
            <div className="flex items-start space-x-3">
              {getFileIcon(resource)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h5 className="font-medium text-gray-900 truncate">{resource.title}</h5>
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
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssignmentResourcesDisplay;
