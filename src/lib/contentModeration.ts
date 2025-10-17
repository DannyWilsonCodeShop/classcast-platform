/**
 * Content Moderation Utility
 * 
 * Provides real-time and async content moderation for student submissions
 * - Profanity filtering
 * - PII detection (SSN, credit cards, etc.)
 * - OpenAI Moderation API integration
 */

// ========================================
// PROFANITY FILTER
// ========================================

const PROFANITY_LIST = [
  // Common inappropriate words (educational context)
  'fuck', 'shit', 'bitch', 'ass', 'damn', 'hell', 'crap',
  'bastard', 'dick', 'cock', 'pussy', 'whore', 'slut',
  // Slurs and hate speech (partial list - extend as needed)
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded',
  // Add more as needed
];

// Common leetspeak/obfuscation patterns
const OBFUSCATION_MAP: Record<string, string> = {
  '@': 'a',
  '4': 'a',
  '3': 'e',
  '1': 'i',
  '!': 'i',
  '0': 'o',
  '$': 's',
  '5': 's',
  '7': 't',
  '+': 't',
};

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalize text to detect obfuscated profanity
 */
function normalizeText(text: string): string {
  let normalized = text.toLowerCase();
  
  // Replace obfuscation characters
  Object.entries(OBFUSCATION_MAP).forEach(([symbol, letter]) => {
    // Escape special regex characters like +, *, etc.
    const escapedSymbol = escapeRegex(symbol);
    normalized = normalized.replace(new RegExp(escapedSymbol, 'g'), letter);
  });
  
  // Remove non-alphanumeric except spaces
  normalized = normalized.replace(/[^a-z0-9\s]/g, '');
  
  return normalized;
}

/**
 * Check if text contains profanity
 */
export function containsProfanity(text: string): { 
  hasProfanity: boolean; 
  words: string[];
  severity: 'none' | 'mild' | 'severe';
} {
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/);
  const foundWords: string[] = [];
  
  // Check each word against profanity list
  for (const word of words) {
    for (const profanity of PROFANITY_LIST) {
      if (word.includes(profanity) || profanity.includes(word)) {
        foundWords.push(word);
      }
    }
  }
  
  // Determine severity
  let severity: 'none' | 'mild' | 'severe' = 'none';
  if (foundWords.length > 0) {
    // Severe slurs and hate speech
    const severeWords = ['nigger', 'nigga', 'faggot', 'fag'];
    const hasSevere = foundWords.some(w => 
      severeWords.some(sw => w.includes(sw))
    );
    severity = hasSevere ? 'severe' : 'mild';
  }
  
  return {
    hasProfanity: foundWords.length > 0,
    words: foundWords,
    severity
  };
}

// ========================================
// PII DETECTION
// ========================================

/**
 * Patterns for common PII
 */
const PII_PATTERNS = {
  // Social Security Number: XXX-XX-XXXX
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  
  // Credit Card: Various formats
  creditCard: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
  
  // Phone Number: Various formats
  phone: /\b(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  
  // Email: Basic email pattern
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Address: Street numbers and common address patterns
  address: /\b\d{1,5}\s+([A-Z][a-z]+\s+){1,3}(Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Court|Ct|Boulevard|Blvd)\b/gi,
};

/**
 * Check if text contains PII
 */
export function containsPII(text: string): {
  hasPII: boolean;
  types: string[];
  severity: 'none' | 'low' | 'high';
  matches: Record<string, string[]>;
} {
  const matches: Record<string, string[]> = {};
  const types: string[] = [];
  
  // Check each PII pattern
  Object.entries(PII_PATTERNS).forEach(([type, pattern]) => {
    const found = text.match(pattern);
    if (found && found.length > 0) {
      types.push(type);
      matches[type] = found;
    }
  });
  
  // Determine severity
  let severity: 'none' | 'low' | 'high' = 'none';
  if (types.length > 0) {
    // SSN and credit cards are high severity
    const highSeverityTypes = ['ssn', 'creditCard'];
    const hasHighSeverity = types.some(t => highSeverityTypes.includes(t));
    severity = hasHighSeverity ? 'high' : 'low';
  }
      
      return {
    hasPII: types.length > 0,
    types,
    severity,
    matches
  };
}

// ========================================
// REAL-TIME VALIDATION
// ========================================

export interface ModerationResult {
  isAllowed: boolean;
  reason?: string;
  profanity?: ReturnType<typeof containsProfanity>;
  pii?: ReturnType<typeof containsPII>;
  suggestions?: string[];
}

/**
 * Validate content before submission (real-time blocking)
 */
export function validateContent(text: string): ModerationResult {
  // Check profanity
  const profanityCheck = containsProfanity(text);
  
  // Check PII
  const piiCheck = containsPII(text);
  
  // Block severe profanity
  if (profanityCheck.severity === 'severe') {
      return {
      isAllowed: false,
      reason: 'Content contains inappropriate language that violates community guidelines.',
      profanity: profanityCheck,
      suggestions: [
        'Please remove inappropriate language',
        'Remember to keep content respectful and educational'
      ]
    };
  }
  
  // Block high-severity PII (SSN, credit cards)
  if (piiCheck.severity === 'high') {
    return {
      isAllowed: false,
      reason: 'Content contains sensitive personal information (SSN or credit card numbers).',
      pii: piiCheck,
      suggestions: [
        'Please remove any Social Security Numbers or credit card numbers',
        'Do not share sensitive personal information in submissions'
      ]
    };
  }
  
  // Warn about mild profanity or low-severity PII
  const warnings: string[] = [];
  if (profanityCheck.severity === 'mild') {
    warnings.push('Content may contain mild inappropriate language');
  }
  if (piiCheck.severity === 'low') {
    warnings.push(`Content may contain personal information: ${piiCheck.types.join(', ')}`);
  }
  
  return {
    isAllowed: true,
    profanity: profanityCheck,
    pii: piiCheck,
    suggestions: warnings.length > 0 ? warnings : undefined
  };
}

// ========================================
// OPENAI MODERATION API
// ========================================

export interface OpenAIModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    'hate/threatening': boolean;
    harassment: boolean;
    'harassment/threatening': boolean;
    'self-harm': boolean;
    'self-harm/intent': boolean;
    'self-harm/instructions': boolean;
    sexual: boolean;
    'sexual/minors': boolean;
    violence: boolean;
    'violence/graphic': boolean;
  };
  category_scores: {
    hate: number;
    'hate/threatening': number;
    harassment: number;
    'harassment/threatening': number;
    'self-harm': number;
    'self-harm/intent': number;
    'self-harm/instructions': number;
    sexual: number;
    'sexual/minors': number;
    violence: number;
    'violence/graphic': number;
  };
}

/**
 * Scan content with OpenAI Moderation API (async)
 */
export async function scanContentWithOpenAI(text: string): Promise<OpenAIModerationResult | null> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('OpenAI API key not configured, skipping moderation');
      return null;
    }
    
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        input: text
      })
    });
    
    if (!response.ok) {
      console.error('OpenAI Moderation API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    return data.results[0];
  } catch (error) {
    console.error('Error calling OpenAI Moderation API:', error);
    return null;
  }
}

/**
 * Determine if OpenAI moderation result should flag content for review
 */
export function shouldFlagForReview(result: OpenAIModerationResult): {
  shouldFlag: boolean;
  severity: 'low' | 'medium' | 'high';
  categories: string[];
} {
  if (!result.flagged) {
    return {
      shouldFlag: false,
      severity: 'low',
      categories: []
    };
  }
  
  const flaggedCategories: string[] = [];
  let maxScore = 0;
  
  // Find flagged categories and max score
  Object.entries(result.categories).forEach(([category, isFlagged]) => {
    if (isFlagged) {
      flaggedCategories.push(category);
      const score = result.category_scores[category as keyof typeof result.category_scores];
      maxScore = Math.max(maxScore, score);
    }
  });
  
  // Determine severity based on max score
  let severity: 'low' | 'medium' | 'high' = 'low';
  if (maxScore >= 0.9) {
    severity = 'high';
  } else if (maxScore >= 0.7) {
    severity = 'medium';
  }
  
  return {
    shouldFlag: true,
    severity,
    categories: flaggedCategories
  };
}
