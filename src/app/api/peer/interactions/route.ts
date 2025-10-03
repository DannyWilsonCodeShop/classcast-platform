import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const PEER_INTERACTIONS_TABLE = 'classcast-peer-interactions';
const SUBMISSIONS_TABLE = 'classcast-submissions';
const USERS_TABLE = 'classcast-users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      submissionId,
      userId,
      action, // 'like', 'comment', 'view'
      comment = null,
      rating = null
    } = body;

    if (!submissionId || !userId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: submissionId, userId, action' },
        { status: 400 }
      );
    }

    if (!['like', 'comment', 'view', 'rate'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be one of: like, comment, view, rate' },
        { status: 400 }
      );
    }

    // Get user information
    let userName = 'Unknown User';
    try {
      const userResult = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId }
      }));
      if (userResult.Item) {
        userName = `${userResult.Item.firstName || ''} ${userResult.Item.lastName || ''}`.trim() || 'Unknown User';
      }
    } catch (error) {
      console.warn('Could not fetch user information:', error);
    }

    const interactionId = `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const interaction = {
      interactionId,
      submissionId,
      userId,
      userName,
      action,
      comment: comment ? comment.trim() : null,
      rating: rating ? Number(rating) : null,
      createdAt: now,
      updatedAt: now
    };

    // Save the interaction
    await docClient.send(new PutCommand({
      TableName: PEER_INTERACTIONS_TABLE,
      Item: interaction
    }));

    // Update the submission with the interaction
    try {
      const submissionResult = await docClient.send(new GetCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: { submissionId }
      }));

      if (submissionResult.Item) {
        const currentLikes = submissionResult.Item.likes || 0;
        const currentComments = submissionResult.Item.comments || [];
        
        let updatedLikes = currentLikes;
        let updatedComments = currentComments;

        if (action === 'like') {
          // Check if user already liked this submission
          const existingLikeResult = await docClient.send(new ScanCommand({
            TableName: PEER_INTERACTIONS_TABLE,
            FilterExpression: 'submissionId = :submissionId AND userId = :userId AND action = :action',
            ExpressionAttributeValues: {
              ':submissionId': submissionId,
              ':userId': userId,
              ':action': 'like'
            }
          }));

          if (existingLikeResult.Items && existingLikeResult.Items.length > 0) {
            // User already liked, so this is an unlike
            updatedLikes = Math.max(0, currentLikes - 1);
          } else {
            // New like
            updatedLikes = currentLikes + 1;
          }
        } else if (action === 'comment' && comment) {
          // Add new comment
          const newComment = {
            id: interactionId,
            text: comment.trim(),
            authorId: userId,
            authorName: userName,
            authorType: 'student',
            createdAt: now,
            isEdited: false
          };
          updatedComments = [...currentComments, newComment];
        }

        await docClient.send(new PutCommand({
          TableName: SUBMISSIONS_TABLE,
          Item: {
            ...submissionResult.Item,
            likes: updatedLikes,
            comments: updatedComments,
            updatedAt: now
          }
        }));
      }
    } catch (error) {
      console.warn('Could not update submission with interaction:', error);
      // Don't fail the interaction if this update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Interaction recorded successfully',
      interaction: {
        interactionId,
        submissionId,
        userId,
        userName,
        action,
        comment: comment ? comment.trim() : null,
        rating: rating ? Number(rating) : null,
        createdAt: now
      }
    });

  } catch (error) {
    console.error('Error recording peer interaction:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to record peer interaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    
    if (!submissionId && !userId) {
      return NextResponse.json(
        { error: 'Either submissionId or userId is required' },
        { status: 400 }
      );
    }

    let interactions = [];
    
    try {
      let filterExpression = '';
      let expressionAttributeValues: any = {};

      if (submissionId && userId) {
        filterExpression = 'submissionId = :submissionId AND userId = :userId';
        expressionAttributeValues = {
          ':submissionId': submissionId,
          ':userId': userId
        };
      } else if (submissionId) {
        filterExpression = 'submissionId = :submissionId';
        expressionAttributeValues = { ':submissionId': submissionId };
      } else {
        filterExpression = 'userId = :userId';
        expressionAttributeValues = { ':userId': userId };
      }

      if (action) {
        filterExpression += ' AND action = :action';
        expressionAttributeValues[':action'] = action;
      }

      const interactionsResult = await docClient.send(new ScanCommand({
        TableName: PEER_INTERACTIONS_TABLE,
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues
      }));
      
      interactions = interactionsResult.Items || [];
      
      // Sort by createdAt in descending order (most recent first)
      interactions.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
        return NextResponse.json({
          success: true,
          interactions: [],
          count: 0
        });
      }
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      interactions,
      count: interactions.length
    });

  } catch (error) {
    console.error('Error fetching peer interactions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch peer interactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
