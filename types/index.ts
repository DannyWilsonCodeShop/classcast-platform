// Main export file for DemoProject types

// ============================================================================
// ENTITY INTERFACES
// ============================================================================
export * from './entities';

// ============================================================================
// VALIDATION SCHEMAS AND FUNCTIONS
// ============================================================================
export * from './validation';

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================
// Note: Zod schemas are available but not re-exported to avoid conflicts with entities

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================
// Note: Validation utilities are available but not re-exported to avoid conflicts

// ============================================================================
// TRANSFORMATION AND SANITIZATION UTILITIES
// ============================================================================
// Note: Transform utilities are available but not re-exported to avoid conflicts

// ============================================================================
// SERVICE INTERFACES AND IMPLEMENTATIONS
// ============================================================================
export * from './services';

// ============================================================================
// COMMON TYPE UTILITIES
// ============================================================================

// Generic type utilities
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type PickRequired<T, K extends keyof T> = Required<Pick<T, K>>;

export type PickOptional<T, K extends keyof T> = Partial<Pick<T, K>>;

// Array utilities
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

export type NonEmptyArray<T> = [T, ...T[]];

// Function utilities
export type AsyncFunction<TArgs extends any[], TReturn> = (...args: TArgs) => Promise<TReturn>;

export type SyncFunction<TArgs extends any[], TReturn> = (...args: TArgs) => TReturn;

// Object utilities
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

export type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};

// Union utilities
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export type UnionToTuple<T> = UnionToIntersection<T extends any ? () => T : never> extends () => infer R ? [R] : never;

// Conditional types
export type If<C extends boolean, T, F> = C extends true ? T : F;

export type IsNever<T> = [T] extends [never] ? true : false;

export type IsAny<T> = 0 extends (1 & T) ? true : false;

// String utilities
export type StringLiteral<T> = T extends string ? string extends T ? never : T : never;

export type Capitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S;

export type Uncapitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Lowercase<F>}${R}` : S;

// Number utilities
export type NumberRange<Start extends number, End extends number> = number extends Start | End 
  ? number 
  : Start extends End 
    ? Start 
    : Start | NumberRange<Exclude<End, Start>, Start>;

// API utilities
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type HttpStatusCode = 
  | 200 | 201 | 202 | 204
  | 300 | 301 | 302 | 304 | 307 | 308
  | 400 | 401 | 403 | 404 | 405 | 409 | 422 | 429
  | 500 | 501 | 502 | 503 | 504;

export type ApiErrorCode = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE';

// ============================================================================
// CONSTANTS
// ============================================================================

export const API_ENDPOINTS = {
  USERS: '/users',
  ASSIGNMENTS: '/assignments',
  SUBMISSIONS: '/submissions',
  COURSES: '/courses',
  UPLOAD: '/upload',
  HEALTH: '/health',
} as const;

export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export const VALIDATION_CONSTRAINTS = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9._-]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
  },
  EMAIL: {
    MAX_LENGTH: 254,
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z\s'-]+$/,
  },
  BIO: {
    MAX_LENGTH: 500,
  },
  TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 200,
  },
  DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 2000,
  },
  COURSE_CODE: {
    PATTERN: /^[A-Z]{2,6}[0-9]{3,4}$/,
  },
  FILE_SIZE: {
    MIN: 1024, // 1KB
    MAX: 100 * 1024 * 1024, // 100MB
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
} as const;

export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm:ss',
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
} as const;

export const FILE_TYPES = {
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/html',
  ],
  IMAGES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  VIDEOS: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
  ],
  AUDIO: [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
  ],
  ARCHIVES: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
  ],
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

export function isNotEmpty(value: any): boolean {
  return !isEmpty(value);
}

export function isValidEmail(email: string): boolean {
  return VALIDATION_CONSTRAINTS.EMAIL.PATTERN.test(email);
}

export function isValidUsername(username: string): boolean {
  return (
    username.length >= VALIDATION_CONSTRAINTS.USERNAME.MIN_LENGTH &&
    username.length <= VALIDATION_CONSTRAINTS.USERNAME.MAX_LENGTH &&
    VALIDATION_CONSTRAINTS.USERNAME.PATTERN.test(username)
  );
}

export function isValidPassword(password: string): boolean {
  return (
    password.length >= VALIDATION_CONSTRAINTS.PASSWORD.MIN_LENGTH &&
    password.length <= VALIDATION_CONSTRAINTS.PASSWORD.MAX_LENGTH
  );
}

export function formatDate(date: Date | string, format: keyof typeof DATE_FORMATS = 'ISO'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString();
}

export function parseDate(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return date;
}

export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  const id = `${timestamp}${random}`;
  return prefix ? `${prefix}_${id}` : id;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isUser(obj: any): obj is import('./entities').User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.userId === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.firstName === 'string' &&
    typeof obj.lastName === 'string' &&
    ['student', 'instructor', 'admin'].includes(obj.role)
  );
}

export function isAssignment(obj: any): obj is import('./entities').Assignment {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.assignmentId === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.courseId === 'string' &&
    typeof obj.instructorId === 'string'
  );
}

export function isSubmission(obj: any): obj is import('./entities').AssignmentSubmission {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.submissionId === 'string' &&
    typeof obj.assignmentId === 'string' &&
    typeof obj.studentId === 'string' &&
    typeof obj.courseId === 'string'
  );
}

export function isCourse(obj: any): obj is import('./entities').Course {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.courseId === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.code === 'string' &&
    typeof obj.department === 'string' &&
    typeof obj.credits === 'number'
  );
}

export function isApiResponse<T>(obj: any): obj is import('./entities').ApiResponse<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.success === 'boolean' &&
    typeof obj.timestamp === 'string'
  );
}

export function isValidationResult(obj: any): obj is import('./validation').ValidationResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.isValid === 'boolean' &&
    Array.isArray(obj.errors)
  );
}
