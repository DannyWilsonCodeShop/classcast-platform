'use client';
import React, { useState } from 'react';
import { DiscussionConfig } from '@/types/discussion';
import { RubricBuilder } from '@/components/instructor/RubricBuilder';
import { RubricCategory } from '@/types/rubric';

interface DiscussionSetupWizardProps {
  onComplete: (config: DiscussionConfig) => void;
  onBack: () => void;
}

const DEFAULT_DIRECTIONS = `Participate in this discussion by responding to the prompt below. Read your classmates' posts and respond thoughtfully to at least one other student.`;

export function DiscussionSetupWizard({ onComplete, onBack }: DiscussionSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [directions, setDirections] = useState(DEFAULT_DIRECTIONS);
  const [rubric, setRubric] = useState<RubricCategory[]>([]);
  const [groupFormation, setGroupFormation] = useState<'random' | 'teacher-assigned' | 'student-chosen'>('random');
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
    if (step === 1) return config.prompt.trim().length >= 5;
    return true;
  };

  const handleComplete = () => {
    const finalConfig = { ...config, directions, groupFormation, rubric: rubric.length > 0 ? rubric : undefined } as any;
    onComplete(finalConfig);
  };

  const totalSteps = 5;

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <div key={s} className={`w-2 h-2 rounded-full ${s <= step ? 'bg-[#005587]' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Step 1: Prompt & Format */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#005587]">What should students discuss?</h3>
          
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Discussion Prompt</label>
            <textarea
              value={config.prompt}
              onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
              placeholder="e.g., What are the key differences between mitosis and meiosis?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:ring-1 focus:ring-[#005587] focus:border-[#005587] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Directions (editable)</label>
            <textarea
              value={directions}
              onChange={(e) => setDirections(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs resize-none focus:ring-1 focus:ring-[#005587] focus:border-[#005587] focus:outline-none text-gray-600"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">Format</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfig({ ...config, format: 'whole-class' })} className={`flex-1 py-2 rounded-lg text-xs font-medium ${config.format === 'whole-class' ? 'bg-[#005587] text-white' : 'bg-gray-100 text-gray-600'}`}>
                Whole Class
              </button>
              <button type="button" onClick={() => setConfig({ ...config, format: 'small-groups' })} className={`flex-1 py-2 rounded-lg text-xs font-medium ${config.format === 'small-groups' ? 'bg-[#005587] text-white' : 'bg-gray-100 text-gray-600'}`}>
                Small Groups
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Small Group Setup (only if small-groups selected) OR Response Type */}
      {step === 2 && (
        <div className="space-y-4">
          {config.format === 'small-groups' ? (
            <>
              <h3 className="text-sm font-bold text-[#005587]">Small Group Setup</h3>
              <p className="text-xs text-gray-500">How should groups be formed?</p>
              
              <div className="space-y-2">
                <button type="button" onClick={() => setGroupFormation('random')} className={`w-full p-3 rounded-xl border text-left ${groupFormation === 'random' ? 'border-[#005587] bg-[#005587]/5' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎲</span>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Random</p>
                      <p className="text-[10px] text-gray-500">System randomly assigns students to groups</p>
                    </div>
                  </div>
                </button>
                <button type="button" onClick={() => setGroupFormation('teacher-assigned')} className={`w-full p-3 rounded-xl border text-left ${groupFormation === 'teacher-assigned' ? 'border-[#005587] bg-[#005587]/5' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">✋</span>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Teacher Assigned</p>
                      <p className="text-[10px] text-gray-500">You manually place students into groups after creating</p>
                    </div>
                  </div>
                </button>
                <button type="button" onClick={() => setGroupFormation('student-chosen')} className={`w-full p-3 rounded-xl border text-left ${groupFormation === 'student-chosen' ? 'border-[#005587] bg-[#005587]/5' : 'border-gray-200'}`}>
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
                <input type="range" min={3} max={10} value={config.groupSize} onChange={(e) => setConfig({ ...config, groupSize: Number(e.target.value) })} className="w-full accent-[#005587]" />
                <div className="flex justify-between text-[10px] text-gray-400"><span>3</span><span>10</span></div>
              </div>

              <div className="bg-blue-50 rounded-xl p-2.5">
                <p className="text-[10px] text-blue-700">
                  {groupFormation === 'random' && '💡 Groups will be randomly assigned when the discussion opens. All group members will grade together.'}
                  {groupFormation === 'teacher-assigned' && '💡 After creating, go to the assignment details to drag students into groups.'}
                  {groupFormation === 'student-chosen' && '💡 Students will see a "Join Group" button. Groups close once full.'}
                </p>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-bold text-[#005587]">Response Type</h3>
              <p className="text-xs text-gray-500">How can students respond?</p>
              <div className="space-y-2">
                {(['both', 'text', 'video'] as const).map((type) => (
                  <button key={type} type="button" onClick={() => setConfig({ ...config, allowedResponseTypes: type })} className={`w-full p-3 rounded-xl border text-left text-sm ${config.allowedResponseTypes === type ? 'border-[#005587] bg-[#005587]/5 font-medium' : 'border-gray-200'}`}>
                    {type === 'both' ? '💬🎥 Text & Video responses' : type === 'text' ? '💬 Text responses only' : '🎥 Video responses only'}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 3: Response Type (for small groups) or Participation Rules */}
      {step === 3 && (
        <div className="space-y-4">
          {config.format === 'small-groups' ? (
            <>
              <h3 className="text-sm font-bold text-[#005587]">Response Type</h3>
              <p className="text-xs text-gray-500">How can students respond?</p>
              <div className="space-y-2">
                {(['both', 'text', 'video'] as const).map((type) => (
                  <button key={type} type="button" onClick={() => setConfig({ ...config, allowedResponseTypes: type })} className={`w-full p-3 rounded-xl border text-left text-sm ${config.allowedResponseTypes === type ? 'border-[#005587] bg-[#005587]/5 font-medium' : 'border-gray-200'}`}>
                    {type === 'both' ? '💬🎥 Text & Video responses' : type === 'text' ? '💬 Text responses only' : '🎥 Video responses only'}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-bold text-[#005587]">Participation Rules</h3>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Minimum Posts Required</label>
                <input type="number" min={1} max={50} value={config.minPosts} onChange={(e) => setConfig({ ...config, minPosts: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[#005587] focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Minimum Word Count per Post</label>
                <input type="number" min={0} max={1000} value={config.minWordCount} onChange={(e) => setConfig({ ...config, minWordCount: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[#005587] focus:outline-none" />
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 4: Rubric (optional) */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#005587]">Rubric</h3>
            <button type="button" onClick={() => setStep(5)} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-medium">Skip →</button>
          </div>
          <RubricBuilder value={rubric} onChange={setRubric} autoLoadDefault={rubric.length === 0} />
        </div>
      )}

      {/* Step 5: Review */}
      {step === 5 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#005587]">Review</h3>
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs">
            <div><span className="text-gray-500">Prompt:</span> <span className="font-medium">{config.prompt.substring(0, 60)}{config.prompt.length > 60 ? '...' : ''}</span></div>
            <div><span className="text-gray-500">Format:</span> <span className="font-medium">{config.format === 'whole-class' ? 'Whole Class' : `Small Groups (${config.groupSize}, ${groupFormation})`}</span></div>
            <div><span className="text-gray-500">Responses:</span> <span className="font-medium">{config.allowedResponseTypes === 'both' ? 'Text & Video' : config.allowedResponseTypes}</span></div>
            <div><span className="text-gray-500">Min Posts:</span> <span className="font-medium">{config.minPosts}</span></div>
            <div><span className="text-gray-500">Rubric:</span> <span className="font-medium">{rubric.length > 0 ? `${rubric.length} categories` : 'None'}</span></div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <button onClick={step === 1 ? onBack : () => setStep(step - 1)} className="px-4 py-2 text-xs text-gray-600 font-medium">Back</button>
        {step < totalSteps ? (
          <button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="px-4 py-2 bg-[#005587] text-white rounded-xl text-xs font-medium disabled:opacity-50">Next</button>
        ) : (
          <button onClick={handleComplete} className="px-4 py-2 bg-[#FFC72C] text-[#005587] rounded-xl text-xs font-bold">Create Discussion</button>
        )}
      </div>
    </div>
  );
}
