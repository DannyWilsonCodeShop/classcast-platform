import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: process.env.REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const INTERACTIONS_TABLE = 'classcast-video-interactions';
const SUBMISSIONS_TABLE = 'classcast-submissions';

// GET /api/videos/[videoId]/rating - Get user's rating for a video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    // Try to find the user's rating for this video using GSI
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: INTERACTIONS_TABLE,
        IndexName: 'videoId-index',
        KeyConditionExpression: 'videoId = :videoId',
        FilterExpression: 'userId = :userId AND #type = :type',
        ExpressionAttributeValues: {
          ':videoId': videoId,
          ':userId': userId,
          ':type': 'rating'
        },
        ExpressionAttributeNames: {
          '#type': 'type'
        }
      }));

      if (result.Items && result.Items.length > 0) {
        const rating = result.Items[0].rating || 0;
        return NextResponse.json({
          success: true,
          rating: rating
        });
      }
    } catch (error) {
      console.log('Error fetching rating:', error);
    }

    return NextResponse.json({
      success: true,
      rating: 0 // Not rated
    });

  } catch (error) {
    console.error('Error fetching user rating:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rating' },
      { status: 500 }
    );
  }
}

