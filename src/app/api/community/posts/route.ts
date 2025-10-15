import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'classcast-users';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params to filter by enrolled courses
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    let enrolledCourseIds = [];
    
    // If userId is provided, get their enrolled courses
    if (userId) {
      try {
        const coursesResult = await docClient.send(new ScanCommand({
          TableName: 'classcast-courses',
          FilterExpression: 'contains(enrollment.students, :userId)',
          ExpressionAttributeValues: {
            ':userId': userId
          }
        }));
        
        enrolledCourseIds = (coursesResult.Items || []).map(course => course.courseId);
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        // If we can't get enrolled courses, return empty array
        return NextResponse.json([]);
      }
    }

    // Try to fetch from community posts table
    try {
      let scanCommand;
      
      if (enrolledCourseIds.length > 0) {
        // Get all posts and filter by enrolled courses in application logic
        scanCommand = new ScanCommand({
          TableName: 'classcast-community-posts',
          Limit: 100 // Get more posts to filter
        });
      } else {
        // If no userId or no enrolled courses, get all posts
        scanCommand = new ScanCommand({
          TableName: 'classcast-community-posts',
          Limit: 20
        });
      }

      const result = await docClient.send(scanCommand);
      let posts = result.Items || [];

      // Filter posts by enrolled courses if userId is provided
      if (enrolledCourseIds.length > 0) {
        posts = posts.filter((post: any) => {
          // Include posts from enrolled courses or posts without courseId (global posts)
          return !post.courseId || enrolledCourseIds.includes(post.courseId);
        });
      }

      // Sort by timestamp (most recent first)
      posts.sort((a: any, b: any) => {
        const aTime = new Date(a.timestamp || a.createdAt || 0).getTime();
        const bTime = new Date(b.timestamp || b.createdAt || 0).getTime();
        return bTime - aTime;
      });

      // Limit to 20 posts after filtering
      posts = posts.slice(0, 20);

      // Enrich posts with user information
      const enrichedPosts = await Promise.all(
        posts.map(async (post: any) => {
          try {
            console.log('🔍 Enriching post with userId:', post.userId);
            const userResult = await docClient.send(new GetCommand({
              TableName: USERS_TABLE,
              Key: { userId: post.userId }
            }));

            const user = userResult.Item;
            console.log('👤 User data fetched:', user ? `${user.firstName} ${user.lastName}` : 'Not found');
            
            const authorName = user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user?.email || 'Unknown User';
            
            // Get avatar from multiple possible sources - only use real S3 URLs
            const avatar = user?.avatar || user?.profile?.avatar || user?.profilePicture || user?.profileImage || undefined;
            console.log('🖼️ Avatar URL:', avatar || 'No avatar found');
            
            return {
              id: post.postId || post.id,
              title: post.title,
              content: post.content,
              author: authorName,
              authorAvatar: avatar,
              authorRole: user?.role || 'student',
              isAnnouncement: post.isAnnouncement || false,
              likes: post.likes || 0,
              comments: post.comments || 0,
              timestamp: post.timestamp || post.createdAt || new Date().toISOString(),
              reactions: post.reactions || {
                like: 0,
                love: 0,
                helpful: 0,
                celebrate: 0
              },
              isLiked: post.isLiked || false,
              isBookmarked: post.isBookmarked || false,
              tags: post.tags || [],
              trending: post.trending || false,
              pinned: post.pinned || false
            };
          } catch (error) {
            console.error(`Error enriching post ${post.id} with user data:`, error);
            return {
              id: post.postId || post.id,
              title: post.title,
              content: post.content,
              author: 'Unknown User',
              authorAvatar: undefined,
              authorRole: 'student',
              isAnnouncement: post.isAnnouncement || false,
              likes: post.likes || 0,
              comments: post.comments || 0,
              timestamp: post.timestamp || post.createdAt || new Date().toISOString(),
              reactions: post.reactions || {
                like: 0,
                love: 0,
                helpful: 0,
                celebrate: 0
              },
              isLiked: post.isLiked || false,
              isBookmarked: post.isBookmarked || false,
              tags: post.tags || [],
              trending: post.trending || false,
              pinned: post.pinned || false
            };
          }
        })
      );

      return NextResponse.json({
        success: true,
        posts: enrichedPosts,
        count: enrichedPosts.length
      });
    } catch (tableError: any) {
      if (tableError.name === 'ResourceNotFoundException') {
        // Community posts table doesn't exist yet, return empty array
        return NextResponse.json({
          success: true,
          posts: [],
          count: 0
        });
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
    const { title, content, userId, isAnnouncement = false, courseId } = body;

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
      courseId: courseId || null, // Include courseId if provided
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