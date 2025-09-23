import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBService } from '@/lib/dynamodb';

const dynamodbService = new DynamoDBService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Get student's video submissions
    const videosResult = await dynamodbService.query({
      TableName: 'classcast-submissions',
      IndexName: 'student-index',
      KeyConditionExpression: 'studentId = :studentId',
      ExpressionAttributeValues: {
        ':studentId': studentId
      }
    });

    // Get student's interactions (likes given)
    const likesGivenResult = await dynamodbService.query({
      TableName: 'classcast-peer-interactions',
      IndexName: 'user-index',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'action = :action',
      ExpressionAttributeValues: {
        ':userId': studentId,
        ':action': 'like'
      }
    });

    // Get student's ratings given
    const ratingsGivenResult = await dynamodbService.query({
      TableName: 'classcast-peer-interactions',
      IndexName: 'user-index',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'action = :action',
      ExpressionAttributeValues: {
        ':userId': studentId,
        ':action': 'rate'
      }
    });

    // Get interactions on student's videos (likes received)
    const videos = videosResult.Items || [];
    const videoIds = videos.map(v => v.id);
    
    let totalLikesReceived = 0;
    let totalRatingsReceived = 0;
    let ratingSum = 0;
    const ratingDistribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };

    for (const videoId of videoIds) {
      const likesResult = await dynamodbService.query({
        TableName: 'classcast-peer-interactions',
        IndexName: 'video-index',
        KeyConditionExpression: 'videoId = :videoId',
        FilterExpression: 'action = :action',
        ExpressionAttributeValues: {
          ':videoId': videoId,
          ':action': 'like'
        }
      });

      const ratingsResult = await dynamodbService.query({
        TableName: 'classcast-peer-interactions',
        IndexName: 'video-index',
        KeyConditionExpression: 'videoId = :videoId',
        FilterExpression: 'action = :action',
        ExpressionAttributeValues: {
          ':videoId': videoId,
          ':action': 'rate'
        }
      });

      totalLikesReceived += likesResult.Count || 0;
      totalRatingsReceived += ratingsResult.Count || 0;

      // Process ratings
      (ratingsResult.Items || []).forEach(rating => {
        const ratingValue = rating.rating;
        if (ratingValue >= 1 && ratingValue <= 5) {
          ratingDistribution[ratingValue.toString() as keyof typeof ratingDistribution]++;
          ratingSum += ratingValue;
        }
      });
    }

    // Get student's responses given
    const responsesResult = await dynamodbService.query({
      TableName: 'classcast-peer-responses',
      IndexName: 'reviewer-index',
      KeyConditionExpression: 'reviewerId = :reviewerId',
      ExpressionAttributeValues: {
        ':reviewerId': studentId
      }
    });

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

    // Get recent activity (mock for now)
    const recentActivity = [
      {
        type: 'video_submitted',
        description: `Submitted video: "${videos[0]?.title || 'Latest Video'}"`,
        timestamp: videos[0]?.submittedAt || new Date().toISOString(),
        assignmentTitle: videos[0]?.assignmentTitle
      }
    ];

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
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      totalResponsesGiven,
      totalLikesGiven,
      totalRatingsGiven,
      peerEngagementScore,
      topRatedVideos,
      recentActivity,
      achievements
    };

    // Format the response to match what the component expects
    const stats = {
      totalLikes: peerProfile.totalLikesReceived,
      averageRating: peerProfile.averageRating,
      totalVideos: peerProfile.totalVideosSubmitted,
      totalResponses: peerProfile.totalResponsesGiven,
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
