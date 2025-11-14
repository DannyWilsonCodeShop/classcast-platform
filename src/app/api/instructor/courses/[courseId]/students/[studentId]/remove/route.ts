import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBService } from '@/lib/dynamodb';
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const dynamodbService = new DynamoDBService();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const VIDEO_BUCKET = process.env.S3_VIDEO_BUCKET_NAME || 'classcast-videos-463470937777-us-east-1';

/**
 * DELETE /api/instructor/courses/[courseId]/students/[studentId]/remove
 * 
 * Comprehensively removes a student from a course, including:
 * - Unenrolling from course enrollment list
 * - Deleting all video submissions
 * - Deleting all S3 video files
 * - Deleting all peer responses written by student
 * - Deleting all community posts by student
 * - Deleting all community comments by student
 * - Deleting all interactions (likes, ratings, views)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; studentId: string }> }
) {
  try {
    const { courseId, studentId } = await params;

    console.log(`🗑️ Starting comprehensive removal of student ${studentId} from course ${courseId}`);

    // Initialize counters for reporting
    const report = {
      submissionsDeleted: 0,
      peerResponsesDeleted: 0,
      communityPostsDeleted: 0,
      communityCommentsDeleted: 0,
      interactionsDeleted: 0,
      s3ObjectsDeleted: 0,
      errors: [] as string[],
    };

    // Step 1: Get all video submissions by this student for this course
    console.log('📹 Step 1: Finding video submissions...');
    const submissionsResult = await dynamodbService.scan({
      TableName: 'classcast-submissions',
      FilterExpression: 'studentId = :studentId AND courseId = :courseId',
      ExpressionAttributeValues: {
        ':studentId': studentId,
        ':courseId': courseId,
      },
    });

    const submissions = submissionsResult.Items || [];
    console.log(`Found ${submissions.length} video submissions to delete`);

    // Step 2: Delete video files from S3 and submission records
    for (const submission of submissions) {
      try {
        // Delete video file from S3
        if (submission.videoUrl && !submission.isYouTube) {
          try {
            // Extract S3 key from URL
            const s3Key = extractS3KeyFromUrl(submission.videoUrl);
            if (s3Key) {
              await s3Client.send(
                new DeleteObjectCommand({
                  Bucket: VIDEO_BUCKET,
                  Key: s3Key,
                })
              );
              report.s3ObjectsDeleted++;
              console.log(`✅ Deleted S3 object: ${s3Key}`);
            }
          } catch (s3Error) {
            console.error(`Failed to delete S3 object for submission ${submission.submissionId}:`, s3Error);
            report.errors.push(`S3 deletion failed for ${submission.submissionId}`);
          }
        }

        // Delete thumbnail from S3 if it exists
        if (submission.thumbnailUrl) {
          try {
            const thumbnailKey = extractS3KeyFromUrl(submission.thumbnailUrl);
            if (thumbnailKey) {
              await s3Client.send(
                new DeleteObjectCommand({
                  Bucket: VIDEO_BUCKET,
                  Key: thumbnailKey,
                })
              );
              report.s3ObjectsDeleted++;
              console.log(`✅ Deleted thumbnail: ${thumbnailKey}`);
            }
          } catch (s3Error) {
            console.error(`Failed to delete thumbnail for submission ${submission.submissionId}:`, s3Error);
          }
        }

        // Delete submission record from DynamoDB
        await dynamodbService.deleteItem('classcast-submissions', {
          submissionId: submission.submissionId,
        });
        report.submissionsDeleted++;
        console.log(`✅ Deleted submission record: ${submission.submissionId}`);
      } catch (error) {
        console.error(`Error deleting submission ${submission.submissionId}:`, error);
        report.errors.push(`Submission deletion failed: ${submission.submissionId}`);
      }
    }

    // Step 3: Delete all peer responses written by this student (across all courses)
    console.log('💬 Step 3: Deleting peer responses...');
    const peerResponsesResult = await dynamodbService.scan({
      TableName: 'classcast-peer-responses',
      FilterExpression: 'reviewerId = :studentId',
      ExpressionAttributeValues: {
        ':studentId': studentId,
      },
    });

    const peerResponses = peerResponsesResult.Items || [];
    console.log(`Found ${peerResponses.length} peer responses to delete`);

    for (const response of peerResponses) {
      try {
        await dynamodbService.deleteItem('classcast-peer-responses', {
          responseId: response.responseId,
        });
        report.peerResponsesDeleted++;
        console.log(`✅ Deleted peer response: ${response.responseId}`);
      } catch (error) {
        console.error(`Error deleting peer response ${response.responseId}:`, error);
        report.errors.push(`Peer response deletion failed: ${response.responseId}`);
      }
    }

    // Step 4: Delete all community posts by this student
    console.log('📝 Step 4: Deleting community posts...');
    const communityPostsResult = await dynamodbService.scan({
      TableName: 'classcast-community-posts',
      FilterExpression: 'authorId = :studentId AND courseId = :courseId',
      ExpressionAttributeValues: {
        ':studentId': studentId,
        ':courseId': courseId,
      },
    });

    const communityPosts = communityPostsResult.Items || [];
    console.log(`Found ${communityPosts.length} community posts to delete`);

    for (const post of communityPosts) {
      try {
        await dynamodbService.deleteItem('classcast-community-posts', {
          postId: post.postId,
        });
        report.communityPostsDeleted++;
        console.log(`✅ Deleted community post: ${post.postId}`);
      } catch (error) {
        console.error(`Error deleting community post ${post.postId}:`, error);
        report.errors.push(`Community post deletion failed: ${post.postId}`);
      }
    }

    // Step 5: Delete all community comments by this student
    console.log('💭 Step 5: Deleting community comments...');
    const communityCommentsResult = await dynamodbService.scan({
      TableName: 'classcast-community-comments',
      FilterExpression: 'authorId = :studentId',
      ExpressionAttributeValues: {
        ':studentId': studentId,
      },
    });

    const communityComments = communityCommentsResult.Items || [];
    console.log(`Found ${communityComments.length} community comments to delete`);

    for (const comment of communityComments) {
      try {
        await dynamodbService.deleteItem('classcast-community-comments', {
          commentId: comment.commentId,
        });
        report.communityCommentsDeleted++;
        console.log(`✅ Deleted community comment: ${comment.commentId}`);
      } catch (error) {
        console.error(`Error deleting community comment ${comment.commentId}:`, error);
        report.errors.push(`Community comment deletion failed: ${comment.commentId}`);
      }
    }

    // Step 6: Delete all interactions (likes, ratings, views) by this student
    console.log('👍 Step 6: Deleting interactions...');
    const interactionsResult = await dynamodbService.scan({
      TableName: 'classcast-peer-interactions',
      FilterExpression: 'userId = :studentId',
      ExpressionAttributeValues: {
        ':studentId': studentId,
      },
    });

    const interactions = interactionsResult.Items || [];
    console.log(`Found ${interactions.length} interactions to delete`);

    for (const interaction of interactions) {
      try {
        await dynamodbService.deleteItem('classcast-peer-interactions', {
          id: interaction.id,
        });
        report.interactionsDeleted++;
        console.log(`✅ Deleted interaction: ${interaction.id}`);
      } catch (error) {
        console.error(`Error deleting interaction ${interaction.id}:`, error);
        report.errors.push(`Interaction deletion failed: ${interaction.id}`);
      }
    }

    // Step 7: Remove student from course enrollment
    console.log('🎓 Step 7: Removing from course enrollment...');
    const course = await dynamodbService.getItem('classcast-courses', { courseId });

    if (course) {
      const updatedStudents =
        course.enrollment?.students?.filter((s: any) => s.userId !== studentId) || [];

      await dynamodbService.updateItem(
        'classcast-courses',
        { courseId },
        'SET enrollment.students = :students, currentEnrollment = :enrollment',
        {
          ':students': updatedStudents,
          ':enrollment': updatedStudents.length,
        }
      );
      console.log(`✅ Removed student from course enrollment`);
    } else {
      console.warn(`⚠️ Course ${courseId} not found`);
      report.errors.push('Course not found');
    }

    // Final report
    console.log('✅ Student removal complete!');
    console.log('📊 Deletion Report:', report);

    return NextResponse.json({
      success: true,
      message: 'Student removed successfully',
      report,
    });
  } catch (error) {
    console.error('❌ Error removing student:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove student',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to extract S3 key from URL
 */
function extractS3KeyFromUrl(url: string): string | null {
  try {
    if (!url) return null;

    // If it's already just a key (no protocol), return it
    if (!url.startsWith('http')) {
      return url;
    }

    // Parse the URL
    const urlObj = new URL(url);
    
    // Extract path and remove leading slash
    let path = urlObj.pathname;
    if (path.startsWith('/')) {
      path = path.substring(1);
    }

    // If path is empty, return null
    if (!path) {
      return null;
    }

    return path;
  } catch (error) {
    console.error('Error extracting S3 key from URL:', url, error);
    return null;
  }
}
