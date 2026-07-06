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
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-[#005587] uppercase tracking-wide mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>
        Start from Template
      </h3>
      <p className="text-xs text-gray-500 mb-3">Select a pre-built rubric to customize</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {templates.map(([key, template]) => {
          const maxScore = getTemplateMaxScore(template.categories);
          const categoryCount = template.categories.length;

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleTemplateClick(key)}
              className="bg-gray-50 rounded-xl p-3 hover:bg-gray-100 cursor-pointer border border-transparent hover:border-[#005587]/20 text-left transition-all"
            >
              <p className="text-sm font-semibold text-gray-900 mb-0.5">
                {template.label}
              </p>
              <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                {template.description}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{categoryCount} {categoryCount === 1 ? 'category' : 'categories'}</span>
                <span>•</span>
                <span>{maxScore} pts max</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
