import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';
const ASSIGNMENTS_TABLE = 'classcast-assignments';
const COURSES_TABLE = 'classcast-courses';
const PEER_RESPONSES_TABLE = 'classcast-peer-responses';
const USERS_TABLE = 'classcast-users';
const NOTIFICATIONS_TABLE = 'classcast-notifications';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('role'); // 'student' or 'instructor'

    if (!userId || !userRole) {
      return NextResponse.json(
        { success: false, error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    console.log('Fetching notifications for:', { userId, userRole });

    const notifications = [];

    try {
      // Fetch recent peer responses to user's videos
      const peerResponsesResponse = await docClient.send(new ScanCommand({
        TableName: PEER_RESPONSES_TABLE,
        FilterExpression: 'videoOwnerId = :userId AND createdAt > :recentTime',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':recentTime': new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
        },
        Limit: 10
      }));

      if (peerResponsesResponse.Items) {
        peerResponsesResponse.Items.forEach((response: any) => {
          notifications.push({
            id: `peer_response_${response.responseId}`,
            type: 'peer_response',
            title: 'New Peer Response',
            message: `${response.reviewerName} responded to your video: "${response.content.substring(0, 50)}${response.content.length > 50 ? '...' : ''}"`,
            url: `/student/peer-reviews?videoId=${response.videoId}`,
            timestamp: response.createdAt,
            priority: 'medium',
            senderName: response.reviewerName
          });
        });
      }

      // Fetch recent likes on user's videos (only from last 7 days)
      const submissionsResponse = await docClient.send(new ScanCommand({
        TableName: SUBMISSIONS_TABLE,
        FilterExpression: 'studentId = :userId AND likes > :zero AND updatedAt > :recentTime',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':zero': 0,
          ':recentTime': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
        },
        Limit: 10
      }));

      if (submissionsResponse.Items) {
        submissionsResponse.Items.forEach((submission: any) => {
          if (submission.likes > 0) {
            notifications.push({
              id: `likes_${submission.submissionId}`,
              type: 'peer_review',
              title: 'Video Liked',
              message: `Your video "${submission.videoTitle}" received ${submission.likes} like${submission.likes > 1 ? 's' : ''}`,
              url: `/student/peer-reviews?videoId=${submission.submissionId}`,
              timestamp: submission.updatedAt || submission.submittedAt,
              priority: 'low'
            });
          }
        });
      }

      // Fetch recent grades
      const gradedSubmissionsResponse = await docClient.send(new ScanCommand({
        TableName: SUBMISSIONS_TABLE,
        FilterExpression: 'studentId = :userId AND grade IS NOT NULL AND updatedAt > :recentTime',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':recentTime': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
        },
        Limit: 10
      }));

      if (gradedSubmissionsResponse.Items) {
        gradedSubmissionsResponse.Items.forEach((submission: any) => {
          notifications.push({
            id: `grade_${submission.submissionId}`,
            type: 'graded',
            title: 'Grade Received',
            message: `You received ${submission.grade}/${submission.maxScore || 100} for "${submission.videoTitle}"`,
            url: `/student/submissions`,
            timestamp: submission.updatedAt,
            priority: 'high'
          });
        });
      }

      // Fetch new assignments
      const assignmentsResponse = await docClient.send(new ScanCommand({
        TableName: ASSIGNMENTS_TABLE,
        FilterExpression: 'createdAt > :recentTime',
        ExpressionAttributeValues: {
          ':recentTime': new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // Last 3 days
        },
        Limit: 5
      }));

      if (assignmentsResponse.Items) {
        assignmentsResponse.Items.forEach((assignment: any) => {
          notifications.push({
            id: `assignment_${assignment.assignmentId}`,
            type: 'new_assignment',
            title: 'New Assignment',
            message: `"${assignment.title}" has been posted. Due: ${new Date(assignment.dueDate).toLocaleDateString()}`,
            url: `/student/assignments/${assignment.assignmentId}`,
            timestamp: assignment.createdAt,
            priority: 'medium'
          });
        });
      }

    } catch (dbError) {
      console.error('Database error fetching notifications:', dbError);
      // Return empty notifications on database error
    }

    // Sort notifications by timestamp (newest first)
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    console.log('Generated notifications:', notifications.length);

    return NextResponse.json({
      success: true,
      notifications: notifications.slice(0, 20), // Limit to 20 most recent
      count: notifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}