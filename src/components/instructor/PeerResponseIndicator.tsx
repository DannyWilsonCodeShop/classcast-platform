'use client';

import React from 'react';

interface PeerResponseIndicatorProps {
  enablePeerResponses: boolean;
  minResponsesRequired: number;
  completedCount: number;
}

export function PeerResponseIndicator({
  enablePeerResponses,
  minResponsesRequired,
  completedCount,
}: PeerResponseIndicatorProps) {
  if (!enablePeerResponses) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        <span>—</span>
        <span>No responses required</span>
      </span>
    );
  }

  const isComplete = completedCount >= minResponsesRequired;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        isComplete
          ? 'bg-green-100 text-green-700'
          : 'bg-amber-100 text-amber-700'
      }`}
    >
      <span>{isComplete ? '✓' : '⚠'}</span>
      <span>{completedCount}/{minResponsesRequired} responses</span>
    </span>
  );
}
