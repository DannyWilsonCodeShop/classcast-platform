/**
 * Class Code Generator Utility
 * Generates unique class codes and checks for duplicates
 */

export interface ClassCodeOptions {
  length?: number;
  prefix?: string;
  includeNumbers?: boolean;
  includeLetters?: boolean;
  excludeSimilar?: boolean; // Exclude similar looking characters like 0/O, 1/I
}

export class ClassCodeGenerator {
  private static readonly DEFAULT_OPTIONS: Required<ClassCodeOptions> = {
    length: 6,
    prefix: '',
    includeNumbers: true,
    includeLetters: true,
    excludeSimilar: true
  };

  private static readonly SIMILAR_CHARS = new Set(['0', 'O', '1', 'I', 'l', '5', 'S', '8', 'B']);
  
  private static readonly LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private static readonly NUMBERS = '0123456789';
  private static readonly SAFE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excludes I, O
  private static readonly SAFE_NUMBERS = '23456789'; // Excludes 0, 1

  /**
   * Generate a single class code
   */
  static generateCode(options: ClassCodeOptions = {}): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    let charset = '';
    if (opts.includeLetters) {
      charset += opts.excludeSimilar ? this.SAFE_LETTERS : this.LETTERS;
    }
    if (opts.includeNumbers) {
      charset += opts.excludeSimilar ? this.SAFE_NUMBERS : this.NUMBERS;
    }

    if (charset.length === 0) {
      throw new Error('At least one character type must be enabled');
    }

    let result = opts.prefix;
    for (let i = 0; i < opts.length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return result;
  }

  /**
   * Generate multiple unique class codes
   */
  static generateUniqueCodes(count: number, options: ClassCodeOptions = {}): string[] {
    const codes = new Set<string>();
    const maxAttempts = count * 10; // Prevent infinite loops
    let attempts = 0;

    while (codes.size < count && attempts < maxAttempts) {
      const code = this.generateCode(options);
      codes.add(code);
      attempts++;
    }

    if (codes.size < count) {
      throw new Error(`Could not generate ${count} unique codes after ${maxAttempts} attempts`);
    }

    return Array.from(codes);
  }

  /**
   * Generate a unique class code that doesn't exist in the provided list
   */
  static generateUniqueCode(existingCodes: string[] = [], options: ClassCodeOptions = {}): string {
    const existingSet = new Set(existingCodes.map(code => code.toUpperCase()));
    const maxAttempts = 1000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const code = this.generateCode(options);
      if (!existingSet.has(code.toUpperCase())) {
        return code;
      }
      attempts++;
    }

    throw new Error(`Could not generate unique code after ${maxAttempts} attempts`);
  }

  /**
   * Validate a class code format
   */
  static validateCode(code: string, options: ClassCodeOptions = {}): boolean {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    if (!code || typeof code !== 'string') {
      return false;
    }

    const expectedLength = opts.prefix.length + opts.length;
    if (code.length !== expectedLength) {
      return false;
    }

    if (opts.prefix && !code.startsWith(opts.prefix)) {
      return false;
    }

    let charset = '';
    if (opts.includeLetters) {
      charset += opts.excludeSimilar ? this.SAFE_LETTERS : this.LETTERS;
    }
    if (opts.includeNumbers) {
      charset += opts.excludeSimilar ? this.SAFE_NUMBERS : this.NUMBERS;
    }

    const codeWithoutPrefix = code.substring(opts.prefix.length);
    for (const char of codeWithoutPrefix) {
      if (!charset.includes(char.toUpperCase())) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate a human-readable class code with common words
   */
  static generateReadableCode(): string {
    const adjectives = [
      'BRIGHT', 'CLEVER', 'SMART', 'QUICK', 'WISE', 'BOLD', 'CALM', 'COOL',
      'FAST', 'GOOD', 'HOT', 'KIND', 'LIVE', 'NEAT', 'NICE', 'OPEN', 'PURE',
      'REAL', 'RICH', 'SAGE', 'TRUE', 'WARM', 'WILD', 'YOUNG', 'ZESTY'
    ];
    
    const nouns = [
      'APPLE', 'BEACH', 'CLOUD', 'DREAM', 'EARTH', 'FIRE', 'GLASS', 'HILL',
      'ICE', 'JADE', 'KITE', 'LAKE', 'MOON', 'NEST', 'OCEAN', 'PEAR', 'QUILT',
      'ROSE', 'STAR', 'TREE', 'URCHIN', 'VINE', 'WAVE', 'YARN', 'ZEBRA'
    ];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 100).toString().padStart(2, '0');

    return `${adjective}${noun}${number}`;
  }

  /**
   * Generate a short numeric code
   */
  static generateNumericCode(length: number = 6): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  }

  /**
   * Generate a code with mixed case for better readability
   */
  static generateMixedCaseCode(length: number = 6): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const charset = letters + numbers;
    
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }
}

// Export convenience functions
export const generateClassCode = (options?: ClassCodeOptions) => ClassCodeGenerator.generateCode(options);
export const generateUniqueClassCode = (existingCodes?: string[], options?: ClassCodeOptions) => 
  ClassCodeGenerator.generateUniqueCode(existingCodes, options);
export const validateClassCode = (code: string, options?: ClassCodeOptions) => 
  ClassCodeGenerator.validateCode(code, options);
