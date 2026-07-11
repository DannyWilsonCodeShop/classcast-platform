import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || process.env.CLASSCAST_AWS_REGION || 'us-east-1',
  ...((() => {
    const ak = process.env.AWS_ACCESS_KEY_ID || process.env.CLASSCAST_ACCESS_KEY_ID;
    const sk = process.env.AWS_SECRET_ACCESS_KEY || process.env.CLASSCAST_SECRET_ACCESS_KEY;
    return ak && sk ? { credentials: { accessKeyId: ak, secretAccessKey: sk } } : {};
  })()),
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

    // First try to get the average from the submission record (fast path)
    let averageRating = 0;
    try {
      const subResult = await docClient.send(new GetCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: { submissionId: videoId },
        ProjectionExpression: 'averageRating, ratings',
      }));
      if (subResult.Item) {
        averageRating = subResult.Item.averageRating || 0;
        // Check if this user's rating is stored in the ratings map
        const ratings = subResult.Item.ratings || {};
        if (ratings[userId]) {
          return NextResponse.json({
            success: true,
            rating: ratings[userId],
            averageRating: Math.round(averageRating * 10) / 10,
          }, { headers: { 'Cache-Control': 'no-store' } });
        }
      }
    } catch {}

    // Fallback: check interactions table via GSI
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
        ExpressionAttributeNames: { '#type': 'type' }
      }));

      if (result.Items && result.Items.length > 0) {
        return NextResponse.json({
          success: true,
          rating: result.Items[0].rating || 0,
          averageRating: Math.round(averageRating * 10) / 10,
        }, { headers: { 'Cache-Control': 'no-store' } });
      }
    } catch (error) {
      console.warn('GSI query failed, returning 0:', error);
    }

    return NextResponse.json({
      success: true,
      rating: 0,
      averageRating: Math.round(averageRating * 10) / 10,
    }, { headers: { 'Cache-Control': 'no-store' } });

  } catch (error) {
    console.error('Error fetching user rating:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch rating' }, { status: 500 });
  }
}

// POST /api/videos/[videoId]/rating - Save/update user's rating (simple direct path)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const body = await request.json();
    const { userId, rating } = body;

    if (!userId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'userId and rating (1-5) required' }, { status: 400 });
    }

    // First, ensure the ratings map exists on the submission, then set the user's rating
    try {
      // Try to set the rating in existing map
      await docClient.send(new UpdateCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: { submissionId: videoId },
        UpdateExpression: 'SET ratings.#uid = :rating',
        ExpressionAttributeNames: { '#uid': userId },
        ExpressionAttributeValues: { ':rating': rating },
        ConditionExpression: 'attribute_exists(ratings)',
      }));
    } catch (condErr: any) {
      // ratings map doesn't exist yet — create it
      await docClient.send(new UpdateCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: { submissionId: videoId },
        UpdateExpression: 'SET ratings = if_not_exists(ratings, :emptyMap)',
        ExpressionAttributeValues: { ':emptyMap': {} },
      }));
      // Now set the rating
      await docClient.send(new UpdateCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: { submissionId: videoId },
        UpdateExpression: 'SET ratings.#uid = :rating',
        ExpressionAttributeNames: { '#uid': userId },
        ExpressionAttributeValues: { ':rating': rating },
      }));
    }

    // Recalculate average from the ratings map
    const subResult = await docClient.send(new GetCommand({
      TableName: SUBMISSIONS_TABLE,
      Key: { submissionId: videoId },
      ProjectionExpression: 'ratings',
    }));
    const ratings = subResult.Item?.ratings || {};
    const ratingValues = Object.values(ratings).filter(v => typeof v === 'number' && (v as number) > 0) as number[];
    const avg = ratingValues.length > 0 ? ratingValues.reduce((s, r) => s + r, 0) / ratingValues.length : 0;

    // Save the average back
    await docClient.send(new UpdateCommand({
      TableName: SUBMISSIONS_TABLE,
      Key: { submissionId: videoId },
      UpdateExpression: 'SET averageRating = :avg, totalRatings = :total',
      ExpressionAttributeValues: { ':avg': Math.round(avg * 10) / 10, ':total': ratingValues.length },
    }));

    return NextResponse.json({
      success: true,
      rating,
      averageRating: Math.round(avg * 10) / 10,
      totalRatings: ratingValues.length,
    });
  } catch (error: any) {
    console.error('Error saving rating:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to save rating' }, { status: 500 });
  }
}
