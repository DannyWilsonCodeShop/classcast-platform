import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const s3Client = new S3Client({ region: 'us-east-1' });

const SUBMISSIONS_TABLE = 'classcast-submissions';
const PEER_RESPONSES_TABLE = 'classcast-peer-responses';
const COMMUNITY_POSTS_TABLE = 'classcast-community-posts';
const COMMUNITY_COMMENTS_TABLE = 'classcast-community-comments';
const COURSES_TABLE = 'classcast-courses';
const USERS_TABLE = 'classcast-users';
const VIDEO_BUCKET = process.env.VIDEO_BUCKET || 'classcast-videos-463470937777-us-east-1';

// Helper function to extract S3 key from S3 URL
function extractS3KeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    let key = urlObj.pathname.substring(1);
    if (key.startsWith(`${VIDEO_BUCKET}/`)) {
      key = key.substring(VIDEO_BUCKET.length + 1);
    }
    return key || null;
  } catch (error) {
    console.error('Error extracting S3 key from URL:', error);
    return null;
  }
}

// Helper function to delete multiple objects from S3
async function deleteObjectsFromS3(keys: string[]): Promise<{ success: number; failed: number; errors: string[] }> {
  if (keys.length === 0) return { success: 0, failed: 0, errors: [] };

  const results = { success: 0, failed: 0, errors: [] as string[] };

  try {
    // Delete in batches of 1000 (S3 limit)
    for (let i = 0; i < keys.length; i += 1000) {
      const batch = keys.slice(i, i + 1000);
      
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: VIDEO_BUCKET,
        Delete: {
          Objects: batch.map(key => ({ Key: key })),
          Quiet: false
        }
      });

      const result = await s3Client.send(deleteCommand);
      
      if (result.Deleted) {
        results.success += result.Deleted.length;
      }
      
      if (result.Errors) {
        results.failed += result.Errors.length;
        result.Errors.forEach(error => {
          results.errors.push(`${error.Key}: ${error.Message}`);
        });
      }
    }
  } catch (error) {
    console.error('Error deleting objects from S3:', error);
    results.failed += keys.length;
    results.errors.push(`Batch delete failed: ${error}`);
  }

  return results;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; studentId: string }> }
) {
  try {
    const { courseId, studentId } = await params;

    if (!courseId || !studentId) {
      return NextResponse.json(
        { success: false, error: 'Course ID and Student ID are required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Removing student from course:', { courseId, studentId });

    const removalReport = {
      studentRemoved: false,
      submissionsDeleted: 0,
      peerResponsesDeleted: 0,
      communityPostsDeleted: 0,
      communityCommentsDeleted: 0,
      s3ObjectsDeleted: 0,
      s3Errors: [] as string[],
      errors: [] as string[]
    };

    // Step 1: Get student information
    let studentInfo = null;
    try {
      const studentResult = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId: studentId }
      }));
      studentInfo = studentResult.Item;
      console.log('👤 Student info:', studentInfo?.firstName, studentInfo?.lastName);
    } catch (error) {
      console.error('Error fetching student info:', error);
      removalReport.errors.push('Failed to fetch student information');
    }

    // Step 2: Get all submissions by this student
    const s3KeysToDelete: string[] = [];
    try {
      const submissionsResult = await docClient.send(new ScanCommand({
        TableName: SUBMISSIONS_TABLE,
        FilterExpression: 'studentId = :studentId',
        ExpressionAttributeValues: {
          ':studentId': studentId
        }
      }));

      if (submissionsResult.Items) {
        console.log('📹 Found submissions:', submissionsResult.Items.length);
        
        // Collect S3 keys for deletion
        submissionsResult.Items.forEach(submission => {
          if (submission.videoUrl) {
            const videoKey = extractS3KeyFromUrl(submission.videoUrl);
            if (videoKey) s3KeysToDelete.push(videoKey);
          }
          if (submission.thumbnailUrl && submission.thumbnailUrl.startsWith('https://')) {
            const thumbnailKey = extractS3KeyFromUrl(submission.thumbnailUrl);
            if (thumbnailKey) s3KeysToDelete.push(thumbnailKey);
          }
        });

        // Delete submissions from DynamoDB
        for (const submission of submissionsResult.Items) {
          try {
            await docClient.send(new DeleteCommand({
              TableName: SUBMISSIONS_TABLE,
              Key: { submissionId: submission.submissionId || submission.id }
            }));
            removalReport.submissionsDeleted++;
          } catch (error) {
            console.error('Error deleting submission:', error);
            removalReport.errors.push(`Failed to delete submission ${submission.submissionId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      removalReport.errors.push('Failed to fetch student submissions');
    }

    // Step 3: Delete peer responses by this student
    try {
      const responsesResult = await docClient.send(new ScanCommand({
        TableName: PEER_RESPONSES_TABLE,
        FilterExpression: 'reviewerId = :studentId',
        ExpressionAttributeValues: {
          ':studentId': studentId
        }
      }));

      if (responsesResult.Items) {
        console.log('💬 Found peer responses:', responsesResult.Items.length);
        
        for (const response of responsesResult.Items) {
          try {
            await docClient.send(new DeleteCommand({
              TableName: PEER_RESPONSES_TABLE,
              Key: { id: response.id || response.responseId }
            }));
            removalReport.peerResponsesDeleted++;
          } catch (error) {
            console.error('Error deleting peer response:', error);
            removalReport.errors.push(`Failed to delete peer response ${response.id}`);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching peer responses:', error);
      removalReport.errors.push('Failed to fetch peer responses');
    }

    // Step 4: Delete community posts by this student
    try {
      const postsResult = await docClient.send(new ScanCommand({
        TableName: COMMUNITY_POSTS_TABLE,
        FilterExpression: 'userId = :studentId',
        ExpressionAttributeValues: {
          ':studentId': studentId
        }
      }));

      if (postsResult.Items) {
        console.log('📝 Found community posts:', postsResult.Items.length);
        
        for (const post of postsResult.Items) {
          try {
            await docClient.send(new DeleteCommand({
              TableName: COMMUNITY_POSTS_TABLE,
              Key: { postId: post.postId || post.id }
            }));
            removalReport.communityPostsDeleted++;
          } catch (error) {
            console.error('Error deleting community post:', error);
            removalReport.errors.push(`Failed to delete community post ${post.postId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching community posts:', error);
      removalReport.errors.push('Failed to fetch community posts');
    }

    // Step 5: Delete community comments by this student
    try {
      const commentsResult = await docClient.send(new ScanCommand({
        TableName: COMMUNITY_COMMENTS_TABLE,
        FilterExpression: 'userId = :studentId',
        ExpressionAttributeValues: {
          ':studentId': studentId
        }
      }));

      if (commentsResult.Items) {
        console.log('💬 Found community comments:', commentsResult.Items.length);
        
        for (const comment of commentsResult.Items) {
          try {
            await docClient.send(new DeleteCommand({
              TableName: COMMUNITY_COMMENTS_TABLE,
              Key: { commentId: comment.commentId || comment.id }
            }));
            removalReport.communityCommentsDeleted++;
          } catch (error) {
            console.error('Error deleting community comment:', error);
            removalReport.errors.push(`Failed to delete community comment ${comment.commentId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching community comments:', error);
      removalReport.errors.push('Failed to fetch community comments');
    }

    // Step 6: Delete files from S3
    if (s3KeysToDelete.length > 0) {
      console.log('🗂️ Deleting S3 objects:', s3KeysToDelete.length);
      const s3Result = await deleteObjectsFromS3(s3KeysToDelete);
      removalReport.s3ObjectsDeleted = s3Result.success;
      removalReport.s3Errors = s3Result.errors;
    }

    // Step 7: Remove student from course enrollment
    try {
      const courseResult = await docClient.send(new GetCommand({
        TableName: COURSES_TABLE,
        Key: { courseId: courseId }
      }));

      if (courseResult.Item) {
        const course = courseResult.Item;
        const updatedStudents = (course.enrollment?.students || []).filter(
          (student: any) => student.userId !== studentId && student.id !== studentId
        );

        await docClient.send(new UpdateCommand({
          TableName: COURSES_TABLE,
          Key: { courseId: courseId },
          UpdateExpression: 'SET enrollment.students = :students, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':students': updatedStudents,
            ':updatedAt': new Date().toISOString()
          }
        }));

        removalReport.studentRemoved = true;
        console.log('✅ Student removed from course enrollment');
      }
    } catch (error) {
      console.error('Error removing student from course:', error);
      removalReport.errors.push('Failed to remove student from course enrollment');
    }

    console.log('📊 Student removal report:', removalReport);

    return NextResponse.json({
      success: true,
      message: `Student ${studentInfo?.firstName} ${studentInfo?.lastName} has been removed from the course`,
      report: removalReport
    });

  } catch (error) {
    console.error('Error removing student from course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove student from course' },
      { status: 500 }
    );
  }
}
