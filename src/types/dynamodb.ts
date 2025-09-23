// DynamoDB Data Models for DemoProject
// These interfaces define the structure of data stored in DynamoDB tables

export interface User {
  // Primary Key
  userId: string;
  email: string;
  
  // User Information
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  
  // Timestamps
  createdAt: string; // ISO 8601 format
  lastLoginAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
  
  // Profile Information
  profile?: {
    avatar?: string;
    bio?: string;
    phone?: string;
    department?: string;
    studentId?: string; // For students
    instructorId?: string; // For instructors
  };
  
  // Authentication
  passwordHash?: string; // Hashed password
  lastPasswordChange?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string;
  
  // Preferences
  preferences?: {
    language?: string;
    timezone?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
  };
  
  // TTL for automatic cleanup
  ttl?: number;
}

export interface Assignment {
  // Primary Key
  assignmentId: string;
  courseId: string;
  
  // Assignment Information
  title: string;
  description: string;
  assignmentType: AssignmentType;
  instructorId: string;
  status: AssignmentStatus;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  dueDate: string;
  responseDueDate?: string; // Separate due date for peer responses
  
  // Grading
  maxScore: number;
  weight?: number; // Percentage weight in course
  rubric?: GradingRubric[];
  
  // Requirements
  requirements: string[];
  attachments?: Attachment[];
  allowedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  
  // Settings
  allowLateSubmission?: boolean;
  latePenalty?: number; // Percentage penalty
  maxSubmissions?: number;
  groupAssignment?: boolean;
  maxGroupSize?: number;
  
  // Peer Response Settings
  enablePeerResponses?: boolean;
  minResponsesRequired?: number; // Minimum responses each student must make
  maxResponsesPerVideo?: number; // Maximum responses allowed per video
  responseWordLimit?: number; // Minimum word count for responses
  responseCharacterLimit?: number; // Maximum character count for responses
  
  // Instructor Features
  isPinned?: boolean;
  isHighlighted?: boolean;
  pinnedAt?: string;
  highlightedAt?: string;
  
  // TTL for automatic cleanup
  ttl?: number;
}

export interface Submission {
  // Primary Key
  submissionId: string;
  assignmentId: string;
  
  // Submission Information
  studentId: string;
  courseId: string;
  status: SubmissionStatus;
  
  // Timestamps
  submittedAt: string;
  gradedAt?: string;
  updatedAt: string;
  
  // Content
  files: SubmissionFile[];
  textContent?: string;
  links?: string[];
  
  // Grading
  score?: number;
  maxScore?: number;
  feedback?: string;
  rubricScores?: RubricScore[];
  
  // Metadata
  metadata: {
    ipAddress: string;
    userAgent: string;
    submissionMethod: SubmissionMethod;
    submissionTime?: number; // Time taken to submit in seconds
  };
  
  // Late submission
  isLate?: boolean;
  latePenalty?: number;
  finalScore?: number;
  
  // TTL for automatic cleanup
  ttl?: number;
}

// Enums
export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
  TA = 'ta', // Teaching Assistant
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  DELETED = 'deleted',
}

export enum AssignmentType {
  ESSAY = 'essay',
  QUIZ = 'quiz',
  PROJECT = 'project',
  PRESENTATION = 'presentation',
  LAB = 'lab',
  EXAM = 'exam',
  DISCUSSION = 'discussion',
  PEER_REVIEW = 'peer_review',
}

export enum AssignmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

export enum SubmissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  LATE = 'late',
  GRADED = 'graded',
  RETURNED = 'returned',
  RESUBMITTED = 'resubmitted',
}

export enum SubmissionMethod {
  WEB = 'web',
  API = 'api',
  BULK_UPLOAD = 'bulk_upload',
  MOBILE = 'mobile',
}

// Supporting Interfaces
export interface Attachment {
  name: string;
  url: string;
  size: number; // in bytes
  type: string; // MIME type
  uploadedAt: string;
}

export interface SubmissionFile {
  name: string;
  url: string;
  size: number; // in bytes
  type: string; // MIME type
  uploadedAt: string;
  checksum?: string; // MD5 or SHA256 hash
}

export interface GradingRubric {
  criterion: string;
  description: string;
  maxPoints: number;
  weight?: number; // Percentage weight
}

export interface RubricScore {
  criterion: string;
  points: number;
  maxPoints: number;
  feedback?: string;
}

// DynamoDB Query Types
export interface DynamoDBQueryParams {
  TableName: string;
  IndexName?: string;
  KeyConditionExpression: string;
  ExpressionAttributeValues: Record<string, any>;
  ExpressionAttributeNames?: Record<string, string>;
  FilterExpression?: string;
  ProjectionExpression?: string;
  Limit?: number;
  ExclusiveStartKey?: Record<string, any>;
  ScanIndexForward?: boolean; // true for ascending, false for descending
}

export interface DynamoDBScanParams {
  TableName: string;
  IndexName?: string;
  FilterExpression?: string;
  ExpressionAttributeValues?: Record<string, any>;
  ExpressionAttributeNames?: Record<string, string>;
  ProjectionExpression?: string;
  Limit?: number;
  ExclusiveStartKey?: Record<string, any>;
}

// DynamoDB Response Types
export interface DynamoDBResponse<T> {
  Items: T[];
  Count: number;
  ScannedCount: number;
  LastEvaluatedKey?: Record<string, any>;
}

// Utility Types
export type UserWithoutPassword = Omit<User, 'passwordHash'>;
export type AssignmentSummary = Pick<Assignment, 'assignmentId' | 'title' | 'courseId' | 'dueDate' | 'status' | 'assignmentType'>;
export type SubmissionSummary = Pick<Submission, 'submissionId' | 'assignmentId' | 'studentId' | 'status' | 'score' | 'submittedAt'>;

// Index Key Types
export interface UserIndexKeys {
  EmailIndex: { email: string; userId: string };
  RoleIndex: { role: UserRole; createdAt: string };
  StatusIndex: { status: UserStatus; lastLoginAt: string };
  TTLIndex: { ttl: number; userId: string };
}

export interface AssignmentIndexKeys {
  CourseIndex: { courseId: string; dueDate: string };
  InstructorIndex: { instructorId: string; createdAt: string };
  StatusIndex: { status: AssignmentStatus; dueDate: string };
  TypeIndex: { assignmentType: AssignmentType; dueDate: string };
  TTLIndex: { ttl: number; assignmentId: string };
}

export interface SubmissionIndexKeys {
  AssignmentIndex: { assignmentId: string; submittedAt: string };
  StudentIndex: { studentId: string; submittedAt: string };
  StatusIndex: { status: SubmissionStatus; submittedAt: string };
  CourseIndex: { courseId: string; submittedAt: string };
  TTLIndex: { ttl: number; submissionId: string };
}
