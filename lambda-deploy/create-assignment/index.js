const { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const { z } = require('zod');
const { verifyJwtToken, AuthenticatedUser } = require('./jwt-verifier');

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Environment variables
const ASSIGNMENTS_TABLE = process.env['ASSIGNMENTS_TABLE'] || 'DemoProject-Assignments';
const COURSES_TABLE = process.env['COURSES_TABLE'] || 'DemoProject-Courses';
const USERS_TABLE = process.env['USERS_TABLE'] || 'DemoProject-Users';

// Enhanced assignment creation validation schema
const createAssignmentSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim()
    .refine(title => !/^\s*$/.test(title), 'Title cannot be only whitespace'),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must not exceed 2000 characters')
    .trim()
    .refine(desc => !/^\s*$/.test(desc), 'Description cannot be only whitespace'),
  
  courseId: z.string()
    .min(1, 'Course ID is required')
    .max(50, 'Course ID must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Course ID can only contain letters, numbers, underscores, and hyphens')
    .trim(),
  
  type: z.enum(['essay', 'quiz', 'project', 'presentation', 'lab', 'discussion', 'other'], {
    errorMap: () => ({ message: 'Type must be essay, quiz, project, presentation, lab, discussion, or other' })
  }),
  
  points: z.number()
    .min(1, 'Points must be at least 1')
    .max(1000, 'Points must not exceed 1000')
    .int('Points must be a whole number'),
  
  weight: z.number()
    .min(0.1, 'Weight must be at least 0.1')
    .max(100, 'Weight must not exceed 100')
    .refine(weight => weight <= 100, 'Weight cannot exceed 100%'),
  
  dueDate: z.string()
    .refine((date) => {
      const dueDate = new Date(date);
      const now = new Date();
      return !isNaN(dueDate.getTime()) && dueDate > now;
    }, 'Due date must be a valid future date')
    .refine((date) => {
      const dueDate = new Date(date);
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 2);
      return dueDate <= maxDate;
    }, 'Due date cannot be more than 2 years in the future'),
  
  startDate: z.string()
    .refine((date) => {
      const startDate = new Date(date);
      return !isNaN(startDate.getTime());
    }, 'Start date must be a valid date')
    .refine((date) => {
      const startDate = new Date(date);
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 1);
      return startDate >= minDate;
    }, 'Start date cannot be more than 1 year in the past'),
  
  allowLateSubmission: z.boolean(),
  
  latePenalty: z.number()
    .min(0, 'Late penalty must be non-negative')
    .max(100, 'Late penalty must not exceed 100%')
    .optional()
    .refine((penalty) => {
      if (penalty !== undefined) {
        return penalty >= 0 && penalty <= 100;
      }
      return true;
    }, 'Late penalty must be between 0 and 100'),
  
  maxSubmissions: z.number()
    .min(1, 'Max submissions must be at least 1')
    .max(10, 'Max submissions must not exceed 10')
    .int('Max submissions must be a whole number'),
  
  allowedFileTypes: z.array(z.string())
    .min(1, 'At least one file type must be allowed')
    .max(20, 'Maximum 20 file types allowed')
    .refine((types) => types.every(type => 
      /^[a-zA-Z0-9\/\-\+\.]+$/.test(type) && type.length <= 100
    ), 'File types must be valid MIME types or extensions')
    .refine((types) => types.every(type => type.trim().length > 0), 'File types cannot be empty strings'),
  
  maxFileSize: z.number()
    .min(1024, 'Max file size must be at least 1KB')
    .max(2147483648, 'Max file size must not exceed 2GB'), // 2GB to match upload system
  
  individualSubmission: z.boolean(),
  
  autoGrade: z.boolean(),
  
  peerReview: z.boolean(),
  
  rubric: z.object({
    criteria: z.array(z.object({
      name: z.string().min(1, 'Criteria name is required').max(100, 'Criteria name too long').trim(),
      description: z.string().min(1, 'Criteria description is required').max(500, 'Criteria description too long').trim(),
      maxPoints: z.number().min(0.1, 'Max points must be at least 0.1').max(1000, 'Max points too high'),
      weight: z.number().min(0.1, 'Weight must be at least 0.1').max(100, 'Weight must not exceed 100%')
    })).min(1, 'At least one rubric criteria is required').max(20, 'Maximum 20 rubric criteria allowed'),
    totalPoints: z.number().min(0.1, 'Total points must be at least 0.1')
  }).optional(),
  
  requirements: z.array(z.string())
    .min(1, 'At least one requirement is required')
    .max(50, 'Maximum 50 requirements allowed')
    .refine((reqs) => reqs.every(req => req.trim().length >= 5 && req.trim().length <= 500), 
      'Each requirement must be 5-500 characters and cannot be only whitespace')
    .refine((reqs) => reqs.every(req => !/^\s*$/.test(req)), 'Requirements cannot be only whitespace'),
  
  instructions: z.string()
    .min(10, 'Instructions must be at least 10 characters')
    .max(5000, 'Instructions must not exceed 5000 characters')
    .optional()
    .refine((inst) => !inst || !/^\s*$/.test(inst), 'Instructions cannot be only whitespace'),
  
  attachments: z.array(z.object({
    name: z.string().min(1, 'Attachment name is required').max(200, 'Attachment name too long').trim(),
    url: z.string().url('Invalid attachment URL').max(1000, 'Attachment URL too long'),
    type: z.string().min(1, 'Attachment type is required').max(100, 'Attachment type too long').trim(),
    size: z.number().min(1, 'Attachment size must be positive')
  })).max(10, 'Maximum 10 attachments allowed').optional()
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const dueDate = new Date(data.dueDate);
  return startDate < dueDate;
}, {
  message: 'Start date must be before due date',
  path: ['startDate']
}).refine((data) => {
  if (data.rubric) {
    const calculatedTotal = data.rubric.criteria.reduce((sum, criteria) => sum + criteria.maxPoints, 0);
    return Math.abs(calculatedTotal - data.rubric.totalPoints) < 0.01; // Allow small floating point differences
  }
  return true;
}, {
  message: 'Rubric total points must match sum of criteria points',
  path: ['rubric']
}).refine((data) => {
  if (data.rubric) {
    const totalWeight = data.rubric.criteria.reduce((sum, criteria) => sum + criteria.weight, 0);
    return Math.abs(totalWeight - 100) < 0.01; // Total weight should be 100%
  }
  return true;
}, {
  message: 'Rubric criteria weights must sum to 100%',
  path: ['rubric']
});

type CreateAssignmentRequest = z.infer<typeof createAssignmentSchema>;

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] Starting assignment creation request`);
    
    // Verify JWT token and get user information
    const authResult = await verifyJwtToken(event);
    if (!authResult.success || !authResult.user) {
      console.warn(`[${requestId}] Authentication failed:`, authResult.error);
      return createErrorResponse(401, 'Unauthorized', {
        error: authResult.error || 'Authentication failed',
        requestId
      });
    }

    const user = authResult.user;
    console.log(`[${requestId}] User authenticated: ${user.sub}, Role: ${user.isInstructor ? 'instructor' : user.isAdmin ? 'admin' : 'student'}`);

    // Enhanced instructor-only access control
    const accessControl = await validateInstructorAccess(user, requestId);
    if (!accessControl.hasAccess) {
      console.warn(`[${requestId}] Access control failed for user ${user.sub}: ${accessControl.reason}`);
      return createErrorResponse(403, 'Forbidden', {
        error: accessControl.reason || 'Access denied',
        code: accessControl.code,
        requestId
      });
    }

    // Parse and validate request body
    let requestBody: any;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      console.error(`[${requestId}] JSON parsing error:`, error);
      return createErrorResponse(400, 'Invalid JSON in request body', {
        requestId
      });
    }

    console.log(`[${requestId}] Request body parsed, starting validation`);

    // Validate request data
    const validationResult = createAssignmentSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      console.warn(`[${requestId}] Validation failed:`, errors);
      return createErrorResponse(400, 'Validation failed', {
        errors,
        message: 'Please check your input and try again',
        requestId
      });
    }

    const assignmentData = validationResult.data;
    console.log(`[${requestId}] Validation passed for assignment: ${assignmentData.title}`);

    // Verify course exists and user has access to it
    const courseAccess = await verifyCourseAccess(assignmentData.courseId, user);
    if (!courseAccess.hasAccess) {
      console.warn(`[${requestId}] Course access denied: ${assignmentData.courseId} for user ${user.sub}`);
      return createErrorResponse(403, 'Forbidden', {
        error: courseAccess.message || 'You do not have access to this course',
        requestId
      });
    }

    // Validate business rules
    const businessValidation = validateBusinessRules(assignmentData, user);
    if (!businessValidation.valid) {
      console.warn(`[${requestId}] Business validation failed:`, businessValidation.message);
      return createErrorResponse(400, businessValidation.message || 'Business validation failed', {
        requestId
      });
    }

    // Check for duplicate assignment titles in the same course
    const duplicateCheck = await checkDuplicateAssignment(assignmentData.courseId, assignmentData.title);
    if (duplicateCheck.exists) {
      console.warn(`[${requestId}] Duplicate assignment title detected: ${assignmentData.title} in course ${assignmentData.courseId}`);
      return createErrorResponse(409, 'Conflict', {
        error: 'An assignment with this title already exists in this course',
        suggestion: 'Please use a different title or add a version number',
        requestId
      });
    }

    // Create assignment
    const assignment = await createAssignment(assignmentData, user);
    if (!assignment.success) {
      console.error(`[${requestId}] Failed to create assignment:`, assignment.error);
      return createErrorResponse(500, 'Failed to create assignment', {
        error: assignment.error,
        requestId
      });
    }

    console.log(`[${requestId}] Assignment created successfully: ${assignment.data.assignmentId}`);

    // Return success response
    return createSuccessResponse({
      message: 'Assignment created successfully',
      assignment: assignment.data,
      assignmentId: assignment.data.assignmentId,
      requestId
    }, 'Assignment has been created and is ready for use');

  } catch (error) {
    console.error(`[${requestId}] Create assignment handler error:`, error);
    return createErrorResponse(500, 'Internal server error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};

/**
 * Enhanced instructor access control validation
 */
async function validateInstructorAccess(user: AuthenticatedUser, requestId: string): Promise<{ 
  hasAccess: boolean; 
  reason?: string; 
  code?: string;
  restrictions?: string[];
}> {
  try {
    // Basic role check
    if (!user.isInstructor && !user.isAdmin) {
      return {
        hasAccess: false,
        reason: 'Only instructors and administrators can create assignments',
        code: 'INSUFFICIENT_ROLE'
      };
    }

    // Check if user account is active and verified
    if ((user as any).status === 'UNCONFIRMED' || (user as any).status === 'ARCHIVED' || (user as any).status === 'COMPROMISED') {
      return {
        hasAccess: false,
        reason: 'Account must be confirmed and active to create assignments',
        code: 'ACCOUNT_INACTIVE'
      };
    }

    // For instructors, perform additional validations
    if (user.isInstructor && !user.isAdmin) {
      const instructorValidation = await validateInstructorPermissions(user, requestId);
      if (!instructorValidation.valid) {
        return {
          hasAccess: false,
          reason: instructorValidation.reason || 'Instructor validation failed',
          code: instructorValidation.code || 'VALIDATION_FAILED',
          restrictions: instructorValidation.restrictions || []
        };
      }
    }

    // Log successful access validation
    console.log(`[${requestId}] Access control passed for user ${user.sub}, role: ${user.isInstructor ? 'instructor' : 'admin'}`);
    
    return { hasAccess: true };

  } catch (error) {
    console.error(`[${requestId}] Error in access control validation:`, error);
    return {
      hasAccess: false,
      reason: 'Error validating access permissions',
      code: 'VALIDATION_ERROR'
    };
  }
}

/**
 * Validate instructor-specific permissions and restrictions
 */
async function validateInstructorPermissions(user: AuthenticatedUser, requestId: string): Promise<{
  valid: boolean;
  reason?: string;
  code?: string;
  restrictions?: string[];
}> {
  try {
    const restrictions: string[] = [];
    
    // Check if instructor has required attributes
    if (!user.instructorId) {
      return {
        valid: false,
        reason: 'Instructor ID not found. Please contact administration.',
        code: 'MISSING_INSTRUCTOR_ID'
      };
    }

    if (!user.department) {
      return {
        valid: false,
        reason: 'Department not assigned. Please contact administration.',
        code: 'MISSING_DEPARTMENT'
      };
    }

    // Check instructor status in the system
    const instructorStatus = await checkInstructorStatus(user.instructorId, requestId);
    if (!instructorStatus.active) {
      return {
        valid: false,
        reason: instructorStatus.reason || 'Instructor account is not active',
        code: 'INSTRUCTOR_INACTIVE'
      };
    }

    // Check if instructor has exceeded assignment creation limits
    const assignmentLimits = await checkAssignmentCreationLimits(user.instructorId, requestId);
    if (!assignmentLimits.withinLimits) {
      restrictions.push(`Monthly assignment limit: ${assignmentLimits.current}/${assignmentLimits.limit}`);
    }

    // Check if instructor has any active courses
    const activeCourses = await checkActiveCourses(user.instructorId, requestId);
    if (activeCourses.count === 0) {
      return {
        valid: false,
        reason: 'No active courses found. You must have at least one active course to create assignments.',
        code: 'NO_ACTIVE_COURSES'
      };
    }

    // Check if instructor has been flagged for review
    const reviewStatus = await checkInstructorReviewStatus(user.instructorId, requestId);
    if (reviewStatus.flagged) {
      restrictions.push(`Account under review: ${reviewStatus.reason}`);
    }

    // If there are restrictions but account is still valid, log them
    if (restrictions.length > 0) {
      console.log(`[${requestId}] Instructor ${user.sub} has restrictions:`, restrictions);
    }

    return {
      valid: true,
      restrictions: restrictions.length > 0 ? restrictions : []
    };

  } catch (error) {
    console.error(`[${requestId}] Error validating instructor permissions:`, error);
    return {
      valid: false,
      reason: 'Error validating instructor permissions',
      code: 'PERMISSION_VALIDATION_ERROR'
    };
  }
}

/**
 * Check instructor status in the system
 */
async function checkInstructorStatus(instructorId: string, requestId: string): Promise<{ active: boolean; reason?: string }> {
  try {
    const result = await dynamodb.get({
      TableName: USERS_TABLE,
      Key: { userId: instructorId }
    }).promise();

    if (!result.Item) {
      return { active: false, reason: 'Instructor not found in system' };
    }

    const instructor = result.Item;
    
    // Check various status indicators
    if (instructor['status'] !== 'CONFIRMED') {
      return { active: false, reason: `Account status: ${instructor['status']}` };
    }

    if (instructor['enabled'] === false) {
      return { active: false, reason: 'Account is disabled' };
    }

    if (instructor['instructorStatus'] === 'SUSPENDED') {
      return { active: false, reason: 'Instructor account is suspended' };
    }

    if (instructor['instructorStatus'] === 'PENDING_APPROVAL') {
      return { active: false, reason: 'Instructor account pending approval' };
    }

    return { active: true };

  } catch (error) {
    console.error(`[${requestId}] Error checking instructor status:`, error);
    return { active: false, reason: 'Error checking instructor status' };
  }
}

/**
 * Check assignment creation limits for instructor
 */
async function checkAssignmentCreationLimits(instructorId: string, requestId: string): Promise<{
  withinLimits: boolean;
  current: number;
  limit: number;
}> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const result = await dynamodb.query({
      TableName: ASSIGNMENTS_TABLE,
      IndexName: 'InstructorCreatedIndex', // You'll need to create this GSI
      KeyConditionExpression: 'instructorId = :instructorId',
      FilterExpression: 'createdAt >= :startOfMonth',
      ExpressionAttributeValues: {
        ':instructorId': instructorId,
        ':startOfMonth': startOfMonth.toISOString()
      }
    }).promise();

    const currentCount = result.Items?.length || 0;
    const monthlyLimit = 50; // Configurable limit
    
    return {
      withinLimits: currentCount < monthlyLimit,
      current: currentCount,
      limit: monthlyLimit
    };

  } catch (error) {
    console.warn(`[${requestId}] Error checking assignment limits, assuming within limits:`, error);
    return { withinLimits: true, current: 0, limit: 50 };
  }
}

/**
 * Check if instructor has active courses
 */
async function checkActiveCourses(instructorId: string, requestId: string): Promise<{ count: number }> {
  try {
    const result = await dynamodb.query({
      TableName: COURSES_TABLE,
      IndexName: 'InstructorStatusIndex', // You'll need to create this GSI
      KeyConditionExpression: 'instructorId = :instructorId',
      FilterExpression: 'status = :status',
      ExpressionAttributeValues: {
        ':instructorId': instructorId,
        ':status': 'active'
      }
    }).promise();

    return { count: result.Items?.length || 0 };

  } catch (error) {
    console.warn(`[${requestId}] Error checking active courses, assuming none:`, error);
    return { count: 0 };
  }
}

/**
 * Check instructor review status
 */
async function checkInstructorReviewStatus(instructorId: string, requestId: string): Promise<{ flagged: boolean; reason?: string }> {
  try {
    const result = await dynamodb.get({
      TableName: USERS_TABLE,
      Key: { userId: instructorId }
    }).promise();

    if (!result.Item) {
      return { flagged: false };
    }

    const instructor = result.Item;
    
    // Check if instructor has been flagged for review
    if (instructor['reviewStatus'] === 'FLAGGED') {
      return { 
        flagged: true, 
        reason: instructor['reviewReason'] || 'Account flagged for administrative review' 
      };
    }

    // Check if instructor has received warnings
    if (instructor['warningCount'] && instructor['warningCount'] > 2) {
      return { 
        flagged: true, 
        reason: `Multiple warnings received (${instructor['warningCount']})` 
      };
    }

    return { flagged: false };

  } catch (error) {
    console.warn(`[${requestId}] Error checking review status, assuming not flagged:`, error);
    return { flagged: false };
  }
}

/**
 * Verify course access for the user
 */
async function verifyCourseAccess(courseId: string, user: AuthenticatedUser): Promise<{ hasAccess: boolean; message?: string }> {
  try {
    // Check if course exists
    const courseResult = await dynamodb.get({
      TableName: COURSES_TABLE,
      Key: { courseId }
    }).promise();

    if (!courseResult.Item) {
      return {
        hasAccess: false,
        message: 'Course not found'
      };
    }

    const course = courseResult.Item;

    // Admin can access all courses
    if (user.isAdmin) {
      return { hasAccess: true };
    }

    // Instructor can only access courses they teach or courses in their department
    if (user.isInstructor) {
      if (course['instructorId'] === user.instructorId || course['department'] === user.department) {
        return { hasAccess: true };
      }
      return {
        hasAccess: false,
        message: 'You can only create assignments for courses you teach or courses in your department'
      };
    }

    return { hasAccess: false, message: 'Access denied' };

  } catch (error) {
    console.error('Error verifying course access:', error);
    return { hasAccess: false, message: 'Error verifying course access' };
  }
}

/**
 * Validate business rules for assignment creation
 */
function validateBusinessRules(data: CreateAssignmentRequest, user: AuthenticatedUser): { valid: boolean; message?: string } {
  // Check if due date is reasonable (not too far in the future)
  const dueDate = new Date(data.dueDate);
  const maxDueDate = new Date();
  maxDueDate.setFullYear(maxDueDate.getFullYear() + 2); // Max 2 years in the future
  
  if (dueDate > maxDueDate) {
    return {
      valid: false,
      message: 'Due date cannot be more than 2 years in the future'
    };
  }

  // Check if start date is not too far in the past
  const startDate = new Date(data.startDate);
  const minStartDate = new Date();
  minStartDate.setFullYear(minStartDate.getFullYear() - 1); // Max 1 year in the past
  
  if (startDate < minStartDate) {
    return {
      valid: false,
      message: 'Start date cannot be more than 1 year in the past'
    };
  }

  // Validate file size limits based on user role
  if (user.isInstructor && !user.isAdmin) {
    if (data.maxFileSize > 1073741824) { // 1GB for instructors
      return {
        valid: false,
        message: 'Instructors can only set maximum file size up to 1GB'
      };
    }
  }

  // Validate points and weight consistency
  if (data.points < data.weight) {
    return {
      valid: false,
      message: 'Points should generally be greater than or equal to weight percentage'
    };
  }

  // Validate that start date is before due date (additional check)
  if (startDate >= dueDate) {
    return {
      valid: false,
      message: 'Start date must be before due date'
    };
  }

  // Validate that due date is not in the past
  const now = new Date();
  if (dueDate <= now) {
    return {
      valid: false,
      message: 'Due date must be in the future'
    };
  }

  // Validate rubric consistency if provided
  if (data.rubric) {
    const totalWeight = data.rubric.criteria.reduce((sum, criteria) => sum + criteria.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      return {
        valid: false,
        message: 'Rubric criteria weights must sum to 100%'
      };
    }

    const totalPoints = data.rubric.criteria.reduce((sum, criteria) => sum + criteria.maxPoints, 0);
    if (Math.abs(totalPoints - data.rubric.totalPoints) > 0.01) {
      return {
        valid: false,
        message: 'Rubric total points must match sum of criteria points'
      };
    }
  }

  // Validate late submission settings
  if (data.allowLateSubmission && data.latePenalty === undefined) {
    return {
      valid: false,
      message: 'Late penalty must be specified when late submission is allowed'
    };
  }

  // Validate file type restrictions
  if (data.allowedFileTypes.length === 0) {
    return {
      valid: false,
      message: 'At least one file type must be allowed'
    };
  }

  // Validate individual vs group submission logic
  if (!data.individualSubmission && data.maxSubmissions > 1) {
    return {
      valid: false,
      message: 'Group submissions should typically allow only 1 submission per group'
    };
  }

  return { valid: true };
}

/**
 * Check for duplicate assignment titles in the same course
 */
async function checkDuplicateAssignment(courseId: string, title: string): Promise<{ exists: boolean; message?: string }> {
  try {
    const result = await dynamodb.query({
      TableName: ASSIGNMENTS_TABLE,
      IndexName: 'CourseTitleIndex', // You'll need to create this GSI
      KeyConditionExpression: 'courseId = :courseId',
      FilterExpression: 'title = :title',
      ExpressionAttributeValues: {
        ':courseId': courseId,
        ':title': title
      }
    }).promise();

    return { exists: (result.Items?.length || 0) > 0 };
  } catch (error) {
    // If the index doesn't exist, fall back to scan (not recommended for production)
    console.warn('CourseTitleIndex not found, falling back to scan for duplicate check');
    
    const result = await dynamodb.scan({
      TableName: ASSIGNMENTS_TABLE,
      FilterExpression: 'courseId = :courseId AND title = :title',
      ExpressionAttributeValues: {
        ':courseId': courseId,
        ':title': title
      }
    }).promise();

    return { exists: (result.Items?.length || 0) > 0 };
  }
}

/**
 * Create assignment in DynamoDB with comprehensive error handling
 */
async function createAssignment(data: CreateAssignmentRequest, user: AuthenticatedUser): Promise<{ success: boolean; data?: any; error?: string }> {
  const requestId = `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] Starting assignment creation process`);
    
    const assignmentId = `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Calculate additional metadata
    const startDate = new Date(data.startDate);
    const dueDate = new Date(data.dueDate);
    const durationDays = Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const assignment = {
      assignmentId,
      courseId: data.courseId,
      instructorId: user.instructorId || user.sub,
      
      // Basic information
      title: data.title,
      description: data.description,
      type: data.type,
      status: 'draft',
      visibility: 'private',
      
      // Grading
      points: data.points,
      weight: data.weight,
      rubric: data.rubric,
      
      // Timing
      startDate: data.startDate,
      dueDate: data.dueDate,
      durationDays,
      allowLateSubmission: data.latePenalty !== undefined ? data.allowLateSubmission : false,
      latePenalty: data.latePenalty || 0,
      
      // Submission requirements
      maxSubmissions: data.maxSubmissions,
      allowedFileTypes: data.allowedFileTypes,
      maxFileSize: data.maxFileSize,
      individualSubmission: data.individualSubmission,
      
      // Features
      autoGrade: data.autoGrade,
      peerReview: data.peerReview,
      
      // Additional details
      requirements: data.requirements,
      instructions: data.instructions,
      attachments: data.attachments || [],
      
      // Metadata
      createdAt: now,
      updatedAt: now,
      createdBy: user.sub,
      department: user.department,
      
      // Statistics (initialized)
      totalSubmissions: 0,
      averageScore: 0,
      completionRate: 0,
      
      // Version tracking
      version: 1,
      isActive: true,
      
      // Search and indexing
      searchableText: `${data.title} ${data.description}`.toLowerCase(),
      tags: generateAssignmentTags(data),
      
      // Audit trail
      lastModifiedBy: user.sub,
      lastModifiedAt: now
    };

    // Add TTL for automatic cleanup (optional)
    const ttlDate = new Date();
    ttlDate.setFullYear(ttlDate.getFullYear() + 5); // 5 years from now
    (assignment as any)['ttl'] = Math.floor(ttlDate.getTime() / 1000);

    // Perform database write operations with error handling
    const writeResult = await performAssignmentWrite(assignment, requestId);
    
    if (!writeResult.success) {
      return {
        success: false,
        error: writeResult.error || 'Write operation failed'
      };
    }

    console.log(`[${requestId}] Assignment created successfully: ${assignmentId}`);
    
    return {
      success: true,
      data: assignment
    };

  } catch (error) {
    console.error(`[${requestId}] Error creating assignment:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Perform DynamoDB write operations with comprehensive error handling
 */
async function performAssignmentWrite(assignment: any, requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[${requestId}] Starting DynamoDB write operations`);
    
    // Primary assignment write
    const primaryWriteResult = await writeAssignmentWithRetry(assignment, requestId);
    if (!primaryWriteResult.success) {
      return primaryWriteResult;
    }

    // Update instructor statistics
    const statsUpdateResult = await updateInstructorStats(assignment.instructorId, requestId);
    if (!statsUpdateResult.success) {
      console.warn(`[${requestId}] Warning: Failed to update instructor stats: ${statsUpdateResult.error}`);
      // Continue execution as this is not critical
    }

    // Update course assignment count
    const courseUpdateResult = await updateCourseAssignmentCount(assignment.courseId, requestId);
    if (!courseUpdateResult.success) {
      console.warn(`[${requestId}] Warning: Failed to update course assignment count: ${courseUpdateResult.error}`);
      // Continue execution as this is not critical
    }

    // Create audit log entry
    const auditResult = await createAuditLog(assignment, requestId);
    if (!auditResult.success) {
      console.warn(`[${requestId}] Warning: Failed to create audit log: ${auditResult.error}`);
      // Continue execution as this is not critical
    }

    console.log(`[${requestId}] All DynamoDB write operations completed successfully`);
    return { success: true };

  } catch (error) {
    console.error(`[${requestId}] Error in DynamoDB write operations:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in write operations'
    };
  }
}

/**
 * Write assignment to DynamoDB with retry logic and error handling
 */
async function writeAssignmentWithRetry(assignment: any, requestId: string, maxRetries: number = 3): Promise<{ success: boolean; error?: string }> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${requestId}] Writing assignment to DynamoDB (attempt ${attempt}/${maxRetries})`);
      
      const putParams = {
        TableName: ASSIGNMENTS_TABLE,
        Item: assignment,
        ConditionExpression: 'attribute_not_exists(assignmentId)',
        ReturnValues: 'NONE'
      };

      await dynamodb.put(putParams).promise();
      
      console.log(`[${requestId}] Assignment written successfully on attempt ${attempt}`);
      return { success: true };

    } catch (error) {
      lastError = error as Error;
      const errorCode = (error as any)?.code;
      
      console.warn(`[${requestId}] DynamoDB write attempt ${attempt} failed:`, {
        errorCode,
        message: error instanceof Error ? error.message : 'Unknown error',
        attempt
      });

      // Handle specific error types
      if (errorCode === 'ConditionalCheckFailedException') {
        // Assignment ID already exists, generate new one
        assignment.assignmentId = `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`[${requestId}] Generated new assignment ID: ${assignment.assignmentId}`);
        continue;
      }

      if (errorCode === 'ProvisionedThroughputExceededException' || 
          errorCode === 'ThrottlingException') {
        // Throttling error, wait and retry
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        console.log(`[${requestId}] Throttling detected, waiting ${waitTime}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      if (errorCode === 'ResourceNotFoundException') {
        // Table doesn't exist
        return {
          success: false,
          error: `DynamoDB table '${ASSIGNMENTS_TABLE}' not found. Please check table configuration.`
        };
      }

      if (errorCode === 'AccessDeniedException') {
        // Permission denied
        return {
          success: false,
          error: 'Access denied to DynamoDB table. Please check IAM permissions.'
        };
      }

      // For other errors, retry if we have attempts left
      if (attempt < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
        console.log(`[${requestId}] Retrying in ${waitTime}ms due to error: ${errorCode}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
    }
  }

  // All retries exhausted
  console.error(`[${requestId}] All ${maxRetries} attempts failed. Last error:`, lastError);
  return {
    success: false,
    error: `Failed to write assignment after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`
  };
}

/**
 * Update instructor statistics after assignment creation
 */
async function updateInstructorStats(instructorId: string, requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[${requestId}] Updating instructor statistics for: ${instructorId}`);
    
    const updateParams = {
      TableName: USERS_TABLE,
      Key: { userId: instructorId },
      UpdateExpression: 'SET #stats.#totalAssignments = if_not_exists(#stats.#totalAssignments, :zero) + :inc, #stats.#lastAssignmentCreated = :now',
      ExpressionAttributeNames: {
        '#stats': 'statistics',
        '#totalAssignments': 'totalAssignments',
        '#lastAssignmentCreated': 'lastAssignmentCreated'
      },
      ExpressionAttributeValues: {
        ':inc': 1,
        ':zero': 0,
        ':now': new Date().toISOString()
      },
      ConditionExpression: 'attribute_exists(userId)',
      ReturnValues: 'UPDATED_NEW'
    };

    await dynamodb.update(updateParams).promise();
    
    console.log(`[${requestId}] Instructor statistics updated successfully`);
    return { success: true };

  } catch (error) {
    const errorCode = (error as any)?.code;
    
    if (errorCode === 'ConditionalCheckFailedException') {
      // User doesn't exist, this is expected for some cases
      console.log(`[${requestId}] Instructor ${instructorId} not found, skipping stats update`);
      return { success: true };
    }

    console.error(`[${requestId}] Error updating instructor statistics:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error updating instructor stats'
    };
  }
}

/**
 * Update course assignment count
 */
async function updateCourseAssignmentCount(courseId: string, requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[${requestId}] Updating course assignment count for: ${courseId}`);
    
    const updateParams = {
      TableName: COURSES_TABLE,
      Key: { courseId },
      UpdateExpression: 'SET #stats.#totalAssignments = if_not_exists(#stats.#totalAssignments, :zero) + :inc, #stats.#lastAssignmentAdded = :now',
      ExpressionAttributeNames: {
        '#stats': 'statistics',
        '#totalAssignments': 'totalAssignments',
        '#lastAssignmentAdded': 'lastAssignmentAdded'
      },
      ExpressionAttributeValues: {
        ':inc': 1,
        ':zero': 0,
        ':now': new Date().toISOString()
      },
      ConditionExpression: 'attribute_exists(courseId)',
      ReturnValues: 'UPDATED_NEW'
    };

    await dynamodb.update(updateParams).promise();
    
    console.log(`[${requestId}] Course assignment count updated successfully`);
    return { success: true };

  } catch (error) {
    const errorCode = (error as any)?.code;
    
    if (errorCode === 'ConditionalCheckFailedException') {
      // Course doesn't exist, this is unexpected but not critical
      console.warn(`[${requestId}] Course ${courseId} not found, skipping assignment count update`);
      return { success: true };
    }

    console.error(`[${requestId}] Error updating course assignment count:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error updating course assignment count'
    };
  }
}

/**
 * Create audit log entry for assignment creation
 */
async function createAuditLog(assignment: any, requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[${requestId}] Creating audit log entry for assignment: ${assignment.assignmentId}`);
    
    const auditEntry = {
      auditId: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action: 'CREATE_ASSIGNMENT',
      resourceType: 'ASSIGNMENT',
      resourceId: assignment.assignmentId,
      userId: assignment.createdBy,
      userRole: 'instructor',
      details: {
        courseId: assignment.courseId,
        title: assignment.title,
        type: assignment.type,
        points: assignment.points,
        department: assignment.department
      },
      ipAddress: 'unknown', // Would be extracted from request context
      userAgent: 'unknown', // Would be extracted from request context
      success: true,
      ttl: Math.floor((Date.now() + (365 * 24 * 60 * 60 * 1000)) / 1000) // 1 year TTL
    };

    const putParams = {
      TableName: process.env['AUDIT_TABLE'] || 'DemoProject-AuditLogs',
      Item: auditEntry
    };

    await dynamodb.put(putParams).promise();
    
    console.log(`[${requestId}] Audit log entry created successfully`);
    return { success: true };

  } catch (error) {
    console.error(`[${requestId}] Error creating audit log entry:`, error);
    // Don't fail the entire operation for audit log issues
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating audit log'
    };
  }
}





/**
 * Generate searchable tags for the assignment
 */
function generateAssignmentTags(data: CreateAssignmentRequest): string[] {
  const tags: string[] = [];
  
  // Add type tag
  tags.push(`type:${data.type}`);
  
  // Add difficulty level based on points
  if (data.points <= 50) tags.push('difficulty:easy');
  else if (data.points <= 100) tags.push('difficulty:medium');
  else tags.push('difficulty:hard');
  
  // Add submission type
  tags.push(data.individualSubmission ? 'submission:individual' : 'submission:group');
  
  // Add grading type
  if (data.autoGrade) tags.push('grading:auto');
  if (data.peerReview) tags.push('grading:peer');
  if (data.rubric) tags.push('grading:rubric');
  
  // Add timing tags
  const dueDate = new Date(data.dueDate);
  const now = new Date();
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDue <= 7) tags.push('timing:urgent');
  else if (daysUntilDue <= 30) tags.push('timing:soon');
  else tags.push('timing:future');
  
  return tags;
}

/**
 * Create success response
 */
function createSuccessResponse(data: any, message?: string) {
  return {
    statusCode: 201,
    body: JSON.stringify({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }
  };
}

/**
 * Create error response
 */
function createErrorResponse(statusCode: number, message: string, details?: any) {
  return {
    statusCode,
    body: JSON.stringify({
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }
  };
}

