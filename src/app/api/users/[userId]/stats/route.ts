import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';
const PEER_RESPONSES_TABLE = 'classcast-peer-responses';
const VIDEO_INTERACTIONS_TABLE = 'classcast-peer-interactions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching stats for user:', userId);

    const stats = {
      videoStats: {
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalRatings: 0,
        averageRating: 0
      },
      communityStats: {
        totalPosts: 0,
        totalPostLikes: 0,
        totalPostComments: 0,
        totalPostReactions: 0,
        totalComments: 0,
        totalCommentLikes: 0
      },
      peerReviewStats: {
        totalResponses: 0,
        totalResponseLikes: 0,
        totalResponseComments: 0,
        averageResponseLength: 0
      },
      engagementStats: {
        totalInteractions: 0,
        totalLikesReceived: 0,
        totalCommentsReceived: 0,
        totalViewsReceived: 0,
        totalReactionsReceived: 0
      }
    };

    try {
      // Fetch user's video submissions
      const submissionsResponse = await docClient.send(new ScanCommand({
        TableName: SUBMISSIONS_TABLE,
        FilterExpression: 'studentId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }));

      if (submissionsResponse.Items) {
        // Filter out deleted submissions
        const userSubmissions = submissionsResponse.Items.filter(sub => 
          sub.status !== 'deleted' && !sub.hidden
        );
        stats.videoStats.totalVideos = userSubmissions.length;

        // Calculate total likes, views, and ratings from submissions
        let totalLikes = 0;
        let totalViews = 0;
        let totalRatings = 0;
        let ratingSum = 0;

        userSubmissions.forEach((submission: any) => {
          totalLikes += submission.likes || 0;
          totalViews += submission.views || 0;
          
          if (submission.rating && submission.rating > 0) {
            totalRatings++;
            ratingSum += submission.rating;
          }
        });

        stats.videoStats.totalLikes = totalLikes;
        stats.videoStats.totalViews = totalViews;
        stats.videoStats.totalRatings = totalRatings;
        stats.videoStats.averageRating = totalRatings > 0 ? ratingSum / totalRatings : 0;
        stats.engagementStats.totalLikesReceived = totalLikes;
        stats.engagementStats.totalViewsReceived = totalViews;
      }

      // Fetch user's peer responses
      const peerResponsesResponse = await docClient.send(new ScanCommand({
        TableName: PEER_RESPONSES_TABLE,
        FilterExpression: 'reviewerId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }));

      if (peerResponsesResponse.Items) {
        const userResponses = peerResponsesResponse.Items;
        stats.peerReviewStats.totalResponses = userResponses.length;

        // Calculate average response length
        let totalLength = 0;
        userResponses.forEach((response: any) => {
          totalLength += response.content ? response.content.length : 0;
        });
        stats.peerReviewStats.averageResponseLength = userResponses.length > 0 ? totalLength / userResponses.length : 0;
      }

      // Fetch interactions on user's videos by first getting their submission IDs
      let submissionIds: string[] = [];
      try {
        const subsForOwner = await docClient.send(new ScanCommand({
          TableName: SUBMISSIONS_TABLE,
          FilterExpression: 'studentId = :userId AND #status <> :deletedStatus AND attribute_not_exists(hidden)',
          ExpressionAttributeValues: { 
            ':userId': userId,
            ':deletedStatus': 'deleted'
          },
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ProjectionExpression: 'submissionId, id'
        }));
        submissionIds = (subsForOwner.Items || []).map((s: any) => s.submissionId || s.id).filter(Boolean);
      } catch {}

      if (submissionIds.length > 0) {
        // Scan interactions table and aggregate for the user's videos
        const allInteractionsResp = await docClient.send(new ScanCommand({
          TableName: VIDEO_INTERACTIONS_TABLE,
          ProjectionExpression: 'videoId, #type, rating',
          ExpressionAttributeNames: { '#type': 'type' }
        }));

        const interactions = (allInteractionsResp.Items || []).filter((it: any) => submissionIds.includes(it.videoId));

        let ratingsCount = 0;
        let ratingsSum = 0;

        interactions.forEach((interaction: any) => {
          if (interaction.type === 'like') {
            stats.engagementStats.totalLikesReceived++;
          } else if (interaction.type === 'comment') {
            stats.engagementStats.totalCommentsReceived++;
          } else if (interaction.type === 'rating') {
            stats.engagementStats.totalReactionsReceived++;
            if (typeof interaction.rating === 'number') {
              ratingsCount += 1;
              ratingsSum += interaction.rating;
            }
          }
        });

        // If submissions didn't have rating summary, use interactions-derived averages
        if (stats.videoStats.totalRatings === 0 && ratingsCount > 0) {
          stats.videoStats.totalRatings = ratingsCount;
          stats.videoStats.averageRating = ratingsSum / ratingsCount;
        }
      }

      // Calculate total interactions
      stats.engagementStats.totalInteractions = 
        stats.engagementStats.totalLikesReceived + 
        stats.engagementStats.totalCommentsReceived + 
        stats.engagementStats.totalViewsReceived + 
        stats.engagementStats.totalReactionsReceived;

    } catch (dbError) {
      console.error('Database error fetching user stats:', dbError);
      // Return default stats if database fails
    }

    console.log('Generated stats for user:', userId, stats);

    return NextResponse.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}