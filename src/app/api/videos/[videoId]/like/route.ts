import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function POST(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { userId, isLiked } = await request.json();
    const { videoId } = params;

    if (!userId || typeof isLiked !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: userId, isLiked' },
        { status: 400 }
      );
    }

    // Get current video data
    const getCommand = new GetCommand({
      TableName: process.env.VIDEOS_TABLE_NAME || 'ClassCastVideos',
      Key: { videoId }
    });

    const videoData = await docClient.send(getCommand);
    
    if (!videoData.Item) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const currentLikes = videoData.Item.likes || 0;
    const likedBy = videoData.Item.likedBy || [];
    
    let newLikes = currentLikes;
    let newLikedBy = [...likedBy];

    if (isLiked) {
      // Add like
      if (!likedBy.includes(userId)) {
        newLikes = currentLikes + 1;
        newLikedBy.push(userId);
      }
    } else {
      // Remove like
      if (likedBy.includes(userId)) {
        newLikes = Math.max(0, currentLikes - 1);
        newLikedBy = likedBy.filter(id => id !== userId);
      }
    }

    // Update video with new like data
    const updateCommand = new UpdateCommand({
      TableName: process.env.VIDEOS_TABLE_NAME || 'ClassCastVideos',
      Key: { videoId },
      UpdateExpression: 'SET likes = :likes, likedBy = :likedBy, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':likes': newLikes,
        ':likedBy': newLikedBy,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(updateCommand);

    return NextResponse.json({
      success: true,
      likes: newLikes,
      isLiked: isLiked,
      video: result.Attributes
    });

  } catch (error) {
    console.error('Error updating video like:', error);
    return NextResponse.json(
      { error: 'Failed to update video like' },
      { status: 500 }
    );
  }
}
