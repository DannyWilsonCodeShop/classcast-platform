import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBService } from '@/lib/dynamodb';

const dynamodbService = new DynamoDBService();

export async function POST(request: NextRequest) {
  try {
    const { videoId, userId } = await request.json();

    if (!videoId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Video ID and User ID are required' },
        { status: 400 }
      );
    }

    // Check if user has already viewed this video recently (within last 24 hours)
    const existingView = await dynamodbService.query({
      TableName: 'classcast-peer-interactions',
      IndexName: 'user-video-index',
      KeyConditionExpression: 'userId = :userId AND videoId = :videoId',
      FilterExpression: 'action = :action AND createdAt > :recentTime',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':videoId': videoId,
        ':action': 'view',
        ':recentTime': new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    });

    // If user hasn't viewed this video recently, record the view
    if (existingView.Count === 0) {
      const viewRecord = {
        id: `view_${Date.now()}_${userId}_${videoId}`,
        userId,
        videoId,
        action: 'view',
        createdAt: new Date().toISOString(),
        timestamp: Date.now()
      };

      await dynamodbService.put({
        TableName: 'classcast-peer-interactions',
        Item: viewRecord
      });

      return NextResponse.json({
        success: true,
        message: 'View tracked successfully',
        data: { viewId: viewRecord.id }
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'View already recorded recently',
        data: { alreadyViewed: true }
      });
    }
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track view' },
      { status: 500 }
    );
  }
}
