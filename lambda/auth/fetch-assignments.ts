import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { z } from 'zod';
import { verifyJwtToken, AuthenticatedUser } from './jwt-verifier';

const dynamodb = new DynamoDB.DocumentClient();

// Environment variables
const ASSIGNMENTS_TABLE = process.env['ASSIGNMENTS_TABLE'] || 'DemoProject-Assignments';
const COURSES_TABLE = process.env['COURSES_TABLE'] || 'DemoProject-Courses';

// Query parameter validation schema
const fetchAssignmentsSchema = z.object({
  courseId: z.string().optional(),
  instructorId: z.string().optional(),
  status: z.enum(['draft', 'published', 'active', 'completed', 'archived']).optional(),
  statuses: z.array(z.enum(['draft', 'published', 'active', 'completed', 'archived'])).optional(),
  type: z.enum(['essay', 'quiz', 'project', 'presentation', 'lab', 'discussion', 'other']).optional(),
  dueDateFrom: z.string().optional(),
  dueDateTo: z.string().optional(),
  weekNumber: z.number().int().min(1).max(53).optional(),
  weekStart: z.string().optional(), // ISO date for week start
  weekEnd: z.string().optional(),   // ISO date for week end
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  submissionType: z.enum(['individual', 'group']).optional(),
  gradingType: z.enum(['auto', 'peer', 'rubric', 'manual']).optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['dueDate', 'createdAt', 'title', 'points', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().min(1).max(10000).optional(), // Reasonable upper limit
  limit: z.number().int().min(1).max(100).optional(), // Max 100 items per page for performance
  cursor: z.string().optional(), // Cursor for cursor-based pagination
  paginationType: z.enum(['offset', 'cursor']).optional(), // Pagination strategy
  includeStats: z.boolean().optional(),
  includeSubmissions: z.boolean().optional()
});

type FetchAssignmentsRequest = z.infer<typeof fetchAssignmentsSchema>;

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] Starting assignment fetch request`);
    
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

    // Parse and validate query parameters
    const queryParams = event.queryStringParameters || {};
    const validationResult = fetchAssignmentsSchema.safeParse({
      ...queryParams,
      page: queryParams['page'] ? parseInt(queryParams['page']) : undefined,
      limit: queryParams['limit'] ? parseInt(queryParams['limit']) : undefined,
      weekNumber: queryParams['weekNumber'] ? parseInt(queryParams['weekNumber']) : undefined,
      includeStats: queryParams['includeStats'] === 'true',
      includeSubmissions: queryParams['includeSubmissions'] === 'true',
      tags: queryParams['tags'] ? queryParams['tags'].split(',') : undefined,
      statuses: queryParams['statuses'] ? queryParams['statuses'].split(',') : undefined
    });

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      console.warn(`[${requestId}] Query parameter validation failed:`, errors);
      return createErrorResponse(400, 'Invalid query parameters', {
        errors,
        message: 'Please check your query parameters and try again',
        requestId
      });
    }

    const fetchParams = validationResult.data;
    console.log(`[${requestId}] Query parameters validated, starting assignment fetch`);

    // Validate access permissions
    const accessValidation = await validateFetchAccess(user, fetchParams, requestId);
    if (!accessValidation.hasAccess) {
      console.warn(`[${requestId}] Access denied for user ${user.sub}: ${accessValidation.reason}`);
      return createErrorResponse(403, 'Forbidden', {
        error: accessValidation.reason || 'Access denied',
        code: accessValidation.code,
        requestId
      });
    }

    // Fetch assignments with filtering and pagination
    const assignmentsResult = await fetchAssignments(fetchParams, user, requestId);
    if (!assignmentsResult.success) {
      console.error(`[${requestId}] Failed to fetch assignments:`, assignmentsResult.error);
      return createErrorResponse(500, 'Failed to fetch assignments', {
        error: assignmentsResult.error,
        requestId
      });
    }

    if (!assignmentsResult.data) {
      console.error(`[${requestId}] No data returned from fetchAssignments`);
      return createErrorResponse(500, 'No data returned from assignment fetch', {
        error: 'Internal data error',
        requestId
      });
    }

    console.log(`[${requestId}] Successfully fetched ${assignmentsResult.data.assignments.length} assignments`);

    // Return success response
    return createSuccessResponse({
      assignments: assignmentsResult.data.assignments,
      pagination: assignmentsResult.data.pagination,
      filters: assignmentsResult.data.filters,
      totalCount: assignmentsResult.data.totalCount,
      cursors: assignmentsResult.data.cursors,
      requestId
    }, 'Assignments retrieved successfully');

  } catch (error) {
    console.error(`[${requestId}] Fetch assignments handler error:`, error);
    return createErrorResponse(500, 'Internal server error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};

/**
 * Validate user access to fetch assignments
 */
async function validateFetchAccess(user: AuthenticatedUser, params: FetchAssignmentsRequest, requestId: string): Promise<{
  hasAccess: boolean;
  reason?: string;
  code?: string;
}> {
  try {
    // Students can only fetch assignments for courses they're enrolled in
    if (!user.isInstructor && !user.isAdmin) {
      if (params.courseId) {
        const enrollmentCheck = await checkStudentEnrollment(params.courseId, user.sub, requestId);
        if (!enrollmentCheck.isEnrolled) {
          return {
            hasAccess: false,
            reason: 'You are not enrolled in this course',
            code: 'NOT_ENROLLED'
          };
        }
      } else {
        // Students must specify a course ID
        return {
          hasAccess: false,
          reason: 'Course ID is required for student access',
          code: 'COURSE_ID_REQUIRED'
        };
      }
    }

    // Instructors can only fetch assignments for their courses or department
    if (user.isInstructor && !user.isAdmin) {
      if (params.courseId) {
        const courseAccess = await checkInstructorCourseAccess(params.courseId, user, requestId);
        if (!courseAccess.hasAccess) {
          return {
            hasAccess: false,
            reason: courseAccess.reason || 'Access denied to this course',
            code: 'COURSE_ACCESS_DENIED'
          };
        }
      }
      
      // If instructorId is specified, it must match the user's ID
      if (params.instructorId && params.instructorId !== user.instructorId) {
        return {
          hasAccess: false,
          reason: 'You can only view your own assignments',
          code: 'INSTRUCTOR_MISMATCH'
        };
      }
    }

    // Admins have full access
    if (user.isAdmin) {
      return { hasAccess: true };
    }

    return { hasAccess: true };

  } catch (error) {
    console.error(`[${requestId}] Error validating fetch access:`, error);
    return {
      hasAccess: false,
      reason: 'Error validating access permissions',
      code: 'VALIDATION_ERROR'
    };
  }
}

/**
 * Check if student is enrolled in a course
 */
async function checkStudentEnrollment(_courseId: string, _studentId: string, requestId: string): Promise<{ isEnrolled: boolean }> {
  try {
    // This would typically query an enrollments table
    // For now, we'll assume students have access to courses they can see
    // In a real implementation, you'd check against an enrollments table
    return { isEnrolled: true };
  } catch (error) {
    console.error(`[${requestId}] Error checking student enrollment:`, error);
    return { isEnrolled: false };
  }
}

/**
 * Check if instructor has access to a course
 */
async function checkInstructorCourseAccess(courseId: string, user: AuthenticatedUser, requestId: string): Promise<{
  hasAccess: boolean;
  reason?: string;
}> {
  try {
    const result = await dynamodb.get({
      TableName: COURSES_TABLE,
      Key: { courseId }
    }).promise();

    if (!result.Item) {
      return { hasAccess: false, reason: 'Course not found' };
    }

    const course = result.Item;
    
    // Instructor can access if they teach the course or it's in their department
    if (course['instructorId'] === user.instructorId || course['department'] === user.department) {
      return { hasAccess: true };
    }

    return { hasAccess: false, reason: 'You do not have access to this course' };

  } catch (error) {
    console.error(`[${requestId}] Error checking instructor course access:`, error);
    return { hasAccess: false, reason: 'Error checking course access' };
  }
}

/**
 * Fetch assignments with comprehensive filtering and pagination
 */
async function fetchAssignments(params: FetchAssignmentsRequest, user: AuthenticatedUser, requestId: string): Promise<{
  success: boolean;
  data?: {
    assignments: any[];
    pagination: any;
    filters: any;
    totalCount: number;
    cursors?: any;
  };
  error?: string;
}> {
  try {
    console.log(`[${requestId}] Building DynamoDB query with params:`, params);

    // Build query parameters
    const queryParams = buildQueryParams(params, user);
    
    // Execute query
    const queryResult = await executeAssignmentQuery(queryParams, requestId);
    if (!queryResult.success) {
      return {
        success: false,
        error: queryResult.error || 'Query execution failed'
      };
    }

    if (!queryResult.data) {
      return {
        success: false,
        error: 'No data returned from query execution'
      };
    }

    // Apply additional filtering and sorting
    let filteredAssignments = applyFilters(queryResult.data.assignments, params);
    const totalCount = filteredAssignments.length;

    // Apply sorting
    filteredAssignments = applySorting(filteredAssignments, params);

    // Apply pagination
    const pagination = buildPagination(params, totalCount);
    const paginatedAssignments = applyPagination(filteredAssignments, pagination, params);

    // Enrich assignments with additional data if requested
    if (params.includeStats || params.includeSubmissions) {
      await enrichAssignments(paginatedAssignments, params, requestId);
    }

    console.log(`[${requestId}] Query completed: ${totalCount} total, ${paginatedAssignments.length} returned`);

    // Generate cursors for cursor-based pagination if requested
    let cursors = null;
    if (params.paginationType === 'cursor' && paginatedAssignments.length > 0) {
      cursors = generateCursors(paginatedAssignments, pagination);
    }
    
    return {
      success: true,
      data: {
        assignments: paginatedAssignments,
        pagination,
        filters: buildFilterSummary(params),
        totalCount,
        cursors
      }
    };

  } catch (error) {
    console.error(`[${requestId}] Error fetching assignments:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error fetching assignments'
    };
  }
}

/**
 * Build DynamoDB query parameters
 */
function buildQueryParams(params: FetchAssignmentsRequest, user: AuthenticatedUser): any {
  const queryParams: any = {
    TableName: ASSIGNMENTS_TABLE,
    ScanIndexForward: params.sortOrder === 'asc'
  };

  // Build key condition expression
  let keyConditionExpression = '';
  const expressionAttributeNames: any = {};
  const expressionAttributeValues: any = {};

  // If courseId is specified, use CourseStatusIndex
  if (params.courseId) {
    queryParams.IndexName = 'CourseStatusIndex';
    keyConditionExpression = 'courseId = :courseId';
    expressionAttributeNames['#courseId'] = 'courseId';
    expressionAttributeValues[':courseId'] = params.courseId;
    
    if (params.status) {
      keyConditionExpression += ' AND #status = :status';
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = params.status;
    }
  }
  // If instructorId is specified, use InstructorCreatedIndex
  else if (params.instructorId) {
    queryParams.IndexName = 'InstructorCreatedIndex';
    keyConditionExpression = 'instructorId = :instructorId';
    expressionAttributeNames['#instructorId'] = 'instructorId';
    expressionAttributeValues[':instructorId'] = params.instructorId;
  }
  // Default to scan with filters
  else {
    // For students, only show published/active assignments
    if (!user.isInstructor && !user.isAdmin) {
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = 'published';
      queryParams.FilterExpression = '#status = :status';
    }
  }

  if (keyConditionExpression) {
    queryParams.KeyConditionExpression = keyConditionExpression;
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
 * Execute DynamoDB query with error handling
 */
async function executeAssignmentQuery(queryParams: any, requestId: string): Promise<{
  success: boolean;
  data?: { assignments: any[] };
  error?: string;
}> {
  try {
    console.log(`[${requestId}] Executing DynamoDB query:`, JSON.stringify(queryParams, null, 2));

    let allAssignments: any[] = [];
    let lastEvaluatedKey: any = undefined;

    do {
      if (lastEvaluatedKey) {
        queryParams.ExclusiveStartKey = lastEvaluatedKey;
      }

      const result = await dynamodb.query(queryParams).promise();
      
      if (result.Items) {
        allAssignments.push(...result.Items);
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
      
          // Safety check to prevent infinite loops and memory issues
    if (allAssignments.length > 10000) {
      console.warn(`[${requestId}] Query result limit reached, stopping at ${allAssignments.length} items`);
      break;
    }
    
    // Performance optimization: if we have enough items for pagination, we can stop early
    // This is especially useful when user requests a specific page with a reasonable limit
    if (queryParams.limit && allAssignments.length >= queryParams.limit * 3) {
      console.log(`[${requestId}] Early termination: sufficient items collected for pagination`);
      break;
    }

    } while (lastEvaluatedKey);

    console.log(`[${requestId}] Query returned ${allAssignments.length} items`);

    return {
      success: true,
      data: { assignments: allAssignments }
    };

  } catch (error) {
    console.error(`[${requestId}] DynamoDB query error:`, error);
    
    const errorCode = (error as any)?.code;
    if (errorCode === 'ResourceNotFoundException') {
      return {
        success: false,
        error: `DynamoDB table '${ASSIGNMENTS_TABLE}' not found`
      };
    }
    
    if (errorCode === 'AccessDeniedException') {
      return {
        success: false,
        error: 'Access denied to DynamoDB table'
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown DynamoDB error'
    };
  }
}

/**
 * Apply additional filters to assignments
 */
function applyFilters(assignments: any[], params: FetchAssignmentsRequest): any[] {
  return assignments.filter(assignment => {
    // Status filter - support both single status and multiple statuses
    if (params.statuses && params.statuses.length > 0) {
      if (!params.statuses.includes(assignment.status)) {
        return false;
      }
    } else if (params.status && assignment.status !== params.status) {
      return false;
    }

    // Type filter
    if (params.type && assignment.type !== params.type) {
      return false;
    }

    // Week number filter
    if (params.weekNumber) {
      const dueDate = new Date(assignment.dueDate);
      const currentYear = new Date().getFullYear();
      if (!isDateInWeek(dueDate, params.weekNumber, currentYear)) {
        return false;
      }
    }

    // Week start/end filter (alternative to week number)
    if (params.weekStart || params.weekEnd) {
      const dueDate = new Date(assignment.dueDate);
      if (params.weekStart && dueDate < new Date(params.weekStart)) {
        return false;
      }
      if (params.weekEnd && dueDate > new Date(params.weekEnd)) {
        return false;
      }
    }

    // Due date range filter
    if (params.dueDateFrom || params.dueDateTo) {
      const dueDate = new Date(assignment.dueDate);
      if (params.dueDateFrom && dueDate < new Date(params.dueDateFrom)) {
        return false;
      }
      if (params.dueDateTo && dueDate > new Date(params.dueDateTo)) {
        return false;
      }
    }

    // Difficulty filter
    if (params.difficulty) {
      const assignmentDifficulty = getAssignmentDifficulty(assignment.points);
      if (assignmentDifficulty !== params.difficulty) {
        return false;
      }
    }

    // Submission type filter
    if (params.submissionType) {
      const assignmentSubmissionType = assignment.individualSubmission ? 'individual' : 'group';
      if (assignmentSubmissionType !== params.submissionType) {
        return false;
      }
    }

    // Grading type filter
    if (params.gradingType) {
      const assignmentGradingType = getAssignmentGradingType(assignment);
      if (assignmentGradingType !== params.gradingType) {
        return false;
      }
    }

    // Tags filter
    if (params.tags && params.tags.length > 0) {
      const assignmentTags = assignment.tags || [];
      const hasMatchingTag = params.tags.some(tag => 
        assignmentTags.some((assignmentTag: string) => 
          assignmentTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Search filter
    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      const searchableText = assignment.searchableText || '';
      const title = assignment.title || '';
      const description = assignment.description || '';
      
      if (!searchableText.includes(searchTerm) && 
          !title.toLowerCase().includes(searchTerm) && 
          !description.toLowerCase().includes(searchTerm)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get assignment difficulty based on points
 */
function getAssignmentDifficulty(points: number): string {
  if (points <= 50) return 'easy';
  if (points <= 100) return 'medium';
  return 'hard';
}

/**
 * Get assignment grading type
 */
function getAssignmentGradingType(assignment: any): string {
  if (assignment.autoGrade) return 'auto';
  if (assignment.peerReview) return 'peer';
  if (assignment.rubric) return 'rubric';
  return 'manual';
}



/**
 * Get week number for a given date
 */
export function getWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const week1 = target.valueOf();
  const weekNumber = 1 + Math.ceil((firstThursday - week1) / 604800000);
  
  // Handle year boundary cases
  if (weekNumber > 52) {
    // Check if this date should actually be in week 1 of next year
    const nextYearStart = new Date(target.getFullYear() + 1, 0, 1);
    const nextYearFirstThursday = new Date(nextYearStart);
    while (nextYearFirstThursday.getDay() !== 4) {
      nextYearFirstThursday.setDate(nextYearFirstThursday.getDate() + 1);
    }
    const nextYearWeek1 = new Date(nextYearFirstThursday);
    nextYearWeek1.setDate(nextYearFirstThursday.getDate() - 3);
    
    if (date >= nextYearWeek1) {
      return 1; // This date belongs to week 1 of next year
    }
  }
  
  return weekNumber;
}

/**
 * Get week start and end dates for a given week number and year
 */
export function getWeekDates(weekNumber: number, year: number): { weekStart: Date; weekEnd: Date } {
  // Find the first Thursday of the year
  const firstThursday = new Date(year, 0, 1);
  while (firstThursday.getDay() !== 4) {
    firstThursday.setDate(firstThursday.getDate() + 1);
  }
  
  // Calculate the first week start (Monday before first Thursday)
  const firstWeekStart = new Date(firstThursday);
  firstWeekStart.setDate(firstThursday.getDate() - 3);
  
  // Calculate the target week start
  const weekStart = new Date(firstWeekStart);
  weekStart.setDate(firstWeekStart.getDate() + (weekNumber - 1) * 7);
  
  // Calculate the target week end (6 days after start)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  // Ensure we're setting the time correctly to avoid day boundary issues
  weekStart.setHours(0, 0, 0, 0);
  
  return { weekStart, weekEnd };
}

/**
 * Check if a date falls within a specific week
 */
export function isDateInWeek(date: Date, weekNumber: number, year: number): boolean {
  const { weekStart, weekEnd } = getWeekDates(weekNumber, year);
  return date >= weekStart && date <= weekEnd;
}

/**
 * Apply sorting to assignments
 */
function applySorting(assignments: any[], params: FetchAssignmentsRequest): any[] {
  const sortBy = params.sortBy || 'dueDate';
  const sortOrder = params.sortOrder || 'asc';

  return assignments.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'dueDate':
        aValue = new Date(a.dueDate).getTime();
        bValue = new Date(b.dueDate).getTime();
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'title':
        aValue = a.title?.toLowerCase() || '';
        bValue = b.title?.toLowerCase() || '';
        break;
      case 'points':
        aValue = a.points || 0;
        bValue = b.points || 0;
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
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
 * Build pagination object with enhanced features
 */
function buildPagination(params: FetchAssignmentsRequest, totalCount: number): any {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  
  // Ensure page is within valid range
  const currentPage = Math.min(page, totalPages);
  
  // Calculate page boundaries for better navigation
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalCount);
  
  // Generate page numbers for navigation (show up to 5 pages around current)
  const pageNumbers = generatePageNumbers(currentPage, totalPages);
  
  return {
    currentPage,
    pageSize: limit,
    totalPages,
    totalCount,
    startItem: totalCount > 0 ? startItem : 0,
    endItem: totalCount > 0 ? endItem : 0,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    previousPage: currentPage > 1 ? currentPage - 1 : null,
    pageNumbers,
    firstPage: 1,
    lastPage: totalPages,
    // Performance metrics
    itemsPerPage: limit,
    totalItems: totalCount,
    // Navigation helpers
    canGoToFirst: currentPage > 1,
    canGoToLast: currentPage < totalPages,
    // Page range info
    showingItems: totalCount > 0 ? `${startItem}-${endItem} of ${totalCount}` : '0 items'
  };
}

/**
 * Generate page numbers for navigation display
 * Shows up to 5 pages around the current page for better UX
 */
function generatePageNumbers(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 1) return [1];
  
  const pageNumbers: number[] = [];
  const maxVisiblePages = 5;
  
  if (totalPages <= maxVisiblePages) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    // Show pages around current page
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
  }
  
  return pageNumbers;
}

/**
 * Apply pagination to assignments
 * Supports both offset-based and cursor-based pagination
 */
function applyPagination(assignments: any[], pagination: any, params?: FetchAssignmentsRequest): any[] {
  // If cursor-based pagination is requested, we need to handle it differently
  if (params?.paginationType === 'cursor') {
    return applyCursorPagination(assignments, pagination, params);
  }
  
  // Default offset-based pagination
  const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  
  return assignments.slice(startIndex, endIndex);
}

/**
 * Generate cursors for cursor-based pagination
 */
function generateCursors(assignments: any[], pagination: any): any {
  if (assignments.length === 0) return null;
  
  const firstItem = assignments[0];
  const lastItem = assignments[assignments.length - 1];
  
  return {
    first: Buffer.from(JSON.stringify({
      itemId: firstItem.assignmentId,
      timestamp: firstItem.createdAt
    })).toString('base64'),
    last: Buffer.from(JSON.stringify({
      itemId: lastItem.assignmentId,
      timestamp: lastItem.createdAt
    })).toString('base64'),
    next: pagination.hasNextPage ? Buffer.from(JSON.stringify({
      itemId: lastItem.assignmentId,
      timestamp: lastItem.createdAt
    })).toString('base64') : null,
    previous: pagination.hasPreviousPage ? Buffer.from(JSON.stringify({
      itemId: firstItem.assignmentId,
      timestamp: firstItem.createdAt
    })).toString('base64') : null
  };
}

/**
 * Apply cursor-based pagination for better performance with large datasets
 */
function applyCursorPagination(assignments: any[], pagination: any, params: FetchAssignmentsRequest): any[] {
  if (!params.cursor) {
    // First page: return first N items
    return assignments.slice(0, pagination.pageSize);
  }
  
  // Find the cursor position and return next N items
  try {
    const cursorData = JSON.parse(Buffer.from(params.cursor, 'base64').toString());
    const { lastItemId, lastItemTimestamp } = cursorData;
    
    // Find the position after the cursor
    let startIndex = 0;
    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments[i];
      if (assignment.assignmentId === lastItemId && 
          assignment.createdAt === lastItemTimestamp) {
        startIndex = i + 1;
        break;
      }
    }
    
    return assignments.slice(startIndex, startIndex + pagination.pageSize);
  } catch (error) {
    console.warn('Invalid cursor format, falling back to first page');
    return assignments.slice(0, pagination.pageSize);
  }
}

/**
 * Enrich assignments with additional data
 */
async function enrichAssignments(assignments: any[], params: FetchAssignmentsRequest, requestId: string): Promise<void> {
  try {
    console.log(`[${requestId}] Enriching ${assignments.length} assignments`);

    for (const assignment of assignments) {
      // Add statistics if requested
      if (params.includeStats) {
        assignment.statistics = await getAssignmentStatistics(assignment.assignmentId, requestId);
      }

      // Add submission information if requested
      if (params.includeSubmissions) {
        assignment.submissionInfo = await getSubmissionInfo(assignment.assignmentId, requestId);
      }

      // Add course information
      assignment.courseInfo = await getCourseInfo(assignment.courseId, requestId);
    }

    console.log(`[${requestId}] Assignment enrichment completed`);

  } catch (error) {
    console.error(`[${requestId}] Error enriching assignments:`, error);
    // Don't fail the entire operation for enrichment errors
  }
}

/**
 * Get assignment statistics
 */
async function getAssignmentStatistics(_assignmentId: string, requestId: string): Promise<any> {
  try {
    // This would typically query a submissions table
    // For now, return mock data
    return {
      totalSubmissions: Math.floor(Math.random() * 50),
      averageScore: Math.floor(Math.random() * 100),
      completionRate: Math.floor(Math.random() * 100),
      onTimeSubmissions: Math.floor(Math.random() * 40),
      lateSubmissions: Math.floor(Math.random() * 10)
    };
  } catch (error) {
    console.error(`[${requestId}] Error getting assignment statistics:`, error);
    return null;
  }
}

/**
 * Get submission information
 */
async function getSubmissionInfo(_assignmentId: string, requestId: string): Promise<any> {
  try {
    // This would typically query a submissions table
    // For now, return mock data
    return {
      submissionCount: Math.floor(Math.random() * 50),
      lastSubmissionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      gradingStatus: ['pending', 'in_progress', 'completed'][Math.floor(Math.random() * 3)]
    };
  } catch (error) {
    console.error(`[${requestId}] Error getting submission info:`, error);
    return null;
  }
}

/**
 * Get course information
 */
async function getCourseInfo(courseId: string, requestId: string): Promise<any> {
  try {
    const result = await dynamodb.get({
      TableName: COURSES_TABLE,
      Key: { courseId }
    }).promise();

    if (result.Item) {
      return {
        courseId: result.Item['courseId'],
        courseName: result.Item['courseName'],
        department: result.Item['department'],
        instructorName: result.Item['instructorName']
      };
    }

    return null;
  } catch (error) {
    console.error(`[${requestId}] Error getting course info:`, error);
    return null;
  }
}

/**
 * Build filter summary for response
 */
function buildFilterSummary(params: FetchAssignmentsRequest): any {
  const filters: any = {};
  
  if (params.courseId) filters.courseId = params.courseId;
  if (params.instructorId) filters.instructorId = params.instructorId;
  if (params.status) filters.status = params.status;
  if (params.statuses) filters.statuses = params.statuses;
  if (params.type) filters.type = params.type;
  if (params.weekNumber) filters.weekNumber = params.weekNumber;
  if (params.weekStart) filters.weekStart = params.weekStart;
  if (params.weekEnd) filters.weekEnd = params.weekEnd;
  if (params.dueDateFrom) filters.dueDateFrom = params.dueDateFrom;
  if (params.dueDateTo) filters.dueDateTo = params.dueDateTo;
  if (params.difficulty) filters.difficulty = params.difficulty;
  if (params.submissionType) filters.submissionType = params.submissionType;
  if (params.gradingType) filters.gradingType = params.gradingType;
  if (params.tags) filters.tags = params.tags;
  if (params.search) filters.search = params.search;
  if (params.sortBy) filters.sortBy = params.sortBy;
  if (params.sortOrder) filters.sortOrder = params.sortOrder;
  if (params.paginationType) filters.paginationType = params.paginationType;
  if (params.cursor) filters.cursor = params.cursor;

  return filters;
}

/**
 * Create success response
 */
function createSuccessResponse(data: any, message?: string) {
  return {
    statusCode: 200,
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
      'Access-Control-Allow-Methods': 'GET,OPTIONS'
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
      'Access-Control-Allow-Methods': 'GET,OPTIONS'
    }
  };
}
