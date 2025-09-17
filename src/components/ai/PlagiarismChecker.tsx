'use client';

import React, { useState } from 'react';

interface PlagiarismCheckerProps {
  submissionId: string;
  assignmentId: string;
  text: string;
  onCheckComplete: (result: any) => void;
}

export default function PlagiarismChecker({
  submissionId,
  assignmentId,
  text,
  onCheckComplete
}: PlagiarismCheckerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckPlagiarism = async () => {
    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/plagiarism', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          submissionId,
          assignmentId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
        onCheckComplete(data.result);
      } else {
        throw new Error(data.error || 'Failed to check plagiarism');
      }
    } catch (error) {
      console.error('Error checking plagiarism:', error);
      setError(error instanceof Error ? error.message : 'Failed to check plagiarism');
    } finally {
      setIsChecking(false);
    }
  };

  const getSimilarityColor = (score: number) => {
    if (score < 20) return 'text-green-600 bg-green-50';
    if (score < 40) return 'text-yellow-600 bg-yellow-50';
    if (score < 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getSimilarityLabel = (score: number) => {
    if (score < 20) return 'Original';
    if (score < 40) return 'Low Similarity';
    if (score < 60) return 'Moderate Similarity';
    if (score < 80) return 'High Similarity';
    return 'Very High Similarity';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Plagiarism Detection</h3>
        <p className="text-gray-600">Check the submission for potential plagiarism using AI-powered analysis.</p>
      </div>

      {/* Text Preview */}
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-900 mb-2">Text to Check</h4>
        <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{text}</p>
        </div>
        <p className="text-xs text-gray-500 mt-1">Character count: {text.length}</p>
      </div>

      {/* Check Button */}
      <div className="mb-6">
        <button
          onClick={handleCheckPlagiarism}
          disabled={isChecking || !text.trim()}
          className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
        >
          {isChecking ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Checking for Plagiarism...
            </>
          ) : (
            <>
              🔍 Check for Plagiarism
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="border-t pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Plagiarism Check Results</h4>
          
          {/* Overall Result */}
          <div className={`rounded-lg p-4 mb-4 ${getSimilarityColor(result.similarityScore)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Similarity Score</span>
              <span className="text-2xl font-bold">
                {result.similarityScore}%
              </span>
            </div>
            <div className="text-sm">
              Status: <span className="font-semibold">
                {result.isPlagiarized ? '⚠️ Potential Plagiarism Detected' : '✅ Original Content'}
              </span>
            </div>
            <div className="text-sm">
              Classification: <span className="font-semibold">
                {getSimilarityLabel(result.similarityScore)}
              </span>
            </div>
          </div>

          {/* Similarity Sources */}
          {result.sources && result.sources.length > 0 && (
            <div className="mb-4">
              <h5 className="font-medium text-gray-900 mb-2">Similar Content Found</h5>
              <div className="space-y-2">
                {result.sources.map((source: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Source {index + 1}</span>
                      <span className="text-sm font-semibold text-red-600">
                        {source.similarity}% similar
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{source.text}</p>
                    {source.source && (
                      <p className="text-xs text-gray-500">Source: {source.source}</p>
                    )}
                    {source.url && (
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View Source
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flagged Text */}
          {result.flaggedText && result.flaggedText.length > 0 && (
            <div className="mb-4">
              <h5 className="font-medium text-gray-900 mb-2">Flagged Text Segments</h5>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <ul className="text-sm space-y-1">
                  {result.flaggedText.map((text: string, index: number) => (
                    <li key={index} className="text-yellow-800">
                      • "{text}"
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">Recommendations</h5>
            <div className="text-blue-800 text-sm space-y-1">
              {result.isPlagiarized ? (
                <>
                  <p>• Review the flagged text segments and ensure proper attribution</p>
                  <p>• Consider paraphrasing or rewriting similar content</p>
                  <p>• Add proper citations for any referenced material</p>
                  <p>• Use quotation marks for direct quotes</p>
                </>
              ) : (
                <>
                  <p>• Great! The content appears to be original</p>
                  <p>• Continue maintaining academic integrity</p>
                  <p>• Remember to cite any sources you reference</p>
                </>
              )}
            </div>
          </div>

          {/* Check Details */}
          <div className="mt-4 text-xs text-gray-500">
            <p>Checked at: {new Date().toLocaleString()}</p>
            <p>Submission ID: {submissionId}</p>
            <p>Assignment ID: {assignmentId}</p>
          </div>
        </div>
      )}
    </div>
  );
}
