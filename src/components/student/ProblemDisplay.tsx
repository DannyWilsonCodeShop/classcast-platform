'use client';

import React, { useState } from 'react';

interface ProblemDisplayProps {
  problem: {
    problemId: string;
    content: string;
    imageUrl?: string;
  } | null;
}

/**
 * Renders the student's assigned problem in the Resources section.
 * Supports text problems, image problems, or both.
 */
export function ProblemDisplay({ problem }: ProblemDisplayProps) {
  const [showZoom, setShowZoom] = useState(false);

  if (!problem) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📋</span>
          <span className="text-sm font-bold text-yellow-800">Your Problem</span>
        </div>
        <p className="text-sm text-yellow-700">
          Your problem has not been assigned yet. Please contact your instructor.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📋</span>
          <span className="text-sm font-bold text-[#005587]">Your Assigned Problem</span>
        </div>

        {/* Text content */}
        {problem.content && (
          <div className="bg-gray-50 rounded-xl p-4 mb-3">
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
              className="w-full h-auto object-contain max-h-64"
            />
            <div className="py-1.5 bg-gray-50 text-xs text-gray-500 text-center">
              Tap to zoom
            </div>
          </button>
        )}
      </div>

      {/* Lightbox zoom modal */}
      {showZoom && problem.imageUrl && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
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
