import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { CreateCommentRequest, CreateResponseRequest, CreateRatingRequest, LikeVideoRequest } from '@/types/video-interactions';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const INTERACTIONS_TABLE = 'classcast-video-interactions';
const VIDEOS_TABLE = 'classcast-videos';
const USERS_TABLE = 'classcast-users';

// GET /api/videos/[videoId]/interactions - Get all interactions for a video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // like, comment, response, rating

    let filterExpression = 'videoId = :videoId';
    let expressionValues: any = { ':videoId': videoId };

    if (type) {
      filterExpression += ' AND #type = :type';
      expressionValues[':type'] = type;
    }

    const command = new ScanCommand({
      TableName: INTERACTIONS_TABLE,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionValues,
      ExpressionAttributeNames: type ? { '#type': 'type' } : undefined,
    });

    const result = await docClient.send(command);
    
    return NextResponse.json({
      success: true,
      interactions: result.Items || [],
      count: result.Count || 0
    });

  } catch (error) {
    console.error('Error fetching video interactions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch video interactions'
    }, { status: 500 });
  }
}

// POST /api/videos/[videoId]/interactions - Create a new interaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const body = await request.json();
    const { type, userId, userName, userAvatar } = body;

    if (!type || !userId || !userName) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    const interactionId = `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    let interactionData: any = {
      id: interactionId,
      videoId,
      userId,
      userName,
      userAvatar,
      type,
      createdAt: now,
      updatedAt: now
    };

    // Add type-specific data
    switch (type) {
      case 'like':
        // Check if user already liked this video
        const existingLike = await docClient.send(new ScanCommand({
          TableName: INTERACTIONS_TABLE,
          FilterExpression: 'videoId = :videoId AND userId = :userId AND #type = :type',
          ExpressionAttributeValues: {
            ':videoId': videoId,
            ':userId': userId,
            ':type': 'like'
          },
          ExpressionAttributeNames: {
            '#type': 'type'
          }
        }));

        if (existingLike.Items && existingLike.Items.length > 0) {
          return NextResponse.json({
            success: false,
            error: 'User has already liked this video'
          }, { status: 400 });
        }
        break;

      case 'comment':
        if (!body.content) {
          return NextResponse.json({
            success: false,
            error: 'Comment content is required'
          }, { status: 400 });
        }
        interactionData.content = body.content;
        interactionData.likes = 0;
        interactionData.replies = [];
        break;

      case 'response':
        if (!body.content) {
          return NextResponse.json({
            success: false,
            error: 'Response content is required'
          }, { status: 400 });
        }
        interactionData.content = body.content;
        interactionData.status = 'draft';
        break;

      case 'rating':
        if (!body.rating || body.rating < 1 || body.rating > 5) {
          return NextResponse.json({
            success: false,
            error: 'Valid rating (1-5) is required'
          }, { status: 400 });
        }
        if (!body.contentCreatorId) {
          return NextResponse.json({
            success: false,
            error: 'Content creator ID is required for rating'
          }, { status: 400 });
        }
        interactionData.rating = body.rating;
        interactionData.contentCreatorId = body.contentCreatorId;
        interactionData.comment = body.comment || '';
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid interaction type'
        }, { status: 400 });
    }

    // Save interaction
    await docClient.send(new PutCommand({
      TableName: INTERACTIONS_TABLE,
      Item: interactionData
    }));

    // Update video stats
    await updateVideoStats(videoId, type, 'increment');

    return NextResponse.json({
      success: true,
      interaction: interactionData
    });

  } catch (error) {
    console.error('Error creating video interaction:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create video interaction'
    }, { status: 500 });
  }
}

// DELETE /api/videos/[videoId]/interactions - Remove an interaction (like/unlike)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    if (!userId || !type) {
      return NextResponse.json({
        success: false,
        error: 'User ID and interaction type are required'
      }, { status: 400 });
    }

    // Find and delete the interaction
    const scanResult = await docClient.send(new ScanCommand({
      TableName: INTERACTIONS_TABLE,
      FilterExpression: 'videoId = :videoId AND userId = :userId AND #type = :type',
      ExpressionAttributeValues: {
        ':videoId': videoId,
        ':userId': userId,
        ':type': type
      },
      ExpressionAttributeNames: {
        '#type': 'type'
      }
    }));

    if (!scanResult.Items || scanResult.Items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Interaction not found'
      }, { status: 404 });
    }

    const interaction = scanResult.Items[0];

    // Delete the interaction
    await docClient.send(new UpdateCommand({
      TableName: INTERACTIONS_TABLE,
      Key: { id: interaction.id },
      UpdateExpression: 'SET deleted = :deleted, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':deleted': true,
        ':updatedAt': new Date().toISOString()
      }
    }));

    // Update video stats
    await updateVideoStats(videoId, type, 'decrement');

    return NextResponse.json({
      success: true,
      message: 'Interaction removed successfully'
    });

  } catch (error) {
    console.error('Error removing video interaction:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to remove video interaction'
    }, { status: 500 });
  }
}

async function updateVideoStats(videoId: string, type: string, action: 'increment' | 'decrement') {
  try {
    // Get current video stats
    const videoResult = await docClient.send(new GetCommand({
      TableName: VIDEOS_TABLE,
      Key: { id: videoId }
    }));

    if (!videoResult.Item) {
      console.error('Video not found:', videoId);
      return;
    }

    const currentStats = videoResult.Item.stats || {
      views: 0,
      likes: 0,
      comments: 0,
      responses: 0,
      averageRating: 0,
      totalRatings: 0
    };

    const multiplier = action === 'increment' ? 1 : -1;

    // Update specific stat based on type
    let updateExpression = 'SET stats = :stats, updatedAt = :updatedAt';
    let expressionValues: any = {
      ':stats': { ...currentStats },
      ':updatedAt': new Date().toISOString()
    };

    switch (type) {
      case 'like':
        expressionValues[':stats'].likes = Math.max(0, currentStats.likes + (1 * multiplier));
        break;
      case 'comment':
        expressionValues[':stats'].comments = Math.max(0, currentStats.comments + (1 * multiplier));
        break;
      case 'response':
        expressionValues[':stats'].responses = Math.max(0, currentStats.responses + (1 * multiplier));
        break;
      case 'rating':
        // For ratings, we need to recalculate the average
        if (action === 'increment') {
          expressionValues[':stats'].totalRatings = (currentStats.totalRatings || 0) + 1;
        } else {
          expressionValues[':stats'].totalRatings = Math.max(0, (currentStats.totalRatings || 0) - 1);
        }
        // Recalculate average rating
        await recalculateAverageRating(videoId, expressionValues[':stats']);
        break;
    }

    await docClient.send(new UpdateCommand({
      TableName: VIDEOS_TABLE,
      Key: { id: videoId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionValues
    }));

  } catch (error) {
    console.error('Error updating video stats:', error);
  }
}

async function recalculateAverageRating(videoId: string, stats: any) {
  try {
    // Get all ratings for this video
    const ratingsResult = await docClient.send(new ScanCommand({
      TableName: INTERACTIONS_TABLE,
      FilterExpression: 'videoId = :videoId AND #type = :type AND attribute_not_exists(deleted)',
      ExpressionAttributeValues: {
        ':videoId': videoId,
        ':type': 'rating'
      },
      ExpressionAttributeNames: {
        '#type': 'type'
      }
    }));

    if (ratingsResult.Items && ratingsResult.Items.length > 0) {
      const totalRating = ratingsResult.Items.reduce((sum, item) => sum + (item.rating || 0), 0);
      stats.averageRating = totalRating / ratingsResult.Items.length;
    } else {
      stats.averageRating = 0;
    }
  } catch (error) {
    console.error('Error recalculating average rating:', error);
  }
}
