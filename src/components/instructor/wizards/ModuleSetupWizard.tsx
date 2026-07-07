'use client';

import React, { useState } from 'react';
import { ModuleConfig } from '@/types/module';

interface ModuleSetupWizardProps {
  onComplete: (config: ModuleConfig) => void;
  onBack: () => void;
}

export function ModuleSetupWizard({ onComplete, onBack }: ModuleSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<ModuleConfig>({
    topic: '',
    requiredVideos: 5,
    maxVideoDurationSeconds: 300,
    groupFormation: 'random',
    groupSize: 4,
    gradingPolicy: 'shared',
  });

  const canProceed = step === 1 ? config.topic.trim().length >= 5 : true;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 mb-4">
        {[1, 2, 3].map(s => <div key={s} className={`w-2 h-2 rounded-full ${s <= step ? 'bg-[#005587]' : 'bg-gray-200'}`} />)}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#005587]">Module Info</h3>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Topic</label>
            <input type="text" value={config.topic} onChange={(e) => setConfig({ ...config, topic: e.target.value })} placeholder="Module topic..." className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[#005587]" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Required Videos: {config.requiredVideos}</label>
            <input type="range" min={2} max={20} value={config.requiredVideos} onChange={(e) => setConfig({ ...config, requiredVideos: Number(e.target.value) })} className="w-full accent-[#005587]" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Max Duration per Video: {config.maxVideoDurationSeconds}s</label>
            <input type="range" min={30} max={600} step={30} value={config.maxVideoDurationSeconds} onChange={(e) => setConfig({ ...config, maxVideoDurationSeconds: Number(e.target.value) })} className="w-full accent-[#005587]" />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#005587]">Group & Grading</h3>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">Group Formation</label>
            <div className="space-y-2">
              {(['random', 'manual', 'self-selection'] as const).map(method => (
                <button key={method} type="button" onClick={() => setConfig({ ...config, groupFormation: method })} className={`w-full p-2 rounded-xl border text-xs text-left ${config.groupFormation === method ? 'border-[#005587] bg-[#005587]/5' : 'border-gray-200'}`}>
                  {method === 'random' ? '🎲 Random Assignment' : method === 'manual' ? '✋ Manual Assignment' : '👋 Student Self-Selection'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Group Size: {config.groupSize}</label>
            <input type="range" min={2} max={8} value={config.groupSize} onChange={(e) => setConfig({ ...config, groupSize: Number(e.target.value) })} className="w-full accent-[#005587]" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">Grading Policy</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfig({ ...config, gradingPolicy: 'shared' })} className={`flex-1 py-2 rounded-lg text-xs font-medium ${config.gradingPolicy === 'shared' ? 'bg-[#005587] text-white' : 'bg-gray-100 text-gray-600'}`}>Shared Grade</button>
              <button type="button" onClick={() => setConfig({ ...config, gradingPolicy: 'individual' })} className={`flex-1 py-2 rounded-lg text-xs font-medium ${config.gradingPolicy === 'individual' ? 'bg-[#005587] text-white' : 'bg-gray-100 text-gray-600'}`}>Individual</button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#005587]">Review</h3>
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs">
            <div><span className="text-gray-500">Topic:</span> <span className="font-medium">{config.topic}</span></div>
            <div><span className="text-gray-500">Videos:</span> <span className="font-medium">{config.requiredVideos} (max {config.maxVideoDurationSeconds}s each)</span></div>
            <div><span className="text-gray-500">Groups:</span> <span className="font-medium">{config.groupFormation} ({config.groupSize} per group)</span></div>
            <div><span className="text-gray-500">Grading:</span> <span className="font-medium">{config.gradingPolicy}</span></div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button onClick={step === 1 ? onBack : () => setStep(step - 1)} className="px-4 py-2 text-xs text-gray-600 font-medium">Back</button>
        {step < 3 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canProceed} className="px-4 py-2 bg-[#005587] text-white rounded-xl text-xs font-medium disabled:opacity-50">Next</button>
        ) : (
          <button onClick={() => onComplete(config)} className="px-4 py-2 bg-[#FFC72C] text-[#005587] rounded-xl text-xs font-bold">Create Module</button>
        )}
      </div>
    </div>
  );
}
