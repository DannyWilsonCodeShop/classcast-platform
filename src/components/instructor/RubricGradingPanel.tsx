'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RubricCategory,
  getCategoryMaxScore,
  calculateTotal,
} from '@/types/rubric';

export interface RubricGradingPanelProps {
  rubric: RubricCategory[];
  submissionId: string;
  initialScores?: Record<string, number>;
  onScoresChange?: (scores: Record<string, number>, total: number) => void;
}

interface CategoryScoreRowProps {
  category: RubricCategory;
  value: number;
  maxValue: number;
  onChange: (value: number) => void;
}

function CategoryScoreRow({ category, value, maxValue, onChange }: CategoryScoreRowProps) {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(Math.max(0, Math.min(newValue, maxValue)));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value);
    if (isNaN(raw)) return;
    const clamped = Math.max(0, Math.min(raw, maxValue));
    onChange(clamped);
  };

  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100">
      <span className="text-xs font-medium text-gray-900 min-w-[80px] max-w-[100px] truncate" title={category.name}>
        {category.name}
      </span>
      <input
        type="range"
        min={0}
        max={maxValue}
        value={value}
        onChange={handleSliderChange}
        className="w-full accent-[#005587]"
        aria-label={`Score for ${category.name}`}
      />
      <input
        type="number"
        min={0}
        max={maxValue}
        value={value}
        onChange={handleNumberChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            // Scope to rubric inputs within the SAME grading card only
            const card = (e.target as Element).closest('[data-grading-card]');
            if (!card) return;
            const inputs = card.querySelectorAll('[data-rubric-input]');
            const currentIndex = Array.from(inputs).indexOf(e.target as Element);
            const next = inputs[currentIndex + 1] as HTMLElement;
            if (next) {
              next.focus();
            } else {
              // Last rubric input in this card — focus the feedback textarea
              const feedbackTextarea = card.querySelector('[data-feedback-input]') as HTMLElement;
              if (feedbackTextarea) feedbackTextarea.focus();
            }
          }
        }}
        data-rubric-input
        className="w-16 px-2 py-1 text-center border border-gray-200 rounded-lg text-sm"
        aria-label={`Score input for ${category.name}`}
      />
      <span className="text-sm text-gray-500 whitespace-nowrap">/ {maxValue}</span>
    </div>
  );
}

export function RubricGradingPanel({
  rubric,
  submissionId,
  initialScores,
  onScoresChange,
}: RubricGradingPanelProps) {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    if (initialScores) return { ...initialScores };
    const initial: Record<string, number> = {};
    rubric.forEach((cat) => {
      initial[cat.id] = 0;
    });
    return initial;
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const saveGrade = useCallback(
    async (currentScores: Record<string, number>) => {
      const total = calculateTotal(currentScores);
      setSaveStatus('saving');
      try {
        const res = await fetch(`/api/submissions/${submissionId}/grade`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grade: total,
            rubricScores: currentScores,
            gradingMethod: 'rubric',
          }),
        });
        const data = await res.json();
        if (isMountedRef.current) {
          if (res.ok && data.success) {
            setSaveStatus('saved');
            setTimeout(() => {
              if (isMountedRef.current) setSaveStatus('idle');
            }, 2000);
          } else {
            console.error('Grade save failed:', data.error || res.status);
            setSaveStatus('idle');
          }
        }
      } catch (err) {
        console.error('Grade save error:', err);
        if (isMountedRef.current) {
          setSaveStatus('idle');
        }
      }
    },
    [submissionId]
  );

  const handleScoreChange = useCallback(
    (categoryId: string, value: number) => {
      setScores((prev) => {
        const updated = { ...prev, [categoryId]: value };
        const total = calculateTotal(updated);

        if (onScoresChange) {
          onScoresChange(updated, total);
        }

        // Debounced auto-save
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
          saveGrade(updated);
        }, 1000);

        return updated;
      });
    },
    [onScoresChange, saveGrade]
  );

  const handleSetAllToMax = () => {
    const maxScores: Record<string, number> = {};
    rubric.forEach((cat) => {
      maxScores[cat.id] = getCategoryMaxScore(cat) || (cat as any).maxPoints || 0;
    });
    setScores(maxScores);

    const total = calculateTotal(maxScores);
    if (onScoresChange) {
      onScoresChange(maxScores, total);
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      saveGrade(maxScores);
    }, 1000);
  };

  const total = calculateTotal(scores);
  const maxPossible = rubric.reduce(
    (sum, cat) => sum + (getCategoryMaxScore(cat) || (cat as any).maxPoints || 0),
    0
  );

  return (
    <div className="bg-white rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Rubric Grading</h3>
        <div className="flex items-center gap-3">
          {saveStatus === 'saving' && (
            <span className="text-xs text-gray-500">Saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-600">Saved ✓</span>
          )}
          <button
            type="button"
            onClick={handleSetAllToMax}
            className="text-xs text-[#005587] font-medium hover:underline"
          >
            Set All to Maximum
          </button>
        </div>
      </div>

      <div className="space-y-0">
        {rubric.map((category) => {
          // Handle both old format (maxPoints) and new format (levels)
          const maxValue = getCategoryMaxScore(category) || (category as any).maxPoints || 0;
          return (
            <CategoryScoreRow
              key={category.id}
              category={category}
              value={scores[category.id] ?? 0}
              maxValue={maxValue}
              onChange={(val) => handleScoreChange(category.id, val)}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
        <span className="text-base font-bold text-[#005587]">Total</span>
        <span className="text-base font-bold text-[#005587]">
          {total} / {maxPossible}
        </span>
      </div>
    </div>
  );
}

export default RubricGradingPanel;
