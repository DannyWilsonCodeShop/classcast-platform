// ============================================================================
// CORE TYPES - Shared between Frontend and Backend
// ============================================================================

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string; // Always S3 URL, never base64
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Student extends User {
  role: 'student';
  studentId: string;
  instructorId?: string;
  department?: string;
  bio?: string;
  careerGoals?: string;
  classOf?: string;
  funFact?: string;
  favoriteSubject?: string;
  hobbies?: string;
  schoolName?: string;
}

export interface Instructor extends User {
  role: 'instructor';
  instructorId: string;
  department: string;
  bio?: string;
  expertise?: string[];
  yearsExperience?: number;
}

// ============================================================================
// COURSE TYPES
// ============================================================================

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  instructorId: string;
  instructorName: string;
  status: 'draft' | 'published' | 'archived';
  semester: string;
  year: number;
  credits: number;
  maxEnrollment?: number;
  currentEnrollment: number;
  schedule: {
    days: string[];
    time: string;
    location: string;
  };
  prerequisites: string[];
  learningObjectives: string[];
  gradingPolicy: {
    assignments: number;
    exams: number;
    participation: number;
    projects: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ASSIGNMENT TYPES
// ============================================================================

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  status: 'draft' | 'published' | 'grading' | 'completed';
  submissionType: 'video' | 'text' | 'file' | 'url';
  instructions: string;
  rubric?: Rubric;
  peerReview?: {
    enabled: boolean;
    dueDate?: string;
    minResponses: number;
    maxResponses: number;
    wordLimit?: number;
    characterLimit?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Rubric {
  contentQuality: { earned: number; possible: number; feedback?: string };
  technicalAccuracy: { earned: number; possible: number; feedback?: string };
  presentation: { earned: number; possible: number; feedback?: string };
  engagement: { earned: number; possible: number; feedback?: string };
  criticalThinking: { earned: number; possible: number; feedback?: string };
}

// ============================================================================
// SUBMISSION TYPES
// ============================================================================

export interface Submission {
  id: string;
  assignmentId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  title: string;
  content?: string; // For text submissions
  fileUrl?: string; // S3 URL for video/file submissions
  thumbnailUrl?: string; // For video submissions
  duration?: number; // For video submissions (seconds)
  fileSize?: number; // File size in bytes
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  rubric?: Rubric;
  submittedAt?: string;
  gradedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PEER REVIEW TYPES
// ============================================================================

export interface PeerReview {
  id: string;
  submissionId: string;
  reviewerId: string;
  reviewerName: string;
  content: string;
  wordCount: number;
  characterCount: number;
  qualityScore: number;
  isSubmitted: boolean;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface AnalyticsOverview {
  totalStudents: number;
  totalAssignments: number;
  averageGrade: number;
  completionRate: number;
}

export interface CourseAnalytics {
  courseId: string;
  courseName: string;
  students: number;
  assignments: number;
  averageGrade: number;
  completionRate: number;
}

export interface AssignmentAnalytics {
  assignmentId: string;
  title: string;
  submissions: number;
  averageGrade: number;
  completionRate: number;
  dueDate: string;
}

export interface StudentEngagement {
  studentId: string;
  studentName: string;
  assignmentsCompleted: number;
  averageGrade: number;
  lastActivity: string;
}

export interface GradeDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  courseStats: CourseAnalytics[];
  assignmentStats: AssignmentAnalytics[];
  studentEngagement: StudentEngagement[];
  gradeDistribution: GradeDistribution[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor';
  instructorId?: string; // For students
  department?: string;
}

export interface CreateCourseRequest {
  name: string;
  code: string;
  description: string;
  semester: string;
  year: number;
  credits: number;
  maxEnrollment?: number;
  schedule: {
    days: string[];
    time: string;
    location: string;
  };
  prerequisites: string[];
  learningObjectives: string[];
  gradingPolicy: {
    assignments: number;
    exams: number;
    participation: number;
    projects: number;
  };
}

export interface CreateAssignmentRequest {
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  submissionType: 'video' | 'text' | 'file' | 'url';
  instructions: string;
  rubric?: Rubric;
  peerReview?: {
    enabled: boolean;
    dueDate?: string;
    minResponses: number;
    maxResponses: number;
    wordLimit?: number;
    characterLimit?: number;
  };
}

export interface SubmitAssignmentRequest {
  assignmentId: string;
  title: string;
  content?: string;
  fileUrl?: string;
}

export interface GradeSubmissionRequest {
  submissionId: string;
  grade: number;
  feedback: string;
  rubric: Rubric;
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface DynamoDBItem {
  PK: string; // Partition Key
  SK: string; // Sort Key
  GSI1PK?: string; // Global Secondary Index 1 Partition Key
  GSI1SK?: string; // Global Secondary Index 1 Sort Key
  GSI2PK?: string; // Global Secondary Index 2 Partition Key
  GSI2SK?: string; // Global Secondary Index 2 Sort Key
  TTL?: number; // Time To Live
  createdAt: string;
  updatedAt: string;
}

export interface UserDBItem extends DynamoDBItem {
  PK: `USER#${string}`;
  SK: 'PROFILE';
  GSI1PK: `EMAIL#${string}`;
  GSI1SK: 'USER';
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
  emailVerified: boolean;
  // Student specific fields
  studentId?: string;
  instructorId?: string;
  department?: string;
  bio?: string;
  careerGoals?: string;
  classOf?: string;
  funFact?: string;
  favoriteSubject?: string;
  hobbies?: string;
  schoolName?: string;
  // Instructor specific fields
  expertise?: string[];
  yearsExperience?: number;
}

export interface CourseDBItem extends DynamoDBItem {
  PK: `COURSE#${string}`;
  SK: 'METADATA';
  GSI1PK: `INSTRUCTOR#${string}`;
  GSI1SK: `COURSE#${string}`;
  name: string;
  code: string;
  description: string;
  instructorId: string;
  instructorName: string;
  status: 'draft' | 'published' | 'archived';
  semester: string;
  year: number;
  credits: number;
  maxEnrollment?: number;
  currentEnrollment: number;
  schedule: {
    days: string[];
    time: string;
    location: string;
  };
  prerequisites: string[];
  learningObjectives: string[];
  gradingPolicy: {
    assignments: number;
    exams: number;
    participation: number;
    projects: number;
  };
}

export interface AssignmentDBItem extends DynamoDBItem {
  PK: `COURSE#${string}`;
  SK: `ASSIGNMENT#${string}`;
  GSI1PK: `DUE_DATE#${string}`;
  GSI1SK: `ASSIGNMENT#${string}`;
  courseId: string;
  assignmentId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  status: 'draft' | 'published' | 'grading' | 'completed';
  submissionType: 'video' | 'text' | 'file' | 'url';
  instructions: string;
  rubric?: Rubric;
  peerReview?: {
    enabled: boolean;
    dueDate?: string;
    minResponses: number;
    maxResponses: number;
    wordLimit?: number;
    characterLimit?: number;
  };
}

export interface SubmissionDBItem extends DynamoDBItem {
  PK: `ASSIGNMENT#${string}`;
  SK: `SUBMISSION#${string}`;
  GSI1PK: `STUDENT#${string}`;
  GSI1SK: `SUBMISSION#${string}`;
  assignmentId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  title: string;
  content?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  fileSize?: number;
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  rubric?: Rubric;
  submittedAt?: string;
  gradedAt?: string;
}

export interface EnrollmentDBItem extends DynamoDBItem {
  PK: `COURSE#${string}`;
  SK: `STUDENT#${string}`;
  GSI1PK: `STUDENT#${string}`;
  GSI1SK: `COURSE#${string}`;
  courseId: string;
  studentId: string;
  enrolledAt: string;
  status: 'active' | 'dropped' | 'completed';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type EntityType = 'user' | 'course' | 'assignment' | 'submission' | 'enrollment';
export type UserRole = 'student' | 'instructor' | 'admin';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type AssignmentStatus = 'draft' | 'published' | 'grading' | 'completed';
export type SubmissionStatus = 'draft' | 'submitted' | 'graded' | 'returned';
export type SubmissionType = 'video' | 'text' | 'file' | 'url';

// ============================================================================
// CONSTANTS
// ============================================================================

export const ENTITY_TYPES = {
  USER: 'USER',
  COURSE: 'COURSE',
  ASSIGNMENT: 'ASSIGNMENT',
  SUBMISSION: 'SUBMISSION',
  ENROLLMENT: 'ENROLLMENT',
} as const;

export const USER_ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
} as const;

export const COURSE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export const ASSIGNMENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  GRADING: 'grading',
  COMPLETED: 'completed',
} as const;

export const SUBMISSION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  RETURNED: 'returned',
} as const;
