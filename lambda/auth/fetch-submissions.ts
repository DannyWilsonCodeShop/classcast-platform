import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { z } from 'zod';
import { verifyJwtToken } from './jwt-verifier';

// Environment variables
const SUBMISSIONS_TABLE = process.env['SUBMISSIONS_TABLE'] || 'submissions';
const ASSIGNMENTS_TABLE = process.env['ASSIGNMENTS_TABLE'] || 'assignments';
const USERS_TABLE = process.env['USERS_TABLE'] || 'users';
const VIDEO_BUCKET = process.env['VIDEO_BUCKET'] || 'demo-project-videos';

// Initialize DynamoDB client
const dynamodb = new DynamoDB.DocumentClient();

// Input validation schema
const fetchSubmissionsSchema = z.object({
  studentId: z.string().optional(),
  assignmentId: z.string().optional(),
  courseId: z.string().optional(),
  status: z.enum(['uploading', 'processing', 'completed', 'failed', 'rejected']).optional(),
  statuses: z.array(z.enum(['uploading', 'processing', 'completed', 'failed', 'rejected'])).optional(),
  hasGrade: z.boolean().optional(),
  gradeRange: z.object({
    min: z.number().min(0).max(100).optional(),
    max: z.number().min(0).max(100).optional()
  }).optional(),
  submittedAfter: z.string().datetime().optional(),
  submittedBefore: z.string().datetime().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['submittedAt', 'grade', 'status', 'assignmentTitle']).default('submittedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeVideoUrls: z.boolean().default(false),
  videoUrlExpiry: z.number().min(300).max(3600).default(900) // 15 minutes default
});

type FetchSubmissionsParams = z.infer<typeof fetchSubmissionsSchema>;

// Response types
interface SubmissionWithDetails {
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  studentId: string;
  studentName: string;
  status: string;
  submittedAt: string;
  processedAt?: string;
  grade?: number;
  feedback?: string;
  videoUrl?: string;
  videoUrlExpiry?: string;
  thumbnailUrls?: string[];
  videoDuration?: number;
  videoResolution?: { width: number; height: number };
  processingDuration?: number;
  errorMessage?: string;
  retryCount: number;
  metadata: Record<string, any>;
}

interface FetchSubmissionsResponse {
  submissions: SubmissionWithDetails[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    applied: Record<string, any>;
    summary: string;
  };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = `fetch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] Starting submission retrieval`);
    
    // Verify JWT token and get user info
    const authHeader = event.headers['Authorization'] || event.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse(401, 'Missing or invalid authorization header', requestId);
    }

    const jwtResult = await verifyJwtToken(event);
    
    if (!jwtResult.success || !jwtResult.user) {
      return createErrorResponse(jwtResult.statusCode || 401, jwtResult.error || 'Invalid or expired token', requestId);
    }
    
    const user = jwtResult.user;

    // Parse and validate query parameters
    const queryParams = event.queryStringParameters || {};
    const validationResult = fetchSubmissionsSchema.safeParse({
      ...queryParams,
      page: queryParams['page'] ? parseInt(queryParams['page']) : 1,
      limit: queryParams['limit'] ? parseInt(queryParams['limit']) : 20,
      hasGrade: queryParams['hasGrade'] ? queryParams['hasGrade'] === 'true' : undefined,
      includeVideoUrls: queryParams['includeVideoUrls'] ? queryParams['includeVideoUrls'] === 'true' : undefined,
      videoUrlExpiry: queryParams['videoUrlExpiry'] ? parseInt(queryParams['videoUrlExpiry']) : 900,
      gradeRange: queryParams['gradeRange'] ? JSON.parse(queryParams['gradeRange']) : undefined,
      statuses: queryParams['statuses'] ? queryParams['statuses'].split(',') : undefined
    });

    if (!validationResult.success) {
      return createErrorResponse(400, `Invalid parameters: ${validationResult.error.message}`, requestId);
    }

    const params = validationResult.data;
    
    // Validate user access
    const accessValidation = await validateUserAccess(user, params, requestId);
    if (!accessValidation.isValid) {
      return createErrorResponse(403, accessValidation.reason || 'Access denied', requestId);
    }

    // Build query parameters
    const dbQueryParams = buildSubmissionQuery(params);
    
    // Execute query
    const queryResult = await executeSubmissionQuery(dbQueryParams, requestId);
    
    // Apply additional filtering
    const filteredResults = applySubmissionFilters(queryResult.Items || [], requestId);
    
    // Sort results
    const sortedResults = sortSubmissionResults(filteredResults, params);
    
    // Apply pagination
    const paginatedResults = applySubmissionPagination(sortedResults, params, requestId);
    
    // Enrich submissions with additional details
    const enrichedSubmissions = await enrichSubmissions(paginatedResults, requestId);
    
    // Generate temporary video URLs if requested
    if (params.includeVideoUrls) {
      await generateTemporaryVideoUrls(enrichedSubmissions, params.videoUrlExpiry, requestId);
    }
    
    // Build response
    const response = buildSubmissionResponse(enrichedSubmissions, params, queryResult.Count || 0);
    
    console.log(`[${requestId}] Successfully retrieved ${enrichedSubmissions.length} submissions`);
    
    return createSuccessResponse(response, requestId);

  } catch (error) {
    console.error(`[${requestId}] Error retrieving submissions:`, error);
    return createErrorResponse(500, 'Internal server error', requestId);
  }
};

/**
 * Validate user access to submissions
 */
async function validateUserAccess(user: any, params: FetchSubmissionsParams, requestId: string): Promise<{
  isValid: boolean;
  reason?: string;
}> {
  try {
    // Students can only access their own submissions
    if (user.role === 'student') {
      if (params.studentId && params.studentId !== user.sub) {
        return {
          isValid: false,
          reason: 'Students can only access their own submissions'
        };
      }
      // Force studentId to be the current user
      params.studentId = user.sub;
    }
    
    // Instructors can access submissions for their courses
    if (user.role === 'instructor') {
      if (params.courseId) {
        const hasCourseAccess = await checkInstructorCourseAccess(user.sub, params.courseId, requestId);
        if (!hasCourseAccess) {
          return {
            isValid: false,
            reason: 'Instructor does not have access to this course'
          };
        }
      }
    }
    
    // Admins have full access
    if (user.role === 'admin') {
      return { isValid: true };
    }
    
    return { isValid: true };
    
  } catch (error) {
    console.error(`[${requestId}] Error validating user access:`, error);
    return {
      isValid: false,
      reason: 'Error validating user access'
    };
  }
}

/**
 * Check if instructor has access to a specific course
 */
async function checkInstructorCourseAccess(instructorId: string, courseId: string, requestId: string): Promise<boolean> {
  try {
    const result = await dynamodb.query({
      TableName: ASSIGNMENTS_TABLE,
      IndexName: 'CourseInstructorIndex',
      KeyConditionExpression: 'courseId = :courseId AND instructorId = :instructorId',
      ExpressionAttributeValues: {
        ':courseId': courseId,
        ':instructorId': instructorId
      },
      Limit: 1
    }).promise();
    
    return Boolean(result.Items && result.Items.length > 0);
    
  } catch (error) {
    console.error(`[${requestId}] Error checking instructor course access:`, error);
    return false;
  }
}

/**
 * Build DynamoDB query parameters
 */
function buildSubmissionQuery(params: FetchSubmissionsParams): any {
  const queryParams: any = {
    TableName: SUBMISSIONS_TABLE,
    IndexName: 'AssignmentUserIndex'
  };
  
  // Build key condition expression
  let keyConditionExpression = '';
  const expressionAttributeValues: any = {};
  const expressionAttributeNames: any = {};
  
  if (params.assignmentId) {
    keyConditionExpression = 'assignmentId = :assignmentId';
    expressionAttributeValues[':assignmentId'] = params.assignmentId;
  }
  
  if (params.studentId) {
    if (keyConditionExpression) {
      keyConditionExpression += ' AND userId = :userId';
    } else {
      keyConditionExpression = 'userId = :userId';
    }
    expressionAttributeValues[':userId'] = params.studentId;
  }
  
  if (keyConditionExpression) {
    queryParams.KeyConditionExpression = keyConditionExpression;
  }
  
  // Add filter expressions
  const filterExpressions: string[] = [];
  
  if (params.status) {
    filterExpressions.push('#status = :status');
    expressionAttributeNames['#status'] = 'status';
    expressionAttributeValues[':status'] = params.status;
  }
  
  if (params.statuses && params.statuses.length > 0) {
    filterExpressions.push('#status IN (:statuses)');
    expressionAttributeNames['#status'] = 'status';
    expressionAttributeValues[':statuses'] = params.statuses;
  }
  
  if (params.courseId) {
    filterExpressions.push('courseId = :courseId');
    expressionAttributeValues[':courseId'] = params.courseId;
  }
  
  if (params.hasGrade !== undefined) {
    if (params.hasGrade) {
      filterExpressions.push('attribute_exists(grade)');
    } else {
      filterExpressions.push('attribute_not_exists(grade)');
    }
  }
  
  if (params.gradeRange) {
    if (params.gradeRange.min !== undefined) {
      filterExpressions.push('#grade >= :minGrade');
      expressionAttributeNames['#grade'] = 'grade';
      expressionAttributeValues[':minGrade'] = params.gradeRange.min;
    }
    if (params.gradeRange.max !== undefined) {
      filterExpressions.push('#grade <= :maxGrade');
      expressionAttributeNames['#grade'] = 'grade';
      expressionAttributeValues[':maxGrade'] = params.gradeRange.max;
    }
  }
  
  if (params.submittedAfter) {
    filterExpressions.push('#submittedAt >= :submittedAfter');
    expressionAttributeNames['#submittedAt'] = 'submittedAt';
    expressionAttributeValues[':submittedAfter'] = params.submittedAfter;
  }
  
  if (params.submittedBefore) {
    filterExpressions.push('#submittedAt <= :submittedBefore');
    expressionAttributeNames['#submittedAt'] = 'submittedAt';
    expressionAttributeValues[':submittedBefore'] = params.submittedBefore;
  }
  
  if (filterExpressions.length > 0) {
    queryParams.FilterExpression = filterExpressions.join(' AND ');
  }
  
  if (Object.keys(expressionAttributeNames).length > 0) {
    queryParams.ExpressionAttributeNames = expressionAttributeNames;
  }
  
  if (Object.keys(expressionAttributeValues).length > 0) {
    queryParams.ExpressionAttributeValues = expressionAttributeValues;
  }
  
  return queryParams;
}

/**
 * Execute the submission query
 */
async function executeSubmissionQuery(queryParams: any, requestId: string): Promise<any> {
  try {
    console.log(`[${requestId}] Executing query with params:`, JSON.stringify(queryParams, null, 2));
    
    const result = await dynamodb.query(queryParams).promise();
    
    console.log(`[${requestId}] Query returned ${result.Count || 0} items`);
    
    return result;
    
  } catch (error) {
    console.error(`[${requestId}] Error executing submission query:`, error);
    throw error;
  }
}

/**
 * Apply additional filtering to query results
 */
function applySubmissionFilters(submissions: any[], requestId: string): any[] {
  let filtered = submissions;
  
  // Text search functionality removed - not in current schema
  
  console.log(`[${requestId}] Applied filters, ${filtered.length} submissions remaining`);
  
  return filtered;
}

/**
 * Sort submission results
 */
function sortSubmissionResults(submissions: any[], params: FetchSubmissionsParams): any[] {
  const sorted = [...submissions];
  
  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (params.sortBy) {
      case 'submittedAt':
        aValue = new Date(a.submittedAt || 0);
        bValue = new Date(b.submittedAt || 0);
        break;
      case 'grade':
        aValue = a.grade || 0;
        bValue = b.grade || 0;
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      case 'assignmentTitle':
        aValue = a.assignmentTitle || '';
        bValue = b.assignmentTitle || '';
        break;
      default:
        aValue = new Date(a.submittedAt || 0);
        bValue = new Date(b.submittedAt || 0);
    }
    
    if (params.sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });
  
  return sorted;
}

/**
 * Apply pagination to results
 */
function applySubmissionPagination(submissions: any[], params: FetchSubmissionsParams, requestId: string): any[] {
  const startIndex = (params.page - 1) * params.limit;
  const endIndex = startIndex + params.limit;
  
  const paginated = submissions.slice(startIndex, endIndex);
  
  console.log(`[${requestId}] Applied pagination: page ${params.page}, showing ${paginated.length} of ${submissions.length} total`);
  
  return paginated;
}

/**
 * Enrich submissions with additional details
 */
async function enrichSubmissions(submissions: any[], requestId: string): Promise<SubmissionWithDetails[]> {
  const enriched: SubmissionWithDetails[] = [];
  
  for (const submission of submissions) {
    try {
      // Get assignment details
      const assignmentDetails = await getAssignmentDetails(submission.assignmentId, requestId);
      
      // Get course details
      const courseDetails = await getCourseDetails(submission.courseId, requestId);
      
      // Get student details
      const studentDetails = await getStudentDetails(submission.userId, requestId);
      
      const enrichedSubmission: SubmissionWithDetails = {
        submissionId: submission.submissionId || `${submission.assignmentId}_${submission.userId}`,
        assignmentId: submission.assignmentId,
        assignmentTitle: assignmentDetails?.title || 'Unknown Assignment',
        courseId: submission.courseId,
        courseName: courseDetails?.name || 'Unknown Course',
        studentId: submission.userId,
        studentName: studentDetails?.name || 'Unknown Student',
        status: submission.status,
        submittedAt: submission.submittedAt,
        processedAt: submission.processedAt,
        grade: submission.grade,
        feedback: submission.feedback,
        thumbnailUrls: submission.thumbnailUrls,
        videoDuration: submission.videoDuration,
        videoResolution: submission.videoResolution,
        processingDuration: submission.processingDuration,
        errorMessage: submission.errorMessage,
        retryCount: submission.retryCount || 0,
        metadata: submission.metadata || {}
      };
      
      enriched.push(enrichedSubmission);
      
    } catch (error) {
      console.error(`[${requestId}] Error enriching submission ${submission.assignmentId}_${submission.userId}:`, error);
      // Continue with other submissions
    }
  }
  
  return enriched;
}

/**
 * Get assignment details
 */
async function getAssignmentDetails(assignmentId: string, requestId: string): Promise<any> {
  try {
    const result = await dynamodb.get({
      TableName: ASSIGNMENTS_TABLE,
      Key: { assignmentId }
    }).promise();
    
    return result.Item;
    
  } catch (error) {
    console.error(`[${requestId}] Error getting assignment details for ${assignmentId}:`, error);
    return null;
  }
}

/**
 * Get course details
 */
async function getCourseDetails(courseId: string, requestId: string): Promise<any> {
  try {
    // This would typically query a courses table
    // For now, return a mock course name based on the ID
    return { name: `Course ${courseId}` };
    
  } catch (error) {
    console.error(`[${requestId}] Error getting course details for ${courseId}:`, error);
    return null;
  }
}

/**
 * Get student details
 */
async function getStudentDetails(userId: string, requestId: string): Promise<any> {
  try {
    const result = await dynamodb.get({
      TableName: USERS_TABLE,
      Key: { userId }
    }).promise();
    
    return result.Item;
    
  } catch (error) {
    console.error(`[${requestId}] Error getting student details for ${userId}:`, error);
    return null;
  }
}

/**
 * Generate temporary video URLs for submissions
 */
async function generateTemporaryVideoUrls(submissions: SubmissionWithDetails[], expirySeconds: number, requestId: string): Promise<void> {
  const { S3 } = require('aws-sdk');
  const s3 = new S3();
  
  for (const submission of submissions) {
    try {
      if (submission.status === 'completed' && submission.metadata?.['s3Key']) {
        const videoUrl = await s3.getSignedUrlPromise('getObject', {
          Bucket: VIDEO_BUCKET,
          Key: submission.metadata['s3Key'],
          Expires: expirySeconds
        });
        
        submission.videoUrl = videoUrl;
        submission.videoUrlExpiry = new Date(Date.now() + expirySeconds * 1000).toISOString();
        
        console.log(`[${requestId}] Generated temporary URL for submission ${submission.submissionId}, expires in ${expirySeconds}s`);
      }
    } catch (error) {
      console.error(`[${requestId}] Error generating video URL for submission ${submission.submissionId}:`, error);
      // Continue with other submissions
    }
  }
}

/**
 * Build the final response
 */
function buildSubmissionResponse(
  submissions: SubmissionWithDetails[], 
  params: FetchSubmissionsParams, 
  totalCount: number
): FetchSubmissionsResponse {
  const totalPages = Math.ceil(totalCount / params.limit);
  
  return {
    submissions,
    pagination: {
      currentPage: params.page,
      totalPages,
      totalItems: totalCount,
      itemsPerPage: params.limit,
      hasNextPage: params.page < totalPages,
      hasPreviousPage: params.page > 1
    },
    filters: {
      applied: {
        studentId: params.studentId,
        assignmentId: params.assignmentId,
        courseId: params.courseId,
        status: params.status,
        statuses: params.statuses,
        hasGrade: params.hasGrade,
        gradeRange: params.gradeRange,
        submittedAfter: params.submittedAfter,
        submittedBefore: params.submittedBefore,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder
      },
      summary: buildFilterSummary(params)
    }
  };
}

/**
 * Build a human-readable filter summary
 */
function buildFilterSummary(params: FetchSubmissionsParams): string {
  const filters: string[] = [];
  
  if (params.studentId) filters.push(`Student: ${params.studentId}`);
  if (params.assignmentId) filters.push(`Assignment: ${params.assignmentId}`);
  if (params.courseId) filters.push(`Course: ${params.courseId}`);
  if (params.status) filters.push(`Status: ${params.status}`);
  if (params.statuses) filters.push(`Statuses: ${params.statuses.join(', ')}`);
  if (params.hasGrade !== undefined) filters.push(`Has Grade: ${params.hasGrade}`);
  if (params.gradeRange) {
    const range = [];
    if (params.gradeRange.min !== undefined) range.push(`≥${params.gradeRange.min}`);
    if (params.gradeRange.max !== undefined) range.push(`≤${params.gradeRange.max}`);
    if (range.length > 0) filters.push(`Grade Range: ${range.join(' ')}`);
  }
  if (params.submittedAfter) filters.push(`Submitted After: ${params.submittedAfter}`);
  if (params.submittedBefore) filters.push(`Submitted Before: ${params.submittedBefore}`);
  
  return filters.length > 0 ? filters.join(' | ') : 'No filters applied';
}

/**
 * Create success response
 */
function createSuccessResponse(data: any, requestId: string) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      data,
      requestId,
      timestamp: new Date().toISOString()
    })
  };
}

/**
 * Create error response
 */
function createErrorResponse(statusCode: number, message: string, requestId: string) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,OPTIONS'
    },
    body: JSON.stringify({
      success: false,
      error: {
        message,
        code: statusCode
      },
      requestId,
      timestamp: new Date().toISOString()
    })
  };
}
