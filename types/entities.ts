// Core entity interfaces for DemoProject

// ============================================================================
// USER ENTITY
// ============================================================================

export interface User {
  // Core user properties
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  
  // Cognito attributes
  cognitoSub?: string;
  status: UserStatus;
  enabled: boolean;
  
  // Custom attributes
  department?: string;
  studentId?: string;
  instructorId?: string;
  bio?: string;
  avatar?: string;
  
  // Additional properties for compatibility
  id?: string;
  sub?: string;
  accessToken?: string;
  token?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  preferences?: UserPreferences;
  
  // Relationships
  courses?: CourseEnrollment[];
  assignments?: AssignmentSubmission[];
}

export type UserRole = 'student' | 'instructor' | 'admin';

export type UserStatus = 'CONFIRMED' | 'UNCONFIRMED' | 'ARCHIVED' | 'COMPROMISED' | 'UNKNOWN' | 'RESET_REQUIRED' | 'FORCE_CHANGE_PASSWORD';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationPreferences;
  accessibility: AccessibilityPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  courseUpdates: boolean;
  assignmentReminders: boolean;
  gradeNotifications: boolean;
}

export interface AccessibilityPreferences {
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  reducedMotion: boolean;
}

export interface CourseEnrollment {
  courseId: string;
  enrollmentDate: Date;
  status: EnrollmentStatus;
  grade?: string;
  credits?: number;
}

export type EnrollmentStatus = 'active' | 'completed' | 'dropped' | 'pending';

// ============================================================================
// ASSIGNMENT ENTITY
// ============================================================================

export interface Assignment {
  // Core assignment properties
  assignmentId: string;
  title: string;
  description: string;
  courseId: string;
  instructorId: string;
  
  // Assignment details
  type: AssignmentType;
  points: number;
  weight: number;
  maxScore: number; // Added for compatibility
  
  // Timing
  dueDate: Date;
  startDate: Date;
  allowLateSubmission: boolean;
  latePenalty?: number; // Percentage penalty per day
  
  // Submission requirements
  maxSubmissions: number;
  allowedFileTypes: string[];
  maxFileSize: number; // in bytes
  individualSubmission: boolean;
  requirements: string; // Added for compatibility
  
  // Grading
  rubric?: Rubric;
  autoGrade: boolean;
  peerReview: boolean;
  grade?: number; // Added for compatibility
  feedback?: string; // Added for compatibility
  
  // Status
  status: AssignmentStatus;
  visibility: AssignmentVisibility;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  
  // Relationships
  submissions?: AssignmentSubmission[];
  attachments?: AssignmentAttachment[];
}

export type AssignmentType = 'essay' | 'quiz' | 'project' | 'presentation' | 'lab' | 'discussion' | 'other';

export type AssignmentStatus = 'draft' | 'published' | 'active' | 'grading' | 'completed' | 'archived' | 'not-started' | 'in-progress' | 'submitted' | 'graded';

export type AssignmentVisibility = 'public' | 'private' | 'scheduled';

export interface Rubric {
  criteria: RubricCriterion[];
  totalPoints: number;
}

export interface RubricCriterion {
  name: string;
  description: string;
  points: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  name: string;
  description: string;
  points: number;
}

export interface AssignmentAttachment {
  attachmentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedAt: Date;
}

// ============================================================================
// SUBMISSION ENTITY
// ============================================================================

export interface AssignmentSubmission {
  // Core submission properties
  submissionId: string;
  assignmentId: string;
  studentId: string;
  courseId: string;
  
  // Submission content
  content?: string;
  attachments: SubmissionAttachment[];
  
  // Metadata
  submittedAt: Date;
  lastModified: Date;
  submissionNumber: number;
  
  // Status and grading
  status: SubmissionStatus;
  grade?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: Date;
  maxScore?: number; // Added for compatibility
  
  // Late submission handling
  isLate: boolean;
  daysLate?: number;
  latePenaltyApplied?: number;
  
  // Peer review
  peerReviews?: PeerReview[];
  peerReviewScore?: number;
  
  // Comments and notes
  studentNotes?: string;
  instructorNotes?: string;
  
  // Relationships
  assignment?: Assignment;
  student?: User;
}

export type SubmissionStatus = 'submitted' | 'graded' | 'returned' | 'late' | 'overdue' | 'withdrawn';

export interface SubmissionAttachment {
  attachmentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedAt: Date;
  isPrimary: boolean;
}

export interface PeerReview {
  reviewId: string;
  reviewerId: string;
  submissionId: string;
  rubricScores: RubricScore[];
  comments: string;
  submittedAt: Date;
}

export interface RubricScore {
  criterionId: string;
  score: number;
  feedback?: string;
}

// ============================================================================
// COURSE ENTITY (Related to assignments and submissions)
// ============================================================================

export interface Course {
  courseId: string;
  title: string;
  description: string;
  code: string; // e.g., "CS101"
  department: string;
  credits: number;
  
  // Course details
  level: CourseLevel;
  prerequisites?: string[];
  learningOutcomes: string[];
  
  // Timing
  startDate: Date;
  endDate: Date;
  semester: string;
  academicYear: string;
  
  // Instructors and students
  instructorId: string;
  teachingAssistants?: string[];
  maxEnrollment: number;
  currentEnrollment: number;
  
  // Status
  status: CourseStatus;
  visibility: CourseVisibility;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  
  // Relationships
  assignments?: Assignment[];
  enrollments?: CourseEnrollment[];
}

export type CourseLevel = 'undergraduate' | 'graduate' | 'doctoral' | 'continuing-education';

export type CourseStatus = 'draft' | 'published' | 'active' | 'completed' | 'archived';

export type CourseVisibility = 'public' | 'private' | 'scheduled';

// ============================================================================
// API REQUEST/RESPONSE INTERFACES
// ============================================================================

// User API interfaces
export interface CreateUserRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  studentId?: string;
  instructorId?: string;
  bio?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  department?: string;
  bio?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

export interface UserResponse {
  user: User;
}

export interface UsersResponse {
  users: User[];
  pagination: PaginationInfo;
}

// Assignment API interfaces
export interface CreateAssignmentRequest {
  title: string;
  description: string;
  courseId: string;
  type: AssignmentType;
  points: number;
  weight: number;
  dueDate: string; // ISO date string
  startDate: string; // ISO date string
  allowLateSubmission: boolean;
  latePenalty?: number;
  maxSubmissions: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  individualSubmission: boolean;
  autoGrade: boolean;
  peerReview: boolean;
  rubric?: Rubric;
}

export interface UpdateAssignmentRequest {
  title?: string;
  description?: string;
  points?: number;
  weight?: number;
  dueDate?: string;
  startDate?: string;
  allowLateSubmission?: boolean;
  latePenalty?: number;
  maxSubmissions?: number;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  rubric?: Rubric;
  status?: AssignmentStatus;
  visibility?: AssignmentVisibility;
}

export interface AssignmentResponse {
  assignment: Assignment;
}

export interface AssignmentsResponse {
  assignments: Assignment[];
  pagination: PaginationInfo;
}

// Submission API interfaces
export interface CreateSubmissionRequest {
  assignmentId: string;
  content?: string;
  attachments: CreateSubmissionAttachment[];
  studentNotes?: string;
}

export interface CreateSubmissionAttachment {
  fileName: string;
  fileType: string;
  fileSize: number;
  isPrimary: boolean;
}

export interface UpdateSubmissionRequest {
  content?: string;
  attachments?: CreateSubmissionAttachment[];
  studentNotes?: string;
}

export interface GradeSubmissionRequest {
  grade: number;
  feedback?: string;
  rubricScores?: RubricScore[];
  instructorNotes?: string;
}

export interface SubmissionResponse {
  submission: AssignmentSubmission;
}

export interface SubmissionsResponse {
  submissions: AssignmentSubmission[];
  pagination: PaginationInfo;
}

// Course API interfaces
export interface CreateCourseRequest {
  title: string;
  description: string;
  code: string;
  department: string;
  credits: number;
  level: CourseLevel;
  prerequisites?: string[];
  learningOutcomes: string[];
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  semester: string;
  academicYear: string;
  maxEnrollment: number;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  code?: string;
  department?: string;
  credits?: number;
  level?: CourseLevel;
  prerequisites?: string[];
  learningOutcomes?: string[];
  startDate?: string;
  endDate?: string;
  semester?: string;
  academicYear?: string;
  maxEnrollment?: number;
  status?: CourseStatus;
  visibility?: CourseVisibility;
}

export interface CourseResponse {
  course: Course;
}

export interface CoursesResponse {
  courses: Course[];
  pagination: PaginationInfo;
}

// ============================================================================
// COMMON INTERFACES
// ============================================================================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  message: string;
  code?: string;
  details?: any;
}

// ============================================================================
// FILTER AND QUERY INTERFACES
// ============================================================================

export interface UserFilters {
  role?: UserRole;
  department?: string;
  status?: UserStatus;
  search?: string;
}

export interface AssignmentFilters {
  courseId?: string;
  type?: AssignmentType;
  status?: AssignmentStatus;
  instructorId?: string;
  dueDateRange?: DateRange;
  search?: string;
}

export interface SubmissionFilters {
  assignmentId?: string;
  studentId?: string;
  courseId?: string;
  status?: SubmissionStatus;
  submittedDateRange?: DateRange;
  graded?: boolean;
}

export interface CourseFilters {
  department?: string;
  level?: CourseLevel;
  status?: CourseStatus;
  semester?: string;
  academicYear?: string;
  instructorId?: string;
  search?: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type EntityId = string;

export type Timestamp = Date | string;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type ReadonlyFields<T, K extends keyof T> = T & Readonly<Pick<T, K>>;

// ============================================================================
// ENUM-LIKE CONSTANTS
// ============================================================================

export const USER_ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
} as const;

export const ASSIGNMENT_TYPES = {
  ESSAY: 'essay',
  QUIZ: 'quiz',
  PROJECT: 'project',
  PRESENTATION: 'presentation',
  LAB: 'lab',
  DISCUSSION: 'discussion',
  OTHER: 'other',
} as const;

export const SUBMISSION_STATUSES = {
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  RETURNED: 'returned',
  LATE: 'late',
  OVERDUE: 'overdue',
  WITHDRAWN: 'withdrawn',
} as const;

export const COURSE_LEVELS = {
  UNDERGRADUATE: 'undergraduate',
  GRADUATE: 'graduate',
  DOCTORAL: 'doctoral',
  CONTINUING_EDUCATION: 'continuing-education',
} as const;
