import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const s3Client = new S3Client({ region: 'us-east-1' });

const COURSES_TABLE = 'classcast-courses';
const ASSIGNMENTS_TABLE = 'classcast-assignments';
const SUBMISSIONS_TABLE = 'classcast-submissions';
const PEER_RESPONSES_TABLE = 'classcast-peer-responses';
const VIDEO_BUCKET = process.env.VIDEO_BUCKET || 'classcast-videos-463470937777-us-east-1';

/**
 * Helper function to extract S3 key from video URL
 */
function extractS3KeyFromUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    // Handle S3 URLs in various formats
    const urlObj = new URL(url);
    let key = urlObj.pathname.substring(1); // Remove leading slash
    
    // If the URL contains the bucket name in the path, remove it
    if (key.startsWith(`${VIDEO_BUCKET}/`)) {
      key = key.substring(VIDEO_BUCKET.length + 1);
    }
    
    return key || null;
  } catch (error) {
    // If URL parsing fails, try to extract key directly
    const match = url.match(/([^\/]+\/[^\/]+\/[^\/]+\/[^\/]+\.\w+)$/);
    return match ? match[1] : null;
  }
}

/**
 * Helper function to delete videos from S3 in batches
 */
async function deleteVideosFromS3(s3Keys: string[]): Promise<{ success: number; failed: number }> {
  if (s3Keys.length === 0) return { success: 0, failed: 0 };
  
  let successCount = 0;
  let failedCount = 0;
  
  // S3 DeleteObjects supports max 1000 objects per request
  const BATCH_SIZE = 1000;
  
  for (let i = 0; i < s3Keys.length; i += BATCH_SIZE) {
    const batch = s3Keys.slice(i, i + BATCH_SIZE);
    
    try {
      const deleteParams = {
        Bucket: VIDEO_BUCKET,
        Delete: {
          Objects: batch.map(key => ({ Key: key })),
          Quiet: false
        }
      };
      
      const result = await s3Client.send(new DeleteObjectsCommand(deleteParams));
      
      successCount += (result.Deleted?.length || 0);
      failedCount += (result.Errors?.length || 0);
      
      if (result.Errors && result.Errors.length > 0) {
        console.error('S3 deletion errors:', result.Errors);
      }
    } catch (error) {
      console.error('Error deleting S3 batch:', error);
      failedCount += batch.length;
    }
  }
  
  return { success: successCount, failed: failedCount };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const deletionReport: {
    courseId: string;
    assignments: number;
    submissions: number;
    peerResponses: number;
    videosDeleted: number;
    videosFailed: number;
    errors: string[];
  } = {
    courseId: params.courseId,
    assignments: 0,
    submissions: 0,
    peerResponses: 0,
    videosDeleted: 0,
    videosFailed: 0,
    errors: []
  };

  try {
    const { courseId } = params;

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️  Starting deletion of course: ${courseId}`);

    // STEP 1: Get all assignments for this course
    console.log('📋 Step 1: Fetching assignments...');
    const assignmentsResult = await docClient.send(new ScanCommand({
      TableName: ASSIGNMENTS_TABLE,
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': courseId
      }
    }));

    const assignments = assignmentsResult.Items || [];
    const assignmentIds = assignments.map(assignment => assignment.assignmentId);
    deletionReport.assignments = assignments.length;
    
    console.log(`📋 Found ${assignments.length} assignments`);

    // STEP 2: Get all submissions for these assignments and collect S3 keys
    console.log('🎥 Step 2: Fetching submissions and extracting S3 keys...');
    let allSubmissions: any[] = [];
    const s3KeysToDelete: string[] = [];

    if (assignmentIds.length > 0) {
      const submissionPromises = assignmentIds.map(assignmentId => 
        docClient.send(new ScanCommand({
          TableName: SUBMISSIONS_TABLE,
          FilterExpression: 'assignmentId = :assignmentId',
          ExpressionAttributeValues: {
            ':assignmentId': assignmentId
          }
        }))
      );

      const submissionResults = await Promise.all(submissionPromises);
      allSubmissions = submissionResults.flatMap(result => result.Items || []);
      deletionReport.submissions = allSubmissions.length;

      // Extract S3 keys from submissions
      for (const submission of allSubmissions) {
        if (submission.videoUrl) {
          const s3Key = extractS3KeyFromUrl(submission.videoUrl);
          if (s3Key) {
            s3KeysToDelete.push(s3Key);
          }
        }
        
        // Also check for thumbnail URLs
        if (submission.thumbnailUrl) {
          const thumbnailKey = extractS3KeyFromUrl(submission.thumbnailUrl);
          if (thumbnailKey) {
            s3KeysToDelete.push(thumbnailKey);
          }
        }
      }
      
      console.log(`🎥 Found ${allSubmissions.length} submissions with ${s3KeysToDelete.length} S3 objects`);
    }

    // STEP 3: Delete videos from S3
    if (s3KeysToDelete.length > 0) {
      console.log(`🗑️  Step 3: Deleting ${s3KeysToDelete.length} videos from S3...`);
      const s3Result = await deleteVideosFromS3(s3KeysToDelete);
      deletionReport.videosDeleted = s3Result.success;
      deletionReport.videosFailed = s3Result.failed;
      
      if (s3Result.failed > 0) {
        deletionReport.errors.push(`Failed to delete ${s3Result.failed} videos from S3`);
      }
      
      console.log(`✅ Deleted ${s3Result.success} videos, ${s3Result.failed} failed`);
    } else {
      console.log('📦 No videos to delete from S3');
    }

    // STEP 4: Delete peer responses for these assignments
    console.log('💬 Step 4: Deleting peer responses...');
    if (assignmentIds.length > 0) {
      try {
        const peerResponsePromises = assignmentIds.map(async (assignmentId) => {
          const responsesResult = await docClient.send(new ScanCommand({
            TableName: PEER_RESPONSES_TABLE,
            FilterExpression: 'assignmentId = :assignmentId',
            ExpressionAttributeValues: {
              ':assignmentId': assignmentId
            }
          }));

          const responses = responsesResult.Items || [];
          
          // Delete each peer response
          const deletePromises = responses.map(response => 
            docClient.send(new DeleteCommand({
              TableName: PEER_RESPONSES_TABLE,
              Key: { responseId: response.responseId }
            }))
          );

          await Promise.all(deletePromises);
          return responses.length;
        });

        const responseCounts = await Promise.all(peerResponsePromises);
        deletionReport.peerResponses = responseCounts.reduce((sum, count) => sum + count, 0);
        console.log(`💬 Deleted ${deletionReport.peerResponses} peer responses`);
      } catch (error) {
        console.error('Error deleting peer responses:', error);
        deletionReport.errors.push('Failed to delete some peer responses');
      }
    }

    // STEP 5: Delete submissions from DynamoDB
    console.log('📝 Step 5: Deleting submission records...');
    if (allSubmissions.length > 0) {
      const deleteSubmissionPromises = allSubmissions.map(submission => 
        docClient.send(new DeleteCommand({
          TableName: SUBMISSIONS_TABLE,
          Key: { submissionId: submission.submissionId }
        }))
      );

      await Promise.all(deleteSubmissionPromises);
      console.log(`✅ Deleted ${allSubmissions.length} submission records`);
    }

    // STEP 6: Delete assignments from DynamoDB
    console.log('📋 Step 6: Deleting assignment records...');
    if (assignments.length > 0) {
      const deleteAssignmentPromises = assignments.map(assignment => 
        docClient.send(new DeleteCommand({
          TableName: ASSIGNMENTS_TABLE,
          Key: { assignmentId: assignment.assignmentId }
        }))
      );

      await Promise.all(deleteAssignmentPromises);
      console.log(`✅ Deleted ${assignments.length} assignment records`);
    }

    // STEP 7: Delete the course itself
    console.log('🎓 Step 7: Deleting course record...');
    await docClient.send(new DeleteCommand({
      TableName: COURSES_TABLE,
      Key: { courseId: courseId }
    }));
    console.log('✅ Course deleted');

    console.log('🎉 Course deletion completed successfully!');
    console.log('📊 Deletion Report:', JSON.stringify(deletionReport, null, 2));

    const finalReport = {
      courseId: deletionReport.courseId,
      deletedAssignments: deletionReport.assignments || 0,
      deletedSubmissions: deletionReport.submissions || 0,
      deletedPeerResponses: deletionReport.peerResponses || 0,
      deletedVideos: deletionReport.videosDeleted || 0,
      failedVideoDeletes: deletionReport.videosFailed || 0,
      errors: deletionReport.errors.length > 0 ? deletionReport.errors : undefined
    };

    console.log('📤 Sending final report:', JSON.stringify(finalReport, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Course and all associated data deleted successfully',
      report: finalReport
    });

  } catch (error) {
    console.error('❌ Error deleting course:', error);
    deletionReport.errors.push(error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete course',
      details: error instanceof Error ? error.message : 'Unknown error',
      partialReport: deletionReport
    }, { status: 500 });
  }
}
