'use client';

import React, { useState } from 'react';

interface AIAssignmentGeneratorProps {
  onGenerated: (data: any) => void;
  onCancel: () => void;
  userSubscription?: string;
}

const GRADE_LEVELS = [
  '3rd Grade', '4th Grade', '5th Grade', '6th Grade',
  '7th Grade', '8th Grade', '9th Grade', '10th Grade',
  '11th Grade', '12th Grade', 'College Freshman', 'College Sophomore',
];

const ASSIGNMENT_TYPES = [
  { value: 'video', label: '🎥 Video', desc: 'Record on camera' },
  { value: 'discussion', label: '💬 Discussion', desc: 'Class dialog' },
  { value: 'assessment', label: '📋 Assessment', desc: 'Timed questions' },
  { value: 'group-project', label: '🎬 Group Project', desc: 'Team videos' },
  { value: 'study-module', label: '📖 Study Module', desc: 'Self-paced' },
];

export function AIAssignmentGenerator({ onGenerated, onCancel, userSubscription }: AIAssignmentGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('9th Grade');
  const [assignmentType, setAssignmentType] = useState('video');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [isSubscribed, setIsSubscribed] = React.useState(userSubscription === 'pro' || userSubscription === 'enterprise');

  // Check subscription on mount
  React.useEffect(() => {
    const checkSub = async () => {
      try {
        const res = await fetch('/api/profile?userId=' + (window as any).__classcast_user_id);
        if (res.ok) {
          const data = await res.json();
          if (data.success && (data.data?.subscription === 'pro' || data.data?.subscriptionTier === 'enterprise')) {
            setIsSubscribed(true);
          }
        }
      } catch {}
    };
    if (!isSubscribed) checkSub();
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) { setError('Please enter a topic or standard'); return; }
    
    // Subscription gate
    if (!isSubscribed) {
      setError('');
      return; // Gate will show upgrade message
    }

    setIsGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/ai/generate-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), gradeLevel, assignmentType, additionalContext: additionalContext.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        onGenerated(data.data);
      } else {
        setError(data.error || 'Generation failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h2 className="text-lg font-bold text-[#005587]">AI Assignment Generator</h2>
        </div>
        <button onClick={onCancel} className="text-xs text-gray-500">Cancel</button>
      </div>

      <p className="text-xs text-gray-500">Enter a topic or standard and AI will generate a complete assignment with instructions, rubric, and questions.</p>

      {/* Topic Input */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Topic or Standard</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Pythagorean Theorem, Photosynthesis, Civil War Causes..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
        />
      </div>

      {/* Grade Level */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Grade Level</label>
        <select
          value={gradeLevel}
          onChange={(e) => setGradeLevel(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none"
        >
          {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Assignment Type */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Assignment Type</label>
        <div className="grid grid-cols-2 gap-1.5">
          {ASSIGNMENT_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setAssignmentType(t.value)}
              className={`p-2 rounded-xl border text-left transition-colors ${
                assignmentType === t.value ? 'border-[#005587] bg-[#005587]/5' : 'border-gray-200'
              }`}
            >
              <span className="text-xs font-medium text-gray-900">{t.label}</span>
              <p className="text-[9px] text-gray-500">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Additional Context (optional) */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Additional Context (optional)</label>
        <textarea
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          placeholder="Any specific requirements, state standards, focus areas..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs resize-none focus:border-[#005587] focus:outline-none"
        />
      </div>

      {/* Error */}
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {/* Subscription Gate */}
      {!isSubscribed ? (
        <div className="bg-gradient-to-r from-[#005587]/5 to-[#FFC72C]/10 border border-[#005587]/20 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h3 className="text-sm font-bold text-[#005587]">Premium Feature</h3>
              <p className="text-xs text-gray-600 mt-1">
                AI Assignment Generation requires a ClassCast Pro subscription. Contact your school administrator to upgrade.
              </p>
              <button className="mt-2 px-4 py-1.5 bg-[#FFC72C] text-[#005587] rounded-full text-xs font-bold">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className="w-full py-3 bg-gradient-to-r from-[#005587] to-[#0077aa] text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>✨ Generate Assignment</>
          )}
        </button>
      )}
    </div>
  );
}
