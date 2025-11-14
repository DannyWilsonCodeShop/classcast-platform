import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COMMUNITY_POSTS_TABLE = 'classcast-community-posts';
const USERS_TABLE = 'classcast-users';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching community stats...');
    
    // Get current date and one week ago
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Fetch all community posts
    let totalPosts = 0;
    let postsThisWeek = 0;
    
    try {
      const postsResult = await docClient.send(new ScanCommand({
        TableName: COMMUNITY_POSTS_TABLE,
        Limit: 1000 // Get a large sample
      }));
      
      const posts = postsResult.Items || [];
      totalPosts = posts.length;
      
      // Count posts from this week
      postsThisWeek = posts.filter((post: any) => {
        const postDate = new Date(post.timestamp || post.createdAt || 0);
        return postDate >= oneWeekAgo;
      }).length;
      
      console.log('📊 Posts stats:', { totalPosts, postsThisWeek });
    } catch (error) {
      console.warn('📊 Could not fetch posts stats:', error);
    }
    
    // Fetch all users to count active users
    let activeUsers = 0;
    let onlineNow = 0;
    
    try {
      const usersResult = await docClient.send(new ScanCommand({
        TableName: USERS_TABLE,
        Limit: 1000 // Get a large sample
      }));
      
      const users = usersResult.Items || [];
      activeUsers = users.length;
      
      // Count "online" users (users who have been active in the last 30 minutes)
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      onlineNow = users.filter((user: any) => {
        const lastSeen = new Date(user.lastSeen || user.updatedAt || 0);
        return lastSeen >= thirtyMinutesAgo;
      }).length;
      
      console.log('📊 Users stats:', { activeUsers, onlineNow });
    } catch (error) {
      console.warn('📊 Could not fetch users stats:', error);
    }
    
    const stats = {
      totalPosts,
      activeUsers,
      postsThisWeek,
      onlineNow
    };
    
    console.log('📊 Final community stats:', stats);
    return NextResponse.json(stats);
    
  } catch (error) {
    console.error('Error fetching community stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch community stats',
        stats: {
          totalPosts: 0,
          activeUsers: 0,
          postsThisWeek: 0,
          onlineNow: 0
        }
      },
      { status: 500 }
    );
  }
}
