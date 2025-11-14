import { S3Handler, S3Event } from 'aws-lambda';
import { DynamoDB, S3 } from 'aws-sdk';
import { z } from 'zod';

// Initialize AWS clients
const dynamodb = new DynamoDB.DocumentClient();
const s3 = new S3();

// Environment variables
const SUBMISSIONS_TABLE = process.env['SUBMISSIONS_TABLE'] || 'submissions';
const VIDEO_BUCKET = process.env['VIDEO_BUCKET'] || 'demo-project-videos';
const THUMBNAIL_BUCKET = process.env['THUMBNAIL_BUCKET'] || 'demo-project-thumbnails';

// Supported video formats for processing
const PROCESSABLE_VIDEO_TYPES = [
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/webm'
];

// Video processing configuration
const THUMBNAIL_INTERVAL_SECONDS = 10; // Generate thumbnail every 10 seconds

// S3 event validation schema - simplified to match actual AWS S3 events
const s3EventSchema = z.object({
  Records: z.array(z.object({
    eventName: z.string(),
    s3: z.object({
      bucket: z.object({
        name: z.string()
      }),
      object: z.object({
        key: z.string()
      })
    })
  }))
});

// Submission record schema (commented out as not currently used)
// const submissionRecordSchema = z.object({
//   submissionId: z.string(),
//   userId: z.string(),
//   assignmentId: z.string(),
//   courseId: z.string(),
//   fileName: z.string(),
//   fileType: z.string(),
//   fileSize: z.number(),
//   s3Key: z.string(),
//   s3Bucket: z.string(),
//   uploadType: z.enum(['assignment', 'lecture', 'presentation', 'demo', 'other']),
//   status: z.enum(['uploading', 'processing', 'completed', 'failed', 'rejected']),
//   metadata: z.record(z.any()).optional(),
//   createdAt: z.string(),
//   updatedAt: z.string(),
//   processedAt: z.string().optional(),
//   processingDuration: z.number().optional(),
//   thumbnailUrls: z.array(z.string()).optional(),
//   videoDuration: z.number().optional(),
//   videoResolution: z.object({
//     width: z.number(),
//     height: z.number()
//   }).optional(),
//   errorMessage: z.string().optional(),
//   retryCount: z.number().default(0)
// });

export const handler: S3Handler = async (event: S3Event) => {
  const requestId = `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] Starting video submission processing`);
    console.log(`[${requestId}] Event:`, JSON.stringify(event, null, 2));

    // Validate S3 event
    const validationResult = s3EventSchema.safeParse(event);
    if (!validationResult.success) {
      console.error(`[${requestId}] Invalid S3 event format:`, validationResult.error);
      throw new Error('Invalid S3 event format');
    }

    const s3Event = validationResult.data;
    
    // Process each S3 record
    const processingPromises = s3Event.Records.map(async (record) => {
      try {
        await processVideoSubmission(record, requestId);
      } catch (error) {
        console.error(`[${requestId}] Error processing record:`, error);
        // Continue processing other records even if one fails
      }
    });

    await Promise.all(processingPromises);
    
    console.log(`[${requestId}] Video submission processing completed successfully`);

  } catch (error) {
    console.error(`[${requestId}] Video submission processing failed:`, error);
    throw error;
  }
};

/**
 * Process a single video submission
 */
async function processVideoSubmission(record: any, requestId: string): Promise<void> {
  const bucketName = record.s3.bucket.name;
  const objectKey = record.s3.object.key;
  const eventName = record.eventName;

  console.log(`[${requestId}] Processing ${eventName} for ${bucketName}/${objectKey}`);

  // Only process video uploads (not deletions or other events)
  if (eventName !== 'ObjectCreated:Put' && eventName !== 'ObjectCreated:CompleteMultipartUpload') {
    console.log(`[${requestId}] Skipping non-upload event: ${eventName}`);
    return;
  }

  // Skip if not from the video bucket
  console.log(`[${requestId}] Checking bucket: ${bucketName} vs expected: ${VIDEO_BUCKET}`);
  if (bucketName !== VIDEO_BUCKET) {
    console.log(`[${requestId}] Skipping non-video bucket: ${bucketName}`);
    return;
  }

  // Parse S3 key to extract submission information
  console.log(`[${requestId}] Parsing S3 key: ${objectKey}`);
  const submissionInfo = parseS3Key(objectKey);
  if (!submissionInfo) {
    console.warn(`[${requestId}] Could not parse S3 key: ${objectKey}`);
    return;
  }
  console.log(`[${requestId}] Parsed submission info:`, submissionInfo);

  const { assignmentId, userId } = submissionInfo;
  
  // Type assertion since we've already checked for null
  if (!assignmentId || !userId) {
    console.warn(`[${requestId}] Missing required submission info: assignmentId=${assignmentId}, userId=${userId}`);
    return;
  }

  try {
    // Get object metadata from S3
    const objectMetadata = await getS3ObjectMetadata(bucketName, objectKey, requestId);
    
    // Validate the uploaded video
    const validationResult = await validateVideoUpload(objectMetadata, requestId);
    if (!validationResult.isValid) {
      console.warn(`[${requestId}] Video validation failed: ${validationResult.reason}`);
      await updateSubmissionStatus(assignmentId, userId, 'failed', validationResult.reason, requestId);
      return;
    }

    // Update submission status to processing
    await updateSubmissionStatus(assignmentId, userId, 'processing', undefined, requestId);

    // Process the video (generate thumbnails, extract metadata, etc.)
    const processingResult = await processVideo(objectMetadata, requestId);
    
    // Update submission with processing results
    await updateSubmissionWithResults(assignmentId, userId, processingResult, requestId);

    // Update submission status to completed
    await updateSubmissionStatus(assignmentId, userId, 'completed', undefined, requestId);

    console.log(`[${requestId}] Successfully processed video submission for ${assignmentId}`);

  } catch (error) {
    console.error(`[${requestId}] Error processing video submission:`, error);
    
    // Update submission status to failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
    await updateSubmissionStatus(assignmentId, userId, 'failed', errorMessage, requestId);
    
    // Increment retry count and potentially retry
    await incrementRetryCount(assignmentId, userId, requestId);
  }
}

/**
 * Parse S3 key to extract submission information
 * Expected format: courseId/assignmentId/userId/timestamp_filename.ext
 */
function parseS3Key(s3Key: string): {
  courseId: string;
  assignmentId: string;
  userId: string;
  fileName: string;
} | null {
  try {
    const parts = s3Key.split('/');
    if (parts.length < 4) {
      return null;
    }

    const courseId = parts[0];
    const assignmentId = parts[1];
    const userId = parts[2];
    const timestampAndFileName = parts.slice(3).join('/');
    
    // Extract filename from timestamp_filename.ext
    const fileNameMatch = timestampAndFileName.match(/^\d+_(.+)$/);
    if (!fileNameMatch) {
      return null;
    }

    const fileName = fileNameMatch[1];

    // Ensure all parts are non-empty strings
    if (!courseId || !assignmentId || !userId || !fileName) {
      return null;
    }

    return {
      courseId,
      assignmentId,
      userId,
      fileName
    };
  } catch (error) {
    console.error('Error parsing S3 key:', error);
    return null;
  }
}

/**
 * Get S3 object metadata
 */
async function getS3ObjectMetadata(bucket: string, key: string, requestId: string): Promise<{
  size: number;
  contentType: string;
  metadata: Record<string, string>;
  lastModified: Date;
}> {
  try {
    const headResult = await s3.headObject({
      Bucket: bucket,
      Key: key
    }).promise();

    return {
      size: headResult.ContentLength || 0,
      contentType: headResult.ContentType || 'application/octet-stream',
      metadata: headResult.Metadata || {},
      lastModified: headResult.LastModified || new Date()
    };
  } catch (error) {
    console.error(`[${requestId}] Error getting S3 object metadata:`, error);
    throw new Error(`Failed to get S3 object metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate uploaded video
 */
async function validateVideoUpload(metadata: any, requestId: string): Promise<{
  isValid: boolean;
  reason?: string;
}> {
  try {
    // Check file size
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (metadata.size > maxSize) {
      return {
        isValid: false,
        reason: `File size ${metadata.size} bytes exceeds maximum allowed size of ${maxSize} bytes`
      };
    }

    // Check content type
    if (!PROCESSABLE_VIDEO_TYPES.includes(metadata.contentType)) {
      return {
        isValid: false,
        reason: `Content type ${metadata.contentType} is not supported. Supported types: ${PROCESSABLE_VIDEO_TYPES.join(', ')}`
      };
    }

    // Check required metadata
    const requiredMetadata = ['assignment-id', 'course-id', 'upload-type', 'user-id'];
    for (const required of requiredMetadata) {
      if (!metadata.metadata[required]) {
        return {
          isValid: false,
          reason: `Missing required metadata: ${required}`
        };
      }
    }

    return { isValid: true };

  } catch (error) {
    console.error(`[${requestId}] Error validating video upload:`, error);
    return {
      isValid: false,
      reason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Process video (generate thumbnails, extract metadata, etc.)
 */
async function processVideo(metadata: any, requestId: string): Promise<{
  thumbnailUrls: string[];
  videoDuration?: number;
  videoResolution?: { width: number; height: number };
  processingDuration: number;
}> {
  const startTime = Date.now();
  
  try {
    console.log(`[${requestId}] Starting video processing`);

    // For now, we'll simulate video processing
    // In a real implementation, you might:
    // 1. Use AWS MediaConvert or similar service
    // 2. Generate thumbnails at specific intervals
    // 3. Extract video duration and resolution
    // 4. Transcode to different formats if needed

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock thumbnails
    const thumbnailUrls = await generateThumbnails(metadata, requestId);

    // Mock video metadata
    const videoDuration = Math.floor(Math.random() * 300) + 30; // 30-330 seconds
    const videoResolution = {
      width: 1920,
      height: 1080
    };

    const processingDuration = Date.now() - startTime;

    console.log(`[${requestId}] Video processing completed in ${processingDuration}ms`);

    return {
      thumbnailUrls,
      videoDuration,
      videoResolution,
      processingDuration
    };

  } catch (error) {
    console.error(`[${requestId}] Error processing video:`, error);
    throw new Error(`Video processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate thumbnails for the video
 */
async function generateThumbnails(metadata: any, requestId: string): Promise<string[]> {
  try {
    console.log(`[${requestId}] Generating thumbnails`);

    // In a real implementation, you would:
    // 1. Use AWS MediaConvert or similar to extract frames
    // 2. Save thumbnails to S3
    // 3. Return the thumbnail URLs

    // For now, return mock thumbnail URLs
    const thumbnailCount = Math.floor(metadata.size / (50 * 1024 * 1024)) + 1; // 1 thumbnail per 50MB
    const thumbnails = [];

    for (let i = 0; i < Math.min(thumbnailCount, 5); i++) {
      const timestamp = Math.floor(i * THUMBNAIL_INTERVAL_SECONDS);
      const thumbnailKey = `thumbnails/${metadata.metadata['assignment-id']}/${metadata.metadata['user-id']}/thumb_${timestamp}s.jpg`;
      
      // Mock thumbnail generation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      thumbnails.push(`https://${THUMBNAIL_BUCKET}.s3.amazonaws.com/${thumbnailKey}`);
    }

    console.log(`[${requestId}] Generated ${thumbnails.length} thumbnails`);
    return thumbnails;

  } catch (error) {
    console.error(`[${requestId}] Error generating thumbnails:`, error);
    // Don't fail the entire process for thumbnail generation errors
    return [];
  }
}

/**
 * Update submission status in DynamoDB
 */
async function updateSubmissionStatus(
  assignmentId: string, 
  userId: string, 
  status: string, 
  errorMessage?: string, 
  requestId?: string
): Promise<void> {
  try {
    const updateParams: any = {
      TableName: SUBMISSIONS_TABLE,
      Key: {
        assignmentId,
        userId
      },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      }
    };

    if (errorMessage) {
      updateParams.UpdateExpression += ', errorMessage = :errorMessage';
      updateParams.ExpressionAttributeValues[':errorMessage'] = errorMessage;
    }

    if (status === 'completed' || status === 'failed') {
      updateParams.UpdateExpression += ', processedAt = :processedAt';
      updateParams.ExpressionAttributeValues[':processedAt'] = new Date().toISOString();
    }

    await dynamodb.update(updateParams).promise();
    
    console.log(`[${requestId || 'N/A'}] Updated submission status to ${status} for ${assignmentId}/${userId}`);

  } catch (error) {
    console.error(`[${requestId || 'N/A'}] Error updating submission status:`, error);
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Update submission with processing results
 */
async function updateSubmissionWithResults(
  assignmentId: string,
  userId: string,
  results: any,
  requestId: string
): Promise<void> {
  try {
    const updateParams: any = {
      TableName: SUBMISSIONS_TABLE,
      Key: {
        assignmentId,
        userId
      },
      UpdateExpression: 'SET thumbnailUrls = :thumbnailUrls, processingDuration = :processingDuration, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':thumbnailUrls': results.thumbnailUrls,
        ':processingDuration': results.processingDuration,
        ':updatedAt': new Date().toISOString()
      }
    };

    if (results.videoDuration) {
      updateParams.UpdateExpression += ', videoDuration = :videoDuration';
      updateParams.ExpressionAttributeValues[':videoDuration'] = results.videoDuration;
    }

    if (results.videoResolution) {
      updateParams.UpdateExpression += ', videoResolution = :videoResolution';
      updateParams.ExpressionAttributeValues[':videoResolution'] = results.videoResolution;
    }

    await dynamodb.update(updateParams).promise();
    
    console.log(`[${requestId}] Updated submission with processing results for ${assignmentId}/${userId}`);

  } catch (error) {
    console.error(`[${requestId}] Error updating submission with results:`, error);
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Increment retry count for failed submissions
 */
async function incrementRetryCount(assignmentId: string, userId: string, requestId: string): Promise<void> {
  try {
    const updateParams = {
      TableName: SUBMISSIONS_TABLE,
      Key: {
        assignmentId,
        userId
      },
      UpdateExpression: 'SET retryCount = retryCount + :increment, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':increment': 1,
        ':updatedAt': new Date().toISOString()
      }
    };

    await dynamodb.update(updateParams).promise();
    
    console.log(`[${requestId}] Incremented retry count for ${assignmentId}/${userId}`);

  } catch (error) {
    console.error(`[${requestId}] Error incrementing retry count:`, error);
    // Don't throw - this is a non-critical operation
  }
}
