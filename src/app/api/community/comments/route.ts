import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COMMUNITY_POSTS_TABLE = 'classcast-community-posts';
const COMMUNITY_COMMENTS_TABLE = 'classcast-community-comments';

export async function POST(request: NextRequest) {
  try {
    const { postId, userId, content, authorName } = await request.json();

    if (!postId || !userId || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Adding comment:', { postId, userId, content });

    // Create comment
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const comment = {
      commentId,
      postId,
      userId,
      authorName: authorName || 'Anonymous',
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: COMMUNITY_COMMENTS_TABLE,
      Item: comment
    }));

    // Update post comment count
    const getResult = await docClient.send(new GetCommand({
      TableName: COMMUNITY_POSTS_TABLE,
      Key: { postId: postId }
    }));

    if (getResult.Item) {
      const currentComments = getResult.Item.comments || 0;
      await docClient.send(new UpdateCommand({
        TableName: COMMUNITY_POSTS_TABLE,
        Key: { postId: postId },
        UpdateExpression: 'SET comments = :comments, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':comments': currentComments + 1,
          ':updatedAt': new Date().toISOString()
        }
      }));
    }

    console.log('Comment added successfully');

    return NextResponse.json({
      success: true,
      comment: comment
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching comments for post:', postId);

    // Get comments for the post
    const result = await docClient.send(new ScanCommand({
      TableName: COMMUNITY_COMMENTS_TABLE,
      FilterExpression: 'postId = :postId',
      ExpressionAttributeValues: {
        ':postId': postId
      }
    }));

    const comments = (result.Items || []).sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return NextResponse.json({
      success: true,
      comments: comments
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
