// Validation utility functions for DemoProject using Zod schemas
import { z } from 'zod';
import * as schemas from './zod-schemas';

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
  errorMessage?: string;
}

export interface ValidationOptions {
  stripUnknown?: boolean;
  abortEarly?: boolean;
}

// ============================================================================
// CORE VALIDATION FUNCTIONS
// ============================================================================

/**
 * Generic validation function that validates data against a Zod schema
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  options: ValidationOptions = {}
): ValidationResult<T> {
  try {
    const validationOptions: z.ParseParams = {
      errorMap: (issue, ctx) => {
        // Custom error mapping for better error messages
        switch (issue.code) {
          case 'invalid_type':
            if (issue.received === 'undefined') {
              return { message: `${issue.path.join('.')} is required` };
            }
            return { message: `Expected ${issue.expected}, received ${issue.received}` };
          case 'invalid_string':
            if (issue.validation === 'email') {
              return { message: 'Invalid email format' };
            }
            if (issue.validation === 'url') {
              return { message: 'Invalid URL format' };
            }
            if (issue.validation === 'datetime') {
              return { message: 'Invalid date format. Use ISO 8601 format' };
            }
            return { message: issue.message || 'Invalid string format' };
          case 'invalid_regex':
            return { message: issue.message || 'Invalid format' };
          case 'too_small':
            if (issue.type === 'string') {
              return { message: `${issue.path.join('.')} must be at least ${issue.minimum} characters` };
            }
            if (issue.type === 'number') {
              return { message: `${issue.path.join('.')} must be at least ${issue.minimum}` };
            }
            if (issue.type === 'array') {
              return { message: `${issue.path.join('.')} must have at least ${issue.minimum} items` };
            }
            return { message: issue.message || 'Value too small' };
          case 'too_big':
            if (issue.type === 'string') {
              return { message: `${issue.path.join('.')} must not exceed ${issue.maximum} characters` };
            }
            if (issue.type === 'number') {
              return { message: `${issue.path.join('.')} must not exceed ${issue.maximum}` };
            }
            if (issue.type === 'array') {
              return { message: `${issue.path.join('.')} must not exceed ${issue.maximum} items` };
            }
            return { message: issue.message || 'Value too large' };
          default:
            return { message: issue.message || 'Validation failed' };
        }
      },
      ...options,
    };

    const result = schema.parse(data);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error,
        errorMessage: formatZodError(error),
      };
    }
    
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * Safe validation function that doesn't throw errors
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  options: ValidationOptions = {}
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }
  
  return {
    success: false,
    errors: result.error,
    errorMessage: formatZodError(result.error),
  };
}

// ============================================================================
// ENTITY-SPECIFIC VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate user creation data
 */
export function validateCreateUser(data: unknown): ValidationResult<schemas.CreateUser> {
  return validateData(schemas.createUserSchema, data);
}

/**
 * Validate user update data
 */
export function validateUpdateUser(data: unknown): ValidationResult<schemas.UpdateUser> {
  return validateData(schemas.updateUserSchema, data);
}

/**
 * Validate assignment creation data
 */
export function validateCreateAssignment(data: unknown): ValidationResult<schemas.CreateAssignment> {
  return validateData(schemas.createAssignmentSchema, data);
}

/**
 * Validate assignment update data
 */
export function validateUpdateAssignment(data: unknown): ValidationResult<schemas.UpdateAssignment> {
  return validateData(schemas.updateAssignmentSchema, data);
}

/**
 * Validate submission creation data
 */
export function validateCreateSubmission(data: unknown): ValidationResult<schemas.CreateSubmission> {
  return validateData(schemas.createSubmissionSchema, data);
}

/**
 * Validate submission update data
 */
export function validateUpdateSubmission(data: unknown): ValidationResult<schemas.UpdateSubmission> {
  return validateData(schemas.updateSubmissionSchema, data);
}

/**
 * Validate submission grading data
 */
export function validateGradeSubmission(data: unknown): ValidationResult<schemas.GradeSubmission> {
  return validateData(schemas.gradeSubmissionSchema, data);
}

/**
 * Validate course creation data
 */
export function validateCreateCourse(data: unknown): ValidationResult<schemas.CreateCourse> {
  return validateData(schemas.createCourseSchema, data);
}

/**
 * Validate course update data
 */
export function validateUpdateCourse(data: unknown): ValidationResult<schemas.UpdateCourse> {
  return validateData(schemas.updateCourseSchema, data);
}

// ============================================================================
// FILTER VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate user filters
 */
export function validateUserFilters(data: unknown): ValidationResult<schemas.UserFilters> {
  return validateData(schemas.userFiltersSchema, data);
}

/**
 * Validate assignment filters
 */
export function validateAssignmentFilters(data: unknown): ValidationResult<schemas.AssignmentFilters> {
  return validateData(schemas.assignmentFiltersSchema, data);
}

/**
 * Validate submission filters
 */
export function validateSubmissionFilters(data: unknown): ValidationResult<schemas.SubmissionFilters> {
  return validateData(schemas.submissionFiltersSchema, data);
}

/**
 * Validate course filters
 */
export function validateCourseFilters(data: unknown): ValidationResult<schemas.CourseFilters> {
  return validateData(schemas.courseFiltersSchema, data);
}

/**
 * Validate pagination parameters
 */
export function validatePagination(data: unknown): ValidationResult<schemas.Pagination> {
  return validateData(schemas.paginationSchema, data);
}

// ============================================================================
// UTILITY VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  return schemas.userSchema.shape.email.regex.test(email);
}

/**
 * Validate username format
 */
export function validateUsername(username: string): boolean {
  return schemas.createUserSchema.shape.username.regex.test(username);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult<{ strength: 'weak' | 'medium' | 'strong' }> {
  const errors: string[] = [];
  let score = 0;

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  if (score < 3) {
    errors.push('Password must contain at least 3 of: lowercase, uppercase, numbers, special characters');
  }

  if (errors.length > 0) {
    return {
      success: false,
      errorMessage: errors.join(', '),
    };
  }

  let strength: 'weak' | 'medium' | 'strong';
  if (score <= 3) strength = 'weak';
  else if (score <= 4) strength = 'medium';
  else strength = 'strong';

  return {
    success: true,
    data: { strength },
  };
}

/**
 * Validate file type against allowed types
 */
export function validateFileType(fileType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(fileType);
}

/**
 * Validate file size against maximum size
 */
export function validateFileSize(fileSize: number, maxSize: number): boolean {
  return fileSize > 0 && fileSize <= maxSize;
}

/**
 * Validate date range (start < end)
 */
export function validateDateRange(startDate: Date, endDate: Date): boolean {
  return startDate < endDate;
}

// ============================================================================
// ERROR FORMATTING FUNCTIONS
// ============================================================================

/**
 * Format Zod error into a readable string
 */
export function formatZodError(error: z.ZodError): string {
  return error.errors
    .map((err) => {
      const path = err.path.join('.');
      return `${path}: ${err.message}`;
    })
    .join(', ');
}

/**
 * Get first error message from validation result
 */
export function getFirstError(result: ValidationResult): string | undefined {
  if (result.errors) {
    return formatZodError(result.errors);
  }
  return result.errorMessage;
}

/**
 * Get all error messages from validation result
 */
export function getAllErrors(result: ValidationResult): string[] {
  if (result.errors) {
    return result.errors.errors.map((err) => {
      const path = err.path.join('.');
      return `${path}: ${err.message}`;
    });
  }
  return result.errorMessage ? [result.errorMessage] : [];
}

// ============================================================================
// BATCH VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate multiple items with the same schema
 */
export function validateBatch<T>(
  schema: z.ZodSchema<T>,
  items: unknown[],
  options: ValidationOptions = {}
): ValidationResult<T[]> {
  const results: T[] = [];
  const errors: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const result = validateData(schema, items[i], options);
    if (result.success && result.data) {
      results.push(result.data);
    } else {
      errors.push(`Item ${i + 1}: ${getFirstError(result) || 'Validation failed'}`);
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      errorMessage: errors.join('; '),
    };
  }

  return {
    success: true,
    data: results,
  };
}

/**
 * Validate multiple items and return only valid ones
 */
export function validateBatchPartial<T>(
  schema: z.ZodSchema<T>,
  items: unknown[],
  options: ValidationOptions = {}
): { valid: T[]; invalid: { index: number; error: string }[] } {
  const valid: T[] = [];
  const invalid: { index: number; error: string }[] = [];

  for (let i = 0; i < items.length; i++) {
    const result = validateData(schema, items[i], options);
    if (result.success && result.data) {
      valid.push(result.data);
    } else {
      invalid.push({
        index: i,
        error: getFirstError(result) || 'Validation failed',
      });
    }
  }

  return { valid, invalid };
}

// ============================================================================
// TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Transform and validate data using a schema
 */
export function transformAndValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  options: ValidationOptions = {}
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error,
        errorMessage: formatZodError(error),
      };
    }
    
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown transformation error',
    };
  }
}

/**
 * Partial validation - only validate provided fields
 */
export function validatePartial<T>(
  schema: z.ZodSchema<T>,
  data: Partial<unknown>,
  options: ValidationOptions = {}
): ValidationResult<Partial<T>> {
  try {
    // Create a partial schema from the original
    const partialSchema = schema.partial();
    const result = partialSchema.parse(data);
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error,
        errorMessage: formatZodError(error),
      };
    }
    
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown partial validation error',
    };
  }
}

// ============================================================================
// EXPORT ALL VALIDATION FUNCTIONS
// ============================================================================

export const validation = {
  // Core functions
  validateData,
  safeValidate,
  
  // Entity validation
  validateCreateUser,
  validateUpdateUser,
  validateCreateAssignment,
  validateUpdateAssignment,
  validateCreateSubmission,
  validateUpdateSubmission,
  validateGradeSubmission,
  validateCreateCourse,
  validateUpdateCourse,
  
  // Filter validation
  validateUserFilters,
  validateAssignmentFilters,
  validateSubmissionFilters,
  validateCourseFilters,
  validatePagination,
  
  // Utility validation
  validateEmail,
  validateUsername,
  validatePassword,
  validateFileType,
  validateFileSize,
  validateDateRange,
  
  // Error formatting
  formatZodError,
  getFirstError,
  getAllErrors,
  
  // Batch validation
  validateBatch,
  validateBatchPartial,
  
  // Transformation
  transformAndValidate,
  validatePartial,
} as const;
