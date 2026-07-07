'use client';
import React, { useState } from 'react';
import { DiscussionConfig } from '@/types/discussion';

interface DiscussionSetupWizardProps {
  onComplete: (config: DiscussionConfig) => void;
  onBack: () => void;
}

export function DiscussionSetupWizard({ onComplete, onBack }: DiscussionSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<DiscussionConfig>({
    prompt: '',
    format: 'whole-class',
    groupSize: 5,
    allowedResponseTypes: 'both',
    minPosts: 2,
    minWordCount: 50,
    maxVideoDurationSeconds: 120,
  });

  const canProceed = () => {
    if (step === 1) return config.prompt.trim().length >= 10;
    return true;
  };

  const handleComplete = () => onComplete(config);

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full ${s <= step ? 'bg-[#005587]' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#005587]">Discussion Prompt</h3>
          <textarea
            value={config.prompt}
            onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
            placeholder="Enter the discussion prompt or question (min 10 characters)..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:ring-1 focus:ring-[#005587] focus:border-[#005587] focus:outline-none"
          />
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">Format</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfig({ ...config, format: 'whole-class' })}
                className={`flex-1 py-2 rounded-lg text-xs font-medium ${
                  config.format === 'whole-class'
                    ? 'bg-[#005587] text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Whole Class
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, format: 'small-groups' })}
                className={`flex-1 py-2 rounded-lg text-xs font-medium ${
                  config.format === 'small-groups'
                    ? 'bg-[#005587] text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Small Groups
              </button>
            </div>
          </div>
          {config.format === 'small-groups' && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Group Size: {config.groupSize}
              </label>
              <input
                type="range"
                min={3}
                max={10}
                value={config.groupSize}
                onChange={(e) => setConfig({ ...config, groupSize: Number(e.target.value) })}
                className="w-full accent-[#005587]"
              />
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#005587]">Participation Rules</h3>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Minimum Posts Required
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={config.minPosts}
              onChange={(e) => setConfig({ ...config, minPosts: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[#005587] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Minimum Word Count per Post
            </label>
            <input
              type="number"
              min={0}
              max={1000}
              value={config.minWordCount}
              onChange={(e) => setConfig({ ...config, minWordCount: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[#005587] focus:outline-none"
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#005587]">Response Settings</h3>
          <div className="space-y-2">
            {(['both', 'text', 'video'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setConfig({ ...config, allowedResponseTypes: type })}
                className={`w-full p-3 rounded-xl border text-left text-sm ${
                  config.allowedResponseTypes === type
                    ? 'border-[#005587] bg-[#005587]/5 font-medium'
                    : 'border-gray-200'
                }`}
              >
                {type === 'both'
                  ? '💬🎥 Text & Video'
                  : type === 'text'
                    ? '💬 Text Only'
                    : '🎥 Video Only'}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#005587]">Review</h3>
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs">
            <div>
              <span className="text-gray-500">Format:</span>{' '}
              <span className="font-medium">
                {config.format === 'whole-class'
                  ? 'Whole Class'
                  : `Small Groups (${config.groupSize})`}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Min Posts:</span>{' '}
              <span className="font-medium">{config.minPosts}</span>
            </div>
            <div>
              <span className="text-gray-500">Min Words:</span>{' '}
              <span className="font-medium">{config.minWordCount}</span>
            </div>
            <div>
              <span className="text-gray-500">Response Type:</span>{' '}
              <span className="font-medium">{config.allowedResponseTypes}</span>
            </div>
            <div>
              <span className="text-gray-500">Prompt:</span>{' '}
              <span className="font-medium">
                {config.prompt.substring(0, 80)}
                {config.prompt.length > 80 ? '...' : ''}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <button
          onClick={step === 1 ? onBack : () => setStep(step - 1)}
          className="px-4 py-2 text-xs text-gray-600 font-medium"
        >
          Back
        </button>
        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="px-4 py-2 bg-[#005587] text-white rounded-xl text-xs font-medium disabled:opacity-50"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="px-4 py-2 bg-[#FFC72C] text-[#005587] rounded-xl text-xs font-bold"
          >
            Create Discussion
          </button>
        )}
      </div>
    </div>
  );
}
