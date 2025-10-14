import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COMMUNITY_POSTS_TABLE = 'classcast-community-posts';

export async function POST(request: NextRequest) {
  try {
    const { postId, userId, reactionType } = await request.json();

    if (!postId || !userId || !reactionType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Adding reaction:', { postId, userId, reactionType });

    // Get current post
    const getResult = await docClient.send(new GetCommand({
      TableName: COMMUNITY_POSTS_TABLE,
      Key: { postId: postId }
    }));

    if (!getResult.Item) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = getResult.Item;
    const currentReactions = post.reactions || {};
    const currentReactionCount = currentReactions[reactionType] || 0;
    
    // Track which users have reacted (to prevent double reactions)
    const reactedBy = post.reactedBy || {};
    const reactionUsers = reactedBy[reactionType] || [];
    
    // Check if user already reacted
    if (reactionUsers.includes(userId)) {
      return NextResponse.json(
        { success: false, error: 'User already reacted to this post' },
        { status: 400 }
      );
    }

    // Update reaction count and track user
    const updatedReactions = {
      ...currentReactions,
      [reactionType]: currentReactionCount + 1
    };
    
    const updatedReactedBy = {
      ...reactedBy,
      [reactionType]: [...reactionUsers, userId]
    };

    // Update post with new reaction count and user tracking
    await docClient.send(new UpdateCommand({
      TableName: COMMUNITY_POSTS_TABLE,
      Key: { postId: postId },
      UpdateExpression: 'SET reactions = :reactions, reactedBy = :reactedBy, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':reactions': updatedReactions,
        ':reactedBy': updatedReactedBy,
        ':updatedAt': new Date().toISOString()
      }
    }));

    console.log('Reaction added successfully');

    return NextResponse.json({
      success: true,
      reactions: updatedReactions
    });

  } catch (error) {
    console.error('Error adding reaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add reaction' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { postId, userId, reactionType } = await request.json();

    if (!postId || !userId || !reactionType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Removing reaction:', { postId, userId, reactionType });

    // Get current post
    const getResult = await docClient.send(new GetCommand({
      TableName: COMMUNITY_POSTS_TABLE,
      Key: { postId: postId }
    }));

    if (!getResult.Item) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = getResult.Item;
    const currentReactions = post.reactions || {};
    const currentReactionCount = currentReactions[reactionType] || 0;
    
    // Track which users have reacted
    const reactedBy = post.reactedBy || {};
    const reactionUsers = reactedBy[reactionType] || [];
    
    // Check if user has reacted
    if (!reactionUsers.includes(userId)) {
      return NextResponse.json(
        { success: false, error: 'User has not reacted to this post' },
        { status: 400 }
      );
    }

    // Update reaction count and remove user
    const updatedReactions = {
      ...currentReactions,
      [reactionType]: Math.max(0, currentReactionCount - 1)
    };
    
    const updatedReactedBy = {
      ...reactedBy,
      [reactionType]: reactionUsers.filter(id => id !== userId)
    };

    // Update post with new reaction count and user tracking
    await docClient.send(new UpdateCommand({
      TableName: COMMUNITY_POSTS_TABLE,
      Key: { postId: postId },
      UpdateExpression: 'SET reactions = :reactions, reactedBy = :reactedBy, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':reactions': updatedReactions,
        ':reactedBy': updatedReactedBy,
        ':updatedAt': new Date().toISOString()
      }
    }));

    console.log('Reaction removed successfully');

    return NextResponse.json({
      success: true,
      reactions: updatedReactions
    });

  } catch (error) {
    console.error('Error removing reaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove reaction' },
      { status: 500 }
    );
  }
}
