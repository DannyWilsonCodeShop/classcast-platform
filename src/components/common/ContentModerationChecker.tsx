import React, { useState } from 'react';
import { ContentModerationResult } from '@/lib/contentModeration';
import ContentModerationAlert from './ContentModerationAlert';

interface ContentModerationCheckerProps {
  content: string;
  type: 'text' | 'video';
  onModerationComplete: (result: ContentModerationResult) => void;
  context?: {
    assignmentId?: string;
    courseId?: string;
    studentId?: string;
    userId?: string;
  };
  autoCheck?: boolean;
  showGuidelines?: boolean;
}

export const ContentModerationChecker: React.FC<ContentModerationCheckerProps> = ({
  content,
  type,
  onModerationComplete,
  context,
  autoCheck = true,
  showGuidelines = true
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ContentModerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkContent = async () => {
    if (!content.trim()) {
      setError('Please provide content to check');
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const endpoint = type === 'video' ? '/api/moderation/video' : '/api/moderation/text';
      const requestBody = type === 'video' 
        ? { videoUrl: content, metadata: context, userId: context?.userId }
        : { content, context: JSON.stringify(context), userId: context?.userId };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check content');
      }

      setResult(data.result);
      onModerationComplete(data.result);
    } catch (error) {
      console.error('Content moderation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to check content');
    } finally {
      setIsChecking(false);
    }
  };

  // Auto-check content when it changes
  React.useEffect(() => {
    if (autoCheck && content.trim()) {
      const timeoutId = setTimeout(() => {
        checkContent();
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [content, autoCheck]);

  const getGuidelines = () => [
    'Content should be appropriate for educational environments',
    'No hate speech, harassment, or discriminatory language',
    'No violent, graphic, or disturbing content',
    'No inappropriate sexual content',
    'No content promoting self-harm or dangerous activities',
    'No spam, irrelevant, or off-topic content',
    'No false or misleading information',
    'Respectful communication and constructive feedback'
  ];

  return (
    <div className="space-y-4">
      {showGuidelines && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Content Guidelines</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            {getGuidelines().map((guideline, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{guideline}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!autoCheck && (
        <button
          onClick={checkContent}
          disabled={isChecking || !content.trim()}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isChecking ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking Content...
            </div>
          ) : (
            'Check Content Appropriateness'
          )}
        </button>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <ContentModerationAlert
          result={result}
          onDismiss={() => setResult(null)}
          showDetails={true}
        />
      )}

      {isChecking && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-600">Analyzing content for appropriateness...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentModerationChecker;
