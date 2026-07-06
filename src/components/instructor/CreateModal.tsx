'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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
    description: 'Add instructional video content',
    icon: '🎬',
    route: '/instructor/lesson-modules',
  },
];

export function CreateModal({ isOpen, onClose }: CreateModalProps) {
  const router = useRouter();

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const handleOptionClick = (route: string) => {
    onClose();
    router.push(route);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Create content"
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-[380px] w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-lg font-bold text-[#005587] mb-4"
          style={{ fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}
        >
          What do you want to create?
        </h2>

        <div className="space-y-3">
          {CREATE_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.route)}
              className="w-full bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 cursor-pointer transition-colors text-left flex items-center gap-4"
            >
              <span className="text-2xl" role="img" aria-label={option.label}>
                {option.icon}
              </span>
              <div>
                <span
                  className="block text-sm font-bold text-[#005587]"
                  style={{ fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}
                >
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
    </div>
  );
}
