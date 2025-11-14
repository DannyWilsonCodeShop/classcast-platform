// Data transformation and sanitization utilities for DemoProject
import { z } from 'zod';
import * as schemas from './zod-schemas';

// ============================================================================
// TRANSFORMATION RESULT TYPES
// ============================================================================

export interface TransformationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: string[];
  warnings?: string[];
}

export interface SanitizationOptions {
  removeHtml?: boolean;
  trimWhitespace?: boolean;
  normalizeCase?: 'lower' | 'upper' | 'title' | 'none';
  maxLength?: number;
  allowedTags?: string[];
  preserveNewlines?: boolean;
}

export interface TransformationOptions {
  sanitize?: boolean;
  sanitizationOptions?: SanitizationOptions;
  validate?: boolean;
  schema?: z.ZodSchema<any>;
  transformDates?: boolean;
  generateIds?: boolean;
  idPrefix?: string;
}

// ============================================================================
// CORE TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Transform data using a schema with optional sanitization and validation
 */
export function transformData<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  options: TransformationOptions = {}
): TransformationResult<T> {
  try {
    let transformedData = data;

    // Apply sanitization if requested
    if (options.sanitize) {
      const sanitized = sanitizeData(data, options.sanitizationOptions);
      if (!sanitized.success) {
        return {
          success: false,
          errors: sanitized.errors,
        };
      }
      transformedData = sanitized.data;
    }

    // Apply schema transformation
    const result = schema.parse(transformedData);
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
      };
    }
    
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown transformation error'],
    };
  }
}

/**
 * Transform and validate data with comprehensive options
 */
export function transformAndValidate<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  options: TransformationOptions = {}
): TransformationResult<T> {
  const result = transformData(data, schema, options);
  
  if (result.success && options.validate) {
    const validation = schema.safeParse(result.data);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
      };
    }
  }
  
  return result;
}

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitize data to remove potentially harmful content
 */
export function sanitizeData(
  data: unknown,
  options: SanitizationOptions = {}
): TransformationResult {
  const defaultOptions: SanitizationOptions = {
    removeHtml: true,
    trimWhitespace: true,
    normalizeCase: 'none',
    maxLength: undefined,
    allowedTags: [],
    preserveNewlines: false,
    ...options,
  };

  try {
    const sanitized = sanitizeValue(data, defaultOptions);
    return {
      success: true,
      data: sanitized,
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Sanitization failed'],
    };
  }
}

/**
 * Recursively sanitize values
 */
function sanitizeValue(value: unknown, options: SanitizationOptions): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return sanitizeString(value, options);
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item, options));
  }

  if (typeof value === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val, options);
    }
    return sanitized;
  }

  return value;
}

/**
 * Sanitize string values
 */
function sanitizeString(str: string, options: SanitizationOptions): string {
  let sanitized = str;

  // Remove HTML tags if requested
  if (options.removeHtml) {
    if (options.allowedTags && options.allowedTags.length > 0) {
      // Allow specific tags
      const allowedTagsRegex = new RegExp(
        `<(?!\/?(?:${options.allowedTags.join('|')})\b)[^>]+>`,
        'gi'
      );
      sanitized = sanitized.replace(allowedTagsRegex, '');
    } else {
      // Remove all HTML tags
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }
  }

  // Handle newlines
  if (options.preserveNewlines) {
    sanitized = sanitized.replace(/\n/g, '<br>');
  }

  // Trim whitespace
  if (options.trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // Normalize case
  switch (options.normalizeCase) {
    case 'lower':
      sanitized = sanitized.toLowerCase();
      break;
    case 'upper':
      sanitized = sanitized.toUpperCase();
      break;
    case 'title':
      sanitized = sanitized.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
      break;
  }

  // Apply length limit
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
    if (!sanitized.endsWith('...')) {
      sanitized += '...';
    }
  }

  return sanitized;
}

// ============================================================================
// ENTITY-SPECIFIC TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Transform user creation data
 */
export function transformCreateUser(
  data: unknown,
  options: TransformationOptions = {}
): TransformationResult<schemas.CreateUser> {
  return transformData(data, schemas.createUserSchema, options);
}

/**
 * Transform user update data
 */
export function transformUpdateUser(
  data: unknown,
  options: TransformationOptions = {}
): TransformationResult<schemas.UpdateUser> {
  return transformData(data, schemas.updateUserSchema, options);
}

/**
 * Transform assignment creation data
 */
export function transformCreateAssignment(
  data: unknown,
  options: TransformationOptions = {}
): TransformationResult<schemas.CreateAssignment> {
  return transformData(data, schemas.createAssignmentSchema, options);
}

/**
 * Transform assignment update data
 */
export function transformUpdateAssignment(
  data: unknown,
  options: TransformationOptions = {}
): TransformationResult<schemas.UpdateAssignment> {
  return transformData(data, schemas.updateAssignmentSchema, options);
}

/**
 * Transform submission creation data
 */
export function transformCreateSubmission(
  data: unknown,
  options: TransformationOptions = {}
): TransformationResult<schemas.CreateSubmission> {
  return transformData(data, schemas.createSubmissionSchema, options);
}

/**
 * Transform submission update data
 */
export function transformUpdateSubmission(
  data: unknown,
  options: TransformationOptions = {}
): TransformationResult<schemas.UpdateSubmission> {
  return transformData(data, schemas.updateSubmissionSchema, options);
}

/**
 * Transform course creation data
 */
export function transformCreateCourse(
  data: unknown,
  options: TransformationOptions = {}
): TransformationResult<schemas.CreateCourse> {
  return transformData(data, schemas.createCourseSchema, options);
}

/**
 * Transform course update data
 */
export function transformUpdateCourse(
  data: unknown,
  options: TransformationOptions = {}
): TransformationResult<schemas.UpdateCourse> {
  return transformData(data, schemas.updateCourseSchema, options);
}

// ============================================================================
// DATA NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalize user data for consistent format
 */
export function normalizeUserData(userData: any): any {
  return {
    ...userData,
    firstName: normalizeName(userData.firstName),
    lastName: normalizeName(userData.lastName),
    email: normalizeEmail(userData.email),
    department: userData.department ? normalizeDepartment(userData.department) : undefined,
    bio: userData.bio ? normalizeText(userData.bio) : undefined,
  };
}

/**
 * Normalize assignment data for consistent format
 */
export function normalizeAssignmentData(assignmentData: any): any {
  return {
    ...assignmentData,
    title: normalizeTitle(assignmentData.title),
    description: normalizeText(assignmentData.description),
    dueDate: normalizeDate(assignmentData.dueDate),
    startDate: normalizeDate(assignmentData.startDate),
  };
}

/**
 * Normalize course data for consistent format
 */
export function normalizeCourseData(courseData: any): any {
  return {
    ...courseData,
    title: normalizeTitle(courseData.title),
    description: normalizeText(courseData.description),
    code: normalizeCourseCode(courseData.code),
    department: normalizeDepartment(courseData.department),
    startDate: normalizeDate(courseData.startDate),
    endDate: normalizeDate(courseData.endDate),
  };
}

// ============================================================================
// FIELD-SPECIFIC NORMALIZATION
// ============================================================================

/**
 * Normalize name fields (first name, last name)
 */
export function normalizeName(name: string): string {
  if (!name) return name;
  
  return name
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[–—]/g, '-');
}

/**
 * Normalize email addresses
 */
export function normalizeEmail(email: string): string {
  if (!email) return email;
  
  return email.trim().toLowerCase();
}

/**
 * Normalize titles (assignment titles, course titles)
 */
export function normalizeTitle(title: string): string {
  if (!title) return title;
  
  return title
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Normalize text content (descriptions, bios)
 */
export function normalizeText(text: string): string {
  if (!text) return text;
  
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n'); // Normalize multiple newlines
}

/**
 * Normalize department names
 */
export function normalizeDepartment(department: string): string {
  if (!department) return department;
  
  return department
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Normalize course codes
 */
export function normalizeCourseCode(code: string): string {
  if (!code) return code;
  
  return code.trim().toUpperCase();
}

/**
 * Normalize dates to ISO format
 */
export function normalizeDate(date: string | Date): string {
  if (!date) return date as string;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }
    return dateObj.toISOString();
  } catch {
    throw new Error('Invalid date format');
  }
}

// ============================================================================
// DATA CLEANING FUNCTIONS
// ============================================================================

/**
 * Remove sensitive information from user data
 */
export function sanitizeUserForPublic(user: any): any {
  const { password, cognitoSub, ...publicUser } = user;
  return publicUser;
}

/**
 * Remove sensitive information from assignment data
 */
export function sanitizeAssignmentForStudents(assignment: any): any {
  const { 
    instructorNotes, 
    rubric, 
    submissions,
    ...publicAssignment 
  } = assignment;
  return publicAssignment;
}

/**
 * Clean file metadata for security
 */
export function sanitizeFileMetadata(file: any): any {
  const { 
    internalPath, 
    accessKey, 
    secretKey,
    ...publicFile 
  } = file;
  return publicFile;
}

// ============================================================================
// DATA MERGING FUNCTIONS
// ============================================================================

/**
 * Merge user data with updates, applying transformations
 */
export function mergeUserData(
  existingUser: any,
  updates: any,
  options: TransformationOptions = {}
): TransformationResult<any> {
  try {
    // Sanitize updates if requested
    let sanitizedUpdates = updates;
    if (options.sanitize) {
      const sanitized = sanitizeData(updates, options.sanitizationOptions);
      if (!sanitized.success) {
        return sanitized;
      }
      sanitizedUpdates = sanitized.data;
    }

    // Merge data
    const mergedData = {
      ...existingUser,
      ...sanitizedUpdates,
      updatedAt: new Date().toISOString(),
    };

    // Validate if requested
    if (options.validate && options.schema) {
      return transformData(mergedData, options.schema, options);
    }

    return {
      success: true,
      data: mergedData,
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Merge failed'],
    };
  }
}

/**
 * Deep merge objects with transformation
 */
export function deepMerge<T>(
  target: T,
  source: Partial<T>,
  options: TransformationOptions = {}
): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== undefined) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key], source[key] as any, options);
      } else {
        result[key] = source[key] as any;
      }
    }
  }

  return result;
}

// ============================================================================
// DATA VALIDATION HELPERS
// ============================================================================

/**
 * Check if data needs transformation
 */
export function needsTransformation(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  // Check for common issues that need transformation
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      if (value.trim() !== value) return true;
      if (value.includes('<') && value.includes('>')) return true;
    }
    if (value instanceof Date && isNaN(value.getTime())) return true;
  }
  
  return false;
}

/**
 * Get transformation recommendations
 */
export function getTransformationRecommendations(data: any): string[] {
  const recommendations: string[] = [];
  
  if (!data || typeof data !== 'object') return recommendations;
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      if (value.trim() !== value) {
        recommendations.push(`${key}: Contains leading/trailing whitespace`);
      }
      if (value.includes('<') && value.includes('>')) {
        recommendations.push(`${key}: Contains HTML-like content`);
      }
    }
    if (value instanceof Date && isNaN(value.getTime())) {
      recommendations.push(`${key}: Invalid date value`);
    }
  }
  
  return recommendations;
}

// ============================================================================
// EXPORT ALL TRANSFORMATION FUNCTIONS
// ============================================================================

export const transformation = {
  // Core functions
  transformData,
  transformAndValidate,
  
  // Sanitization
  sanitizeData,
  
  // Entity transformation
  transformCreateUser,
  transformUpdateUser,
  transformCreateAssignment,
  transformUpdateAssignment,
  transformCreateSubmission,
  transformUpdateSubmission,
  transformCreateCourse,
  transformUpdateCourse,
  
  // Normalization
  normalizeUserData,
  normalizeAssignmentData,
  normalizeCourseData,
  normalizeName,
  normalizeEmail,
  normalizeTitle,
  normalizeText,
  normalizeDepartment,
  normalizeCourseCode,
  normalizeDate,
  
  // Cleaning
  sanitizeUserForPublic,
  sanitizeAssignmentForStudents,
  sanitizeFileMetadata,
  
  // Merging
  mergeUserData,
  deepMerge,
  
  // Helpers
  needsTransformation,
  getTransformationRecommendations,
} as const;
