import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBService } from '@/lib/dynamodb';
import { SocialAnalytics, AnalyticsEvent } from '@/types/social-analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const dynamoDBService = new DynamoDBService();
    
    // Get user's social analytics
    const analytics = await dynamoDBService.getItem('classcast-social-analytics', { userId });
    
    if (!analytics) {
      // Return default analytics for new users
      const defaultAnalytics: SocialAnalytics = {
        userId,
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        averageRating: 0,
        totalRatings: 0,
        followers: 0,
        following: 0,
        engagementRate: 0,
        recentActivity: [],
        monthlyStats: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return NextResponse.json(defaultAnalytics);
    }

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching social analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const event: AnalyticsEvent = await request.json();
    
    if (!event.userId || !event.eventType) {
      return NextResponse.json(
        { error: 'User ID and event type are required' },
        { status: 400 }
      );
    }

    const dynamoDBService = new DynamoDBService();
    
    // Store the analytics event
    await dynamoDBService.putItem('classcast-analytics-events', {
      eventId: `${event.userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...event,
    });

    // Update user's social analytics
    await updateSocialAnalytics(event);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording analytics event:', error);
    return NextResponse.json(
      { error: 'Failed to record analytics event' },
      { status: 500 }
    );
  }
}

async function updateSocialAnalytics(event: AnalyticsEvent) {
  const dynamoDBService = new DynamoDBService();
  
  // Get current analytics
  const currentAnalytics = await dynamoDBService.getItem('classcast-social-analytics', { userId: event.userId });
  
  if (!currentAnalytics) {
    // Create new analytics record
    const newAnalytics: SocialAnalytics = {
      userId: event.userId,
      totalVideos: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      averageRating: 0,
      totalRatings: 0,
      followers: 0,
      following: 0,
      engagementRate: 0,
      recentActivity: [],
      monthlyStats: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await dynamoDBService.putItem('classcast-social-analytics', newAnalytics);
    return;
  }

  // Update analytics based on event type
  const updates: Partial<SocialAnalytics> = {
    updatedAt: new Date().toISOString(),
  };

  switch (event.eventType) {
    case 'view':
      updates.totalViews = (currentAnalytics.totalViews || 0) + 1;
      break;
    case 'like':
      updates.totalLikes = (currentAnalytics.totalLikes || 0) + 1;
      break;
    case 'unlike':
      updates.totalLikes = Math.max(0, (currentAnalytics.totalLikes || 0) - 1);
      break;
    case 'comment':
      updates.totalComments = (currentAnalytics.totalComments || 0) + 1;
      break;
    case 'share':
      updates.totalShares = (currentAnalytics.totalShares || 0) + 1;
      break;
    case 'rate':
      if (event.value) {
        const currentRating = currentAnalytics.averageRating || 0;
        const currentRatings = currentAnalytics.totalRatings || 0;
        const newTotalRatings = currentRatings + 1;
        const newAverageRating = ((currentRating * currentRatings) + event.value) / newTotalRatings;
        
        updates.averageRating = Math.round(newAverageRating * 10) / 10;
        updates.totalRatings = newTotalRatings;
      }
      break;
    case 'follow':
      updates.followers = (currentAnalytics.followers || 0) + 1;
      break;
    case 'unfollow':
      updates.followers = Math.max(0, (currentAnalytics.followers || 0) - 1);
      break;
  }

  // Calculate engagement rate
  const totalEngagement = (updates.totalLikes || currentAnalytics.totalLikes || 0) + 
                         (updates.totalComments || currentAnalytics.totalComments || 0) + 
                         (updates.totalShares || currentAnalytics.totalShares || 0);
  const totalViews = updates.totalViews || currentAnalytics.totalViews || 0;
  updates.engagementRate = totalViews > 0 ? Math.round((totalEngagement / totalViews) * 100) / 100 : 0;

  // Add to recent activity
  const activityItem = {
    id: `${event.userId}-${Date.now()}`,
    type: event.eventType as any,
    videoId: event.videoId,
    value: event.value || 1,
    timestamp: event.timestamp,
    description: getActivityDescription(event),
  };

  updates.recentActivity = [
    activityItem,
    ...(currentAnalytics.recentActivity || []).slice(0, 49) // Keep last 50 activities
  ];

  // Update the analytics record
  await dynamoDBService.updateItem('classcast-social-analytics', { userId: event.userId }, updates);
}

function getActivityDescription(event: AnalyticsEvent): string {
  switch (event.eventType) {
    case 'view':
      return 'Video viewed';
    case 'like':
      return 'Video liked';
    case 'unlike':
      return 'Video unliked';
    case 'comment':
      return 'Comment received';
    case 'share':
      return 'Video shared';
    case 'rate':
      return `Rated ${event.value}/5 stars`;
    case 'follow':
      return 'New follower';
    case 'unfollow':
      return 'Follower lost';
    default:
      return 'Activity recorded';
  }
}
