/**
 * HTML utility functions for safe rendering and stripping
 */

/**
 * Strip HTML tags from a string and return plain text
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&hellip;/g, '...');
  
  // Clean up extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Sanitize HTML for safe rendering while preserving formatting
 * Allows common formatting tags but removes dangerous elements
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // List of allowed tags for rich text formatting
  const allowedTags = [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
    'a', 'span', 'div'
  ];
  
  // Remove dangerous tags and attributes
  let sanitized = html
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove form elements
    .replace(/<(form|input|textarea|select|button)\b[^>]*>/gi, '')
    .replace(/<\/(form|input|textarea|select|button)>/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: links
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')
    // Remove style attributes (keep basic formatting through CSS classes)
    .replace(/style\s*=\s*["'][^"']*["']/gi, '');
  
  // Additional security: only allow safe attributes for links
  sanitized = sanitized.replace(/<a\s+([^>]*?)>/gi, (match, attrs) => {
    // Only keep href attribute and make links open in new tab
    const hrefMatch = attrs.match(/href\s*=\s*["']([^"']*)["']/i);
    if (hrefMatch && !hrefMatch[1].startsWith('javascript:')) {
      return `<a href="${hrefMatch[1]}" target="_blank" rel="noopener noreferrer">`;
    }
    return '<span>'; // Convert invalid links to spans
  });
  
  return sanitized;
}

/**
 * Convert HTML to plain text with basic formatting
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  
  let text = html
    // Convert headings
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$1\n')
    // Convert paragraphs
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    // Convert line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Convert lists
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
    // Remove remaining tags
    .replace(/<[^>]*>/g, '')
    // Decode entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Max 2 consecutive newlines
    .trim();
  
  return text;
}

/**
 * Check if a string contains HTML tags
 */
export function containsHtml(str: string): boolean {
  return /<[^>]+>/.test(str);
}

