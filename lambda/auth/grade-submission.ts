import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { z } from 'zod';
import { verifyJwtToken } from './jwt-verifier';

// Environment variables
const SUBMISSIONS_TABLE = process.env['SUBMISSIONS_TABLE'] || 'submissions';
const ASSIGNMENTS_TABLE = process.env['ASSIGNMENTS_TABLE'] || 'assignments';

// Initialize DynamoDB client
const dynamodb = new DynamoDB.DocumentClient();

// Input validation schema
const gradeSubmissionSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required'),
  assignmentId: z.string().min(1, 'Assignment ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  grade: z.number().min(0).max(100, 'Grade must be between 0 and 100'),
  feedback: z.string().min(1, 'Feedback is required').max(2000, 'Feedback cannot exceed 2000 characters'),
  rubricScores: z.array(z.object({
    criterion: z.string().min(1, 'Criterion name is required'),
    score: z.number().min(0).max(100, 'Criterion score must be between 0 and 100'),
    maxScore: z.number().min(1, 'Maximum score must be at least 1'),
    comments: z.string().optional()
  })).optional(),
  gradingNotes: z.string().max(1000, 'Grading notes cannot exceed 1000 characters').optional(),
  gradedAt: z.string().datetime().optional(),
  allowResubmission: z.boolean().default(false),
  resubmissionDeadline: z.string().datetime().optional()
});

type GradeSubmissionParams = z.infer<typeof gradeSubmissionSchema>;

// Response types
interface GradeSubmissionResponse {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  grade: number;
  feedback: string;
  rubricScores?: Array<{
    criterion: string;
    score: number;
    maxScore: number;
    comments?: string | undefined;
  }>;
  gradingNotes?: string | undefined;
  gradedAt: string;
  gradedBy: string;
  allowResubmission: boolean;
  resubmissionDeadline?: string | undefined;
  totalRubricScore?: number | undefined;
  maxRubricScore?: number | undefined;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = `grade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] Starting submission grading`);
    
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

    const validationResult = gradeSubmissionSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return createErrorResponse(400, `Invalid parameters: ${validationResult.error.message}`, requestId);
    }

    const params = validationResult.data;
    
    // Validate user access and permissions
    const accessValidation = await validateGradingAccess(user, params, requestId);
    if (!accessValidation.isValid) {
      return createErrorResponse(403, accessValidation.reason || 'Access denied', requestId);
    }

    // Validate submission exists and is in gradable state
    const submissionValidation = await validateSubmissionForGrading(params, requestId);
    if (!submissionValidation.isValid) {
      return createErrorResponse(400, submissionValidation.reason || 'Submission cannot be graded', requestId);
    }

    // Calculate rubric scores if provided
    let totalRubricScore: number | undefined;
    let maxRubricScore: number | undefined;
    
    if (params.rubricScores && params.rubricScores.length > 0) {
      const rubricCalculation = calculateRubricScores(params.rubricScores);
      totalRubricScore = rubricCalculation.totalScore;
      maxRubricScore = rubricCalculation.maxScore;
      
      // Validate that rubric scores align with overall grade
      if (Math.abs(totalRubricScore - params.grade) > 5) {
        return createErrorResponse(400, 'Rubric scores must align with overall grade (within 5 points)', requestId);
      }
    }

    // Prepare grading data
    const gradingData = {
      ...params,
      gradedAt: params.gradedAt || new Date().toISOString(),
      gradedBy: user.sub,
      totalRubricScore,
      maxRubricScore
    };

    // Update submission with grade
    const updateResult = await updateSubmissionGrade(gradingData, requestId);
    
    if (!updateResult.success) {
      return createErrorResponse(500, updateResult.error || 'Failed to update submission grade', requestId);
    }

    // Log grading activity
    await logGradingActivity(gradingData, user, requestId);

    // Build response
    const response: GradeSubmissionResponse = {
      submissionId: params.submissionId,
      assignmentId: params.assignmentId,
      studentId: params.studentId,
      grade: params.grade,
      feedback: params.feedback,
      gradedAt: gradingData.gradedAt,
      gradedBy: user.sub,
      allowResubmission: params.allowResubmission
    };

    // Add optional fields only if they exist
    if (params.rubricScores) {
      response.rubricScores = params.rubricScores;
    }
    if (params.gradingNotes) {
      response.gradingNotes = params.gradingNotes;
    }
    if (params.resubmissionDeadline) {
      response.resubmissionDeadline = params.resubmissionDeadline;
    }
    if (totalRubricScore !== undefined) {
      response.totalRubricScore = totalRubricScore;
    }
    if (maxRubricScore !== undefined) {
      response.maxRubricScore = maxRubricScore;
    }

    console.log(`[${requestId}] Successfully graded submission ${params.submissionId} with grade ${params.grade}`);
    
    return createSuccessResponse(response, requestId);

  } catch (error) {
    console.error(`[${requestId}] Error grading submission:`, error);
    return createErrorResponse(500, 'Internal server error', requestId);
  }
};

/**
 * Validate user access for grading
 */
async function validateGradingAccess(user: any, params: GradeSubmissionParams, requestId: string): Promise<{
  isValid: boolean;
  reason?: string;
}> {
  try {
    // Only instructors and admins can grade submissions
    if (user.role !== 'instructor' && user.role !== 'admin') {
      return {
        isValid: false,
        reason: 'Only instructors and admins can grade submissions'
      };
    }

    // For instructors, verify they have access to the assignment
    if (user.role === 'instructor') {
      const hasAssignmentAccess = await checkInstructorAssignmentAccess(user.sub, params.assignmentId, requestId);
      if (!hasAssignmentAccess) {
        return {
          isValid: false,
          reason: 'Instructor does not have access to this assignment'
        };
      }
    }

    return { isValid: true };
    
  } catch (error) {
    console.error(`[${requestId}] Error validating grading access:`, error);
    return {
      isValid: false,
      reason: 'Error validating grading access'
    };
  }
}

/**
 * Check if instructor has access to a specific assignment
 */
async function checkInstructorAssignmentAccess(instructorId: string, assignmentId: string, requestId: string): Promise<boolean> {
  try {
    const result = await dynamodb.get({
      TableName: ASSIGNMENTS_TABLE,
      Key: { assignmentId }
    }).promise();
    
    if (!result.Item) {
      return false;
    }
    
    return result.Item['instructorId'] === instructorId;
    
  } catch (error) {
    console.error(`[${requestId}] Error checking instructor assignment access:`, error);
    return false;
  }
}

/**
 * Validate submission can be graded
 */
async function validateSubmissionForGrading(params: GradeSubmissionParams, requestId: string): Promise<{
  isValid: boolean;
  reason?: string;
}> {
  try {
    // Check if submission exists
    const submission = await getSubmission(params.assignmentId, params.studentId, requestId);
    
    if (!submission) {
      return {
        isValid: false,
        reason: 'Submission not found'
      };
    }

    // Check if submission is in a gradable state
    if (submission.status !== 'completed') {
      return {
        isValid: false,
        reason: `Submission status '${submission.status}' is not gradable. Only completed submissions can be graded.`
      };
    }

    // Check if already graded
    if (submission.grade !== undefined) {
      return {
        isValid: false,
        reason: 'Submission has already been graded'
      };
    }

    // Validate resubmission deadline if provided
    if (params.allowResubmission && params.resubmissionDeadline) {
      const resubmissionDate = new Date(params.resubmissionDeadline);
      const now = new Date();
      
      if (resubmissionDate <= now) {
        return {
          isValid: false,
          reason: 'Resubmission deadline must be in the future'
        };
      }
    }

    return { isValid: true };
    
  } catch (error) {
    console.error(`[${requestId}] Error validating submission for grading:`, error);
    return {
      isValid: false,
      reason: 'Error validating submission'
    };
  }
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
 * Calculate rubric scores
 */
function calculateRubricScores(rubricScores: Array<{
  criterion: string;
  score: number;
  maxScore: number;
  comments?: string | undefined;
}>): { totalScore: number; maxScore: number } {
  let totalScore = 0;
  let maxScore = 0;
  
  for (const rubric of rubricScores) {
    totalScore += rubric.score;
    maxScore += rubric.maxScore;
  }
  
  return { totalScore, maxScore };
}

/**
 * Update submission with grade using optimistic locking
 */
async function updateSubmissionGrade(gradingData: GradeSubmissionParams & {
  gradedAt: string;
  gradedBy: string;
  totalRubricScore?: number | undefined;
  maxRubricScore?: number | undefined;
}, requestId: string): Promise<{ success: boolean; error?: string }> {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      // Get current submission to check version
      const currentSubmission = await getSubmission(gradingData.assignmentId, gradingData.studentId, requestId);
      
      if (!currentSubmission) {
        return {
          success: false,
          error: 'Submission not found during update'
        };
      }

      // Check if submission was modified by another process
      if (currentSubmission.grade !== undefined) {
        return {
          success: false,
          error: 'Submission has already been graded by another process'
        };
      }

      const currentVersion = currentSubmission.version || 0;
      const newVersion = currentVersion + 1;

      const updateParams: any = {
        TableName: SUBMISSIONS_TABLE,
        Key: {
          assignmentId: gradingData.assignmentId,
          userId: gradingData.studentId
        },
        UpdateExpression: 'SET grade = :grade, feedback = :feedback, gradedAt = :gradedAt, gradedBy = :gradedBy, allowResubmission = :allowResubmission, version = :newVersion, lastModified = :lastModified',
        ConditionExpression: 'attribute_not_exists(grade) AND (attribute_not_exists(version) OR version = :currentVersion)',
        ExpressionAttributeValues: {
          ':grade': gradingData.grade,
          ':feedback': gradingData.feedback,
          ':gradedAt': gradingData.gradedAt,
          ':gradedBy': gradingData.gradedBy,
          ':allowResubmission': gradingData.allowResubmission,
          ':currentVersion': currentVersion,
          ':newVersion': newVersion,
          ':lastModified': new Date().toISOString()
        }
      };

      // Add optional fields
      if (gradingData.rubricScores) {
        updateParams.UpdateExpression += ', rubricScores = :rubricScores, totalRubricScore = :totalRubricScore, maxRubricScore = :maxRubricScore';
        updateParams.ExpressionAttributeValues[':rubricScores'] = gradingData.rubricScores;
        updateParams.ExpressionAttributeValues[':totalRubricScore'] = gradingData.totalRubricScore;
        updateParams.ExpressionAttributeValues[':maxRubricScore'] = gradingData.maxRubricScore;
      }

      if (gradingData.gradingNotes) {
        updateParams.UpdateExpression += ', gradingNotes = :gradingNotes';
        updateParams.ExpressionAttributeValues[':gradingNotes'] = gradingData.gradingNotes;
      }

      if (gradingData.resubmissionDeadline) {
        updateParams.UpdateExpression += ', resubmissionDeadline = :resubmissionDeadline';
        updateParams.ExpressionAttributeValues[':resubmissionDeadline'] = gradingData.resubmissionDeadline;
      }

      // Attempt the update with optimistic locking
      await dynamodb.update(updateParams).promise();
      
      console.log(`[${requestId}] Successfully updated submission grade with version ${newVersion}`);
      return { success: true };
      
    } catch (error: any) {
      attempt++;
      
      // Check if this is a conditional check failure (version conflict)
      if (error.code === 'ConditionalCheckFailedException') {
        console.warn(`[${requestId}] Version conflict on attempt ${attempt}, retrying...`);
        
        if (attempt >= maxRetries) {
          console.error(`[${requestId}] Max retries reached for version conflict`);
          return {
            success: false,
            error: 'Submission was modified by another process. Please refresh and try again.'
          };
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Handle other DynamoDB errors
      if (error.code === 'ProvisionedThroughputExceededException') {
        console.error(`[${requestId}] DynamoDB throughput exceeded on attempt ${attempt}`);
        
        if (attempt >= maxRetries) {
          return {
            success: false,
            error: 'Database temporarily unavailable. Please try again later.'
          };
        }
        
        // Wait before retrying
        const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Log and return other errors
      console.error(`[${requestId}] Error updating submission grade (attempt ${attempt}):`, error);
      return {
        success: false,
        error: 'Failed to update submission grade'
      };
    }
  }
  
  return {
    success: false,
    error: 'Max retries exceeded'
  };
}

/**
 * Log grading activity for audit purposes
 */
async function logGradingActivity(gradingData: any, user: any, requestId: string): Promise<void> {
  try {
    // This would typically write to a separate audit log table
    // For now, we'll just log to CloudWatch
    console.log(`[${requestId}] Grading activity logged:`, {
      action: 'GRADE_SUBMISSION',
      instructorId: user.sub,
      instructorRole: user.role,
      submissionId: gradingData.submissionId,
      assignmentId: gradingData.assignmentId,
      studentId: gradingData.studentId,
      grade: gradingData.grade,
      gradedAt: gradingData.gradedAt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[${requestId}] Error logging grading activity:`, error);
    // Don't fail the main operation if logging fails
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
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
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
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
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
