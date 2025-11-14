import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { z } from 'zod';
import { verifyJwtToken } from './jwt-verifier';

// Environment variables
const SUBMISSIONS_TABLE = process.env['SUBMISSIONS_TABLE'] || 'submissions';
const ASSIGNMENTS_TABLE = process.env['ASSIGNMENTS_TABLE'] || 'assignments';
const USERS_TABLE = process.env['USERS_TABLE'] || 'users';
const VIDEO_BUCKET = process.env['VIDEO_BUCKET'] || 'video-submissions';

// Initialize DynamoDB client
const dynamodb = new DynamoDB.DocumentClient();

// Input validation schemas
const fetchFeedSchema = z.object({
  assignmentId: z.string().optional(),
  courseId: z.string().optional(),
  status: z.enum(['pending', 'completed', 'failed', 'graded']).optional(),
  statuses: z.array(z.enum(['pending', 'completed', 'failed', 'graded'])).optional(),
  hasGrade: z.boolean().optional(),
  gradeRange: z.object({
    min: z.number().min(0).max(100).optional(),
    max: z.number().min(0).max(100).optional()
  }).optional(),
  submittedAfter: z.string().datetime().optional(),
  submittedBefore: z.string().datetime().optional(),
  page: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      const num = parseInt(val, 10);
      return isNaN(num) ? undefined : num;
    }
    return val;
  }).pipe(z.number().min(1)).optional(),
  limit: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      const num = parseInt(val, 10);
      return isNaN(num) ? undefined : num;
    }
    return val;
  }).pipe(z.number().min(1).max(100)).optional(),
  sortBy: z.enum(['submittedAt', 'grade', 'assignmentTitle', 'studentName']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  includeVideoUrls: z.union([z.boolean(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      return val === 'true' || val === '1';
    }
    return val;
  }).optional(),
  videoUrlExpiry: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      const num = parseInt(val, 10);
      return isNaN(num) ? undefined : num;
    }
    return val;
  }).pipe(z.number().min(300).max(3600)).optional() // 5 minutes to 1 hour
});

const bulkGradeSchema = z.object({
  submissions: z.array(z.object({
    submissionId: z.string(),
    assignmentId: z.string(),
    studentId: z.string(),
    grade: z.number().min(0).max(100),
    feedback: z.string().min(1).max(2000),
    rubricScores: z.array(z.object({
      criterion: z.string().min(1),
      score: z.number().min(0).max(100),
      maxScore: z.number().min(1),
      comments: z.string().optional()
    })).optional(),
    gradingNotes: z.string().max(1000).optional(),
    allowResubmission: z.boolean().optional(),
    resubmissionDeadline: z.string().datetime().optional()
  })).min(1).max(50), // Limit bulk operations to 50 submissions
  gradingNotes: z.string().max(1000).optional() // Common notes for all submissions
});

type FetchFeedParams = z.infer<typeof fetchFeedSchema>;
type BulkGradeParams = z.infer<typeof bulkGradeSchema>;

// Response types
interface SubmissionWithDetails {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  assignmentTitle: string;
  status: string;
  submittedAt: string;
  processedAt?: string;
  grade?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  allowResubmission?: boolean;
  resubmissionDeadline?: string;
  videoUrl?: string;
  videoUrlExpiry?: string;
  metadata?: Record<string, any>;
}

interface InstructorFeedResponse {
  submissions: SubmissionWithDetails[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    pageNumbers: number[];
  };
  filters: {
    applied: Record<string, any>;
    available: {
      statuses: string[];
      gradeRanges: Array<{ min: number; max: number; label: string }>;
      dateRanges: Array<{ label: string; value: string }>;
    };
  };
  summary: {
    totalSubmissions: number;
    pendingGrading: number;
    completedGrading: number;
    averageGrade: number;
    gradeDistribution: Record<string, number>;
  };
}

interface BulkGradeResponse {
  results: Array<{
    submissionId: string;
    success: boolean;
    grade?: number;
    error?: string;
  }>;
  summary: {
    totalProcessed: number;
    successful: number;
    failed: number;
    averageGrade: number;
  };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = `instructor_feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] Starting instructor community feed request`);
    
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

    // Verify user is instructor or admin
    if (user.role !== 'instructor' && user.role !== 'admin') {
      return createErrorResponse(403, 'Only instructors and admins can access the community feed', requestId);
    }

    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        return await handleFetchFeed(event, requestId);
      case 'POST':
        return await handleBulkGrade(event, user, requestId);
      default:
        return createErrorResponse(405, 'Method not allowed', requestId);
    }

  } catch (error) {
    console.error(`[${requestId}] Error in instructor community feed:`, error);
    return createErrorResponse(500, 'Internal server error', requestId);
  }
};

/**
 * Handle fetching the community feed
 */
async function handleFetchFeed(event: any, requestId: string): Promise<any> {
  try {
    // Parse and validate query parameters
    const queryParams = event.queryStringParameters || {};
    const validationResult = fetchFeedSchema.safeParse(queryParams);

    if (!validationResult.success) {
      return createErrorResponse(400, `Invalid parameters: ${validationResult.error.message}`, requestId);
    }

    const params = validationResult.data;
    
    // Build and execute query
    const queryResult = await buildSubmissionQuery(params);
    const submissions = await executeSubmissionQuery(queryResult, requestId);
    
    // Apply filters and sorting
    const filteredSubmissions = applySubmissionFilters(submissions, params);
    const sortedSubmissions = sortSubmissionResults(filteredSubmissions, params);
    
    // Apply pagination
    const paginationResult = applySubmissionPagination(sortedSubmissions, params);
    
    // Enrich submissions with additional details
    const enrichedSubmissions = await enrichSubmissions(paginationResult.items, requestId);
    
    // Generate video URLs if requested
    if (params.includeVideoUrls) {
      await generateTemporaryVideoUrls(enrichedSubmissions, params.videoUrlExpiry || 1800);
    }
    
    // Build response
    const response = await buildFeedResponse(enrichedSubmissions, paginationResult, params);
    
    console.log(`[${requestId}] Successfully fetched ${enrichedSubmissions.length} submissions`);
    
    return createSuccessResponse(response, requestId);

  } catch (error) {
    console.error(`[${requestId}] Error fetching feed:`, error);
    return createErrorResponse(500, 'Failed to fetch community feed', requestId);
  }
}

/**
 * Handle bulk grading operations
 */
async function handleBulkGrade(event: any, user: any, requestId: string): Promise<any> {
  try {
    // Parse and validate request body
    if (!event.body) {
      return createErrorResponse(400, 'Request body is required', requestId);
    }

    let requestBody: any;
    try {
      requestBody = JSON.parse(event.body);
    } catch (error) {
      return createErrorResponse(400, 'Invalid JSON in request body', requestId);
    }

    const validationResult = bulkGradeSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return createErrorResponse(400, `Invalid parameters: ${validationResult.error.message}`, requestId);
    }

    const params = validationResult.data;
    
    // Process bulk grading
    const results = await processBulkGrading(params, user, requestId);
    
    // Calculate summary statistics
    const summary = calculateBulkGradingSummary(results);
    
    const response: BulkGradeResponse = {
      results,
      summary
    };
    
    console.log(`[${requestId}] Successfully processed bulk grading: ${summary.successful}/${summary.totalProcessed} successful`);
    
    return createSuccessResponse(response, requestId);

  } catch (error) {
    console.error(`[${requestId}] Error in bulk grading:`, error);
    return createErrorResponse(500, 'Failed to process bulk grading', requestId);
  }
}

/**
 * Build DynamoDB query for submissions
 */
async function buildSubmissionQuery(params: FetchFeedParams): Promise<any> {
  const queryParams: any = {
    TableName: SUBMISSIONS_TABLE,
    IndexName: 'StatusSubmittedAtIndex', // GSI for status and submission time
    KeyConditionExpression: 'status = :status',
    ExpressionAttributeValues: {
      ':status': params.status || 'completed'
    }
  };

  // Add filters for specific assignments or courses
  if (params.assignmentId) {
    queryParams.FilterExpression = 'assignmentId = :assignmentId';
    queryParams.ExpressionAttributeValues[':assignmentId'] = params.assignmentId;
  }

  if (params.courseId) {
    if (queryParams.FilterExpression) {
      queryParams.FilterExpression += ' AND courseId = :courseId';
    } else {
      queryParams.FilterExpression = 'courseId = :courseId';
    }
    queryParams.ExpressionAttributeValues[':courseId'] = params.courseId;
  }

  // Add date range filters
  if (params.submittedAfter) {
    if (queryParams.FilterExpression) {
      queryParams.FilterExpression += ' AND submittedAt >= :submittedAfter';
    } else {
      queryParams.FilterExpression = 'submittedAt >= :submittedAfter';
    }
    queryParams.ExpressionAttributeValues[':submittedAfter'] = params.submittedAfter;
  }

  if (params.submittedBefore) {
    if (queryParams.FilterExpression) {
      queryParams.FilterExpression += ' AND submittedAt <= :submittedBefore';
    } else {
      queryParams.FilterExpression = 'submittedAt <= :submittedBefore';
    }
    queryParams.ExpressionAttributeValues[':submittedBefore'] = params.submittedBefore;
  }

  return queryParams;
}

/**
 * Execute DynamoDB query
 */
async function executeSubmissionQuery(queryParams: any, requestId: string): Promise<any[]> {
  try {
    const result = await dynamodb.query(queryParams).promise();
    return result.Items || [];
  } catch (error) {
    console.error(`[${requestId}] Error executing query:`, error);
    throw error;
  }
}

/**
 * Apply additional filters to submissions
 */
function applySubmissionFilters(submissions: any[], params: FetchFeedParams): any[] {
  let filtered = submissions;

  // Filter by multiple statuses if specified
  if (params.statuses && params.statuses.length > 0) {
    filtered = filtered.filter(sub => params.statuses!.includes(sub.status));
  }

  // Filter by grade existence
  if (params.hasGrade !== undefined) {
    filtered = filtered.filter(sub => 
      params.hasGrade ? sub.grade !== undefined : sub.grade === undefined
    );
  }

  // Filter by grade range
  if (params.gradeRange) {
    filtered = filtered.filter(sub => {
      if (sub.grade === undefined) return false;
      const grade = sub.grade;
      if (params.gradeRange!.min !== undefined && grade < params.gradeRange!.min) return false;
      if (params.gradeRange!.max !== undefined && grade > params.gradeRange!.max) return false;
      return true;
    });
  }

  return filtered;
}

/**
 * Sort submission results
 */
function sortSubmissionResults(submissions: any[], params: FetchFeedParams): any[] {
  const sortBy = params.sortBy || 'submittedAt';
  const sortOrder = params.sortOrder || 'desc';

  return submissions.sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case 'submittedAt':
        aValue = new Date(a.submittedAt).getTime();
        bValue = new Date(b.submittedAt).getTime();
        break;
      case 'grade':
        aValue = a.grade || 0;
        bValue = b.grade || 0;
        break;
      case 'assignmentTitle':
        aValue = a.assignmentTitle || '';
        bValue = b.assignmentTitle || '';
        break;
      case 'studentName':
        aValue = a.studentName || '';
        bValue = b.studentName || '';
        break;
      default:
        aValue = a[sortBy] || '';
        bValue = b[sortBy] || '';
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });
}

/**
 * Apply pagination to results
 */
function applySubmissionPagination(submissions: any[], params: FetchFeedParams): {
  items: any[];
  pagination: any;
} {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const totalItems = submissions.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const items = submissions.slice(startIndex, endIndex);

  // Generate page numbers for navigation
  const pageNumbers = generatePageNumbers(page, totalPages);

  const pagination = {
    currentPage: page,
    totalPages,
    totalItems,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    pageNumbers,
    limit
  };

  return { items, pagination };
}

/**
 * Generate page numbers for navigation
 */
function generatePageNumbers(currentPage: number, totalPages: number): number[] {
  const pages: number[] = [];
  const maxVisible = 7;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push(-1); // Ellipsis
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1);
      pages.push(-1); // Ellipsis
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push(-1); // Ellipsis
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push(-1); // Ellipsis
      pages.push(totalPages);
    }
  }

  return pages;
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
      
      // Get student details
      const studentDetails = await getStudentDetails(submission.userId, requestId);
      
      // Get course details
      const courseDetails = await getCourseDetails(submission.courseId, requestId);

      const enrichedSubmission: SubmissionWithDetails = {
        submissionId: submission.submissionId,
        assignmentId: submission.assignmentId,
        studentId: submission.userId,
        studentName: studentDetails?.name || 'Unknown Student',
        courseId: submission.courseId,
        courseName: courseDetails?.name || 'Unknown Course',
        assignmentTitle: assignmentDetails?.title || 'Unknown Assignment',
        status: submission.status,
        submittedAt: submission.submittedAt,
        processedAt: submission.processedAt,
        grade: submission.grade,
        feedback: submission.feedback,
        gradedBy: submission.gradedBy,
        gradedAt: submission.gradedAt,
        allowResubmission: submission.allowResubmission,
        resubmissionDeadline: submission.resubmissionDeadline,
        metadata: submission.metadata
      };

      enriched.push(enrichedSubmission);
    } catch (error) {
      console.error(`[${requestId}] Error enriching submission ${submission.submissionId}:`, error);
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
    console.error(`[${requestId}] Error getting assignment details:`, error);
    return null;
  }
}

/**
 * Get student details
 */
async function getStudentDetails(studentId: string, requestId: string): Promise<any> {
  try {
    const result = await dynamodb.get({
      TableName: USERS_TABLE,
      Key: { userId: studentId }
    }).promise();
    
    return result.Item;
  } catch (error) {
    console.error(`[${requestId}] Error getting student details:`, error);
    return null;
  }
}

/**
 * Get course details
 */
async function getCourseDetails(courseId: string, requestId: string): Promise<any> {
  try {
    // This would typically query a courses table
    // For now, return basic info
    return { name: courseId };
  } catch (error) {
    console.error(`[${requestId}] Error getting course details:`, error);
    return null;
  }
}

/**
 * Generate temporary video URLs
 */
async function generateTemporaryVideoUrls(submissions: SubmissionWithDetails[], expirySeconds: number): Promise<void> {
  // This would typically use AWS SDK S3 to generate presigned URLs
  // For now, we'll add placeholder URLs
  for (const submission of submissions) {
    if (submission.metadata?.['s3Key']) {
      submission.videoUrl = `https://${VIDEO_BUCKET}.s3.amazonaws.com/${submission.metadata['s3Key']}`;
      submission.videoUrlExpiry = new Date(Date.now() + expirySeconds * 1000).toISOString();
    }
  }
}

/**
 * Build the complete feed response
 */
async function buildFeedResponse(
  submissions: SubmissionWithDetails[], 
  paginationResult: any, 
  params: FetchFeedParams
): Promise<InstructorFeedResponse> {
  // Calculate summary statistics
  const summary = calculateFeedSummary(submissions);
  
  // Build available filters
  const availableFilters = buildAvailableFilters();
  
  // Build applied filters
  const appliedFilters = buildAppliedFilters(params);

  return {
    submissions,
    pagination: paginationResult.pagination,
    filters: {
      applied: appliedFilters,
      available: availableFilters
    },
    summary
  };
}

/**
 * Calculate feed summary statistics
 */
function calculateFeedSummary(submissions: SubmissionWithDetails[]): any {
  const totalSubmissions = submissions.length;
  const pendingGrading = submissions.filter(s => s.status === 'completed' && !s.grade).length;
  const completedGrading = submissions.filter(s => s.grade !== undefined).length;
  
  const gradedSubmissions = submissions.filter(s => s.grade !== undefined);
  const averageGrade = gradedSubmissions.length > 0 
    ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
    : 0;

  // Grade distribution
  const gradeDistribution: Record<string, number> = {
    'A (90-100)': 0,
    'B (80-89)': 0,
    'C (70-79)': 0,
    'D (60-69)': 0,
    'F (0-59)': 0
  };

  for (const submission of gradedSubmissions) {
    const grade = submission.grade || 0;
    if (grade >= 90) gradeDistribution['A (90-100)'] = (gradeDistribution['A (90-100)'] || 0) + 1;
    else if (grade >= 80) gradeDistribution['B (80-89)'] = (gradeDistribution['B (80-89)'] || 0) + 1;
    else if (grade >= 70) gradeDistribution['C (70-79)'] = (gradeDistribution['C (70-79)'] || 0) + 1;
    else if (grade >= 60) gradeDistribution['D (60-69)'] = (gradeDistribution['D (60-69)'] || 0) + 1;
    else gradeDistribution['F (0-59)'] = (gradeDistribution['F (0-59)'] || 0) + 1;
  }

  return {
    totalSubmissions,
    pendingGrading,
    completedGrading,
    averageGrade: Math.round(averageGrade * 100) / 100,
    gradeDistribution
  };
}

/**
 * Build available filters
 */
function buildAvailableFilters(): any {
  return {
    statuses: ['pending', 'completed', 'failed', 'graded'],
    gradeRanges: [
      { min: 90, max: 100, label: 'A (90-100)' },
      { min: 80, max: 89, label: 'B (80-89)' },
      { min: 70, max: 79, label: 'C (70-79)' },
      { min: 60, max: 69, label: 'D (60-69)' },
      { min: 0, max: 59, label: 'F (0-59)' }
    ],
    dateRanges: [
      { label: 'Last 24 hours', value: '24h' },
      { label: 'Last 7 days', value: '7d' },
      { label: 'Last 30 days', value: '30d' },
      { label: 'This semester', value: 'semester' }
    ]
  };
}

/**
 * Build applied filters
 */
function buildAppliedFilters(params: FetchFeedParams): Record<string, any> {
  const applied: Record<string, any> = {};
  
  if (params['assignmentId']) applied['assignmentId'] = params['assignmentId'];
  if (params['courseId']) applied['courseId'] = params['courseId'];
  if (params['status']) applied['status'] = params['status'];
  if (params['statuses']) applied['statuses'] = params['statuses'];
  if (params['hasGrade'] !== undefined) applied['hasGrade'] = params['hasGrade'];
  if (params['gradeRange']) applied['gradeRange'] = params['gradeRange'];
  if (params['submittedAfter']) applied['submittedAfter'] = params['submittedAfter'];
  if (params['submittedBefore']) applied['submittedBefore'] = params['submittedBefore'];
  if (params['sortBy']) applied['sortBy'] = params['sortBy'];
  if (params['sortOrder']) applied['sortOrder'] = params['sortOrder'];
  if (params['includeVideoUrls'] !== undefined) applied['includeVideoUrls'] = params['includeVideoUrls'];
  if (params['videoUrlExpiry']) applied['videoUrlExpiry'] = params['videoUrlExpiry'];

  return applied;
}

/**
 * Process bulk grading operations
 */
async function processBulkGrading(params: BulkGradeParams, user: any, requestId: string): Promise<Array<{
  submissionId: string;
  success: boolean;
  grade?: number;
  error?: string;
}>> {
  const results: Array<{
    submissionId: string;
    success: boolean;
    grade?: number;
    error?: string;
  }> = [];

  for (const submission of params.submissions) {
    try {
      // Validate submission exists and can be graded
      const existingSubmission = await getSubmission(submission.assignmentId, submission.studentId, requestId);
      
      if (!existingSubmission) {
        results.push({
          submissionId: submission.submissionId,
          success: false,
          error: 'Submission not found'
        });
        continue;
      }

      if (existingSubmission.status !== 'completed') {
        results.push({
          submissionId: submission.submissionId,
          success: false,
          error: `Submission status '${existingSubmission.status}' is not gradable`
        });
        continue;
      }

      if (existingSubmission.grade !== undefined) {
        results.push({
          submissionId: submission.submissionId,
          success: false,
          error: 'Submission has already been graded'
        });
        continue;
      }

      // Update submission with grade
      const updateResult = await updateSubmissionGrade(submission, user, requestId);
      
      if (updateResult.success) {
        results.push({
          submissionId: submission.submissionId,
          success: true,
          grade: submission.grade
        });
      } else {
        results.push({
          submissionId: submission.submissionId,
          success: false,
          error: updateResult.error || 'Failed to update submission'
        });
      }

    } catch (error) {
      console.error(`[${requestId}] Error processing submission ${submission.submissionId}:`, error);
      results.push({
        submissionId: submission.submissionId,
        success: false,
        error: 'Internal error processing submission'
      });
    }
  }

  return results;
}

/**
 * Get submission details
 */
async function getSubmission(assignmentId: string, studentId: string, requestId: string): Promise<any> {
  try {
    const result = await dynamodb.get({
      TableName: SUBMISSIONS_TABLE,
      Key: {
        assignmentId,
        userId: studentId
      }
    }).promise();
    
    return result.Item;
  } catch (error) {
    console.error(`[${requestId}] Error getting submission:`, error);
    return null;
  }
}

/**
 * Update submission with grade
 */
async function updateSubmissionGrade(submission: any, user: any, requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const updateParams: any = {
      TableName: SUBMISSIONS_TABLE,
      Key: {
        assignmentId: submission.assignmentId,
        userId: submission.studentId
      },
      UpdateExpression: 'SET grade = :grade, feedback = :feedback, gradedAt = :gradedAt, gradedBy = :gradedBy, lastModified = :lastModified',
      ExpressionAttributeValues: {
        ':grade': submission.grade,
        ':feedback': submission.feedback,
        ':gradedAt': new Date().toISOString(),
        ':gradedBy': user.sub,
        ':lastModified': new Date().toISOString()
      },
      ConditionExpression: 'attribute_not_exists(grade)'
    };

    // Add optional fields
    if (submission.rubricScores) {
      updateParams.UpdateExpression += ', rubricScores = :rubricScores';
      updateParams.ExpressionAttributeValues[':rubricScores'] = submission.rubricScores;
    }

    if (submission.gradingNotes) {
      updateParams.UpdateExpression += ', gradingNotes = :gradingNotes';
      updateParams.ExpressionAttributeValues[':gradingNotes'] = submission.gradingNotes;
    }

    if (submission.allowResubmission !== undefined) {
      updateParams.UpdateExpression += ', allowResubmission = :allowResubmission';
      updateParams.ExpressionAttributeValues[':allowResubmission'] = submission.allowResubmission;
    }

    if (submission.resubmissionDeadline) {
      updateParams.UpdateExpression += ', resubmissionDeadline = :resubmissionDeadline';
      updateParams.ExpressionAttributeValues[':resubmissionDeadline'] = submission.resubmissionDeadline;
    }

    await dynamodb.update(updateParams).promise();
    
    return { success: true };
  } catch (error) {
    console.error(`[${requestId}] Error updating submission grade:`, error);
    return { success: false, error: 'Failed to update submission grade' };
  }
}

/**
 * Calculate bulk grading summary
 */
function calculateBulkGradingSummary(results: Array<{ success: boolean; grade?: number }>): {
  totalProcessed: number;
  successful: number;
  failed: number;
  averageGrade: number;
} {
  const totalProcessed = results.length;
  const successful = results.filter(r => r.success).length;
  const failed = totalProcessed - successful;
  
  const successfulGrades = results.filter(r => r.success && r.grade !== undefined).map(r => r.grade!);
  const averageGrade = successfulGrades.length > 0 
    ? successfulGrades.reduce((sum, grade) => sum + grade, 0) / successfulGrades.length
    : 0;

  return {
    totalProcessed,
    successful,
    failed,
    averageGrade: Math.round(averageGrade * 100) / 100
  };
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
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
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
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
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
