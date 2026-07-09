'use client';

import React, { useState } from 'react';
import { RubricBuilder } from '@/components/instructor/RubricBuilder';
import { RubricCategory } from '@/types/rubric';

export interface StudyModuleConfig {
  topic: string;
  totalLessons: number;
  estimatedMinutes: number;
  completionPolicy: 'all-lessons' | 'percentage' | 'final-quiz';
  completionThreshold: number;
  allowSkipping: boolean;
  directions?: string;
  rubric?: RubricCategory[];
}

interface StudyModuleSetupWizardProps {
  onComplete: (config: StudyModuleConfig) => void;
  onBack: () => void;
}

const DEFAULT_STUDY_MODULE_DIRECTIONS = `Complete each lesson in order. Watch the videos, read the materials, and pass any quizzes to progress. You can revisit completed lessons at any time. Your grade is based on overall completion and quiz scores.`;

export function StudyModuleSetupWizard({ onComplete, onBack }: StudyModuleSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [directions, setDirections] = useState(DEFAULT_STUDY_MODULE_DIRECTIONS);
  const [rubric, setRubric] = useState<RubricCategory[]>([]);
  const [config, setConfig] = useState<StudyModuleConfig>({
    topic: '',
    totalLessons: 5,
    estimatedMinutes: 30,
    completionPolicy: 'all-lessons',
    completionThreshold: 80,
    allowSkipping: false,
  });

  const canProceed = () => {
    if (step === 1) return config.topic.trim().length >= 3;
    return true;
  };

  const handleComplete = () => {
    const finalConfig = { ...config, directions, rubric: rubric.length > 0 ? rubric : undefined };
    onComplete(finalConfig);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 mb-4">
        {[1, 2, 3, 4].map(s => <div key={s} className={`w-2 h-2 rounded-full ${s <= step ? 'bg-[#005587]' : 'bg-gray-200'}`} />)}
      </div>

      {/* Step 1: Topic & Directions */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#005587]">Study Module Info</h3>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Topic / Title</label>
            <input type="text" value={config.topic} onChange={(e) => setConfig({ ...config, topic: e.target.value })} placeholder="e.g., Introduction to Calculus" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[#005587] focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Directions (editable)</label>
            <textarea
              value={directions}
              onChange={(e) => setDirections(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs resize-none focus:ring-1 focus:ring-[#005587] focus:border-[#005587] focus:outline-none text-gray-600"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Planned Lessons: {config.totalLessons}</label>
            <input type="range" min={1} max={20} value={config.totalLessons} onChange={(e) => setConfig({ ...config, totalLessons: Number(e.target.value) })} className="w-full accent-[#005587]" />
            <div className="flex justify-between text-[10px] text-gray-400"><span>1</span><span>20</span></div>
            <p className="text-[10px] text-gray-400 mt-1">You'll add lesson content (videos, readings, quizzes) after creating</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Estimated Time: {config.estimatedMinutes} minutes</label>
            <input type="range" min={10} max={120} step={5} value={config.estimatedMinutes} onChange={(e) => setConfig({ ...config, estimatedMinutes: Number(e.target.value) })} className="w-full accent-[#005587]" />
            <div className="flex justify-between text-[10px] text-gray-400"><span>10m</span><span>2h</span></div>
          </div>
        </div>
      )}

      {/* Step 2: Completion & Progress */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#005587]">Completion Settings</h3>
          <p className="text-xs text-gray-500">How do students earn their grade?</p>

          <div className="space-y-2">
            <button type="button" onClick={() => setConfig({ ...config, completionPolicy: 'all-lessons' })} className={`w-full p-3 rounded-xl border text-left ${config.completionPolicy === 'all-lessons' ? 'border-[#005587] bg-[#005587]/5' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <span className="text-base">✅</span>
                <div>
                  <p className="text-xs font-bold text-gray-900">Complete All Lessons</p>
                  <p className="text-[10px] text-gray-500">Student must finish every lesson to earn full credit</p>
                </div>
              </div>
            </button>
            <button type="button" onClick={() => setConfig({ ...config, completionPolicy: 'percentage' })} className={`w-full p-3 rounded-xl border text-left ${config.completionPolicy === 'percentage' ? 'border-[#005587] bg-[#005587]/5' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <span className="text-base">📊</span>
                <div>
                  <p className="text-xs font-bold text-gray-900">Percentage Threshold</p>
                  <p className="text-[10px] text-gray-500">Grade based on % of lessons completed</p>
                </div>
              </div>
            </button>
            <button type="button" onClick={() => setConfig({ ...config, completionPolicy: 'final-quiz' })} className={`w-full p-3 rounded-xl border text-left ${config.completionPolicy === 'final-quiz' ? 'border-[#005587] bg-[#005587]/5' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <span className="text-base">📝</span>
                <div>
                  <p className="text-xs font-bold text-gray-900">Final Quiz Score</p>
                  <p className="text-[10px] text-gray-500">Grade based on a final assessment at the end</p>
                </div>
              </div>
            </button>
          </div>

          {config.completionPolicy === 'percentage' && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Required Completion: {config.completionThreshold}%</label>
              <input type="range" min={50} max={100} step={5} value={config.completionThreshold} onChange={(e) => setConfig({ ...config, completionThreshold: Number(e.target.value) })} className="w-full accent-[#005587]" />
              <div className="flex justify-between text-[10px] text-gray-400"><span>50%</span><span>100%</span></div>
            </div>
          )}

          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
            <div>
              <p className="text-xs font-medium text-gray-700">Allow skipping lessons?</p>
              <p className="text-[10px] text-gray-500">Students can jump ahead without completing in order</p>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, allowSkipping: !config.allowSkipping })}
              className={`w-10 h-5 rounded-full transition-colors ${config.allowSkipping ? 'bg-[#005587]' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${config.allowSkipping ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Rubric (optional) */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#005587]">Rubric</h3>
            <button type="button" onClick={() => setStep(4)} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-medium">Skip →</button>
          </div>
          <RubricBuilder value={rubric} onChange={setRubric} autoLoadDefault={rubric.length === 0} />
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#005587]">Review</h3>
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs">
            <div><span className="text-gray-500">Topic:</span> <span className="font-medium">{config.topic}</span></div>
            <div><span className="text-gray-500">Lessons:</span> <span className="font-medium">{config.totalLessons} (~{config.estimatedMinutes}m)</span></div>
            <div><span className="text-gray-500">Completion:</span> <span className="font-medium">{config.completionPolicy === 'all-lessons' ? 'All Lessons' : config.completionPolicy === 'percentage' ? `${config.completionThreshold}% Required` : 'Final Quiz'}</span></div>
            <div><span className="text-gray-500">Skip Lessons:</span> <span className="font-medium">{config.allowSkipping ? 'Yes' : 'No (sequential)'}</span></div>
            <div><span className="text-gray-500">Rubric:</span> <span className="font-medium">{rubric.length > 0 ? `${rubric.length} categories` : 'None'}</span></div>
          </div>
          <div className="bg-blue-50 rounded-xl p-2.5">
            <p className="text-[10px] text-blue-700">💡 After creating, you'll add lesson content (videos, readings, quizzes) from the assignment detail page.</p>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button onClick={step === 1 ? onBack : () => setStep(step - 1)} className="px-4 py-2 text-xs text-gray-600 font-medium">Back</button>
        {step < 4 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="px-4 py-2 bg-[#005587] text-white rounded-xl text-xs font-medium disabled:opacity-50">Next</button>
        ) : (
          <button onClick={handleComplete} className="px-4 py-2 bg-[#FFC72C] text-[#005587] rounded-xl text-xs font-bold">Create Study Module</button>
        )}
      </div>
    </div>
  );
}
