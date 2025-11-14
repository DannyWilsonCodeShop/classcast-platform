import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const POSTS_TABLE = 'classcast-community-posts';
const LIKES_TABLE = 'classcast-post-likes';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, userId } = body;

    if (!postId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Post ID and User ID are required' },
        { status: 400 }
      );
    }

    // Check if user already liked this post
    const likeId = `${postId}_${userId}`;
    
    try {
      const existingLike = await docClient.send(new GetCommand({
        TableName: LIKES_TABLE,
        Key: { likeId }
      }));

      if (existingLike.Item) {
        // Already liked, do nothing or unlike
        return NextResponse.json({
          success: true,
          message: 'Already liked',
          alreadyLiked: true
        });
      }
    } catch (error: any) {
      if (error.name !== 'ResourceNotFoundException') {
        console.error('Error checking existing like:', error);
      }
    }

    // Record the like
    const now = new Date().toISOString();
    try {
      await docClient.send(new UpdateCommand({
        TableName: LIKES_TABLE,
        Key: { likeId },
        UpdateExpression: 'SET postId = :postId, userId = :userId, createdAt = :createdAt',
        ExpressionAttributeValues: {
          ':postId': postId,
          ':userId': userId,
          ':createdAt': now
        }
      }));
    } catch (error: any) {
      // If table doesn't exist, just continue
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    // Increment like count on the post
    try {
      await docClient.send(new UpdateCommand({
        TableName: POSTS_TABLE,
        Key: { postId },
        UpdateExpression: 'SET likes = if_not_exists(likes, :zero) + :inc',
        ExpressionAttributeValues: {
          ':inc': 1,
          ':zero': 0
        }
      }));
    } catch (error: any) {
      // If table doesn't exist, return success anyway
      if (error.name === 'ResourceNotFoundException') {
        return NextResponse.json({
          success: true,
          message: 'Post liked (table not found)'
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Post liked successfully'
    });

  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to like post' },
      { status: 500 }
    );
  }
}

