'use client';

import React, { useState } from 'react';

interface ProblemReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: {
    problemId: string;
    content: string;
    imageUrl?: string;
  } | null;
  studentName: string;
}

/**
 * Slide-over modal showing the student's assigned problem during grading.
 * Positioned as a bottom sheet on mobile to not obscure the video player.
 */
export function ProblemReferenceModal({ isOpen, onClose, problem, studentName }: ProblemReferenceModalProps) {
  const [showZoom, setShowZoom] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] bg-black/30" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-2xl shadow-xl max-h-[60vh] overflow-y-auto animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#005587]">📎 Assigned Problem</h3>
              <p className="text-xs text-gray-500 mt-0.5">{studentName}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {!problem ? (
            <div className="text-center py-6">
              <span className="text-2xl block mb-2">📋</span>
              <p className="text-sm text-gray-500">No problem assigned to this student</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Text content */}
              {problem.content && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {problem.content}
                  </p>
                </div>
              )}

              {/* Image content */}
              {problem.imageUrl && (
                <button
                  onClick={() => setShowZoom(true)}
                  className="w-full rounded-xl overflow-hidden border border-gray-100 active:opacity-80 transition-opacity"
                >
                  <img
                    src={problem.imageUrl}
                    alt="Problem"
                    className="w-full h-auto object-contain max-h-48"
                  />
                  <div className="py-1.5 bg-gray-50 text-xs text-gray-500 text-center">
                    Tap to zoom
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Zoom modal */}
      {showZoom && problem?.imageUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowZoom(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl"
            onClick={() => setShowZoom(false)}
          >
            ✕
          </button>
          <img
            src={problem.imageUrl}
            alt="Problem (zoomed)"
            className="max-w-full max-h-full object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
