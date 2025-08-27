// Validation schemas and utility functions for DemoProject entities

import { 
  User, 
  Assignment, 
  AssignmentSubmission, 
  Course,
  UserRole,
  AssignmentType,
  SubmissionStatus,
  CourseLevel,
  CreateUserRequest,
  CreateAssignmentRequest,
  CreateSubmissionRequest,
  CreateCourseRequest
} from './entities';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationRule<T> {
  field: keyof T;
  validator: (value: any) => boolean;
  message: string;
  required?: boolean;
}

// ============================================================================
// USER VALIDATION
// ============================================================================

export const USER_VALIDATION_RULES: ValidationRule<CreateUserRequest>[] = [
  {
    field: 'username',
    validator: (value: string) => /^[a-zA-Z0-9._-]{3,50}$/.test(value),
    message: 'Username must be 3-50 characters and contain only letters, numbers, dots, underscores, and hyphens',
    required: true
  },
  {
    field: 'email',
    validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Email must be a valid email address',
    required: true
  },
  {
    field: 'firstName',
    validator: (value: string) => /^[a-zA-Z\s'-]{1,50}$/.test(value),
    message: 'First name must be 1-50 characters and contain only letters, spaces, apostrophes, and hyphens',
    required: true
  },
  {
    field: 'lastName',
    validator: (value: string) => /^[a-zA-Z\s'-]{1,50}$/.test(value),
    message: 'Last name must be 1-50 characters and contain only letters, spaces, apostrophes, and hyphens',
    required: true
  },
  {
    field: 'role',
    validator: (value: UserRole) => ['student', 'instructor', 'admin'].includes(value),
    message: 'Role must be student, instructor, or admin',
    required: true
  },
  {
    field: 'department',
    validator: (value: string) => !value || /^[a-zA-Z\s&.-]{1,100}$/.test(value),
    message: 'Department must be 1-100 characters and contain only letters, spaces, ampersands, dots, and hyphens',
    required: false
  },
  {
    field: 'studentId',
    validator: (value: string) => !value || /^[A-Z0-9]{1,20}$/.test(value),
    message: 'Student ID must be 1-20 characters and contain only uppercase letters and numbers',
    required: false
  },
  {
    field: 'instructorId',
    validator: (value: string) => !value || /^[A-Z0-9]{1,20}$/.test(value),
    message: 'Instructor ID must be 1-20 characters and contain only uppercase letters and numbers',
    required: false
  },
  {
    field: 'bio',
    validator: (value: string) => !value || value.length <= 500,
    message: 'Bio must be 500 characters or less',
    required: false
  }
];

export function validateUser(user: CreateUserRequest): ValidationResult {
  const errors: string[] = [];

  for (const rule of USER_VALIDATION_RULES) {
    const value = user[rule.field];
    
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${rule.field} is required`);
      continue;
    }

    if (value !== undefined && value !== null && value !== '' && !rule.validator(value)) {
      errors.push(rule.message);
    }
  }

  // Additional business logic validation
  if (user.role === 'student' && !user.studentId) {
    errors.push('Student ID is required for student users');
  }

  if (user.role === 'instructor' && !user.instructorId) {
    errors.push('Instructor ID is required for instructor users');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// ASSIGNMENT VALIDATION
// ============================================================================

export const ASSIGNMENT_VALIDATION_RULES: ValidationRule<CreateAssignmentRequest>[] = [
  {
    field: 'title',
    validator: (value: string) => value.length >= 3 && value.length <= 200,
    message: 'Title must be 3-200 characters',
    required: true
  },
  {
    field: 'description',
    validator: (value: string) => value.length >= 10 && value.length <= 2000,
    message: 'Description must be 10-2000 characters',
    required: true
  },
  {
    field: 'courseId',
    validator: (value: string) => /^[a-zA-Z0-9_-]{1,50}$/.test(value),
    message: 'Course ID must be 1-50 characters and contain only letters, numbers, underscores, and hyphens',
    required: true
  },
  {
    field: 'type',
    validator: (value: AssignmentType) => ['essay', 'quiz', 'project', 'presentation', 'lab', 'discussion', 'other'].includes(value),
    message: 'Type must be a valid assignment type',
    required: true
  },
  {
    field: 'points',
    validator: (value: number) => value > 0 && value <= 1000,
    message: 'Points must be between 1 and 1000',
    required: true
  },
  {
    field: 'weight',
    validator: (value: number) => value > 0 && value <= 100,
    message: 'Weight must be between 1 and 100',
    required: true
  },
  {
    field: 'dueDate',
    validator: (value: string) => {
      const date = new Date(value);
      return !isNaN(date.getTime()) && date > new Date();
    },
    message: 'Due date must be a valid future date',
    required: true
  },
  {
    field: 'startDate',
    validator: (value: string) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    },
    message: 'Start date must be a valid date',
    required: true
  },
  {
    field: 'maxSubmissions',
    validator: (value: number) => value >= 1 && value <= 10,
    message: 'Max submissions must be between 1 and 10',
    required: true
  },
  {
    field: 'maxFileSize',
    validator: (value: number) => value >= 1024 && value <= 100 * 1024 * 1024, // 1KB to 100MB
    message: 'Max file size must be between 1KB and 100MB',
    required: true
  }
];

export function validateAssignment(assignment: CreateAssignmentRequest): ValidationResult {
  const errors: string[] = [];

  for (const rule of ASSIGNMENT_VALIDATION_RULES) {
    const value = assignment[rule.field];
    
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${rule.field} is required`);
      continue;
    }

    if (value !== undefined && value !== null && value !== '' && !rule.validator(value)) {
      errors.push(rule.message);
    }
  }

  // Additional business logic validation
  const startDate = new Date(assignment.startDate);
  const dueDate = new Date(assignment.dueDate);
  
  if (startDate >= dueDate) {
    errors.push('Start date must be before due date');
  }

  if (assignment.latePenalty !== undefined && (assignment.latePenalty < 0 || assignment.latePenalty > 100)) {
    errors.push('Late penalty must be between 0 and 100');
  }

  if (assignment.allowedFileTypes.length === 0) {
    errors.push('At least one file type must be allowed');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// SUBMISSION VALIDATION
// ============================================================================

export const SUBMISSION_VALIDATION_RULES: ValidationRule<CreateSubmissionRequest>[] = [
  {
    field: 'assignmentId',
    validator: (value: string) => /^[a-zA-Z0-9_-]{1,50}$/.test(value),
    message: 'Assignment ID must be 1-50 characters and contain only letters, numbers, underscores, and hyphens',
    required: true
  },
  {
    field: 'content',
    validator: (value: string) => !value || value.length <= 10000,
    message: 'Content must be 10000 characters or less',
    required: false
  },
  {
    field: 'studentNotes',
    validator: (value: string) => !value || value.length <= 1000,
    message: 'Student notes must be 1000 characters or less',
    required: false
  }
];

export function validateSubmission(submission: CreateSubmissionRequest): ValidationResult {
  const errors: string[] = [];

  for (const rule of SUBMISSION_VALIDATION_RULES) {
    const value = submission[rule.field];
    
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${rule.field} is required`);
      continue;
    }

    if (value !== undefined && value !== null && value !== '' && !rule.validator(value)) {
      errors.push(rule.message);
    }
  }

  // Additional business logic validation
  if (!submission.content && submission.attachments.length === 0) {
    errors.push('Either content or attachments must be provided');
  }

  if (submission.attachments.length > 10) {
    errors.push('Maximum 10 attachments allowed');
  }

  // Validate individual attachments
  for (let i = 0; i < submission.attachments.length; i++) {
    const attachment = submission.attachments[i];
    const attachmentErrors = validateSubmissionAttachment(attachment, i);
    errors.push(...attachmentErrors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateSubmissionAttachment(attachment: any, index: number): string[] {
  const errors: string[] = [];

  if (!attachment.fileName || attachment.fileName.length > 255) {
    errors.push(`Attachment ${index + 1}: File name must be 1-255 characters`);
  }

  if (!attachment.fileType || !/^[a-zA-Z0-9/.-]+$/.test(attachment.fileType)) {
    errors.push(`Attachment ${index + 1}: File type must be a valid MIME type`);
  }

  if (!attachment.fileSize || attachment.fileSize <= 0 || attachment.fileSize > 100 * 1024 * 1024) {
    errors.push(`Attachment ${index + 1}: File size must be between 1 byte and 100MB`);
  }

  return errors;
}

// ============================================================================
// COURSE VALIDATION
// ============================================================================

export const COURSE_VALIDATION_RULES: ValidationRule<CreateCourseRequest>[] = [
  {
    field: 'title',
    validator: (value: string) => value.length >= 3 && value.length <= 200,
    message: 'Title must be 3-200 characters',
    required: true
  },
  {
    field: 'description',
    validator: (value: string) => value.length >= 10 && value.length <= 2000,
    message: 'Description must be 10-2000 characters',
    required: true
  },
  {
    field: 'code',
    validator: (value: string) => /^[A-Z]{2,6}[0-9]{3,4}$/.test(value),
    message: 'Course code must be 2-6 letters followed by 3-4 numbers (e.g., CS101, MATH2000)',
    required: true
  },
  {
    field: 'department',
    validator: (value: string) => /^[a-zA-Z\s&.-]{1,100}$/.test(value),
    message: 'Department must be 1-100 characters and contain only letters, spaces, ampersands, dots, and hyphens',
    required: true
  },
  {
    field: 'credits',
    validator: (value: number) => value > 0 && value <= 30,
    message: 'Credits must be between 1 and 30',
    required: true
  },
  {
    field: 'level',
    validator: (value: CourseLevel) => ['undergraduate', 'graduate', 'doctoral', 'continuing-education'].includes(value),
    message: 'Level must be a valid course level',
    required: true
  },
  {
    field: 'maxEnrollment',
    validator: (value: number) => value > 0 && value <= 1000,
    message: 'Max enrollment must be between 1 and 1000',
    required: true
  }
];

export function validateCourse(course: CreateCourseRequest): ValidationResult {
  const errors: string[] = [];

  for (const rule of COURSE_VALIDATION_RULES) {
    const value = course[rule.field];
    
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${rule.field} is required`);
      continue;
    }

    if (value !== undefined && value !== null && value !== '' && !rule.validator(value)) {
      errors.push(rule.message);
    }
  }

  // Additional business logic validation
  const startDate = new Date(course.startDate);
  const endDate = new Date(course.endDate);
  
  if (startDate >= endDate) {
    errors.push('Start date must be before end date');
  }

  if (course.learningOutcomes.length === 0) {
    errors.push('At least one learning outcome must be specified');
  }

  if (course.learningOutcomes.some(outcome => outcome.length > 200)) {
    errors.push('Learning outcomes must be 200 characters or less each');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// UTILITY VALIDATION FUNCTIONS
// ============================================================================

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateFileType(fileType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(fileType);
}

export function validateFileSize(fileSize: number, maxSize: number): boolean {
  return fileSize > 0 && fileSize <= maxSize;
}

export function validateDateRange(startDate: Date, endDate: Date): boolean {
  return startDate < endDate;
}

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
}

export function sanitizeUserInput(user: CreateUserRequest): CreateUserRequest {
  return {
    ...user,
    firstName: sanitizeString(user.firstName),
    lastName: sanitizeString(user.lastName),
    department: user.department ? sanitizeString(user.department) : undefined,
    bio: user.bio ? sanitizeString(user.bio) : undefined
  };
}

export function sanitizeAssignmentInput(assignment: CreateAssignmentRequest): CreateAssignmentRequest {
  return {
    ...assignment,
    title: sanitizeString(assignment.title),
    description: sanitizeHtml(assignment.description)
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function createValidationError(field: string, message: string): ValidationResult {
  return {
    isValid: false,
    errors: [`${field}: ${message}`]
  };
}

export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap(result => result.errors);
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

export function validateRequired<T>(obj: T, requiredFields: (keyof T)[]): ValidationResult {
  const errors: string[] = [];

  for (const field of requiredFields) {
    const value = obj[field];
    if (value === undefined || value === null || value === '') {
      errors.push(`${String(field)} is required`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
