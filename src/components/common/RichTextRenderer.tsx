'use client';

import React from 'react';

interface RichTextRendererProps {
  content: string;
  className?: string;
  maxLines?: number;
}

/**
 * Renders text content preserving formatting.
 * Handles:
 * - Plain text with \n line breaks
 * - Markdown-style formatting (**bold**, - bullets, numbered lists, ---)
 * - Already-formatted HTML
 */
function formatContent(text: string): string {
  if (!text) return '';

  // If it already looks like HTML, pass through (but sanitize dangerous tags)
  if (text.includes('<p>') || text.includes('<br') || text.includes('<div>')) {
    return text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  }

  // Convert markdown-like content to HTML
  let html = text
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold: **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Horizontal rule: ---
    .replace(/^---$/gm, '<hr class="my-3 border-gray-200">')
    // Headings-like (lines that are short and followed by blank line — treat as bold)
    // Numbered lists: 1. text
    .replace(/^(\d+)\.\s+(.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    // Bullet lists: - text
    .replace(/^[-•]\s+(.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Checkboxes: ☐ text or ✅ text
    .replace(/^[☐✅]\s+(.+)$/gm, '<li class="ml-4 list-none">$&</li>')
    // Convert newlines to <br> (but not inside list items)
    .replace(/\n/g, '<br>');

  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/(<li[^>]*>.*?<\/li>)(<br>)?/g, '$1');
  // Clean up double <br> (paragraph breaks)
  html = html.replace(/(<br>){3,}/g, '<br><br>');

  return html;
}

export default function RichTextRenderer({ 
  content, 
  className = '', 
  maxLines 
}: RichTextRendererProps) {
  if (!content) return null;

  const formattedContent = formatContent(content);
  const clampClass = maxLines ? `line-clamp-${maxLines}` : '';

  return (
    <div 
      className={`rich-text-content ${clampClass} ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedContent }}
      style={{ lineHeight: '1.6' }}
    />
  );
}
