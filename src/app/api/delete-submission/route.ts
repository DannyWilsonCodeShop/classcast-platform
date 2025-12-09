import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, DeleteCommand, ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const dynamoClient = new DynamoDBClient({
  region: process.env.REGION || process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const s3Client = new S3Client({
  region: process.env.REGION || process.env.AWS_REGION || 'us-east-1',
});

// POST /api/delete-submission - Delete a student's video submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: submissionId'
      }, { status: 400 });
    }

    console.log('🗑️ Starting deletion process for submission:', submissionId);

    // 1. Get the submission details first
    const getCommand = new GetCommand({
      TableName: 'classcast-submissions',
      Key: { submissionId }
    });

    const submissionResult = await docClient.send(getCommand);
    const submission = submissionResult.Item;

    if (!submission) {
      console.log('❌ Submission not found:', submissionId);
      return NextResponse.json({
        success: false,
        error: 'Submission not found'
      }, { status: 404 });
    }

    console.log('📄 Found submission:', {
      submissionId: submission.submissionId,
      studentId: submission.studentId,
      videoUrl: submission.videoUrl,
      isYouTube: submission.isYouTube,
      isGoogleDrive: submission.isGoogleDrive
    });

    // 2. Delete video from S3 if it's not YouTube or Google Drive
    if (!submission.isYouTube && !submission.isGoogleDrive && submission.videoUrl) {
      try {
        // Extract S3 key from URL
        const videoUrl = submission.videoUrl;
        let s3Key = '';

        if (videoUrl.includes('amazonaws.com/')) {
          // Extract key from S3 URL
          const urlParts = videoUrl.split('amazonaws.com/');
          if (urlParts.length > 1) {
            s3Key = decodeURIComponent(urlParts[1]);
          }
        } else if (videoUrl.startsWith('videos/')) {
          // Direct S3 key
          s3Key = videoUrl;
        }

        if (s3Key) {
          console.log('🗑️ Deleting S3 object:', s3Key);
          const deleteS3Command = new DeleteObjectCommand({
            Bucket: process.env.NEXT_PUBLIC_VIDEO_BUCKET || 'classcast-videos',
            Key: s3Key
          });

          await s3Client.send(deleteS3Command);
          console.log('✅ S3 object deleted successfully');
        } else {
          console.log('⚠️ Could not extract S3 key from URL:', videoUrl);
        }
      } catch (s3Error) {
        console.error('⚠️ Error deleting S3 object:', s3Error);
        // Continue with deletion even if S3 fails
      }
    } else {
      console.log('ℹ️ Skipping S3 deletion (YouTube or Google Drive video)');
    }

    // 3. Delete associated peer responses
    try {
      console.log('🔍 Looking for peer responses to delete...');
      const scanCommand = new ScanCommand({
        TableName: 'classcast-peer-responses',
        FilterExpression: 'videoId = :videoId',
        ExpressionAttributeValues: {
          ':videoId': submissionId
        }
      });

      const responsesResult = await docClient.send(scanCommand);
      const responses = responsesResult.Items || [];

      console.log(`📊 Found ${responses.length} peer responses to delete`);

      if (responses.length > 0) {
        // Delete in batches of 25 (DynamoDB limit)
        const batches = [];
        for (let i = 0; i < responses.length; i += 25) {
          const batch = responses.slice(i, i + 25);
          batches.push(batch);
        }

        for (const batch of batches) {
          const deleteRequests = batch.map(response => ({
            DeleteRequest: {
              Key: { responseId: response.responseId }
            }
          }));

          const batchWriteCommand = new BatchWriteCommand({
            RequestItems: {
              'classcast-peer-responses': deleteRequests
            }
          });

          await docClient.send(batchWriteCommand);
        }

        console.log('✅ Peer responses deleted successfully');
      }
    } catch (responseError) {
      console.error('⚠️ Error deleting peer responses:', responseError);
      // Continue with deletion even if peer response deletion fails
    }

    // 4. Delete from videos table (community display)
    try {
      console.log('🔍 Looking for video entry to delete...');
      const videoScanCommand = new ScanCommand({
        TableName: 'classcast-videos',
        FilterExpression: 'submissionId = :submissionId',
        ExpressionAttributeValues: {
          ':submissionId': submissionId
        }
      });

      const videoResult = await docClient.send(videoScanCommand);
      const videos = videoResult.Items || [];

      if (videos.length > 0) {
        for (const video of videos) {
          const deleteVideoCommand = new DeleteCommand({
            TableName: 'classcast-videos',
            Key: { id: video.id }
          });

          await docClient.send(deleteVideoCommand);
          console.log('✅ Video entry deleted:', video.id);
        }
      }
    } catch (videoError) {
      console.error('⚠️ Error deleting video entry:', videoError);
      // Continue with deletion even if video entry deletion fails
    }

    // 5. Finally, delete the submission record
    const deleteCommand = new DeleteCommand({
      TableName: 'classcast-submissions',
      Key: { submissionId }
    });

    await docClient.send(deleteCommand);
    console.log('✅ Submission record deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting submission:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete submission',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
