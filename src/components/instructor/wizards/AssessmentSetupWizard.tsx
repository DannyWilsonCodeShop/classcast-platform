'use client';
import React, { useState } from 'react';
import { AssessmentQuestion } from '@/types/assessment';

interface AssessmentSetupWizardProps {
  onComplete: (questions: AssessmentQuestion[], directions?: string) => void;
  onBack: () => void;
}

const DEFAULT_ASSESSMENT_DIRECTIONS = `This is a timed video assessment. Questions will appear on screen one at a time. You must answer each question on camera within the time limit. Keep your full upper body and arms visible at all times. The recording will auto-advance when time expires. Do not leave the screen — your recording will be aborted.`;

export function AssessmentSetupWizard({ onComplete, onBack }: AssessmentSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [directions, setDirections] = useState(DEFAULT_ASSESSMENT_DIRECTIONS);
  const [deliveryMode, setDeliveryMode] = useState<'all-same' | 'random-from-bank'>('all-same');
  const [randomCount, setRandomCount] = useState(5);
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
  const canProceed = () => {
    if (step === 1) return true;
    if (step === 2) return questions.length > 0 && questions.every((q) => q.questionText.trim().length > 0);
    return true;
  };

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`w-2 h-2 rounded-full ${s <= step ? 'bg-[#005587]' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Step 1: Directions & Delivery Mode */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#005587]">Assessment Settings</h3>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Student Directions</label>
            <p className="text-[10px] text-gray-400 mb-1.5">These instructions will be shown to students before the assessment begins. Edit as needed.</p>
            <textarea
              value={directions}
              onChange={(e) => setDirections(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs resize-none focus:ring-1 focus:ring-[#005587] focus:border-[#005587] focus:outline-none text-gray-600"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">Question Delivery</label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setDeliveryMode('all-same')}
                className={`w-full p-3 rounded-xl border text-left ${deliveryMode === 'all-same' ? 'border-[#005587] bg-[#005587]/5' : 'border-gray-200'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📋</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Same questions for all</p>
                    <p className="text-[10px] text-gray-500">Every student gets the exact same questions in order</p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMode('random-from-bank')}
                className={`w-full p-3 rounded-xl border text-left ${deliveryMode === 'random-from-bank' ? 'border-[#005587] bg-[#005587]/5' : 'border-gray-200'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🎲</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Random from question bank</p>
                    <p className="text-[10px] text-gray-500">Each student gets a random selection from your question pool</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {deliveryMode === 'random-from-bank' && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Questions per student: {randomCount}
              </label>
              <input
                type="range"
                min={1}
                max={20}
                value={randomCount}
                onChange={(e) => setRandomCount(Number(e.target.value))}
                className="w-full accent-[#005587]"
              />
              <div className="flex justify-between text-[10px] text-gray-400"><span>1</span><span>20</span></div>
              <p className="text-[10px] text-gray-400 mt-1">
                Add more questions than this number to create a pool. Each student will get {randomCount} random questions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Questions */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#005587]">
              {deliveryMode === 'random-from-bank' ? 'Question Bank' : 'Questions'}
            </h3>
            <span className="text-[10px] text-gray-500">
              {questions.length} question{questions.length !== 1 ? 's' : ''}
              {deliveryMode === 'random-from-bank' && ` (${randomCount} per student)`}
              {' • '}{Math.floor(totalDuration / 60)}m {totalDuration % 60}s
            </span>
          </div>

          {deliveryMode === 'random-from-bank' && questions.length > 0 && questions.length < randomCount && (
            <div className="bg-yellow-50 rounded-lg p-2 text-[10px] text-yellow-700">
              ⚠️ Add at least {randomCount} questions (you have {questions.length}). Students will get {randomCount} randomly.
            </div>
          )}

          <div className="space-y-2 max-h-[45vh] overflow-y-auto">
            {questions.map((q, idx) => (
              <div key={q.questionId} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-medium">Q{idx + 1}</span>
                  <div className="flex items-center gap-1">
                    {idx > 0 && <button type="button" onClick={() => moveQuestion(idx, idx - 1)} className="text-[10px] text-gray-400">↑</button>}
                    {idx < questions.length - 1 && <button type="button" onClick={() => moveQuestion(idx, idx + 1)} className="text-[10px] text-gray-400">↓</button>}
                    <button type="button" onClick={() => removeQuestion(idx)} className="text-[10px] text-red-400 ml-2">✕</button>
                  </div>
                </div>
                <textarea
                  value={q.questionText}
                  onChange={(e) => updateQuestion(idx, 'questionText', e.target.value)}
                  onPaste={(e) => {
                    // Handle image paste
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    for (const item of Array.from(items)) {
                      if (item.type.startsWith('image/')) {
                        e.preventDefault();
                        const file = item.getAsFile();
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const base64 = ev.target?.result as string;
                          updateQuestion(idx, 'imageUrl', base64);
                        };
                        reader.readAsDataURL(file);
                        break;
                      }
                    }
                  }}
                  placeholder="Enter question text... (paste an image here)"
                  rows={2}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs resize-none focus:ring-1 focus:ring-[#005587] focus:outline-none"
                />
                {/* Image preview / upload */}
                {q.imageUrl ? (
                  <div className="relative">
                    <img src={q.imageUrl} alt="Question image" className="w-full max-h-32 object-contain rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => updateQuestion(idx, 'imageUrl', '')}
                      className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center"
                    >✕</button>
                  </div>
                ) : (
                  <label className="flex items-center gap-1.5 text-[10px] text-[#005587] font-medium cursor-pointer">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>Add image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          updateQuestion(idx, 'imageUrl', ev.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                )}
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-500">Time:</label>
                  <input
                    type="number"
                    min={15}
                    max={300}
                    value={q.timeLimitSeconds}
                    onChange={(e) => updateQuestion(idx, 'timeLimitSeconds', Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#005587] focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400">seconds</span>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addQuestion} className="w-full py-2 bg-gray-100 rounded-xl text-xs font-medium text-[#005587]">
            + Add Question
          </button>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#005587]">Review Assessment</h3>
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs">
            <div><span className="text-gray-500">Delivery:</span> <span className="font-medium">{deliveryMode === 'all-same' ? 'Same for all' : `Random ${randomCount} from ${questions.length} questions`}</span></div>
            <div><span className="text-gray-500">Questions:</span> <span className="font-medium">{questions.length}</span></div>
            <div><span className="text-gray-500">Total Duration:</span> <span className="font-medium">{Math.floor(totalDuration / 60)}m {totalDuration % 60}s</span></div>
          </div>
          <div className="space-y-1 max-h-[35vh] overflow-y-auto">
            {questions.map((q, idx) => (
              <div key={q.questionId} className="bg-gray-50 rounded-lg p-2 text-xs">
                <span className="text-gray-400">Q{idx + 1} ({q.timeLimitSeconds}s):</span>{' '}
                <span className="text-gray-700">{q.questionText.substring(0, 60)}{q.questionText.length > 60 ? '...' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <button onClick={step === 1 ? onBack : () => setStep(step - 1)} className="px-4 py-2 text-xs text-gray-600 font-medium">Back</button>
        {step < 3 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="px-4 py-2 bg-[#005587] text-white rounded-xl text-xs font-medium disabled:opacity-50">Next</button>
        ) : (
          <button onClick={() => onComplete(questions, directions)} className="px-4 py-2 bg-[#FFC72C] text-[#005587] rounded-xl text-xs font-bold">Create Assessment</button>
        )}
      </div>
    </div>
  );
}
