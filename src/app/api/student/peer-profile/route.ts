import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBService } from '@/lib/dynamodb';

const dynamodbService = new DynamoDBService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    console.log('📊 Fetching peer profile for studentId:', studentId);

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Get student's video submissions
    let videosResult;
    try {
      // Use Scan instead of Query since index may not exist
      videosResult = await dynamodbService.scan({
        TableName: 'classcast-submissions',
        FilterExpression: 'studentId = :studentId AND (#status <> :deletedStatus OR attribute_not_exists(#status))',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':studentId': studentId,
          ':deletedStatus': 'deleted'
        }
      });
      console.log('📹 Found submissions:', videosResult.Items?.length || 0);
    } catch (error) {
      console.error('Error scanning submissions:', error);
      videosResult = { Items: [] };
    }

    // Get student's interactions (likes given) - optional, may not exist
    let likesGivenResult = { Count: 0, Items: [] };
    let ratingsGivenResult = { Count: 0, Items: [] };
    
    try {
      likesGivenResult = await dynamodbService.query({
        TableName: 'classcast-peer-interactions',
        IndexName: 'user-index',
        KeyConditionExpression: 'userId = :userId',
        FilterExpression: 'action = :action',
        ExpressionAttributeValues: {
          ':userId': studentId,
          ':action': 'like'
        }
      });
    } catch (error) {
      console.log('⚠️ Could not query interactions (table may not exist)');
    }

    try {
      // Get student's ratings given
      ratingsGivenResult = await dynamodbService.query({
        TableName: 'classcast-peer-interactions',
        IndexName: 'user-index',
        KeyConditionExpression: 'userId = :userId',
        FilterExpression: 'action = :action',
        ExpressionAttributeValues: {
          ':userId': studentId,
          ':action': 'rate'
        }
      });
    } catch (error) {
      console.log('⚠️ Could not query ratings (table may not exist)');
    }

    // Get stats directly from video submissions (more reliable)
    const videos = videosResult.Items || [];
    
    let totalLikesReceived = 0;
    let totalRatingsReceived = 0;
    let totalViewsReceived = 0;
    let ratingSum = 0;
    const ratingDistribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };

    // Aggregate stats from submissions directly
    videos.forEach((video: any) => {
      // Add views from the submission itself
      totalViewsReceived += video.views || 0;
      
      // Add likes from the submission itself
      totalLikesReceived += video.likes || 0;
      
      // Add ratings from the submission itself
      if (video.rating && video.rating > 0) {
        totalRatingsReceived++;
        ratingSum += video.rating;
        const ratingValue = Math.round(video.rating);
        if (ratingValue >= 1 && ratingValue <= 5) {
          ratingDistribution[ratingValue.toString() as keyof typeof ratingDistribution]++;
        }
      }
    });

    // Get student's responses given - optional, may not exist
    let responsesResult = { Count: 0 };
    
    try {
      responsesResult = await dynamodbService.query({
        TableName: 'classcast-peer-responses',
        IndexName: 'reviewer-index',
        KeyConditionExpression: 'reviewerId = :reviewerId',
        ExpressionAttributeValues: {
          ':reviewerId': studentId
        }
      });
    } catch (error) {
      console.log('⚠️ Could not query peer responses (table may not exist)');
    }

    // Get Study Buddy connections
    let totalStudyBuddies = 0;
    let studyBuddyIds: string[] = [];
    
    try {
      const connectionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/connections?userId=${studentId}`);
      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json();
        if (connectionsData.success && connectionsData.connections) {
          // Count accepted connections
          const acceptedConnections = connectionsData.connections.filter((conn: any) => conn.status === 'accepted');
          totalStudyBuddies = acceptedConnections.length;
          
          // Extract Study Buddy user IDs
          acceptedConnections.forEach((conn: any) => {
            if (conn.requesterId === studentId) {
              studyBuddyIds.push(conn.requestedId);
            } else if (conn.requestedId === studentId) {
              studyBuddyIds.push(conn.requesterId);
            }
          });
        }
      }
    } catch (error) {
      console.log('⚠️ Could not fetch Study Buddy connections');
    }

    // Calculate peer engagement score
    const totalVideosSubmitted = videos.length;
    const totalResponsesGiven = responsesResult.Count || 0;
    const totalLikesGiven = likesGivenResult.Count || 0;
    const totalRatingsGiven = ratingsGivenResult.Count || 0;
    
    const peerEngagementScore = Math.min(100, Math.round(
      (totalLikesGiven * 2 + totalRatingsGiven * 3 + totalResponsesGiven * 5) / 10
    ));

    const averageRating = totalRatingsReceived > 0 ? ratingSum / totalRatingsReceived : 0;

    // Get top rated videos
    const topRatedVideos = videos
      .filter(v => v.rating && v.rating > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5)
      .map(v => ({
        videoId: v.id,
        title: v.title || 'Untitled Video',
        rating: v.rating || 0,
        likes: v.likes || 0,
        assignmentTitle: v.assignmentTitle || 'Assignment'
      }));

    // Get recent activity from actual data
    const recentActivity = videos.slice(0, 5).map(video => ({
      type: 'video_submitted',
      description: `Submitted video: "${video.title || 'Video Submission'}"`,
      timestamp: video.submittedAt || new Date().toISOString(),
      assignmentTitle: video.assignmentTitle
    }));

    // Generate achievements based on stats
    const achievements = [];
    if (totalResponsesGiven >= 10) {
      achievements.push({
        id: 'achievement_peer_helper',
        title: 'Peer Helper',
        description: 'Given 10+ helpful responses to peers',
        icon: '🤝',
        earnedAt: new Date().toISOString()
      });
    }
    if (averageRating >= 4.0) {
      achievements.push({
        id: 'achievement_highly_rated',
        title: 'Highly Rated',
        description: 'Achieved 4.0+ average rating',
        icon: '⭐',
        earnedAt: new Date().toISOString()
      });
    }
    if (totalLikesGiven >= 25) {
      achievements.push({
        id: 'achievement_engaged_learner',
        title: 'Engaged Learner',
        description: 'Liked 25+ peer videos',
        icon: '👍',
        earnedAt: new Date().toISOString()
      });
    }

    const peerProfile = {
      studentId,
      totalVideosSubmitted,
      totalLikesReceived,
      totalRatingsReceived,
      totalViewsReceived,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      totalResponsesGiven,
      totalLikesGiven,
      totalRatingsGiven,
      totalStudyBuddies,
      studyBuddyIds,
      peerEngagementScore,
      topRatedVideos,
      recentActivity,
      achievements
    };

    // Format the response to match what the component expects
    const stats = {
      videoStats: {
        totalVideos: peerProfile.totalVideosSubmitted,
        totalViews: peerProfile.totalViewsReceived,
        totalLikes: peerProfile.totalLikesReceived,
        averageRating: peerProfile.averageRating,
        totalRatings: peerProfile.totalRatingsReceived,
      },
      peerReviewStats: {
        totalResponses: peerProfile.totalResponsesGiven,
        averageResponseLength: 0, // Calculate from responses if needed
      },
      engagementStats: {
        totalLikesReceived: peerProfile.totalLikesReceived,
        totalViewsReceived: peerProfile.totalViewsReceived,
      },
      studyBuddyStats: {
        totalStudyBuddies: peerProfile.totalStudyBuddies,
        studyBuddyIds: peerProfile.studyBuddyIds,
      },
      recentActivity: peerProfile.recentActivity.map(activity => ({
        date: activity.timestamp,
        type: activity.type === 'video_submitted' ? 'video' : 'response',
        description: activity.description
      }))
    };

    return NextResponse.json({
      success: true,
      stats: stats,
      data: peerProfile // Keep the full data for other uses
    });
  } catch (error) {
    console.error('Error fetching student peer profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch peer profile' },
      { status: 500 }
    );
  }
}
