import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';

export async function POST(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params;
    const { userId } = await request.json();

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Video ID is required' },
        { status: 400 }
      );
    }

    console.log('Tracking video view:', { videoId, userId });

    // Get current submission
    const getResult = await docClient.send(new GetCommand({
      TableName: SUBMISSIONS_TABLE,
      Key: { submissionId: videoId }
    }));

    if (!getResult.Item) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      );
    }

    const submission = getResult.Item;
    const currentViews = submission.views || 0;
    const viewedBy = submission.viewedBy || [];
    
    // Only increment view count if user hasn't viewed this video before
    // (or if no userId provided, assume it's a unique view)
    if (!userId || !viewedBy.includes(userId)) {
      const updatedViews = currentViews + 1;
      const updatedViewedBy = userId ? [...viewedBy, userId] : viewedBy;

      // Update submission with new view count
      await docClient.send(new UpdateCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: { submissionId: videoId },
        UpdateExpression: 'SET views = :views, viewedBy = :viewedBy, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':views': updatedViews,
          ':viewedBy': updatedViewedBy,
          ':updatedAt': new Date().toISOString()
        }
      }));

      console.log('Video view tracked successfully:', { videoId, views: updatedViews });

      return NextResponse.json({
        success: true,
        views: updatedViews
      });
    } else {
      // User already viewed this video, return current count
      console.log('Video already viewed by user:', { videoId, userId });
      
      return NextResponse.json({
        success: true,
        views: currentViews,
        alreadyViewed: true
      });
    }

  } catch (error) {
    console.error('Error tracking video view:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track video view' },
      { status: 500 }
    );
  }
}
