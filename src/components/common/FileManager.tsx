'use client';

import React, { useState, useEffect } from 'react';
import { UploadedFile } from './FileUpload';

export interface FileManagerProps {
  files: UploadedFile[];
  onFileDelete?: (fileId: string) => void;
  onFileDownload?: (file: UploadedFile) => void;
  canDelete?: boolean;
  canDownload?: boolean;
  groupBy?: 'category' | 'week' | 'module' | 'none';
  className?: string;
}

const FileManager: React.FC<FileManagerProps> = ({
  files,
  onFileDelete,
  onFileDownload,
  canDelete = false,
  canDownload = true,
  groupBy = 'category',
  className = ''
}) => {
  const [groupedFiles, setGroupedFiles] = useState<Record<string, UploadedFile[]>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (groupBy === 'none') {
      setGroupedFiles({ 'All Files': files });
    } else {
      const grouped = files.reduce((acc, file) => {
        let key: string;
        
        switch (groupBy) {
          case 'category':
            key = file.category || 'Other';
            break;
          case 'week':
            key = file.week ? `Week ${file.week}` : 'No Week';
            break;
          case 'module':
            key = file.module || 'No Module';
            break;
          default:
            key = 'All Files';
        }
        
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(file);
        return acc;
      }, {} as Record<string, UploadedFile[]>);
      
      setGroupedFiles(grouped);
    }
  }, [files, groupBy]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('compressed')) return '🗜️';
    if (fileType.includes('text')) return '📋';
    return '📁';
  };

  const getCategoryDisplayName = (category: string): string => {
    const categoryNames: Record<string, string> = {
      'syllabus': 'Syllabus',
      'lecture': 'Lecture Materials',
      'reading': 'Readings',
      'resource': 'Resources',
      'assignment_template': 'Assignment Templates',
      'rubric': 'Rubrics',
      'instruction': 'Instructions',
      'template': 'Templates',
      'other': 'Other Files'
    };
    return categoryNames[category] || category;
  };

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const handleDownload = (file: UploadedFile) => {
    if (onFileDownload) {
      onFileDownload(file);
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = file.fileUrl;
      link.download = file.originalName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = (fileId: string) => {
    if (onFileDelete && window.confirm('Are you sure you want to delete this file?')) {
      onFileDelete(fileId);
    }
  };

  if (files.length === 0) {
    return (
      <div className={`file-manager ${className}`}>
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No files uploaded yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`file-manager ${className}`}>
      <div className="space-y-4">
        {Object.entries(groupedFiles).map(([groupName, groupFiles]) => (
          <div key={groupName} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Group Header */}
            <div 
              className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleGroup(groupName)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg 
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      expandedGroups.has(groupName) ? 'rotate-90' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <h3 className="text-sm font-medium text-gray-900">
                    {getCategoryDisplayName(groupName)}
                  </h3>
                </div>
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                  {groupFiles.length} file{groupFiles.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Group Content */}
            {expandedGroups.has(groupName) && (
              <div className="divide-y divide-gray-200">
                {groupFiles.map((file) => (
                  <div key={file.fileId} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="text-2xl">
                          {getFileIcon(file.fileType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.originalName}
                            </p>
                            {!file.isPublic && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Private
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.fileSize)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(file.uploadedAt).toLocaleDateString()}
                            </p>
                            {file.week && (
                              <p className="text-xs text-gray-500">
                                Week {file.week}
                              </p>
                            )}
                            {file.module && (
                              <p className="text-xs text-gray-500">
                                {file.module}
                              </p>
                            )}
                          </div>
                          {file.description && (
                            <p className="text-xs text-gray-600 mt-1">
                              {file.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        {canDownload && (
                          <button
                            onClick={() => handleDownload(file)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Download file"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        )}
                        
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(file.fileId)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete file"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileManager;