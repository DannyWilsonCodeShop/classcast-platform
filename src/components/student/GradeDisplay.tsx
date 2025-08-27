'use client';
import React, { useMemo } from 'react';

export interface GradeDisplayProps {
  grade: number;
  maxScore: number;
  feedback?: string;
  compact?: boolean;
  showPercentage?: boolean;
  className?: string;
}

export const GradeDisplay: React.FC<GradeDisplayProps> = ({
  grade,
  maxScore,
  feedback,
  compact = false,
  showPercentage = true,
  className = '',
}) => {
  const percentage = useMemo(() => {
    return Math.round((grade / maxScore) * 100);
  }, [grade, maxScore]);

  const gradeLetter = useMemo(() => {
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
  }, [percentage]);

  const gradeColor = useMemo(() => {
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (percentage >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  }, [percentage]);

  const scoreColor = useMemo(() => {
    if (percentage >= 90) return 'text-green-700';
    if (percentage >= 80) return 'text-blue-700';
    if (percentage >= 70) return 'text-yellow-700';
    if (percentage >= 60) return 'text-orange-700';
    return 'text-red-700';
  }, [percentage]);

  if (compact) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {/* Grade Badge */}
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${gradeColor}`}>
          {gradeLetter}
        </div>
        
        {/* Score */}
        <div className="flex items-center space-x-2">
          <span className={`text-lg font-bold ${scoreColor}`}>
            {grade}
          </span>
          <span className="text-gray-500 text-sm">
            / {maxScore}
          </span>
          {showPercentage && (
            <span className="text-gray-500 text-sm">
              ({percentage}%)
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Grade & Feedback</h3>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${gradeColor}`}>
          {gradeLetter}
        </div>
      </div>

      {/* Score Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Numerical Score */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{grade}</div>
          <div className="text-sm text-gray-600">Points Earned</div>
        </div>

        {/* Maximum Score */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{maxScore}</div>
          <div className="text-sm text-gray-600">Total Points</div>
        </div>

        {/* Percentage */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className={`text-2xl font-bold ${scoreColor}`}>{percentage}%</div>
          <div className="text-sm text-gray-600">Percentage</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Score Progress</span>
          <span>{grade} / {maxScore} points</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            role="progressbar"
            aria-label="Score Progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
            className={`h-3 rounded-full transition-all duration-300 ${
              percentage >= 90 ? 'bg-green-500' :
              percentage >= 80 ? 'bg-blue-500' :
              percentage >= 70 ? 'bg-yellow-500' :
              percentage >= 60 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Grade Breakdown */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Grade Scale</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div className="text-center p-2 bg-green-50 rounded border border-green-200">
            <div className="font-medium text-green-800">A</div>
            <div className="text-green-600">93-100%</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
            <div className="font-medium text-blue-800">B</div>
            <div className="text-blue-600">80-92%</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded border border-yellow-200">
            <div className="font-medium text-yellow-800">C</div>
            <div className="text-yellow-600">70-79%</div>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded border border-orange-200">
            <div className="font-medium text-orange-800">D</div>
            <div className="text-orange-600">60-69%</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded border border-red-200">
            <div className="font-medium text-red-800">F</div>
            <div className="text-red-600">0-59%</div>
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      {feedback && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Instructor Feedback</h4>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-gray-700 leading-relaxed">{feedback}</p>
          </div>
        </div>
      )}

      {/* Performance Summary */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            percentage >= 90 ? 'bg-green-500' :
            percentage >= 80 ? 'bg-blue-500' :
            percentage >= 70 ? 'bg-yellow-500' :
            percentage >= 60 ? 'bg-orange-500' : 'bg-red-500'
          }`} />
          <span className="text-sm font-medium text-gray-700">
            {percentage >= 90 ? 'Excellent work!' :
             percentage >= 80 ? 'Good job!' :
             percentage >= 70 ? 'Satisfactory performance' :
             percentage >= 60 ? 'Needs improvement' : 'Requires significant improvement'}
          </span>
        </div>
      </div>
    </div>
  );
};
