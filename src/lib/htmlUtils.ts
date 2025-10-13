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
 * Sanitize HTML for safe rendering (basic sanitization)
 * For production, consider using a library like DOMPurify
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Remove dangerous tags
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .replace(/on\w+='[^']*'/gi, ''); // Remove event handlers
  
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

