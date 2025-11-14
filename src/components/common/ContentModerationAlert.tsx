import React from 'react';
import { ContentModerationResult } from '@/lib/contentModeration';

interface ContentModerationAlertProps {
  result: ContentModerationResult;
  onDismiss?: () => void;
  onAppeal?: () => void;
  showDetails?: boolean;
}

export const ContentModerationAlert: React.FC<ContentModerationAlertProps> = ({
  result,
  onDismiss,
  onAppeal,
  showDetails = false
}) => {
  const isInappropriate = !result.isAppropriate;
  const hasFlags = result.flags.length > 0;
  const highRisk = result.confidence > 0.7;

  if (!isInappropriate && !hasFlags) {
    return null;
  }

  return (
    <div className={`rounded-lg border p-4 mb-4 ${
      isInappropriate 
        ? 'bg-red-50 border-red-200' 
        : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {isInappropriate ? (
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${
            isInappropriate ? 'text-red-800' : 'text-yellow-800'
          }`}>
            {isInappropriate ? 'Content Not Approved' : 'Content Review Needed'}
          </h3>
          
          <div className={`mt-2 text-sm ${
            isInappropriate ? 'text-red-700' : 'text-yellow-700'
          }`}>
            <p>{result.reasoning}</p>
            
            {result.flags.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Issues detected:</p>
                <ul className="list-disc list-inside mt-1">
                  {result.flags.map((flag, index) => (
                    <li key={index}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.suggestions.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Suggestions:</p>
                <ul className="list-disc list-inside mt-1">
                  {result.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {showDetails && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Moderation Details</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium">Confidence:</span> {(result.confidence * 100).toFixed(1)}%
                </div>
                <div>
                  <span className="font-medium">Risk Level:</span> {highRisk ? 'High' : 'Medium'}
                </div>
              </div>
              
              <div className="mt-2">
                <span className="font-medium text-xs">Risk Categories:</span>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {Object.entries(result.categories).map(([category, score]) => (
                    <div key={category} className="flex justify-between text-xs">
                      <span className="capitalize">{category}:</span>
                      <span className={score > 0.5 ? 'text-red-600' : 'text-gray-600'}>
                        {(score * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex space-x-3">
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Dismiss
              </button>
            )}
            {onAppeal && isInappropriate && (
              <button
                onClick={onAppeal}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Appeal Decision
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentModerationAlert;
