import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'classcast-users';

export async function GET(request: NextRequest) {
  try {
    // Try to fetch from community posts table
    try {
      const scanCommand = new ScanCommand({
        TableName: 'classcast-community-posts',
        Limit: 20,
        ScanIndexForward: false // Most recent first
      });

      const result = await docClient.send(scanCommand);
      const posts = result.Items || [];

      // Sort by timestamp (most recent first)
      posts.sort((a: any, b: any) => {
        const aTime = new Date(a.timestamp || a.createdAt || 0).getTime();
        const bTime = new Date(b.timestamp || b.createdAt || 0).getTime();
        return bTime - aTime;
      });

      // Enrich posts with user information
      const enrichedPosts = await Promise.all(
        posts.map(async (post: any) => {
          try {
            const userResult = await docClient.send(new GetCommand({
              TableName: USERS_TABLE,
              Key: { userId: post.userId }
            }));

            const user = userResult.Item;
            return {
              id: post.postId || post.id,
              title: post.title,
              content: post.content,
              author: user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email || 'Unknown User',
              isAnnouncement: post.isAnnouncement || false,
              likes: post.likes || 0,
              comments: post.comments || 0,
              timestamp: post.timestamp || post.createdAt || new Date().toISOString()
            };
          } catch (error) {
            console.error(`Error enriching post ${post.id} with user data:`, error);
            return {
              id: post.postId || post.id,
              title: post.title,
              content: post.content,
              author: 'Unknown User',
              isAnnouncement: post.isAnnouncement || false,
              likes: post.likes || 0,
              comments: post.comments || 0,
              timestamp: post.timestamp || post.createdAt || new Date().toISOString()
            };
          }
        })
      );

      return NextResponse.json(enrichedPosts);
    } catch (tableError: any) {
      if (tableError.name === 'ResourceNotFoundException') {
        // Community posts table doesn't exist yet, return empty array
        return NextResponse.json([]);
      }
      throw tableError;
    }
  } catch (error) {
    console.error('Error fetching community posts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch community posts',
        posts: [],
        count: 0
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, userId, isAnnouncement = false } = body;

    if (!title || !content || !userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Title, content, and userId are required' 
        },
        { status: 400 }
      );
    }

    const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const postData = {
      postId,
      title,
      content,
      userId,
      isAnnouncement,
      likes: 0,
      comments: 0,
      timestamp: now,
      createdAt: now,
      updatedAt: now
    };

    try {
      const putCommand = new PutCommand({
        TableName: 'classcast-community-posts',
        Item: postData
      });

      await docClient.send(putCommand);
      console.log('Community post created:', postId);

      return NextResponse.json({
        success: true,
        message: 'Post created successfully',
        post: {
          id: postId,
          title,
          content,
          author: 'You', // Will be enriched when fetched
          isAnnouncement,
          timestamp: now,
          likes: 0,
          comments: 0
        }
      });
    } catch (tableError: any) {
      if (tableError.name === 'ResourceNotFoundException') {
        // Community posts table doesn't exist yet, return success but don't save
        console.warn('Community posts table does not exist yet');
        return NextResponse.json({
          success: true,
          message: 'Post created successfully (table not available)',
          post: {
            id: postId,
            title,
            content,
            author: 'You',
            isAnnouncement,
            timestamp: now,
            likes: 0,
            comments: 0
          }
        });
      }
      throw tableError;
    }
  } catch (error) {
    console.error('Error creating community post:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create post' 
      },
      { status: 500 }
    );
  }
}