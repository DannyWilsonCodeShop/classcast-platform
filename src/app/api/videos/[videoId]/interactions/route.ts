import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { CreateCommentRequest, CreateResponseRequest, CreateRatingRequest, LikeVideoRequest } from '@/types/video-interactions';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const INTERACTIONS_TABLE = 'classcast-video-interactions';
const VIDEOS_TABLE = 'classcast-submissions';
const SUBMISSIONS_TABLE = 'classcast-submissions';
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

    console.log('🔍 Fetching interactions for video:', { videoId, type });

    // Use QueryCommand with GSI for much better performance
    let keyConditionExpression = 'videoId = :videoId';
    let filterExpression = 'attribute_not_exists(deleted)';
    let expressionValues: any = { ':videoId': videoId };
    let expressionAttributeNames: any = {};

    if (type) {
      filterExpression += ' AND #type = :type';
      expressionValues[':type'] = type;
      expressionAttributeNames['#type'] = 'type';
    }

    const command = new QueryCommand({
      TableName: INTERACTIONS_TABLE,
      IndexName: 'videoId-index', // Use the new GSI
      KeyConditionExpression: keyConditionExpression,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionValues,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
    });

    const result = await docClient.send(command);
    
    console.log('✅ Interactions fetched successfully:', { videoId, count: result.Count });
    
    return NextResponse.json({
      success: true,
      interactions: result.Items || [],
      count: result.Count || 0
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching video interactions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch video interactions',
      details: error instanceof Error ? error.message : 'Unknown error'
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

    console.log('🚀 Creating interaction:', { videoId, type, userId, userName });

    if (!type || !userId || !userName) {
      console.error('❌ Missing required fields:', { type, userId, userName });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: type, userId, and userName are required'
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
        // Check if user already liked this video using GSI
        const existingLike = await docClient.send(new QueryCommand({
          TableName: INTERACTIONS_TABLE,
          IndexName: 'videoId-index',
          KeyConditionExpression: 'videoId = :videoId',
          FilterExpression: 'userId = :userId AND #type = :type',
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
        // Derive content creator ID from the video submission if not provided
        let contentCreatorId = body.contentCreatorId as string | undefined;
        if (!contentCreatorId) {
          try {
            let getResult = await docClient.send(new GetCommand({
              TableName: VIDEOS_TABLE,
              Key: { submissionId: videoId }
            }));
            if (!getResult.Item) {
              getResult = await docClient.send(new GetCommand({
                TableName: VIDEOS_TABLE,
                Key: { id: videoId }
              }));
            }
            if (getResult.Item) {
              // Commonly stored as studentId/authorId on submissions
              contentCreatorId = getResult.Item.studentId || getResult.Item.authorId || getResult.Item.userId;
            }
          } catch (e) {
            console.warn('Could not derive contentCreatorId for rating', e);
          }
        }
        if (!contentCreatorId) {
          return NextResponse.json({
            success: false,
            error: 'Content creator could not be determined'
          }, { status: 400 });
        }
        interactionData.rating = body.rating;
        interactionData.contentCreatorId = contentCreatorId;
        interactionData.comment = body.comment || '';
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid interaction type'
        }, { status: 400 });
    }

    // Save interaction
    console.log('💾 Saving interaction to DynamoDB:', interactionData);
    await docClient.send(new PutCommand({
      TableName: INTERACTIONS_TABLE,
      Item: interactionData
    }));

    // Create notification for video owner (except for likes - handled in separate API)
    if (type === 'comment' || type === 'response' || type === 'rating') {
      try {
        // Get video owner information
        const videoResult = await docClient.send(new GetCommand({
          TableName: SUBMISSIONS_TABLE,
          Key: { submissionId: videoId }
        }));

        if (videoResult.Item && videoResult.Item.studentId !== userId) {
          let notificationTitle = '';
          let notificationMessage = '';
          let notificationType = '';

          switch (type) {
            case 'comment':
              notificationTitle = '💬 New comment on your video';
              notificationMessage = `${userName} commented: "${body.content.substring(0, 50)}${body.content.length > 50 ? '...' : ''}"`;
              notificationType = 'video_comment';
              break;
            case 'response':
              notificationTitle = '📝 New response to your video';
              notificationMessage = `${userName} responded to your video: "${body.content.substring(0, 50)}${body.content.length > 50 ? '...' : ''}"`;
              notificationType = 'video_response';
              break;
            case 'rating':
              notificationTitle = '⭐ Your video was rated';
              notificationMessage = `${userName} gave your video ${body.rating} star${body.rating > 1 ? 's' : ''}${body.comment ? `: "${body.comment.substring(0, 50)}${body.comment.length > 50 ? '...' : ''}"` : ''}`;
              notificationType = 'video_rating';
              break;
          }

          const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientId: videoResult.Item.studentId,
              senderId: userId,
              senderName: userName,
              type: notificationType,
              title: notificationTitle,
              message: notificationMessage,
              relatedId: videoId,
              relatedType: 'video',
              priority: type === 'rating' ? 'medium' : 'low',
              actionUrl: `/student/peer-reviews?videoId=${videoId}`
            })
          });

          if (notificationResponse.ok) {
            console.log(`✅ ${type} notification created`);
          } else {
            console.error(`❌ Failed to create ${type} notification`);
          }
        }
      } catch (notifError) {
        console.error(`❌ Error creating ${type} notification:`, notifError);
      }
    }

    // Update video stats
    console.log('📊 Updating video stats...');
    const stats = await updateVideoStats(videoId, type, 'increment');

    // For ratings, also calculate and return the average using GSI
    let averageRating = null;
    if (type === 'rating') {
      try {
        const ratingsResult = await docClient.send(new QueryCommand({
          TableName: INTERACTIONS_TABLE,
          IndexName: 'videoId-index',
          KeyConditionExpression: 'videoId = :videoId',
          FilterExpression: '#type = :type AND attribute_not_exists(deleted)',
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
          averageRating = totalRating / ratingsResult.Items.length;
        }
      } catch (error) {
        console.error('Error calculating average rating:', error);
      }
    }

    console.log('✅ Interaction created successfully:', { interactionId, type, averageRating });

    return NextResponse.json({
      success: true,
      interaction: interactionData,
      averageRating: averageRating
    });

  } catch (error) {
    console.error('❌ Error creating video interaction:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create video interaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/videos/[videoId]/interactions - Remove an interaction (like/unlike)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
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

    // Find and delete the interaction using GSI
    const scanResult = await docClient.send(new QueryCommand({
      TableName: INTERACTIONS_TABLE,
      IndexName: 'videoId-index',
      KeyConditionExpression: 'videoId = :videoId',
      FilterExpression: 'userId = :userId AND #type = :type',
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
    console.log('📊 Updating video stats:', { videoId, type, action });
    
    // Try to get the video from submissions table
    let videoResult;
    let actualKey: { submissionId: string } | { id: string } = { submissionId: videoId };
    
    try {
      videoResult = await docClient.send(new GetCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: { submissionId: videoId }
      }));
      actualKey = { submissionId: videoId };
      console.log('✅ Found video with submissionId key');
    } catch (error) {
      console.log('⚠️ Trying with id key:', videoId);
      try {
        videoResult = await docClient.send(new GetCommand({
          TableName: SUBMISSIONS_TABLE,
          Key: { id: videoId }
        }));
        actualKey = { id: videoId };
        console.log('✅ Found video with id key');
      } catch (error2) {
        console.error('❌ Video not found with either key:', videoId);
        return;
      }
    }

    if (!videoResult.Item) {
      console.error('❌ Video not found in database:', videoId);
      return;
    }

    const submission = videoResult.Item;
    // Get current stats from individual fields or stats object
    const currentLikes = submission.likes || submission.stats?.likes || 0;
    const currentComments = submission.commentCount || submission.stats?.comments || 0;

    const multiplier = action === 'increment' ? 1 : -1;

    // Build update expression dynamically based on type
    let updateExpression = 'SET updatedAt = :updatedAt';
    let expressionValues: any = {
      ':updatedAt': new Date().toISOString()
    };

    switch (type) {
      case 'like':
        expressionValues[':likes'] = Math.max(0, currentLikes + (1 * multiplier));
        updateExpression += ', likes = :likes';
        console.log('👍 Updating likes:', { current: currentLikes, new: expressionValues[':likes'] });
        break;
      case 'comment':
        expressionValues[':comments'] = Math.max(0, currentComments + (1 * multiplier));
        updateExpression += ', commentCount = :comments';
        console.log('💬 Updating comments:', { current: currentComments, new: expressionValues[':comments'] });
        break;
      case 'rating':
        // Ratings don't directly update video stats, they're stored in interactions
        // Just update the timestamp
        console.log('⭐ Rating interaction - only updating timestamp');
        break;
    }

    // Only update if there are fields to update
    if (updateExpression !== 'SET updatedAt = :updatedAt') {
      await docClient.send(new UpdateCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: actualKey,
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionValues
      }));
      console.log('✅ Video stats updated successfully');
    } else {
      console.log('ℹ️ No stats to update, only timestamp updated');
    }

  } catch (error) {
    console.error('❌ Error updating video stats:', error);
  }
}

async function recalculateAverageRating(videoId: string, stats: any) {
  try {
    // Get all ratings for this video using GSI
    const ratingsResult = await docClient.send(new QueryCommand({
      TableName: INTERACTIONS_TABLE,
      IndexName: 'videoId-index',
      KeyConditionExpression: 'videoId = :videoId',
      FilterExpression: '#type = :type AND attribute_not_exists(deleted)',
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
