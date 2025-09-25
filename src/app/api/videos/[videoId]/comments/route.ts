import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: process.env.REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function POST(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { userId, content, parentCommentId } = await request.json();
    const { videoId } = params;

    if (!userId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, content' },
        { status: 400 }
      );
    }

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Create comment
    const comment = {
      commentId,
      videoId,
      userId,
      content: content.trim(),
      parentCommentId: parentCommentId || null,
      likes: 0,
      likedBy: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const putCommand = new PutCommand({
      TableName: process.env.COMMENTS_TABLE_NAME || 'ClassCastComments',
      Item: comment
    });

    await docClient.send(putCommand);

    // Update video comment count
    const updateCommand = new UpdateCommand({
      TableName: process.env.VIDEOS_TABLE_NAME || 'ClassCastVideos',
      Key: { videoId },
      UpdateExpression: 'ADD comments :increment SET updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':increment': 1,
        ':updatedAt': timestamp
      }
    });

    await docClient.send(updateCommand);

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        author: 'Current User', // In real app, fetch from users table
        authorAvatar: 'U'
      }
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const lastKey = searchParams.get('lastKey');

    const queryCommand = new QueryCommand({
      TableName: process.env.COMMENTS_TABLE_NAME || 'ClassCastComments',
      KeyConditionExpression: 'videoId = :videoId',
      ExpressionAttributeValues: {
        ':videoId': videoId
      },
      ScanIndexForward: false, // Most recent first
      Limit: limit,
      ...(lastKey && { ExclusiveStartKey: JSON.parse(decodeURIComponent(lastKey)) })
    });

    const result = await docClient.send(queryCommand);

    // In a real app, you'd join with users table to get author info
    const comments = result.Items?.map(comment => ({
      ...comment,
      author: 'Student', // Placeholder
      authorAvatar: comment.userId?.charAt(0).toUpperCase() || 'U'
    })) || [];

    return NextResponse.json({
      success: true,
      comments,
      lastKey: result.LastEvaluatedKey
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
