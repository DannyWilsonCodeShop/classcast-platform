import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

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

  } catch (error: any) {
    console.error('Error adding comment:', error);
    console.error('Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Check if table doesn't exist
    if (error.name === 'ResourceNotFoundException') {
      console.error('❌ Table does not exist:', error.message);
      return NextResponse.json(
        { success: false, error: 'Comments feature not yet configured. Please contact administrator.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to add comment', details: error.message },
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

    // Get comments for the post using the PostIdIndex for better performance
    const result = await docClient.send(new QueryCommand({
      TableName: COMMUNITY_COMMENTS_TABLE,
      IndexName: 'PostIdIndex',
      KeyConditionExpression: 'postId = :postId',
      ExpressionAttributeValues: {
        ':postId': postId
      },
      ScanIndexForward: true // Sort by createdAt ascending (oldest first)
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
