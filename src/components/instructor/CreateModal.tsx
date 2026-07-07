'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ModalTransition from '@/components/transitions/ModalTransition';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreateOption {
  id: 'course' | 'assignment' | 'module';
  label: string;
  description: string;
  icon: string;
  route: string;
  disabled?: boolean;
}

const CREATE_OPTIONS: CreateOption[] = [
  {
    id: 'course',
    label: 'New Course',
    description: 'Create a new class for your students',
    icon: '📚',
    route: '/instructor/classes/create',
  },
  {
    id: 'assignment',
    label: 'New Assignment',
    description: 'Build an assignment with rubric grading',
    icon: '📝',
    route: '/instructor/assignments/create',
  },
  {
    id: 'module',
    label: 'New Module',
    description: 'Coming soon',
    icon: '🎬',
    route: '',
    disabled: true,
  },
];

export function CreateModal({ isOpen, onClose }: CreateModalProps) {
  const router = useRouter();

  const handleOptionClick = (option: CreateOption) => {
    if (option.disabled) return;
    onClose();
    router.push(option.route);
  };

  return (
    <ModalTransition isOpen={isOpen} onClose={onClose}>
      <div className="bg-white w-full rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#005587]">
            What do you want to create?
          </h2>
          <button onClick={onClose} className="text-gray-400 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {CREATE_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option)}
              disabled={option.disabled}
              className={`w-full bg-gray-50 rounded-2xl p-4 transition-colors text-left flex items-center gap-4 active:scale-[0.98] transition-transform ${
                option.disabled ? 'opacity-50' : 'hover:bg-gray-100'
              }`}
            >
              <span className="text-2xl" role="img" aria-label={option.label}>
                {option.icon}
              </span>
              <div>
                <span className="block text-sm font-bold text-[#005587]">
                  {option.label}
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  {option.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </ModalTransition>
  );
}
