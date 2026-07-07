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
        className="w-5 h-5 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 hover:bg-[#005587]/10 hover:text-[#005587] hover:border-[#005587]/30 transition-colors"
        aria-label="Help"
      >
        ?
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close on tap anywhere */}
          <div className="fixed inset-0 z-[999]" onClick={() => setIsOpen(false)} />
          {/* Tooltip */}
          <div className="absolute z-[1000] bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs text-gray-700 leading-relaxed animate-fade-in">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-gray-200 transform rotate-45 -mt-1" />
          </div>
        </>
      )}
    </span>
  );
}
