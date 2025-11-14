import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const s3Client = new S3Client({ region: 'us-east-1' });

const SUBMISSIONS_TABLE = 'classcast-submissions';
const USERS_TABLE = 'classcast-users';
const VIDEO_BUCKET = process.env.VIDEO_BUCKET || 'classcast-videos-463470937777-us-east-1';
const SIGNED_URL_EXPIRY = 3600; // 1 hour

// Helper function to extract S3 key from S3 URL
function extractS3KeyFromUrl(url: string): string | null {
  try {
    // Handle S3 URLs in format: https://bucket.s3.region.amazonaws.com/key
    // or https://s3.region.amazonaws.com/bucket/key
    const urlObj = new URL(url);
    
    // Extract path and remove leading slash
    let key = urlObj.pathname.substring(1);
    
    // If the URL contains the bucket name in the path, remove it
    if (key.startsWith(`${VIDEO_BUCKET}/`)) {
      key = key.substring(VIDEO_BUCKET.length + 1);
    }
    
    return key || null;
  } catch (error) {
    console.error('Error extracting S3 key from URL:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    // Build filter expression
    let filterExpression = 'assignmentId = :assignmentId';
    const expressionAttributeValues: any = {
      ':assignmentId': assignmentId
    };

    // If studentId is provided, filter by student
    if (studentId) {
      filterExpression += ' AND studentId = :studentId';
      expressionAttributeValues[':studentId'] = studentId;
    }

    // Filter out deleted/hidden submissions
    filterExpression += ' AND (attribute_not_exists(#status) OR #status <> :deletedStatus)';
    filterExpression += ' AND (attribute_not_exists(#hidden) OR #hidden <> :hiddenValue)';
    expressionAttributeValues[':deletedStatus'] = 'deleted';
    expressionAttributeValues[':hiddenValue'] = true;

    // Get submissions for this assignment
    const submissionsResult = await docClient.send(new ScanCommand({
      TableName: SUBMISSIONS_TABLE,
      FilterExpression: filterExpression,
      ExpressionAttributeNames: {
        '#status': 'status',
        '#hidden': 'hidden'
      },
      ExpressionAttributeValues: expressionAttributeValues
    }));

    const submissions = submissionsResult.Items || [];

    // Enrich submissions with student information and signed video URLs
    const enrichedSubmissions = await Promise.all(submissions.map(async (submission) => {
      let studentName = 'Unknown Student';
      let studentEmail = '';

      try {
        const studentResult = await docClient.send(new GetCommand({
          TableName: USERS_TABLE,
          Key: { userId: submission.studentId }
        }));

        if (studentResult.Item) {
          studentName = `${studentResult.Item.firstName || ''} ${studentResult.Item.lastName || ''}`.trim() || 'Unknown Student';
          studentEmail = studentResult.Item.email || '';
        }
      } catch (error) {
        console.warn('Could not fetch student information:', error);
      }

      // Generate signed URL for video if it exists
      let signedVideoUrl = submission.videoUrl;
      if (submission.videoUrl) {
        try {
          const isYouTubeSubmission =
            submission.isYouTube ||
            submission.youtubeUrl ||
            submission.videoUrl.includes('youtube.com') ||
            submission.videoUrl.includes('youtu.be');

          const isGoogleDriveSubmission =
            submission.isGoogleDrive ||
            submission.googleDriveUrl ||
            submission.videoUrl.includes('drive.google.com');

          if (isYouTubeSubmission) {
            console.log('✅ YouTube submission detected:', {
              submissionId: submission.submissionId,
              isYouTube: submission.isYouTube,
              youtubeUrl: submission.youtubeUrl,
              videoUrl: submission.videoUrl
            });
            signedVideoUrl = submission.youtubeUrl || submission.videoUrl;
          } else if (isGoogleDriveSubmission) {
            console.log('✅ Google Drive submission detected:', {
              submissionId: submission.submissionId,
              isGoogleDrive: submission.isGoogleDrive,
              googleDriveUrl: submission.googleDriveUrl,
              videoUrl: submission.videoUrl
            });
            signedVideoUrl = submission.googleDriveUrl || submission.videoUrl;
          } else {
            // Extract S3 key from URL for non-YouTube videos
            const s3Key = extractS3KeyFromUrl(submission.videoUrl);
            if (s3Key) {
              const command = new GetObjectCommand({
                Bucket: VIDEO_BUCKET,
                Key: s3Key,
              });
              signedVideoUrl = await getSignedUrl(s3Client, command, { expiresIn: SIGNED_URL_EXPIRY });
              console.log('Generated signed URL for video:', s3Key);
            }
          }
        } catch (error) {
          console.warn('Could not generate signed URL for video:', error);
          // Keep original URL as fallback
        }
      }

      return {
        ...submission,
        videoUrl: signedVideoUrl,
        youtubeUrl: submission.youtubeUrl || null,
        googleDriveUrl: submission.googleDriveUrl || submission.googleDriveOriginalUrl || null,
        isYouTube: submission.isYouTube || false,
        isGoogleDrive: submission.isGoogleDrive || false,
        studentName,
        studentEmail
      };
    }));

    return NextResponse.json({
      success: true,
      submissions: enrichedSubmissions
    });

  } catch (error) {
    console.error('Error fetching assignment submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment submissions' },
      { status: 500 }
    );
  }
}
