'use client';

import React from 'react';
import RichTextRenderer from '@/components/common/RichTextRenderer';

interface Assignment {
  assignmentId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  status: 'draft' | 'published' | 'grading' | 'completed';
  submissionType: 'text' | 'file' | 'video';
  submissionsCount: number;
  gradedCount: number;
  averageGrade?: number;
  createdAt: string;
  // Peer Review Settings
  enablePeerResponses?: boolean;
  minResponsesRequired?: number;
  maxResponsesPerVideo?: number;
  responseDueDate?: string;
  responseWordLimit?: number;
  responseCharacterLimit?: number;
  hidePeerVideosUntilInstructorPosts?: boolean;
  peerReviewScope?: 'section' | 'course';
  // Video Settings
  requireLiveRecording?: boolean;
  allowYouTubeUrl?: boolean;
  // Other Settings
  allowLateSubmission?: boolean;
  latePenalty?: number;
  maxSubmissions?: number;
  groupAssignment?: boolean;
  maxGroupSize?: number;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  resources?: any[];
}

interface AssignmentDetailsModalProps {
  assignment: Assignment;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const AssignmentDetailsModal: React.FC<AssignmentDetailsModalProps> = ({
  assignment,
  isOpen,
  onClose,
  onEdit
}) => {
  if (!isOpen) return null;

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                📝
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{assignment.title}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>📅 Due {formatDate(assignment.dueDate)}</span>
                  <span>⭐ {assignment.points} points</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    assignment.status === 'published' ? 'bg-green-100 text-green-800' :
                    assignment.status === 'grading' ? 'bg-yellow-100 text-yellow-800' :
                    assignment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                ✏️ Edit Assignment
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Assignment Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Assignment Description</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <RichTextRenderer 
                content={assignment.description}
                className="text-gray-700 leading-relaxed"
              />
            </div>
          </div>

          {/* Submission Statistics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Submission Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-2xl font-bold text-blue-600 mb-1">{assignment.submissionsCount}</div>
                <div className="text-sm text-blue-700">Total Submissions</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-600 mb-1">{assignment.gradedCount}</div>
                <div className="text-sm text-green-700">Graded</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {assignment.submissionsCount - assignment.gradedCount}
                </div>
                <div className="text-sm text-orange-700">Pending Review</div>
              </div>
            </div>
          </div>

          {/* Assignment Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">⚙️ Assignment Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Settings */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">Basic Settings</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Submission Type</span>
                    <span className="font-medium capitalize">{assignment.submissionType}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Max Points</span>
                    <span className="font-medium">{assignment.points}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Late Submissions</span>
                    <span className="font-medium">
                      {assignment.allowLateSubmission ? 
                        `Allowed (${assignment.latePenalty}% penalty)` : 
                        'Not Allowed'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Max Submissions</span>
                    <span className="font-medium">{assignment.maxSubmissions || 1}</span>
                  </div>
                </div>
              </div>

              {/* Video Settings */}
              {assignment.submissionType === 'video' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">Video Settings</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Live Recording Required</span>
                      <span className="font-medium">
                        {assignment.requireLiveRecording ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">YouTube URLs Allowed</span>
                      <span className="font-medium">
                        {assignment.allowYouTubeUrl ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    {assignment.maxFileSize && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Max File Size</span>
                        <span className="font-medium">{formatFileSize(assignment.maxFileSize)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Peer Review Settings */}
          {assignment.enablePeerResponses && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">👥 Peer Review Settings</h3>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">Peer Reviews Enabled</span>
                      <span className="font-medium text-blue-800">✅ Yes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">Min Responses Required</span>
                      <span className="font-medium text-blue-800">{assignment.minResponsesRequired || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">Max Responses Per Video</span>
                      <span className="font-medium text-blue-800">{assignment.maxResponsesPerVideo || 'Unlimited'}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {assignment.responseDueDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">Response Due Date</span>
                        <span className="font-medium text-blue-800">
                          {new Date(assignment.responseDueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">Word Limit</span>
                      <span className="font-medium text-blue-800">{assignment.responseWordLimit || 'No limit'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">Review Scope</span>
                      <span className="font-medium text-blue-800 capitalize">{assignment.peerReviewScope || 'Course'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Group Assignment Settings */}
          {assignment.groupAssignment && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">👥 Group Assignment Settings</h3>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex justify-between items-center">
                  <span className="text-purple-700">Max Group Size</span>
                  <span className="font-medium text-purple-800">{assignment.maxGroupSize || 4} students</span>
                </div>
              </div>
            </div>
          )}

          {/* Resources */}
          {assignment.resources && assignment.resources.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📎 Assignment Resources</h3>
              <div className="space-y-2">
                {assignment.resources.map((resource, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm">
                      📄
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{resource.title || resource.name}</div>
                      {resource.description && (
                        <div className="text-sm text-gray-600">{resource.description}</div>
                      )}
                    </div>
                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                      >
                        View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assignment Dates */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📅 Important Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Created</div>
                <div className="font-medium text-gray-900">
                  {formatDate(assignment.createdAt)}
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="text-sm text-red-600 mb-1">Due Date</div>
                <div className="font-medium text-red-700">
                  {formatDate(assignment.dueDate)}
                </div>
              </div>
              {assignment.responseDueDate && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm text-blue-600 mb-1">Peer Responses Due</div>
                  <div className="font-medium text-blue-700">
                    {formatDate(assignment.responseDueDate)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Assignment ID: {assignment.assignmentId}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                ✏️ Edit Assignment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetailsModal;