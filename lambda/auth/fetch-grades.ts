import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { z } from 'zod';
import { verifyJwtToken } from './jwt-verifier';

// Environment variables
const SUBMISSIONS_TABLE = process.env['SUBMISSIONS_TABLE'] || 'submissions';
const ASSIGNMENTS_TABLE = process.env['ASSIGNMENTS_TABLE'] || 'assignments';
const COURSES_TABLE = process.env['COURSES_TABLE'] || 'courses';

// Initialize DynamoDB client
const dynamodb = new DynamoDB.DocumentClient();

// Input validation schema
const fetchGradesSchema = z.object({
  // Basic filters
  studentId: z.string().optional(),
  assignmentId: z.string().optional(),
  courseId: z.string().optional(),
  
  // Date range filters
  gradedAfter: z.string().datetime().optional(),
  gradedBefore: z.string().datetime().optional(),
  submittedAfter: z.string().datetime().optional(),
  submittedBefore: z.string().datetime().optional(),
  
  // Grade range filters
  minGrade: z.number().min(0).max(100).optional(),
  maxGrade: z.number().min(0).max(100).optional(),
  gradeRange: z.enum(['excellent', 'good', 'average', 'below_average', 'failing']).optional(),
  
  // Status and feedback filters
  hasFeedback: z.boolean().optional(),
  hasRubricScores: z.boolean().optional(),
  allowResubmission: z.boolean().optional(),
  
  // Search filters
  searchTerm: z.string().max(100).optional(),
  
  // Pagination
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  
  // Sorting
  sortBy: z.enum(['grade', 'gradedAt', 'submittedAt', 'assignmentTitle', 'courseName', 'instructorName']).default('gradedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // Aggregation options
  includeAggregates: z.boolean().default(false),
  groupBy: z.enum(['course', 'assignment', 'instructor', 'week']).optional(),
  
  // Response options
  includeAssignmentDetails: z.boolean().default(true),
  includeCourseDetails: z.boolean().default(true),
  includeInstructorDetails: z.boolean().default(false)
});

type FetchGradesParams = z.infer<typeof fetchGradesSchema>;

// Response types
interface GradeRecord {
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  studentId: string;
  studentName?: string;
  grade: number;
  feedback: string;
  gradedAt: string;
  gradedBy: string;
  instructorName?: string;
  submittedAt: string;
  allowResubmission: boolean;
  resubmissionDeadline?: string;
  rubricScores?: Array<{
    criterion: string;
    score: number;
    maxScore: number;
    comments?: string;
  }>;
  totalRubricScore?: number;
  maxRubricScore?: number;
  gradingNotes?: string;
}

interface GradeAggregates {
  totalSubmissions: number;
  averageGrade: number;
  gradeDistribution: {
    excellent: number;    // 90-100
    good: number;         // 80-89
    average: number;      // 70-79
    below_average: number; // 60-69
    failing: number;      // 0-59
  };
  courseBreakdown?: Array<{
    courseId: string;
    courseName: string;
    count: number;
    averageGrade: number;
  }>;
  assignmentBreakdown?: Array<{
    assignmentId: string;
    assignmentTitle: string;
    count: number;
    averageGrade: number;
  }>;
  weeklyBreakdown?: Array<{
    weekNumber: number;
    weekStart: string;
    weekEnd: string;
    count: number;
    averageGrade: number;
  }>;
}

interface FetchGradesResponse {
  grades: GradeRecord[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
  };
  aggregates?: GradeAggregates;
  filters: {
    applied: Record<string, any>;
    available: {
      courses: Array<{ id: string; name: string }>;
      assignments: Array<{ id: string; title: string; courseId: string }>;
      instructors: Array<{ id: string; name: string }>;
    };
  };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = `fetch_grades_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] Starting grade retrieval`);
    
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
    const validationResult = fetchGradesSchema.safeParse(queryParams);

    if (!validationResult.success) {
      return createErrorResponse(400, `Invalid parameters: ${validationResult.error.message}`, requestId);
    }

    const params = validationResult.data;
    
    // Validate user access and permissions
    const accessValidation = await validateGradeAccess(user, params, requestId);
    if (!accessValidation.isValid) {
      return createErrorResponse(403, accessValidation.reason || 'Access denied', requestId);
    }

    // Build and execute the query
    const queryResult = await executeGradeQuery(user, params, requestId);
    
    if (!queryResult.success) {
      return createErrorResponse(500, queryResult.error || 'Failed to fetch grades', requestId);
    }

    // Apply additional filters
    const filteredGrades = applyGradeFilters(queryResult.grades || [], params, requestId);
    
    // Sort results
    const sortedGrades = sortGradeResults(filteredGrades, params.sortBy, params.sortOrder);
    
    // Apply pagination
    const paginatedResult = applyGradePagination(sortedGrades, params.page, params.limit);
    
    // Enrich with additional details
    const enrichedGrades = await enrichGradeData(paginatedResult.grades, params, requestId);
    
    // Calculate aggregates if requested
    let aggregates: GradeAggregates | undefined;
    if (params.includeAggregates) {
      aggregates = calculateGradeAggregates(filteredGrades, params.groupBy);
    }
    
    // Build available filters
    const availableFilters = await buildAvailableFilters(user, params, requestId);
    
    // Build response
    const response: FetchGradesResponse = {
      grades: enrichedGrades,
      pagination: {
        currentPage: params.page,
        totalPages: Math.ceil(paginatedResult.totalItems / params.limit),
        totalItems: paginatedResult.totalItems,
        hasNextPage: params.page < Math.ceil(paginatedResult.totalItems / params.limit),
        hasPreviousPage: params.page > 1
      },
      filters: {
        applied: params,
        available: availableFilters
      }
    };

    // Add aggregates only if they exist
    if (aggregates) {
      response.aggregates = aggregates;
    }

    console.log(`[${requestId}] Successfully retrieved ${enrichedGrades.length} grades`);
    
    return createSuccessResponse(response, requestId);

  } catch (error) {
    console.error(`[${requestId}] Error retrieving grades:`, error);
    return createErrorResponse(500, 'Internal server error', requestId);
  }
};

/**
 * Validate user access for grade retrieval
 */
async function validateGradeAccess(user: any, params: FetchGradesParams, requestId: string): Promise<{
  isValid: boolean;
  reason?: string;
}> {
  try {
    // Students can only view their own grades
    if (user.role === 'student') {
      if (params.studentId && params.studentId !== user.sub) {
        return {
          isValid: false,
          reason: 'Students can only view their own grades'
        };
      }
      // Force studentId to be the current user
      params.studentId = user.sub;
    }
    
    // Instructors can view grades for their assignments/courses
    if (user.role === 'instructor') {
      // If no specific filters, limit to instructor's assignments
      if (!params.assignmentId && !params.courseId) {
        // This will be handled in the query building
      }
    }
    
    // Admins have full access
    if (user.role === 'admin') {
      return { isValid: true };
    }
    
    return { isValid: true };
    
  } catch (error) {
    console.error(`[${requestId}] Error validating grade access:`, error);
    return {
      isValid: false,
      reason: 'Error validating access'
    };
  }
}

/**
 * Execute the main grade query
 */
async function executeGradeQuery(user: any, params: FetchGradesParams, requestId: string): Promise<{
  success: boolean;
  grades?: any[];
  error?: string;
}> {
  try {
    const queryParams: any = {
      TableName: SUBMISSIONS_TABLE,
      IndexName: 'GradeIndex', // Assuming a GSI on grade-related fields
      KeyConditionExpression: 'gradeStatus = :gradeStatus',
      ExpressionAttributeValues: {
        ':gradeStatus': 'graded'
      },
      FilterExpression: 'attribute_exists(grade)',
      ProjectionExpression: 'assignmentId, userId, courseId, grade, feedback, gradedAt, gradedBy, submittedAt, allowResubmission, resubmissionDeadline, rubricScores, totalRubricScore, maxRubricScore, gradingNotes'
    };

    // Add role-based filtering
    if (user.role === 'student') {
      queryParams.FilterExpression += ' AND userId = :userId';
      queryParams.ExpressionAttributeValues[':userId'] = user.sub;
    } else if (user.role === 'instructor') {
      // For instructors, we'll need to join with assignments to filter by instructor
      // This is a simplified approach - in production, you might want a different index
      queryParams.FilterExpression += ' AND courseId IN (:courseIds)';
      const instructorCourses = await getInstructorCourses(user.sub, requestId);
      queryParams.ExpressionAttributeValues[':courseIds'] = instructorCourses;
    }

    // Add specific filters
    if (params.studentId) {
      queryParams.FilterExpression += ' AND userId = :studentId';
      queryParams.ExpressionAttributeValues[':studentId'] = params.studentId;
    }
    
    if (params.assignmentId) {
      queryParams.FilterExpression += ' AND assignmentId = :assignmentId';
      queryParams.ExpressionAttributeValues[':assignmentId'] = params.assignmentId;
    }
    
    if (params.courseId) {
      queryParams.FilterExpression += ' AND courseId = :courseId';
      queryParams.ExpressionAttributeValues[':courseId'] = params.courseId;
    }

    // Execute query
    const result = await dynamodb.query(queryParams).promise();
    
    return {
      success: true,
      grades: result.Items || []
    };
    
  } catch (error) {
    console.error(`[${requestId}] Error executing grade query:`, error);
    return {
      success: false,
      error: 'Failed to execute grade query'
    };
  }
}

/**
 * Get courses for an instructor
 */
async function getInstructorCourses(instructorId: string, requestId: string): Promise<string[]> {
  try {
    const result = await dynamodb.query({
      TableName: COURSES_TABLE,
      IndexName: 'InstructorIndex',
      KeyConditionExpression: 'instructorId = :instructorId',
      ExpressionAttributeValues: {
        ':instructorId': instructorId
      },
      ProjectionExpression: 'courseId'
    }).promise();
    
    return (result.Items || []).map(item => item['courseId']);
  } catch (error) {
    console.error(`[${requestId}] Error getting instructor courses:`, error);
    return [];
  }
}

/**
 * Apply additional filters to grades
 */
function applyGradeFilters(grades: any[], params: FetchGradesParams, requestId: string): any[] {
  try {
    let filteredGrades = [...grades];

    // Date range filters
    if (params.gradedAfter) {
      const gradedAfterDate = new Date(params.gradedAfter);
      filteredGrades = filteredGrades.filter(grade => 
        new Date(grade.gradedAt) >= gradedAfterDate
      );
    }
    
    if (params.gradedBefore) {
      const gradedBeforeDate = new Date(params.gradedBefore);
      filteredGrades = filteredGrades.filter(grade => 
        new Date(grade.gradedAt) <= gradedBeforeDate
      );
    }
    
    if (params.submittedAfter) {
      const submittedAfterDate = new Date(params.submittedAfter);
      filteredGrades = filteredGrades.filter(grade => 
        new Date(grade.submittedAt) >= submittedAfterDate
      );
    }
    
    if (params.submittedBefore) {
      const submittedBeforeDate = new Date(params.submittedBefore);
      filteredGrades = filteredGrades.filter(grade => 
        new Date(grade.submittedAt) <= submittedBeforeDate
      );
    }

    // Grade range filters
    if (params.minGrade !== undefined) {
      filteredGrades = filteredGrades.filter(grade => grade.grade >= params.minGrade!);
    }
    
    if (params.maxGrade !== undefined) {
      filteredGrades = filteredGrades.filter(grade => grade.grade <= params.maxGrade!);
    }
    
    if (params.gradeRange) {
      const rangeMap = {
        excellent: [90, 100],
        good: [80, 89],
        average: [70, 79],
        below_average: [60, 69],
        failing: [0, 59]
      };
      
      const [min, max] = rangeMap[params.gradeRange];
      filteredGrades = filteredGrades.filter(grade => 
        grade.grade >= min! && grade.grade <= max!
      );
    }

    // Status filters
    if (params.hasFeedback !== undefined) {
      filteredGrades = filteredGrades.filter(grade => 
        params.hasFeedback ? grade.feedback && grade.feedback.trim() !== '' : true
      );
    }
    
    if (params.hasRubricScores !== undefined) {
      filteredGrades = filteredGrades.filter(grade => 
        params.hasRubricScores ? grade.rubricScores && grade.rubricScores.length > 0 : true
      );
    }
    
    if (params.allowResubmission !== undefined) {
      filteredGrades = filteredGrades.filter(grade => 
        grade.allowResubmission === params.allowResubmission
      );
    }

    // Search term filter
    if (params.searchTerm) {
      const searchLower = params.searchTerm.toLowerCase();
      filteredGrades = filteredGrades.filter(grade => 
        grade.feedback?.toLowerCase().includes(searchLower) ||
        grade.gradingNotes?.toLowerCase().includes(searchLower)
      );
    }

    return filteredGrades;
    
  } catch (error) {
    console.error(`[${requestId}] Error applying grade filters:`, error);
    return grades;
  }
}

/**
 * Sort grade results
 */
function sortGradeResults(grades: any[], sortBy: string, sortOrder: string): any[] {
  try {
    const sortedGrades = [...grades];
    
    sortedGrades.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortBy) {
        case 'grade':
          aValue = a.grade;
          bValue = b.grade;
          break;
        case 'gradedAt':
          aValue = new Date(a.gradedAt);
          bValue = new Date(b.gradedAt);
          break;
        case 'submittedAt':
          aValue = new Date(a.submittedAt);
          bValue = new Date(b.submittedAt);
          break;
        case 'assignmentTitle':
          aValue = a.assignmentTitle || '';
          bValue = b.assignmentTitle || '';
          break;
        case 'courseName':
          aValue = a.courseName || '';
          bValue = b.courseName || '';
          break;
        case 'instructorName':
          aValue = a.instructorName || '';
          bValue = b.instructorName || '';
          break;
        default:
          aValue = a.gradedAt;
          bValue = b.gradedAt;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sortedGrades;
    
  } catch (error) {
    console.error('Error sorting grade results:', error);
    return grades;
  }
}

/**
 * Apply pagination to grade results
 */
function applyGradePagination(grades: any[], page: number, limit: number): {
  grades: any[];
  totalItems: number;
} {
  try {
    const totalItems = grades.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedGrades = grades.slice(startIndex, endIndex);
    
    return {
      grades: paginatedGrades,
      totalItems
    };
    
  } catch (error) {
    console.error('Error applying pagination:', error);
    return {
      grades: grades.slice(0, limit),
      totalItems: grades.length
    };
  }
}

/**
 * Enrich grade data with additional details
 */
async function enrichGradeData(grades: any[], params: FetchGradesParams, requestId: string): Promise<GradeRecord[]> {
  try {
    const enrichedGrades: GradeRecord[] = [];
    
    for (const grade of grades) {
      const enrichedGrade: GradeRecord = {
        ...grade,
        assignmentTitle: '',
        courseName: '',
        studentName: '',
        instructorName: ''
      };
      
      // Get assignment details
      if (params.includeAssignmentDetails) {
        const assignment = await getAssignmentDetails(grade.assignmentId, requestId);
        if (assignment) {
          enrichedGrade.assignmentTitle = assignment.title;
        }
      }
      
      // Get course details
      if (params.includeCourseDetails) {
        const course = await getCourseDetails(grade.courseId, requestId);
        if (course) {
          enrichedGrade.courseName = course.name;
        }
      }
      
      // Get instructor details
      if (params.includeInstructorDetails) {
        const instructor = await getInstructorDetails(grade.gradedBy, requestId);
        if (instructor) {
          enrichedGrade.instructorName = instructor.name;
        }
      }
      
      enrichedGrades.push(enrichedGrade);
    }
    
    return enrichedGrades;
    
  } catch (error) {
    console.error(`[${requestId}] Error enriching grade data:`, error);
    return grades;
  }
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
 * Get course details
 */
async function getCourseDetails(courseId: string, requestId: string): Promise<any> {
  try {
    const result = await dynamodb.get({
      TableName: COURSES_TABLE,
      Key: { courseId }
    }).promise();
    
    return result.Item;
  } catch (error) {
    console.error(`[${requestId}] Error getting course details:`, error);
    return null;
  }
}

/**
 * Get instructor details
 */
async function getInstructorDetails(instructorId: string, requestId: string): Promise<any> {
  try {
    // This would typically query a users table
    // For now, return a basic structure
    return {
      id: instructorId,
      name: `Instructor ${instructorId}`
    };
  } catch (error) {
    console.error(`[${requestId}] Error getting instructor details:`, error);
    return null;
  }
}

/**
 * Calculate grade aggregates
 */
function calculateGradeAggregates(grades: any[], groupBy?: string): GradeAggregates {
  try {
    const totalSubmissions = grades.length;
    const totalGrade = grades.reduce((sum, grade) => sum + grade.grade, 0);
    const averageGrade = totalSubmissions > 0 ? totalGrade / totalSubmissions : 0;
    
    // Calculate grade distribution
    const gradeDistribution = {
      excellent: grades.filter(g => g.grade >= 90).length,
      good: grades.filter(g => g.grade >= 80 && g.grade < 90).length,
      average: grades.filter(g => g.grade >= 70 && g.grade < 80).length,
      below_average: grades.filter(g => g.grade >= 60 && g.grade < 70).length,
      failing: grades.filter(g => g.grade < 60).length
    };
    
    const aggregates: GradeAggregates = {
      totalSubmissions,
      averageGrade: Math.round(averageGrade * 100) / 100,
      gradeDistribution
    };
    
    // Add group-specific breakdowns
    if (groupBy === 'course') {
      aggregates.courseBreakdown = calculateCourseBreakdown(grades);
    } else if (groupBy === 'assignment') {
      aggregates.assignmentBreakdown = calculateAssignmentBreakdown(grades);
    } else if (groupBy === 'week') {
      aggregates.weeklyBreakdown = calculateWeeklyBreakdown(grades);
    }
    
    return aggregates;
    
  } catch (error) {
    console.error('Error calculating grade aggregates:', error);
    return {
      totalSubmissions: 0,
      averageGrade: 0,
      gradeDistribution: {
        excellent: 0,
        good: 0,
        average: 0,
        below_average: 0,
        failing: 0
      }
    };
  }
}

/**
 * Calculate course breakdown
 */
function calculateCourseBreakdown(grades: any[]): Array<{ courseId: string; courseName: string; count: number; averageGrade: number }> {
  const courseMap = new Map<string, { count: number; totalGrade: number }>();
  
  grades.forEach(grade => {
    const existing = courseMap.get(grade.courseId) || { count: 0, totalGrade: 0 };
    existing.count++;
    existing.totalGrade += grade.grade;
    courseMap.set(grade.courseId, existing);
  });
  
  return Array.from(courseMap.entries()).map(([courseId, data]) => ({
    courseId,
    courseName: `Course ${courseId}`,
    count: data.count,
    averageGrade: Math.round((data.totalGrade / data.count) * 100) / 100
  }));
}

/**
 * Calculate assignment breakdown
 */
function calculateAssignmentBreakdown(grades: any[]): Array<{ assignmentId: string; assignmentTitle: string; count: number; averageGrade: number }> {
  const assignmentMap = new Map<string, { count: number; totalGrade: number }>();
  
  grades.forEach(grade => {
    const existing = assignmentMap.get(grade.assignmentId) || { count: 0, totalGrade: 0 };
    existing.count++;
    existing.totalGrade += grade.grade;
    assignmentMap.set(grade.assignmentId, existing);
  });
  
  return Array.from(assignmentMap.entries()).map(([assignmentId, data]) => ({
    assignmentId,
    assignmentTitle: `Assignment ${assignmentId}`,
    count: data.count,
    averageGrade: Math.round((data.totalGrade / data.count) * 100) / 100
  }));
}

/**
 * Calculate weekly breakdown
 */
function calculateWeeklyBreakdown(grades: any[]): Array<{ weekNumber: number; weekStart: string; weekEnd: string; count: number; averageGrade: number }> {
  const weekMap = new Map<number, { count: number; totalGrade: number; dates: Date[] }>();
  
  grades.forEach(grade => {
    const date = new Date(grade.gradedAt);
    const weekNumber = getWeekNumber(date);
    
    const existing = weekMap.get(weekNumber) || { count: 0, totalGrade: 0, dates: [] };
    existing.count++;
    existing.totalGrade += grade.grade;
    existing.dates.push(date);
    weekMap.set(weekNumber, existing);
  });
  
  return Array.from(weekMap.entries()).map(([weekNumber, data]) => {
    const weekDates = data.dates.sort((a, b) => a.getTime() - b.getTime());
         const weekStart = getWeekStart(weekDates[0]!);
     const weekEnd = getWeekEnd(weekDates[0]!);
    
    return {
      weekNumber,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      count: data.count,
      averageGrade: Math.round((data.totalGrade / data.count) * 100) / 100
    };
  });
}

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get week start date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

/**
 * Get week end date
 */
function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
}

/**
 * Build available filters
 */
async function buildAvailableFilters(user: any, _params: FetchGradesParams, requestId: string): Promise<{
  courses: Array<{ id: string; name: string }>;
  assignments: Array<{ id: string; title: string; courseId: string }>;
  instructors: Array<{ id: string; name: string }>;
}> {
  try {
    const filters = {
      courses: [] as Array<{ id: string; name: string }>,
      assignments: [] as Array<{ id: string; title: string; courseId: string }>,
      instructors: [] as Array<{ id: string; name: string }>
    };
    
    // Get available courses
    if (user.role === 'admin' || user.role === 'instructor') {
      const coursesResult = await dynamodb.scan({
        TableName: COURSES_TABLE,
        ProjectionExpression: 'courseId, name'
      }).promise();
      
             filters.courses = (coursesResult.Items || []).map(item => ({
         id: item['courseId'],
         name: item['name'] || `Course ${item['courseId']}`
       }));
    }
    
    // Get available assignments
    if (user.role === 'admin' || user.role === 'instructor') {
      const assignmentsResult = await dynamodb.scan({
        TableName: ASSIGNMENTS_TABLE,
        ProjectionExpression: 'assignmentId, title, courseId'
      }).promise();
      
             filters.assignments = (assignmentsResult.Items || []).map(item => ({
         id: item['assignmentId'],
         title: item['title'] || `Assignment ${item['assignmentId']}`,
         courseId: item['courseId']
       }));
    }
    
    return filters;
    
  } catch (error) {
    console.error(`[${requestId}] Error building available filters:`, error);
    return {
      courses: [],
      assignments: [],
      instructors: []
    };
  }
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
