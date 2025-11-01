import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: process.env.REGION || process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// DELETE /api/video-submissions/[submissionId] - Soft delete a video submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;

    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: 'Submission ID required' },
        { status: 400 }
      );
    }

    // Get the submission first to verify it exists
    const getCommand = new GetCommand({
      TableName: 'classcast-submissions',
      Key: { submissionId }
    });

    const result = await docClient.send(getCommand);

    if (!result.Item) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }

    const submission = result.Item;

    // Soft delete by updating status to 'deleted'
    const updateCommand = new UpdateCommand({
      TableName: 'classcast-submissions',
      Key: { submissionId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt, hidden = :hidden',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'deleted',
        ':updatedAt': new Date().toISOString(),
        ':hidden': true
      }
    });

    await docClient.send(updateCommand);

    // Also soft delete the corresponding video entry if it exists
    try {
      // Find the video entry linked to this submission
      const videoScanCommand = new ScanCommand({
        TableName: 'classcast-videos',
        FilterExpression: 'submissionId = :submissionId',
        ExpressionAttributeValues: {
          ':submissionId': submissionId
        },
        Limit: 1
      });

      const videoResult = await docClient.send(videoScanCommand);

      if (videoResult.Items && videoResult.Items.length > 0) {
        const videoId = videoResult.Items[0].id;

        const updateVideoCommand = new UpdateCommand({
          TableName: 'classcast-videos',
          Key: { id: videoId },
          UpdateExpression: 'SET hidden = :hidden, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':hidden': true,
            ':updatedAt': new Date().toISOString()
          }
        });

        await docClient.send(updateVideoCommand);
        console.log('Video entry also soft-deleted:', videoId);
      }
    } catch (videoError) {
      console.warn('Could not soft-delete video entry:', videoError);
      // Don't fail the deletion if video update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Video submission deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting video submission:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete video submission',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

