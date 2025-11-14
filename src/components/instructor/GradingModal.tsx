'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { InstructorSubmissionData } from './InstructorCommunityFeed';

export interface GradingModalProps {
  submission: InstructorSubmissionData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (submissionId: string, grade: number, feedback: string, notes: string) => void;
  className?: string;
}

export interface GradeRubric {
  id: string;
  criteria: string;
  maxPoints: number;
  description: string;
}

export const GradingModal: React.FC<GradingModalProps> = ({
  submission,
  isOpen,
  onClose,
  onSave,
  className = '',
}) => {
  const [grade, setGrade] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});

  // Sample rubric - in a real app, this would come from the assignment
  const sampleRubric: GradeRubric[] = [
    {
      id: 'content',
      criteria: 'Content Quality',
      maxPoints: 40,
      description: 'Accuracy, depth, and relevance of the content'
    },
    {
      id: 'creativity',
      criteria: 'Creativity & Originality',
      maxPoints: 25,
      description: 'Unique approach and innovative thinking'
    },
    {
      id: 'presentation',
      criteria: 'Presentation & Delivery',
      maxPoints: 20,
      description: 'Clarity, organization, and visual appeal'
    },
    {
      id: 'technical',
      criteria: 'Technical Execution',
      maxPoints: 15,
      description: 'Technical skills and implementation quality'
    }
  ];

  useEffect(() => {
    if (submission && isOpen) {
      setGrade(submission.grade || 0);
      setFeedback(submission.feedback || '');
      setNotes(submission.instructorNotes || '');
      
      // Initialize rubric scores
      const initialScores: Record<string, number> = {};
      sampleRubric.forEach(item => {
        initialScores[item.id] = 0;
      });
      setRubricScores(initialScores);
    }
  }, [submission, isOpen]);

  const handleRubricScoreChange = useCallback((rubricId: string, score: number) => {
    setRubricScores(prev => ({
      ...prev,
      [rubricId]: Math.max(0, Math.min(score, sampleRubric.find(r => r.id === rubricId)?.maxPoints || 0))
    }));
  }, []);

  const calculateTotalGrade = useCallback(() => {
    return Object.values(rubricScores).reduce((sum, score) => sum + score, 0);
  }, [rubricScores]);

  const handleSave = useCallback(async () => {
    if (!submission) return;
    
    setIsSubmitting(true);
    try {
      const totalGrade = calculateTotalGrade();
      await onSave(submission.id, totalGrade, feedback, notes);
      onClose();
    } catch (error) {
      console.error('Error saving grade:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [submission, feedback, notes, calculateTotalGrade, onSave, onClose]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  if (!isOpen || !submission) return null;

  const totalGrade = calculateTotalGrade();
  const maxGrade = sampleRubric.reduce((sum, item) => sum + item.maxPoints, 0);
  const gradePercentage = maxGrade > 0 ? (totalGrade / maxGrade) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden ${className}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Grade Submission</h2>
              <p className="text-sm text-gray-600 mt-1">
                {submission.studentName} - {submission.assignmentTitle}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Submission Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Submission Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Student:</span>
                      <span className="text-sm text-gray-900">{submission.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <span className="text-sm text-gray-900">{submission.studentEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Course:</span>
                      <span className="text-sm text-gray-900">{submission.courseName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Due Date:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(submission.dueDate).toLocaleDateString()}
                        {submission.isLate && (
                          <span className="ml-2 text-red-600 font-medium">(Late)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        submission.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        submission.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {submission.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Current Grade</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{totalGrade}/{maxGrade}</div>
                      <div className="text-lg text-blue-800 mt-1">{gradePercentage.toFixed(1)}%</div>
                      <div className="mt-3">
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${gradePercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Grading Interface */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Rubric Scoring</h3>
                  <div className="space-y-3">
                    {sampleRubric.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{item.criteria}</h4>
                            <p className="text-xs text-gray-600">{item.description}</p>
                          </div>
                          <span className="text-sm text-gray-500">{item.maxPoints} pts</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max={item.maxPoints}
                            value={rubricScores[item.id] || 0}
                            onChange={(e) => handleRubricScoreChange(item.id, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <span className="text-sm text-gray-500">/ {item.maxPoints}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Feedback</h3>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide constructive feedback for the student..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Instructor Notes</h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Private notes for your reference..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Grade'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};






