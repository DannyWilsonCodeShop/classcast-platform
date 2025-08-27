'use client';
import React, { useState, useCallback } from 'react';
import { SubmissionData } from './SubmissionHistory';
import { VideoPlayer } from './VideoPlayer';
import { GradeDisplay } from './GradeDisplay';
import { FeedbackViewer } from './FeedbackViewer';

export interface SubmissionCardProps {
  submission: SubmissionData;
  className?: string;
}

export const SubmissionCard: React.FC<SubmissionCardProps> = ({
  submission,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'returned':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const handleFileSelect = useCallback((fileUrl: string) => {
    setSelectedFile(fileUrl);
    setExpanded(true);
  }, []);

  const handleCloseVideo = useCallback(() => {
    setSelectedFile(null);
    setExpanded(false);
  }, []);

  const isVideoFile = useCallback((fileType: string) => {
    return fileType.startsWith('video/');
  }, []);

  const hasVideoFiles = submission.files.some(file => isVideoFile(file.type));

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {submission.assignmentTitle}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                {submission.status}
              </span>
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p>Course: {submission.courseName}</p>
              <p>Submitted: {formatDate(submission.submittedAt)}</p>
              {submission.processedAt && (
                <p>Processed: {formatDate(submission.processedAt)}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasVideoFiles && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title={expanded ? 'Collapse' : 'Expand'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {expanded ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Grade and Feedback Summary */}
        {(submission.grade !== undefined || submission.feedback) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <GradeDisplay
              grade={submission.grade}
              maxScore={submission.maxScore}
              feedback={submission.feedback}
              compact={true}
            />
          </div>
        )}
      </div>

      {/* Files Section */}
      {submission.files.length > 0 && (
        <div className="px-6 pb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Submitted Files</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {submission.files.map((file, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  isVideoFile(file.type)
                    ? 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleFileSelect(file.url)}
              >
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0">
                    {isVideoFile(file.type) ? (
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Video Section */}
      {expanded && hasVideoFiles && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Video Playback</h4>
              <button
                onClick={handleCloseVideo}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedFile ? (
              <VideoPlayer
                videoUrl={selectedFile}
                onClose={handleCloseVideo}
                metadata={{
                  duration: submission.videoDuration,
                  resolution: submission.videoResolution,
                  processingDuration: submission.processingDuration,
                }}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2">Select a video file to play</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Feedback Section */}
      {expanded && submission.feedback && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-6">
            <FeedbackViewer
              feedback={submission.feedback}
              rubricScores={submission.metadata?.rubricScores}
              instructorNotes={submission.metadata?.instructorNotes}
            />
          </div>
        </div>
      )}

      {/* Metadata Section */}
      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Submission Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p><span className="font-medium">Submission ID:</span> {submission.submissionId}</p>
                <p><span className="font-medium">Assignment ID:</span> {submission.assignmentId}</p>
                <p><span className="font-medium">Course ID:</span> {submission.courseId}</p>
              </div>
              <div>
                <p><span className="font-medium">Status:</span> {submission.status}</p>
                <p><span className="font-medium">Files:</span> {submission.files.length}</p>
                {submission.metadata?.submissionMethod && (
                  <p><span className="font-medium">Method:</span> {submission.metadata.submissionMethod}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};





