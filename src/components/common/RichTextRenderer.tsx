'use client';

import React from 'react';
import { sanitizeHtml } from '@/lib/htmlUtils';

interface RichTextRendererProps {
  content: string;
  className?: string;
  maxLines?: number; // For truncation
}

export default function RichTextRenderer({ 
  content, 
  className = '', 
  maxLines 
}: RichTextRendererProps) {
  if (!content) return null;

  // Sanitize the HTML content for security
  const sanitizedContent = sanitizeHtml(content);

  // Apply line clamping if specified
  const clampClass = maxLines ? `line-clamp-${maxLines}` : '';

  return (
    <div 
      className={`rich-text-content ${clampClass} ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      style={{
        // Ensure proper styling for rich text elements
        lineHeight: '1.6',
      }}
    />
  );
}