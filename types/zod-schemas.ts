// Zod validation schemas for DemoProject entities
import { z } from 'zod';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

// Common patterns and constraints
const PATTERNS = {
  USERNAME: /^[a-zA-Z0-9._-]{3,50}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NAME: /^[a-zA-Z\s'-]{1,50}$/,
  STUDENT_ID: /^[A-Z0-9]{1,20}$/,
  INSTRUCTOR_ID: /^[A-Z0-9]{1,20}$/,
  COURSE_CODE: /^[A-Z]{2,6}[0-9]{3,4}$/,
  ID: /^[a-zA-Z0-9_-]{1,50}$/,
  MIME_TYPE: /^[a-zA-Z0-9/.-]+$/,
} as const;

const CONSTRAINTS = {
  USERNAME: { min: 3, max: 50 },
  EMAIL: { max: 254 },
  NAME: { min: 1, max: 50 },
  BIO: { max: 500 },
  TITLE: { min: 3, max: 200 },
  DESCRIPTION: { min: 10, max: 2000 },
  STUDENT_NOTES: { max: 1000 },
  INSTRUCTOR_NOTES: { max: 1000 },
  CONTENT: { max: 10000 },
  POINTS: { min: 1, max: 1000 },
  WEIGHT: { min: 1, max: 100 },
  CREDITS: { min: 1, max: 30 },
  MAX_ENROLLMENT: { min: 1, max: 1000 },
  MAX_SUBMISSIONS: { min: 1, max: 10 },
  MAX_FILE_SIZE: { min: 1024, max: 100 * 1024 * 1024 }, // 1KB to 100MB
  MAX_ATTACHMENTS: 10,
  LEARNING_OUTCOME: { max: 200 },
} as const;

// ============================================================================
// UTILITY SCHEMAS
// ============================================================================

// Date string validation (ISO format)
const dateStringSchema = z.string().datetime({
  message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
});

// File size validation (in bytes)
const fileSizeSchema = z.number()
  .min(CONSTRAINTS.MAX_FILE_SIZE.min, `File size must be at least ${CONSTRAINTS.MAX_FILE_SIZE.min} bytes`)
  .max(CONSTRAINTS.MAX_FILE_SIZE.max, `File size must not exceed ${CONSTRAINTS.MAX_FILE_SIZE.max} bytes`);

// ============================================================================
// USER SCHEMAS
// ============================================================================

// User preferences schemas
const notificationPreferencesSchema = z.object({
  email: z.boolean().default(true),
  push: z.boolean().default(false),
  sms: z.boolean().default(false),
  courseUpdates: z.boolean().default(true),
  assignmentReminders: z.boolean().default(true),
  gradeNotifications: z.boolean().default(true),
});

const accessibilityPreferencesSchema = z.object({
  highContrast: z.boolean().default(false),
  largeText: z.boolean().default(false),
  screenReader: z.boolean().default(false),
  reducedMotion: z.boolean().default(false),
});

const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  language: z.string().default('en'),
  notifications: notificationPreferencesSchema,
  accessibility: accessibilityPreferencesSchema,
});

// Course enrollment schema
const courseEnrollmentSchema = z.object({
  courseId: z.string().regex(PATTERNS.ID, 'Invalid course ID format'),
  enrollmentDate: dateStringSchema,
  status: z.enum(['active', 'completed', 'dropped', 'pending']),
  grade: z.string().optional(),
  credits: z.number().min(0).max(30).optional(),
});

// Main user schema
export const userSchema = z.object({
  userId: z.string().regex(PATTERNS.ID, 'Invalid user ID format'),
  email: z.string()
    .max(CONSTRAINTS.EMAIL.max, `Email must not exceed ${CONSTRAINTS.EMAIL.max} characters`)
    .regex(PATTERNS.EMAIL, 'Invalid email format'),
  firstName: z.string()
    .min(CONSTRAINTS.NAME.min, `First name must be at least ${CONSTRAINTS.NAME.min} character`)
    .max(CONSTRAINTS.NAME.max, `First name must not exceed ${CONSTRAINTS.NAME.max} characters`)
    .regex(PATTERNS.NAME, 'First name contains invalid characters'),
  lastName: z.string()
    .min(CONSTRAINTS.NAME.min, `Last name must be at least ${CONSTRAINTS.NAME.min} character`)
    .max(CONSTRAINTS.NAME.max, `Last name must not exceed ${CONSTRAINTS.NAME.max} characters`)
    .regex(PATTERNS.NAME, 'Last name contains invalid characters'),
  role: z.enum(['student', 'instructor', 'admin']),
  cognitoSub: z.string().optional(),
  status: z.enum(['CONFIRMED', 'UNCONFIRMED', 'ARCHIVED', 'COMPROMISED', 'UNKNOWN', 'RESET_REQUIRED', 'FORCE_CHANGE_PASSWORD']),
  enabled: z.boolean(),
  department: z.string()
    .max(100, 'Department must not exceed 100 characters')
    .regex(/^[a-zA-Z\s&.-]+$/, 'Department contains invalid characters')
    .optional(),
  studentId: z.string()
    .regex(PATTERNS.STUDENT_ID, 'Student ID must contain only uppercase letters and numbers')
    .optional(),
  instructorId: z.string()
    .regex(PATTERNS.INSTRUCTOR_ID, 'Instructor ID must contain only uppercase letters and numbers')
    .optional(),
  bio: z.string()
    .max(CONSTRAINTS.BIO.max, `Bio must not exceed ${CONSTRAINTS.BIO.max} characters`)
    .optional(),
  avatar: z.string().url('Avatar must be a valid URL').optional(),
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
  lastLogin: dateStringSchema.optional(),
  preferences: userPreferencesSchema.optional(),
  courses: z.array(courseEnrollmentSchema).optional(),
  assignments: z.array(z.any()).optional(), // Will be defined later
});

// User creation schema
export const createUserSchema = z.object({
  username: z.string()
    .min(CONSTRAINTS.USERNAME.min, `Username must be at least ${CONSTRAINTS.USERNAME.min} characters`)
    .max(CONSTRAINTS.USERNAME.max, `Username must not exceed ${CONSTRAINTS.USERNAME.max} characters`)
    .regex(PATTERNS.USERNAME, 'Username must contain only letters, numbers, dots, underscores, and hyphens'),
  email: z.string()
    .max(CONSTRAINTS.EMAIL.max, `Email must not exceed ${CONSTRAINTS.EMAIL.max} characters`)
    .regex(PATTERNS.EMAIL, 'Invalid email format'),
  firstName: z.string()
    .min(CONSTRAINTS.NAME.min, `First name must be at least ${CONSTRAINTS.NAME.min} character`)
    .max(CONSTRAINTS.NAME.max, `First name must not exceed ${CONSTRAINTS.NAME.max} characters`)
    .regex(PATTERNS.NAME, 'First name contains invalid characters'),
  lastName: z.string()
    .min(CONSTRAINTS.NAME.min, `Last name must be at least ${CONSTRAINTS.NAME.min} character`)
    .max(CONSTRAINTS.NAME.max, `Last name must not exceed ${CONSTRAINTS.NAME.max} characters`)
    .regex(PATTERNS.NAME, 'Last name contains invalid characters'),
  role: z.enum(['student', 'instructor', 'admin']),
  department: z.string()
    .max(100, 'Department must not exceed 100 characters')
    .regex(/^[a-zA-Z\s&.-]+$/, 'Department contains invalid characters')
    .optional(),
  studentId: z.string()
    .regex(PATTERNS.STUDENT_ID, 'Student ID must contain only uppercase letters and numbers')
    .optional(),
  instructorId: z.string()
    .regex(PATTERNS.INSTRUCTOR_ID, 'Instructor ID must contain only uppercase letters and numbers')
    .optional(),
  bio: z.string()
    .max(CONSTRAINTS.BIO.max, `Bio must not exceed ${CONSTRAINTS.BIO.max} characters`)
    .optional(),
}).refine((data) => {
  if (data.role === 'student' && !data.studentId) {
    return false;
  }
  if (data.role === 'instructor' && !data.instructorId) {
    return false;
  }
  return true;
}, {
  message: 'Student ID is required for student users, Instructor ID is required for instructor users',
  path: ['role'],
});

// User update schema
export const updateUserSchema = z.object({
  firstName: z.string()
    .min(CONSTRAINTS.NAME.min, `First name must be at least ${CONSTRAINTS.NAME.min} character`)
    .max(CONSTRAINTS.NAME.max, `First name must not exceed ${CONSTRAINTS.NAME.max} characters`)
    .regex(PATTERNS.NAME, 'First name contains invalid characters')
    .optional(),
  lastName: z.string()
    .min(CONSTRAINTS.NAME.min, `Last name must be at least ${CONSTRAINTS.NAME.min} character`)
    .max(CONSTRAINTS.NAME.max, `Last name must not exceed ${CONSTRAINTS.NAME.max} characters`)
    .regex(PATTERNS.NAME, 'Last name contains invalid characters')
    .optional(),
  department: z.string()
    .max(100, 'Department must not exceed 100 characters')
    .regex(/^[a-zA-Z\s&.-]+$/, 'Department contains invalid characters')
    .optional(),
  bio: z.string()
    .max(CONSTRAINTS.BIO.max, `Bio must not exceed ${CONSTRAINTS.BIO.max} characters`)
    .optional(),
  avatar: z.string().url('Avatar must be a valid URL').optional(),
  preferences: userPreferencesSchema.partial().optional(),
});

// ============================================================================
// ASSIGNMENT SCHEMAS
// ============================================================================

// Rubric schemas
const rubricLevelSchema = z.object({
  name: z.string().min(1, 'Level name is required').max(100, 'Level name must not exceed 100 characters'),
  description: z.string().min(1, 'Level description is required').max(500, 'Level description must not exceed 500 characters'),
  points: z.number().min(0, 'Points must be non-negative').max(1000, 'Points must not exceed 1000'),
});

const rubricCriterionSchema = z.object({
  name: z.string().min(1, 'Criterion name is required').max(100, 'Criterion name must not exceed 100 characters'),
  description: z.string().min(1, 'Criterion description is required').max(500, 'Criterion description must not exceed 500 characters'),
  points: z.number().min(0, 'Points must be non-negative').max(1000, 'Points must not exceed 1000'),
  levels: z.array(rubricLevelSchema).min(2, 'At least 2 levels are required'),
});

const rubricSchema = z.object({
  criteria: z.array(rubricCriterionSchema).min(1, 'At least one criterion is required'),
  totalPoints: z.number().min(1, 'Total points must be at least 1').max(1000, 'Total points must not exceed 1000'),
});

// Assignment attachment schema
const assignmentAttachmentSchema = z.object({
  attachmentId: z.string().regex(PATTERNS.ID, 'Invalid attachment ID format'),
  fileName: z.string().min(1, 'File name is required').max(255, 'File name must not exceed 255 characters'),
  fileType: z.string().regex(PATTERNS.MIME_TYPE, 'Invalid file type format'),
  fileSize: fileSizeSchema,
  url: z.string().url('URL must be valid'),
  uploadedAt: dateStringSchema,
});

// Main assignment schema
export const assignmentSchema = z.object({
  assignmentId: z.string().regex(PATTERNS.ID, 'Invalid assignment ID format'),
  title: z.string()
    .min(CONSTRAINTS.TITLE.min, `Title must be at least ${CONSTRAINTS.TITLE.min} characters`)
    .max(CONSTRAINTS.TITLE.max, `Title must not exceed ${CONSTRAINTS.TITLE.max} characters`),
  description: z.string()
    .min(CONSTRAINTS.DESCRIPTION.min, `Description must be at least ${CONSTRAINTS.DESCRIPTION.min} characters`)
    .max(CONSTRAINTS.DESCRIPTION.max, `Description must not exceed ${CONSTRAINTS.DESCRIPTION.max} characters`),
  courseId: z.string().regex(PATTERNS.ID, 'Invalid course ID format'),
  instructorId: z.string().regex(PATTERNS.ID, 'Invalid instructor ID format'),
  type: z.enum(['essay', 'quiz', 'project', 'presentation', 'lab', 'discussion', 'other']),
  points: z.number()
    .min(CONSTRAINTS.POINTS.min, `Points must be at least ${CONSTRAINTS.POINTS.min}`)
    .max(CONSTRAINTS.POINTS.max, `Points must not exceed ${CONSTRAINTS.POINTS.max}`),
  weight: z.number()
    .min(CONSTRAINTS.WEIGHT.min, `Weight must be at least ${CONSTRAINTS.WEIGHT.min}`)
    .max(CONSTRAINTS.WEIGHT.max, `Weight must not exceed ${CONSTRAINTS.WEIGHT.max}`),
  dueDate: dateStringSchema,
  startDate: dateStringSchema,
  allowLateSubmission: z.boolean(),
  latePenalty: z.number().min(0, 'Late penalty must be non-negative').max(100, 'Late penalty must not exceed 100%').optional(),
  maxSubmissions: z.number()
    .min(CONSTRAINTS.MAX_SUBMISSIONS.min, `Max submissions must be at least ${CONSTRAINTS.MAX_SUBMISSIONS.min}`)
    .max(CONSTRAINTS.MAX_SUBMISSIONS.max, `Max submissions must not exceed ${CONSTRAINTS.MAX_SUBMISSIONS.max}`),
  allowedFileTypes: z.array(z.string().regex(PATTERNS.MIME_TYPE, 'Invalid file type format')).min(1, 'At least one file type must be allowed'),
  maxFileSize: fileSizeSchema,
  individualSubmission: z.boolean(),
  rubric: rubricSchema.optional(),
  autoGrade: z.boolean(),
  peerReview: z.boolean(),
  status: z.enum(['draft', 'published', 'active', 'grading', 'completed', 'archived']),
  visibility: z.enum(['public', 'private', 'scheduled']),
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
  publishedAt: dateStringSchema.optional(),
  submissions: z.array(z.any()).optional(), // Will be defined later
  attachments: z.array(assignmentAttachmentSchema).optional(),
});

// Assignment creation schema
export const createAssignmentSchema = z.object({
  title: z.string()
    .min(CONSTRAINTS.TITLE.min, `Title must be at least ${CONSTRAINTS.TITLE.min} characters`)
    .max(CONSTRAINTS.TITLE.max, `Title must not exceed ${CONSTRAINTS.TITLE.max} characters`),
  description: z.string()
    .min(CONSTRAINTS.DESCRIPTION.min, `Description must be at least ${CONSTRAINTS.DESCRIPTION.min} characters`)
    .max(CONSTRAINTS.DESCRIPTION.max, `Description must not exceed ${CONSTRAINTS.DESCRIPTION.max} characters`),
  courseId: z.string().regex(PATTERNS.ID, 'Invalid course ID format'),
  type: z.enum(['essay', 'quiz', 'project', 'presentation', 'lab', 'discussion', 'other']),
  points: z.number()
    .min(CONSTRAINTS.POINTS.min, `Points must be at least ${CONSTRAINTS.POINTS.min}`)
    .max(CONSTRAINTS.POINTS.max, `Points must not exceed ${CONSTRAINTS.POINTS.max}`),
  weight: z.number()
    .min(CONSTRAINTS.WEIGHT.min, `Weight must be at least ${CONSTRAINTS.WEIGHT.min}`)
    .max(CONSTRAINTS.WEIGHT.max, `Weight must not exceed ${CONSTRAINTS.WEIGHT.max}`),
  dueDate: dateStringSchema.refine((date) => new Date(date) > new Date(), {
    message: 'Due date must be in the future',
  }),
  startDate: dateStringSchema,
  allowLateSubmission: z.boolean(),
  latePenalty: z.number().min(0, 'Late penalty must be non-negative').max(100, 'Late penalty must not exceed 100%').optional(),
  maxSubmissions: z.number()
    .min(CONSTRAINTS.MAX_SUBMISSIONS.min, `Max submissions must be at least ${CONSTRAINTS.MAX_SUBMISSIONS.min}`)
    .max(CONSTRAINTS.MAX_SUBMISSIONS.max, `Max submissions must not exceed ${CONSTRAINTS.MAX_SUBMISSIONS.max}`),
  allowedFileTypes: z.array(z.string().regex(PATTERNS.MIME_TYPE, 'Invalid file type format')).min(1, 'At least one file type must be allowed'),
  maxFileSize: fileSizeSchema,
  individualSubmission: z.boolean(),
  autoGrade: z.boolean(),
  peerReview: z.boolean(),
  rubric: rubricSchema.optional(),
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const dueDate = new Date(data.dueDate);
  return startDate < dueDate;
}, {
  message: 'Start date must be before due date',
  path: ['startDate'],
});

// Assignment update schema
export const updateAssignmentSchema = z.object({
  title: z.string()
    .min(CONSTRAINTS.TITLE.min, `Title must be at least ${CONSTRAINTS.TITLE.min} characters`)
    .max(CONSTRAINTS.TITLE.max, `Title must not exceed ${CONSTRAINTS.TITLE.max} characters`)
    .optional(),
  description: z.string()
    .min(CONSTRAINTS.DESCRIPTION.min, `Description must be at least ${CONSTRAINTS.DESCRIPTION.min} characters`)
    .max(CONSTRAINTS.DESCRIPTION.max, `Description must not exceed ${CONSTRAINTS.DESCRIPTION.max} characters`)
    .optional(),
  points: z.number()
    .min(CONSTRAINTS.POINTS.min, `Points must be at least ${CONSTRAINTS.POINTS.min}`)
    .max(CONSTRAINTS.POINTS.max, `Points must not exceed ${CONSTRAINTS.POINTS.max}`)
    .optional(),
  weight: z.number()
    .min(CONSTRAINTS.WEIGHT.min, `Weight must be at least ${CONSTRAINTS.WEIGHT.min}`)
    .max(CONSTRAINTS.WEIGHT.max, `Weight must not exceed ${CONSTRAINTS.WEIGHT.max}`)
    .optional(),
  dueDate: dateStringSchema.optional(),
  startDate: dateStringSchema.optional(),
  allowLateSubmission: z.boolean().optional(),
  latePenalty: z.number().min(0, 'Late penalty must be non-negative').max(100, 'Late penalty must not exceed 100%').optional(),
  maxSubmissions: z.number()
    .min(CONSTRAINTS.MAX_SUBMISSIONS.min, `Max submissions must be at least ${CONSTRAINTS.MAX_SUBMISSIONS.min}`)
    .max(CONSTRAINTS.MAX_SUBMISSIONS.max, `Max submissions must not exceed ${CONSTRAINTS.MAX_SUBMISSIONS.max}`)
    .optional(),
  allowedFileTypes: z.array(z.string().regex(PATTERNS.MIME_TYPE, 'Invalid file type format')).optional(),
  maxFileSize: fileSizeSchema.optional(),
  rubric: rubricSchema.optional(),
  status: z.enum(['draft', 'published', 'active', 'grading', 'completed', 'archived']).optional(),
  visibility: z.enum(['public', 'private', 'scheduled']).optional(),
});

// ============================================================================
// SUBMISSION SCHEMAS
// ============================================================================

// Submission attachment schema
const submissionAttachmentSchema = z.object({
  attachmentId: z.string().regex(PATTERNS.ID, 'Invalid attachment ID format'),
  fileName: z.string().min(1, 'File name is required').max(255, 'File name must not exceed 255 characters'),
  fileType: z.string().regex(PATTERNS.MIME_TYPE, 'Invalid file type format'),
  fileSize: fileSizeSchema,
  url: z.string().url('URL must be valid'),
  uploadedAt: dateStringSchema,
  isPrimary: z.boolean(),
});

// Create submission attachment schema
const createSubmissionAttachmentSchema = z.object({
  fileName: z.string().min(1, 'File name is required').max(255, 'File name must not exceed 255 characters'),
  fileType: z.string().regex(PATTERNS.MIME_TYPE, 'Invalid file type format'),
  fileSize: fileSizeSchema,
  isPrimary: z.boolean(),
});

// Peer review schema
const peerReviewSchema = z.object({
  reviewId: z.string().regex(PATTERNS.ID, 'Invalid review ID format'),
  reviewerId: z.string().regex(PATTERNS.ID, 'Invalid reviewer ID format'),
  submissionId: z.string().regex(PATTERNS.ID, 'Invalid submission ID format'),
  rubricScores: z.array(z.object({
    criterionId: z.string().regex(PATTERNS.ID, 'Invalid criterion ID format'),
    score: z.number().min(0, 'Score must be non-negative').max(1000, 'Score must not exceed 1000'),
    feedback: z.string().max(500, 'Feedback must not exceed 500 characters').optional(),
  })),
  comments: z.string().min(1, 'Comments are required').max(1000, 'Comments must not exceed 1000 characters'),
  submittedAt: dateStringSchema,
});

// Main submission schema
export const assignmentSubmissionSchema = z.object({
  submissionId: z.string().regex(PATTERNS.ID, 'Invalid submission ID format'),
  assignmentId: z.string().regex(PATTERNS.ID, 'Invalid assignment ID format'),
  studentId: z.string().regex(PATTERNS.ID, 'Invalid student ID format'),
  courseId: z.string().regex(PATTERNS.ID, 'Invalid course ID format'),
  content: z.string()
    .max(CONSTRAINTS.CONTENT.max, `Content must not exceed ${CONSTRAINTS.CONTENT.max} characters`)
    .optional(),
  attachments: z.array(submissionAttachmentSchema),
  submittedAt: dateStringSchema,
  lastModified: dateStringSchema,
  submissionNumber: z.number().min(1, 'Submission number must be at least 1'),
  status: z.enum(['submitted', 'graded', 'returned', 'late', 'overdue', 'withdrawn']),
  grade: z.number().min(0, 'Grade must be non-negative').max(1000, 'Grade must not exceed 1000').optional(),
  feedback: z.string().max(2000, 'Feedback must not exceed 2000 characters').optional(),
  gradedBy: z.string().regex(PATTERNS.ID, 'Invalid grader ID format').optional(),
  gradedAt: dateStringSchema.optional(),
  isLate: z.boolean(),
  daysLate: z.number().min(0, 'Days late must be non-negative').optional(),
  latePenaltyApplied: z.number().min(0, 'Late penalty must be non-negative').max(100, 'Late penalty must not exceed 100%').optional(),
  peerReviews: z.array(peerReviewSchema).optional(),
  peerReviewScore: z.number().min(0, 'Peer review score must be non-negative').max(1000, 'Peer review score must not exceed 1000').optional(),
  studentNotes: z.string()
    .max(CONSTRAINTS.STUDENT_NOTES.max, `Student notes must not exceed ${CONSTRAINTS.STUDENT_NOTES.max} characters`)
    .optional(),
  instructorNotes: z.string()
    .max(CONSTRAINTS.INSTRUCTOR_NOTES.max, `Instructor notes must not exceed ${CONSTRAINTS.INSTRUCTOR_NOTES.max} characters`)
    .optional(),
  assignment: z.any().optional(), // Will be defined later
  student: z.any().optional(), // Will be defined later
});

// Submission creation schema
export const createSubmissionSchema = z.object({
  assignmentId: z.string().regex(PATTERNS.ID, 'Invalid assignment ID format'),
  content: z.string()
    .max(CONSTRAINTS.CONTENT.max, `Content must not exceed ${CONSTRAINTS.CONTENT.max} characters`)
    .optional(),
  attachments: z.array(createSubmissionAttachmentSchema)
    .max(CONSTRAINTS.MAX_ATTACHMENTS, `Maximum ${CONSTRAINTS.MAX_ATTACHMENTS} attachments allowed`),
  studentNotes: z.string()
    .max(CONSTRAINTS.STUDENT_NOTES.max, `Student notes must not exceed ${CONSTRAINTS.STUDENT_NOTES.max} characters`)
    .optional(),
}).refine((data) => {
  return data.content || data.attachments.length > 0;
}, {
  message: 'Either content or attachments must be provided',
  path: ['content'],
});

// Submission update schema
export const updateSubmissionSchema = z.object({
  content: z.string()
    .max(CONSTRAINTS.CONTENT.max, `Content must not exceed ${CONSTRAINTS.CONTENT.max} characters`)
    .optional(),
  attachments: z.array(createSubmissionAttachmentSchema)
    .max(CONSTRAINTS.MAX_ATTACHMENTS, `Maximum ${CONSTRAINTS.MAX_ATTACHMENTS} attachments allowed`)
    .optional(),
  studentNotes: z.string()
    .max(CONSTRAINTS.STUDENT_NOTES.max, `Student notes must not exceed ${CONSTRAINTS.STUDENT_NOTES.max} characters`)
    .optional(),
});

// Grade submission schema
export const gradeSubmissionSchema = z.object({
  grade: z.number().min(0, 'Grade must be non-negative').max(1000, 'Grade must not exceed 1000'),
  feedback: z.string().max(2000, 'Feedback must not exceed 2000 characters').optional(),
  rubricScores: z.array(z.object({
    criterionId: z.string().regex(PATTERNS.ID, 'Invalid criterion ID format'),
    score: z.number().min(0, 'Score must be non-negative').max(1000, 'Score must not exceed 1000'),
    feedback: z.string().max(500, 'Feedback must not exceed 500 characters').optional(),
  })).optional(),
  instructorNotes: z.string()
    .max(CONSTRAINTS.INSTRUCTOR_NOTES.max, `Instructor notes must not exceed ${CONSTRAINTS.INSTRUCTOR_NOTES.max} characters`)
    .optional(),
});

// ============================================================================
// COURSE SCHEMAS
// ============================================================================

// Main course schema
export const courseSchema = z.object({
  courseId: z.string().regex(PATTERNS.ID, 'Invalid course ID format'),
  title: z.string()
    .min(CONSTRAINTS.TITLE.min, `Title must be at least ${CONSTRAINTS.TITLE.min} characters`)
    .max(CONSTRAINTS.TITLE.max, `Title must not exceed ${CONSTRAINTS.TITLE.max} characters`),
  description: z.string()
    .min(CONSTRAINTS.DESCRIPTION.min, `Description must be at least ${CONSTRAINTS.DESCRIPTION.min} characters`)
    .max(CONSTRAINTS.DESCRIPTION.max, `Description must not exceed ${CONSTRAINTS.DESCRIPTION.max} characters`),
  code: z.string().regex(PATTERNS.COURSE_CODE, 'Course code must be 2-6 letters followed by 3-4 numbers (e.g., CS101, MATH2000)'),
  department: z.string()
    .min(1, 'Department is required')
    .max(100, 'Department must not exceed 100 characters')
    .regex(/^[a-zA-Z\s&.-]+$/, 'Department contains invalid characters'),
  credits: z.number()
    .min(CONSTRAINTS.CREDITS.min, `Credits must be at least ${CONSTRAINTS.CREDITS.min}`)
    .max(CONSTRAINTS.CREDITS.max, `Credits must not exceed ${CONSTRAINTS.CREDITS.max}`),
  level: z.enum(['undergraduate', 'graduate', 'doctoral', 'continuing-education']),
  prerequisites: z.array(z.string().regex(PATTERNS.ID, 'Invalid prerequisite course ID format')).optional(),
  learningOutcomes: z.array(z.string()
    .min(1, 'Learning outcome cannot be empty')
    .max(CONSTRAINTS.LEARNING_OUTCOME.max, `Learning outcome must not exceed ${CONSTRAINTS.LEARNING_OUTCOME.max} characters`)
  ).min(1, 'At least one learning outcome must be specified'),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  semester: z.string().min(1, 'Semester is required').max(50, 'Semester must not exceed 50 characters'),
  academicYear: z.string().min(4, 'Academic year must be at least 4 characters').max(10, 'Academic year must not exceed 10 characters'),
  instructorId: z.string().regex(PATTERNS.ID, 'Invalid instructor ID format'),
  teachingAssistants: z.array(z.string().regex(PATTERNS.ID, 'Invalid teaching assistant ID format')).optional(),
  maxEnrollment: z.number()
    .min(CONSTRAINTS.MAX_ENROLLMENT.min, `Max enrollment must be at least ${CONSTRAINTS.MAX_ENROLLMENT.min}`)
    .max(CONSTRAINTS.MAX_ENROLLMENT.max, `Max enrollment must not exceed ${CONSTRAINTS.MAX_ENROLLMENT.max}`),
  currentEnrollment: z.number().min(0, 'Current enrollment must be non-negative'),
  status: z.enum(['draft', 'published', 'active', 'completed', 'archived']),
  visibility: z.enum(['public', 'private', 'scheduled']),
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
  publishedAt: dateStringSchema.optional(),
  assignments: z.array(z.any()).optional(), // Will be defined later
  enrollments: z.array(courseEnrollmentSchema).optional(),
});

// Course creation schema
export const createCourseSchema = z.object({
  title: z.string()
    .min(CONSTRAINTS.TITLE.min, `Title must be at least ${CONSTRAINTS.TITLE.min} characters`)
    .max(CONSTRAINTS.TITLE.max, `Title must not exceed ${CONSTRAINTS.TITLE.max} characters`),
  description: z.string()
    .min(CONSTRAINTS.DESCRIPTION.min, `Description must be at least ${CONSTRAINTS.DESCRIPTION.min} characters`)
    .max(CONSTRAINTS.DESCRIPTION.max, `Description must not exceed ${CONSTRAINTS.DESCRIPTION.max} characters`),
  code: z.string().regex(PATTERNS.COURSE_CODE, 'Course code must be 2-6 letters followed by 3-4 numbers (e.g., CS101, MATH2000)'),
  department: z.string()
    .min(1, 'Department is required')
    .max(100, 'Department must not exceed 100 characters')
    .regex(/^[a-zA-Z\s&.-]+$/, 'Department contains invalid characters'),
  credits: z.number()
    .min(CONSTRAINTS.CREDITS.min, `Credits must be at least ${CONSTRAINTS.CREDITS.min}`)
    .max(CONSTRAINTS.CREDITS.max, `Credits must not exceed ${CONSTRAINTS.CREDITS.max}`),
  level: z.enum(['undergraduate', 'graduate', 'doctoral', 'continuing-education']),
  prerequisites: z.array(z.string().regex(PATTERNS.ID, 'Invalid prerequisite course ID format')).optional(),
  learningOutcomes: z.array(z.string()
    .min(1, 'Learning outcome cannot be empty')
    .max(CONSTRAINTS.LEARNING_OUTCOME.max, `Learning outcome must not exceed ${CONSTRAINTS.LEARNING_OUTCOME.max} characters`)
  ).min(1, 'At least one learning outcome must be specified'),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  semester: z.string().min(1, 'Semester is required').max(50, 'Semester must not exceed 50 characters'),
  academicYear: z.string().min(4, 'Academic year must be at least 4 characters').max(10, 'Academic year must not exceed 10 characters'),
  maxEnrollment: z.number()
    .min(CONSTRAINTS.MAX_ENROLLMENT.min, `Max enrollment must be at least ${CONSTRAINTS.MAX_ENROLLMENT.min}`)
    .max(CONSTRAINTS.MAX_ENROLLMENT.max, `Max enrollment must not exceed ${CONSTRAINTS.MAX_ENROLLMENT.max}`),
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return startDate < endDate;
}, {
  message: 'Start date must be before end date',
  path: ['startDate'],
});

// Course update schema
export const updateCourseSchema = z.object({
  title: z.string()
    .min(CONSTRAINTS.TITLE.min, `Title must be at least ${CONSTRAINTS.TITLE.min} characters`)
    .max(CONSTRAINTS.TITLE.max, `Title must not exceed ${CONSTRAINTS.TITLE.max} characters`)
    .optional(),
  description: z.string()
    .min(CONSTRAINTS.DESCRIPTION.min, `Description must be at least ${CONSTRAINTS.DESCRIPTION.min} characters`)
    .max(CONSTRAINTS.DESCRIPTION.max, `Description must not exceed ${CONSTRAINTS.DESCRIPTION.max} characters`)
    .optional(),
  code: z.string().regex(PATTERNS.COURSE_CODE, 'Course code must be 2-6 letters followed by 3-4 numbers (e.g., CS101, MATH2000)').optional(),
  department: z.string()
    .min(1, 'Department is required')
    .max(100, 'Department must not exceed 100 characters')
    .regex(/^[a-zA-Z\s&.-]+$/, 'Department contains invalid characters')
    .optional(),
  credits: z.number()
    .min(CONSTRAINTS.CREDITS.min, `Credits must be at least ${CONSTRAINTS.CREDITS.min}`)
    .max(CONSTRAINTS.CREDITS.max, `Credits must not exceed ${CONSTRAINTS.CREDITS.max}`)
    .optional(),
  level: z.enum(['undergraduate', 'graduate', 'doctoral', 'continuing-education']).optional(),
  prerequisites: z.array(z.string().regex(PATTERNS.ID, 'Invalid prerequisite course ID format')).optional(),
  learningOutcomes: z.array(z.string()
    .min(1, 'Learning outcome cannot be empty')
    .max(CONSTRAINTS.LEARNING_OUTCOME.max, `Learning outcome must not exceed ${CONSTRAINTS.LEARNING_OUTCOME.max} characters`)
  ).optional(),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  semester: z.string().min(1, 'Semester is required').max(50, 'Semester must not exceed 50 characters').optional(),
  academicYear: z.string().min(4, 'Academic year must be at least 4 characters').max(10, 'Academic year must not exceed 10 characters').optional(),
  maxEnrollment: z.number()
    .min(CONSTRAINTS.MAX_ENROLLMENT.min, `Max enrollment must be at least ${CONSTRAINTS.MAX_ENROLLMENT.min}`)
    .max(CONSTRAINTS.MAX_ENROLLMENT.max, `Max enrollment must not exceed ${CONSTRAINTS.MAX_ENROLLMENT.max}`)
    .optional(),
  status: z.enum(['draft', 'published', 'active', 'completed', 'archived']).optional(),
  visibility: z.enum(['public', 'private', 'scheduled']).optional(),
});

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

// Date range schema
const dateRangeSchema = z.object({
  start: dateStringSchema,
  end: dateStringSchema,
}).refine((data) => {
  const startDate = new Date(data.start);
  const endDate = new Date(data.end);
  return startDate < endDate;
}, {
  message: 'Start date must be before end date',
  path: ['start'],
});

// User filters schema
export const userFiltersSchema = z.object({
  role: z.enum(['student', 'instructor', 'admin']).optional(),
  department: z.string().optional(),
  status: z.enum(['CONFIRMED', 'UNCONFIRMED', 'ARCHIVED', 'COMPROMISED', 'UNKNOWN', 'RESET_REQUIRED', 'FORCE_CHANGE_PASSWORD']).optional(),
  search: z.string().optional(),
});

// Assignment filters schema
export const assignmentFiltersSchema = z.object({
  courseId: z.string().regex(PATTERNS.ID, 'Invalid course ID format').optional(),
  type: z.enum(['essay', 'quiz', 'project', 'presentation', 'lab', 'discussion', 'other']).optional(),
  status: z.enum(['draft', 'published', 'active', 'grading', 'completed', 'archived']).optional(),
  instructorId: z.string().regex(PATTERNS.ID, 'Invalid instructor ID format').optional(),
  dueDateRange: dateRangeSchema.optional(),
  search: z.string().optional(),
});

// Submission filters schema
export const submissionFiltersSchema = z.object({
  assignmentId: z.string().regex(PATTERNS.ID, 'Invalid assignment ID format').optional(),
  studentId: z.string().regex(PATTERNS.ID, 'Invalid student ID format').optional(),
  courseId: z.string().regex(PATTERNS.ID, 'Invalid course ID format').optional(),
  status: z.enum(['submitted', 'graded', 'returned', 'late', 'overdue', 'withdrawn']).optional(),
  submittedDateRange: dateRangeSchema.optional(),
  graded: z.boolean().optional(),
});

// Course filters schema
export const courseFiltersSchema = z.object({
  department: z.string().optional(),
  level: z.enum(['undergraduate', 'graduate', 'doctoral', 'continuing-education']).optional(),
  status: z.enum(['draft', 'published', 'active', 'completed', 'archived']).optional(),
  semester: z.string().optional(),
  academicYear: z.string().optional(),
  instructorId: z.string().regex(PATTERNS.ID, 'Invalid instructor ID format').optional(),
  search: z.string().optional(),
});

// ============================================================================
// PAGINATION SCHEMA
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1').default(1),
  limit: z.number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must not exceed 100')
    .default(20),
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

// Generic API response schema
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
    timestamp: z.string().datetime(),
  });

// API error schema
export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.any().optional(),
});

// ============================================================================
// EXPORT ALL SCHEMAS
// ============================================================================

export const schemas = {
  // User schemas
  user: userSchema,
  createUser: createUserSchema,
  updateUser: updateUserSchema,
  
  // Assignment schemas
  assignment: assignmentSchema,
  createAssignment: createAssignmentSchema,
  updateAssignment: updateAssignmentSchema,
  
  // Submission schemas
  submission: assignmentSubmissionSchema,
  createSubmission: createSubmissionSchema,
  updateSubmission: updateSubmissionSchema,
  gradeSubmission: gradeSubmissionSchema,
  
  // Course schemas
  course: courseSchema,
  createCourse: createCourseSchema,
  updateCourse: updateCourseSchema,
  
  // Filter schemas
  userFilters: userFiltersSchema,
  assignmentFilters: assignmentFiltersSchema,
  submissionFilters: submissionFiltersSchema,
  courseFilters: courseFiltersSchema,
  
  // Utility schemas
  pagination: paginationSchema,
  dateRange: dateRangeSchema,
  apiError: apiErrorSchema,
} as const;

// ============================================================================
// TYPE INFERENCE
// ============================================================================

// Export inferred types from schemas
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Assignment = z.infer<typeof assignmentSchema>;
export type CreateAssignment = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignment = z.infer<typeof updateAssignmentSchema>;

export type AssignmentSubmission = z.infer<typeof assignmentSubmissionSchema>;
export type CreateSubmission = z.infer<typeof createSubmissionSchema>;
export type UpdateSubmission = z.infer<typeof updateSubmissionSchema>;
export type GradeSubmission = z.infer<typeof gradeSubmissionSchema>;

export type Course = z.infer<typeof courseSchema>;
export type CreateCourse = z.infer<typeof createCourseSchema>;
export type UpdateCourse = z.infer<typeof updateCourseSchema>;

export type UserFilters = z.infer<typeof userFiltersSchema>;
export type AssignmentFilters = z.infer<typeof assignmentFiltersSchema>;
export type SubmissionFilters = z.infer<typeof submissionFiltersSchema>;
export type CourseFilters = z.infer<typeof courseFiltersSchema>;

export type Pagination = z.infer<typeof paginationSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
