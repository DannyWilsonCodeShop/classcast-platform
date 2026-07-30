'use client';

import React, { useRef } from 'react';

interface FormattingTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

/**
 * Textarea with a markdown formatting toolbar.
 * Supports: Bold, Italic, Bullet List, Numbered List, Heading, Horizontal Rule.
 * Wraps/inserts markdown syntax at the cursor or around selected text.
 */
export function FormattingTextarea({ value, onChange, placeholder, rows = 5, className = '' }: FormattingTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const newText = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selected.length;
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = value.substring(0, start) + text + value.substring(start);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
    }, 0);
  };

  const handleBold = () => wrapSelection('**', '**');
  const handleItalic = () => wrapSelection('*', '*');
  const handleBullet = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    if (selected.includes('\n')) {
      // Multi-line: add bullet to each line
      const bulleted = selected.split('\n').map(line => line.trim() ? `- ${line}` : line).join('\n');
      const newText = value.substring(0, start) + bulleted + value.substring(end);
      onChange(newText);
    } else {
      insertAtCursor('\n- ');
    }
  };
  const handleNumbered = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    if (selected.includes('\n')) {
      const numbered = selected.split('\n').map((line, i) => line.trim() ? `${i + 1}. ${line}` : line).join('\n');
      const newText = value.substring(0, start) + numbered + value.substring(end);
      onChange(newText);
    } else {
      insertAtCursor('\n1. ');
    }
  };
  const handleHeading = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    // Find the start of the current line
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', start);
    const line = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);
    // Toggle heading
    if (line.startsWith('## ')) {
      const newText = value.substring(0, lineStart) + line.substring(3) + value.substring(lineEnd === -1 ? value.length : lineEnd);
      onChange(newText);
    } else {
      const newText = value.substring(0, lineStart) + '## ' + line + value.substring(lineEnd === -1 ? value.length : lineEnd);
      onChange(newText);
    }
  };
  const handleRule = () => insertAtCursor('\n\n---\n\n');

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#005587] focus-within:border-[#005587]">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        <button type="button" onClick={handleBold} title="Bold" className="px-2 py-1 rounded text-xs font-bold text-gray-700 hover:bg-gray-200 transition-colors">B</button>
        <button type="button" onClick={handleItalic} title="Italic" className="px-2 py-1 rounded text-xs italic text-gray-700 hover:bg-gray-200 transition-colors">I</button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button type="button" onClick={handleHeading} title="Heading" className="px-2 py-1 rounded text-xs font-bold text-gray-700 hover:bg-gray-200 transition-colors">H</button>
        <button type="button" onClick={handleBullet} title="Bullet List" className="px-2 py-1 rounded text-xs text-gray-700 hover:bg-gray-200 transition-colors">•</button>
        <button type="button" onClick={handleNumbered} title="Numbered List" className="px-2 py-1 rounded text-xs text-gray-700 hover:bg-gray-200 transition-colors">1.</button>
        <button type="button" onClick={handleRule} title="Horizontal Rule" className="px-2 py-1 rounded text-xs text-gray-700 hover:bg-gray-200 transition-colors">—</button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-3 py-2.5 text-sm resize-none border-0 focus:ring-0 focus:outline-none ${className}`}
      />
    </div>
  );
}
