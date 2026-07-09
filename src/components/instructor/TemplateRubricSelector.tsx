'use client';

import React, { useState } from 'react';
import { TEMPLATE_RUBRICS } from '@/lib/template-rubrics';
import { RubricCategory, getCategoryMaxScore } from '@/types/rubric';

interface TemplateRubricSelectorProps {
  onSelect: (categories: RubricCategory[]) => void;
  hasExistingContent: boolean;
}

export const TemplateRubricSelector: React.FC<TemplateRubricSelectorProps> = ({
  onSelect,
  hasExistingContent,
}) => {
  const [pendingTemplateKey, setPendingTemplateKey] = useState<string | null>(null);

  const templates = Object.entries(TEMPLATE_RUBRICS);

  const handleTemplateClick = (key: string) => {
    if (hasExistingContent) {
      setPendingTemplateKey(key);
    } else {
      onSelect(TEMPLATE_RUBRICS[key].categories);
    }
  };

  const handleConfirm = () => {
    if (pendingTemplateKey) {
      onSelect(TEMPLATE_RUBRICS[pendingTemplateKey].categories);
      setPendingTemplateKey(null);
    }
  };

  const handleCancel = () => {
    setPendingTemplateKey(null);
  };

  const getTemplateMaxScore = (categories: RubricCategory[]): number => {
    return categories.reduce((sum, cat) => sum + getCategoryMaxScore(cat), 0);
  };

  // Show confirmation UI instead of the card grid
  if (pendingTemplateKey) {
    const template = TEMPLATE_RUBRICS[pendingTemplateKey];
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-[#005587] uppercase tracking-wide mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>
          Start from Template
        </h3>
        <p className="text-xs text-gray-500 mb-3">Select a pre-built rubric to customize</p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-gray-800 mb-3">
            This will replace your current rubric with <span className="font-semibold">&ldquo;{template.label}&rdquo;</span>. Continue?
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="px-3 py-1.5 bg-[#005587] text-white text-sm font-medium rounded-lg hover:bg-[#004470] transition-colors"
            >
              Replace Rubric
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-gray-500 tracking-wide mb-2">
        Templates
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {templates.map(([key, template]) => {
          const maxScore = getTemplateMaxScore(template.categories);
          const isDefault = key === 'video_presentation';

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleTemplateClick(key)}
              className={`rounded-xl p-2.5 text-left transition-all border ${
                isDefault && !hasExistingContent
                  ? 'border-[#005587] bg-[#005587]/5'
                  : 'border-transparent bg-gray-50 hover:bg-gray-100 hover:border-gray-200'
              }`}
            >
              <p className="text-xs font-bold text-gray-900 truncate">
                {template.label}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {template.categories.length} cat • {maxScore} pts
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
