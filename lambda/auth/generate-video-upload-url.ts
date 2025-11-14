import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import { z } from 'zod';
import { verifyJwtToken, AuthenticatedUser } from './jwt-verifier';

const s3 = new S3();

// Environment variables
const VIDEO_BUCKET = process.env['VIDEO_BUCKET'] || 'demo-project-videos';
const UPLOAD_EXPIRY_SECONDS = parseInt(process.env['UPLOAD_EXPIRY_SECONDS'] || '3600'); // 1 hour default
const MAX_VIDEO_SIZE_MB = parseInt(process.env['MAX_VIDEO_SIZE_MB'] || '500'); // 500MB default
const ALLOWED_VIDEO_TYPES = process.env['ALLOWED_VIDEO_TYPES']?.split(',') || [
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/flv',
  'video/webm',
  'video/mkv'
];

// Request validation schema
const generateUploadUrlSchema = z.object({
  fileName: z.string()
    .min(1, 'File name is required')
    .max(255, 'File name too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'File name contains invalid characters'),
  
  fileType: z.string()
    .min(1, 'File type is required')
    .refine(type => ALLOWED_VIDEO_TYPES.includes(type), {
      message: `File type not allowed. Allowed types: ${ALLOWED_VIDEO_TYPES.join(', ')}`
    }),
  
  fileSize: z.number()
    .int()
    .positive('File size must be positive')
    .max(MAX_VIDEO_SIZE_MB * 1024 * 1024, `File size exceeds maximum allowed size of ${MAX_VIDEO_SIZE_MB}MB`),
  
  assignmentId: z.string()
    .min(1, 'Assignment ID is required')
    .max(100, 'Assignment ID too long'),
  
  courseId: z.string()
    .min(1, 'Course ID is required')
    .max(100, 'Course ID too long'),
  
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    duration: z.number().optional(), // in seconds
    quality: z.enum(['low', 'medium', 'high', '4k']).optional(),
    language: z.string().optional()
  }).optional(),
  
  uploadType: z.enum(['assignment', 'lecture', 'presentation', 'demo', 'other'])
    .default('assignment'),
  
  expiresIn: z.number()
    .int()
    .min(300, 'Expiry must be at least 5 minutes')
    .max(86400, 'Expiry cannot exceed 24 hours')
    .optional()
    .default(UPLOAD_EXPIRY_SECONDS)
});

type GenerateUploadUrlRequest = z.infer<typeof generateUploadUrlSchema>;

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] Starting video upload URL generation request`);
    
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

    // Parse and validate request body
    let requestBody: any;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      console.warn(`[${requestId}] Invalid JSON in request body:`, error);
      return createErrorResponse(400, 'Invalid JSON in request body', {
        error: 'Request body must be valid JSON',
        requestId
      });
    }

    const validationResult = generateUploadUrlSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      console.warn(`[${requestId}] Request validation failed:`, errors);
      return createErrorResponse(400, 'Invalid request parameters', {
        errors,
        message: 'Please check your request parameters and try again',
        requestId
      });
    }

    const uploadRequest = validationResult.data;
    console.log(`[${requestId}] Request validated, generating upload URL for:`, {
      fileName: uploadRequest.fileName,
      fileType: uploadRequest.fileType,
      fileSize: uploadRequest.fileSize,
      assignmentId: uploadRequest.assignmentId,
      courseId: uploadRequest.courseId
    });

    // Validate user access to the assignment/course
    const accessValidation = await validateVideoUploadAccess(user, uploadRequest, requestId);
    if (!accessValidation.hasAccess) {
      console.warn(`[${requestId}] Access denied for user ${user.sub}: ${accessValidation.reason}`);
      return createErrorResponse(403, 'Forbidden', {
        error: accessValidation.reason || 'Access denied',
        code: accessValidation.code,
        requestId
      });
    }

    // Generate unique S3 key
    const s3Key = generateS3Key(user, uploadRequest, requestId);
    
    // Generate presigned URL
    const presignedUrl = await generatePresignedUrl(s3Key, uploadRequest, user, requestId);
    
    // Create upload record for tracking
    const uploadRecord = await createUploadRecord(user, uploadRequest, s3Key, requestId);

    console.log(`[${requestId}] Successfully generated upload URL for ${uploadRequest.fileName}`);

    // Return success response
    return createSuccessResponse({
      uploadUrl: presignedUrl,
      s3Key,
      expiresAt: new Date(Date.now() + uploadRequest.expiresIn * 1000).toISOString(),
      uploadId: uploadRecord.uploadId,
      requestId
    }, 'Video upload URL generated successfully');

  } catch (error) {
    console.error(`[${requestId}] Generate video upload URL handler error:`, error);
    return createErrorResponse(500, 'Internal server error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};

/**
 * Validate user access to upload video for the assignment/course
 */
async function validateVideoUploadAccess(user: AuthenticatedUser, request: GenerateUploadUrlRequest, requestId: string): Promise<{
  hasAccess: boolean;
  reason?: string;
  code?: string;
}> {
  try {
    // Students can only upload to assignments they're enrolled in
    if (!user.isInstructor && !user.isAdmin) {
      const enrollmentCheck = await checkStudentEnrollment(request.courseId, user.sub, requestId);
      if (!enrollmentCheck.isEnrolled) {
        return {
          hasAccess: false,
          reason: 'You are not enrolled in this course',
          code: 'NOT_ENROLLED'
        };
      }

      // Check if assignment allows video submissions
      const assignmentCheck = await checkAssignmentVideoSubmission(request.assignmentId, requestId);
      if (!assignmentCheck.allowsVideo) {
        return {
          hasAccess: false,
          reason: 'This assignment does not allow video submissions',
          code: 'VIDEO_NOT_ALLOWED'
        };
      }

      // Check if student has already submitted a video for this assignment
      const existingSubmissionCheck = await checkExistingVideoSubmission(
        request.assignmentId, 
        user.sub, 
        requestId
      );
      if (existingSubmissionCheck.hasSubmission && !existingSubmissionCheck.allowsResubmission) {
        return {
          hasAccess: false,
          reason: 'Video already submitted and resubmission not allowed',
          code: 'ALREADY_SUBMITTED'
        };
      }
    }

    // Instructors can upload to their own courses
    if (user.isInstructor && !user.isAdmin) {
      const courseAccess = await checkInstructorCourseAccess(request.courseId, user, requestId);
      if (!courseAccess.hasAccess) {
        return {
          hasAccess: false,
          reason: courseAccess.reason || 'Access denied to this course',
          code: 'COURSE_ACCESS_DENIED'
        };
      }
    }

    // Admins have full access
    if (user.isAdmin) {
      return { hasAccess: true };
    }

    return { hasAccess: true };

  } catch (error) {
    console.error(`[${requestId}] Error validating video upload access:`, error);
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
 * Check if assignment allows video submissions
 */
async function checkAssignmentVideoSubmission(_assignmentId: string, requestId: string): Promise<{ allowsVideo: boolean }> {
  try {
    // This would typically query the assignments table
    // For now, we'll assume all assignments allow video submissions
    // In a real implementation, you'd check the assignment's submissionType field
    return { allowsVideo: true };
  } catch (error) {
    console.error(`[${requestId}] Error checking assignment video submission:`, error);
    return { allowsVideo: false };
  }
}

/**
 * Check if student already has a video submission
 */
async function checkExistingVideoSubmission(_assignmentId: string, _studentId: string, requestId: string): Promise<{
  hasSubmission: boolean;
  allowsResubmission: boolean;
}> {
  try {
    // This would typically query a submissions table
    // For now, we'll assume no existing submissions and resubmission is allowed
    // In a real implementation, you'd check against a submissions table
    return { hasSubmission: false, allowsResubmission: true };
  } catch (error) {
    console.error(`[${requestId}] Error checking existing video submission:`, error);
    return { hasSubmission: false, allowsResubmission: false };
  }
}

/**
 * Check if instructor has access to a course
 */
async function checkInstructorCourseAccess(_courseId: string, _user: AuthenticatedUser, requestId: string): Promise<{
  hasAccess: boolean;
  reason?: string;
}> {
  try {
    // This would typically query the courses table
    // For now, we'll assume instructors have access to courses in their department
    // In a real implementation, you'd check against the courses table
    return { hasAccess: true };
  } catch (error) {
    console.error(`[${requestId}] Error checking instructor course access:`, error);
    return { hasAccess: false, reason: 'Error checking course access' };
  }
}

/**
 * Generate unique S3 key for the video upload
 */
function generateS3Key(user: AuthenticatedUser, request: GenerateUploadUrlRequest, requestId: string): string {
  const timestamp = Date.now();
  const userId = user.sub;
  const sanitizedFileName = request.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Structure: courseId/assignmentId/userId/timestamp_filename
  const s3Key = `${request.courseId}/${request.assignmentId}/${userId}/${timestamp}_${sanitizedFileName}`;
  
  console.log(`[${requestId}] Generated S3 key: ${s3Key}`);
  return s3Key;
}

/**
 * Generate S3 presigned URL for video upload
 */
async function generatePresignedUrl(s3Key: string, request: GenerateUploadUrlRequest, user: AuthenticatedUser, requestId: string): Promise<string> {
  try {
    const params = {
      Bucket: VIDEO_BUCKET,
      Key: s3Key,
      ContentType: request.fileType,
      Expires: request.expiresIn,
      Conditions: [
        ['content-length-range', 1, request.fileSize], // File size validation
        ['starts-with', '$key', s3Key], // Key validation
        ['eq', '$Content-Type', request.fileType], // Content type validation
        ['eq', '$x-amz-meta-assignment-id', request.assignmentId], // Assignment ID metadata
        ['eq', '$x-amz-meta-course-id', request.courseId], // Course ID metadata
        ['eq', '$x-amz-meta-upload-type', request.uploadType], // Upload type metadata
        ['eq', '$x-amz-meta-user-id', user.sub], // User ID metadata
      ],
      Metadata: {
        'assignment-id': request.assignmentId,
        'course-id': request.courseId,
        'upload-type': request.uploadType,
        'user-id': user.sub,
        'file-size': request.fileSize.toString(),
        'original-filename': request.fileName,
        'upload-timestamp': new Date().toISOString(),
        ...request.metadata
      }
    };

    console.log(`[${requestId}] Generating presigned URL with params:`, JSON.stringify(params, null, 2));

    const presignedUrl = await s3.getSignedUrlPromise('putObject', params);
    
    console.log(`[${requestId}] Successfully generated presigned URL for key: ${s3Key}`);
    return presignedUrl;

  } catch (error) {
    console.error(`[${requestId}] Error generating presigned URL:`, error);
    throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create upload record for tracking
 */
async function createUploadRecord(user: AuthenticatedUser, request: GenerateUploadUrlRequest, s3Key: string, requestId: string): Promise<{
  uploadId: string;
}> {
  try {
    // This would typically save to a database (DynamoDB, RDS, etc.)
    // For now, we'll generate a mock upload ID
    // In a real implementation, you'd save the upload record
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const uploadRecord = {
      uploadId,
      userId: user.sub,
      assignmentId: request.assignmentId,
      courseId: request.courseId,
      fileName: request.fileName,
      fileType: request.fileType,
      fileSize: request.fileSize,
      s3Key,
      uploadType: request.uploadType,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + request.expiresIn * 1000).toISOString(),
      metadata: request.metadata || {}
    };

    console.log(`[${requestId}] Created upload record:`, uploadRecord);
    
    // TODO: Save upload record to database
    // await saveUploadRecord(uploadRecord);
    
    return { uploadId };

  } catch (error) {
    console.error(`[${requestId}] Error creating upload record:`, error);
    // Don't fail the entire operation for record creation errors
    return { uploadId: `temp_${Date.now()}` };
  }
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
