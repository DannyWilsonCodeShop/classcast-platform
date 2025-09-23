import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBService } from '@/lib/dynamodb';

const dynamodbService = new DynamoDBService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      videoId,
      userId,
      action, // 'like', 'unlike', 'rate', 'unrate'
      rating, // 1-5 for rating action
      assignmentId
    } = body;

    if (!videoId || !userId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const interactionId = `interaction_${videoId}_${userId}_${Date.now()}`;

    // Create interaction record
    const interaction = {
      id: interactionId,
      videoId,
      userId,
      action,
      rating: action === 'rate' ? rating : undefined,
      assignmentId,
      timestamp: now,
      createdAt: now
    };

    await dynamodbService.putItem('classcast-peer-interactions', interaction);

    // Update video stats (this would typically be done via a trigger or separate process)
    await updateVideoStats(videoId, action, rating);

    // Update user profile stats
    await updateUserProfileStats(userId, action, rating);

    return NextResponse.json({
      success: true,
      data: interaction,
      message: `Successfully ${action}d video`
    });
  } catch (error) {
    console.error('Error handling peer interaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process interaction' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const userId = searchParams.get('userId');

    if (!videoId && !userId) {
      return NextResponse.json(
        { success: false, error: 'videoId or userId is required' },
        { status: 400 }
      );
    }

    let queryParams: any = {
      TableName: 'classcast-peer-interactions'
    };

    if (videoId) {
      queryParams.IndexName = 'video-index';
      queryParams.KeyConditionExpression = 'videoId = :videoId';
      queryParams.ExpressionAttributeValues = {
        ':videoId': videoId
      };
    } else if (userId) {
      queryParams.IndexName = 'user-index';
      queryParams.KeyConditionExpression = 'userId = :userId';
      queryParams.ExpressionAttributeValues = {
        ':userId': userId
      };
    }

    const result = await dynamodbService.query(queryParams);

    return NextResponse.json({
      success: true,
      data: result.Items || [],
      count: result.Count || 0
    });
  } catch (error) {
    console.error('Error fetching peer interactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}

async function updateVideoStats(videoId: string, action: string, rating?: number) {
  try {
    // This would typically update video statistics in a separate table
    // For now, we'll simulate the update
    console.log(`Updating video stats for ${videoId}: ${action}${rating ? ` (rating: ${rating})` : ''}`);
  } catch (error) {
    console.error('Error updating video stats:', error);
  }
}

async function updateUserProfileStats(userId: string, action: string, rating?: number) {
  try {
    // This would typically update user profile statistics
    // For now, we'll simulate the update
    console.log(`Updating user profile stats for ${userId}: ${action}${rating ? ` (rating: ${rating})` : ''}`);
  } catch (error) {
    console.error('Error updating user profile stats:', error);
  }
}
