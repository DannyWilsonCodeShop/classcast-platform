import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const VIDEOS_TABLE = 'classcast-videos';
const USERS_TABLE = 'classcast-users';

// GET /api/videos - Get all videos with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build filter expression
    let filterExpression = 'attribute_exists(id)';
    let expressionAttributeValues: any = {};

    if (courseId) {
      filterExpression += ' AND courseId = :courseId';
      expressionAttributeValues[':courseId'] = courseId;
    }

    if (userId) {
      filterExpression += ' AND userId = :userId';
      expressionAttributeValues[':userId'] = userId;
    }

    const command = new ScanCommand({
      TableName: VIDEOS_TABLE,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
      Limit: limit,
    });

    const result = await docClient.send(command);
    let videos = result.Items || [];

    // Sort videos
    videos.sort((a: any, b: any) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    // Enrich videos with user information
    const enrichedVideos = await Promise.all(
      videos.map(async (video: any) => {
        try {
          // Get user information
          const userResult = await docClient.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { userId: video.userId }
          }));

          const user = userResult.Item;
          
          return {
            ...video,
            userName: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Unknown User',
            userAvatar: user?.avatar || '/api/placeholder/40/40',
            courseName: video.courseName || 'Unknown Course'
          };
        } catch (error) {
          console.error(`Error enriching video ${video.id} with user data:`, error);
          return {
            ...video,
            userName: 'Unknown User',
            userAvatar: '/api/placeholder/40/40',
            courseName: video.courseName || 'Unknown Course'
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      videos: enrichedVideos,
      count: enrichedVideos.length
    });

  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch videos'
    }, { status: 500 });
  }
}

// POST /api/videos - Create a new video
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      description, 
      videoUrl, 
      thumbnail, 
      duration, 
      courseId, 
      userId, 
      courseName 
    } = body;

    if (!title || !videoUrl || !courseId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: title, videoUrl, courseId, userId'
      }, { status: 400 });
    }

    const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const videoData = {
      id: videoId,
      title,
      description: description || '',
      videoUrl,
      thumbnail: thumbnail || '/api/placeholder/300/200',
      duration: duration || 0,
      courseId,
      userId,
      courseName: courseName || 'Unknown Course',
      stats: {
        views: 0,
        likes: 0,
        comments: 0,
        responses: 0,
        averageRating: 0,
        totalRatings: 0
      },
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: VIDEOS_TABLE,
      Item: videoData
    }));

    return NextResponse.json({
      success: true,
      video: videoData
    });

  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create video'
    }, { status: 500 });
  }
}
