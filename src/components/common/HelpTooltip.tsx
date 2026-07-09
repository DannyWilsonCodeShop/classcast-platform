'use client';

import React, { useState } from 'react';

interface HelpTooltipProps {
  text: string;
  className?: string;
}

/**
 * A small ? button that shows a tooltip/popover with help text on tap.
 * Designed for mobile — taps to open, taps anywhere to close.
 */
export function HelpTooltip({ text, className = '' }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="w-4 h-4 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-400 hover:bg-[#005587]/10 hover:text-[#005587] hover:border-[#005587]/30 transition-colors"
        aria-label="Help"
      >
        ?
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close on tap anywhere */}
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          {/* Tooltip - opens below, constrained to screen */}
          <div className="absolute z-[9999] top-full left-0 mt-1.5 w-52 max-w-[calc(100vw-3rem)] bg-white border border-gray-200 rounded-xl shadow-lg p-2.5 text-[11px] text-gray-600 leading-relaxed animate-fade-in">
            {text}
          </div>
        </>
      )}
    </span>
  );
}
