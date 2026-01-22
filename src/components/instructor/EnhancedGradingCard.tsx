'use client';

import React from 'react';
import { LazyVideoPlayer } from './LazyVideoPlayer';
import { SectionIndicator } from './SectionIndicator';

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

interface EnhancedGradingCardProps {
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
  showSectionHeader?: boolean;
}

export const EnhancedGradingCard: React.FC<EnhancedGradingCardProps> = ({
  submission,
  assignment,
  grades,
  feedbackState,
  savingGrades,
  onGradeChange,
  onFeedbackChange,
  loadingPriority,
  index,
  totalSubmissions,
  showSectionHeader = true
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Section Header (if different from previous) */}
      {showSectionHeader && (
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SectionIndicator 
                sectionName={submission.sectionName}
                sectionId={submission.sectionId}
                size="lg"
                className="bg-white text-gray-800"
              />
              <span className="text-white text-sm">
                Section Overview
              </span>
            </div>
            <div className="text-white text-sm">
              Student #{index + 1} of {totalSubmissions}
            </div>
          </div>
        </div>
      )}

      {/* Student Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-xl font-bold text-gray-800">{submission.studentName}</h2>
              <SectionIndicator 
                sectionName={submission.sectionName}
                sectionId={submission.sectionId}
                size="md"
              />
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                submission.status === 'graded' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {submission.status === 'graded' ? '✅ Graded' : '⏳ Pending Grade'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <span>📧</span>
                <span>{submission.studentEmail}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>📅</span>
                <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>⏱️</span>
                <span>{formatDuration(submission.duration)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>📁</span>
                <span>{formatFileSize(submission.fileSize)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Video Player with Smart Loading */}
        <div className="lg:col-span-2">
          <div className="relative">
            <LazyVideoPlayer
              videoUrl={submission.videoUrl}
              studentName={submission.studentName}
              submissionId={submission.submissionId}
              loadingStrategy={loadingPriority}
              thumbnailUrl={submission.thumbnailUrl}
            />
            
            {/* Video overlay info */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
              {submission.sectionName || 'No Section'} • {submission.studentName}
            </div>
          </div>
        </div>

        {/* Enhanced Grading Panel */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="text-center border-b border-gray-200 pb-3">
              <h3 className="font-semibold text-gray-800">Grading Panel</h3>
              <p className="text-sm text-gray-600">
                {submission.sectionName || 'No Section Assigned'}
              </p>
            </div>

            {/* Grade Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade (out of {assignment.maxScore})
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={assignment.maxScore}
                  value={grades[submission.submissionId] ?? submission.grade ?? ''}
                  onChange={(e) => onGradeChange(submission.submissionId, e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                  placeholder="Enter grade"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                  / {assignment.maxScore}
                </div>
              </div>
            </div>

            {/* Grade Percentage */}
            {(grades[submission.submissionId] || submission.grade) && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(((grades[submission.submissionId] || submission.grade || 0) / assignment.maxScore) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Percentage Score</div>
              </div>
            )}

            {/* Feedback Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback for {submission.studentName}
              </label>
              <textarea
                value={feedbackState[submission.submissionId] ?? submission.feedback ?? ''}
                onChange={(e) => onFeedbackChange(submission.submissionId, e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter constructive feedback for the student..."
              />
              <div className="text-xs text-gray-500 mt-1">
                Character count: {(feedbackState[submission.submissionId] ?? submission.feedback ?? '').length}
              </div>
            </div>

            {/* Save Status */}
            <div className="border-t border-gray-200 pt-3">
              {savingGrades.has(submission.submissionId) && (
                <div className="text-sm text-blue-600 flex items-center justify-center space-x-2 bg-blue-50 py-2 rounded">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Auto-saving...</span>
                </div>
              )}
              {!savingGrades.has(submission.submissionId) && submission.status === 'graded' && (
                <div className="text-sm text-green-600 flex items-center justify-center space-x-2 bg-green-50 py-2 rounded">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Grade Saved Successfully</span>
                </div>
              )}
              {!savingGrades.has(submission.submissionId) && submission.status === 'submitted' && (
                <div className="text-sm text-gray-600 flex items-center justify-center space-x-2 bg-gray-100 py-2 rounded">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  <span>Ready to Grade</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Section: <strong>{submission.sectionName || 'Unassigned'}</strong></span>
            <span>Student ID: {submission.studentId}</span>
            <span>Submission: {submission.submissionId.slice(-8)}</span>
          </div>
          <div>
            Position: #{index + 1} of {totalSubmissions}
          </div>
        </div>
      </div>
    </div>
  );
};