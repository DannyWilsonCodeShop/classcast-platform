import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const VIDEOS_TABLE = 'classcast-videos';
const USERS_TABLE = 'classcast-users';

// GET /api/videos/[videoId] - Get individual video by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const { searchParams } = new URL(request.url);
    const trackView = searchParams.get('trackView') === 'true';

    // Get video data
    const getCommand = new GetCommand({
      TableName: VIDEOS_TABLE,
      Key: { id: videoId }
    });

    const result = await docClient.send(getCommand);
    
    if (!result.Item) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Video not found' 
        },
        { status: 404 }
      );
    }

    const video = result.Item;

    // Get user information
    let userInfo = {
      userName: 'Unknown User',
      userAvatar: '/api/placeholder/40/40'
    };

    try {
      const userResult = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId: video.userId }
      }));

      if (userResult.Item) {
        userInfo = {
          userName: userResult.Item.firstName && userResult.Item.lastName 
            ? `${userResult.Item.firstName} ${userResult.Item.lastName}`
            : 'Unknown User',
          userAvatar: userResult.Item.avatar || '/api/placeholder/40/40'
        };
      }
    } catch (error) {
      console.warn('Failed to fetch user info for video:', videoId, error);
    }

    // Track view if requested
    if (trackView) {
      try {
        const updateCommand = new UpdateCommand({
          TableName: VIDEOS_TABLE,
          Key: { id: videoId },
          UpdateExpression: 'ADD stats.views :increment SET updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':increment': 1,
            ':updatedAt': new Date().toISOString()
          }
        });

        await docClient.send(updateCommand);
      } catch (error) {
        console.warn('Failed to track view for video:', videoId, error);
      }
    }

    // Enrich video with user information
    const enrichedVideo = {
      ...video,
      ...userInfo,
      courseName: video.courseName || 'Unknown Course'
    };

    return NextResponse.json({
      success: true,
      video: enrichedVideo
    });

  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/videos/[videoId] - Update video
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const body = await request.json();
    const { title, description, thumbnail } = body;

    // Validate required fields
    if (!title && !description && !thumbnail) {
      return NextResponse.json(
        { 
          success: false,
          error: 'At least one field (title, description, thumbnail) is required' 
        },
        { status: 400 }
      );
    }

    // Build update expression dynamically
    const updateExpressions = [];
    const expressionAttributeValues: any = {
      ':updatedAt': new Date().toISOString()
    };

    if (title) {
      updateExpressions.push('title = :title');
      expressionAttributeValues[':title'] = title;
    }

    if (description !== undefined) {
      updateExpressions.push('description = :description');
      expressionAttributeValues[':description'] = description;
    }

    if (thumbnail) {
      updateExpressions.push('thumbnail = :thumbnail');
      expressionAttributeValues[':thumbnail'] = thumbnail;
    }

    const updateCommand = new UpdateCommand({
      TableName: VIDEOS_TABLE,
      Key: { id: videoId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(updateCommand);

    if (!result.Attributes) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Video not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      video: result.Attributes,
      message: 'Video updated successfully'
    });

  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/videos/[videoId] - Delete video
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;

    // Check if video exists
    const getCommand = new GetCommand({
      TableName: VIDEOS_TABLE,
      Key: { id: videoId }
    });

    const result = await docClient.send(getCommand);
    
    if (!result.Item) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Video not found' 
        },
        { status: 404 }
      );
    }

    // Delete video
    const deleteCommand = new UpdateCommand({
      TableName: VIDEOS_TABLE,
      Key: { id: videoId },
      UpdateExpression: 'SET isDeleted = :isDeleted, deletedAt = :deletedAt',
      ExpressionAttributeValues: {
        ':isDeleted': true,
        ':deletedAt': new Date().toISOString()
      }
    });

    await docClient.send(deleteCommand);

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

