/**
 * Virtualized grading feed - only renders visible submissions
 * Massive performance improvement for large assignment lists
 */

import React, { useRef, useEffect } from 'react';
import { useVirtualizedGrading } from '@/hooks/useVirtualizedGrading';
import { LazyVideoPlayer } from './LazyVideoPlayer';

interface VideoSubmission {
  submissionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  videoUrl: string;
  thumbnailUrl?: string;
  submittedAt: string;
  duration: number;
  fileSize: number;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
  sectionId?: string;
  sectionName?: string;
}

interface VirtualizedGradingFeedProps {
  submissions: VideoSubmission[];
  assignment: {
    maxScore: number;
  };
  grades: Record<string, number | ''>;
  feedbackState: Record<string, string>;
  savingGrades: Set<string>;
  onGradeChange: (submissionId: string, grade: string) => void;
  onFeedbackChange: (submissionId: string, feedback: string) => void;
}

const ITEM_HEIGHT = 600; // Height of each submission card
const CONTAINER_HEIGHT = typeof window !== 'undefined' ? Math.max(window.innerHeight - 150, 1000) : 1000;

export const VirtualizedGradingFeed: React.FC<VirtualizedGradingFeedProps> = ({
  submissions,
  assignment,
  grades,
  feedbackState,
  savingGrades,
  onGradeChange,
  onFeedbackChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    getLoadingPriority,
    isScrolling,
    renderedCount,
    totalCount,
    renderRatio
  } = useVirtualizedGrading(submissions, {
    itemHeight: ITEM_HEIGHT,
    overscan: 2, // Render 2 extra items above and below viewport
    containerHeight: CONTAINER_HEIGHT
  });

  // Auto-scroll to top when submissions change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [submissions.length]);

  return (
    <div className="space-y-4">
      {/* Performance indicator */}
      <div className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
        <div className="flex items-center space-x-4">
          <span>🚀 Virtualized rendering</span>
          <span>📊 Showing {renderedCount} of {totalCount} submissions</span>
          <span>⚡ {(renderRatio * 100).toFixed(1)}% DOM usage</span>
        </div>
        {isScrolling && (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Scrolling...</span>
          </div>
        )}
      </div>

      {/* Virtualized container */}
      <div
        ref={containerRef}
        className="relative overflow-auto"
        style={{ height: CONTAINER_HEIGHT }}
        onScroll={handleScroll}
      >
        {/* Total height spacer for scrollbar */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Visible items container */}
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {visibleItems.map((submission) => (
              <div
                key={submission.submissionId}
                style={{ height: ITEM_HEIGHT }}
                className="mb-6"
              >
                <SubmissionCard
                  submission={submission}
                  assignment={assignment}
                  grades={grades}
                  feedbackState={feedbackState}
                  savingGrades={savingGrades}
                  onGradeChange={onGradeChange}
                  onFeedbackChange={onFeedbackChange}
                  loadingPriority={getLoadingPriority(submission.absoluteIndex)}
                  index={submission.absoluteIndex}
                  totalSubmissions={totalCount}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance stats */}
      <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded">
        💡 Performance: Only rendering {renderedCount} components instead of {totalCount} 
        ({totalCount > 0 ? Math.round((1 - renderRatio) * 100) : 0}% reduction in DOM nodes)
      </div>
    </div>
  );
};

// Individual submission card component
interface SubmissionCardProps {
  submission: VideoSubmission & { absoluteIndex: number };
  assignment: { maxScore: number };
  grades: Record<string, number | ''>;
  feedbackState: Record<string, string>;
  savingGrades: Set<string>;
  onGradeChange: (submissionId: string, grade: string) => void;
  onFeedbackChange: (submissionId: string, feedback: string) => void;
  loadingPriority: 'immediate' | 'priority' | 'normal' | 'lazy';
  index: number;
  totalSubmissions: number;
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({
  submission,
  assignment,
  grades,
  feedbackState,
  savingGrades,
  onGradeChange,
  onFeedbackChange,
  loadingPriority,
  index,
  totalSubmissions
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Student Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{submission.studentName}</h2>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
              {submission.sectionName && (
                <>
                  <span>•</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {submission.sectionName}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">#{index + 1} of {totalSubmissions}</div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              submission.status === 'graded' 
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {submission.status === 'graded' ? '✓ Graded' : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Video Player with Smart Loading */}
        <div className="lg:col-span-2">
          <LazyVideoPlayer
            videoUrl={submission.videoUrl}
            studentName={submission.studentName}
            submissionId={submission.submissionId}
            loadingStrategy={loadingPriority}
            thumbnailUrl={submission.thumbnailUrl}
          />
        </div>

        {/* Grading Panel */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            {/* Grade Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade (out of {assignment.maxScore})
              </label>
              <input
                type="number"
                min="0"
                max={assignment.maxScore}
                value={grades[submission.submissionId] ?? submission.grade ?? ''}
                onChange={(e) => onGradeChange(submission.submissionId, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter grade"
              />
            </div>

            {/* Feedback Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback
              </label>
              <textarea
                value={feedbackState[submission.submissionId] ?? submission.feedback ?? ''}
                onChange={(e) => onFeedbackChange(submission.submissionId, e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter feedback for the student..."
              />
            </div>

            {/* Save Status */}
            {savingGrades.has(submission.submissionId) && (
              <div className="text-sm text-blue-600 flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving...</span>
              </div>
            )}
            {!savingGrades.has(submission.submissionId) && submission.status === 'graded' && (
              <div className="text-sm text-green-600 flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Saved</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};