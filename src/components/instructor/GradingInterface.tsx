'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Assignment, Submission, SubmissionStatus } from '@/types/dynamodb';

export interface GradingSubmission {
  submissionId: string;
  assignmentId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  updatedAt: string;
  status: SubmissionStatus;
  grade?: number;
  feedback?: string;
  rubricScores?: { [criterion: string]: number };
  files: any[];
  metadata: any;
}

interface GradingInterfaceProps {
  assignment: Assignment;
  submissions: GradingSubmission[];
  className?: string;
  onGradeSubmission?: (submissionId: string, grade: number, feedback: string, rubricScores?: { [criterion: string]: number }) => Promise<void>;
  onBatchGrade?: (grades: { submissionId: string; grade: number; feedback: string; rubricScores?: { [criterion: string]: number } }[]) => Promise<void>;
}

interface GradingFormData {
  grade: number;
  feedback: string;
  rubricScores: { [criterion: string]: number };
}

interface GradingErrors {
  grade?: string;
  feedback?: string;
  rubricScores?: { [criterion: string]: number };
}

const GradingInterface: React.FC<GradingInterfaceProps> = ({
  assignment,
  submissions,
  className = '',
  onGradeSubmission,
  onBatchGrade,
}) => {
  const [selectedSubmission, setSelectedSubmission] = useState<GradingSubmission | null>(null);
  const [gradingData, setGradingData] = useState<GradingFormData>({
    grade: 0,
    feedback: '',
    rubricScores: {},
  });
  const [batchMode, setBatchMode] = useState(false);
  const [batchGrades, setBatchGrades] = useState<{ [submissionId: string]: GradingFormData }>({});
  const [isGrading, setIsGrading] = useState(false);
  const [errors, setErrors] = useState<GradingErrors>({});

  // Initialize rubric scores from assignment if available
  const rubricCriteria = useMemo(() => {
    if (assignment.rubric) {
      return assignment.rubric.map(r => r.criterion);
    }
    return [];
  }, [assignment.rubric]);

  const validateGrade = useCallback((grade: number): boolean => {
    if (grade < 0 || grade > (assignment.maxScore || 100)) {
      return false;
    }
    return true;
  }, [assignment.maxScore]);

  const validateForm = useCallback((): boolean => {
    const newErrors: GradingErrors = {};

    if (!validateGrade(gradingData.grade)) {
      newErrors.grade = `Grade must be between 0 and ${assignment.maxScore || 100}`;
    }

    if (gradingData.feedback.trim().length < 10) {
      newErrors.feedback = 'Feedback must be at least 10 characters long';
    }

    // Validate rubric scores if they exist
    if (rubricCriteria.length > 0) {
      const invalidRubricScores: { [criterion: string]: number } = {};
      rubricCriteria.forEach(criterion => {
        const score = gradingData.rubricScores[criterion];
        if (score === undefined || score < 0 || score > 100) {
          invalidRubricScores[criterion] = score;
        }
      });
      if (Object.keys(invalidRubricScores).length > 0) {
        newErrors.rubricScores = invalidRubricScores;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [gradingData, assignment.maxScore, rubricCriteria, validateGrade]);

  const handleGradeSubmission = async () => {
    if (!selectedSubmission || !validateForm()) return;

    try {
      setIsGrading(true);
      await onGradeSubmission?.(
        selectedSubmission.submissionId,
        gradingData.grade,
        gradingData.feedback,
        Object.keys(gradingData.rubricScores).length > 0 ? gradingData.rubricScores : undefined
      );
      
      // Reset form
      setGradingData({
        grade: 0,
        feedback: '',
        rubricScores: {},
      });
      setErrors({});
    } finally {
      setIsGrading(false);
    }
  };

  const handleBatchGrade = async () => {
    if (!onBatchGrade) return;

    const gradesToSubmit = Object.entries(batchGrades)
      .filter(([_, data]) => {
        if (!data || typeof data.grade !== 'number' || typeof data.feedback !== 'string') {
          return false;
        }
        return data.grade > 0 && data.feedback.trim().length >= 10;
      })
      .map(([submissionId, data]) => ({
        submissionId,
        grade: data.grade,
        feedback: data.feedback,
        rubricScores: data.rubricScores && Object.keys(data.rubricScores).length > 0 ? data.rubricScores : undefined,
      }));

    if (gradesToSubmit.length === 0) return;

    try {
      setIsGrading(true);
      await onBatchGrade(gradesToSubmit);
      setBatchGrades({});
    } finally {
      setIsGrading(false);
    }
  };

  const updateBatchGrade = (submissionId: string, field: keyof GradingFormData, value: any) => {
    setBatchGrades(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: value,
      },
    }));
  };

  const getSubmissionStatusColor = (status: SubmissionStatus): string => {
    switch (status) {
      case SubmissionStatus.SUBMITTED: return 'bg-yellow-100 text-yellow-800';
      case SubmissionStatus.GRADED: return 'bg-green-100 text-green-800';
      case SubmissionStatus.LATE: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGradeColor = (grade: number, maxScore: number): string => {
    const percentage = (grade / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Grade Submissions</h2>
            <p className="text-gray-600">
              {assignment.title} - {submissions.length} submissions
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setBatchMode(!batchMode)}
              className={`px-4 py-2 rounded-md transition-colors ${
                batchMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {batchMode ? 'Single Mode' : 'Batch Mode'}
            </button>
            {batchMode && (
              <button
                type="button"
                onClick={handleBatchGrade}
                disabled={isGrading || Object.keys(batchGrades).length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGrading ? 'Grading...' : 'Submit All Grades'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Submissions List */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Submissions</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {submissions.map((submission) => (
              <div
                key={submission.submissionId}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedSubmission?.submissionId === submission.submissionId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedSubmission(submission)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{submission.studentName}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getSubmissionStatusColor(submission.status)}`}>
                    {submission.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                </div>
                {submission.grade !== undefined && (
                  <div className={`text-sm font-medium ${getGradeColor(submission.grade, assignment.maxScore || 100)}`}>
                    Grade: {submission.grade}/{assignment.maxScore || 100}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Grading Interface */}
        <div className="lg:col-span-2">
          {selectedSubmission ? (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Grading: {selectedSubmission.studentName}
                </h3>
                <p className="text-sm text-gray-600">
                  Assignment: {assignment.title} | Max Score: {assignment.maxScore || 100}
                </p>
              </div>

              {/* Video/Content Viewer */}
              <div className="bg-gray-100 rounded-lg p-4 min-h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎥</div>
                  <p className="text-gray-600">Video/Content Viewer</p>
                  <p className="text-sm text-gray-500">
                    {selectedSubmission.submissionId} - {selectedSubmission.submittedAt}
                  </p>
                </div>
              </div>

              {/* Grading Form */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                    Grade *
                  </label>
                  <input
                    type="number"
                    id="grade"
                    min="0"
                    max={assignment.maxScore || 100}
                    value={gradingData.grade}
                    onChange={(e) => setGradingData(prev => ({ ...prev, grade: parseInt(e.target.value) || 0 }))}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.grade ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.grade && <p className="mt-1 text-sm text-red-600">{errors.grade}</p>}
                </div>

                {/* Rubric Scoring */}
                {rubricCriteria.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rubric Scoring</label>
                    <div className="space-y-2">
                      {rubricCriteria.map((criterion) => (
                        <div key={criterion} className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600 flex-1">{criterion}</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={gradingData.rubricScores[criterion] || ''}
                            onChange={(e) => setGradingData(prev => ({
                              ...prev,
                              rubricScores: {
                                ...prev.rubricScores,
                                [criterion]: parseInt(e.target.value) || 0,
                              },
                            }))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="0-100"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback *
                  </label>
                  <textarea
                    id="feedback"
                    rows={4}
                    value={gradingData.feedback}
                    onChange={(e) => setGradingData(prev => ({ ...prev, feedback: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.feedback ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Provide detailed feedback for the student..."
                  />
                  {errors.feedback && <p className="mt-1 text-sm text-red-600">{errors.feedback}</p>}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleGradeSubmission}
                    disabled={isGrading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGrading ? 'Grading...' : 'Submit Grade'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSubmission(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📝</div>
              <p>Select a submission to begin grading</p>
            </div>
          )}
        </div>
      </div>

      {/* Batch Grading Interface */}
      {batchMode && (
        <div className="border-t border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Batch Grading</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {submissions.map((submission) => (
              <div key={submission.submissionId} className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="flex-1">
                  <span className="font-medium">{submission.studentName}</span>
                  <span className="text-sm text-gray-500 ml-2">({submission.status})</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max={assignment.maxScore || 100}
                  value={batchGrades[submission.submissionId]?.grade || ''}
                  onChange={(e) => updateBatchGrade(submission.submissionId, 'grade', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Grade"
                />
                <textarea
                  rows={2}
                  value={batchGrades[submission.submissionId]?.feedback || ''}
                  onChange={(e) => updateBatchGrade(submission.submissionId, 'feedback', e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Quick feedback..."
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GradingInterface;
