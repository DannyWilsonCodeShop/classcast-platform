import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';
const COMMUNITY_POSTS_TABLE = 'classcast-community-posts';
const COMMUNITY_COMMENTS_TABLE = 'classcast-community-comments';
const PEER_RESPONSES_TABLE = 'classcast-peer-responses';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching user statistics for:', userId);

    // Initialize stats object
    const stats = {
      videoStats: {
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalRatings: 0,
        averageRating: 0,
        totalRatingSum: 0
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
        averageResponseLength: 0,
        totalResponseWords: 0
      },
      engagementStats: {
        totalInteractions: 0,
        totalLikesReceived: 0,
        totalCommentsReceived: 0,
        totalViewsReceived: 0,
        totalReactionsReceived: 0
      }
    };

    // 1. Get video submission statistics
    try {
      const submissionsResult = await docClient.send(new ScanCommand({
        TableName: SUBMISSIONS_TABLE,
        FilterExpression: 'studentId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }));

      if (submissionsResult.Items) {
        const submissions = submissionsResult.Items;
        stats.videoStats.totalVideos = submissions.length;
        
        submissions.forEach(submission => {
          stats.videoStats.totalViews += submission.views || 0;
          stats.videoStats.totalLikes += submission.likes || 0;
          stats.videoStats.totalComments += (submission.comments?.length || 0);
          stats.videoStats.totalRatings += submission.ratings || 0;
          stats.videoStats.totalRatingSum += (submission.averageRating || 0) * (submission.ratings || 0);
        });

        if (stats.videoStats.totalRatings > 0) {
          stats.videoStats.averageRating = Math.round((stats.videoStats.totalRatingSum / stats.videoStats.totalRatings) * 10) / 10;
        }
      }
    } catch (error) {
      console.error('Error fetching video stats:', error);
    }

    // 2. Get community post statistics
    try {
      const postsResult = await docClient.send(new ScanCommand({
        TableName: COMMUNITY_POSTS_TABLE,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }));

      if (postsResult.Items) {
        const posts = postsResult.Items;
        stats.communityStats.totalPosts = posts.length;
        
        posts.forEach(post => {
          stats.communityStats.totalPostLikes += post.likes || 0;
          stats.communityStats.totalPostComments += post.comments || 0;
          
          // Count reactions
          if (post.reactions) {
            Object.values(post.reactions).forEach(count => {
              stats.communityStats.totalPostReactions += count || 0;
            });
          }
        });
      }
    } catch (error) {
      console.error('Error fetching community post stats:', error);
    }

    // 3. Get community comment statistics
    try {
      const commentsResult = await docClient.send(new ScanCommand({
        TableName: COMMUNITY_COMMENTS_TABLE,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }));

      if (commentsResult.Items) {
        const comments = commentsResult.Items;
        stats.communityStats.totalComments = comments.length;
        
        comments.forEach(comment => {
          stats.communityStats.totalCommentLikes += comment.likes || 0;
        });
      }
    } catch (error) {
      console.error('Error fetching community comment stats:', error);
    }

    // 4. Get peer review response statistics
    try {
      const responsesResult = await docClient.send(new ScanCommand({
        TableName: PEER_RESPONSES_TABLE,
        FilterExpression: 'reviewerId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }));

      if (responsesResult.Items) {
        const responses = responsesResult.Items;
        stats.peerReviewStats.totalResponses = responses.length;
        
        responses.forEach(response => {
          stats.peerReviewStats.totalResponseLikes += response.likes || 0;
          stats.peerReviewStats.totalResponseComments += (response.comments?.length || 0);
          
          // Count words in response
          const wordCount = response.content ? response.content.split(/\s+/).length : 0;
          stats.peerReviewStats.totalResponseWords += wordCount;
        });

        if (stats.peerReviewStats.totalResponses > 0) {
          stats.peerReviewStats.averageResponseLength = Math.round(stats.peerReviewStats.totalResponseWords / stats.peerReviewStats.totalResponses);
        }
      }
    } catch (error) {
      console.error('Error fetching peer review stats:', error);
    }

    // 5. Calculate total engagement statistics
    stats.engagementStats.totalLikesReceived = 
      stats.videoStats.totalLikes + 
      stats.communityStats.totalPostLikes + 
      stats.communityStats.totalCommentLikes + 
      stats.peerReviewStats.totalResponseLikes;

    stats.engagementStats.totalCommentsReceived = 
      stats.videoStats.totalComments + 
      stats.communityStats.totalPostComments + 
      stats.peerReviewStats.totalResponseComments;

    stats.engagementStats.totalViewsReceived = stats.videoStats.totalViews;
    stats.engagementStats.totalReactionsReceived = stats.communityStats.totalPostReactions;

    stats.engagementStats.totalInteractions = 
      stats.engagementStats.totalLikesReceived + 
      stats.engagementStats.totalCommentsReceived + 
      stats.engagementStats.totalViewsReceived + 
      stats.engagementStats.totalReactionsReceived;

    console.log('User statistics calculated:', stats);

    return NextResponse.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
}
