'use client';

import React, { useEffect, useState } from 'react';
import { RubricCategory, ScoringLevel, generateCategoryId } from '@/types/rubric';
import { TemplateRubricSelector } from './TemplateRubricSelector';
import { TEMPLATE_RUBRICS } from '@/lib/template-rubrics';
import { useAuth } from '@/contexts/AuthContext';

interface RubricBuilderProps {
  value: RubricCategory[];
  onChange: (rubric: RubricCategory[]) => void;
  disabled?: boolean;
  autoLoadDefault?: boolean;
}

export const RubricBuilder: React.FC<RubricBuilderProps> = ({
  value,
  onChange,
  disabled = false,
  autoLoadDefault = false,
}) => {
  const { user } = useAuth();
  const [savedMessage, setSavedMessage] = useState('');

  // Auto-load default template (Video Presentation) when rubric is empty
  useEffect(() => {
    if (autoLoadDefault && value.length === 0) {
      // Try loading instructor's custom default first
      if (user?.id) {
        fetch(`/api/instructor/rubric-templates?instructorId=${user.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data?.rubricTemplates?.length > 0) {
              onChange(data.data.rubricTemplates);
            } else if (TEMPLATE_RUBRICS.video_presentation) {
              onChange(TEMPLATE_RUBRICS.video_presentation.categories);
            }
          })
          .catch(() => {
            if (TEMPLATE_RUBRICS.video_presentation) {
              onChange(TEMPLATE_RUBRICS.video_presentation.categories);
            }
          });
      } else if (TEMPLATE_RUBRICS.video_presentation) {
        onChange(TEMPLATE_RUBRICS.video_presentation.categories);
      }
    }
  }, [autoLoadDefault]);

  const saveAsDefault = async () => {
    if (!user?.id || value.length === 0) return;
    try {
      await fetch('/api/instructor/rubric-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId: user.id, rubricTemplates: value }),
      });
      setSavedMessage('✓ Saved as your default');
      setTimeout(() => setSavedMessage(''), 2000);
    } catch {
      setSavedMessage('Failed to save');
      setTimeout(() => setSavedMessage(''), 2000);
    }
  };

  const handleTemplateSelect = (categories: RubricCategory[]) => {
    onChange(categories);
  };

  const addCategory = () => {
    const newCategory: RubricCategory = {
      id: generateCategoryId(),
      name: '',
      levels: [{ score: 0, description: '' }],
    };
    onChange([...value, newCategory]);
  };

  const removeCategory = (categoryId: string) => {
    onChange(value.filter((cat) => cat.id !== categoryId));
  };

  const updateCategoryName = (categoryId: string, name: string) => {
    onChange(
      value.map((cat) => (cat.id === categoryId ? { ...cat, name } : cat))
    );
  };

  const addLevel = (categoryId: string) => {
    onChange(
      value.map((cat) =>
        cat.id === categoryId
          ? { ...cat, levels: [...cat.levels, { score: 0, description: '' }] }
          : cat
      )
    );
  };

  const removeLevel = (categoryId: string, levelIndex: number) => {
    onChange(
      value.map((cat) =>
        cat.id === categoryId
          ? { ...cat, levels: cat.levels.filter((_, i) => i !== levelIndex) }
          : cat
      )
    );
  };

  const updateLevel = (
    categoryId: string,
    levelIndex: number,
    updates: Partial<ScoringLevel>
  ) => {
    onChange(
      value.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              levels: cat.levels.map((level, i) =>
                i === levelIndex ? { ...level, ...updates } : level
              ),
            }
          : cat
      )
    );
  };

  return (
    <div>
      <TemplateRubricSelector
        onSelect={handleTemplateSelect}
        hasExistingContent={value.length > 0}
      />

      <div className="space-y-4">
        {value.map((category) => (
          <div
            key={category.id}
            className="bg-white border border-gray-200 rounded-xl p-4 mb-4"
          >
            {/* Category header */}
            <div className="flex items-center justify-between mb-3">
              <input
                type="text"
                value={category.name}
                onChange={(e) => updateCategoryName(category.id, e.target.value)}
                placeholder="Category name"
                disabled={disabled}
                className="text-lg font-bold text-gray-900 border-b border-gray-200 focus:border-[#005587] focus:outline-none pb-1 flex-1 mr-3"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              />
              <button
                type="button"
                onClick={() => removeCategory(category.id)}
                disabled={disabled}
                className="text-red-500 text-sm hover:text-red-700 transition-colors whitespace-nowrap"
              >
                Remove Category
              </button>
            </div>

            {/* Scoring levels */}
            <div className="space-y-2">
              {category.levels.map((level, levelIndex) => (
                <div key={levelIndex} className="flex items-center gap-2">
                  <input
                    type="number"
                    value={level.score}
                    onChange={(e) =>
                      updateLevel(category.id, levelIndex, {
                        score: Number(e.target.value),
                      })
                    }
                    min={0}
                    disabled={disabled}
                    className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-center text-sm focus:border-[#005587] focus:outline-none"
                    placeholder="0"
                  />
                  <input
                    type="text"
                    value={level.description}
                    onChange={(e) =>
                      updateLevel(category.id, levelIndex, {
                        description: e.target.value,
                      })
                    }
                    placeholder="Level description"
                    disabled={disabled}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-[#005587] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeLevel(category.id, levelIndex)}
                    disabled={disabled}
                    className="text-red-500 text-sm hover:text-red-700 transition-colors"
                    aria-label="Remove level"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>

            {/* Add Level button */}
            <button
              type="button"
              onClick={() => addLevel(category.id)}
              disabled={disabled}
              className="mt-3 text-[#005587] text-sm font-medium hover:underline"
            >
              + Add Level
            </button>
          </div>
        ))}
      </div>

      {/* Add Category button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addCategory}
          disabled={disabled}
          className="bg-[#005587] text-white rounded-full px-4 py-2 text-sm font-bold hover:bg-[#004470] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add Category
        </button>
        {value.length > 0 && (
          <button
            type="button"
            onClick={saveAsDefault}
            className="text-xs text-[#005587] font-medium hover:underline"
          >
            Save as my default
          </button>
        )}
        {savedMessage && (
          <span className="text-xs text-green-600 font-medium">{savedMessage}</span>
        )}
      </div>
    </div>
  );
};
