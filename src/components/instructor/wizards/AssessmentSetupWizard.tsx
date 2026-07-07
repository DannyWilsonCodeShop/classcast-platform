'use client';
import React, { useState } from 'react';
import { AssessmentQuestion } from '@/types/assessment';

interface AssessmentSetupWizardProps {
  onComplete: (questions: AssessmentQuestion[]) => void;
  onBack: () => void;
}

export function AssessmentSetupWizard({ onComplete, onBack }: AssessmentSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);

  const addQuestion = () => {
    const newQ: AssessmentQuestion = {
      questionId: `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      questionText: '',
      timeLimitSeconds: 60,
      orderIndex: questions.length,
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (index: number, field: keyof AssessmentQuestion, value: string | number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) =>
      prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, orderIndex: i }))
    );
  };

  const moveQuestion = (from: number, to: number) => {
    const updated = [...questions];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setQuestions(updated.map((q, i) => ({ ...q, orderIndex: i })));
  };

  const totalDuration = questions.reduce((sum, q) => sum + q.timeLimitSeconds, 0);
  const canProceed =
    step === 1
      ? questions.length > 0 && questions.every((q) => q.questionText.trim().length > 0)
      : true;

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full ${s <= step ? 'bg-[#005587]' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#005587]">Questions</h3>
            <span className="text-[10px] text-gray-500">
              Total: {Math.floor(totalDuration / 60)}m {totalDuration % 60}s ({questions.length}{' '}
              question{questions.length !== 1 ? 's' : ''})
            </span>
          </div>

          {/* Question List */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {questions.map((q, idx) => (
              <div key={q.questionId} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-medium">Q{idx + 1}</span>
                  <div className="flex items-center gap-1">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => moveQuestion(idx, idx - 1)}
                        className="text-[10px] text-gray-400"
                      >
                        ↑
                      </button>
                    )}
                    {idx < questions.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveQuestion(idx, idx + 1)}
                        className="text-[10px] text-gray-400"
                      >
                        ↓
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      className="text-[10px] text-red-400 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <textarea
                  value={q.questionText}
                  onChange={(e) => updateQuestion(idx, 'questionText', e.target.value)}
                  placeholder="Enter question text..."
                  rows={2}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs resize-none focus:ring-1 focus:ring-[#005587] focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-500">Time:</label>
                  <input
                    type="number"
                    min={15}
                    max={300}
                    value={q.timeLimitSeconds}
                    onChange={(e) =>
                      updateQuestion(idx, 'timeLimitSeconds', Number(e.target.value))
                    }
                    className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#005587] focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400">seconds</span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="w-full py-2 bg-gray-100 rounded-xl text-xs font-medium text-[#005587]"
          >
            + Add Question
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#005587]">Review Assessment</h3>
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs">
            <div>
              <span className="text-gray-500">Questions:</span>{' '}
              <span className="font-medium">{questions.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Duration:</span>{' '}
              <span className="font-medium">
                {Math.floor(totalDuration / 60)}m {totalDuration % 60}s
              </span>
            </div>
          </div>
          <div className="space-y-1 max-h-[40vh] overflow-y-auto">
            {questions.map((q, idx) => (
              <div key={q.questionId} className="bg-gray-50 rounded-lg p-2 text-xs">
                <span className="text-gray-400">
                  Q{idx + 1} ({q.timeLimitSeconds}s):
                </span>{' '}
                <span className="text-gray-700">
                  {q.questionText.substring(0, 60)}
                  {q.questionText.length > 60 ? '...' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <button
          onClick={step === 1 ? onBack : () => setStep(1)}
          className="px-4 py-2 text-xs text-gray-600 font-medium"
        >
          Back
        </button>
        {step < 2 ? (
          <button
            onClick={() => setStep(2)}
            disabled={!canProceed}
            className="px-4 py-2 bg-[#005587] text-white rounded-xl text-xs font-medium disabled:opacity-50"
          >
            Review
          </button>
        ) : (
          <button
            onClick={() => onComplete(questions)}
            className="px-4 py-2 bg-[#FFC72C] text-[#005587] rounded-xl text-xs font-bold"
          >
            Create Assessment
          </button>
        )}
      </div>
    </div>
  );
}
