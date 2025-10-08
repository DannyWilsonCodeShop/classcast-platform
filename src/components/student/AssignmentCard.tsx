'use client';

import React from 'react';
import { Assignment } from '@/types/dynamodb';
import { AssignmentType, AssignmentStatus } from '@/types/dynamodb';

export interface AssignmentCardProps {
  assignment: Assignment;
  onViewDetails: () => void;
  showCourseInfo?: boolean;
  showInstructorInfo?: boolean;
  compact?: boolean;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onViewDetails,
  showCourseInfo = true,
  showInstructorInfo = false,
  compact = false,
}) => {
  // Format due date
  const formatDueDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Due ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  // Get status color and text
  const getStatusInfo = (status: AssignmentStatus) => {
    switch (status) {
      case AssignmentStatus.PUBLISHED:
        return { color: 'bg-green-100 text-green-800', text: 'Published' };
      case AssignmentStatus.DRAFT:
        return { color: 'bg-gray-100 text-gray-800', text: 'Draft' };
      case AssignmentStatus.CLOSED:
        return { color: 'bg-red-100 text-red-800', text: 'Closed' };
      case AssignmentStatus.ARCHIVED:
        return { color: 'bg-gray-100 text-gray-600', text: 'Archived' };
      default:
        return { color: 'bg-blue-100 text-blue-800', text: status };
    }
  };

  // Get type icon and color
  const getTypeInfo = (type: AssignmentType) => {
    switch (type) {
      case AssignmentType.VIDEO_ASSIGNMENT:
        return { icon: '🎥', color: 'bg-blue-100 text-blue-800', text: 'Video Assignment' };
      case AssignmentType.VIDEO_DISCUSSION:
        return { icon: '💬', color: 'bg-green-100 text-green-800', text: 'Video Discussion' };
      case AssignmentType.VIDEO_ASSESSMENT:
        return { icon: '📝', color: 'bg-purple-100 text-purple-800', text: 'Video Assessment' };
      default:
        return { icon: '📄', color: 'bg-gray-100 text-gray-800', text: type };
    }
  };

  // Get urgency level for due date
  const getUrgencyLevel = (dateString: string): 'low' | 'medium' | 'high' | 'overdue' => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'high';
    if (diffDays <= 7) return 'medium';
    return 'low';
  };

  const urgencyLevel = getUrgencyLevel(assignment.dueDate);
  const statusInfo = getStatusInfo(assignment.status);
  const typeInfo = getTypeInfo(assignment.assignmentType);

  if (compact) {
    return (
      <div className={`rounded-lg border-2 p-4 transition-all duration-200 ${
        assignment.isPinned && assignment.isHighlighted
          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-400 shadow-lg'
          : assignment.isPinned
          ? 'bg-yellow-50 border-yellow-300 shadow-md'
          : assignment.isHighlighted
          ? 'bg-orange-50 border-orange-300 shadow-md'
          : 'bg-white border-gray-200 hover:shadow-md'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              {assignment.emoji && (
                <span className="text-lg">{assignment.emoji}</span>
              )}
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {assignment.title}
              </h3>
            </div>
            {showCourseInfo && (
              <p className="text-xs text-gray-500 mt-1">
                {assignment.courseId}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
              {typeInfo.icon} {typeInfo.text}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex flex-col">
            <span className={`font-medium ${
              urgencyLevel === 'overdue' ? 'text-red-600' :
              urgencyLevel === 'high' ? 'text-orange-600' :
              urgencyLevel === 'medium' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              Video: {formatDueDate(assignment.dueDate)}
            </span>
            {assignment.enablePeerResponses && assignment.responseDueDate && (
              <span className="text-xs text-gray-500 mt-1">
                Responses: {formatDueDate(assignment.responseDueDate)}
              </span>
            )}
          </div>
          <span className="font-medium">
            {assignment.maxScore} pts
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border-2 p-6 transition-all duration-200 ${
      assignment.isPinned && assignment.isHighlighted
        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-400 shadow-lg'
        : assignment.isPinned
        ? 'bg-yellow-50 border-yellow-300 shadow-md'
        : assignment.isHighlighted
        ? 'bg-orange-50 border-orange-300 shadow-md'
        : 'bg-white border-gray-200 hover:shadow-lg hover:border-blue-300'
    }`}>
      {/* Pin/Highlight Indicators */}
      {(assignment.isPinned || assignment.isHighlighted) && (
        <div className="flex items-center space-x-2 mb-4">
          {assignment.isPinned && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
              <span>📌</span>
              <span>Pinned</span>
            </div>
          )}
          {assignment.isHighlighted && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
              <span>⭐</span>
              <span>Highlighted</span>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            {assignment.emoji && (
              <span className="text-2xl">{assignment.emoji}</span>
            )}
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {assignment.title}
            </h3>
          </div>
          <p className="text-sm text-gray-600 line-clamp-3">
            {assignment.description}
          </p>
        </div>
        <div className="flex items-center space-x-2 ml-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
            {typeInfo.icon} {typeInfo.text}
          </span>
        </div>
      </div>

      {/* Cover Photo */}
      {assignment.coverPhoto && (
        <div className="mb-4">
          <img
            src={assignment.coverPhoto}
            alt="Assignment cover"
            className="w-full h-32 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Course and Instructor Info */}
      {(showCourseInfo || showInstructorInfo) && (
        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
          {showCourseInfo && (
            <div className="flex items-center">
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>{assignment.courseId}</span>
            </div>
          )}
          {showInstructorInfo && (
            <div className="flex items-center">
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{assignment.instructorId}</span>
            </div>
          )}
        </div>
      )}

      {/* Requirements */}
      {assignment.requirements && assignment.requirements.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Requirements:</h4>
          <ul className="space-y-1">
            {assignment.requirements.slice(0, 3).map((req, index) => (
              <li key={index} className="flex items-start text-sm text-gray-600">
                <span className="text-blue-500 mr-2">•</span>
                <span className="line-clamp-2">{req}</span>
              </li>
            ))}
            {assignment.requirements.length > 3 && (
              <li className="text-xs text-gray-500 italic">
                +{assignment.requirements.length - 3} more requirements
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Assignment Details */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center">
          <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex flex-col">
            <div className="flex items-center">
              <span className="text-gray-600">Video:</span>
              <span className={`ml-2 font-medium ${
                urgencyLevel === 'overdue' ? 'text-red-600' :
                urgencyLevel === 'high' ? 'text-orange-600' :
                urgencyLevel === 'medium' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {formatDueDate(assignment.dueDate)}
              </span>
            </div>
            {assignment.enablePeerResponses && assignment.responseDueDate && (
              <div className="flex items-center mt-1">
                <span className="text-gray-500 text-xs">Responses:</span>
                <span className="ml-2 text-xs text-gray-500">
                  {formatDueDate(assignment.responseDueDate)}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center">
          <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-gray-600">Points:</span>
          <span className="ml-2 font-medium text-gray-900">{assignment.maxScore}</span>
        </div>
        {assignment.weight && (
          <div className="flex items-center">
            <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <span className="text-gray-600">Weight:</span>
            <span className="ml-2 font-medium text-gray-900">{assignment.weight}%</span>
          </div>
        )}
        {assignment.maxSubmissions && (
          <div className="flex items-center">
            <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-gray-600">Submissions:</span>
            <span className="ml-2 font-medium text-gray-900">{assignment.maxSubmissions}</span>
          </div>
        )}
        {assignment.requireLiveRecording && (
          <div className="flex items-center">
            <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-600">Live Recording:</span>
            <span className="ml-2 font-medium text-red-600">Required</span>
          </div>
        )}
      </div>

      {/* File Type and Size Info */}
      {(assignment.allowedFileTypes || assignment.maxFileSize) && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Submission Details:</h4>
          <div className="flex flex-wrap gap-2 text-xs">
            {assignment.allowedFileTypes && assignment.allowedFileTypes.length > 0 && (
              <div className="flex items-center">
                <svg className="h-3 w-3 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-gray-600">Types: {assignment.allowedFileTypes.join(', ')}</span>
              </div>
            )}
            {assignment.maxFileSize && (
              <div className="flex items-center">
                <svg className="h-3 w-3 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-14 0h14" />
                </svg>
                <span className="text-gray-600">Max: {(assignment.maxFileSize / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={onViewDetails}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          View Details
        </button>
      </div>
    </div>
  );
};






