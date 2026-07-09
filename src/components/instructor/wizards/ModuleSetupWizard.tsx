'use client';

import React, { useState } from 'react';
import { ModuleConfig } from '@/types/module';
import { RubricBuilder } from '@/components/instructor/RubricBuilder';
import { RubricCategory } from '@/types/rubric';

interface ModuleSetupWizardProps {
  onComplete: (config: ModuleConfig) => void;
  onBack: () => void;
}

const DEFAULT_GROUP_PROJECT_DIRECTIONS = `Work with your group to create a series of short videos on the assigned topic. Each group member should contribute at least one video. Coordinate with your team to cover different aspects of the topic. All videos must be uploaded before the due date.`;

export function ModuleSetupWizard({ onComplete, onBack }: ModuleSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [directions, setDirections] = useState(DEFAULT_GROUP_PROJECT_DIRECTIONS);
  const [rubric, setRubric] = useState<RubricCategory[]>([]);
  const [config, setConfig] = useState<ModuleConfig>({
    topic: '',
    requiredVideos: 5,
    maxVideoDurationSeconds: 300,
    groupFormation: 'random',
    groupSize: 4,
    gradingPolicy: 'shared',
  });

  const canProceed = () => {
    if (step === 1) return config.topic.trim().length >= 3;
    return true;
  };

  const handleComplete = () => {
    const finalConfig = { ...config, directions, rubric: rubric.length > 0 ? rubric : undefined } as any;
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
          <h3 className="text-sm font-bold text-[#005587]">Group Project Info</h3>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Topic</label>
            <input type="text" value={config.topic} onChange={(e) => setConfig({ ...config, topic: e.target.value })} placeholder="e.g., Climate Change Solutions" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[#005587] focus:outline-none" />
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
            <label className="text-xs font-medium text-gray-600 block mb-1">Required Videos: {config.requiredVideos}</label>
            <input type="range" min={2} max={20} value={config.requiredVideos} onChange={(e) => setConfig({ ...config, requiredVideos: Number(e.target.value) })} className="w-full accent-[#005587]" />
            <div className="flex justify-between text-[10px] text-gray-400"><span>2</span><span>20</span></div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Max Duration per Video: {Math.floor(config.maxVideoDurationSeconds / 60)}m {config.maxVideoDurationSeconds % 60}s</label>
            <input type="range" min={30} max={600} step={30} value={config.maxVideoDurationSeconds} onChange={(e) => setConfig({ ...config, maxVideoDurationSeconds: Number(e.target.value) })} className="w-full accent-[#005587]" />
            <div className="flex justify-between text-[10px] text-gray-400"><span>30s</span><span>10m</span></div>
          </div>
        </div>
      )}

      {/* Step 2: Group Formation & Grading */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#005587]">Group Setup</h3>
          <p className="text-xs text-gray-500">How should groups be formed?</p>
          
          <div className="space-y-2">
            <button type="button" onClick={() => setConfig({ ...config, groupFormation: 'random' })} className={`w-full p-3 rounded-xl border text-left ${config.groupFormation === 'random' ? 'border-[#005587] bg-[#005587]/5' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <span className="text-base">🎲</span>
                <div>
                  <p className="text-xs font-bold text-gray-900">Random</p>
                  <p className="text-[10px] text-gray-500">System randomly assigns students to groups</p>
                </div>
              </div>
            </button>
            <button type="button" onClick={() => setConfig({ ...config, groupFormation: 'manual' })} className={`w-full p-3 rounded-xl border text-left ${config.groupFormation === 'manual' ? 'border-[#005587] bg-[#005587]/5' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <span className="text-base">✋</span>
                <div>
                  <p className="text-xs font-bold text-gray-900">Teacher Assigned</p>
                  <p className="text-[10px] text-gray-500">You manually place students into groups after creating</p>
                </div>
              </div>
            </button>
            <button type="button" onClick={() => setConfig({ ...config, groupFormation: 'self-selection' })} className={`w-full p-3 rounded-xl border text-left ${config.groupFormation === 'self-selection' ? 'border-[#005587] bg-[#005587]/5' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <span className="text-base">👋</span>
                <div>
                  <p className="text-xs font-bold text-gray-900">Student Chosen</p>
                  <p className="text-[10px] text-gray-500">Students pick their own groups (first-come, first-served)</p>
                </div>
              </div>
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Group Size: {config.groupSize} students</label>
            <input type="range" min={2} max={8} value={config.groupSize} onChange={(e) => setConfig({ ...config, groupSize: Number(e.target.value) })} className="w-full accent-[#005587]" />
            <div className="flex justify-between text-[10px] text-gray-400"><span>2</span><span>8</span></div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">Grading Policy</label>
            <div className="space-y-2">
              <button type="button" onClick={() => setConfig({ ...config, gradingPolicy: 'shared' })} className={`w-full p-3 rounded-xl border text-left ${config.gradingPolicy === 'shared' ? 'border-[#005587] bg-[#005587]/5' : 'border-gray-200'}`}>
                <div>
                  <p className="text-xs font-bold text-gray-900">Shared Grade</p>
                  <p className="text-[10px] text-gray-500">All group members receive the same grade</p>
                </div>
              </button>
              <button type="button" onClick={() => setConfig({ ...config, gradingPolicy: 'individual' })} className={`w-full p-3 rounded-xl border text-left ${config.gradingPolicy === 'individual' ? 'border-[#005587] bg-[#005587]/5' : 'border-gray-200'}`}>
                <div>
                  <p className="text-xs font-bold text-gray-900">Individual</p>
                  <p className="text-[10px] text-gray-500">Each member graded separately on their contribution</p>
                </div>
              </button>
            </div>
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
            <div><span className="text-gray-500">Videos:</span> <span className="font-medium">{config.requiredVideos} (max {Math.floor(config.maxVideoDurationSeconds / 60)}m each)</span></div>
            <div><span className="text-gray-500">Groups:</span> <span className="font-medium">{config.groupFormation === 'manual' ? 'Teacher Assigned' : config.groupFormation === 'self-selection' ? 'Student Chosen' : 'Random'} ({config.groupSize} per group)</span></div>
            <div><span className="text-gray-500">Grading:</span> <span className="font-medium">{config.gradingPolicy === 'shared' ? 'Shared Grade' : 'Individual'}</span></div>
            <div><span className="text-gray-500">Rubric:</span> <span className="font-medium">{rubric.length > 0 ? `${rubric.length} categories` : 'None'}</span></div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button onClick={step === 1 ? onBack : () => setStep(step - 1)} className="px-4 py-2 text-xs text-gray-600 font-medium">Back</button>
        {step < 4 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="px-4 py-2 bg-[#005587] text-white rounded-xl text-xs font-medium disabled:opacity-50">Next</button>
        ) : (
          <button onClick={handleComplete} className="px-4 py-2 bg-[#FFC72C] text-[#005587] rounded-xl text-xs font-bold">Create Group Project</button>
        )}
      </div>
    </div>
  );
}
