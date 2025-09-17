'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ContentModerationChecker from '../common/ContentModerationChecker';
import { ContentModerationResult } from '@/lib/contentModeration';

interface TextSubmissionFormProps {
  assignmentId: string;
  courseId: string;
  onSubmissionComplete?: (submissionData: any) => void;
  onSubmissionError?: (error: string) => void;
  maxLength?: number;
  placeholder?: string;
  className?: string;
}

export const TextSubmissionForm: React.FC<TextSubmissionFormProps> = ({
  assignmentId,
  courseId,
  onSubmissionComplete,
  onSubmissionError,
  maxLength = 5000,
  placeholder = "Enter your response here...",
  className = ''
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moderationResult, setModerationResult] = useState<ContentModerationResult | null>(null);
  const [showModeration, setShowModeration] = useState(false);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setContent(value);
    }
  };

  const handleModerationComplete = (result: ContentModerationResult) => {
    setModerationResult(result);
    setShowModeration(true);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      onSubmissionError?.('Please enter your response');
      return;
    }

    if (moderationResult && !moderationResult.isAppropriate) {
      onSubmissionError?.('Content must be appropriate before submission');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate submission API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const submissionData = {
        submissionId: crypto.randomUUID(),
        assignmentId,
        courseId,
        studentId: user?.id,
        content,
        type: 'text',
        submittedAt: new Date().toISOString(),
        moderationResult
      };

      onSubmissionComplete?.(submissionData);
      setContent('');
      setModerationResult(null);
      setShowModeration(false);
    } catch (error) {
      onSubmissionError?.(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = content.trim().length > 0 && 
    (!moderationResult || moderationResult.isAppropriate) && 
    !isSubmitting;

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <label htmlFor="text-submission" className="block text-sm font-medium text-gray-700 mb-2">
          Your Response
        </label>
        <textarea
          id="text-submission"
          value={content}
          onChange={handleContentChange}
          placeholder={placeholder}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
        />
        <div className="mt-1 flex justify-between text-sm text-gray-500">
          <span>{content.length} / {maxLength} characters</span>
          {content.length > maxLength * 0.9 && (
            <span className="text-yellow-600">Approaching character limit</span>
          )}
        </div>
      </div>

      {/* Content Moderation */}
      {content.trim() && (
        <ContentModerationChecker
          content={content}
          type="text"
          onModerationComplete={handleModerationComplete}
          context={{
            assignmentId,
            courseId,
            studentId: user?.id,
            userId: user?.id
          }}
          autoCheck={true}
          showGuidelines={true}
        />
      )}

      {/* Moderation Result Display */}
      {showModeration && moderationResult && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Content Review</h3>
          <div className={`p-3 rounded-lg ${
            moderationResult.isAppropriate 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              {moderationResult.isAppropriate ? (
                <svg className="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className={`text-sm font-medium ${
                moderationResult.isAppropriate ? 'text-green-800' : 'text-red-800'
              }`}>
                {moderationResult.isAppropriate ? 'Content Approved' : 'Content Needs Review'}
              </span>
            </div>
            <p className={`text-sm mt-1 ${
              moderationResult.isAppropriate ? 'text-green-700' : 'text-red-700'
            }`}>
              {moderationResult.reasoning}
            </p>
            {moderationResult.flags.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium">Issues detected:</p>
                <ul className="text-xs list-disc list-inside mt-1">
                  {moderationResult.flags.map((flag, index) => (
                    <li key={index}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => {
            setContent('');
            setModerationResult(null);
            setShowModeration(false);
          }}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`px-6 py-2 text-sm font-medium text-white rounded-md transition-colors ${
            canSubmit
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </div>
          ) : (
            'Submit Response'
          )}
        </button>
      </div>
    </div>
  );
};

export default TextSubmissionForm;
