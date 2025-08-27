'use client';
import React, { useState, useCallback } from 'react';
import { InstructorSubmissionData } from './types';
import { VideoPlayer } from '../student/VideoPlayer';
import { GradeDisplay } from '../student/GradeDisplay';

export interface InstructorSubmissionCardProps {
  submission: InstructorSubmissionData;
  isSelected: boolean;
  onSelect: (submissionId: string, selected: boolean) => void;
  onGrade: (submission: InstructorSubmissionData) => void;
  instructorId: string;
  className?: string;
}

export const InstructorSubmissionCard: React.FC<InstructorSubmissionCardProps> = ({
  submission,
  isSelected,
  onSelect,
  onGrade,
  instructorId,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<string | null>(null);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'needs_review':
        return 'bg-orange-100 text-orange-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'returned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getReviewStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const hasVideoFiles = submission.files.some(file => 
    file.type.startsWith('video/')
  );

  const handleVideoFileClick = useCallback((fileUrl: string) => {
    setSelectedVideoFile(fileUrl);
    setShowVideoPlayer(true);
  }, []);

  const handleCloseVideo = useCallback(() => {
    setShowVideoPlayer(false);
    setSelectedVideoFile(null);
  }, []);

  const handleSelect = useCallback(() => {
    onSelect(submission.submissionId, !isSelected);
  }, [onSelect, submission.submissionId, isSelected]);

  const handleGrade = useCallback(() => {
    onGrade(submission);
  }, [onGrade, submission]);

  const isOverdue = new Date(submission.dueDate) < new Date();

  return (
    <>
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}>
        {/* Header with Selection and Priority */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3 flex-1">
              {/* Selection Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleSelect}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              
              {/* Assignment Title */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {submission.assignmentTitle}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Course: {submission.courseName}
                </p>
              </div>
            </div>

            {/* Status and Priority Badges */}
            <div className="flex items-center space-x-2 ml-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                {submission.status.replace('_', ' ')}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(submission.priority)}`}>
                {submission.priority} Priority
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReviewStatusColor(submission.reviewStatus)}`}>
                {submission.reviewStatus.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Student Info and Due Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {submission.studentName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {submission.studentName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {submission.studentEmail}
                </p>
              </div>
            </div>

            {/* Due Date and Late Indicator */}
            <div className="text-right">
              <p className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                Due: {formatDate(submission.dueDate)}
              </p>
              {submission.isLate && (
                <p className="text-xs text-red-600 font-medium">LATE</p>
              )}
              {submission.estimatedGradingTime && (
                <p className="text-xs text-gray-500">
                  Est. {submission.estimatedGradingTime} min
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content Preview */}
        <div className="p-4">
          {/* Grade Display (if graded) */}
          {submission.grade !== undefined && (
            <div className="mb-4">
              <GradeDisplay
                grade={submission.grade}
                maxScore={submission.maxScore}
                feedback={submission.feedback}
                compact={true}
              />
            </div>
          )}

          {/* Instructor Notes */}
          {submission.instructorNotes && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="text-sm font-medium text-yellow-800 mb-1">Instructor Notes</h4>
              <p className="text-sm text-yellow-700">{submission.instructorNotes}</p>
            </div>
          )}

          {/* Files Preview */}
          {submission.files.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Submitted Files</h4>
              <div className="space-y-2">
                {submission.files.slice(0, 3).map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-2 rounded-md border cursor-pointer transition-colors ${
                      file.type.startsWith('video/')
                        ? 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => file.type.startsWith('video/') && handleVideoFileClick(file.url)}
                  >
                    <div className="flex-shrink-0 mr-3">
                      {file.type.startsWith('video/') ? (
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {submission.files.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{submission.files.length - 3} more files
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {submission.tags.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {submission.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleGrade}
                disabled={submission.status === 'graded'}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  submission.status === 'graded'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {submission.status === 'graded' ? 'Already Graded' : 'Grade Submission'}
              </button>

              {hasVideoFiles && (
                <button
                  onClick={() => setExpanded(true)}
                  className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Watch Video
                </button>
              )}
            </div>

            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              {expanded ? 'Show Less' : 'Show More'}
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="space-y-4">
              {/* Submission Details */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Submission Details</h4>
                <div className="bg-gray-50 rounded-md p-3 text-sm space-y-1">
                  <p><span className="font-medium">Submission ID:</span> {submission.id}</p>
                  <p><span className="font-medium">Student ID:</span> {submission.studentId}</p>
                  <p><span className="font-medium">Assignment ID:</span> {submission.assignmentId}</p>
                  <p><span className="font-medium">Course ID:</span> {submission.courseId}</p>
                  <p><span className="font-medium">Submitted:</span> {formatDate(submission.submittedAt)}</p>
                  {submission.processedAt && (
                    <p><span className="font-medium">Processed:</span> {formatDate(submission.processedAt)}</p>
                  )}
                  <p><span className="font-medium">Due Date:</span> {formatDate(submission.dueDate)}</p>
                  <p><span className="font-medium">Is Late:</span> {submission.isLate ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {/* Video Metadata */}
              {submission.videoDuration && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Video Information</h4>
                  <div className="bg-gray-50 rounded-md p-3 text-sm space-y-1">
                    <p><span className="font-medium">Duration:</span> {Math.floor(submission.videoDuration / 60)}:{String(submission.videoDuration % 60).padStart(2, '0')}</p>
                    {submission.videoResolution && (
                      <p><span className="font-medium">Resolution:</span> {submission.videoResolution.width}×{submission.videoResolution.height}</p>
                    )}
                    {submission.processingDuration && (
                      <p><span className="font-medium">Processing Time:</span> {submission.processingDuration}s</p>
                    )}
                  </div>
                </div>
              )}

              {/* Peer Reviews */}
              {submission.peerReviews && submission.peerReviews.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Peer Reviews</h4>
                  <div className="space-y-2">
                    {submission.peerReviews.map((review, index) => (
                      <div key={index} className="bg-gray-50 rounded-md p-3 text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{review.reviewerName}</span>
                          <span className="text-gray-600">
                            {review.score}/{review.maxScore}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.feedback}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(review.submittedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Comments */}
              {submission.comments && submission.comments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Student Comments</h4>
                  <div className="space-y-2">
                    {submission.comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-md p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{comment.authorName}</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {showVideoPlayer && selectedVideoFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative w-full max-w-4xl mx-4">
            <VideoPlayer
              videoUrl={selectedVideoFile}
              onClose={handleCloseVideo}
              metadata={{
                duration: submission.videoDuration,
                resolution: submission.videoResolution,
                processingDuration: submission.processingDuration,
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};
