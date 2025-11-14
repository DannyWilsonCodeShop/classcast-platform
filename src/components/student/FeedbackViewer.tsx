'use client';
import React, { useState } from 'react';

export interface RubricScore {
  criterion: string;
  points: number;
  maxPoints: number;
  feedback?: string;
}

export interface FeedbackViewerProps {
  feedback: string;
  rubricScores?: RubricScore[];
  instructorNotes?: string;
  className?: string;
}

export const FeedbackViewer: React.FC<FeedbackViewerProps> = ({
  feedback,
  rubricScores,
  instructorNotes,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'feedback' | 'rubric' | 'notes'>('feedback');

  const tabs = [
    { id: 'feedback', label: 'Feedback', count: 1 },
    { id: 'rubric', label: 'Rubric Scores', count: rubricScores?.length || 0 },
    { id: 'notes', label: 'Instructor Notes', count: instructorNotes ? 1 : 0 },
  ].filter(tab => tab.count > 0);

  const getScoreColor = (points: number, maxPoints: number) => {
    const percentage = (points / maxPoints) * 100;
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (points: number, maxPoints: number) => {
    const percentage = (points / maxPoints) * 100;
    if (percentage >= 90) return '🎯';
    if (percentage >= 80) return '👍';
    if (percentage >= 70) return '👌';
    if (percentage >= 60) return '⚠️';
    return '❌';
  };

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Feedback tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Tab Content */}
      <div className="p-6">
        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div role="tabpanel" id="feedback-panel" aria-labelledby="feedback-tab">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Instructor Feedback</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-blue-900 whitespace-pre-wrap leading-relaxed">{feedback}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rubric Tab */}
        {activeTab === 'rubric' && rubricScores && (
          <div role="tabpanel" id="rubric-panel" aria-labelledby="rubric-tab">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Rubric Assessment</h4>
            <div className="space-y-4">
              {rubricScores.map((score, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-900">{score.criterion}</h5>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(score.points, score.maxPoints)}`}>
                        {getScoreIcon(score.points, score.maxPoints)} {score.points}/{score.maxPoints}
                      </span>
                    </div>
                  </div>
                  
                  {/* Score Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      role="progressbar"
                      aria-label={`${score.criterion} progress`}
                      aria-valuemin={0}
                      aria-valuemax={score.maxPoints}
                      aria-valuenow={score.points}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        (score.points / score.maxPoints) >= 0.9 ? 'bg-green-500' :
                        (score.points / score.maxPoints) >= 0.8 ? 'bg-blue-500' :
                        (score.points / score.maxPoints) >= 0.7 ? 'bg-yellow-500' :
                        (score.points / score.maxPoints) >= 0.6 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${(score.points / score.maxPoints) * 100}%` }}
                    />
                  </div>
                  
                  {/* Criterion Feedback */}
                  {score.feedback && (
                    <div className="bg-white border border-gray-200 rounded-md p-3">
                      <p className="text-sm text-gray-700">{score.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Overall Rubric Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Total Rubric Score</span>
                  <span className="text-lg font-bold text-blue-900">
                    {rubricScores.reduce((sum, score) => sum + score.points, 0)} / {rubricScores.reduce((sum, score) => sum + score.maxPoints, 0)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-blue-700">
                  {((rubricScores.reduce((sum, score) => sum + score.points, 0) / rubricScores.reduce((sum, score) => sum + score.maxPoints, 0)) * 100).toFixed(1)}% of total possible points
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && instructorNotes && (
          <div role="tabpanel" id="notes-panel" aria-labelledby="notes-tab">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Instructor Notes</h4>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-yellow-900 whitespace-pre-wrap leading-relaxed">{instructorNotes}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

