'use client';

import React, { useState } from 'react';

interface AIGradingInterfaceProps {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  essay: string;
  onGradeComplete: (result: any) => void;
}

export default function AIGradingInterface({
  submissionId,
  assignmentId,
  studentId,
  essay,
  onGradeComplete
}: AIGradingInterfaceProps) {
  const [rubric, setRubric] = useState({
    maxScore: 100,
    criteria: {
      content: { weight: 40, description: 'Quality of ideas, depth of analysis, and relevance to topic' },
      structure: { weight: 25, description: 'Organization, flow, and logical progression' },
      grammar: { weight: 20, description: 'Grammar, spelling, and language mechanics' },
      style: { weight: 15, description: 'Writing style, voice, and clarity' }
    }
  });
  const [isGrading, setIsGrading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGradeEssay = async () => {
    setIsGrading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/grading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          essay,
          rubric,
          assignmentContext: {
            title: `Assignment ${assignmentId}`,
            instructions: 'Please write a comprehensive essay on the given topic.'
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
        onGradeComplete(data.result);
      } else {
        throw new Error(data.error || 'Failed to grade essay');
      }
    } catch (error) {
      console.error('Error grading essay:', error);
      setError(error instanceof Error ? error.message : 'Failed to grade essay');
    } finally {
      setIsGrading(false);
    }
  };

  const handleRubricChange = (criterion: string, field: string, value: any) => {
    setRubric(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [criterion]: {
          ...prev.criteria[criterion as keyof typeof prev.criteria],
          [field]: value
        }
      }
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Essay Grading</h3>
        <p className="text-gray-600">Configure the grading rubric and let AI grade the essay automatically.</p>
      </div>

      {/* Rubric Configuration */}
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Grading Rubric</h4>
        <div className="space-y-4">
          {Object.entries(rubric.criteria).map(([key, criterion]) => (
            <div key={key} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium text-gray-700 capitalize">{key}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={criterion.weight}
                  onChange={(e) => handleRubricChange(key, 'weight', parseInt(e.target.value))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <textarea
                value={criterion.description}
                onChange={(e) => handleRubricChange(key, 'description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                rows={2}
                placeholder="Description of this criterion"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Weight: {Object.values(rubric.criteria).reduce((sum, c) => sum + c.weight, 0)}%</span>
          <span className="text-sm text-gray-600">Max Score: {rubric.maxScore}</span>
        </div>
      </div>

      {/* Essay Preview */}
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-900 mb-2">Essay to Grade</h4>
        <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{essay}</p>
        </div>
        <p className="text-xs text-gray-500 mt-1">Word count: {essay.split(' ').length}</p>
      </div>

      {/* Grade Button */}
      <div className="mb-6">
        <button
          onClick={handleGradeEssay}
          disabled={isGrading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
        >
          {isGrading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Grading Essay...
            </>
          ) : (
            <>
              🤖 Grade with AI
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
          <h4 className="text-lg font-medium text-gray-900 mb-4">Grading Results</h4>
          
          {/* Overall Score */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Overall Score</span>
              <span className="text-2xl font-bold text-blue-600">
                {result.score}/{result.maxScore} ({result.percentage}%)
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Letter Grade: <span className="font-semibold">{result.letterGrade}</span>
            </div>
          </div>

          {/* Criteria Breakdown */}
          <div className="space-y-3 mb-4">
            {Object.entries(result.feedback.criteria).map(([key, criterion]: [string, any]) => (
              <div key={key} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium capitalize">{key}</span>
                  <span className="text-sm font-semibold">{criterion.score}/{rubric.criteria[key as keyof typeof rubric.criteria].weight}</span>
                </div>
                <p className="text-sm text-gray-600">{criterion.feedback}</p>
              </div>
            ))}
          </div>

          {/* Overall Feedback */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h5 className="font-medium text-blue-900 mb-2">Overall Feedback</h5>
            <p className="text-blue-800 text-sm">{result.feedback.overall}</p>
          </div>

          {/* Strengths and Improvements */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h5 className="font-medium text-green-900 mb-2">Strengths</h5>
              <ul className="text-green-800 text-sm space-y-1">
                {result.strengths.map((strength: string, index: number) => (
                  <li key={index}>• {strength}</li>
                ))}
              </ul>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <h5 className="font-medium text-orange-900 mb-2">Areas for Improvement</h5>
              <ul className="text-orange-800 text-sm space-y-1">
                {result.improvements.map((improvement: string, index: number) => (
                  <li key={index}>• {improvement}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="mt-4 bg-purple-50 rounded-lg p-4">
              <h5 className="font-medium text-purple-900 mb-2">Suggestions</h5>
              <ul className="text-purple-800 text-sm space-y-1">
                {result.suggestions.map((suggestion: string, index: number) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
